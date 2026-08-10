import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => sessionStorage.removeItem('access_token'))
      .finally(() => setLoading(false))
  }, [])

  async function signup(name, email, password) {
    const res = await api.post('/auth/signup', { name, email, password })
    sessionStorage.setItem('access_token', res.data.access_token)
    setUser(res.data.user)
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password })
    sessionStorage.setItem('access_token', res.data.access_token)
    setUser(res.data.user)
  }

  function logout() {
    sessionStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
