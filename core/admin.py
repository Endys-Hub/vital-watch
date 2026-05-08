from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PatientProfile, HealthMetric, RiskScore, Insight, Recommendation, Alert


class PatientProfileInline(admin.StackedInline):
    model = PatientProfile
    fk_name = "user"
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [PatientProfileInline]
    ordering = ['email']
    list_display = ['email', 'role', 'is_active', 'is_staff', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['email']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Role', {'fields': ('role',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'is_active', 'is_staff'),
        }),
    )


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "doctor")
    list_filter = ("doctor",)
    search_fields = ("user__email",)


@admin.register(HealthMetric)
class HealthMetricAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "timestamp")
    list_filter = ("timestamp",)


@admin.register(RiskScore)
class RiskScoreAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "overall_risk", "confidence", "timestamp")
    list_filter = ("confidence",)


@admin.register(Insight)
class InsightAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "message", "created_at")


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "message", "priority")


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "message", "severity", "created_at")
