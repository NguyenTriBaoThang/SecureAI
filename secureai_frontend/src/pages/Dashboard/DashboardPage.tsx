import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { dashboardApi } from '../../api/dashboardApi'
import { threatApi } from '../../api/threatApi'
import { StatCard } from '../../components/ui/StatCard'
import { AttentionHeatmap } from '../../components/ui/AttentionHeatmap'
import type { DashboardSummary, TimelinePoint, ThreatDto } from '../../types'

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6']

export function DashboardPage() {
  const [summary, setSummary]     = useState<DashboardSummary | null>(null)
  const [timeline, setTimeline]   = useState<TimelinePoint[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [url, setUrl]             = useState('')
  const [result, setResult]       = useState<ThreatDto | null>(null)
  const [analyzeErr, setAnalyzeErr] = useState('')

  useEffect(() => {
    dashboardApi.getSummary().then(setSummary).catch(console.error)
    dashboardApi.getTimeline(7).then(setTimeline).catch(console.error)
  }, [])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setAnalyzing(true)
    setResult(null)
    setAnalyzeErr('')
    try {
      const res = await threatApi.analyze(url)
      setResult(res)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setAnalyzeErr(msg ?? 'Lỗi kết nối ML API — đảm bảo secureai_ai đang chạy ở port 8000')
    } finally {
      setAnalyzing(false)
    }
  }

  const pieData = summary ? [
    { name: 'Benign',      value: summary.labelBreakdown.benign },
    { name: 'Phishing',    value: summary.labelBreakdown.phishing },
    { name: 'Malware',     value: summary.labelBreakdown.malware },
    { name: 'Defacement',  value: summary.labelBreakdown.defacement },
  ] : []

  return (
    <div style={{ maxWidth: 1200 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 24 }}>Dashboard</h1>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Tổng threats"     value={summary?.totalThreats ?? '—'}   color="#3b82f6" icon="🔍" />
        <StatCard label="Hôm nay"          value={summary?.todayThreats ?? '—'}   color="#10b981" icon="📅" />
        <StatCard label="Alerts chưa đọc"  value={summary?.unreadAlerts ?? '—'}   color="#f59e0b" icon="🔔" />
        <StatCard label="Critical alerts"  value={summary?.criticalAlerts ?? '—'} color="#ef4444" icon="🚨" />
        <StatCard label="Chờ xử lý"        value={summary?.pendingReview ?? '—'}  color="#8b5cf6" icon="⏳" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 28 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#374151' }}>Timeline 7 ngày</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="phishing"   stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="malware"    stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="defacement" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="benign"     stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#374151' }}>Phân bổ nhãn</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Analyze */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#374151' }}>🔎 Phân tích URL nhanh</h2>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/login-verify"
            style={{
              flex: 1, padding: '10px 14px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 14, outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={analyzing}
            style={{
              background: analyzing ? '#93c5fd' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              cursor: analyzing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {analyzing ? 'Đang phân tích...' : 'Phân tích'}
          </button>
        </form>

        {analyzeErr && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
            {analyzeErr}
          </div>
        )}

        {result && (
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                background: result.predictedLabel === 'benign' ? '#d1fae5' : '#fee2e2',
                color: result.predictedLabel === 'benign' ? '#065f46' : '#991b1b',
              }}>
                {result.predictedLabel.toUpperCase()}
              </span>
              <span style={{ fontSize: 14, color: '#374151' }}>
                Risk Score: <strong>{(result.riskScore * 100).toFixed(1)}%</strong>
              </span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{result.url}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Benign',     value: result.benignProb,      color: '#10b981' },
                { label: 'Phishing',   value: result.phishingProb,    color: '#ef4444' },
                { label: 'Malware',    value: result.malwareProb,     color: '#f59e0b' },
                { label: 'Defacement', value: result.defacementProb,  color: '#8b5cf6' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{(value * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
                </div>
              ))}
            </div>

            <AttentionHeatmap
              url={result.url}
              tokens={result.topAttention}
              label={result.predictedLabel}
              riskScore={result.riskScore}
            />
          </div>
        )}
      </div>
    </div>
  )
}
