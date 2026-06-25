import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { threatApi } from '../../api/threatApi'
import { exportApi } from '../../api/exportApi'
import { Badge } from '../../components/ui/Badge'
import type { ThreatDto, PagedResult } from '../../types'

const actionColor: Record<string, string> = {
  Block: '#dc2626',
  Review: '#d97706',
  Allow: '#059669',
}

export function ThreatsPage() {
  const [data, setData] = useState<PagedResult<ThreatDto> | null>(null)
  const [page, setPage] = useState(1)
  const [label, setLabel] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
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
  const exportFilters = { label: label || undefined, status: status || undefined }

  const handleExport = async (kind: 'csv' | 'pdf') => {
    setExporting(true)
    try {
      if (kind === 'csv') await exportApi.downloadThreatsCsv(exportFilters)
      else await exportApi.downloadThreatsPdf(exportFilters)
    } finally {
      setExporting(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    background: '#fff',
    cursor: 'pointer',
  }

  return (
    <div style={{ maxWidth: 1180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Threats</h1>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{data?.total ?? 0} kết quả theo bộ lọc hiện tại</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleExport('csv')} disabled={exporting} style={buttonStyle(exporting)}>CSV</button>
          <button onClick={() => handleExport('pdf')} disabled={exporting} style={buttonStyle(exporting)}>PDF</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={selectStyle} value={label} onChange={e => { setLabel(e.target.value); setPage(1) }}>
          <option value="">Tất cả nhãn</option>
          <option value="phishing">Phishing</option>
          <option value="malware">Malware</option>
          <option value="defacement">Defacement</option>
          <option value="benign">Benign</option>
        </select>
        <select style={selectStyle} value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="FalsePositive">False Positive</option>
          <option value="Escalated">Escalated</option>
          <option value="Archived">Archived</option>
        </select>
        <button onClick={() => { setLabel(''); setStatus(''); setPage(1) }} style={{ ...selectStyle, color: '#6b7280' }}>
          Xóa filter
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['URL', 'Nhãn', 'Risk', 'Action', 'Domain/TLD', 'Severity', 'Status', 'Phát hiện', ''].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14 }}>Đang tải...</td></tr>
            )}
            {!loading && data?.items.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 14px', maxWidth: 280 }}>
                  <div style={{ fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.url}>{t.url}</div>
                </td>
                <td style={{ padding: '12px 14px' }}><Badge type="label" value={t.predictedLabel} /></td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, minWidth: 58 }}>
                      <div style={{ height: 6, borderRadius: 3, width: `${Math.min(100, t.riskScore * 100)}%`, background: t.riskScore >= 0.85 ? '#dc2626' : t.riskScore >= 0.45 ? '#d97706' : '#059669' }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{(t.riskScore * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: `${actionColor[t.ruleEvaluation.action] ?? '#4b5563'}20`, color: actionColor[t.ruleEvaluation.action] ?? '#374151', whiteSpace: 'nowrap' }}>
                    {t.ruleEvaluation.action}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#374151' }}>
                  <div style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.enrichment.host}>{t.enrichment.domain || '-'}</div>
                  <div style={{ color: t.enrichment.hasSuspiciousTld ? '#dc2626' : '#6b7280', marginTop: 2 }}>{t.enrichment.tld ? `.${t.enrichment.tld}` : '-'}</div>
                </td>
                <td style={{ padding: '12px 14px' }}><Badge type="severity" value={t.severity} /></td>
                <td style={{ padding: '12px 14px' }}><Badge type="status" value={t.status} /></td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {new Date(t.detectedAt).toLocaleString('vi-VN')}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => navigate(`/threats/${t.id}`)} style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#374151' }}>
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !data?.items.length && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: '#9ca3af', fontSize: 14 }}>Chưa có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageButton(page === 1)}>
            Trước
          </button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: '#374151' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageButton(page === totalPages)}>
            Tiếp
          </button>
        </div>
      )}
    </div>
  )
}

function buttonStyle(disabled: boolean): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 700,
    color: '#374151',
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

function pageButton(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: '#fff',
    color: disabled ? '#9ca3af' : '#374151',
  }
}
