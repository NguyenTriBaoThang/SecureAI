import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAlertHub } from '../../hooks/useAlertHub'
import { useState } from 'react'
import type { AlertDto } from '../../types'
import { AlertTriangle, ShieldAlert, X } from 'lucide-react'

export function Layout() {
  const [toast, setToast] = useState<AlertDto | null>(null)

  useAlertHub((alert) => {
    setToast(alert)
    setTimeout(() => setToast(null), 6000)
  })

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        background: 'transparent',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <Sidebar />

      <main
        style={{
          flex: '1 1 0',
          minWidth: 0,
          overflowY: 'auto',
          padding: '28px 36px',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>

      {/* 3D Cyber Alert Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            background: toast.severity === 'Critical'
              ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(69, 10, 10, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 95, 0.98) 100%)',
            color: '#fff',
            borderRadius: 14,
            padding: '16px 20px',
            maxWidth: 400,
            fontSize: 13,
            zIndex: 1000,
            boxShadow: toast.severity === 'Critical'
              ? '0 16px 36px rgba(220, 38, 38, 0.35), 0 0 0 1px rgba(248, 113, 113, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
              : '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: toast.severity === 'Critical' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.2)',
              color: toast.severity === 'Critical' ? '#fca5a5' : '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {toast.severity === 'Critical' ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
          </div>

          <div style={{ flex: 1, paddingRight: 8 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.02em',
                color: toast.severity === 'Critical' ? '#fecaca' : '#93c5fd',
                marginBottom: 3,
                textTransform: 'uppercase',
              }}
            >
              {toast.severity === 'Critical' ? 'CẢNH BÁO NGUY CẤP (SOC)' : 'CẢNH BÁO MỚI'}
            </div>
            <div style={{ color: '#f1f5f9', lineHeight: 1.45, fontSize: 13 }}>
              {toast.message}
            </div>
            {toast.threatUrl && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  wordBreak: 'break-all',
                }}
              >
                {toast.threatUrl}
              </div>
            )}
          </div>

          <button
            onClick={() => setToast(null)}
            aria-label="Đóng thông báo"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#e2e8f0',
              borderRadius: 6,
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}