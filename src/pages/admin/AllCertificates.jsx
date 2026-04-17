import { Fragment, useEffect, useState } from 'react'
import { getCertificates, openCertificateDocument } from '../../api.js'

export default function AllCertificates() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getCertificates().then(items => {
      setCertificates(items)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = certificates.filter(certificate =>
    certificate.id.toLowerCase().includes(search.toLowerCase()) ||
    certificate.studentName.toLowerCase().includes(search.toLowerCase()) ||
    certificate.degree.toLowerCase().includes(search.toLowerCase()) ||
    certificate.branch.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="cert-root">
      <div className="cert-header">
        <div>
          <h1>All Certificates</h1>
          <p>{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} registered on the private ledger</p>
        </div>
        <input className="cert-search" type="text" placeholder="Search by name, ID, degree..." value={search} onChange={event => setSearch(event.target.value)} />
      </div>

      <div className="cert-tableWrap">
        {loading ? (
          <div className="cert-empty"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="cert-empty">{search ? 'No results found.' : 'No certificates issued yet.'}</div>
        ) : (
          <table className="cert-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student</th>
                <th>Degree</th>
                <th>Year</th>
                <th>Grade</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(certificate => (
                <Fragment key={certificate.id}>
                  <tr className={expanded === certificate.id ? 'cert-expandedRow' : ''}>
                    <td><span className="cert-certId">{certificate.id}</span></td>
                    <td>{certificate.studentName}<br /><span className="cert-sub">{certificate.studentId}</span></td>
                    <td>{certificate.degree}<br /><span className="cert-sub">{certificate.branch}</span></td>
                    <td>{certificate.year}</td>
                    <td className="cert-grade">{certificate.grade}</td>
                    <td><span className="badge badge-green">Issued</span></td>
                    <td>
                      <button className="cert-expandBtn" onClick={() => setExpanded(expanded === certificate.id ? null : certificate.id)}>
                        {expanded === certificate.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === certificate.id && (
                    <tr className="cert-detailRow">
                      <td colSpan={7}>
                        <div className="cert-detail">
                          <div className="cert-detailItem"><span>Institution</span>{certificate.institution}</div>
                          <div className="cert-detailItem"><span>Issued</span>{new Date(certificate.issuedAt).toLocaleString()}</div>
                          <div className="cert-detailItem"><span>Block</span>{certificate.blockNumber}</div>
                          <div className="cert-detailItem"><span>Transaction</span>{certificate.transactionId}</div>
                          <div className="cert-detailItem cert-detailFull">
                            <span>Blockchain Hash</span>
                            <code className="cert-hash">{certificate.blockchainHash}</code>
                          </div>
                          <div className="cert-detailItem cert-detailFull">
                            <button className="cert-expandBtn" onClick={() => openCertificateDocument(certificate.id)}>
                              Open PDF
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
