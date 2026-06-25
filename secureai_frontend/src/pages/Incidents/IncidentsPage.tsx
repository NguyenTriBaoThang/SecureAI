import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { incidentApi } from '../../api/incidentApi'
import { Badge } from '../../components/ui/Badge'
import type { IncidentDto, IncidentStatus, PagedResult, ThreatSeverity } from '../../types'

const actionColor: Record<string, string> = {
  Block: '#dc2626',
  Review: '#d97706',
  Allow: '#059669',
}

export function IncidentsPage() {
  const [data, setData] = useState<PagedResult<IncidentDto> | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await incidentApi.getList({ page, pageSize: 10, status: (status || undefined) as IncidentStatus | undefined, priority: (priority || undefined) as ThreatSeverity | undefined, search: search || undefined })
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, status, priority])

  const updateStatus = async (incident: IncidentDto, nextStatus: IncidentStatus) => {
    await incidentApi.update(incident.id, nextStatus, note || undefined)
    setNote('')
    await load()
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 10)) : 1

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Incidents</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Case management cho threat nguy hiểm cần analyst xử lý.</p>
        </div>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{data?.total ?? 0} case</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setPage(1); load() } }} placeholder="Tìm theo URL hoặc tiêu đề" style={{ ...selectStyle, minWidth: 260 }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">Tất cả trạng thái</option>
          <option value="Open">Mở</option>
          <option value="Investigating">Đang xử lý</option>
          <option value="Resolved">Đã xử lý</option>
          <option value="FalsePositive">False positive</option>
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }} style={selectStyle}>
          <option value="">Tất cả priority</option>
          <option value="Critical">Nghiêm trọng</option>
          <option value="High">Cao</option>
          <option value="Medium">Trung bình</option>
          <option value="Low">Thấp</option>
        </select>
        <button onClick={() => { setPage(1); load() }} style={{ ...selectStyle, cursor: 'pointer' }}>Tìm</button>
        <button onClick={() => { setSearch(''); setStatus(''); setPriority(''); setPage(1) }} style={{ ...selectStyle, cursor: 'pointer', color: '#6b7280' }}>Xóa filter</button>
      </div>

      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Resolution note khi đóng case hoặc đánh dấu false positive..." rows={2} style={{ width: '100%', boxSizing: 'border-box', marginBottom: 16, padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, resize: 'vertical' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>}

        {!loading && data?.items.map(incident => (
          <div key={incident.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  <Badge type="status" value={incident.status} />
                  <Badge type="severity" value={incident.priority} />
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800, color: '#fff', background: actionColor[incident.recommendedAction] ?? '#4b5563' }}>{incident.recommendedAction}</span>
                  {incident.assignedToEmail && <span style={{ fontSize: 12, color: '#6b7280' }}>Owner: {incident.assignedToEmail}</span>}
                </div>
                <h2 style={{ fontSize: 15, color: '#111827', margin: '0 0 6px' }}>{incident.title}</h2>
                <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 8px', lineHeight: 1.5 }}>{incident.summary}</p>
                <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>{incident.threatUrl}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Risk {(incident.riskScore * 100).toFixed(1)}% - Tạo lúc {new Date(incident.createdAt).toLocaleString('vi-VN')}
                </div>
                {incident.resolutionNote && <div style={{ marginTop: 8, fontSize: 12, color: '#374151' }}>Ghi chú: {incident.resolutionNote}</div>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                <button onClick={() => navigate(`/threats/${incident.threatId}`)} style={buttonStyle('#fff', '#374151', '#d1d5db')}>Chi tiết threat</button>
                <button onClick={() => updateStatus(incident, 'Investigating')} style={buttonStyle('#d97706', '#fff')}>Đang xử lý</button>
                <button onClick={() => updateStatus(incident, 'Resolved')} style={buttonStyle('#059669', '#fff')}>Đã xử lý</button>
                <button onClick={() => updateStatus(incident, 'FalsePositive')} style={buttonStyle('#6b7280', '#fff')}>False positive</button>
              </div>
            </div>
          </div>
        ))}

        {!loading && !data?.items.length && (
          <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            Chưa có incident nào. Incident sẽ tự tạo khi threat High/Critical được phân tích.
          </div>
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

function buttonStyle(bg: string, color: string, border = 'transparent'): React.CSSProperties {
  return { background: bg, color, border: `1px solid ${border}`, borderRadius: 6, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }
}

const pagerStyle: React.CSSProperties = { padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', background: '#fff' }
