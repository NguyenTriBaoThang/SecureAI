import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { alertApi } from '../../api/alertApi'

const navItems = [
  { to: '/',           label: 'Dashboard',        icon: 'DB' },
  { to: '/threats',    label: 'Threats',          icon: 'TH' },
  { to: '/alerts',     label: 'Alerts',           icon: 'AL' },
  { to: '/incidents',  label: 'Incidents',        icon: 'IC' },
  { to: '/email',      label: 'Phân tích email',  icon: 'EM' },
  { to: '/baseline',   label: 'So sánh model',    icon: 'ML' },
  { to: '/statistics', label: 'Báo cáo',          icon: 'RP' },
  { to: '/rules',      label: 'Rule Engine',      icon: 'RL' },
  { to: '/users',      label: 'Người dùng',       icon: 'US' },
]

export function Sidebar() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    alertApi.getUnreadCount().then(setUnread).catch(() => {})
    const interval = setInterval(() => {
      alertApi.getUnreadCount().then(setUnread).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    color: isActive ? '#fff' : '#9ca3af',
    background: isActive ? '#2563eb' : 'transparent',
    transition: 'all 0.15s',
  })

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#111827',
      padding: '24px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 8px 24px', color: '#fff', fontSize: 18, fontWeight: 800 }}>
        SecureAI
      </div>

      {navItems.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => linkStyle(isActive)}>
          <span style={{ fontSize: 11, width: 24, color: '#93c5fd', fontWeight: 800 }}>{icon}</span>
          <span>{label}</span>
          {label === 'Alerts' && unread > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: '#dc2626',
              color: '#fff',
              borderRadius: 999,
              fontSize: 11,
              padding: '1px 7px',
              fontWeight: 800,
            }}>
              {unread}
            </span>
          )}
        </NavLink>
      ))}

      <div style={{ marginTop: 'auto', padding: '0 8px' }}>
        <button
          onClick={() => {
            localStorage.clear()
            window.location.href = '/login'
          }}
          style={{
            background: 'transparent',
            border: '1px solid #374151',
            color: '#d1d5db',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
          }}
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
