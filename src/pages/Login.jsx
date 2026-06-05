import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, signup } from '../api.js'

export default function Login() {
  const nav = useNavigate()
  const [view, setView] = useState('login') // 'login' or 'signup'
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [form, setForm] = useState({ userId: '', password: '' })
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    password: '',
    department: '',
    batch: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLoginSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user } = await login(form.userId, form.password)
      nav(user.role === 'admin' ? '/admin' : '/student', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup(signupForm)
      setSignupSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-bg">
        <div className="login-grid" />
        <div className="login-glow" />
      </div>

      <div className="login-card">
        <div className="login-seal">
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="30,4 35,20 52,20 39,31 44,47 30,37 16,47 21,31 8,20 25,20" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="12" fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="2 2" />
            <text x="30" y="34" textAnchor="middle" fontSize="9" fill="var(--accent)" fontWeight="600">CERT</text>
          </svg>
        </div>

        <h1 className="login-title">Academic Certificate<br /><em>Verification Portal</em></h1>
        <p className="login-sub">Blockchain-secured</p>

        {signupSuccess ? (
          <div className="login-success-box">
            <p style={{ color: 'var(--success)', fontWeight: 500, marginBottom: 18, fontSize: '14px', lineHeight: '1.5' }}>
              Registration submitted successfully!<br />Please wait for administrator approval before signing in.
            </p>
            <button
              type="button"
              className="login-btn"
              onClick={() => {
                setView('login');
                setSignupSuccess(false);
              }}
            >
              Back to Sign In
            </button>
          </div>
        ) : view === 'login' ? (
          <>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="login-field">
                <label>User ID, Roll Number, or Email</label>
                <input
                  type="text"
                  placeholder="Enter User ID, Roll Number, or Email"
                  value={form.userId}
                  required
                  onChange={event => setForm(current => ({ ...current, userId: event.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  required
                  onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
                />
              </div>

              {error && <p className="login-error">Error: {error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>

            <p className="login-toggle-text">
              New student? <button type="button" className="login-toggle-btn" onClick={() => { setView('signup'); setError(''); }}>Sign up here</button>
            </p>

            <div className="login-hint">
              <span>Admin: <code>admin</code> / <code>admin123</code></span>
              <span>Student: <code>student01</code> / <code>student123</code></span>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSignupSubmit} className="login-form">
              <div className="login-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  value={signupForm.name}
                  required
                  onChange={event => setSignupForm(current => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="e.g. arjun@student.edu"
                  value={signupForm.email}
                  required
                  onChange={event => setSignupForm(current => ({ ...current, email: event.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Roll Number *</label>
                <input
                  type="text"
                  placeholder="e.g. CSE2024001"
                  value={signupForm.rollNumber}
                  required
                  onChange={event => setSignupForm(current => ({ ...current, rollNumber: event.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Password *</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={signupForm.password}
                  required
                  minLength={6}
                  onChange={event => setSignupForm(current => ({ ...current, password: event.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Department</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={signupForm.department}
                  onChange={event => setSignupForm(current => ({ ...current, department: event.target.value }))}
                />
              </div>
              <div className="login-field">
                <label>Batch</label>
                <input
                  type="text"
                  placeholder="e.g. 2022-2026"
                  value={signupForm.batch}
                  onChange={event => setSignupForm(current => ({ ...current, batch: event.target.value }))}
                />
              </div>

              {error && <p className="login-error">Error: {error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Register Account'}
              </button>
            </form>

            <p className="login-toggle-text">
              Already have an account? <button type="button" className="login-toggle-btn" onClick={() => { setView('login'); setError(''); }}>Sign in here</button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}