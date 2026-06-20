import { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { exportApi, type Statistics } from '../../api/exportApi'

const LABEL_COLORS: Record<string, string> = {
  benign:     '#10b981',
  phishing:   '#ef4444',
  malware:    '#f59e0b',
  defacement: '#8b5cf6',
}

const SEVERITY_COLORS: Record<string, string> = {
  Low:      '#10b981',
  Medium:   '#f59e0b',
  High:     '#f97316',
  Critical: '#ef4444',
}

export function StatisticsPage() {
  const [stats, setStats]     = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    exportApi.getStatistics()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleExportThreats = async () => {
    setExporting(true)
    try { await exportApi.downloadThreatsCsv() }
    finally { setExporting(false) }
  }

  const handleExportAlerts = async () => {
    setExporting(true)
    try { await exportApi.downloadAlertsCsv() }
    finally { setExporting(false) }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Đang tải thống kê...</div>
  )

  if (!stats) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>Không tải được dữ liệu</div>
  )

  const labelPieData = (stats.labelBreakdown ?? []).map((l: { label: string; count: number }) => ({
    name:  l.label,
    value: l.count,
  }))

  const severityData = (stats.severityBreakdown ?? []).map((s: { severity: string; count: number }) => ({
    name:  s.severity,
    value: s.count,
  }))

  const trendData = (stats.last30DaysTrend ?? []).map((d: { date: string; count: number }) => ({
    date:  d.date.slice(5),
    count: d.count,
  }))

  const statCard = (label: string, value: string | number, color: string) => (
    <div key={label} style={{ background: '#fff', border: `1px solid #e5e7eb`, borderRadius: 12, padding: '16px 20px', borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Thống kê & Export</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExportThreats} disabled={exporting}
            style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: exporting ? 'not-allowed' : 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⬇ Export Threats CSV
          </button>
          <button onClick={handleExportAlerts} disabled={exporting}
            style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: exporting ? 'not-allowed' : 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
            ⬇ Export Alerts CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCard('Tổng threats',      stats.totalThreats,                    '#3b82f6')}
        {statCard('Hôm nay',           stats.todayThreats,                    '#10b981')}
        {statCard('Avg risk score',    (stats.avgRiskScore * 100).toFixed(1) + '%', '#f59e0b')}
        {statCard('Tổng alerts',       stats.totalAlerts,                     '#8b5cf6')}
        {statCard('Alerts chưa đọc',   stats.unreadAlerts,                    '#ef4444')}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Trend 30 ngày */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>Threats 30 ngày gần nhất</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Threats" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Label Pie */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>Phân bổ nhãn</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={labelPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {labelPieData.map((entry: { name: string; value: number }, i: number) => (
                  <Cell key={i} fill={LABEL_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Severity bar */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>Phân bổ severity</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={severityData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {severityData.map((entry: { name: string; value: number }, i: number) => (
                  <Cell key={i} fill={SEVERITY_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top malicious */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#374151' }}>Top 10 URLs nguy hiểm nhất</h2>
          <div style={{ overflowY: 'auto', maxHeight: 188 }}>
            {(stats.topMaliciousUrls ?? []).map((u: { url: string; predictedLabel: string; riskScore: number }, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', minWidth: 20 }}>#{i + 1}</span>
                <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: LABEL_COLORS[u.predictedLabel] + '20', color: LABEL_COLORS[u.predictedLabel] ?? '#374151' }}>
                  {u.predictedLabel}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.url}>
                  {u.url}
                </span>
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {(u.riskScore * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
