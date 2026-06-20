import { useState, useRef } from 'react'
import { emailApi, type EmailAnalyzeResponse } from '../../api/emailApi'

// ── Types ──────────────────────────────────────────────────────────────────────
interface EmailForm {
  from:    string
  to:      string
  subject: string
  body:    string
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function buildRawEmail(form: EmailForm): string {
  return [
    `From: ${form.from}`,
    `To: ${form.to}`,
    `Subject: ${form.subject}`,
    '',
    form.body,
  ].join('\n')
}

function verdictColor(v: string) {
  if (v === 'phishing')   return '#dc2626'
  if (v === 'suspicious') return '#d97706'
  return '#059669'
}
function verdictBg(v: string) {
  if (v === 'phishing')   return '#fef2f2'
  if (v === 'suspicious') return '#fffbeb'
  return '#f0fdf4'
}

// ── Component ──────────────────────────────────────────────────────────────────
export function EmailAnalyzePage() {
  const [tab, setTab]               = useState<'form' | 'upload'>('form')
  const [form, setForm]             = useState<EmailForm>({ from: '', to: '', subject: '', body: '' })
  const [result, setResult]         = useState<EmailAnalyzeResponse | null>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [extracting, setExtracting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Phân tích từ form ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!form.from && !form.body) { setError('Nhập ít nhất From và nội dung email'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await emailApi.analyze({ rawEmail: buildRawEmail(form), analyzeUrls: true })
      setResult(res)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Lỗi kết nối ML API — đảm bảo secureai_ai đang chạy ở port 8000')
    } finally { setLoading(false) }
  }

  // ── Extract từ file qua secureai_ai backend ──────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExtracting(true); setError('')

    try {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.type)) {
        setError('Chỉ hỗ trợ ảnh (PNG, JPG) hoặc PDF')
        setExtracting(false)
        return
      }

      // Gửi file lên secureai_ai (Python FastAPI) — không gọi Claude trực tiếp
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('http://localhost:8000/extract/email', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Lỗi extract')
      }

      const parsed = await res.json()

