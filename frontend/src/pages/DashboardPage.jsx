import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import AppLayout from '../components/layout/AppLayout'

function riskColor(score) {
  if (score >= 70) return 'text-red-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-green-400'
}

function riskBarColor(score) {
  if (score >= 70) return 'bg-red-500'
  if (score >= 50) return 'bg-yellow-400'
  return 'bg-green-500'
}

function riskSubtext(score) {
  if (score >= 70) return 'Your inputs may suggest elevated risk'
  if (score >= 50) return 'Your inputs appear to show moderate risk'
  return 'Your inputs suggest stable risk levels'
}

function confidenceColor(level) {
  if (level === 'high')   return 'text-green-400'
  if (level === 'medium') return 'text-yellow-400'
  return 'text-red-400'
}

const INSIGHT_HINTS = {
  'Your inputs suggest your blood pressure may be elevated':             'Consider reducing sodium intake and monitoring your BP regularly.',
  'Your glucose readings appear elevated':                               'Consider reducing sugar intake and speaking with your doctor.',
  'Your activity level appears low based on recent entries':             'Try aiming for at least 20–30 minutes of movement each day.',
  'Your activity levels appear low, which may be contributing to your risk': 'Try aiming for at least 20–30 minutes of movement each day.',
  'Your consistent activity is helping reduce your risk':                'Keep it up — regular movement has lasting health benefits.',
  'Your logged sleep duration appears to be below recommended levels':   'Aim for 7–9 hours of sleep each night.',
}

function relativeTime(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (seconds < 60)  return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60)  return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)    return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}


