import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { alertApi } from '../../api/alertApi'
import { Badge } from '../../components/ui/Badge'
import type { AlertDto, AlertStatus, PagedResult } from '../../types'
import {
  BellRing,
  CheckCheck,
  Eye,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'

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
    <div className="saiPage">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <BellRing size={22} color="#38bdf8" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Cảnh báo Thời gian thực (SOC Alerts)
            </h1>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Theo dõi, phân luồng và xử lý cảnh báo phát hiện từ pipeline an ninh mạng.
          </div>
        </div>

        <button onClick={markAllRead} className="saiButton saiButtonSecondary" style={{ fontSize: 12 }}>
          <CheckCheck size={16} color="#38bdf8" />
          <span>Đánh dấu tất cả đã đọc</span>
        </button>
      </div>

      {/* Filter and Note Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '14px 18px',
          borderRadius: 14,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 14, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#e2e8f0', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => { setUnreadOnly(e.target.checked); setPage(1) }}
              style={{ accentColor: '#38bdf8', width: 16, height: 16 }}
            />
            <span>Chỉ hiển thị chưa đọc</span>
          </label>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="saiSelect"
            style={{ width: 'auto', minWidth: 170 }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="New">Mới (New)</option>
            <option value="Investigating">Đang xử lý (Investigating)</option>
            <option value="Resolved">Đã giải quyết (Resolved)</option>
            <option value="FalsePositive">Báo động giả (False positive)</option>
          </select>

          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
            Tổng số: <strong style={{ color: '#fff' }}>{data?.total ?? 0}</strong> cảnh báo
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú xử lý (sẽ được đính kèm khi chuyển trạng thái cảnh báo)..."
            rows={2}
            className="saiTextarea"
            style={{ minHeight: 60, fontSize: 13, padding: '10px 14px' }}
          />
        </div>
      </div>

      {/* Alert Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 13 }}>
            Đang tải danh sách cảnh báo...
          </div>
        )}

        {!loading && data?.items.map((alert) => (
          <div
            key={alert.id}
            className="saiCard"
            style={{
              padding: '18px 20px',
              borderLeft: alert.severity === 'Critical'
                ? '4px solid #ef4444'
                : alert.severity === 'High'
                ? '4px solid #f97316'
                : '4px solid #38bdf8',
              boxShadow: !alert.isRead ? '0 8px 24px -4px rgba(56, 189, 248, 0.25), 0 0 0 1px rgba(56, 189, 248, 0.3)' : undefined,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <Badge type="severity" value={alert.severity} />
                <Badge type="status" value={alert.status} />
                {!alert.isRead && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 999,
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    CHƯA ĐỌC
                  </span>
                )}
              </div>

              <div style={{ fontSize: 14, fontWeight: alert.isRead ? 600 : 800, color: '#ffffff', marginBottom: 6, lineHeight: 1.45 }}>
                {alert.message}
              </div>

              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{new Date(alert.sentAt).toLocaleString('vi-VN')}</span>
                <span>&bull;</span>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all' }}>
                  {alert.threatUrl}
                </span>
              </div>

              {alert.workflowNote && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#cbd5e1',
                    background: 'rgba(7, 11, 20, 0.6)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MessageSquare size={13} color="#94a3b8" />
                  <span>Ghi chú xử lý: {alert.workflowNote}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
              <button
                onClick={() => navigate(`/threats/${alert.threatId}`)}
                className="saiButton saiButtonSecondary"
                style={{ padding: '6px 10px', fontSize: 11, minHeight: 30 }}
              >
                <Eye size={13} />
                <span>Xem chi tiết</span>
              </button>

              {!alert.isRead && (
                <button
                  onClick={() => markRead(alert.id)}
                  className="saiButton saiButtonGhost"
                  style={{ padding: '6px 10px', fontSize: 11, minHeight: 30 }}
                >
                  <CheckCircle2 size={13} />
                  <span>Đã đọc</span>
                </button>
              )}

              <button
                onClick={() => updateStatus(alert.id, 'Investigating')}
                className="saiButton saiButtonSecondary"
                style={{ padding: '6px 10px', fontSize: 11, minHeight: 30, color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                <Clock size={13} />
                <span>Đang xử lý</span>
              </button>

              <button
                onClick={() => updateStatus(alert.id, 'Resolved')}
                className="saiButton saiButtonSecondary"
                style={{ padding: '6px 10px', fontSize: 11, minHeight: 30, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              >
                <CheckCircle2 size={13} />
                <span>Đã xử lý</span>
              </button>
            </div>
          </div>
        ))}

        {!loading && !data?.items.length && (
          <div
            className="saiCard"
            style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', fontSize: 14 }}
          >
            <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 12px', display: 'block' }} />
            Không có cảnh báo nào trong danh mục này.
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
