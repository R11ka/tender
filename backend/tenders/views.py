# tenders/views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import openpyxl
from datetime import datetime

from .models import Sheet, Position, Document, Comment, Lot, Supplier
from .serializers import (
    UserSerializer, SheetSerializer, PositionSerializer, PositionListSerializer,
    DocumentSerializer, CommentSerializer, LotSerializer, SupplierSerializer
)

# Кастомные permissions
class IsManager(BasePermission):
    """Полный доступ только для менеджеров"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'

class IsManagerOrReadOnly(BasePermission):
    """Менеджер может всё, наблюдатель - только чтение"""
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'manager'

User = get_user_model()

# Страницы для фронтенда
def index_page(request):
    return render(request, 'index.html')

def engineering_lists_page(request):
    return render(request, 'index.html')

def engineering_detail_page(request):
    return render(request, 'index.html')

def lots_page(request):
    return render(request, 'index.html')

def suppliers_page(request):
    return render(request, 'index.html')

def chats_page(request):
    return render(request, 'index.html')

def profile_page(request):
    return render(request, 'index.html')


class UserViewSet(viewsets.ModelViewSet):
    """Пользователи"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return []
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Получение и обновление текущего пользователя"""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Смена пароля"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({'error': 'Неверный текущий пароль'}, status=400)
        
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Пароль успешно изменен'})
    
    def create(self, request, *args, **kwargs):
        # Разрешаем создание пользователя без авторизации
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SheetViewSet(viewsets.ModelViewSet):
    """Инженерные листы"""
    serializer_class = SheetSerializer
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['uploaded_at', 'name']
    ordering = ['-uploaded_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Sheet.objects.filter(created_by=user)
        else:
            return Sheet.objects.all()
    
    @action(detail=False, methods=['post'], permission_classes=[IsManager])
    def upload(self, request):
        """Загрузка Excel/CSV файла"""
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Файл не предоставлен'}, status=400)
        
        # Проверка расширения файла
        filename = file.name.lower()
        if not (filename.endswith('.xlsx') or filename.endswith('.csv')):
            return Response({'error': 'Поддерживаются только файлы .xlsx и .csv'}, status=400)
        
        sheet = Sheet.objects.create(
            name=file.name,
            file=file,
            created_by=request.user
        )

        positions_created = 0
        errors = []
        
        try:
            if filename.endswith('.csv'):
                import csv
                import io
                text_file = io.TextIOWrapper(file, encoding='utf-8')
                reader = csv.reader(text_file)
                next(reader, None)  # Пропускаем заголовок
                
                for row in reader:
                    if len(row) >= 2 and row[0] and row[1]:
                        try:
                            Position.objects.create(
                                sheet=sheet,
                                name_by_il=str(row[0]).strip(),
                                quantity=float(row[1]),
                                unit=str(row[2]).strip() if len(row) > 2 and row[2] else 'шт',
                                target_price=float(row[3]) if len(row) > 3 and row[3] else None
                            )
                            positions_created += 1
                        except (ValueError, TypeError) as e:
                            errors.append(f'Ошибка в строке: {row[:4]} - {str(e)}')
            else:
                # Excel
                wb = openpyxl.load_workbook(file)
                ws = wb.active
                
                for row in ws.iter_rows(min_row=2, values_only=True):
                    if row[0] and row[1]:
                        try:
                            Position.objects.create(
                                sheet=sheet,
                                name_by_il=str(row[0]).strip(),
                                quantity=float(row[1]),
                                unit=str(row[2]).strip() if len(row) > 2 and row[2] else 'шт',
                                target_price=float(row[3]) if len(row) > 3 and row[3] else None
                            )
                            positions_created += 1
                        except (ValueError, TypeError) as e:
                            errors.append(f'Ошибка в строке: {row[:4]} - {str(e)}')
                            
        except Exception as e:
            sheet.delete()
            return Response({'error': f'Ошибка чтения файла: {str(e)}'}, status=400)

        return Response({
            'id': sheet.id,
            'name': sheet.name,
            'positions_created': positions_created,
            'errors': errors[:10] if errors else None
        })


class PositionViewSet(viewsets.ModelViewSet):
    """Позиции инженерных листов"""
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['sheet', 'status']
    search_fields = ['name_by_il', 'name_by_cp']
    ordering_fields = ['id', 'target_price', 'status']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PositionListSerializer
        return PositionSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Position.objects.select_related('sheet', 'winner_supplier').all()
        
        if user.role == 'manager':
            queryset = queryset.filter(sheet__created_by=user)
        
        sheet_id = self.request.query_params.get('sheet')
        if sheet_id:
            queryset = queryset.filter(sheet_id=sheet_id)
        
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def complete_tender(self, request, pk=None):
        """Завершение торгов - ввод данных победителя"""
        position = self.get_object()
        
        winner_price = request.data.get('winner_price')
        supplier_id = request.data.get('supplier_id')
        supplier_name = request.data.get('supplier_name')
        deadline = request.data.get('deadline')
        
        if winner_price:
            position.winner_price = winner_price
            position.status = Position.Status.COMPLETED
        
        if supplier_id:
            try:
                position.winner_supplier = Supplier.objects.get(id=supplier_id)
            except Supplier.DoesNotExist:
                pass
        
        if supplier_name:
            position.winner_supplier_name = supplier_name
        
        if deadline:
            position.winner_deadline = deadline
        
        position.save()
        
        # Загружаем итоговый документ если есть
        final_file = request.FILES.get('final_document')
        if final_file:
            Document.objects.create(
                position=position,
                doc_type=Document.DocType.FINAL,
                file=final_file,
                uploaded_by=request.user
            )
        
        serializer = self.get_serializer(position)
        return Response(serializer.data)


class DocumentViewSet(viewsets.ModelViewSet):
    """Документы к позициям"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['position', 'doc_type']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Document.objects.filter(position__sheet__created_by=user)
        else:
            return Document.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class CommentViewSet(viewsets.ModelViewSet):
    """Комментарии к позициям"""
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['position']
    
    def get_queryset(self):
        queryset = Comment.objects.select_related('author').all()
        position_id = self.request.query_params.get('position')
        if position_id:
            queryset = queryset.filter(position_id=position_id)
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class SupplierViewSet(viewsets.ModelViewSet):
    """Поставщики"""
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'email', 'inn']
    ordering_fields = ['name', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Supplier.objects.filter(created_by=user)
        else:
            return Supplier.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class LotViewSet(viewsets.ModelViewSet):
    """Лоты (закупки)"""
    serializer_class = LotSerializer
    permission_classes = [IsAuthenticated, IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'supplier']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'total_price']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Lot.objects.filter(created_by=user).prefetch_related('positions')
        else:
            return Lot.objects.all().prefetch_related('positions')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def add_positions(self, request, pk=None):
        """Добавление позиций в лот"""
        lot = self.get_object()
        position_ids = request.data.get('position_ids', [])
        
        if position_ids:
            positions = Position.objects.filter(id__in=position_ids)
            lot.positions.add(*positions)
            lot.total_price = lot.calculate_total_price()
            lot.save()
        
        return Response(self.get_serializer(lot).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def remove_position(self, request, pk=None):
        """Удаление позиции из лота"""
        lot = self.get_object()
        position_id = request.data.get('position_id')
        
        if position_id:
            lot.positions.remove(position_id)
            lot.total_price = lot.calculate_total_price()
            lot.save()
        
        return Response(self.get_serializer(lot).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def upload_final_document(self, request, pk=None):
        """Загрузка итогового документа лота"""
        lot = self.get_object()
        file = request.FILES.get('file')
        
        if file:
            lot.final_document = file
            lot.save()
            return Response({'message': 'Документ загружен'})
        
        return Response({'error': 'Файл не предоставлен'}, status=400)
    
    @action(detail=True, methods=['post'], permission_classes=[IsManager])
    def change_status(self, request, pk=None):
        """Изменение статуса лота"""
        lot = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Lot.Status.choices):
            lot.status = new_status
            lot.save()
            return Response({'status': lot.status, 'status_display': lot.get_status_display()})
        
        return Response({'error': 'Неверный статус'}, status=400)


class TestJWTView(APIView):
    """Тестовый эндпоинт для проверки JWT"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            "status": "JWT работает!",
            "user": str(request.user),
            "role": request.user.role,
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Статистика для дашборда"""
    user = request.user
    
    if user.role == 'manager':
        positions = Position.objects.filter(sheet__created_by=user)
        sheets = Sheet.objects.filter(created_by=user)
        lots = Lot.objects.filter(created_by=user)
        suppliers = Supplier.objects.filter(created_by=user)
    else:
        positions = Position.objects.all()
        sheets = Sheet.objects.all()
        lots = Lot.objects.all()
        suppliers = Supplier.objects.all()
    
    return Response({
        'positions_total': positions.count(),
        'positions_active': positions.filter(status=Position.Status.IN_WORK).count(),
        'positions_completed': positions.filter(status=Position.Status.COMPLETED).count(),
        'sheets_total': sheets.count(),
        'lots_total': lots.count(),
        'lots_active': lots.filter(status__in=[Lot.Status.FORMING, Lot.Status.ACTIVE]).count(),
        'suppliers_total': suppliers.count(),
    })