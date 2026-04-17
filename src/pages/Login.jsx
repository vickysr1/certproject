import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api.js'

export default function Login() {
  const nav = useNavigate()
  const [form, setForm] = useState({ userId: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
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
        <p className="login-sub">Blockchain-secured | AI-reviewed</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>User ID</label>
            <input
              type="text"
              placeholder="e.g. admin or student01"
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

        <div className="login-hint">
          <span>Admin: <code>admin</code> / <code>admin123</code></span>
          <span>Student: <code>student01</code> / <code>student123</code></span>
        </div>
      </div>
    </div>
  )
}