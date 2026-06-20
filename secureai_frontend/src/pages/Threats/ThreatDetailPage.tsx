import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { threatApi } from '../../api/threatApi'
import { Badge } from '../../components/ui/Badge'
import { AttentionHeatmap } from '../../components/ui/AttentionHeatmap'
import type { ThreatDto } from '../../types'

const PROB_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6']

export function ThreatDetailPage() {
  const { id }            = useParams<{ id: string }>()
  const navigate          = useNavigate()
  const [threat, setThreat] = useState<ThreatDto | null>(null)
  const [note, setNote]   = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState('')

  useEffect(() => {
    if (!id) return
    threatApi.getById(id).then(setThreat).catch(() => navigate('/threats'))
  }, [id])

  const handleLabel = async (label: string) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await threatApi.label(id, label, note)
      setThreat(updated)
      setMsg(`Đã gán nhãn: ${label}`)
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!threat) return <div style={{ padding: 40, color: '#6b7280' }}>Đang tải...</div>

  const probData = [
    { name: 'Benign',     value: +(threat.benignProb * 100).toFixed(1) },
    { name: 'Phishing',   value: +(threat.phishingProb * 100).toFixed(1) },
    { name: 'Malware',    value: +(threat.malwareProb * 100).toFixed(1) },
    { name: 'Defacement', value: +(threat.defacementProb * 100).toFixed(1) },
  ]

  const btnStyle = (color: string, disabled = false): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', fontWeight: 600,
    fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e5e7eb' : color, color: disabled ? '#9ca3af' : '#fff',
  })

  return (
    <div style={{ maxWidth: 900 }}>
      <button onClick={() => navigate('/threats')}
        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>
        ← Quay lại danh sách
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Chi tiết Threat</h1>
      <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'monospace', marginBottom: 24 }}>{threat.url}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Info */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Thông tin</h2>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            {[
              ['Label',      <Badge type="label"    value={threat.predictedLabel} />],
              ['Severity',   <Badge type="severity" value={threat.severity} />],
              ['Status',     <Badge type="status"   value={threat.status} />],
              ['Risk Score', <strong>{(threat.riskScore * 100).toFixed(1)}%</strong>],
              ['Phát hiện',  new Date(threat.detectedAt).toLocaleString('vi-VN')],
            ].map(([k, v]) => (
              <tr key={String(k)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '8px 0', color: '#6b7280', width: '40%' }}>{k}</td>
                <td style={{ padding: '8px 0' }}>{v}</td>
              </tr>
            ))}
          </table>
        </div>

        {/* Probability chart */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Xác suất (%) theo class</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={probData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {probData.map((_, i) => <Cell key={i} fill={PROB_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attention Heatmap */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Attention Heatmap (BiLSTM)</h2>
        <AttentionHeatmap
          url={threat.url}
          tokens={threat.topAttention}
          label={threat.predictedLabel}
          riskScore={threat.riskScore}
        />
      </div>

      {/* Analyst Workbench */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#374151' }}>Analyst Workbench</h2>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ghi chú (tuỳ chọn)..."
          rows={2}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => handleLabel('confirmed')}     disabled={saving} style={btnStyle('#ef4444', saving)}>✓ Xác nhận mối đe doạ</button>
          <button onClick={() => handleLabel('false_positive')} disabled={saving} style={btnStyle('#10b981', saving)}>✗ False Positive</button>
          <button onClick={() => handleLabel('escalated')}     disabled={saving} style={btnStyle('#f59e0b', saving)}>↑ Escalate</button>
        </div>
        {msg && <div style={{ marginTop: 10, fontSize: 13, color: '#10b981' }}>{msg}</div>}
      </div>
    </div>
  )
}
