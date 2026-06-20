import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAlertHub } from '../../hooks/useAlertHub'
import { useState } from 'react'
import type { AlertDto } from '../../types'

export function Layout() {
  const [toast, setToast] = useState<AlertDto | null>(null)

  useAlertHub((alert) => {
    setToast(alert)
    setTimeout(() => setToast(null), 5000)
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
      <Sidebar />

      <main style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>
        <Outlet />
      </main>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.severity === 'Critical' ? '#7f1d1d' : '#1e3a5f',
          color: '#fff',
          borderRadius: 12,
          padding: '14px 20px',
          maxWidth: 360,
          fontSize: 13,
          zIndex: 1000,
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {toast.severity === 'Critical' ? '🚨 CRITICAL ALERT' : '⚠️ Alert'}
          </div>
          <div style={{ opacity: 0.9 }}>{toast.message}</div>
          <button
            onClick={() => setToast(null)}
            style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16 }}
          >×</button>
        </div>
      )}
    </div>
  )
}
