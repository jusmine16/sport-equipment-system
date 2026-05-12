"""
Custom permissions for the API.
"""
from rest_framework import permissions

from .models import UserProfile


def get_user_role(user):
    """Get user role from profile."""
    try:
        return user.profile.role
    except (UserProfile.DoesNotExist, AttributeError):
        return 'user'


class IsAdminUser(permissions.BasePermission):
    """Only allow admin users."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return get_user_role(request.user) == 'admin'


class IsStaffUser(permissions.BasePermission):
    """Allow admin and staff users."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = get_user_role(request.user)
        return role in ('admin', 'staff')


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything; others can only read."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return get_user_role(request.user) == 'admin'
