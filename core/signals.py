from datetime import timedelta

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Alert, HealthMetric, Insight, PatientProfile, Recommendation, RiskScore
from .services.risk_engine import calculate_risk


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_patient_profile(sender, instance, created, **kwargs):
    if created:
        PatientProfile.objects.create(
            user=instance,
            age=0,
            gender='other',
            height=0.0,
            weight=0.0,
        )


def _generate_insights(patient):
    recent = list(
        HealthMetric.objects.filter(patient=patient).order_by('-timestamp')[:5]
    )
    if not recent:
        return

    def avg(field):
        values = [getattr(m, field) for m in recent if getattr(m, field) is not None]
        return sum(values) / len(values) if values else None

    candidates = []
    bp = avg('systolic_bp')
    if bp is not None and bp > 140:
        candidates.append('Your inputs suggest your blood pressure may be elevated')
    glucose = avg('blood_glucose')
    if glucose is not None and glucose > 140:
        candidates.append('Your glucose readings appear elevated')
    act_mins = avg('activity_minutes')
    if act_mins is not None:
        if act_mins < 20:
            candidates.append('Your activity level appears low based on recent entries')
    else:
        activity = avg('activity_level')
        if activity is not None and activity < 4:
            candidates.append('Your activity levels appear low, which may be contributing to your risk')
    sleep = avg('sleep_hours')
    if sleep is not None and sleep < 6:
        candidates.append('Your logged sleep duration appears to be below recommended levels')

    if not candidates:
        return

    cutoff = timezone.now() - timedelta(hours=24)
    existing = set(
        Insight.objects.filter(patient=patient, created_at__gte=cutoff)
        .values_list('message', flat=True)
    )

    Insight.objects.bulk_create([
        Insight(patient=patient, message=msg)
        for msg in candidates
        if msg not in existing
    ])


def _generate_trend_insights(patient):
    metrics = list(
        HealthMetric.objects.filter(patient=patient).order_by('-timestamp')[:6]
    )
    if len(metrics) < 6:
        return

    recent   = metrics[:3]   # newest 3
    previous = metrics[3:]   # older 3

    def avg(entries, field):
        values = [getattr(m, field) for m in entries if getattr(m, field) is not None]
        return sum(values) / len(values) if values else None

    candidates = []

    bp_r, bp_p = avg(recent, 'systolic_bp'), avg(previous, 'systolic_bp')
    if bp_r is not None and bp_p is not None:
        bp_diff = bp_r - bp_p
        if bp_diff <= -5:
            candidates.append('Your blood pressure readings suggest a positive trend')
        elif bp_diff >= 5:
            candidates.append('Your blood pressure readings may suggest a worsening trend')

    act_mins_r, act_mins_p = avg(recent, 'activity_minutes'), avg(previous, 'activity_minutes')
    if act_mins_r is not None and act_mins_p is not None:
        mins_diff = act_mins_r - act_mins_p
        if mins_diff >= 10:
            candidates.append('Your consistent activity is helping reduce your risk')
        elif mins_diff <= -10:
            candidates.append('Your activity minutes appear to have decreased recently')
    else:
        act_r, act_p = avg(recent, 'activity_level'), avg(previous, 'activity_level')
        if act_r is not None and act_p is not None and act_r - act_p >= 0.5:
            candidates.append('Your activity levels are improving')

    slp_r, slp_p = avg(recent, 'sleep_hours'), avg(previous, 'sleep_hours')
    if slp_r is not None and slp_p is not None and slp_r - slp_p >= 0.5:
        candidates.append('Your sleep consistency is improving')

    if not candidates:
        return

    cutoff = timezone.now() - timedelta(hours=24)
    existing = set(
        Insight.objects.filter(patient=patient, type='trend', created_at__gte=cutoff)
        .values_list('message', flat=True)
    )

    Insight.objects.bulk_create([
        Insight(patient=patient, message=msg, type='trend')
        for msg in candidates
        if msg not in existing
    ])


