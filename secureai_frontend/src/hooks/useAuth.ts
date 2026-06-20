import { useState } from 'react'
import { authApi } from '../api/authApi'

interface AuthUser {
  userId: string
  role: string
  email?: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    localStorage.setItem('token', res.accessToken)
    const u: AuthUser = { userId: res.userId, role: res.role }
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    return res
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAuthenticated = !!localStorage.getItem('token')

  return { user, login, logout, isAuthenticated }
}
