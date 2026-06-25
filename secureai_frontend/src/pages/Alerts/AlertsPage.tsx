import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertApi } from '../../api/alertApi'
import { Badge } from '../../components/ui/Badge'
import type { AlertDto, AlertStatus, PagedResult } from '../../types'

const severityColor: Record<string, string> = {
  Critical: '#fef2f2',
  High: '#fff7ed',
  Medium: '#fefce8',
  Info: '#eff6ff',
}

export function AlertsPage() {
  const [data, setData] = useState<PagedResult<AlertDto> | null>(null)
  const [page, setPage] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await alertApi.getList({ page, pageSize: 20, unreadOnly: unreadOnly || undefined, status: (status || undefined) as AlertStatus | undefined })
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, unreadOnly, status])

  const updateStatus = async (id: string, nextStatus: AlertStatus) => {
    await alertApi.updateStatus(id, nextStatus, note || undefined)
    setNote('')
    await load()
  }

  const markRead = async (id: string) => {
    await alertApi.markRead(id)
    await load()
  }

  const markAllRead = async () => {
    await alertApi.markAllRead()
    await load()
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 20)) : 1

  return (
    <div style={{ maxWidth: 1020 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Alerts</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Workflow alert theo trạng thái mới, đang xử lý, đã xử lý hoặc false positive.</p>
        </div>
        <button onClick={markAllRead} style={secondaryButton}>Đánh dấu tất cả đã đọc</button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1) }} />
          Chưa đọc
        </label>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">Tất cả trạng thái</option>
          <option value="New">Mới</option>
          <option value="Investigating">Đang xử lý</option>
          <option value="Resolved">Đã xử lý</option>
          <option value="FalsePositive">False positive</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280' }}>{data?.total ?? 0} alert</span>
      </div>

      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú workflow khi cập nhật alert..." rows={2} style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>Đang tải...</div>}

        {!loading && data?.items.map(alert => (
          <div key={alert.id} style={{ background: alert.isRead ? '#fff' : severityColor[alert.severity] ?? '#fff', border: `1px solid ${alert.isRead ? '#e5e7eb' : '#fed7aa'}`, borderRadius: 8, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                <Badge type="severity" value={alert.severity} />
                <Badge type="status" value={alert.status} />
                {!alert.isRead && <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 800 }}>Chưa đọc</span>}
              </div>
              <div style={{ fontSize: 14, color: '#111827', fontWeight: alert.isRead ? 500 : 800, marginBottom: 5 }}>{alert.message}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {new Date(alert.sentAt).toLocaleString('vi-VN')} - <span style={{ fontFamily: 'monospace' }}>{alert.threatUrl}</span>
              </div>
              {alert.workflowNote && <div style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>Ghi chú: {alert.workflowNote}</div>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 142 }}>
              <button onClick={() => navigate(`/threats/${alert.threatId}`)} style={buttonStyle('#fff', '#374151', '#d1d5db')}>Chi tiết threat</button>
              {!alert.isRead && <button onClick={() => markRead(alert.id)} style={buttonStyle('#fff', '#374151', '#d1d5db')}>Đã đọc</button>}
              <button onClick={() => updateStatus(alert.id, 'Investigating')} style={buttonStyle('#d97706', '#fff')}>Đang xử lý</button>
              <button onClick={() => updateStatus(alert.id, 'Resolved')} style={buttonStyle('#059669', '#fff')}>Đã xử lý</button>
              <button onClick={() => updateStatus(alert.id, 'FalsePositive')} style={buttonStyle('#6b7280', '#fff')}>False positive</button>
            </div>
          </div>
        ))}

        {!loading && !data?.items.length && (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>Không có alert nào</div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pagerStyle}>Trước</button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: '#374151' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pagerStyle}>Tiếp</button>
        </div>
      )}
    </div>
  )
}

const selectStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, background: '#fff' }
const secondaryButton: React.CSSProperties = { background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#374151' }

function buttonStyle(bg: string, color: string, border = 'transparent'): React.CSSProperties {
  return { background: bg, color, border: `1px solid ${border}`, borderRadius: 6, padding: '5px 9px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }
}

const pagerStyle: React.CSSProperties = { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff' }
