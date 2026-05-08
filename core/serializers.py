from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Alert, HealthMetric, Insight, PatientProfile, Recommendation, RiskScore

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
        )


class PatientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['age', 'gender', 'height', 'weight', 'lifestyle_notes']


class HealthMetricSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(read_only=True)

    class Meta:
        model = HealthMetric
        fields = [
            'id',
            'timestamp',
            'systolic_bp',
            'diastolic_bp',
            'heart_rate',
            'blood_glucose',
            'sleep_hours',
            'activity_level',
            'activity_minutes',
            'steps',
            'diet_quality_score',
        ]
        extra_kwargs = {
            'systolic_bp':        {'required': False, 'allow_null': True},
            'diastolic_bp':       {'required': False, 'allow_null': True},
            'heart_rate':         {'required': False, 'allow_null': True},
            'blood_glucose':      {'required': False, 'allow_null': True},
            'sleep_hours':        {'required': False, 'allow_null': True},
            'activity_level':     {'required': False, 'allow_null': True},
            'activity_minutes':   {'required': False, 'allow_null': True},
            'steps':              {'required': False, 'allow_null': True},
            'diet_quality_score': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        if not any(v is not None for v in data.values()):
            raise serializers.ValidationError('At least one metric must be provided.')
        return data

    def validate_systolic_bp(self, value):
        if value is not None and not 70 <= value <= 250:
            raise serializers.ValidationError('Systolic BP must be between 70 and 250 mmHg.')
        return value

    def validate_diastolic_bp(self, value):
        if value is not None and not 40 <= value <= 150:
            raise serializers.ValidationError('Diastolic BP must be between 40 and 150 mmHg.')
        return value

    def validate_blood_glucose(self, value):
        if value is not None and not 50 <= value <= 400:
            raise serializers.ValidationError('Blood glucose must be between 50 and 400 mg/dL.')
        return value

    def validate_sleep_hours(self, value):
        if value is not None and not 0 <= value <= 24:
            raise serializers.ValidationError('Sleep hours must be between 0 and 24.')
        return value

    def validate_activity_level(self, value):
        if value is not None and not 1 <= value <= 10:
            raise serializers.ValidationError('Activity level must be between 1 and 10.')
        return value

    def validate_activity_minutes(self, value):
        if value is not None and not 0 <= value <= 1440:
            raise serializers.ValidationError('Activity minutes must be between 0 and 1440.')
        return value

    def validate_steps(self, value):
        if value is not None and not 0 <= value <= 100000:
            raise serializers.ValidationError('Steps must be between 0 and 100,000.')
        return value

    def validate_diet_quality_score(self, value):
        if value is not None and not 1 <= value <= 10:
            raise serializers.ValidationError('Diet quality score must be between 1 and 10.')
        return value


class RiskScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskScore
        fields = [
            'id',
            'timestamp',
            'stroke_risk',
            'diabetes_risk',
            'hypertension_risk',
            'overall_risk',
            'confidence',
        ]
        read_only_fields = fields


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'message', 'severity', 'created_at', 'is_read']


class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = ['id', 'message', 'type', 'created_at']
        read_only_fields = fields


class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = ['id', 'message', 'priority', 'score', 'created_at']
        read_only_fields = fields


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token


class DoctorPatientSummarySerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    latest_risk = serializers.SerializerMethodField()
    risk_trend = serializers.SerializerMethodField()

    class Meta:
        model = PatientProfile
        fields = ['id', 'email', 'age', 'gender', 'latest_risk', 'risk_trend']

    def get_latest_risk(self, obj):
        risk = obj.risk_scores.first()
        if risk is None:
            return None
        return {'overall_risk': risk.overall_risk, 'timestamp': risk.timestamp}

    def get_risk_trend(self, obj):
        scores = list(obj.risk_scores.values_list('overall_risk', flat=True)[:2])
        if len(scores) < 2:
            return 'stable'
        diff = scores[0] - scores[1]
        if diff >= 5:
            return 'up'
        if diff <= -5:
            return 'down'
        return 'stable'


class DoctorPatientDetailSerializer(serializers.ModelSerializer):
    email = serializers.CharField(source='user.email', read_only=True)
    recent_metrics = serializers.SerializerMethodField()
    risk_history = serializers.SerializerMethodField()
    insights = InsightSerializer(many=True)
    recommendations = RecommendationSerializer(many=True)
    alerts = AlertSerializer(many=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'email', 'age', 'gender',
            'recent_metrics', 'risk_history',
            'insights', 'recommendations', 'alerts',
        ]

    def get_recent_metrics(self, obj):
        return HealthMetricSerializer(obj.metrics.all()[:5], many=True).data

    def get_risk_history(self, obj):
        return RiskScoreSerializer(obj.risk_scores.all()[:10], many=True).data
