"""
Admin configuration for API models.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import UserProfile, Equipment, BorrowRequest, BorrowItem, Transaction


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False


class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]


admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(Equipment)
admin.site.register(BorrowRequest)
admin.site.register(BorrowItem)
admin.site.register(Transaction)
