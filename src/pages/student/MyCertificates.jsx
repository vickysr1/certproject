import { useEffect, useState } from 'react'
import { getCertificates, getSession, openCertificateDocument, BASE_URL } from '../../api.js'

export default function MyCertificates() {
  const session = getSession()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [qrModal, setQrModal] = useState(null)

  useEffect(() => {
    getCertificates(session?.id).then(items => {
      setCertificates(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [session?.id])

  if (loading) {
    return (
      <div className="mycert-root">
        <div className="mycert-center"><span className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="mycert-root">
      <div className="mycert-header">
        <div>
          <h1>My Certificates</h1>
          <p>Blockchain registered academic credentials for <strong>{session?.name}</strong></p>
        </div>
        <span className="badge badge-gold">{certificates.length} certificate{certificates.length !== 1 ? 's' : ''}</span>
      </div>

      {certificates.length === 0 ? (
        <div className="mycert-empty">
          <div className="mycert-emptyIcon">[]</div>
          <div className="mycert-emptyTitle">No certificates yet</div>
          <div className="mycert-emptySub">Your institution will publish certificates here after they are issued and anchored on the ledger.</div>
        </div>
      ) : (
        <div className="mycert-list">
          {certificates.map(certificate => (
            <div key={certificate.id} className={`mycert-card ${expanded === certificate.id ? 'mycert-card open' : ''}`}>
              <div className="mycert-cardTop" onClick={() => setExpanded(expanded === certificate.id ? null : certificate.id)}>
                <div className="mycert-cardLeft">
                  <div className="mycert-cardId">{certificate.id}</div>
                  <div className="mycert-cardDegree">{certificate.degree}</div>
                  <div className="mycert-cardSub">{certificate.branch} | {certificate.institution}</div>
                </div>
                <div className="mycert-cardRight">
                  <span className="badge badge-green">Issued</span>
                  <span className="mycert-year">{certificate.year}</span>
                  <svg className={`mycert-chevron ${expanded === certificate.id ? 'mycert-chevronOpen' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
              </div>

              {expanded === certificate.id && (
                <div className="mycert-detail">
                  <div className="mycert-detailGrid">
                    <Cell label="Grade" value={certificate.grade} />
                    <Cell label="Year" value={certificate.year} />
                    <Cell label="Issued" value={new Date(certificate.issuedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <Cell label="Status" value="Validated on ledger" green />
                  </div>

                  <div className="mycert-qrSection">
                    <div className="mycert-qrInfo">
                      <h3>Scan to Verify</h3>
                      <p>Share this QR code with employers or institutions. It links to a public, real-time blockchain verification page.</p>
                      <div className="mycert-actions">
                        <button className="mycert-actionBtn" onClick={() => navigator.clipboard?.writeText(certificate.id)}>
                          Copy ID
                        </button>
                        <button className="mycert-actionBtn" onClick={() => openCertificateDocument(certificate.id)}>
                          Open PDF
                        </button>
                      </div>
                    </div>
                    <div className="mycert-qrCode">
                      <img 
                        src={`${BASE_URL}/api/certificates/qrcode/${certificate.id}`} 
                        alt="Verification QR Code" 
                        loading="lazy" 
                        onClick={() => setQrModal(certificate.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="mycert-hashBox">
                    <div className="mycert-hashLabel">
                      <span>Blockchain hash</span>
                      <span className="badge badge-teal">Private ledger</span>
                    </div>
                    <div className="mycert-hashVal">{certificate.blockchainHash}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mycert-notice">
        <span>INFO</span>
        <span>Share your certificate ID with any verifier to confirm issuance against the blockchain ledger and run the AI forgery workflow.</span>
      </div>

      {qrModal && (
        <div className="mycert-modalOverlay" onClick={() => setQrModal(null)}>
          <div className="mycert-modalContent" onClick={e => e.stopPropagation()}>
            <button className="mycert-modalClose" onClick={() => setQrModal(null)}>&times;</button>
            <img 
              src={`${BASE_URL}/api/certificates/qrcode/${qrModal}`} 
              alt="Verification QR Code" 
              className="mycert-modalQr"
            />
            <p>Scan to verify certificate</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Cell({ label, value, green }) {
  return (
    <div className="mycert-cell">
      <div className="mycert-cellLabel">{label}</div>
      <div className="mycert-cellValue" style={green ? { color: 'var(--success)' } : {}}>{value}</div>
    </div>
  )
}