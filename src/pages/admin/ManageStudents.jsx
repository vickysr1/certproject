import { useEffect, useState } from 'react'
import { createStudent, deleteStudent, getStudents } from '../../api.js'

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  department: '',
  batch: '',
  rollNumber: '',
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

  const load = () => getStudents().then(items => {
    setStudents(items)
    setLoading(false)
  })

  useEffect(() => {
    load()
  }, [])

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
    if (!window.confirm(`Archive student ${studentId}? Certificates already issued to this student will remain verifiable.`)) {
      return
    }

    setArchiving(studentId)

    try {
      await deleteStudent(studentId)
      await load()
    } finally {
      setArchiving(null)
    }
  }

  return (
    <div className="stud-root">
      <div className="stud-header">
        <div>
          <h1>Manage Students</h1>
          <p>Create, review, and archive student portal accounts</p>
        </div>
        <button
          className="stud-addBtn"
          onClick={() => {
            setShowForm(current => !current)
            setError('')
            setSuccess(null)
          }}
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
              <input type="text" required placeholder="e.g. Ravi Kumar" value={form.name} onChange={event => setField('name', event.target.value)} />
            </div>
            <div className="stud-field">
              <label>Username</label>
              <input type="text" placeholder="e.g. john_doe" value={form.email} onChange={event => setField('email', event.target.value)} />
            </div>
            <div className="stud-field">
              <label>Password *</label>
              <input type="password" required placeholder="Min 8 characters with uppercase, lowercase, number" minLength={8} value={form.password} onChange={event => setField('password', event.target.value)} />
            </div>
          </div>

          <div className="stud-formRow">
            <div className="stud-field">
              <label>Department</label>
              <input type="text" placeholder="e.g. Computer Science" value={form.department} onChange={event => setField('department', event.target.value)} />
            </div>
            <div className="stud-field">
              <label>Batch</label>
              <input type="text" placeholder="e.g. 2022-2026" value={form.batch} onChange={event => setField('batch', event.target.value)} />
            </div>
            <div className="stud-field">
              <label>Roll Number</label>
              <input type="text" placeholder="Optional institutional roll number" value={form.rollNumber} onChange={event => setField('rollNumber', event.target.value)} />
            </div>
          </div>

          <p className="stud-formNote">
            A unique student ID is generated automatically. Share the issued ID and password with the student after account creation.
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
          <div>
            <strong>Account created.</strong> Student ID: <code>{success.id}</code>
          </div>
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
                <tr key={student.id}>
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
                  <td>
                    <button
                      className="stud-delBtn"
                      onClick={() => handleArchive(student.id)}
                      disabled={student.status !== 'active' || archiving === student.id}
                    >
                      {archiving === student.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Archive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