      setForm({
        from:    parsed.from    ?? '',
        to:      parsed.to      ?? '',
        subject: parsed.subject ?? '',
        body:    parsed.body    ?? '',
      })
      setTab('form')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không đọc được file'
      setError(`${msg} — đảm bảo secureai_ai đang chạy và đã set ANTHROPIC_API_KEY`)
    } finally {
      setExtracting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#111827',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#374151',
    display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.4px',
  }

  const flagRow = (label: string, value: boolean | number | string | null | undefined, bad: boolean) => (
    <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
      <td style={{ padding: '8px 0', fontSize: 13, color: '#6b7280', width: '55%' }}>{label}</td>
      <td style={{ padding: '8px 0', fontSize: 13 }}>
        {typeof value === 'boolean'
          ? <span style={{ color: value === bad ? '#dc2626' : '#059669', fontWeight: 500 }}>{value ? '✗ Fail' : '✓ Pass'}</span>
          : <span style={{ color: '#374151' }}>{String(value ?? '—')}</span>
        }
      </td>
    </tr>
  )

  const hf = result?.headerFlags
  const bf = result?.bodyFlags

  return (
    <div style={{ maxWidth: 1060 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Email Phishing Analysis</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          Phân tích email phishing qua form hoặc upload ảnh/PDF chụp Gmail
        </p>
      </div>

      {/* Tab switch */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#f3f4f6', borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {[
          { key: 'form',   label: '✏️ Nhập thủ công' },
          { key: 'upload', label: '📎 Upload ảnh / PDF' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as 'form' | 'upload')}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: tab === t.key ? '#fff' : 'transparent',
              color:      tab === t.key ? '#111827' : '#6b7280',
              boxShadow:  tab === t.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>

        {/* ── Left: Input ──────────────────────────────────────────────────── */}
        <div>

          {/* Upload tab */}
          {tab === 'upload' && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: '#374151' }}>Upload ảnh chụp Gmail hoặc PDF</h2>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px' }}>
                Chụp màn hình email trong Gmail, hoặc export PDF → upload. Claude AI sẽ tự đọc nội dung.
              </p>

              <input ref={fileRef} type="file" accept="image/*,application/pdf"
                onChange={handleFileUpload} style={{ display: 'none' }} />

              <div onClick={() => !extracting && fileRef.current?.click()}
                style={{
                  border: '2px dashed #d1d5db', borderRadius: 10, padding: '40px 20px',
                  textAlign: 'center', cursor: extracting ? 'wait' : 'pointer',
                  background: extracting ? '#f9fafb' : '#fff',
                  transition: 'border-color .15s',
                }}>
                {extracting ? (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                    <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Claude đang đọc email...</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Vui lòng đợi</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>📎</div>
                    <div style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>Nhấn để chọn file</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>PNG, JPG, PDF — tối đa 10MB</div>
                  </>
                )}
              </div>

              {form.from || form.body ? (
                <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
                  ✅ Đã extract được nội dung — chuyển sang tab <strong>Nhập thủ công</strong> để xem và phân tích
                  <button onClick={() => setTab('form')}
                    style={{ marginLeft: 10, background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
                    Xem ngay →
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Form tab */}
          {tab === 'form' && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#374151' }}>Thông tin email</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>From (người gửi)</label>
                  <input value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                    placeholder="security@paypal.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>To (người nhận)</label>
                  <input value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                    placeholder="you@gmail.com" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject (tiêu đề)</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="[URGENT] Your account has been suspended" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Body (nội dung)</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Dán toàn bộ nội dung email vào đây..."
                  rows={10}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleAnalyze} disabled={loading}
                  style={{ flex: 1, background: loading ? '#93c5fd' : '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Đang phân tích...' : '🔍 Phân tích Email'}
                </button>
                <button onClick={() => { setForm({ from: '', to: '', subject: '', body: '' }); setResult(null); setError('') }}
                  style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '11px 16px', fontSize: 14, cursor: 'pointer', color: '#374151' }}>
                  Xoá
                </button>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Result ─────────────────────────────────────────────────── */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Verdict */}
            <div style={{ background: verdictBg(result.verdict ?? ''), borderRadius: 12, border: `1px solid ${verdictColor(result.verdict ?? '')}30`, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>KẾT LUẬN</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: verdictColor(result.verdict ?? '') }}>
                    {(result.verdict ?? 'unknown').toUpperCase()}
                  </div>
                </div>
                <div style={{ marginLeft: 8 }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>RISK SCORE</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: verdictColor(result.verdict ?? '') }}>
                    {((result.riskScore ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: result.action === 'block' ? '#dc2626' : result.action === 'review' ? '#d97706' : '#059669',
                  color: '#fff' }}>
                  {(result.action ?? 'allow').toUpperCase()}
                </span>
              </div>
              {(result.reasons ?? []).length > 0 && (
                <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#374151', lineHeight: 1.8 }}>
                  {(result.reasons ?? []).map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>

            {/* Header Flags */}
            {hf && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#374151' }}>🔒 Header Analysis</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {flagRow('SPF',              !hf.spfPass,          true)}
                    {flagRow('DKIM',             !hf.dkimPass,         true)}
                    {flagRow('DMARC',            !hf.dmarcPass,        true)}
                    {flagRow('Reply-To mismatch', hf.replyToMismatch,  true)}
                    {hf.fromDomain && flagRow('From domain', hf.fromDomain, false)}
                    {hf.subject    && flagRow('Subject',     hf.subject,    false)}
                  </tbody>
                </table>
              </div>
            )}

            {/* Body Flags */}
            {bf && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#374151' }}>📝 Body / NLP Analysis</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 0', fontSize: 13, color: '#6b7280', width: '55%' }}>Urgency keywords</td>
                      <td style={{ padding: '7px 0', fontSize: 13, color: (bf.urgencyKeywords ?? 0) >= 2 ? '#dc2626' : '#374151', fontWeight: (bf.urgencyKeywords ?? 0) >= 2 ? 600 : 400 }}>{bf.urgencyKeywords ?? 0}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 0', fontSize: 13, color: '#6b7280' }}>Phishing keywords</td>
                      <td style={{ padding: '7px 0', fontSize: 13, color: (bf.phishingKeywords ?? 0) >= 1 ? '#dc2626' : '#374151', fontWeight: (bf.phishingKeywords ?? 0) >= 1 ? 600 : 400 }}>{bf.phishingKeywords ?? 0}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 0', fontSize: 13, color: '#6b7280' }}>Brand mismatch</td>
                      <td style={{ padding: '7px 0', fontSize: 13, color: bf.brandMismatch ? '#dc2626' : '#059669', fontWeight: 500 }}>
                        {bf.brandMismatch ? `✗ Phát hiện (${(bf.mentionedBrands ?? []).join(', ')})` : '✓ Không'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '7px 0', fontSize: 13, color: '#6b7280' }}>HTML form ẩn</td>
                      <td style={{ padding: '7px 0', fontSize: 13, color: bf.hasHtmlForm ? '#dc2626' : '#6b7280' }}>{bf.hasHtmlForm ? '✗ Phát hiện' : '—'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '7px 0', fontSize: 13, color: '#6b7280' }}>URLs trong email</td>
                      <td style={{ padding: '7px 0', fontSize: 13 }}>{bf.linkCount ?? 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* URLs */}
            {(result.urlsFound ?? []).length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#374151' }}>
                  🔗 URLs phát hiện ({(result.urlsFound ?? []).length})
                </div>
                {(result.urlsFound ?? []).map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < (result.urlsFound ?? []).length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: u.label === 'benign' ? '#d1fae5' : '#fee2e2',
                      color:      u.label === 'benign' ? '#065f46' : '#991b1b' }}>
                      {u.label}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.url}>
                      {u.url}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {((u.riskScore ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}