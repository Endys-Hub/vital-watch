import os
from datetime import timedelta

import anthropic
from django.utils import timezone

_client = None
_CACHE_TTL = timedelta(hours=6)


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY', ''))
    return _client


def _is_stale(patient):
    if not patient.ai_summary or patient.ai_summary_updated_at is None:
        return True
    return timezone.now() - patient.ai_summary_updated_at > _CACHE_TTL


def _call_llm(patient):
    risk = patient.risk_scores.first()
    all_insights = list(patient.insights.select_related().order_by('-created_at')[:5])
    recommendations = list(
        patient.recommendations.order_by('-score', 'priority').values_list('message', flat=True)[:2]
    )

    if risk is None and not all_insights:
        return "No health data has been recorded yet. Submit your first set of vitals to receive a personalized health summary."

    risk_score = f"{risk.overall_risk}% overall risk" if risk else "Not yet calculated"

    condition_insights = [i.message for i in all_insights if i.type == 'condition'][:3]
    trend_insights     = [i.message for i in all_insights if i.type == 'trend']

    insights_summary      = " ".join(condition_insights) if condition_insights else "No specific patterns detected yet."
    trends_summary        = " ".join(trend_insights)     if trend_insights     else "No significant trend changes."
    recommendations_summary = " ".join(recommendations)  if recommendations    else "No specific actions recommended yet."

    patient_context = (
        f"This summary is for a {patient.age}-year-old {patient.gender} patient."
        if patient.age and patient.gender else ""
    )

    prompt = f"""
You are a supportive health assistant.

Explain the patient's current health status based on:

Risk score: {risk_score}
Recent trends: {trends_summary}
Key insights: {insights_summary}
Recommended actions: {recommendations_summary}

Write a VERY concise summary that:
- is STRICTLY 1-2 sentences (never more)
- is clear and easy to understand
- sounds calm and supportive (not alarming)
- focuses only on the most important factors

Use cautious language such as "suggests", "may indicate", or "appears to show". Avoid definitive medical statements.
Avoid medical jargon. Be direct and brief.
"""

    message = _get_client().messages.create(
        model='claude-haiku-4-5-20251001',
        max_tokens=150,
        messages=[{'role': 'user', 'content': prompt}],
    )

    return message.content[0].text.strip()


def generate_health_summary(patient):
    if not _is_stale(patient):
        return patient.ai_summary

    summary = _call_llm(patient)

    patient.ai_summary = summary
    patient.ai_summary_updated_at = timezone.now()
    patient.save(update_fields=['ai_summary', 'ai_summary_updated_at'])

    return summary
