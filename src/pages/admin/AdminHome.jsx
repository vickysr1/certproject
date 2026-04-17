import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOverview, getSession } from '../../api.js'

const EMPTY_OVERVIEW = {
  metrics: {
    certificatesIssued: 0,
    studentsTotal: 0,
    studentsActive: 0,
    verificationChecks: 0,
    chainHealthy: false,
  },
  blockchain: {
    network: 'cert-portal-private-ledger',
    validator: 'CertPortal-Ledger-Node-1',
    transactionCount: 0,
    valid: false,
  },
  recentCertificates: [],
  recentVerifications: [],
}

export default function AdminHome() {
  const nav = useNavigate()
  const session = getSession()
  const [overview, setOverview] = useState(EMPTY_OVERVIEW)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminOverview()
      .then(setOverview)
      .catch(err => {
        console.error('Failed to load admin overview:', err)
        setError(err.message)
      })
  }, [])

  const actions = [
    { label: 'Issue Certificate', sub: 'Create a certificate and anchor it on the ledger', icon: 'IC', path: '/admin/issue' },
    { label: 'Manage Students', sub: 'Provision and archive student accounts', icon: 'MS', path: '/admin/students' },
    { label: 'All Certificates', sub: 'Review certificate records and PDF documents', icon: 'AC', path: '/admin/certificates' },
    { label: 'Verify Certificate', sub: 'Run blockchain and AI verification checks', icon: 'VC', path: '/admin/verify' },
  ]

  return (
    <div className="admin-root">
      {error && (
        <div className="admin-errorBox">
          Failed to load overview: {error}
        </div>
      )}
      <div className="admin-header">
        <div>
          <h1>Welcome back, <em>{session?.name}</em></h1>
          <p>Academic certificate control center</p>
        </div>
        <div className="admin-date">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-statNum">{overview.metrics.certificatesIssued}</span>
          <span className="admin-statLabel">Certificates issued</span>
          <span className={`badge badge-green admin-statBadge`}>Ledger ready</span>
        </div>
        <div className="admin-stat">
          <span className="admin-statNum">{overview.metrics.studentsActive}</span>
          <span className="admin-statLabel">Active student accounts</span>
          <span className={`badge badge-teal admin-statBadge`}>{overview.metrics.studentsTotal} total</span>
        </div>
        <div className="admin-stat">
          <span className="admin-statNum">{overview.metrics.verificationChecks}</span>
          <span className="admin-statLabel">Verification checks logged</span>
          <span className={`badge ${overview.metrics.chainHealthy ? 'badge-gold' : 'badge-red'} admin-statBadge`}>
            {overview.metrics.chainHealthy ? 'Chain healthy' : 'Review chain'}
          </span>
        </div>
      </div>

      <h2 className="admin-sectionTitle">Quick Actions</h2>
      <div className="admin-actions">
        {actions.map(action => (
          <button
            key={action.path}
            className="admin-actionCard"
            onClick={() => nav(action.path)}
          >
            <span className="admin-actionIcon">{action.icon}</span>
            <div>
              <div className="admin-actionLabel">{action.label}</div>
              <div className="admin-actionSub">{action.sub}</div>
            </div>
            <svg className="admin-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        ))}
      </div>

      <h2 className="admin-sectionTitle">Recently Issued</h2>
      <div className="admin-recentList">
        {overview.recentCertificates.length === 0 ? (
          <div className="admin-recentRow">
            <div className="admin-recentName">No certificates have been issued yet.</div>
          </div>
        ) : (
          overview.recentCertificates.map(certificate => (
            <div key={certificate.id} className="admin-recentRow">
              <div>
                <div className="admin-recentId">{certificate.id}</div>
                <div className="admin-recentName">
                  {certificate.studentName} | Block {certificate.blockNumber} | {certificate.degree}
                </div>
              </div>
              <div className="admin-recentRight">
                <span className="badge badge-green">Issued</span>
                <span className="admin-recentDate">{new Date(certificate.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className="admin-sectionTitle" style={{ marginTop: 28 }}>Verification Activity</h2>
      <div className="admin-recentList">
        {overview.recentVerifications.length === 0 ? (
          <div className="admin-recentRow">
            <div className="admin-recentName">No verification events have been logged yet.</div>
          </div>
        ) : (
          overview.recentVerifications.map(entry => (
            <div key={entry.id} className="admin-recentRow">
              <div>
                <div className="admin-recentId">{entry.mode === 'upload' ? 'Upload analysis' : 'Certificate ID lookup'}</div>
                <div className="admin-recentName">
                  {entry.certificateId || entry.fileName || 'Unknown input'} | confidence {entry.confidence}%
                </div>
              </div>
              <div className="admin-recentRight">
                <span className={`badge ${entry.authentic ? 'badge-green' : 'badge-red'}`}>
                  {entry.authentic ? 'Pass' : 'Alert'}
                </span>
                <span className="admin-recentDate">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
