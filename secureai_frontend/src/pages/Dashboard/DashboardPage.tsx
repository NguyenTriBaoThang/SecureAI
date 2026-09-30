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
import {
  ShieldAlert,
  Calendar,
  Bell,
  AlertOctagon,
  Clock,
  Flame,
  Activity,
  Search,
  Zap,
  TrendingUp,
  PieChart as PieIcon,
  Globe,
  Lock,
  Layers,
} from 'lucide-react'

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#a855f7']
const actionColor: Record<string, string> = {
  Block: '#ef4444',
  Review: '#f59e0b',
  Allow: '#10b981',
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
      setAnalyzeErr(msg ?? 'Không kết nối được dịch vụ AI. Vui lòng kiểm tra secureai_ai tại port 8000.')
    } finally {
      setAnalyzing(false)
    }
  }

  const pieData = summary ? [
    { name: 'Benign (An toàn)', value: summary.labelBreakdown.benign },
    { name: 'Phishing (Lừa đảo)', value: summary.labelBreakdown.phishing },
    { name: 'Malware (Mã độc)', value: summary.labelBreakdown.malware },
    { name: 'Defacement (Bị sửa)', value: summary.labelBreakdown.defacement },
  ] : []

  return (
    <div className="saiPage">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Activity size={22} color="#38bdf8" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Trung tâm Vận hành An ninh mạng (SOC Dashboard)
            </h1>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Giám sát thời gian thực mối đe dọa, cảnh báo nguy cấp, hàng đợi sự cố và xu hướng tấn công mạng.
          </div>
        </div>
      </div>

      {/* 3D Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 26 }}>
        <StatCard label="Tổng mối đe dọa" value={summary?.totalThreats ?? 0} color="#38bdf8" icon={<ShieldAlert size={18} />} subtitle="Tất cả thời gian" />
        <StatCard label="Phát hiện hôm nay" value={summary?.todayThreats ?? 0} color="#10b981" icon={<Calendar size={18} />} subtitle="24 giờ qua" />
        <StatCard label="Alert chưa đọc" value={summary?.unreadAlerts ?? 0} color="#f59e0b" icon={<Bell size={18} />} subtitle="Cần xử lý" />
        <StatCard label="Cảnh báo nguy cấp" value={summary?.criticalAlerts ?? 0} color="#ef4444" icon={<AlertOctagon size={18} />} subtitle="Critical severity" />
        <StatCard label="Chờ Review" value={summary?.pendingReview ?? 0} color="#a855f7" icon={<Clock size={18} />} subtitle="Hàng đợi Analyst" />
        <StatCard label="Sự cố đang mở" value={summary?.openIncidents ?? 0} color="#f43f5e" icon={<Flame size={18} />} subtitle="Active Incidents" />
        <StatCard label="Đang điều tra" value={summary?.investigatingAlerts ?? 0} color="#06b6d4" icon={<Zap size={18} />} subtitle="In progress" />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(320px, 0.75fr)', gap: 22, marginBottom: 24 }}>
        {/* Timeline Chart */}
        <div className="saiCard saiCardPad">
          <div className="saiCardHeader">
            <div>
              <h2 className="saiCardTitle">
                <TrendingUp size={18} color="#38bdf8" />
                <span>Xu hướng phát hiện 7 ngày gần nhất</span>
              </h2>
              <p className="saiCardText">Số lượng phát hiện phân loại theo nhãn nguy cơ mỗi ngày.</p>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="phishing" name="Phishing" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="malware" name="Malware" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="defacement" name="Defacement" stroke="#c084fc" strokeWidth={2} dot={{ r: 3, fill: '#c084fc' }} />
                <Line type="monotone" dataKey="benign" name="Benign" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Breakdown */}
        <div className="saiCard saiCardPad">
          <div className="saiCardHeader">
            <div>
              <h2 className="saiCardTitle">
                <PieIcon size={18} color="#38bdf8" />
                <span>Phân bố theo nhãn nguy cơ</span>
              </h2>
              <p className="saiCardText">Tỉ lệ giữa các loại rủi ro trên toàn hệ thống.</p>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick URL Scan & Top High-risk Threats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(340px, 0.8fr)', gap: 22 }}>
        {/* Quick URL Scan Panel */}
        <div className="saiCard saiCardPad">
          <div className="saiCardHeader">
            <div>
              <h2 className="saiCardTitle">
                <Zap size={18} color="#38bdf8" />
                <span>Phân tích URL nhanh bằng AI</span>
              </h2>
              <p className="saiCardText">Inference trực tiếp qua BiLSTM + Attention và Rule Engine.</p>
            </div>
          </div>

          <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://verify-account-security.service-net.com/login"
              className="saiInput"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={analyzing}
              className="saiButton saiButtonPrimary"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Search size={15} />
              <span>{analyzing ? 'Đang phân tích...' : 'Phân tích'}</span>
            </button>
          </form>

          {analyzeErr && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
              {analyzeErr}
            </div>
          )}

          {result && (
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 18 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <Badge type="label" value={result.predictedLabel} />
                <Badge type="severity" value={result.severity} />
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    background: `${actionColor[result.ruleEvaluation.action] ?? '#4b5563'}25`,
                    color: actionColor[result.ruleEvaluation.action] ?? '#cbd5e1',
                    border: `1px solid ${actionColor[result.ruleEvaluation.action] ?? '#4b5563'}50`,
                  }}
                >
                  HÀNH ĐỘNG: {result.ruleEvaluation.action.toUpperCase()}
                </span>
                <span style={{ fontSize: 14, color: '#e2e8f0', marginLeft: 'auto' }}>
                  Risk Score:{' '}
                  <strong style={{ color: result.riskScore >= 0.7 ? '#f87171' : result.riskScore >= 0.4 ? '#fbbf24' : '#34d399' }}>
                    {(result.riskScore * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                <MiniFact label="Domain" value={result.enrichment.domain || '-'} icon={<Globe size={13} />} />
                <MiniFact label="TLD" value={result.enrichment.tld ? `.${result.enrichment.tld}` : '-'} icon={<Layers size={13} />} />
                <MiniFact label="HTTPS" value={result.enrichment.usesHttps ? 'Có' : 'Không'} icon={<Lock size={13} />} />
                <MiniFact label="Subdomains" value={result.enrichment.subdomainCount} icon={<Layers size={13} />} />
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

        {/* Top High-Risk Threats */}
        <div className="saiCard saiCardPad">
          <div className="saiCardHeader">
            <div>
              <h2 className="saiCardTitle">
                <ShieldAlert size={18} color="#ef4444" />
                <span>Top URL rủi ro cao nhất</span>
              </h2>
              <p className="saiCardText">Các mối đe dọa vừa được ghi nhận gần đây.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topThreats.length > 0 ? (
              topThreats.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    background: 'rgba(7, 11, 20, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#38bdf8',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      #{index + 1}
                    </span>
                    <Badge type="label" value={item.label} />
                    <span style={{ marginLeft: 'auto', color: '#f87171', fontSize: 13, fontWeight: 800 }}>
                      {(item.riskScore * 100).toFixed(0)}% Risk
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#cbd5e1',
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.url}
                  >
                    {item.url}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                Chưa có dữ liệu mối đe dọa.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniFact({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(7, 11, 20, 0.7)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        padding: '10px 12px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}
