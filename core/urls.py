from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AlertListView,
    CustomTokenObtainPairView,
    DoctorPatientDetailView,
    DoctorPatientListView,
    HealthMetricCreateView,
    HealthMetricListView,
    HealthSummaryView,
    InsightListView,
    LatestRiskView,
    ProfileView,
    RecommendationListView,
    RegisterView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view()),
    path('auth/token/', CustomTokenObtainPairView.as_view()),
    path('auth/token/refresh/', TokenRefreshView.as_view()),

    path('profile/', ProfileView.as_view()),

    path('metrics/', HealthMetricListView.as_view()),
    path('metrics/create/', HealthMetricCreateView.as_view()),

    path('risk/latest/', LatestRiskView.as_view()),

    path('summary/', HealthSummaryView.as_view()),

    path('alerts/', AlertListView.as_view()),
    path('insights/', InsightListView.as_view()),
    path('recommendations/', RecommendationListView.as_view()),

    path('doctor/patients/', DoctorPatientListView.as_view()),
    path('doctor/patients/<int:pk>/', DoctorPatientDetailView.as_view()),
]
