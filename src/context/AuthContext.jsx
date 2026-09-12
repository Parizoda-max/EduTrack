import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useData } from './DataContext.jsx'

const AuthContext = createContext(null)
const SESSION_KEY = 'edutrack_session'

export function AuthProvider({ children }) {
  const { users } = useData()
  const [currentUserId, setCurrentUserId] = useState(
    () => localStorage.getItem(SESSION_KEY) || null,
  )

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId],
  )

  const login = useCallback(
    (username, password) => {
      const u = username.trim().toLowerCase()
      const user = users.find(
        (cand) => cand.username.toLowerCase() === u && cand.password === password,
      )
      if (!user) {
        return { ok: false, error: 'Incorrect username or password.' }
      }
      localStorage.setItem(SESSION_KEY, user.id)
      setCurrentUserId(user.id)
      return { ok: true, user }
    },
    [users],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setCurrentUserId(null)
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}