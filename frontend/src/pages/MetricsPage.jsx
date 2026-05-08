import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'
import AppLayout from '../components/layout/AppLayout'
import Card from '../components/ui/Card'
import { CheckCircle, AlertCircle } from 'lucide-react'

const INITIAL_FORM = {
  systolic_bp: '',
  diastolic_bp: '',
  heart_rate: '',
  blood_glucose: '',
  sleep_hours: '',
  activity_minutes: '',
  steps: '',
  diet_quality_score: '',
}

const FIELDS = [
  {
    group: 'Vitals',
    items: [
      { name: 'systolic_bp',   label: 'Systolic BP',   type: 'number', placeholder: 'e.g. 120', unit: 'mmHg' },
      { name: 'diastolic_bp',  label: 'Diastolic BP',  type: 'number', placeholder: 'e.g. 80',  unit: 'mmHg' },
      { name: 'heart_rate',    label: 'Heart Rate',    type: 'number', placeholder: 'e.g. 72',  unit: 'bpm'  },
      { name: 'blood_glucose', label: 'Blood Glucose', type: 'number', placeholder: 'e.g. 100', unit: 'mg/dL' },
    ],
  },
  {
    group: 'Lifestyle',
    items: [
      { name: 'sleep_hours',        label: 'Sleep Hours',        type: 'number', placeholder: 'e.g. 7',    unit: 'hrs',   hint: null },
      { name: 'activity_minutes',   label: 'Minutes of Activity', type: 'number', placeholder: 'e.g. 30',   unit: 'min',   hint: '< 20 = low · 20–45 = moderate · > 45 = good' },
      { name: 'steps',              label: 'Steps',              type: 'number', placeholder: 'e.g. 8000', unit: 'steps', hint: 'Optional' },
      { name: 'diet_quality_score', label: 'Diet Quality Score', type: 'number', placeholder: '1 – 10',    unit: '/10',   hint: '1 = poor · 10 = excellent' },
    ],
  },
]

export default function MetricsPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const payload = Object.fromEntries(
      Object.entries(formData)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => [k, Number(v)])
    )

    try {
      await api.post('/metrics/create/', payload)
      setSuccess(true)
      setFormData(INITIAL_FORM)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const first = Object.values(data)[0]
        setError(Array.isArray(first) ? first[0] : 'Submission failed. Check your values.')
      } else {
        setError('Submission failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div>
        <div className="max-w-xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">Log Health Metrics</h1>
            <p className="text-sm text-slate-400">
              Submit your vitals and lifestyle data to generate an updated risk score.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              You can enter only the metrics you have. The system will adapt.
            </p>
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-green-400 text-sm font-semibold">Data submitted successfully.</p>
              </div>
              <p className="text-green-500 text-sm pl-6">
                Your risk score has been updated.{' '}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="underline font-medium hover:text-green-400"
                >
                  View dashboard
                </button>
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {FIELDS.map(({ group, items }) => (
              <Card key={group}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">
                  {group}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(({ name, label, type, placeholder, unit, hint }) => (
                    <div key={name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor={name} className="text-sm font-medium text-slate-300">
                          {label}
                        </label>
                        {unit && (
                          <span className="text-xs text-slate-500">{unit}</span>
                        )}
                      </div>
                      <input
                        id={name}
                        name={name}
                        type={type}
                        min={name === 'activity_level' || name === 'diet_quality_score' ? 1 : undefined}
                        max={name === 'activity_level' || name === 'diet_quality_score' ? 10 : undefined}
                        step="any"
                        value={formData[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      {hint && (
                        <p className="text-xs text-slate-400 mt-1">{hint}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-150"
            >
              {loading ? 'Submitting…' : 'Submit Metrics'}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  )
}
