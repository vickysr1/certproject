import { useEffect, useState } from 'react'
import { downloadCertificateDocument, getStudents, issueCertificate, uploadCertificate } from '../../api.js'

const DEGREES = [
  'Bachelor of Engineering',
  'Bachelor of Technology',
  'Bachelor of Science',
  'Master of Engineering',
  'Master of Technology',
  'Master of Science',
  'Master of Business Administration',
  'Doctor of Philosophy',
  'Bachelor of Commerce',
  'Bachelor of Arts',
]

const GRADES = [
  'First Class with Distinction',
  'First Class',
  'Second Class',
  'Pass Class',
]

export default function IssueCertificate() {
  const [students, setStudents] = useState([])
  const [mode, setMode] = useState('generate') // 'generate' or 'upload'
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({
    studentId: '',
    degree: '',
    branch: '',
    institution: 'National Institute of Technology',
    year: new Date().getFullYear().toString(),
    grade: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getStudents().then(setStudents).catch(() => {})
  }, [])

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }))

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)

    try {
      let certificate
      if (mode === 'upload') {
        if (!file) {
          throw new Error('Please select a certificate file to upload.')
        }
        certificate = await uploadCertificate(form, file)
      } else {
        certificate = await issueCertificate(form)
      }
      setResult(certificate)
      setFile(null)
      setForm(current => ({ ...current, studentId: '', degree: '', branch: '', grade: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="issue-root">
      <div className="issue-header">
        <h1>Issue Certificate</h1>
        <p>Create a certificate record, PDF document, and blockchain entry in one flow</p>
      </div>

      <div className="issue-mode-selector">
        <button
          type="button"
          className={`mode-tab ${mode === 'generate' ? 'active' : ''}`}
          onClick={() => { setMode('generate'); setResult(null); setError(''); setFile(null); }}
        >
          Generate Certificate
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => { setMode('upload'); setResult(null); setError(''); }}
        >
          Upload Certificate File
        </button>
      </div>

      <div className="issue-layout">
        <form onSubmit={handleSubmit} className="issue-form">
          <div className="issue-section">Student Details</div>

          <div className="issue-field">
            <label>Student *</label>
            <select required value={form.studentId} onChange={event => setField('studentId', event.target.value)}>
              <option value="">Select student</option>
              {students.filter(student => student.status === 'active').map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.id})
                </option>
              ))}
            </select>
            {students.filter(student => student.status === 'active').length === 0 && (
              <span className="issue-hint">No active students yet. Create one in Manage Students first.</span>
            )}
          </div>

          <div className="issue-section">Academic Details</div>

          <div className="issue-row">
            <div className="issue-field">
              <label>Degree / Programme *</label>
              <select required value={form.degree} onChange={event => setField('degree', event.target.value)}>
                <option value="">Select degree</option>
                {DEGREES.map(degree => <option key={degree}>{degree}</option>)}
              </select>
            </div>
            <div className="issue-field">
              <label>Branch / Specialisation *</label>
              <input type="text" required placeholder="e.g. Computer Science" value={form.branch} onChange={event => setField('branch', event.target.value)} />
            </div>
          </div>

          <div className="issue-row">
            <div className="issue-field">
              <label>Year of Passing *</label>
              <input type="number" required min="2000" max="2035" value={form.year} onChange={event => setField('year', event.target.value)} />
            </div>
            <div className="issue-field">
              <label>Grade / Class *</label>
              <select required value={form.grade} onChange={event => setField('grade', event.target.value)}>
                <option value="">Select grade</option>
                {GRADES.map(grade => <option key={grade}>{grade}</option>)}
              </select>
            </div>
          </div>

          <div className="issue-field">
            <label>Issuing Institution *</label>
            <input type="text" required value={form.institution} onChange={event => setField('institution', event.target.value)} />
          </div>

          {mode === 'upload' && (
            <>
              <div className="issue-section">Document File</div>
              <div className="issue-field">
                <label>Select Certificate File (PDF or Image) *</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    required={mode === 'upload'}
                    onChange={event => setFile(event.target.files[0])}
                  />
                  {file && (
                    <span className="file-info-label">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {error && <p className="issue-error">Error: {error}</p>}

          <button type="submit" className="issue-btn" disabled={loading || (mode === 'upload' && !file)}>
            {loading ? (
              <><span className="spinner" /> {mode === 'upload' ? 'Anchoring & uploading...' : 'Registering on ledger...'}</>
            ) : (
              mode === 'upload' ? 'Upload & Register Certificate' : 'Issue Certificate'
            )}
          </button>
        </form>

        <div className="issue-side">
          <div className="issue-infoBox">
            <div className="issue-infoTitle">Workflow</div>
            <div className="issue-infoStep"><span>1</span> Capture the student and academic details.</div>
            <div className="issue-infoStep"><span>2</span> Generate a unique certificate ID and immutable document hash.</div>
            <div className="issue-infoStep"><span>3</span> Anchor the record on the private blockchain ledger.</div>
            <div className="issue-infoStep"><span>4</span> Render a PDF certificate for download and future checks.</div>
            <div className="issue-infoStep"><span>5</span> Enable blockchain verification and AI forgery analysis.</div>
          </div>

          {result && (
            <div className="issue-success">
              <div className="issue-successIcon">OK</div>
              <div className="issue-successTitle">Certificate issued successfully</div>
              <div className="issue-certCard">
                <Row label="Certificate ID" value={result.id} gold />
                <Row label="Student" value={result.studentName} />
                <Row label="Degree" value={result.degree} />
                <Row label="Branch" value={result.branch} />
                <Row label="Grade" value={result.grade} />
                <Row label="Block Number" value={String(result.blockNumber)} />
              </div>
              <div className="issue-hashBox">
                <div className="issue-hashLabel">Blockchain Hash</div>
                <div className="issue-hash">{result.blockchainHash}</div>
              </div>
              {result.documentAvailable && (
                <button
                  type="button"
                  className="issue-btn"
                  style={{ marginTop: 14 }}
                  onClick={() => downloadCertificateDocument(result.id)}
                >
                  Download PDF Certificate
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, gold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: gold ? 'var(--accent-2)' : 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
