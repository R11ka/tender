# tenders/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.conf import settings

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
    middle_name = models.CharField(max_length=150, blank=True, verbose_name='Отчество')
    first_name = models.CharField(max_length=150, blank=True, verbose_name='Имя')
    last_name = models.CharField(max_length=150, blank=True, verbose_name='Фамилия')
    email = models.EmailField(blank=True, verbose_name='Email')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='Аватар')
    
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
    
    def get_full_name(self):
        """Возвращает полное имя (ФИО)"""
        parts = [self.last_name, self.first_name, self.middle_name]
        return ' '.join(part for part in parts if part).strip() or self.username

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
        ordering = ['-uploaded_at']


class Position(models.Model):
    """Детализированная позиция из инженерного листа"""
    class Status(models.TextChoices):
        IN_WORK = 'in_work', 'В работе'
        COMPLETED = 'completed', 'Завершен'
        CANCELLED = 'cancelled', 'Отменен'
    
    sheet = models.ForeignKey(
        Sheet, on_delete=models.CASCADE, related_name='positions',
        verbose_name='Инженерный лист'
    )
    
    name_by_il = models.CharField(max_length=500, verbose_name='Наименование по ИЛ')
    name_by_cp = models.CharField(max_length=500, blank=True, null=True, verbose_name='Наименование по КП')
    quantity = models.FloatField(verbose_name='Количество', validators=[MinValueValidator(0)])
    unit = models.CharField(max_length=20, verbose_name='Ед. изм.', default='шт')
    target_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        verbose_name='Целевая цена'
    )
    
    winner_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        verbose_name='Цена победителя'
    )
    winner_supplier = models.ForeignKey(
        'Supplier', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='won_positions', verbose_name='Поставщик-победитель'
    )
    winner_supplier_name = models.CharField(max_length=255, blank=True, null=True, 
                                            verbose_name='Название поставщика (текст)')
    winner_deadline = models.DateField(null=True, blank=True, verbose_name='Срок поставки')
    
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.IN_WORK, 
        verbose_name='Статус'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name_by_il
    
    class Meta:
        verbose_name = 'Позиция'
        verbose_name_plural = 'Позиции'
        ordering = ['id']


class Document(models.Model):
    """Документы, прикрепляемые к позиции"""
    class DocType(models.TextChoices):
        TOR = 'tor', 'Техническое задание'
        COMMERCIAL = 'commercial', 'Коммерческое предложение'
        DRAWING = 'drawing', 'Чертеж'
        FINAL = 'final', 'Итоговый документ'
        PROTOCOL = 'protocol', 'Протокол'
        CONTRACT = 'contract', 'Договор'
    
    position = models.ForeignKey(
        Position, on_delete=models.CASCADE, related_name='documents',
        verbose_name='Позиция'
    )
    doc_type = models.CharField(max_length=20, choices=DocType.choices, verbose_name='Тип документа')
    file = models.FileField(upload_to='documents/%Y/%m/', verbose_name='Файл')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Загрузил')
    
    def __str__(self):
        return f"{self.get_doc_type_display()} - {self.position.name_by_il[:50]}"


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
        ordering = ['-created_at']


class Supplier(models.Model):
    """Поставщик"""
    name = models.CharField(max_length=255, verbose_name='Наименование')
    contact_person = models.CharField(max_length=255, blank=True, verbose_name='Контактное лицо')
    email = models.EmailField(blank=True, verbose_name='Email')
    phone = models.CharField(max_length=50, blank=True, verbose_name='Телефон')
    address = models.TextField(blank=True, verbose_name='Адрес')
    inn = models.CharField(max_length=20, blank=True, verbose_name='ИНН')
    kpp = models.CharField(max_length=20, blank=True, verbose_name='КПП')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Создал')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Поставщик'
        verbose_name_plural = 'Поставщики'
        ordering = ['name']


class Lot(models.Model):
    """Лот для объединения позиций в закупку"""
    class Status(models.TextChoices):
        FORMING = 'forming', 'Формируется'
        ACTIVE = 'active', 'Активный'
        COMPLETED = 'completed', 'Завершен'
        CANCELLED = 'cancelled', 'Отменен'
    
    name = models.CharField(max_length=255, verbose_name='Название лота')
    description = models.TextField(blank=True, verbose_name='Описание')
    positions = models.ManyToManyField(Position, related_name='lots', verbose_name='Позиции')
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='lots', verbose_name='Поставщик'
    )
    total_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True,
        verbose_name='Итоговая цена'
    )
    deadline = models.DateField(null=True, blank=True, verbose_name='Срок поставки')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Создал')
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.FORMING, 
        verbose_name='Статус'
    )
    final_document = models.FileField(
        upload_to='lots/documents/', blank=True, null=True,
        verbose_name='Итоговый документ'
    )
    
    def __str__(self):
        return self.name
    
    def calculate_total_price(self):
        """Вычисляет общую стоимость лота"""
        total = sum(
            pos.winner_price or pos.target_price or 0 
            for pos in self.positions.all()
        )
        return total
    
    class Meta:
        verbose_name = 'Лот'
        verbose_name_plural = 'Лоты'
        ordering = ['-created_at']