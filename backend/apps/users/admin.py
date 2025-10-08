from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin


@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    list_display = (
        "email",
        "name",
        "role_badge",
        "donations_count",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = ("role", "is_active", "is_staff", "is_superuser", "created_at")
    search_fields = ("email", "name", "first_name", "last_name")
    readonly_fields = ("id", "created_at", "updated_at", "last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "name", "role")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Important dates",
            {
                "fields": ("last_login", "date_joined", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
        ("System", {"fields": ("id",), "classes": ("collapse",)}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "role", "password1", "password2"),
            },
        ),
    )

    ordering = ("email",)

    def role_badge(self, obj):
        colors = {
            "DONOR": "#28a745",
            "CHARITY_ADMIN": "#007bff",
            "SUPER_ADMIN": "#dc3545",
        }
        color = colors.get(obj.role, "#6c757d")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_role_display(),
        )

    role_badge.short_description = "Role"

    def donations_count(self, obj):
        try:
            count = obj.donations.filter(status="COMPLETED").count()
            if count > 0:
                url = reverse("admin:charity_donation_changelist")
                return format_html(
                    '<a href="{}?user__id__exact={}">{} donations</a>',
                    url,
                    obj.id,
                    count,
                )
            return "0 donations"
        except:
            return "0 donations"

    donations_count.short_description = "Donations"
