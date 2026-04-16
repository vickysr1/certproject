import { useNavigate, useLocation } from 'react-router-dom'
import { logout, getSession } from '../api.js'
import s from './Layout.module.css'

export default function Layout({ navItems, children }) {
  const nav = useNavigate()
  const loc = useLocation()
  const session = getSession()

  function handleLogout() {
    logout()
    nav('/login')
  }

  return (
    <div className={s.root}>
      <aside className={s.sidebar}>
        <div className={s.logo}>
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="18,2 21,13 33,13 23,20 27,31 18,24 9,31 13,20 3,13 15,13" fill="none" stroke="#C9A84C" strokeWidth="1.5"/>
            <circle cx="18" cy="18" r="6" fill="none" stroke="#C9A84C" strokeWidth="1.2"/>
          </svg>
          <div>
            <span className={s.logoName}>CertPortal</span>
            <span className={s.logoTag}>{session?.role === 'admin' ? 'Administration' : 'Student'}</span>
          </div>
        </div>

        <nav className={s.nav}>
          {navItems.map(item => (
            <button
              key={item.path}
              className={`${s.navItem} ${loc.pathname === item.path ? s.active : ''}`}
              onClick={() => nav(item.path)}
            >
              <span className={s.icon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={s.sideBottom}>
          <div className={s.user}>
            <div className={s.avatar}>{session?.name?.[0] ?? '?'}</div>
            <div>
              <div className={s.userName}>{session?.name}</div>
              <div className={s.userId}>{session?.id}</div>
            </div>
          </div>
          <button className={s.logout} onClick={handleLogout}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 7l3 3-3 3M16 10H7M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <main className={s.main}>{children}</main>
    </div>
  )
}
