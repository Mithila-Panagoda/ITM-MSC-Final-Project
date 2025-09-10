from django.contrib import admin
from .models import User
from django.contrib.auth.admin import UserAdmin
# Register your models here.
@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = ('username', 'name', 'role', 'is_active', 'is_superuser')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'name')
    readonly_fields = ('created_at', 'updated_at')