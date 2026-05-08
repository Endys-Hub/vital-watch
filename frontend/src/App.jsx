import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'

import LandingPage from './pages/LandingPage'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MetricsPage from './pages/MetricsPage'
import AlertsPage from './pages/AlertsPage'
import DoctorDashboardPage from './pages/DoctorDashboardPage'
import PatientDetailPage from './pages/PatientDetailPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/metrics" element={
            <ProtectedRoute><MetricsPage /></ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute><AlertsPage /></ProtectedRoute>
          } />

          <Route path="/doctor" element={
            <ProtectedRoute requiredRole="doctor"><DoctorDashboardPage /></ProtectedRoute>
          } />
          <Route path="/doctor/patient/:id" element={
            <ProtectedRoute requiredRole="doctor"><PatientDetailPage /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
