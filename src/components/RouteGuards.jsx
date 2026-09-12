import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function RequireAuth() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireTeacher() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'teacher') return <Navigate to="/student" replace />
  return <Outlet />
}

export function RequireStudent() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'student') return <Navigate to="/teacher" replace />
  return <Outlet />
}

export function HomeRedirect() {
  const { currentUser } = useAuth()
  const target = currentUser
    ? currentUser.role === 'teacher'
      ? '/teacher'
      : '/student'
    : '/login'
  return <Navigate to={target} replace />
}

export function GuestsOnly() {
  const { currentUser } = useAuth()
  if (currentUser) {
    return <Navigate to={currentUser.role === 'teacher' ? '/teacher' : '/student'} replace />
  }
  return <Outlet />
}