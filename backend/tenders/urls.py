# tenders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='users')
router.register(r'sheets', views.SheetViewSet, basename='sheets')
router.register(r'positions', views.PositionViewSet, basename='positions')
router.register(r'documents', views.DocumentViewSet, basename='documents')
router.register(r'comments', views.CommentViewSet, basename='comments')
router.register(r'lots', views.LotViewSet, basename='lots')
router.register(r'suppliers', views.SupplierViewSet, basename='suppliers')

urlpatterns = [
    # API эндпоинты
    path('api/', include(router.urls)),
    path('api/dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Фронтенд страницы
    path('', views.index_page, name='index'),
    path('engineering-lists/', views.engineering_lists_page, name='engineering-lists'),
    path('engineering-detail/', views.engineering_detail_page, name='engineering-detail'),
    path('lots/', views.lots_page, name='lots-page'),
    path('suppliers/', views.suppliers_page, name='suppliers-page'),
    path('chats/', views.chats_page, name='chats'),
    path('profile/', views.profile_page, name='profile'),
    
    # Catch-all для React Router
    path('<path:path>/', views.index_page, name='catch-all'),
]