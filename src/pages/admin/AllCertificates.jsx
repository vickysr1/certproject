import { Fragment, useEffect, useState } from 'react'
import { getCertificates, openCertificateDocument } from '../../api.js'
import s from './AllCertificates.module.css'

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
    <div className={s.root}>
      <div className={s.header}>
        <div>
          <h1>All Certificates</h1>
          <p>{certificates.length} certificate{certificates.length !== 1 ? 's' : ''} registered on the private ledger</p>
        </div>
        <input className={s.search} type="text" placeholder="Search by name, ID, degree..." value={search} onChange={event => setSearch(event.target.value)} />
      </div>

      <div className={s.tableWrap}>
        {loading ? (
          <div className={s.empty}><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>{search ? 'No results found.' : 'No certificates issued yet.'}</div>
        ) : (
          <table className={s.table}>
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
                  <tr className={expanded === certificate.id ? s.expandedRow : ''}>
                    <td><span className={s.certId}>{certificate.id}</span></td>
                    <td>{certificate.studentName}<br /><span className={s.sub}>{certificate.studentId}</span></td>
                    <td>{certificate.degree}<br /><span className={s.sub}>{certificate.branch}</span></td>
                    <td>{certificate.year}</td>
                    <td className={s.grade}>{certificate.grade}</td>
                    <td><span className="badge badge-green">Issued</span></td>
                    <td>
                      <button className={s.expandBtn} onClick={() => setExpanded(expanded === certificate.id ? null : certificate.id)}>
                        {expanded === certificate.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expanded === certificate.id && (
                    <tr className={s.detailRow}>
                      <td colSpan={7}>
                        <div className={s.detail}>
                          <div className={s.detailItem}><span>Institution</span>{certificate.institution}</div>
                          <div className={s.detailItem}><span>Issued</span>{new Date(certificate.issuedAt).toLocaleString()}</div>
                          <div className={s.detailItem}><span>Block</span>{certificate.blockNumber}</div>
                          <div className={s.detailItem}><span>Transaction</span>{certificate.transactionId}</div>
                          <div className={s.detailItem} style={{ flexDirection: 'column', gap: 4 }}>
                            <span>Blockchain Hash</span>
                            <code className={s.hash}>{certificate.blockchainHash}</code>
                          </div>
                          <div className={s.detailItem} style={{ paddingTop: 10 }}>
                            <button className={s.expandBtn} onClick={() => openCertificateDocument(certificate.id)}>
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
