import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminOverview, getSession } from '../../api.js'
import s from './AdminHome.module.css'

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
    { label: 'Issue Certificate', sub: 'Create a certificate and anchor it on the ledger', icon: 'IC', path: '/admin/issue', accent: '#C9A84C' },
    { label: 'Manage Students', sub: 'Provision and archive student accounts', icon: 'MS', path: '/admin/students', accent: '#2DD4BF' },
    { label: 'All Certificates', sub: 'Review certificate records and PDF documents', icon: 'AC', path: '/admin/certificates', accent: '#818CF8' },
    { label: 'Verify Certificate', sub: 'Run blockchain and AI verification checks', icon: 'VC', path: '/admin/verify', accent: '#34D399' },
  ]

  return (
    <div className={s.root}>
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>
          Failed to load overview: {error}
        </div>
      )}
      <div className={s.header}>
        <div>
          <h1>Welcome back, <em>{session?.name}</em></h1>
          <p>Academic certificate control center</p>
        </div>
        <div className={s.date}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statNum}>{overview.metrics.certificatesIssued}</span>
          <span className={s.statLabel}>Certificates issued</span>
          <span className={`badge badge-green ${s.statBadge}`}>Ledger ready</span>
        </div>
        <div className={s.stat}>
          <span className={s.statNum}>{overview.metrics.studentsActive}</span>
          <span className={s.statLabel}>Active student accounts</span>
          <span className={`badge badge-teal ${s.statBadge}`}>{overview.metrics.studentsTotal} total</span>
        </div>
        <div className={s.stat}>
          <span className={s.statNum}>{overview.metrics.verificationChecks}</span>
          <span className={s.statLabel}>Verification checks logged</span>
          <span className={`badge ${overview.metrics.chainHealthy ? 'badge-gold' : 'badge-red'} ${s.statBadge}`}>
            {overview.metrics.chainHealthy ? 'Chain healthy' : 'Review chain'}
          </span>
        </div>
      </div>

      <h2 className={s.sectionTitle}>Quick Actions</h2>
      <div className={s.actions}>
        {actions.map(action => (
          <button
            key={action.path}
            className={s.actionCard}
            onClick={() => nav(action.path)}
            style={{ '--accent': action.accent }}
          >
            <span className={s.actionIcon}>{action.icon}</span>
            <div>
              <div className={s.actionLabel}>{action.label}</div>
              <div className={s.actionSub}>{action.sub}</div>
            </div>
            <svg className={s.arrow} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </button>
        ))}
      </div>

      <h2 className={s.sectionTitle}>Recently Issued</h2>
      <div className={s.recentList}>
        {overview.recentCertificates.length === 0 ? (
          <div className={s.recentRow}>
            <div className={s.recentName}>No certificates have been issued yet.</div>
          </div>
        ) : (
          overview.recentCertificates.map(certificate => (
            <div key={certificate.id} className={s.recentRow}>
              <div className={s.recentLeft}>
                <div className={s.recentId}>{certificate.id}</div>
                <div className={s.recentName}>
                  {certificate.studentName} | Block {certificate.blockNumber} | {certificate.degree}
                </div>
              </div>
              <div className={s.recentRight}>
                <span className="badge badge-green">Issued</span>
                <span className={s.recentDate}>{new Date(certificate.issuedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <h2 className={s.sectionTitle} style={{ marginTop: 28 }}>Verification Activity</h2>
      <div className={s.recentList}>
        {overview.recentVerifications.length === 0 ? (
          <div className={s.recentRow}>
            <div className={s.recentName}>No verification events have been logged yet.</div>
          </div>
        ) : (
          overview.recentVerifications.map(entry => (
            <div key={entry.id} className={s.recentRow}>
              <div className={s.recentLeft}>
                <div className={s.recentId}>{entry.mode === 'upload' ? 'Upload analysis' : 'Certificate ID lookup'}</div>
                <div className={s.recentName}>
                  {entry.certificateId || entry.fileName || 'Unknown input'} | confidence {entry.confidence}%
                </div>
              </div>
              <div className={s.recentRight}>
                <span className={`badge ${entry.authentic ? 'badge-green' : 'badge-red'}`}>
                  {entry.authentic ? 'Pass' : 'Alert'}
                </span>
                <span className={s.recentDate}>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
