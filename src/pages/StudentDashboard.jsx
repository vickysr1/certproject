import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import MyCertificates from './student/MyCertificates.jsx'
import VerifyCertificate from './shared/VerifyCertificate.jsx'

const NAV = [
  { path: '/student', icon: 'MC', label: 'My Certificates' },
  { path: '/student/verify', icon: 'VC', label: 'Verify Certificate' },
]

export default function StudentDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<MyCertificates />} />
        <Route path="verify" element={<VerifyCertificate />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </Layout>
  )
}
