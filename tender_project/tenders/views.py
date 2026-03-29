# tenders/views.py
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Sheet, Position, Document, Comment, Lot
from .serializers import (
    UserSerializer, SheetSerializer, PositionSerializer,
    DocumentSerializer, CommentSerializer, LotSerializer
)

User = get_user_model()

# ViewSet-ы для API
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class SheetViewSet(viewsets.ModelViewSet):
    queryset = Sheet.objects.all()
    serializer_class = SheetSerializer

class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer

class LotViewSet(viewsets.ModelViewSet):
    queryset = Lot.objects.all()
    serializer_class = LotSerializer

# Тестовый эндпоинт для JWT
class TestJWTView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            "status": "JWT работает!",
            "user": str(request.user),
            "message": "Добро пожаловать в API тендерной системы"
        })