export default function DashboardPage() {
  const [risk, setRisk]                     = useState(null)
  const [alerts, setAlerts]                 = useState([])
  const [metrics, setMetrics]               = useState([])
  const [insights, setInsights]             = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary]               = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [riskRes, alertsRes, metricsRes, insightsRes, recsRes] = await Promise.all([
          api.get('/risk/latest/').catch((e) => (e.response?.status === 404 ? null : Promise.reject(e))),
          api.get('/alerts/'),
          api.get('/metrics/'),
          api.get('/insights/'),
          api.get('/recommendations/'),
        ])
        setRisk(riskRes?.data ?? null)
        setAlerts(alertsRes.data)
        setMetrics(metricsRes.data)
        setInsights(insightsRes.data)
        setRecommendations(recsRes.data)

        if (metricsRes.data.length > 0) {
          setSummaryLoading(true)
          api.get('/summary/')
            .then((res) => setSummary(res.data.summary))
            .catch(() => {})
            .finally(() => setSummaryLoading(false))
        }
      } catch {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const lastMetric    = metrics[0] ?? null
  const recentAlerts  = alerts.slice(0, 5)

  const lastUpdated = [risk?.timestamp, lastMetric?.timestamp, insights[0]?.created_at]
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <AppLayout>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight leading-tight text-white">Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-slate-500">Last updated {relativeTime(lastUpdated)}</p>
          )}
        </div>

        {error && (
          <p className="text-sm mb-8 border border-slate-800 rounded-xl p-4 text-slate-400">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : metrics.length === 0 ? (
          <div className="flex items-start justify-center pt-16">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-10 ring-1 ring-blue-500/20 shadow-[0_2px_20px_rgba(0,0,0,0.4)] max-w-md w-full">
              <div className="w-10 h-10 rounded-lg bg-blue-500 mb-6" />
              <h2 className="text-xl font-semibold tracking-tight leading-tight text-white mb-2">
                Welcome to VitalWatch
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Start by logging your first health metrics to get personalized insights, risk scores, and recommendations.
              </p>
              <Link
                to="/metrics"
                className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Log your first metrics
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* AI Health Summary */}
            {(summary || summaryLoading) && (
              <div className="bg-slate-900 border border-slate-800 border-l-2 border-l-blue-500 rounded-xl px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
                <p className="text-xs text-blue-400 font-medium uppercase tracking-widest mb-2">AI Health Summary</p>
                {summaryLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Generating your summary…
                  </div>
                ) : (
                  <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
                )}
                <p className="text-xs text-slate-500 mt-3">AI-generated summary for guidance only</p>
              </div>
            )}

            {/* Recommended Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 ring-1 ring-blue-500/20 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
              <h2 className="font-semibold tracking-tight text-white mb-4">Recommended Actions</h2>
              {recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">You&apos;re on track — no recommendations right now.</p>
              ) : (
                <ul className="space-y-3">
                  {recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={rec.id} className="flex items-start justify-between gap-4">
                      <div>
                        {idx === 0 && (
                          <p className="text-xs text-blue-400 mb-1">Most important right now</p>
                        )}
                        <p className="text-sm text-white">{rec.message}</p>
                        <p className="text-xs text-slate-600 mt-1">{relativeTime(rec.created_at)}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium uppercase tracking-wide mt-0.5 ${
                        rec.priority === 1 ? 'text-red-400'
                        : rec.priority === 2 ? 'text-yellow-400'
                        : 'text-slate-400'
                      }`}>
                        {rec.priority === 1 ? 'High' : rec.priority === 2 ? 'Medium' : 'Low'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

              {/* Overall Risk */}
              <div className="col-span-1 md:col-span-2 bg-slate-900/95 border border-slate-800 border-t border-t-blue-500/30 rounded-xl p-4 sm:p-6 lg:p-8 ring-1 ring-blue-500/20 shadow-lg shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800/60 transition-all duration-200">
                <p className="text-slate-500 text-sm mb-6">Overall Risk</p>
                {risk ? (
                  <div className="space-y-6">
                    <div>
                      <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight ${riskColor(risk.overall_risk)}`}>
                        {risk.overall_risk}%
                      </p>
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed">{riskSubtext(risk.overall_risk)}</p>
                      {risk.confidence && (
                        <p className="text-xs text-slate-400 mt-1">
                          Confidence:{' '}
                          <span className={`font-medium capitalize ${confidenceColor(risk.confidence)}`}>
                            {risk.confidence}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${riskBarColor(risk.overall_risk)}`}
                        style={{ width: `${risk.overall_risk}%` }}
                      />
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Stroke Risk',       value: risk.stroke_risk },
                        { label: 'Diabetes Risk',     value: risk.diabetes_risk },
                        { label: 'Hypertension Risk', value: risk.hypertension_risk },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{label}</span>
                            <span className={riskColor(value)}>{value}%</span>
                          </div>
                          <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${riskBarColor(value)}`}
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-400 leading-relaxed">No risk data yet. Submit your first metrics to see your risk scores.</p>
                    <Link
                      to="/metrics"
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]"
                    >
                      Log your first metrics
                    </Link>
                  </div>
                )}
              </div>

              {/* Latest Activity */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-all duration-200">
                <h2 className="font-semibold tracking-tight text-white mb-6">Latest Activity</h2>
                {lastMetric ? (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Systolic BP</span>
                      <span className="text-white">{lastMetric.systolic_bp} mmHg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Diastolic BP</span>
                      <span className="text-white">{lastMetric.diastolic_bp} mmHg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Blood Glucose</span>
                      <span className="text-white">{lastMetric.blood_glucose} mg/dL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Heart Rate</span>
                      <span className="text-white">{lastMetric.heart_rate} bpm</span>
                    </div>
                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                      {new Date(lastMetric.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No metrics logged yet.</p>
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-all duration-200">
                <h2 className="font-semibold tracking-tight text-white mb-4">Insights</h2>
                {insights.length === 0 ? (
                  <p className="text-sm text-slate-500">No insights yet — log more data to get personalized feedback.</p>
                ) : (
                  <ul className="space-y-2">
                    {[...insights]
                      .sort((a, b) => (a.type === 'trend' ? -1 : 1) - (b.type === 'trend' ? -1 : 1))
                      .slice(0, 3)
                      .map((insight) => {
                        const isWorsening = insight.type === 'trend' && insight.message.toLowerCase().includes('worsen')
                        const isImproving = insight.type === 'trend' && !isWorsening
                        const prefix = isImproving ? '📈 ' : isWorsening ? '📉 ' : ''
                        return (
                          <li key={insight.id} className="flex items-start gap-2.5">
                            {insight.type === 'condition' && (
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            )}
                            <div>
                              <p className="text-sm text-slate-300 leading-relaxed">{prefix}{insight.message}</p>
                              {INSIGHT_HINTS[insight.message] && (
                                <p className="text-xs text-slate-500 mt-0.5">{INSIGHT_HINTS[insight.message]}</p>
                              )}
                              <p className="text-xs text-slate-600 mt-1">{relativeTime(insight.created_at)}</p>
                            </div>
                          </li>
                        )
                      })}
                  </ul>
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

              {/* Metrics Trend */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-all duration-200">
                <h2 className="font-semibold tracking-tight text-white mb-6">Metrics Trend</h2>
                {metrics.length === 0 ? (
                  <p className="text-sm text-slate-400">Submit health metrics to see trends.</p>
                ) : (
                  <p className="text-sm text-slate-400">{metrics.length} entries recorded.</p>
                )}
              </div>

              {/* Recent Alerts */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-all duration-200">
                <h2 className="font-semibold tracking-tight text-white mb-6">Recent Alerts</h2>
                {recentAlerts.length === 0 ? (
                  <p className="text-sm text-slate-500">No alerts at the moment.</p>
                ) : (
                  <ul className="space-y-3">
                    {recentAlerts.map((alert) => (
                      <li
                        key={alert.id}
                        className="text-sm px-2 py-2 -mx-2 rounded-lg border-b border-slate-800 last:border-0 hover:bg-slate-700/50 cursor-pointer transition-all duration-200"
                      >
                        <p className="text-white">{alert.message}</p>
                        <p className="text-xs mt-1 capitalize text-slate-500">{alert.severity}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}

        <p className="text-xs text-slate-500 mt-6">
          VitalWatch provides guidance based on your inputs and is not a substitute for professional medical advice.
        </p>
      </div>
    </AppLayout>
  )
}
