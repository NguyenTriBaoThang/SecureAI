import { useRef, useState } from 'react'
import { emailApi, type EmailAnalyzeResponse } from '../../api/emailApi'

interface EmailForm {
  from: string
  to: string
  subject: string
  body: string
}

function buildRawEmail(form: EmailForm): string {
  return [`From: ${form.from}`, `To: ${form.to}`, `Subject: ${form.subject}`, '', form.body].join('\n')
}

function verdictColor(value: string) {
  if (value === 'phishing') return '#dc2626'
  if (value === 'suspicious') return '#d97706'
  return '#059669'
}

function verdictBg(value: string) {
  if (value === 'phishing') return '#fef2f2'
  if (value === 'suspicious') return '#fffbeb'
  return '#f0fdf4'
}

export function EmailAnalyzePage() {
  const [tab, setTab] = useState<'form' | 'upload'>('form')
  const [form, setForm] = useState<EmailForm>({ from: '', to: '', subject: '', body: '' })
  const [result, setResult] = useState<EmailAnalyzeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAnalyze = async () => {
    if (!form.from && !form.body) {
      setError('Nhập ít nhất người gửi hoặc nội dung email.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await emailApi.analyze({ rawEmail: buildRawEmail(form), analyzeUrls: true })
      setResult(res)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không kết nối được ML API. Kiểm tra secureai_ai tại port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExtracting(true)
    setError('')
    try {
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.type)) {
        setError('Chỉ hỗ trợ ảnh PNG/JPG/WebP hoặc PDF.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('http://localhost:8000/extract/email', { method: 'POST', body: formData })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Không extract được email.')
      }

      const parsed = await res.json()
      setForm({
        from: parsed.from ?? '',
        to: parsed.to ?? '',
        subject: parsed.subject ?? '',
        body: parsed.body ?? '',
      })
      setTab('form')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không đọc được file.'
      setError(`${msg} Kiểm tra secureai_ai và cấu hình extract service.`)
    } finally {
      setExtracting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const hf = result?.headerFlags
  const bf = result?.bodyFlags

  return (
    <div style={{ maxWidth: 1080 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Phân tích email phishing</h1>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Kiểm tra header, body, URL và action đề xuất cho email nghi ngờ.</div>
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#f3f4f6', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        <TabButton active={tab === 'form'} text="Nhập thủ công" onClick={() => setTab('form')} />
        <TabButton active={tab === 'upload'} text="Upload ảnh/PDF" onClick={() => setTab('upload')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20 }}>
        <div>
          {tab === 'upload' ? (
            <section style={panelStyle}>
              <h2 style={panelTitle}>Upload email</h2>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button type="button" onClick={() => !extracting && fileRef.current?.click()} style={{ width: '100%', border: '2px dashed #d1d5db', borderRadius: 8, padding: '36px 18px', background: extracting ? '#f9fafb' : '#fff', cursor: extracting ? 'wait' : 'pointer', color: '#374151' }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{extracting ? 'Đang đọc email...' : 'Chọn file ảnh hoặc PDF'}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>PNG, JPG, WebP hoặc PDF</div>
              </button>
              {(form.from || form.body) && (
                <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
                  Đã extract nội dung. Chuyển sang tab nhập thủ công để kiểm tra và phân tích.
                </div>
              )}
            </section>
          ) : (
            <section style={panelStyle}>
              <h2 style={panelTitle}>Thông tin email</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <Field label="From" value={form.from} onChange={value => setForm(f => ({ ...f, from: value }))} placeholder="security@example.com" />
                <Field label="To" value={form.to} onChange={value => setForm(f => ({ ...f, to: value }))} placeholder="user@example.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <Field label="Subject" value={form.subject} onChange={value => setForm(f => ({ ...f, subject: value }))} placeholder="Thông báo bảo mật tài khoản" />
              </div>
              <label style={labelStyle}>Nội dung</label>
              <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Dán nội dung email vào đây..." rows={10} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleAnalyze} disabled={loading} style={{ flex: 1, background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Đang phân tích...' : 'Phân tích email'}
                </button>
                <button onClick={() => { setForm({ from: '', to: '', subject: '', body: '' }); setResult(null); setError('') }} style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, padding: '11px 16px', fontSize: 14, cursor: 'pointer', color: '#374151' }}>
                  Xóa
                </button>
              </div>
            </section>
          )}

          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#b91c1c', marginTop: 14 }}>{error}</div>}
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <section style={{ background: verdictBg(result.verdict ?? ''), borderRadius: 8, border: `1px solid ${verdictColor(result.verdict ?? '')}30`, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <SummaryBlock label="Kết luận" value={(result.verdict ?? 'unknown').toUpperCase()} color={verdictColor(result.verdict ?? '')} />
                <SummaryBlock label="Risk score" value={`${((result.riskScore ?? 0) * 100).toFixed(1)}%`} color={verdictColor(result.verdict ?? '')} />
                <span style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800, background: result.action === 'block' ? '#dc2626' : result.action === 'review' ? '#d97706' : '#059669', color: '#fff' }}>
                  {(result.action ?? 'allow').toUpperCase()}
                </span>
              </div>
              {(result.reasons ?? []).length > 0 && <List items={result.reasons} />}
            </section>

            {hf && (
              <section style={panelStyle}>
                <h2 style={panelTitle}>Header analysis</h2>
                <InfoTable rows={[
                  ['SPF', hf.spfPass ? 'Pass' : 'Fail', !hf.spfPass],
                  ['DKIM', hf.dkimPass ? 'Pass' : 'Fail', !hf.dkimPass],
                  ['DMARC', hf.dmarcPass ? 'Pass' : 'Fail', !hf.dmarcPass],
                  ['Reply-To mismatch', hf.replyToMismatch ? 'Có' : 'Không', hf.replyToMismatch],
                  ['From domain', hf.fromDomain || '-', false],
                  ['Subject', hf.subject || '-', false],
                ]} />
              </section>
            )}

            {bf && (
              <section style={panelStyle}>
                <h2 style={panelTitle}>Body analysis</h2>
                <InfoTable rows={[
                  ['Urgency keywords', String(bf.urgencyKeywords ?? 0), (bf.urgencyKeywords ?? 0) >= 2],
                  ['Phishing keywords', String(bf.phishingKeywords ?? 0), (bf.phishingKeywords ?? 0) >= 1],
                  ['Brand mismatch', bf.brandMismatch ? `Có (${(bf.mentionedBrands ?? []).join(', ')})` : 'Không', bf.brandMismatch],
                  ['HTML form', bf.hasHtmlForm ? 'Có' : 'Không', bf.hasHtmlForm],
                  ['Số URL', String(bf.linkCount ?? 0), false],
                ]} />
              </section>
            )}

            {(result.urlsFound ?? []).length > 0 && (
              <section style={panelStyle}>
                <h2 style={panelTitle}>URL phát hiện</h2>
                {(result.urlsFound ?? []).map((item, index) => (
                  <div key={`${item.url}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: index < (result.urlsFound ?? []).length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 800, background: item.label === 'benign' ? '#d1fae5' : '#fee2e2', color: item.label === 'benign' ? '#065f46' : '#991b1b' }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.url}>{item.url}</span>
                    <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{((item.riskScore ?? 0) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, text, onClick }: { active: boolean; text: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? '#111827' : '#6b7280', boxShadow: active ? '0 1px 3px rgba(0,0,0,.1)' : 'none' }}>{text}</button>
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <div><label style={labelStyle}>{label}</label><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} /></div>
}

function SummaryBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return <div><div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div></div>
}

function List({ items }: { items: string[] }) {
  return <ul style={{ margin: '12px 0 0', padding: '0 0 0 16px', fontSize: 12, color: '#374151', lineHeight: 1.8 }}>{items.map((item, index) => <li key={index}>{item}</li>)}</ul>
}

function InfoTable({ rows }: { rows: [string, string, boolean][] }) {
  return <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{rows.map(([label, value, bad]) => <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: '8px 0', fontSize: 13, color: '#6b7280', width: '46%' }}>{label}</td><td style={{ padding: '8px 0', fontSize: 13, color: bad ? '#dc2626' : '#374151', fontWeight: bad ? 800 : 500 }}>{value}</td></tr>)}</tbody></table>
}

const panelStyle: React.CSSProperties = { background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16 }
const panelTitle: React.CSSProperties = { fontSize: 14, fontWeight: 800, margin: '0 0 10px', color: '#374151' }
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#374151', display: 'block', marginBottom: 5, textTransform: 'uppercase' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#111827' }
