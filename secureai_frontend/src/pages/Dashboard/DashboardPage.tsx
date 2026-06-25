import { useEffect, useState } from 'react'
import {
  CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { dashboardApi } from '../../api/dashboardApi'
import { threatApi } from '../../api/threatApi'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { AttentionHeatmap } from '../../components/ui/AttentionHeatmap'
import type { DashboardSummary, ThreatDto, TimelinePoint, TopThreat } from '../../types'

const PIE_COLORS = ['#059669', '#dc2626', '#d97706', '#7c3aed']
const actionColor: Record<string, string> = {
  Block: '#dc2626',
  Review: '#d97706',
  Allow: '#059669',
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [topThreats, setTopThreats] = useState<TopThreat[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<ThreatDto | null>(null)
  const [analyzeErr, setAnalyzeErr] = useState('')

  const loadDashboard = () => {
    dashboardApi.getSummary().then(setSummary).catch(console.error)
    dashboardApi.getTimeline(7).then(setTimeline).catch(console.error)
    dashboardApi.getTopThreats(8).then(setTopThreats).catch(console.error)
  }

  useEffect(() => { loadDashboard() }, [])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setAnalyzing(true)
    setResult(null)
    setAnalyzeErr('')
    try {
      const res = await threatApi.analyze(url)
      setResult(res)
      loadDashboard()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setAnalyzeErr(msg ?? 'Không kết nối được ML API. Kiểm tra secureai_ai tại port 8000.')
    } finally {
      setAnalyzing(false)
    }
  }

  const pieData = summary ? [
    { name: 'Benign', value: summary.labelBreakdown.benign },
    { name: 'Phishing', value: summary.labelBreakdown.phishing },
    { name: 'Malware', value: summary.labelBreakdown.malware },
    { name: 'Defacement', value: summary.labelBreakdown.defacement },
  ] : []

  return (
    <div style={{ maxWidth: 1220 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Security Dashboard</h1>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Tổng quan threat, alert, incident và xu hướng phát hiện URL độc hại.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 26 }}>
        <StatCard label="Tổng threat" value={summary?.totalThreats ?? '-'} color="#2563eb" icon="TH" />
        <StatCard label="Hôm nay" value={summary?.todayThreats ?? '-'} color="#059669" icon="TD" />
        <StatCard label="Alert chưa đọc" value={summary?.unreadAlerts ?? '-'} color="#d97706" icon="AL" />
        <StatCard label="Critical alert" value={summary?.criticalAlerts ?? '-'} color="#dc2626" icon="CR" />
        <StatCard label="Chờ review" value={summary?.pendingReview ?? '-'} color="#7c3aed" icon="RV" />
        <StatCard label="Incident mở" value={summary?.openIncidents ?? '-'} color="#be123c" icon="IC" />
        <StatCard label="Đang xử lý" value={summary?.investigatingAlerts ?? '-'} color="#0f766e" icon="IN" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, marginBottom: 24 }}>
        <section style={panelStyle}>
          <h2 style={panelTitle}>Xu hướng threat 7 ngày</h2>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="phishing" name="Phishing" stroke="#dc2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="malware" name="Malware" stroke="#d97706" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="defacement" name="Defacement" stroke="#7c3aed" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="benign" name="Benign" stroke="#059669" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitle}>Top label</h2>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={54} outerRadius={84} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, .85fr)', gap: 20 }}>
        <section style={panelStyle}>
          <h2 style={panelTitle}>Phân tích URL nhanh</h2>
          <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/login-verify"
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
            />
            <button
              type="submit"
              disabled={analyzing}
              style={{ background: analyzing ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: analyzing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {analyzing ? 'Đang phân tích...' : 'Phân tích'}
            </button>
          </form>

          {analyzeErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c' }}>
              {analyzeErr}
            </div>
          )}

          {result && (
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <Badge type="label" value={result.predictedLabel} />
                <Badge type="severity" value={result.severity} />
                <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: `${actionColor[result.ruleEvaluation.action] ?? '#4b5563'}20`, color: actionColor[result.ruleEvaluation.action] ?? '#374151' }}>
                  {result.ruleEvaluation.action}
                </span>
                <span style={{ fontSize: 14, color: '#374151' }}>Risk <strong>{(result.riskScore * 100).toFixed(1)}%</strong></span>
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, wordBreak: 'break-all' }}>{result.url}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(90px, 1fr))', gap: 10, marginBottom: 14 }}>
                <MiniFact label="Domain" value={result.enrichment.domain || '-'} />
                <MiniFact label="TLD" value={result.enrichment.tld ? `.${result.enrichment.tld}` : '-'} />
                <MiniFact label="HTTPS" value={result.enrichment.usesHttps ? 'Có' : 'Không'} />
                <MiniFact label="Subdomain" value={result.enrichment.subdomainCount} />
              </div>
              <AttentionHeatmap url={result.url} tokens={result.topAttention} label={result.predictedLabel} riskScore={result.riskScore} />
            </div>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitle}>Top URL rủi ro cao</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topThreats.length > 0 ? topThreats.map((item, index) => (
              <div key={item.id} style={{ border: '1px solid #f3f4f6', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#9ca3af', minWidth: 24 }}>#{index + 1}</span>
                  <Badge type="label" value={item.label} />
                  <span style={{ marginLeft: 'auto', color: '#dc2626', fontSize: 12, fontWeight: 800 }}>{(item.riskScore * 100).toFixed(0)}%</span>
                </div>
                <div style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.url}>{item.url}</div>
              </div>
            )) : (
              <div style={{ color: '#9ca3af', fontSize: 13 }}>Chưa có threat độc hại.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: 20,
}

const panelTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  margin: '0 0 16px',
  color: '#374151',
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 8, padding: '10px 12px', minWidth: 0 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
