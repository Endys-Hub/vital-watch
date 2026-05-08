import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import { AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react'

function alertCardClass(severity) {
  if (severity === 'high')   return 'bg-slate-900 border border-slate-800 border-l-4 border-l-red-500'
  if (severity === 'medium') return 'bg-slate-900 border border-slate-800 border-l-4 border-l-yellow-400'
  return 'bg-slate-900 border border-slate-800 border-l-4 border-l-slate-600'
}

function severityBadge(severity) {
  if (severity === 'high')   return 'bg-red-500/10 text-red-400'
  if (severity === 'medium') return 'bg-yellow-500/10 text-yellow-400'
  return 'bg-slate-700 text-slate-400'
}

function alertIcon(severity) {
  if (severity === 'high')   return <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
  if (severity === 'medium') return <Info className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
  return <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SkeletonAlert() {
  return (
    <Card className="animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-4 h-4 bg-slate-700 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-700 rounded w-4/5" />
          <div className="h-2.5 bg-slate-700 rounded w-2/5" />
        </div>
        <div className="w-14 h-5 bg-slate-700 rounded-full shrink-0" />
      </div>
    </Card>
  )
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/alerts/')
      .then((res) => setAlerts(res.data))
      .catch(() => setError('Failed to load alerts. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all'
    ? alerts
    : alerts.filter((a) => a.severity === filter)

  const counts = {
    all: alerts.length,
    high: alerts.filter((a) => a.severity === 'high').length,
    medium: alerts.filter((a) => a.severity === 'medium').length,
  }

  return (
    <AppLayout>
      <div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Health Alerts</h1>
            <p className="text-sm text-slate-400">
              {alerts.length > 0
                ? `${alerts.length} alert${alerts.length === 1 ? '' : 's'} total`
                : 'Your risk-triggered notifications'}
            </p>
          </div>

          {alerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all',    label: 'All',    count: counts.all    },
                { key: 'high',   label: 'High',   count: counts.high   },
                { key: 'medium', label: 'Medium', count: counts.medium },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                    filter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                      filter === key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <SkeletonAlert key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="text-center py-12">
            <CheckCircle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-white text-sm font-medium mb-1">
              {filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}
            </p>
            <p className="text-slate-500 text-xs mb-4">
              {filter === 'all'
                ? 'Alerts appear when your risk scores cross critical thresholds.'
                : 'Try switching to a different filter.'}
            </p>
            {filter === 'all' && (
              <Link to="/metrics" className="text-sm font-medium text-blue-400 hover:underline">
                Log health metrics →
              </Link>
            )}
          </Card>
        ) : (
          <ul className="space-y-3">
            {filtered.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-lg overflow-hidden transition-colors duration-150 hover:brightness-110 ${alertCardClass(alert.severity)}`}
              >
                <div className="flex items-start gap-3 pl-4 pr-4 py-4">
                  {alertIcon(alert.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <p className="flex-1 text-sm text-white leading-snug font-medium">{alert.message}</p>
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${severityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(alert.created_at)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}
