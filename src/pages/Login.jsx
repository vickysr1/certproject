import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api.js'
import s from './Login.module.css'

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
    <div className={s.root}>
      <div className={s.bg}>
        <div className={s.grid} />
        <div className={s.glow} />
      </div>

      <div className={s.card}>
        <div className={s.seal}>
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="30,4 35,20 52,20 39,31 44,47 30,37 16,47 21,31 8,20 25,20" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
            <circle cx="30" cy="30" r="12" fill="none" stroke="#C9A84C" strokeWidth="1.2" strokeDasharray="2 2" />
            <text x="30" y="34" textAnchor="middle" fontSize="9" fill="#C9A84C" fontWeight="600">CERT</text>
          </svg>
        </div>

        <h1 className={s.title}>Academic Certificate<br /><em>Verification Portal</em></h1>
        <p className={s.sub}>Blockchain-secured | AI-reviewed</p>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label>User ID</label>
            <input
              type="text"
              placeholder="e.g. admin or student01"
              value={form.userId}
              required
              onChange={event => setForm(current => ({ ...current, userId: event.target.value }))}
            />
          </div>
          <div className={s.field}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              required
              onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
            />
          </div>

          {error && <p className={s.error}>Error: {error}</p>}

          <button type="submit" className={s.btn} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className={s.hint}>
          <span>Admin: <code>admin</code> / <code>admin123</code></span>
          <span>Student: <code>student01</code> / <code>student123</code></span>
        </div>
      </div>
    </div>
  )
}
