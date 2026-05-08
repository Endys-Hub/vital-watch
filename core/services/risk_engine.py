_WEIGHTS = {
    'bp':       0.35,
    'glucose':  0.30,
    'sleep':    0.20,
    'activity': 0.15,
}


def _lerp(x, x0, x1, y0, y1):
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def _normalize_bp(systolic):
    """120 → 0.2  |  140 → 0.6  |  180 → 1.0"""
    if systolic <= 110: return 0.0
    if systolic <= 120: return _lerp(systolic, 110, 120, 0.0, 0.2)
    if systolic <= 140: return _lerp(systolic, 120, 140, 0.2, 0.6)
    return min(1.0, _lerp(systolic, 140, 180, 0.6, 1.0))


def _normalize_glucose(glucose):
    """90 → 0.2  |  140 → 0.6  |  200 → 1.0"""
    if glucose <= 70:  return 0.0
    if glucose <= 90:  return _lerp(glucose, 70, 90, 0.0, 0.2)
    if glucose <= 140: return _lerp(glucose, 90, 140, 0.2, 0.6)
    return min(1.0, _lerp(glucose, 140, 200, 0.6, 1.0))


def _normalize_sleep(hours):
    """8 → 0.1  |  6 → 0.5  |  4 → 1.0  (fewer hours = higher risk)"""
    if hours >= 9: return 0.0
    if hours >= 8: return _lerp(hours, 9, 8, 0.0, 0.1)
    if hours >= 6: return _lerp(hours, 8, 6, 0.1, 0.5)
    if hours >= 4: return _lerp(hours, 6, 4, 0.5, 1.0)
    return 1.0


def _normalize_activity_minutes(minutes):
    """>45 → 0.1  |  20–45 → 0.5  |  <20 → 1.0  (less activity = higher risk)"""
    if minutes >= 60: return 0.0
    if minutes >= 45: return _lerp(minutes, 60, 45, 0.0, 0.1)
    if minutes >= 20: return _lerp(minutes, 45, 20, 0.1, 0.5)
    return min(1.0, _lerp(minutes, 20, 0, 0.5, 1.0))


def _normalize_activity_level(level):
    """1–10 scale  (1 = sedentary → 1.0 risk  |  10 = very active → 0.0 risk)"""
    return max(0.0, min(1.0, (10 - level) / 9))


def _weighted_score(components, weights):
    """Return weighted average, renormalizing for whichever keys are present."""
    available = {k: weights[k] for k in components}
    total = sum(available.values())
    return sum(components[k] * available[k] / total for k in components)


def calculate_risk(metric):
    """
    Normalized, weighted risk scoring. All fields optional.
    Missing metrics have their weights redistributed across present ones.
    Returns a dict of risk scores (0–100).
    Pure logic — no database operations.
    """

    scores = {}

    if metric.systolic_bp is not None:
        scores['bp'] = _normalize_bp(metric.systolic_bp)

    if metric.blood_glucose is not None:
        scores['glucose'] = _normalize_glucose(metric.blood_glucose)

    if metric.sleep_hours is not None:
        scores['sleep'] = _normalize_sleep(metric.sleep_hours)

    if metric.activity_minutes is not None:
        scores['activity'] = _normalize_activity_minutes(metric.activity_minutes)
    elif metric.activity_level is not None:
        scores['activity'] = _normalize_activity_level(metric.activity_level)

    n = len(scores)
    confidence = 'high' if n >= 4 else 'medium' if n >= 2 else 'low'

    if not scores:
        return {'hypertension_risk': 0, 'diabetes_risk': 0, 'stroke_risk': 0, 'overall_risk': 0, 'confidence': 'low'}

    overall_risk = max(0, min(100, round(_weighted_score(scores, _WEIGHTS) * 100)))

    hypertension_risk = max(0, min(100, round(scores.get('bp', 0) * 100)))
    diabetes_risk     = max(0, min(100, round(scores.get('glucose', 0) * 100)))

    stroke_components = {k: scores[k] for k in ('bp', 'sleep') if k in scores}
    if stroke_components:
        stroke_risk = max(0, min(100, round(
            _weighted_score(stroke_components, {'bp': 0.70, 'sleep': 0.30}) * 100
        )))
    else:
        stroke_risk = 0

    return {
        'hypertension_risk': hypertension_risk,
        'diabetes_risk':     diabetes_risk,
        'stroke_risk':       stroke_risk,
        'overall_risk':      overall_risk,
        'confidence':        confidence,
    }
