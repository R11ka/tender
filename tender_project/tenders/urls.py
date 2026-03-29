# tenders/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'sheets', views.SheetViewSet)
router.register(r'positions', views.PositionViewSet)
router.register(r'documents', views.DocumentViewSet)
router.register(r'comments', views.CommentViewSet)
router.register(r'lots', views.LotViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('test-jwt/', views.TestJWTView.as_view(), name='test-jwt'),
]