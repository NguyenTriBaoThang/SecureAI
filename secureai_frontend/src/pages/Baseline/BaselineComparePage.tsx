import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { baselineApi, type BaselineResponse } from '../../api/emailApi'

const METHOD_LABELS: Record<string, string> = {
  blacklist:        'Blacklist',
  rule_based:       'Rule-based',
  lightgbm:         'LightGBM',
  bilstm_attention: 'BiLSTM+Attention ⭐',
}

const METHOD_COLORS: Record<string, string> = {
  blacklist:        '#94a3b8',
  rule_based:       '#94a3b8',
  lightgbm:         '#60a5fa',
  bilstm_attention: '#6366f1',
}

const LABEL_COLOR: Record<string, string> = {
  phishing:    '#dc2626',
  malware:     '#d97706',
  defacement:  '#7c3aed',
  suspicious:  '#ea580c',
  benign:      '#059669',
  error:       '#9ca3af',
}

const SAMPLE_URLS = [
  'http://free-apple-login-verify.net/id/account',
  'https://google.com/search?q=python',
  'http://download-crack-software.ru/setup.exe',
  'http://secure-paypal-update-info.com/verify',
]

export function BaselineComparePage() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState<BaselineResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleCompare = async () => {
    if (!url.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await baselineApi.compare(url)
      setResult(res)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Lỗi kết nối ML API')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.methods.map(m => ({
    name:      METHOD_LABELS[m.method] ?? m.method,
    score:     +(m.riskScore * 100).toFixed(1),
    latency:   m.latencyMs,
    label:     m.label,
    method:    m.method,
  })) ?? []

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Baseline Comparison</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        So sánh BiLSTM+Attention với 3 phương pháp truyền thống trên cùng 1 URL — minh họa đúng nội dung slide báo cáo.
      </p>

      {/* Input */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Nhập URL cần so sánh..."
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleCompare} disabled={loading}
            style={{ background: loading ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? 'Đang so sánh...' : 'So sánh'}
          </button>
        </div>

        {/* Sample URLs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#9ca3af', alignSelf: 'center' }}>Thử nhanh:</span>
          {SAMPLE_URLS.map(u => (
            <button key={u} onClick={() => setUrl(u)}
              style={{ fontSize: 11, padding: '3px 8px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb', cursor: 'pointer', fontFamily: 'monospace', color: '#374151' }}>
              {u.length > 40 ? u.slice(0, 40) + '…' : u}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Consensus */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Kết quả đồng thuận</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: LABEL_COLOR[result.consensusLabel ?? ''] ?? '#374151' }}>
                {(result.consensusLabel ?? 'unknown').toUpperCase()}
              </div>
            </div>
            <div style={{ marginLeft: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Độ đồng thuận</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: result.agreement ? '#059669' : '#d97706' }}>
                {result.agreement ? '✅ Tất cả đồng ý' : '⚠️ Có sự khác biệt'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 12, color: '#6b7280', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {result.url}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Risk Score Chart */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>Risk Score theo phương pháp (%)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Risk Score']} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Latency Chart */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 16px', color: '#374151' }}>Thời gian xử lý (ms)</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip formatter={(v: number) => [`${v}ms`, 'Latency']} />
                  <Bar dataKey="latency" radius={[0, 4, 4, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={METHOD_COLORS[d.method] ?? '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Phương pháp', 'Label', 'Risk Score', 'Confidence', 'Latency', 'Lý do / Ghi chú'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.methods.map((m, i) => (
                  <tr key={i} style={{ borderBottom: i < result.methods.length - 1 ? '1px solid #f3f4f6' : 'none', background: m.method === 'bilstm_attention' ? '#fafafa' : '' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: m.method === 'bilstm_attention' ? 600 : 400 }}>
                      {METHOD_LABELS[m.method] ?? m.method}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: (LABEL_COLOR[m.label] ?? '#94a3b8') + '20', color: LABEL_COLOR[m.label] ?? '#374151' }}>
                        {m.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 60, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                          <div style={{ height: 6, borderRadius: 3, width: `${m.riskScore * 100}%`, background: m.riskScore > 0.7 ? '#dc2626' : m.riskScore > 0.4 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <span>{(m.riskScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{(m.confidence * 100).toFixed(0)}%</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6b7280' }}>{m.latencyMs.toFixed(1)}ms</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6b7280', maxWidth: 250 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={m.reason}>
                        {m.reason}
                      </div>
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