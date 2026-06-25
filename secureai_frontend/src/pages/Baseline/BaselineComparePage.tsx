import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { baselineApi, type BaselineResponse } from '../../api/emailApi'

const METHOD_LABELS: Record<string, string> = {
  blacklist: 'Blacklist',
  rule_based: 'Rule-based',
  lightgbm: 'LightGBM',
  bilstm_attention: 'BiLSTM + Attention',
}

const METHOD_COLORS: Record<string, string> = {
  blacklist: '#64748b',
  rule_based: '#0f766e',
  lightgbm: '#2563eb',
  bilstm_attention: '#7c3aed',
}

const LABEL_COLOR: Record<string, string> = {
  phishing: '#dc2626',
  malware: '#d97706',
  defacement: '#7c3aed',
  suspicious: '#ea580c',
  benign: '#059669',
  error: '#6b7280',
}

const SAMPLE_URLS = [
  'http://free-apple-login-verify.net/id/account',
  'https://google.com/search?q=python',
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
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không kết nối được ML API')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.methods.map(m => ({
    name: METHOD_LABELS[m.method] ?? m.method,
    score: +(m.riskScore * 100).toFixed(1),
    latency: +m.latencyMs.toFixed(1),
    label: m.label,
    method: m.method,
  })) ?? []

  return (
    <div style={{ maxWidth: 1020 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>So sánh model</h1>
        <div style={{ fontSize: 13, color: '#6b7280' }}>BiLSTM + Attention so với blacklist, rule-based và LightGBM trên cùng một URL.</div>
      </div>

      <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Nhập URL cần so sánh..."
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleCompare} disabled={loading} style={{ background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? 'Đang so sánh...' : 'So sánh'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#9ca3af', alignSelf: 'center' }}>Mẫu:</span>
          {SAMPLE_URLS.map(sample => (
            <button key={sample} onClick={() => setUrl(sample)} style={{ fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb', cursor: 'pointer', fontFamily: 'monospace', color: '#374151' }}>
              {sample.length > 42 ? `${sample.slice(0, 42)}...` : sample}
            </button>
          ))}
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Nhãn đồng thuận</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: LABEL_COLOR[result.consensusLabel ?? ''] ?? '#374151' }}>
                {(result.consensusLabel ?? 'unknown').toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Độ đồng thuận</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: result.agreement ? '#059669' : '#d97706' }}>
                {result.agreement ? 'Tất cả cùng nhãn' : 'Có khác biệt giữa các phương pháp'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 12, color: '#6b7280', maxWidth: 330, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={result.url}>
              {result.url}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <section style={panelStyle}>
              <h2 style={panelTitle}>Risk score theo phương pháp</h2>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={132} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Risk score']} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#64748b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section style={panelStyle}>
              <h2 style={panelTitle}>Thời gian xử lý</h2>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={132} />
                  <Tooltip formatter={(v: number) => [`${v} ms`, 'Latency']} />
                  <Bar dataKey="latency" radius={[0, 4, 4, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#64748b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Phương pháp', 'Label', 'Risk score', 'Confidence', 'Latency', 'Lý do'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.methods.map((m, i) => (
                  <tr key={m.method} style={{ borderBottom: i < result.methods.length - 1 ? '1px solid #f3f4f6' : 'none', background: m.method === 'bilstm_attention' ? '#faf5ff' : '#fff' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: m.method === 'bilstm_attention' ? 800 : 500 }}>{METHOD_LABELS[m.method] ?? m.method}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: `${LABEL_COLOR[m.label] ?? '#64748b'}20`, color: LABEL_COLOR[m.label] ?? '#374151' }}>{m.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 64, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                          <div style={{ height: 6, borderRadius: 3, width: `${Math.min(100, m.riskScore * 100)}%`, background: m.riskScore > 0.7 ? '#dc2626' : m.riskScore > 0.4 ? '#d97706' : '#059669' }} />
                        </div>
                        <span>{(m.riskScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{(m.confidence * 100).toFixed(0)}%</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{m.latencyMs.toFixed(1)} ms</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.reason}>{m.reason}</div>
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

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  padding: 20,
}

const panelTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  margin: '0 0 16px',
  color: '#374151',
}
