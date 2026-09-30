import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { baselineApi, type BaselineResponse } from '../../api/emailApi'
import {
  Cpu,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BarChart2,
} from 'lucide-react'

const METHOD_LABELS: Record<string, string> = {
  blacklist: 'Blacklist (Danh sách đen)',
  rule_based: 'Rule-based (Quy tắc)',
  lightgbm: 'LightGBM (Cây quyết định)',
  bilstm_attention: 'BiLSTM + Attention (Mạng nơ-ron)',
}

const METHOD_COLORS: Record<string, string> = {
  blacklist: '#64748b',
  rule_based: '#0ea5e9',
  lightgbm: '#3b82f6',
  bilstm_attention: '#a855f7',
}

const LABEL_COLOR: Record<string, string> = {
  phishing: '#ef4444',
  malware: '#f59e0b',
  defacement: '#c084fc',
  suspicious: '#f97316',
  benign: '#10b981',
  error: '#64748b',
}

const SAMPLE_URLS = [
  'http://free-apple-login-verify.net/id/account',
  'https://google.com/search?q=cybersecurity',
  'http://download-crack-software.ru/setup.exe',
  'http://secure-paypal-update-info.com/verify',
]

export function BaselineComparePage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<BaselineResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCompare = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await baselineApi.compare(url)
      setResult(res)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không kết nối được dịch vụ AI.')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.methods.map((m) => ({
    name: METHOD_LABELS[m.method] ?? m.method,
    score: +(m.riskScore * 100).toFixed(1),
    latency: +m.latencyMs.toFixed(1),
    label: m.label,
    method: m.method,
  })) ?? []

  return (
    <div className="saiPage">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Cpu size={22} color="#38bdf8" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Thử nghiệm & So sánh Mô hình AI (Baseline Benchmark)
          </h1>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Đánh giá so sánh trực tiếp hiệu năng giữa BiLSTM + Attention, LightGBM, Rule-based và Blacklist trên cùng một URL mục tiêu.
        </div>
      </div>

      {/* Input Box */}
      <div className="saiCard saiCardPad" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Nhập đường dẫn URL cần chạy thử nghiệm benchmark..."
            className="saiInput"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleCompare}
            disabled={loading || !url.trim()}
            className="saiButton saiButtonPrimary"
            style={{ whiteSpace: 'nowrap', minHeight: 42 }}
          >
            <Search size={15} />
            <span>{loading ? 'Đang đo lường...' : 'So sánh ngay'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>URL mẫu thử:</span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample}
              onClick={() => setUrl(sample)}
              className="saiButton saiButtonSecondary"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                minHeight: 26,
                fontFamily: 'monospace',
              }}
            >
              {sample.length > 38 ? `${sample.slice(0, 38)}...` : sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 10,
            padding: '12px 16px',
            fontSize: 13,
            color: '#f87171',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Benchmark Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Consensus Banner */}
          <div
            className="saiCard saiCardPad"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              borderLeft: `4px solid ${LABEL_COLOR[result.consensusLabel ?? ''] ?? '#38bdf8'}`,
            }}
          >
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: 4 }}>
                Nhãn đồng thuận (Consensus Label)
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: LABEL_COLOR[result.consensusLabel ?? ''] ?? '#ffffff' }}>
                {(result.consensusLabel ?? 'UNKNOWN').toUpperCase()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', marginBottom: 4 }}>
                Độ nhất quán giữa các mô hình
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: result.agreement ? '#34d399' : '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                {result.agreement ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{result.agreement ? 'Tất cả phương pháp đồng nhất kết quả' : 'Có sự phân hóa giữa các phương pháp'}</span>
              </div>
            </div>

            <div style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 12, color: '#38bdf8', background: 'rgba(7, 11, 20, 0.6)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              {result.url}
            </div>
          </div>

          {/* 3D Charts: Risk Score & Latency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
            {/* Risk Score Comparison */}
            <div className="saiCard saiCardPad">
              <h2 className="saiCardTitle" style={{ marginBottom: 16 }}>
                <BarChart2 size={18} color="#38bdf8" />
                <span>Điểm rủi ro (Risk Score %) theo từng phương pháp</span>
              </h2>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={140} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v}%`, 'Risk score']}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#38bdf8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Latency Comparison */}
            <div className="saiCard saiCardPad">
              <h2 className="saiCardTitle" style={{ marginBottom: 16 }}>
                <Clock size={18} color="#34d399" />
                <span>Độ trễ xử lý (Latency ms)</span>
              </h2>
              <div style={{ height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={140} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [`${v} ms`, 'Thời gian phản hồi']}
                    />
                    <Bar dataKey="latency" radius={[0, 6, 6, 0]}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Methods Table */}
          <div className="saiTableContainer">
            <table className="saiTable">
              <thead>
                <tr>
                  {['Phương pháp', 'Nhãn dự đoán', 'Điểm rủi ro', 'Độ tin cậy', 'Độ trễ', 'Cơ sở nhận định'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.methods.map((m) => (
                  <tr key={m.method}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                        {METHOD_LABELS[m.method] ?? m.method}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: `${LABEL_COLOR[m.label] ?? '#64748b'}20`,
                          color: LABEL_COLOR[m.label] ?? '#cbd5e1',
                          border: `1px solid ${LABEL_COLOR[m.label] ?? '#64748b'}40`,
                        }}
                      >
                        {m.label.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: m.riskScore >= 0.7 ? '#f87171' : m.riskScore >= 0.4 ? '#fbbf24' : '#34d399' }}>
                        {(m.riskScore * 100).toFixed(1)}%
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: '#cbd5e1' }}>{(m.confidence * 100).toFixed(1)}%</span>
                    </td>
                    <td>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{m.latencyMs.toFixed(1)} ms</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{m.reason}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
