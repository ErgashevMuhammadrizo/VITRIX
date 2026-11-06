from django.contrib import admin
from .models import AccountProfile


@admin.register(AccountProfile)
class AccountProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "trial_started_at")
    search_fields = ("user__username", "user__email")


from .models import (
    Business,
    Category,
    Product,
    Plan,
    SubscriptionRequest,
    AuditLog,
    PlatformSettings,
)

for model in [Business, Category, Product, Plan, SubscriptionRequest, PlatformSettings]:
    admin.site.register(model)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("actor", "action", "target", "at")
    readonly_fields = ("actor", "action", "target", "at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


from .models import SubscriptionActivation


@admin.register(SubscriptionActivation)
class SubscriptionActivationAdmin(admin.ModelAdmin):
    list_display = ("business", "plan", "months", "newExpiry", "actor", "createdAt")
    readonly_fields = [f.name for f in SubscriptionActivation._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
