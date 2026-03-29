# tenders/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator

# tenders/models.py - только класс User (остальные модели не трогаем)

class User(AbstractUser):
    """Модель пользователя с ролями"""
    class Role(models.TextChoices):
        MANAGER = 'manager', 'Менеджер'
        OBSERVER = 'observer', 'Наблюдатель'
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MANAGER,
        verbose_name='Роль'
    )
    
    # Добавляем related_name чтобы избежать конфликта
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='tenders_users',
        blank=True,
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='tenders_users',
        blank=True,
        verbose_name='user permissions'
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

class Sheet(models.Model):
    """Инженерный лист (загруженный файл)"""
    name = models.CharField(max_length=255, verbose_name='Название файла')
    file = models.FileField(upload_to='sheets/', verbose_name='Файл')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата загрузки')
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sheets',
        verbose_name='Загрузил'
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Инженерный лист'
        verbose_name_plural = 'Инженерные листы'


class Position(models.Model):
    """Детализированная позиция из инженерного листа"""
    sheet = models.ForeignKey(
        Sheet, on_delete=models.CASCADE, related_name='positions',
        verbose_name='Инженерный лист'
    )
    
    name_by_il = models.CharField(max_length=500, verbose_name='Наименование по ИЛ')
    name_by_cp = models.CharField(max_length=500, blank=True, null=True, verbose_name='Наименование по КП')
    quantity = models.FloatField(verbose_name='Количество', validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=20, verbose_name='Ед. изм.')
    target_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        verbose_name='Целевая цена'
    )
    
    winner_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        verbose_name='Цена победителя'
    )
    winner_supplier = models.CharField(max_length=255, blank=True, null=True, verbose_name='Поставщик')
    winner_deadline = models.DateField(null=True, blank=True, verbose_name='Срок поставки')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name_by_il
    
    class Meta:
        verbose_name = 'Позиция'
        verbose_name_plural = 'Позиции'


class Document(models.Model):
    """Документы, прикрепляемые к позиции"""
    class DocType(models.TextChoices):
        TOR = 'tor', 'Техническое задание'
        COMMERCIAL = 'commercial', 'Коммерческое предложение'
        DRAWING = 'drawing', 'Чертеж'
        FINAL = 'final', 'Итоговый документ'
    
    position = models.ForeignKey(
        Position, on_delete=models.CASCADE, related_name='documents',
        verbose_name='Позиция'
    )
    doc_type = models.CharField(max_length=20, choices=DocType.choices, verbose_name='Тип документа')
    file = models.FileField(upload_to='documents/', verbose_name='Файл')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Загрузил')
    
    def __str__(self):
        return f"{self.get_doc_type_display()} - {self.position.name_by_il[:50]}"
    
    class Meta:
        verbose_name = 'Документ'
        verbose_name_plural = 'Документы'


class Comment(models.Model):
    """Комментарии к позиции"""
    position = models.ForeignKey(
        Position, on_delete=models.CASCADE, related_name='comments',
        verbose_name='Позиция'
    )
    text = models.TextField(verbose_name='Текст комментария')
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Автор')
    
    def __str__(self):
        return f"{self.author.username}: {self.text[:50]}"
    
    class Meta:
        verbose_name = 'Комментарий'
        verbose_name_plural = 'Комментарии'


class Lot(models.Model):
    """Лот для объединения позиций в закупку"""
    name = models.CharField(max_length=255, verbose_name='Название лота')
    positions = models.ManyToManyField(Position, related_name='lots', verbose_name='Позиции')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Создал')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Лот'
        verbose_name_plural = 'Лоты'