import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { threatApi } from '../../api/threatApi'
import { Badge } from '../../components/ui/Badge'
import { AttentionHeatmap } from '../../components/ui/AttentionHeatmap'
import type { ThreatDto } from '../../types'

const PROB_COLORS = ['#059669', '#dc2626', '#d97706', '#7c3aed']
const actionColor: Record<string, string> = {
  Block: '#dc2626',
  Review: '#d97706',
  Allow: '#059669',
}

export function ThreatDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [threat, setThreat] = useState<ThreatDto | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!id) return
    try {
      const res = await threatApi.getById(id)
      setThreat(res)
    } catch {
      navigate('/threats')
    }
  }

  useEffect(() => { load() }, [id])

  const handleLabel = async (label: string) => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await threatApi.label(id, label, note)
      setThreat(updated)
      setNote('')
      setMsg(`Đã cập nhật: ${label}`)
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!threat) {
    return <div style={{ padding: 40, color: '#6b7280' }}>Đang tải...</div>
  }

  const explanation = threat.riskExplanation
  const rule = threat.ruleEvaluation
  const enrich = threat.enrichment
  const probData = [
    { name: 'Benign', value: +(threat.benignProb * 100).toFixed(1) },
    { name: 'Phishing', value: +(threat.phishingProb * 100).toFixed(1) },
    { name: 'Malware', value: +(threat.malwareProb * 100).toFixed(1) },
    { name: 'Defacement', value: +(threat.defacementProb * 100).toFixed(1) },
  ]

  return (
    <div style={{ maxWidth: 1180 }}>
      <button onClick={() => navigate('/threats')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>
        Quay lại danh sách threat
      </button>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>Chi tiết threat</h1>
        <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' }}>{threat.url}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 20, marginBottom: 20 }}>
        <Panel title="Rule Engine">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ background: actionColor[rule.action] ?? '#4b5563', color: '#fff', padding: '6px 14px', borderRadius: 8, fontWeight: 800, fontSize: 15 }}>
              {rule.action}
            </span>
            <Badge type="severity" value={threat.severity} />
            <Badge type="status" value={threat.status} />
            <span style={{ fontSize: 13, color: '#374151' }}>Risk {(threat.riskScore * 100).toFixed(1)}%</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
            <Fact label="Ngưỡng review" value={`${(rule.reviewThreshold * 100).toFixed(0)}%`} />
            <Fact label="Ngưỡng block" value={`${(rule.blockThreshold * 100).toFixed(0)}%`} />
          </div>
          <List title="Rule khớp" items={rule.triggeredRules} empty="Không có rule nào khớp." />
          <List title="Hành động đề xuất" items={rule.recommendedActions} />
        </Panel>

        <Panel title="Incident">
          {threat.incident ? (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <Badge type="status" value={threat.incident.status} />
                <Badge type="severity" value={threat.incident.priority} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 8 }}>{threat.incident.title}</div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 10 }}>Action: <strong>{threat.incident.recommendedAction}</strong></div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Cập nhật {new Date(threat.incident.updatedAt).toLocaleString('vi-VN')}</div>
              <button onClick={() => navigate('/incidents')} style={{ ...secondaryButton, marginTop: 14 }}>Mở incident</button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              Chưa tạo incident cho threat này.
            </div>
          )}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Panel title="Threat Intelligence Enrichment">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
            <Fact label="Host" value={enrich.host || '-'} />
            <Fact label="Domain" value={enrich.domain || '-'} />
            <Fact label="TLD" value={enrich.tld ? `.${enrich.tld}` : '-'} />
            <Fact label="HTTPS" value={enrich.usesHttps ? 'Có' : 'Không'} />
            <Fact label="IP trực tiếp" value={enrich.isIpAddress ? 'Có' : 'Không'} />
            <Fact label="Độ dài URL" value={enrich.urlLength} />
            <Fact label="Subdomain" value={enrich.subdomainCount} />
            <Fact label="Query params" value={enrich.queryParameterCount} />
          </div>
          <List title="Indicator" items={enrich.indicators} />
          <List title="Keyword nhạy cảm" items={enrich.suspiciousKeywords} empty="Không có keyword nhạy cảm." />
        </Panel>

        <Panel title="Xác suất model">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={probData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={86} />
              <Tooltip formatter={(v: number) => [`${v}%`]} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {probData.map((_, i) => <Cell key={i} fill={PROB_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <Panel title="Giải thích rủi ro">
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 12px' }}>{explanation.modelScore}</p>
          <List title="Tín hiệu model" items={explanation.modelSignals} />
          <List title="URL indicator" items={explanation.urlIndicators} />
          <List title="Attention highlight" items={explanation.attentionHighlights} empty="Không có attention highlight." />
        </Panel>

        <Panel title="Attention Heatmap">
          <AttentionHeatmap url={threat.url} tokens={threat.topAttention} label={threat.predictedLabel} riskScore={threat.riskScore} />
        </Panel>
      </div>

      <Panel title="Analyst Notes & Feedback Loop">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Ghi chú phân tích, bằng chứng hoặc lý do gán nhãn..."
          rows={3}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, outline: 'none' }}
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={() => handleLabel('confirmed')} disabled={saving} style={buttonStyle('#dc2626', saving)}>Xác nhận threat</button>
          <button onClick={() => handleLabel('false_positive')} disabled={saving} style={buttonStyle('#059669', saving)}>False positive</button>
          <button onClick={() => handleLabel('escalated')} disabled={saving} style={buttonStyle('#d97706', saving)}>Escalate</button>
        </div>
        {msg && <div style={{ marginBottom: 12, fontSize: 13, color: '#059669' }}>{msg}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {threat.analystNotes.length > 0 ? threat.analystNotes.map(item => (
            <div key={item.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#f9fafb' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                <Badge type="status" value={item.label} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{item.analystEmail}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap' }}>{item.note || 'Không có ghi chú.'}</div>
            </div>
          )) : (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>Chưa có ghi chú analyst.</div>
          )}
        </div>
      </Panel>
    </div>
  )
}

function Panel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 14px', color: '#374151' }}>{title}</h2>
      {children}
    </div>
  )
}

function Fact({ label, value }: { label: string, value: string | number }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, padding: '9px 10px', minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#111827', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(value)}>{value}</div>
    </div>
  )
}

function List({ title, items, empty = 'Không có dữ liệu.' }: { title: string, items: string[], empty?: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{title}</div>
      {items.length > 0 ? (
        <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', fontSize: 13, lineHeight: 1.7 }}>
          {items.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      ) : <div style={{ fontSize: 13, color: '#9ca3af' }}>{empty}</div>}
    </div>
  )
}

const secondaryButton: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 13,
  cursor: 'pointer',
  color: '#374151',
}

function buttonStyle(color: string, disabled = false): React.CSSProperties {
  return {
    padding: '8px 14px',
    borderRadius: 8,
    border: 'none',
    fontWeight: 800,
    fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e5e7eb' : color,
    color: disabled ? '#9ca3af' : '#fff',
  }
}

