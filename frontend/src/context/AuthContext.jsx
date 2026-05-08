import { createContext, useContext, useState } from 'react'
import api from '../api/axiosInstance'

const AuthContext = createContext(null)

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null)
  const [role, setRole] = useState(() => {
    const stored = localStorage.getItem('access_token')
    return stored ? (decodeToken(stored).role ?? 'patient') : null
  })

  const login = async (email, password) => {
    const response = await api.post('/auth/token/', { email, password })
    const { access } = response.data
    localStorage.setItem('access_token', access)
    setToken(access)
    setRole(decodeToken(access).role ?? 'patient')
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setToken(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
