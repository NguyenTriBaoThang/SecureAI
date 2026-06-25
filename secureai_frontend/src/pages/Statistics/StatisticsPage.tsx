import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { exportApi, type Statistics } from '../../api/exportApi'

const LABEL_COLORS: Record<string, string> = {
  benign: '#059669',
  phishing: '#dc2626',
  malware: '#d97706',
  defacement: '#7c3aed',
}

const SEVERITY_COLORS: Record<string, string> = {
  Low: '#059669',
  Medium: '#d97706',
  High: '#f97316',
  Critical: '#dc2626',
}

export function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    exportApi.getStatistics()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const runExport = async (task: () => Promise<void>) => {
    setExporting(true)
    try { await task() }
    finally { setExporting(false) }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Đang tải thống kê...</div>
  }

  if (!stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Không tải được dữ liệu</div>
  }

  const labelPieData = (stats.labelBreakdown ?? []).map(l => ({ name: l.label, value: l.count }))
  const severityData = (stats.severityBreakdown ?? []).map(s => ({ name: s.severity, value: s.count }))
  const trendData = (stats.last30DaysTrend ?? []).map(d => ({ date: d.date.slice(5), count: d.count }))

  return (
    <div style={{ maxWidth: 1120 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Báo cáo & Thống kê</h1>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Xuất report CSV/PDF cho threats, alerts và số liệu tổng hợp.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <ExportButton text="Threat CSV" disabled={exporting} onClick={() => runExport(() => exportApi.downloadThreatsCsv())} />
          <ExportButton text="Threat PDF" disabled={exporting} onClick={() => runExport(() => exportApi.downloadThreatsPdf())} />
          <ExportButton text="Alert CSV" disabled={exporting} onClick={() => runExport(() => exportApi.downloadAlertsCsv())} />
          <ExportButton text="Alert PDF" disabled={exporting} onClick={() => runExport(() => exportApi.downloadAlertsPdf())} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 26 }}>
        <Stat label="Tổng threat" value={stats.totalThreats} color="#2563eb" />
        <Stat label="Hôm nay" value={stats.todayThreats} color="#059669" />
        <Stat label="Risk trung bình" value={`${(stats.avgRiskScore * 100).toFixed(1)}%`} color="#d97706" />
        <Stat label="Tổng alert" value={stats.totalAlerts} color="#7c3aed" />
        <Stat label="Alert chưa đọc" value={stats.unreadAlerts} color="#dc2626" />
        <Stat label="Critical alert" value={stats.criticalAlerts ?? 0} color="#be123c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <section style={panelStyle}>
          <h2 style={panelTitle}>Threat 30 ngày gần nhất</h2>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} name="Threat" />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitle}>Phân bố nhãn</h2>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={labelPieData} cx="50%" cy="50%" innerRadius={54} outerRadius={84} paddingAngle={3} dataKey="value">
                {labelPieData.map((entry, i) => <Cell key={i} fill={LABEL_COLORS[entry.name] ?? '#94a3b8'} />)}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section style={panelStyle}>
          <h2 style={panelTitle}>Phân bố severity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {severityData.map((entry, i) => <Cell key={i} fill={SEVERITY_COLORS[entry.name] ?? '#94a3b8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitle}>Top 10 URL nguy hiểm</h2>
          <div style={{ overflowY: 'auto', maxHeight: 208 }}>
            {(stats.topMaliciousUrls ?? []).map((u, i) => (
              <div key={`${u.url}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', minWidth: 24 }}>#{i + 1}</span>
                <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 800, background: `${LABEL_COLORS[u.predictedLabel] ?? '#94a3b8'}20`, color: LABEL_COLORS[u.predictedLabel] ?? '#374151' }}>
                  {u.predictedLabel}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.url}>
                  {u.url}
                </span>
                <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 800, whiteSpace: 'nowrap' }}>{(u.riskScore * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ExportButton({ text, disabled, onClick }: { text: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#9ca3af' : '#374151' }}>
      {text}
    </button>
  )
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 18px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>{value}</div>
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
