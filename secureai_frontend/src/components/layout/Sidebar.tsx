import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { alertApi } from '../../api/alertApi'
import {
  ShieldCheck,
  LayoutDashboard,
  BellRing,
  Flame,
  ScanSearch,
  MailCheck,
  ShieldAlert,
  Cpu,
  FileText,
  Database,
  RefreshCw,
  Sliders,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  CircleDot
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

interface NavGroup {
  groupTitle: string
  items: {
    to: string
    label: string
    icon: LucideIcon
    badge?: 'alerts'
  }[]
}

const navGroups: NavGroup[] = [
  {
    groupTitle: 'VẬN HÀNH & GIÁM SÁT',
    items: [
      { to: '/', label: 'Trang chủ', icon: ShieldCheck },
      { to: '/dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
      { to: '/alerts', label: 'Cảnh báo trực tiếp', icon: BellRing, badge: 'alerts' },
      { to: '/incidents', label: 'Quản lý sự cố', icon: Flame },
    ],
  },
  {
    groupTitle: 'CÔNG CỤ PHÂN TÍCH AI',
    items: [
      { to: '/scan', label: 'Quét URL nhanh', icon: ScanSearch },
      { to: '/email', label: 'Phân tích Email', icon: MailCheck },
      { to: '/threats', label: 'Kho đe dọa', icon: ShieldAlert },
      { to: '/baseline', label: 'So sánh mô hình', icon: Cpu },
    ],
  },
  {
    groupTitle: 'DỮ LIỆU & HUẤN LUYỆN',
    items: [
      { to: '/logs', label: 'Nhật ký quét', icon: FileText },
      { to: '/dataset', label: 'Duyệt dữ liệu', icon: Database },
      { to: '/train', label: 'Huấn luyện AI', icon: RefreshCw },
    ],
  },
  {
    groupTitle: 'QUẢN TRỊ & HỆ THỐNG',
    items: [
      { to: '/rules', label: 'Luật cảnh báo (Rules)', icon: Sliders },
      { to: '/statistics', label: 'Báo cáo & Thống kê', icon: BarChart3 },
      { to: '/users', label: 'Người dùng', icon: Users },
      { to: '/settings', label: 'Cấu hình bảo vệ', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const [unread, setUnread] = useState(0)
  const [collapsed, setCollapsed] = useState(false)
  const userJson = localStorage.getItem('user')
  const user = userJson ? JSON.parse(userJson) : null
  const userRole = user?.role || 'SOC Analyst'
  const userEmail = user?.email || 'admin@secureai.local'

  useEffect(() => {
    alertApi.getUnreadCount().then(setUnread).catch(() => {})
    const interval = setInterval(() => {
      alertApi.getUnreadCount().then(setUnread).catch(() => {})
    }, 20000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside
      style={{
        width: collapsed ? 76 : 260,
        transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0b111e 0%, #070a12 100%)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: collapsed ? '20px 10px' : '20px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              flexShrink: 0,
            }}
          >
            <Shield size={22} strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(180deg, #ffffff 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  SecureAI
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: 4,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  SOC
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <CircleDot size={9} color="#10b981" />
                <span>Hệ thống trực tuyến</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            color: '#94a3b8',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginLeft: collapsed ? 0 : 8,
          }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Items List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '14px 8px' : '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {navGroups.map((group) => (
          <div key={group.groupTitle}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#475569',
                  padding: '6px 10px 8px',
                  textTransform: 'uppercase',
                }}
              >
                {group.groupTitle}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {group.items.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  title={collapsed ? label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: collapsed ? '10px 0' : '9px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive
                      ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(56, 189, 248, 0.35)'
                      : '1px solid transparent',
                    boxShadow: isActive ? '0 4px 16px rgba(2, 132, 199, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                  })}
                >
                  <Icon
                    size={18}
                    className="sidebar-icon"
                  />
                  {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
                  
                  {badge === 'alerts' && unread > 0 && (
                    <span
                      style={{
                        marginLeft: collapsed ? 0 : 'auto',
                        position: collapsed ? 'absolute' : 'relative',
                        top: collapsed ? 4 : 'auto',
                        right: collapsed ? 4 : 'auto',
                        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: '#fff',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '1px 6px',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Session Footer */}
      <div
        style={{
          padding: collapsed ? '12px 8px' : '14px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(10, 15, 28, 0.8)',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                color: '#0f172a',
                fontSize: 12,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
              }}
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
              <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                {userRole}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            localStorage.clear()
            window.location.href = '/login'
          }}
          title="Đăng xuất khỏi hệ thống"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#fca5a5',
            borderRadius: 8,
            padding: collapsed ? '8px 0' : '8px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s ease',
          }}
        >
          <LogOut size={15} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
