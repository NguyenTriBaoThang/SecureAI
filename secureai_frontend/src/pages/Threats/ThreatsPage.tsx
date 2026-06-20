import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { threatApi } from '../../api/threatApi'
import { Badge } from '../../components/ui/Badge'
import type { ThreatDto, PagedResult } from '../../types'

export function ThreatsPage() {
  const [data, setData]         = useState<PagedResult<ThreatDto> | null>(null)
  const [page, setPage]         = useState(1)
  const [label, setLabel]       = useState('')
  const [status, setStatus]     = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const res = await threatApi.getList({
        page,
        pageSize: 15,
        label: label || undefined,
        status: (status || undefined) as ThreatDto['status'] | undefined,
      })
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page, label, status])

  const totalPages = data ? Math.ceil(data.total / 15) : 1

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Threats</h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={selectStyle} value={label} onChange={e => { setLabel(e.target.value); setPage(1) }}>
          <option value="">Tất cả labels</option>
          <option value="phishing">Phishing</option>
          <option value="malware">Malware</option>
          <option value="defacement">Defacement</option>
          <option value="benign">Benign</option>
        </select>
        <select style={selectStyle} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tất cả status</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="FalsePositive">False Positive</option>
          <option value="Escalated">Escalated</option>
        </select>
        <button
          onClick={() => { setLabel(''); setStatus(''); setPage(1) }}
          style={{ ...selectStyle, color: '#6b7280' }}
        >
          Xoá filter
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>
          {data?.total ?? 0} kết quả
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['URL', 'Label', 'Risk Score', 'Severity', 'Status', 'Phát hiện lúc', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14 }}>Đang tải...</td></tr>
            )}
            {!loading && data?.items.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '12px 16px', maxWidth: 280 }}>
                  <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.url}>
                    {t.url}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}><Badge type="label" value={t.predictedLabel} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, minWidth: 60 }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${t.riskScore * 100}%`, background: t.riskScore > 0.8 ? '#ef4444' : t.riskScore > 0.5 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{(t.riskScore * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}><Badge type="severity" value={t.severity} /></td>
                <td style={{ padding: '12px 16px' }}><Badge type="status" value={t.status} /></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {new Date(t.detectedAt).toLocaleString('vi-VN')}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => navigate(`/threats/${t.id}`)}
                    style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#374151' }}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !data?.items.length && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14 }}>Chưa có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', background: '#fff' }}>
            ← Trước
          </button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: '#374151' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', background: '#fff' }}>
            Tiếp →
          </button>
        </div>
      )}
    </div>
  )
}
