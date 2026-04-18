import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import AdminHome from './admin/AdminHome.jsx'
import ManageStudents from './admin/ManageStudents.jsx'
import IssueCertificate from './admin/IssueCertificate.jsx'
import AllCertificates from './admin/AllCertificates.jsx'
import VerifyCertificate from './shared/VerifyCertificate.jsx'

const NAV = [
  { path: '/admin', icon: 'OV', label: 'Overview' },
  { path: '/admin/issue', icon: 'IC', label: 'Issue Certificate' },
  { path: '/admin/students', icon: 'MS', label: 'Manage Students' },
  { path: '/admin/certificates', icon: 'AC', label: 'All Certificates' },
  { path: '/admin/verify', icon: 'VC', label: 'Verify Certificate' },
]

export default function AdminDashboard() {
  return (
    <Layout navItems={NAV}>
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="issue" element={<IssueCertificate />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="certificates" element={<AllCertificates />} />
        <Route path="verify" element={<VerifyCertificate />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Layout>
  )
}