_INSIGHT_TO_RECOMMENDATION = {
    'blood pressure may be elevated': (
        'Consider reducing sodium intake and monitoring your BP regularly', 1
    ),
    'glucose readings appear elevated': (
        'Consider reducing sugar intake and checking glucose regularly', 1
    ),
    'activity level appears low based on recent entries': (
        'Aim for at least 20–30 minutes of movement per day', 2
    ),
    'activity levels appear low': (
        'Aim for at least 20–30 minutes of movement per day', 2
    ),
    'sleep duration appears to be below': (
        'Try to target 7–8 hours of sleep consistently', 2
    ),
}


def _generate_recommendations(patient):
    recent_insights = Insight.objects.filter(patient=patient).order_by('-created_at')[:10]
    if not recent_insights:
        return

    cutoff = timezone.now() - timedelta(hours=24)
    existing = set(
        Recommendation.objects.filter(patient=patient, created_at__gte=cutoff)
        .values_list('message', flat=True)
    )

    to_create = []
    seen = set()
    for insight in recent_insights:
        for fragment, (rec_message, priority) in _INSIGHT_TO_RECOMMENDATION.items():
            if fragment in insight.message and rec_message not in existing and rec_message not in seen:
                to_create.append(Recommendation(patient=patient, message=rec_message, priority=priority))
                seen.add(rec_message)

    if to_create:
        Recommendation.objects.bulk_create(to_create)


# Maps a fragment of a recommendation message → insight message fragments that relate to it
_REC_INSIGHT_MAP = {
    'reducing sodium intake': [
        'blood pressure may be elevated',
        'blood pressure readings may suggest a worsening trend',
    ],
    'reducing sugar intake': [
        'glucose readings appear elevated',
    ],
    '20–30 minutes of movement': [
        'activity level appears low based on recent entries',
        'activity levels appear low',
        'activity',
    ],
    '7–8 hours of sleep': [
        'sleep duration appears to be below',
        'sleep consistency',
    ],
}


def _score_recommendations(patient, overall_risk):
    cutoff = timezone.now() - timedelta(hours=24)

    recent_recs = list(Recommendation.objects.filter(patient=patient, created_at__gte=cutoff))
    if not recent_recs:
        return

    recent_insight_messages = list(
        Insight.objects.filter(patient=patient, created_at__gte=cutoff)
        .values_list('message', flat=True)
    )
    worsening = [m for m in recent_insight_messages if 'worsen' in m.lower()]

    risk_w = 30 if overall_risk >= 70 else 15 if overall_risk >= 50 else 0

    for rec in recent_recs:
        base = {1: 100, 2: 60, 3: 30}.get(rec.priority, 30)
        trend_w = 0
        recency_w = 0

        for rec_fragment, insight_frags in _REC_INSIGHT_MAP.items():
            if rec_fragment not in rec.message:
                continue
            for frag in insight_frags:
                frag_lower = frag.lower()
                if any(frag_lower in m.lower() for m in worsening):
                    trend_w = 20
                if any(frag_lower in m.lower() for m in recent_insight_messages):
                    recency_w = 10
            break

        rec.score = base + risk_w + trend_w + recency_w

    Recommendation.objects.bulk_update(recent_recs, ['score'])


@receiver(post_save, sender=HealthMetric)
def handle_health_metric(sender, instance, created, **kwargs):
    if not created:
        return

    scores = calculate_risk(instance)

    risk = RiskScore.objects.create(
        patient=instance.patient,
        stroke_risk=scores['stroke_risk'],
        diabetes_risk=scores['diabetes_risk'],
        hypertension_risk=scores['hypertension_risk'],
        overall_risk=scores['overall_risk'],
        confidence=scores['confidence'],
    )

    if scores['overall_risk'] >= 70:
        Alert.objects.create(
            patient=instance.patient,
            risk_score=risk,
            severity='high',
            message='Your inputs suggest an elevated health risk. Consider speaking with a healthcare professional.',
        )
    elif scores['overall_risk'] >= 50:
        Alert.objects.create(
            patient=instance.patient,
            risk_score=risk,
            severity='medium',
            message='Your inputs may indicate a moderate risk level. Consider monitoring your metrics more closely.',
        )

    _generate_insights(instance.patient)
    _generate_trend_insights(instance.patient)
    _generate_recommendations(instance.patient)
    _score_recommendations(instance.patient, scores['overall_risk'])
