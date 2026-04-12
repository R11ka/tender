from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Sheet, Position, Document, Comment, Lot, Supplier

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 
                  'middle_name', 'role', 'full_name']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            middle_name=validated_data.get('middle_name', ''),
            role=validated_data.get('role', User.Role.MANAGER)
        )
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class SupplierSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


class SupplierSimpleSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для отображения в списках"""
    class Meta:
        model = Supplier
        fields = ['id', 'name']


class SheetSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    positions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Sheet
        fields = '__all__'
        read_only_fields = ['created_by', 'uploaded_at']
    
    def get_positions_count(self, obj):
        return obj.positions.count()


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['uploaded_by', 'uploaded_at']


class CommentSerializer(serializers.ModelSerializer):
    position = serializers.PrimaryKeyRelatedField(queryset=Position.objects.all())
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'position', 'text', 'author', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['author'] = request.user
        return super().create(validated_data)


class PositionSerializer(serializers.ModelSerializer):
    documents_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    winner_supplier_detail = SupplierSimpleSerializer(source='winner_supplier', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Position
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_documents_count(self, obj):
        return obj.documents.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()


class PositionListSerializer(serializers.ModelSerializer):
    """Упрощенный сериализатор для списка позиций"""
    documents_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Position
        fields = ['id', 'name_by_il', 'name_by_cp', 'quantity', 'unit', 
                  'target_price', 'winner_price', 'status', 'sheet',
                  'documents_count', 'comments_count', 'winner_supplier_name']
    
    def get_documents_count(self, obj):
        return obj.documents.count()
    
    def get_comments_count(self, obj):
        return obj.comments.count()


class LotSerializer(serializers.ModelSerializer):
    positions = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Position.objects.all()
    )
    positions_detail = PositionListSerializer(source='positions', many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    supplier_detail = SupplierSimpleSerializer(source='supplier', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_calculated = serializers.SerializerMethodField()
    
    class Meta:
        model = Lot
        fields = ['id', 'name', 'description', 'positions', 'positions_detail', 
                  'supplier', 'supplier_detail', 'total_price', 'deadline',
                  'created_at', 'created_by', 'status', 'status_display', 
                  'final_document', 'total_calculated']
        read_only_fields = ['id', 'created_at', 'created_by']
    
    def get_total_calculated(self, obj):
        return obj.calculate_total_price()