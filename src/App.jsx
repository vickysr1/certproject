import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getSession } from './api.js'
import Login from './pages/Login.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import VerifyPage from './pages/shared/VerifyPage.jsx'

function RequireAuth({ children, role }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (role && session.role !== role) return <Navigate to="/" replace />
  return children
}

function RootRedirect() {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  return session.role === 'admin'
    ? <Navigate to="/admin" replace />
    : <Navigate to="/student" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={
          <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
        } />
        <Route path="/student/*" element={
          <RequireAuth role="student"><StudentDashboard /></RequireAuth>
        } />
        <Route path="/verify/:id" element={<VerifyPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
