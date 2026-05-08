import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axiosInstance'
import AppLayout from '../components/layout/AppLayout'


function riskColor(score) {
  if (score >= 70) return 'text-red-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-green-400'
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


export default function PatientDetailPage() {
  const { id }                    = useParams()
  const [patient, setPatient]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    api.get(`/doctor/patients/${id}/`)
      .then((res) => setPatient(res.data))
      .catch(() => setError('Failed to load patient data.'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <AppLayout>
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/doctor" className="text-slate-500 hover:text-white text-sm transition-colors duration-200">
            ← Patients
          </Link>
        </div>

        {error && (
          <p className="text-sm mb-6 border border-slate-800 rounded-xl p-4 text-slate-400">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : patient && (
          <div className="space-y-8">

            {/* Patient header */}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight leading-tight text-white">
                {patient.email}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Age {patient.age} · {patient.gender}
              </p>
            </div>

            {/* Risk trend */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
              <h2 className="font-semibold tracking-tight text-white mb-4">Risk Trend</h2>
              {patient.risk_history.length === 0 ? (
                <p className="text-sm text-slate-500">No risk data recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {patient.risk_history.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className={`font-medium ${riskColor(r.overall_risk)}`}>
                        {r.overall_risk}% overall
                      </span>
                      <div className="flex flex-wrap gap-4 sm:gap-6 text-slate-500">
                        <span>Stroke {r.stroke_risk}%</span>
                        <span>Diabetes {r.diabetes_risk}%</span>
                        <span>BP {r.hypertension_risk}%</span>
                        <span className="text-slate-600">{relativeTime(r.timestamp)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Insights */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
                <h2 className="font-semibold tracking-tight text-white mb-4">Insights</h2>
                {patient.insights.length === 0 ? (
                  <p className="text-sm text-slate-500">No insights yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {patient.insights.slice(0, 5).map((insight) => (
                      <li key={insight.id} className="flex items-start gap-2.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm text-slate-300 leading-relaxed">{insight.message}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{relativeTime(insight.created_at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Alerts */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
                <h2 className="font-semibold tracking-tight text-white mb-4">Alerts</h2>
                {patient.alerts.length === 0 ? (
                  <p className="text-sm text-slate-500">No alerts.</p>
                ) : (
                  <ul className="space-y-3">
                    {patient.alerts.slice(0, 5).map((alert) => (
                      <li key={alert.id} className="text-sm border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                        <p className="text-white">{alert.message}</p>
                        <p className="text-xs mt-0.5 capitalize text-slate-500">{alert.severity}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
              <h2 className="font-semibold tracking-tight text-white mb-4">Recommendations</h2>
              {patient.recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">No recommendations.</p>
              ) : (
                <ul className="space-y-3">
                  {patient.recommendations.map((rec) => (
                    <li key={rec.id} className="flex items-start justify-between gap-4">
                      <p className="text-sm text-slate-300">{rec.message}</p>
                      <span className={`shrink-0 text-xs font-medium uppercase tracking-wide ${
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

          </div>
        )}
      </main>
    </AppLayout>
  )
}
