import { useEffect, useState } from 'react'
import { getCertificates, getSession, openCertificateDocument } from '../../api.js'
import s from './MyCertificates.module.css'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function MyCertificates() {
  const session = getSession()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getCertificates(session?.id).then(items => {
      setCertificates(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [session?.id])

  if (loading) {
    return (
      <div className={s.root}>
        <div className={s.center}><span className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <div>
          <h1>My Certificates</h1>
          <p>Blockchain registered academic credentials for <strong>{session?.name}</strong></p>
        </div>
        <span className="badge badge-gold">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''}</span>
      </div>

      {certificates.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>[]</div>
          <div className={s.emptyTitle}>No certificates yet</div>
          <div className={s.emptySub}>Your institution will publish certificates here after they are issued and anchored on the ledger.</div>
        </div>
      ) : (
        <div className={s.list}>
          {certificates.map(certificate => (
            <div key={certificate.id} className={`${s.card} ${expanded === certificate.id ? s.open : ''}`}>
              <div className={s.cardTop} onClick={() => setExpanded(expanded === certificate.id ? null : certificate.id)}>
                <div className={s.cardLeft}>
                  <div className={s.cardId}>{certificate.id}</div>
                  <div className={s.cardDegree}>{certificate.degree}</div>
                  <div className={s.cardSub}>{certificate.branch} | {certificate.institution}</div>
                </div>
                <div className={s.cardRight}>
                  <span className="badge badge-green">Issued</span>
                  <span className={s.year}>{certificate.year}</span>
                  <svg className={`${s.chevron} ${expanded === certificate.id ? s.chevronOpen : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
              </div>

              {expanded === certificate.id && (
                <div className={s.detail}>
                  <div className={s.detailGrid}>
                    <Cell label="Grade" value={certificate.grade} />
                    <Cell label="Year" value={certificate.year} />
                    <Cell label="Issued" value={new Date(certificate.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <Cell label="Status" value="Validated on ledger" green />
                  </div>

                  <div className={s.qrSection}>
                    <div className={s.qrInfo}>
                      <h3>Scan to Verify</h3>
                      <p>Share this QR code with employers or institutions. It links to a public, real-time blockchain verification page.</p>
                      <div className={s.actions}>
                        <button className={s.actionBtn} onClick={() => navigator.clipboard?.writeText(certificate.id)}>
                          Copy ID
                        </button>
                         <button className={s.actionBtn} onClick={() => openCertificateDocument(certificate.id)}>
                          Open PDF
                        </button>
                      </div>
                    </div>
                    <div className={s.qrCode}>
                      <img 
                        src={`${API_URL}/api/certificates/qrcode/${certificate.id}`} 
                        alt="Verification QR Code" 
                        loading="lazy" 
                      />
                    </div>
                  </div>

                  <div className={s.hashBox}>
                    <div className={s.hashLabel}>
                      <span>Blockchain hash</span>
                      <span className="badge badge-teal">Private ledger</span>
                    </div>
                    <div className={s.hashVal}>{certificate.blockchainHash}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={s.notice}>
        <span>INFO</span>
        <span>Share your certificate ID with any verifier to confirm issuance against the blockchain ledger and run the AI forgery workflow.</span>
      </div>
    </div>
  )
}

function Cell({ label, value, green }) {
  return (
    <div className={s.cell}>
      <div className={s.cellLabel}>{label}</div>
      <div className={s.cellValue} style={green ? { color: 'var(--green)' } : {}}>{value}</div>
    </div>
  )
}
