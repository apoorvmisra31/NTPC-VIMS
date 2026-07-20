import { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data.data)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch user data (e.g. after profile edit)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/auth/me')
      setUser(data.data)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('token', data.data.token)
    setUser(data.data.user)

    // Role-based routing after login
    const role = data.data.user?.role
    if (role === 'hr_admin') {
      navigate('/hr')
    } else {
      navigate('/dashboard')
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
