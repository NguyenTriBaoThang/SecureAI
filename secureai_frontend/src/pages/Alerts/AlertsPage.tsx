import { useEffect, useState } from 'react'
import { alertApi } from '../../api/alertApi'
import type { AlertDto, PagedResult } from '../../types'

const severityIcon: Record<string, string> = {
  Critical: '🚨', High: '⚠️', Medium: '📢', Info: 'ℹ️',
}

export function AlertsPage() {
  const [data, setData]         = useState<PagedResult<AlertDto> | null>(null)
  const [page, setPage]         = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await alertApi.getList({ page, pageSize: 20, unreadOnly: unreadOnly || undefined })
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, unreadOnly])

  const markRead = async (id: string) => {
    await alertApi.markRead(id)
    load()
  }

  const markAllRead = async () => {
    await alertApi.markAllRead()
    load()
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 1

  const severityColor: Record<string, string> = {
    Critical: '#fee2e2', High: '#fff7ed', Medium: '#fefce8', Info: '#eff6ff',
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Alerts</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1) }} />
            Chưa đọc
          </label>
          <button onClick={markAllRead}
            style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Đang tải...</div>}

        {!loading && data?.items.map(alert => (
          <div key={alert.id} style={{
            background: alert.isRead ? '#fff' : severityColor[alert.severity] ?? '#fff',
            border: `1px solid ${alert.isRead ? '#e5e7eb' : '#fed7aa'}`,
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{severityIcon[alert.severity]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#111827', fontWeight: alert.isRead ? 400 : 600, marginBottom: 4 }}>
                {alert.message}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {new Date(alert.sentAt).toLocaleString('vi-VN')}
                {' · '}
                <span style={{ fontFamily: 'monospace' }}>{alert.threatUrl}</span>
              </div>
            </div>
            {!alert.isRead && (
              <button onClick={() => markRead(alert.id)}
                style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#374151', flexShrink: 0 }}>
                Đã đọc
              </button>
            )}
          </div>
        ))}

        {!loading && !data?.items.length && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14 }}>Không có alert nào</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff' }}>← Trước</button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: '#374151' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff' }}>Tiếp →</button>
        </div>
      )}
    </div>
  )
}
