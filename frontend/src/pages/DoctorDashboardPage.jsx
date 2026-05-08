import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import AppLayout from '../components/layout/AppLayout'


function riskColor(score) {
  if (score >= 70) return 'text-red-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-green-400'
}

function riskBorderColor(score) {
  if (score >= 70) return 'border-t-red-500/50'
  if (score >= 50) return 'border-t-yellow-400/50'
  return 'border-t-green-500/50'
}

function riskLabel(score) {
  if (score >= 70) return 'High Risk'
  if (score >= 50) return 'Moderate Risk'
  return 'Stable'
}

function TrendIndicator({ trend }) {
  if (trend === 'up')   return <span className="text-red-400 font-bold">↑</span>
  if (trend === 'down') return <span className="text-green-400 font-bold">↓</span>
  return <span className="text-slate-500">→</span>
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


export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get('/doctor/patients/')
      .then((res) => {
        const sorted = [...res.data].sort((a, b) => {
          const aRisk = a.latest_risk?.overall_risk ?? -1
          const bRisk = b.latest_risk?.overall_risk ?? -1
          return bRisk - aRisk
        })
        setPatients(sorted)
      })
      .catch(() => setError('Failed to load patients.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div>
        <h1 className="text-lg sm:text-2xl font-semibold tracking-tight leading-tight text-white mb-4 sm:mb-8">
          Patient Overview
        </h1>

        {error && (
          <p className="text-sm mb-6 border border-slate-800 rounded-xl p-4 text-slate-400">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : patients.length === 0 ? (
          <p className="text-sm text-slate-500">No patients assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {patients.map((patient) => {
              const risk = patient.latest_risk
              const score = risk?.overall_risk ?? null
              return (
                <Link
                  key={patient.id}
                  to={`/doctor/patient/${patient.id}`}
                  className={`w-full bg-slate-900 border border-slate-800 border-t-2 ${score !== null ? riskBorderColor(score) : 'border-t-slate-800'} rounded-xl p-4 sm:p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-all duration-200 cursor-pointer block`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{patient.email}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Age {patient.age} · {patient.gender}
                      </p>
                    </div>
                    {score !== null && (
                      <span className="text-lg leading-none ml-2 shrink-0">
                        <TrendIndicator trend={patient.risk_trend} />
                      </span>
                    )}
                  </div>

                  {score !== null ? (
                    <>
                      <p className={`text-xl sm:text-2xl font-bold tracking-tight ${riskColor(score)}`}>
                        {score}%
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs font-medium ${riskColor(score)}`}>
                          {riskLabel(score)}
                        </p>
                        <p className="text-xs text-slate-600">
                          Updated {relativeTime(risk.timestamp)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-600 text-xs">No data yet</p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
