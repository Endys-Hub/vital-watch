import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Heart, Menu, LayoutDashboard, Activity, Bell, Users, LogOut } from 'lucide-react'

const PATIENT_NAV = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    to: '/metrics',
    label: 'Metrics',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    to: '/alerts',
    label: 'Alerts',
    icon: <Bell className="w-4 h-4" />,
  },
]

const DOCTOR_NAV = [
  {
    to: '/doctor',
    end: true,
    label: 'Patients',
    icon: <Users className="w-4 h-4" />,
  },
]

function SidebarContents({ navItems, headerRight, handleLogout, onNavClick }) {
  return (
    <>
      <div className="h-16 flex items-center px-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 text-white">
            <Heart className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-slate-100 tracking-tight">Vital Watch</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {headerRight && (
          <div className="px-3 py-2 text-xs text-slate-500">{headerRight}</div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  )
}

export default function AppLayout({ children, headerRight }) {
  const { logout, role } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = role === 'doctor' ? DOCTOR_NAV : PATIENT_NAV

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarProps = {
    navItems,
    headerRight,
    handleLogout,
    onNavClick: () => setMenuOpen(false),
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* Desktop sidebar — hidden on small screens */}
      <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 fixed inset-y-0 left-0 z-20 hidden lg:flex flex-col">
        <SidebarContents {...sidebarProps} />
      </aside>

      {/* Mobile overlay drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col lg:hidden">
            <SidebarContents {...sidebarProps} />
          </aside>
        </>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden flex flex-col">

        {/* Mobile header */}
        <header className="lg:hidden h-14 sticky top-0 z-20 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 text-white">
              <Heart className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-100 tracking-tight">Vital Watch</span>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

    </div>
  )
}
