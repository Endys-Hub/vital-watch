from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError('Superuser must have is_staff=True')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('patient', 'Patient'), ('doctor', 'Doctor')]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class PatientProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patients',
        limit_choices_to={'role': 'doctor'},
    )
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    height = models.FloatField(help_text='Height in cm')
    weight = models.FloatField(help_text='Weight in kg')
    lifestyle_notes = models.TextField(blank=True, null=True)
    ai_summary = models.TextField(null=True, blank=True)
    ai_summary_updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.email


class HealthMetric(models.Model):
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='metrics',
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    # Vitals
    systolic_bp = models.IntegerField(null=True, blank=True)
    diastolic_bp = models.IntegerField(null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    blood_glucose = models.FloatField(null=True, blank=True)

    # Lifestyle
    sleep_hours = models.FloatField(null=True, blank=True)
    activity_level = models.IntegerField(null=True, blank=True, help_text='Scale 1–10')
    activity_minutes = models.IntegerField(null=True, blank=True, help_text='Minutes of physical activity')
    steps = models.IntegerField(null=True, blank=True, help_text='Step count')
    diet_quality_score = models.IntegerField(null=True, blank=True, help_text='Scale 1–10')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.patient.user.email} — {self.timestamp}"


RISK_VALIDATORS = [MinValueValidator(0), MaxValueValidator(100)]


class RiskScore(models.Model):
    CONFIDENCE_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='risk_scores',
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    stroke_risk = models.IntegerField(validators=RISK_VALIDATORS)
    diabetes_risk = models.IntegerField(validators=RISK_VALIDATORS)
    hypertension_risk = models.IntegerField(validators=RISK_VALIDATORS)
    overall_risk = models.IntegerField(validators=RISK_VALIDATORS)
    confidence = models.CharField(max_length=10, choices=CONFIDENCE_CHOICES, default='low')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.patient.user.email} — overall risk: {self.overall_risk}%"


class Insight(models.Model):
    TYPE_CHOICES = [('trend', 'Trend'), ('condition', 'Condition')]

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='insights',
    )
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='condition')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.user.email} [{self.type}] — {self.message[:60]}"


class Recommendation(models.Model):
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='recommendations',
    )
    message = models.TextField()
    priority = models.IntegerField(help_text='1 = high, 2 = medium, 3 = low')
    score = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score', 'priority', '-created_at']

    def __str__(self):
        return f"{self.patient.user.email} — priority {self.priority}: {self.message[:60]}"


class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='alerts',
    )
    risk_score = models.ForeignKey(
        RiskScore,
        on_delete=models.CASCADE,
        related_name='alerts',
    )
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.user.email} — {self.severity} alert"
