"""
API URL configuration.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'equipment', views.EquipmentViewSet, basename='equipment')
router.register(r'borrowers', views.BorrowerViewSet, basename='borrowers')
router.register(r'borrow-transactions', views.BorrowTransactionViewSet, basename='borrow-transactions')
router.register(r'return-transactions', views.ReturnTransactionViewSet, basename='return-transactions')
router.register(r'condition-logs', views.ConditionLogViewSet, basename='condition-logs')

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('user/', views.UserProfileView.as_view(), name='user-profile'),
    
    # Dashboard & Reports
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('reports/overdue/', views.ReportsView.as_view(), name='reports-overdue'),
    path('reports/damaged/', views.ReportsView.as_view(), name='reports-damaged'),
    path('reports/summary/', views.ReportsView.as_view(), name='reports-summary'),
    
    # Include router URLs
    path('', include(router.urls)),
]
