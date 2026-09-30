import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { threatApi } from '../../api/threatApi'
import { exportApi } from '../../api/exportApi'
import { Badge } from '../../components/ui/Badge'
import type { ThreatDto, PagedResult } from '../../types'
import {
  ShieldAlert,
  Filter,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from 'lucide-react'

const actionColor: Record<string, string> = {
  Block: '#ef4444',
  Review: '#f59e0b',
  Allow: '#10b981',
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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 15)) : 1
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

  return (
    <div className="saiPage">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ShieldAlert size={22} color="#38bdf8" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Kho dữ liệu Mối đe dọa (Threat Intelligence)
            </h1>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Tổng số: <strong style={{ color: '#38bdf8' }}>{data?.total ?? 0}</strong> mối đe dọa được ghi nhận trong cơ sở dữ liệu.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="saiButton saiButtonSecondary"
            style={{ fontSize: 12, minHeight: 36 }}
          >
            <FileSpreadsheet size={15} color="#34d399" />
            <span>Xuất CSV</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting}
            className="saiButton saiButtonSecondary"
            style={{ fontSize: 12, minHeight: 36 }}
          >
            <FileText size={15} color="#f87171" />
            <span>Xuất PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '12px 16px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
          <Filter size={14} color="#38bdf8" />
          <span>Bộ lọc:</span>
        </div>

        <select
          className="saiSelect"
          style={{ width: 'auto', minWidth: 160 }}
          value={label}
          onChange={(e) => { setLabel(e.target.value); setPage(1) }}
        >
          <option value="">Tất cả phân loại</option>
          <option value="phishing">Phishing (Lừa đảo)</option>
          <option value="malware">Malware (Mã độc)</option>
          <option value="defacement">Defacement (Bị sửa)</option>
          <option value="benign">Benign (An toàn)</option>
        </select>

        <select
          className="saiSelect"
          style={{ width: 'auto', minWidth: 160 }}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Chờ xử lý (Pending)</option>
          <option value="Confirmed">Đã xác nhận (Confirmed)</option>
          <option value="FalsePositive">Báo động giả (FP)</option>
          <option value="Escalated">Đã leo thang (Escalated)</option>
          <option value="Archived">Đã lưu trữ (Archived)</option>
        </select>

        {(label || status) && (
          <button
            onClick={() => { setLabel(''); setStatus(''); setPage(1) }}
            className="saiButton saiButtonGhost"
            style={{ fontSize: 12, padding: '6px 12px', minHeight: 34 }}
          >
            <RotateCcw size={13} />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* 3D Cyber Data Table */}
      <div className="saiTableContainer">
        <table className="saiTable">
          <thead>
            <tr>
              {['URL Mục tiêu', 'Phân loại', 'Điểm rủi ro', 'Hành động', 'Domain / TLD', 'Mức độ', 'Trạng thái', 'Thời điểm', 'Chi tiết'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '44px 0', color: '#94a3b8' }}>
                  Đang tải dữ liệu mối đe dọa...
                </td>
              </tr>
            )}

            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '44px 0', color: '#94a3b8' }}>
                  Không tìm thấy mối đe dọa nào khớp với bộ lọc.
                </td>
              </tr>
            )}

            {!loading && data?.items.map((t) => (
              <tr key={t.id}>
                <td style={{ maxWidth: 300 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontFamily: 'monospace',
                      color: '#e2e8f0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={t.url}
                  >
                    {t.url}
                  </div>
                </td>
                <td>
                  <Badge type="label" value={t.predictedLabel} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, minWidth: 60, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          width: `${Math.min(100, t.riskScore * 100)}%`,
                          background: t.riskScore >= 0.7 ? 'linear-gradient(90deg, #f97316, #ef4444)' : t.riskScore >= 0.4 ? '#f59e0b' : '#10b981',
                          boxShadow: t.riskScore >= 0.7 ? '0 0 8px rgba(239, 68, 68, 0.6)' : 'none',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.riskScore >= 0.7 ? '#f87171' : '#cbd5e1' }}>
                      {(t.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      background: `${actionColor[t.ruleEvaluation.action] ?? '#4b5563'}20`,
                      color: actionColor[t.ruleEvaluation.action] ?? '#cbd5e1',
                      border: `1px solid ${actionColor[t.ruleEvaluation.action] ?? '#4b5563'}40`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.ruleEvaluation.action.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#f1f5f9' }} title={t.enrichment.host}>
                    {t.enrichment.domain || '-'}
                  </div>
                  <div style={{ color: t.enrichment.hasSuspiciousTld ? '#f87171' : '#64748b', fontSize: 11, marginTop: 2 }}>
                    {t.enrichment.tld ? `.${t.enrichment.tld}` : '-'}
                  </div>
                </td>
                <td><Badge type="severity" value={t.severity} /></td>
                <td><Badge type="status" value={t.status} /></td>
                <td style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                  {new Date(t.detectedAt).toLocaleString('vi-VN')}
                </td>
                <td>
                  <button
                    onClick={() => navigate(`/threats/${t.id}`)}
                    className="saiButton saiButtonSecondary"
                    style={{ padding: '4px 10px', fontSize: 11, minHeight: 30 }}
                  >
                    <span>Xem</span>
                    <ExternalLink size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Trang <strong style={{ color: '#fff' }}>{page}</strong> / <strong>{totalPages}</strong>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="saiButton saiButtonSecondary"
            style={{ minHeight: 34, padding: '6px 12px' }}
          >
            <ChevronLeft size={15} />
            <span>Trang trước</span>
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="saiButton saiButtonSecondary"
            style={{ minHeight: 34, padding: '6px 12px' }}
          >
            <span>Trang sau</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
