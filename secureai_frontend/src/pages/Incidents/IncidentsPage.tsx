import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { incidentApi } from '../../api/incidentApi'
import { Badge } from '../../components/ui/Badge'
import type { IncidentDto, IncidentStatus, PagedResult, ThreatSeverity } from '../../types'
import {
  Flame,
  Search,
  RotateCcw,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

const actionColor: Record<string, string> = {
  Block: '#ef4444',
  Review: '#f59e0b',
  Allow: '#10b981',
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
      const res = await incidentApi.getList({
        page,
        pageSize: 10,
        status: (status || undefined) as IncidentStatus | undefined,
        priority: (priority || undefined) as ThreatSeverity | undefined,
        search: search || undefined,
      })
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
    <div className="saiPage">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Flame size={22} color="#f43f5e" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Quản lý Sự cố An ninh (Incident Response)
            </h1>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Hệ thống Case Management hỗ trợ điều tra các mối đe dọa nguy cấp dành cho SOC Analyst.
          </div>
        </div>

        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 999,
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}
        >
          {data?.total ?? 0} SỰ CỐ TỔNG CỘNG
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '14px 18px',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }}
              placeholder="Tìm theo URL độc hại hoặc tiêu đề sự cố..."
              className="saiInput"
              style={{ paddingLeft: 36 }}
            />
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="saiSelect"
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Open">Mở (Open)</option>
            <option value="Investigating">Đang điều tra</option>
            <option value="Resolved">Đã giải quyết</option>
            <option value="FalsePositive">Báo động giả (FP)</option>
          </select>

          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1) }}
            className="saiSelect"
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="">Tất cả mức ưu tiên</option>
            <option value="Critical">Nghiêm trọng (Critical)</option>
            <option value="High">Cao (High)</option>
            <option value="Medium">Trung bình (Medium)</option>
            <option value="Low">Thấp (Low)</option>
          </select>

          <button
            onClick={() => { setPage(1); load() }}
            className="saiButton saiButtonPrimary"
            style={{ minHeight: 38 }}
          >
            <Search size={14} />
            <span>Tìm</span>
          </button>

          {(search || status || priority) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setPriority(''); setPage(1) }}
              className="saiButton saiButtonGhost"
              style={{ minHeight: 38 }}
            >
              <RotateCcw size={14} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú xử lý (Resolution note khi đóng case hoặc đánh dấu false positive)..."
          rows={2}
          className="saiTextarea"
          style={{ minHeight: 56, fontSize: 13 }}
        />
      </div>

      {/* Incidents Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            Đang tải danh sách sự cố...
          </div>
        )}

        {!loading && data?.items.map((incident) => (
          <div
            key={incident.id}
            className="saiCard"
            style={{
              padding: '20px 22px',
              borderLeft: incident.priority === 'Critical'
                ? '4px solid #ef4444'
                : incident.priority === 'High'
                ? '4px solid #f97316'
                : '4px solid #38bdf8',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <Badge type="status" value={incident.status} />
                  <Badge type="severity" value={incident.priority} />
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      color: actionColor[incident.recommendedAction] ?? '#fff',
                      background: `${actionColor[incident.recommendedAction] ?? '#4b5563'}25`,
                      border: `1px solid ${actionColor[incident.recommendedAction] ?? '#4b5563'}45`,
                    }}
                  >
                    HÀNH ĐỘNG: {incident.recommendedAction.toUpperCase()}
                  </span>
                  {incident.assignedToEmail && (
                    <span style={{ fontSize: 12, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} />
                      <span>{incident.assignedToEmail}</span>
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                  {incident.title}
                </h2>

                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.55 }}>
                  {incident.summary}
                </p>

                <div
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#38bdf8',
                    wordBreak: 'break-all',
                    background: 'rgba(7, 11, 20, 0.6)',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'inline-block',
                    marginBottom: 8,
                  }}
                >
                  {incident.threatUrl}
                </div>

                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Điểm rủi ro: <strong style={{ color: incident.riskScore >= 0.7 ? '#f87171' : '#f59e0b' }}>{(incident.riskScore * 100).toFixed(1)}%</strong> &bull; Tạo lúc {new Date(incident.createdAt).toLocaleString('vi-VN')}
                </div>

                {incident.resolutionNote && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: '#cbd5e1',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    Ghi chú kết luận: {incident.resolutionNote}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 145 }}>
                <button
                  onClick={() => navigate(`/threats/${incident.threatId}`)}
                  className="saiButton saiButtonSecondary"
                  style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }}
                >
                  <Eye size={13} />
                  <span>Chi tiết threat</span>
                </button>

                <button
                  onClick={() => updateStatus(incident, 'Investigating')}
                  className="saiButton saiButtonSecondary"
                  style={{ padding: '6px 12px', fontSize: 11, minHeight: 32, color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  <Clock size={13} />
                  <span>Đang xử lý</span>
                </button>

                <button
                  onClick={() => updateStatus(incident, 'Resolved')}
                  className="saiButton saiButtonSecondary"
                  style={{ padding: '6px 12px', fontSize: 11, minHeight: 32, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                >
                  <CheckCircle2 size={13} />
                  <span>Đã giải quyết</span>
                </button>

                <button
                  onClick={() => updateStatus(incident, 'FalsePositive')}
                  className="saiButton saiButtonSecondary"
                  style={{ padding: '6px 12px', fontSize: 11, minHeight: 32, color: '#94a3b8' }}
                >
                  <AlertTriangle size={13} />
                  <span>Báo động giả</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && !data?.items.length && (
          <div className="saiCard" style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <ShieldAlert size={36} color="#475569" style={{ margin: '0 auto 12px', display: 'block' }} />
            Chưa có sự cố nào trong danh mục. Sự cố sẽ được hệ thống tự động sinh khi phát hiện mối đe dọa High/Critical.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="saiButton saiButtonSecondary"
            style={{ minHeight: 34, padding: '6px 14px' }}
          >
            <ChevronLeft size={15} />
            <span>Trước</span>
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 13, color: '#94a3b8' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="saiButton saiButtonSecondary"
            style={{ minHeight: 34, padding: '6px 14px' }}
          >
            <span>Tiếp</span>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
