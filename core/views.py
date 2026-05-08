from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Alert, HealthMetric, Insight, PatientProfile, Recommendation, RiskScore
from .permissions import IsDoctor
from .services.ai_summary import generate_health_summary
from .serializers import (
    AlertSerializer,
    CustomTokenObtainPairSerializer,
    DoctorPatientDetailSerializer,
    DoctorPatientSummarySerializer,
    HealthMetricSerializer,
    InsightSerializer,
    PatientProfileSerializer,
    RecommendationSerializer,
    RiskScoreSerializer,
    UserSerializer,
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Account created successfully.'},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except PatientProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PatientProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        try:
            profile = request.user.profile
        except PatientProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PatientProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HealthMetricCreateView(generics.CreateAPIView):
    serializer_class = HealthMetricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.profile)


class HealthMetricListView(generics.ListAPIView):
    serializer_class = HealthMetricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HealthMetric.objects.filter(patient=self.request.user.profile)


class LatestRiskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        risk = RiskScore.objects.filter(patient=request.user.profile).first()
        if risk is None:
            return Response(
                {'message': 'No risk score available yet.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RiskScoreSerializer(risk)
        return Response(serializer.data)


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(patient=self.request.user.profile)


class InsightListView(generics.ListAPIView):
    serializer_class = InsightSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Insight.objects.filter(patient=self.request.user.profile)


class RecommendationListView(generics.ListAPIView):
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Recommendation.objects.filter(patient=self.request.user.profile)


class HealthSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except PatientProfile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile_with_data = (
            PatientProfile.objects
            .prefetch_related('risk_scores', 'insights', 'recommendations')
            .get(pk=profile.pk)
        )

        try:
            summary = generate_health_summary(profile_with_data)
        except Exception:
            summary = "We're unable to generate a summary right now. Please try again later."

        return Response({'summary': summary})


class DoctorPatientListView(generics.ListAPIView):
    serializer_class = DoctorPatientSummarySerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        return (
            PatientProfile.objects
            .filter(doctor=self.request.user)
            .select_related('user')
            .prefetch_related('risk_scores')
        )


class DoctorPatientDetailView(generics.RetrieveAPIView):
    serializer_class = DoctorPatientDetailSerializer
    permission_classes = [IsDoctor]

    def get_queryset(self):
        return (
            PatientProfile.objects
            .filter(doctor=self.request.user)
            .select_related('user')
            .prefetch_related('metrics', 'risk_scores', 'insights', 'recommendations', 'alerts')
        )
