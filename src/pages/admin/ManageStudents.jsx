import { Fragment, useEffect, useState } from 'react'
import { createStudent, deleteStudent, getStudents, getCertificates, issueCertificate, uploadCertificate, openCertificateDocument } from '../../api.js'

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

const INITIAL_FORM = {
  name: '',
  userId: '',
  password: '',
  department: '',
  batch: '',
  rollNumber: '',
}

const INITIAL_ISSUE_FORM = {
  degree: '',
  branch: '',
  institution: 'National Institute of Technology',
  year: new Date().getFullYear().toString(),
  grade: '',
}

export default function ManageStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [archiving, setArchiving] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [studentCerts, setStudentCerts] = useState({})
  const [certsLoading, setCertsLoading] = useState(null)
  const [issueForm, setIssueForm] = useState({})
  const [isUpload, setIsUpload] = useState({})
  const [issueFile, setIssueFile] = useState({})
  const [issueLoading, setIssueLoading] = useState(null)
  const [issueError, setIssueError] = useState({})
  const [issueSuccess, setIssueSuccess] = useState({})
  const [showIssueForm, setShowIssueForm] = useState({})

  const load = () => getStudents().then(items => {
    setStudents(items)
    setLoading(false)
  })

  useEffect(() => { load() }, [])

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }))

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    setSuccess(null)
    try {
      const student = await createStudent(form)
      setSuccess(student)
      setForm(INITIAL_FORM)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(studentId) {
    if (!window.confirm(`Delete student ${studentId}? This cannot be undone. Certificates already issued will remain verifiable.`)) return
    setArchiving(studentId)
    try {
      await deleteStudent(studentId)
      await load()
    } finally {
      setArchiving(null)
    }
  }

  async function toggleExpand(studentId) {
    if (expanded === studentId) {
      setExpanded(null)
      return
    }
    setExpanded(studentId)
    if (!studentCerts[studentId]) {
      setCertsLoading(studentId)
      try {
        const all = await getCertificates()
        const mine = all.filter(c => c.studentId === studentId)
        setStudentCerts(prev => ({ ...prev, [studentId]: mine }))
      } finally {
        setCertsLoading(null)
      }
    }
  }

  function toggleIssueForm(studentId) {
    setShowIssueForm(prev => ({ ...prev, [studentId]: !prev[studentId] }))
    if (!issueForm[studentId]) {
      setIssueForm(prev => ({ ...prev, [studentId]: { ...INITIAL_ISSUE_FORM } }))
    }
    setIssueError(prev => ({ ...prev, [studentId]: '' }))
    setIssueSuccess(prev => ({ ...prev, [studentId]: null }))
  }

  function setIssueField(studentId, key, value) {
    setIssueForm(prev => ({ ...prev, [studentId]: { ...prev[studentId], [key]: value } }))
  }

  async function handleIssue(event, studentId) {
    event.preventDefault()
    setIssueError(prev => ({ ...prev, [studentId]: '' }))
    setIssueLoading(studentId)
    try {
      const payload = { ...issueForm[studentId], studentId }
      let certificate
      if (isUpload[studentId]) {
        if (!issueFile[studentId]) throw new Error('Please select a file to upload')
        certificate = await uploadCertificate(payload, issueFile[studentId])
      } else {
        certificate = await issueCertificate(payload)
      }
      setIssueSuccess(prev => ({ ...prev, [studentId]: certificate }))
      setIssueForm(prev => ({ ...prev, [studentId]: { ...INITIAL_ISSUE_FORM } }))
      setIssueFile(prev => ({ ...prev, [studentId]: null }))
      setShowIssueForm(prev => ({ ...prev, [studentId]: false }))
      // refresh certs for this student
      const all = await getCertificates()
      setStudentCerts(prev => ({ ...prev, [studentId]: all.filter(c => c.studentId === studentId) }))
    } catch (err) {
      setIssueError(prev => ({ ...prev, [studentId]: err.message }))
    } finally {
      setIssueLoading(null)
    }
  }

  return (
    <div className="stud-root">
      <div className="stud-header">
        <div>
          <h1>Manage Students</h1>
          <p>Create student accounts, issue certificates, and view records</p>
        </div>
        <button
          className="stud-addBtn"
          onClick={() => { setShowForm(c => !c); setError(''); setSuccess(null) }}
        >
          {showForm ? 'Cancel' : 'New Student'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="stud-form">
          <div className="stud-formTitle">Create Student Account</div>
          <div className="stud-formRow">
            <div className="stud-field">
              <label>Full Name *</label>
              <input type="text" required placeholder="e.g. Ravi Kumar" value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
            <div className="stud-field">
              <label>User ID</label>
              <input type="text" placeholder="e.g. student03" value={form.userId} onChange={e => setField('userId', e.target.value)} />
            </div>
            <div className="stud-field">
              <label>Password *</label>
              <input type="password" required placeholder="Enter password" value={form.password} onChange={e => setField('password', e.target.value)} />
            </div>
          </div>
          <div className="stud-formRow">
            <div className="stud-field">
              <label>Department</label>
              <input type="text" placeholder="e.g. Computer Science" value={form.department} onChange={e => setField('department', e.target.value)} />
            </div>
            <div className="stud-field">
              <label>Batch</label>
              <input type="text" placeholder="e.g. 2022-2026" value={form.batch} onChange={e => setField('batch', e.target.value)} />
            </div>
            <div className="stud-field">
              <label>Roll Number</label>
              <input type="text" placeholder="Optional" value={form.rollNumber} onChange={e => setField('rollNumber', e.target.value)} />
            </div>
          </div>
          <p className="stud-formNote">
            Share the User ID and password with the student after account creation.
          </p>
          {error && <p className="stud-error">Error: {error}</p>}
          <button type="submit" className="stud-saveBtn" disabled={saving}>
            {saving ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>
      )}

      {success && (
        <div className="stud-created">
          <span className="stud-createdIcon">OK</span>
          <div><strong>Account created.</strong> Student ID: <code>{success.id}</code></div>
          <button onClick={() => setSuccess(null)}>x</button>
        </div>
      )}

      <div className="stud-tableWrap">
        {loading ? (
          <div className="stud-empty"><span className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="stud-empty">No students yet. Create one above.</div>
        ) : (
          <table className="stud-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <Fragment key={student.id}>
                  <tr>
                    <td><code className="stud-id">{student.id}</code></td>
                    <td>
                      {student.name}
                      {student.email && <><br /><span className="stud-email">{student.email}</span></>}
                    </td>
                    <td>{student.department || 'General'}</td>
                    <td>
                      <span className={`badge ${student.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {student.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td className="stud-date">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="stud-actions">
                      <button className="stud-expandBtn" onClick={() => toggleExpand(student.id)}>
                        {expanded === student.id ? 'Hide' : 'Certificates'}
                      </button>
                      <button
                        className="stud-delBtn"
                        onClick={() => handleArchive(student.id)}
                        disabled={archiving === student.id}
                      >
                        {archiving === student.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Delete'}
                      </button>
                    </td>
                  </tr>
                  {expanded === student.id && (
                    <tr className="stud-expandRow">
                      <td colSpan={6}>
                        <div className="stud-expandBody">
                          <div className="stud-expandSection">
                            <div className="stud-expandSectionTitle">
                              Certificates
                              {issueSuccess[student.id] && (
                                <span className="stud-issuedBadge">Certificate issued: {issueSuccess[student.id].id}</span>
                              )}
                            </div>
                            {certsLoading === student.id ? (
                              <div className="stud-empty" style={{ padding: '12px 0' }}><span className="spinner" /></div>
                            ) : (studentCerts[student.id] || []).length === 0 ? (
                              <div className="stud-noCerts">No certificates issued yet.</div>
                            ) : (
                              <table className="cert-table stud-certsTable">
                                <thead>
                                  <tr>
                                    <th>Certificate ID</th>
                                    <th>Degree</th>
                                    <th>Branch</th>
                                    <th>Year</th>
                                    <th>Grade</th>
                                    <th />
                                  </tr>
                                </thead>
                                <tbody>
                                  {(studentCerts[student.id] || []).map(cert => (
                                    <tr key={cert.id}>
                                      <td><span className="cert-certId">{cert.id}</span></td>
                                      <td>{cert.degree}</td>
                                      <td>{cert.branch}</td>
                                      <td>{cert.year}</td>
                                      <td>{cert.grade}</td>
                                      <td>
                                        <button className="cert-expandBtn" onClick={() => openCertificateDocument(cert.id)}>
                                          PDF
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>

                          <div className="stud-expandSection">
                            <button className="stud-issueToggleBtn" onClick={() => toggleIssueForm(student.id)}>
                              {showIssueForm[student.id] ? 'Cancel Issue' : '+ Issue New Certificate'}
                            </button>

                            {showIssueForm[student.id] && (
                              <form className="stud-issueForm" onSubmit={e => handleIssue(e, student.id)}>
                                <div className="stud-issueToggleRow">
                                  <button
                                    type="button"
                                    className="stud-issueTypeBtn"
                                    style={{ background: !isUpload[student.id] ? 'var(--accent)' : 'var(--surface-2)', color: !isUpload[student.id] ? 'white' : 'var(--text-2)' }}
                                    onClick={() => setIsUpload(prev => ({ ...prev, [student.id]: false }))}
                                  >Issue New</button>
                                  <button
                                    type="button"
                                    className="stud-issueTypeBtn"
                                    style={{ background: isUpload[student.id] ? 'var(--accent)' : 'var(--surface-2)', color: isUpload[student.id] ? 'white' : 'var(--text-2)' }}
                                    onClick={() => setIsUpload(prev => ({ ...prev, [student.id]: true }))}
                                  >Upload Existing</button>
                                </div>
                                <div className="stud-issueRow">
                                  <div className="stud-field">
                                    <label>Degree / Programme *</label>
                                    <select required value={issueForm[student.id]?.degree || ''} onChange={e => setIssueField(student.id, 'degree', e.target.value)}>
                                      <option value="">Select degree</option>
                                      {DEGREES.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                  </div>
                                  <div className="stud-field">
                                    <label>Branch / Specialisation *</label>
                                    <input type="text" required placeholder="e.g. Computer Science" value={issueForm[student.id]?.branch || ''} onChange={e => setIssueField(student.id, 'branch', e.target.value)} />
                                  </div>
                                </div>
                                <div className="stud-issueRow">
                                  <div className="stud-field">
                                    <label>Year of Passing *</label>
                                    <input type="number" required min="2000" max="2035" value={issueForm[student.id]?.year || ''} onChange={e => setIssueField(student.id, 'year', e.target.value)} />
                                  </div>
                                  <div className="stud-field">
                                    <label>Grade / Class *</label>
                                    <select required value={issueForm[student.id]?.grade || ''} onChange={e => setIssueField(student.id, 'grade', e.target.value)}>
                                      <option value="">Select grade</option>
                                      {GRADES.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div className="stud-field">
                                  <label>Issuing Institution *</label>
                                  <input type="text" required value={issueForm[student.id]?.institution || ''} onChange={e => setIssueField(student.id, 'institution', e.target.value)} />
                                </div>
                                {isUpload[student.id] && (
                                  <div className="stud-field">
                                    <label>Certificate File (PDF or Image) *</label>
                                    <input type="file" required accept="application/pdf,image/*" onChange={e => setIssueFile(prev => ({ ...prev, [student.id]: e.target.files[0] }))} />
                                  </div>
                                )}
                                {issueError[student.id] && <p className="stud-error">Error: {issueError[student.id]}</p>}
                                <button type="submit" className="stud-saveBtn" disabled={issueLoading === student.id}>
                                  {issueLoading === student.id ? <><span className="spinner" /> Registering...</> : (isUpload[student.id] ? 'Upload and Register' : 'Issue Certificate')}
                                </button>
                              </form>
                            )}
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
