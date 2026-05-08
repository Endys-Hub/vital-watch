import { Link } from 'react-router-dom'
import { Heart, BarChart3, Zap, Bell, TrendingUp, FileText, AlertTriangle } from 'lucide-react'

const features = [
  {
    icon: <Heart className="w-5 h-5" />,
    title: 'Hypertension Risk',
    description: 'Track blood pressure trends and get early warnings before hypertension becomes a crisis.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Diabetes Monitoring',
    description: 'Monitor glucose and lifestyle factors that drive diabetes risk over time.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Stroke Prevention',
    description: 'Early stroke risk detection based on your unique vitals and health profile.',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Instant Alerts',
    description: 'Get notified the moment your risk scores cross critical thresholds.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Trend Analysis',
    description: 'Visualize blood pressure and glucose trends over time to spot patterns early.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Simple Logging',
    description: 'Enter vitals and lifestyle data in seconds. No medical training required.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Log your health data',
    description: 'Enter blood pressure, glucose, heart rate, sleep, and lifestyle metrics.',
  },
  {
    number: '02',
    title: 'Get instant risk scores',
    description: 'Our engine calculates risk scores for hypertension, diabetes, and stroke in real time.',
  },
  {
    number: '03',
    title: 'Act on insights',
    description: 'Review personalized alerts, track trends, and stay ahead of potential complications.',
  },
]

function MockRiskCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 border-t-2 border-t-green-500/50 rounded-xl p-6 shadow-[0_2px_40px_rgba(0,0,0,0.6)] w-full max-w-sm">
      <p className="text-slate-500 text-xs mb-5 uppercase tracking-widest font-medium">Overall Risk</p>

      <p className="text-5xl font-bold tracking-tight text-green-400 mb-1">28%</p>
      <p className="text-slate-400 text-sm mb-5">Risk levels are stable</p>

      <div className="bg-slate-800 h-2 rounded-full overflow-hidden mb-6">
        <div className="h-full w-[28%] rounded-full bg-green-500" />
      </div>

      <div className="space-y-3">
        {[
          { label: 'Stroke Risk',       value: 18, color: 'bg-green-500', text: 'text-green-400' },
          { label: 'Diabetes Risk',     value: 32, color: 'bg-green-500', text: 'text-green-400' },
          { label: 'Hypertension Risk', value: 41, color: 'bg-yellow-400', text: 'text-yellow-400' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">{label}</span>
              <span className={text}>{value}%</span>
            </div>
            <div className="bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800">
        <p className="text-xs text-blue-400 font-medium mb-1">AI Health Summary</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your health metrics are looking stable overall. Keep up with your current activity levels and monitor your blood pressure regularly.
        </p>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">Vital Watch</span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-400 hover:text-slate-100 px-3 py-2 rounded-lg transition-colors duration-150"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-150"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="py-12 sm:py-16 lg:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

              {/* Left: copy */}
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full block" />
                  Real-time health risk analysis
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white leading-tight">
                  Know your health risks
                  <br />
                  <span className="text-blue-400">before they become emergencies</span>
                </h1>

                <p className="text-lg text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Vital Watch analyzes your vitals and lifestyle data to detect early warning signs
                  and help you act before complications occur.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors duration-150 shadow-lg shadow-blue-500/20 text-center"
                  >
                    Start monitoring free
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto px-6 py-3 rounded-lg border border-slate-700 text-slate-300 font-semibold text-sm hover:text-white hover:border-slate-600 transition-colors duration-150 text-center"
                  >
                    Sign in
                  </Link>
                </div>

                <p className="text-xs text-slate-600">Built for continuous health monitoring · No medical training required</p>
              </div>

              {/* Right: mock dashboard card */}
              <div className="flex justify-center lg:justify-end mt-4 lg:mt-0">
                <MockRiskCard />
              </div>

            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="py-14 px-4 bg-slate-900">
          <div className="max-w-3xl mx-auto">
            <div className="border border-slate-800 rounded-xl text-center py-10 px-6">
              <div className="inline-flex items-center gap-2 text-red-400 font-semibold text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                The Problem
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-slate-100 leading-snug max-w-xl mx-auto">
                Many serious conditions develop silently. By the time symptoms appear, it may already be
                too late to prevent serious complications.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-100">
                Comprehensive health monitoring
              </h2>
              <p className="mt-3 text-slate-500 max-w-lg mx-auto">
                Everything you need to stay ahead of your health risks, in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {features.map(({ icon, title, description }) => (
                <div key={title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.4)] hover:bg-slate-800 transition-colors duration-200">
                  <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center mb-4">
                    {icon}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-1.5">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 bg-slate-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-100 mb-3">How it works</h2>
            <p className="text-slate-500 mb-12">Get meaningful insights in minutes. No medical background needed.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map(({ number, title, description }) => (
                <div key={number} className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
                  <div className="text-4xl font-bold text-blue-500 mb-4 tracking-tight">{number}</div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 bg-slate-950">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-12 shadow-[0_2px_40px_rgba(0,0,0,0.6)]">
              <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">
                Start protecting your health today
              </h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Take a proactive approach to your health. Early detection changes outcomes.
              </p>
              <Link
                to="/register"
                className="inline-block px-8 py-3.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors duration-150 shadow-lg shadow-blue-500/20"
              >
                Create your free account
              </Link>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0">
              <Heart className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-300">Vital Watch</span>
          </div>
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Vital Watch. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 text-center">For informational purposes only. Not medical advice.</p>
        </div>
      </footer>

    </div>
  )
}
