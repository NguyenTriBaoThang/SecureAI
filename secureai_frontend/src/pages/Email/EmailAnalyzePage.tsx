import { useRef, useState } from 'react'
import { emailApi, type EmailAnalyzeResponse } from '../../api/emailApi'
import {
  Mail,
  UploadCloud,
  Send,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Link2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

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
  if (value === 'phishing') return '#ef4444'
  if (value === 'suspicious') return '#f59e0b'
  return '#10b981'
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
      setError('Vui lòng nhập ít nhất địa chỉ người gửi hoặc nội dung email.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await emailApi.analyze({ rawEmail: buildRawEmail(form), analyzeUrls: true })
      setResult(res)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không kết nối được dịch vụ phân tích AI. Vui lòng kiểm tra secureai_ai.')
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
        setError('Chỉ hỗ trợ tệp ảnh PNG/JPG/WebP hoặc tệp PDF.')
        return
      }

      const parsed = await emailApi.extractFromFile(file)
      setForm({
        from: parsed.from ?? '',
        to: parsed.to ?? '',
        subject: parsed.subject ?? '',
        body: parsed.body ?? '',
      })
      setTab('form')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không đọc được file.'
      setError(`${msg} Vui lòng kiểm tra dịch vụ AI extract.`)
    } finally {
      setExtracting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const hf = result?.headerFlags
  const bf = result?.bodyFlags

  return (
    <div className="saiPage">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Mail size={22} color="#38bdf8" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Phân tích Email Phishing & Lừa đảo
          </h1>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Kiểm tra toàn diện tiêu đề (SPF, DKIM, DMARC), nội dung văn bản, URL nhúng và đề xuất hành động cho SOC.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, background: 'rgba(15, 23, 42, 0.7)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          onClick={() => setTab('form')}
          style={{
            background: tab === 'form' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
            color: tab === 'form' ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 7,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FileText size={15} />
          <span>Nhập thông tin</span>
        </button>
        <button
          onClick={() => setTab('upload')}
          style={{
            background: tab === 'upload' ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'transparent',
            color: tab === 'upload' ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 7,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <UploadCloud size={15} />
          <span>Tải tệp Ảnh / PDF</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? 'minmax(0, 1.05fr) minmax(360px, 0.95fr)' : '1fr', gap: 24 }}>
        <div>
          {tab === 'upload' ? (
            <div className="saiCard saiCardPad">
              <h2 className="saiCardTitle" style={{ marginBottom: 16 }}>
                <UploadCloud size={18} color="#38bdf8" />
                <span>Trích xuất nội dung từ ảnh chụp email hoặc file PDF</span>
              </h2>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => !extracting && fileRef.current?.click()}
                style={{
                  width: '100%',
                  border: '2px dashed rgba(56, 189, 248, 0.35)',
                  borderRadius: 14,
                  padding: '44px 20px',
                  background: extracting ? 'rgba(56, 189, 248, 0.05)' : 'rgba(15, 23, 42, 0.5)',
                  cursor: extracting ? 'wait' : 'pointer',
                  color: '#e2e8f0',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                    {extracting ? 'Đang trích xuất OCR / Text...' : 'Kéo thả hoặc nhấn để chọn tệp'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Hỗ trợ định dạng ảnh PNG, JPG, WebP hoặc tài liệu PDF</div>
                </div>
              </button>

              {(form.from || form.body) && (
                <div
                  style={{
                    marginTop: 16,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    fontSize: 13,
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Đã trích xuất nội dung thành công. Vui lòng chuyển sang tab Nhập thông tin để kiểm tra.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="saiCard saiCardPad">
              <h2 className="saiCardTitle" style={{ marginBottom: 16 }}>
                <Mail size={18} color="#38bdf8" />
                <span>Nội dung email kiểm tra</span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="saiFormLabel">Người gửi (From)</label>
                  <input
                    className="saiInput"
                    value={form.from}
                    onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
                    placeholder="security-alert@verify-service.com"
                  />
                </div>
                <div>
                  <label className="saiFormLabel">Người nhận (To)</label>
                  <input
                    className="saiInput"
                    value={form.to}
                    onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
                    placeholder="victim@organization.com"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="saiFormLabel">Tiêu đề (Subject)</label>
                <input
                  className="saiInput"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Khẩn cấp: Tài khoản ngân hàng của bạn đã bị khóa tạm thời"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="saiFormLabel">Nội dung email (Body)</label>
                <textarea
                  className="saiTextarea"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Dán toàn bộ nội dung email hoặc mã HTML vào đây..."
                  rows={9}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="saiButton saiButtonPrimary"
                  style={{ flex: 1 }}
                >
                  <Send size={15} />
                  <span>{loading ? 'Đang phân tích AI...' : 'Phân tích Email ngay'}</span>
                </button>
                <button
                  onClick={() => {
                    setForm({ from: '', to: '', subject: '', body: '' })
                    setResult(null)
                    setError('')
                  }}
                  className="saiButton saiButtonSecondary"
                >
                  <Trash2 size={15} />
                  <span>Xóa trắng</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 13,
                color: '#f87171',
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Panel */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Verdict Hero Card */}
            <div
              className="saiCard saiCardPad"
              style={{
                borderTop: `4px solid ${verdictColor(result.verdict ?? '')}`,
                background: 'rgba(15, 23, 42, 0.9)',
                boxShadow: `0 12px 30px -6px rgba(0, 0, 0, 0.6), 0 0 16px ${verdictColor(result.verdict ?? '')}30`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  KẾT QUẢ ĐÁNH GIÁ TỔNG THỂ
                </div>
                <span
                  style={{
                    padding: '5px 14px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    background: result.action === 'block' ? 'rgba(239, 68, 68, 0.25)' : result.action === 'review' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                    color: result.action === 'block' ? '#fca5a5' : result.action === 'review' ? '#fde68a' : '#a7f3d0',
                    border: `1px solid ${result.action === 'block' ? 'rgba(239, 68, 68, 0.5)' : result.action === 'review' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(16, 185, 129, 0.5)'}`,
                    boxShadow: `0 0 10px ${result.action === 'block' ? 'rgba(239, 68, 68, 0.4)' : result.action === 'review' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                  }}
                >
                  HÀNH ĐỘNG: {(result.action ?? 'ALLOW').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '14px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Phân loại</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: verdictColor(result.verdict ?? '') }}>
                    {(result.verdict ?? 'BENIGN').toUpperCase()}
                  </div>
                </div>
                <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '14px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Điểm rủi ro AI</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>
                    {((result.riskScore ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Reasons */}
              {result.reasons && result.reasons.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                    Dấu hiệu bất thường phát hiện:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.reasons.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: '#fca5a5',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 8,
                          padding: '7px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <ShieldAlert size={14} flex-shrink="0" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Header Authentication Checks */}
            {hf && (
              <div className="saiCard saiCardPad">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} color="#38bdf8" />
                  <span>Xác thực tiêu đề Email (Header Flags)</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <AuthBadge label="SPF" pass={hf.spfPass} />
                  <AuthBadge label="DKIM" pass={hf.dkimPass} />
                  <AuthBadge label="DMARC" pass={hf.dmarcPass} />
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div>Domain người gửi: <strong style={{ color: '#fff' }}>{hf.fromDomain || 'N/A'}</strong></div>
                  <div>Reply-To không khớp: <strong style={{ color: hf.replyToMismatch ? '#f87171' : '#34d399' }}>{hf.replyToMismatch ? 'Có (Đáng ngờ)' : 'Không'}</strong></div>
                </div>
              </div>
            )}

            {/* Body Checks */}
            {bf && (
              <div className="saiCard saiCardPad">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="#38bdf8" />
                  <span>Dấu hiệu trong nội dung (Body Flags)</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <StatItem label="Từ khóa khẩn cấp" value={bf.urgencyKeywords} />
                  <StatItem label="Từ khóa lừa đảo" value={bf.phishingKeywords} />
                  <StatItem label="Số lượng link URL" value={bf.linkCount} />
                  <StatItem label="Chứa form HTML" value={bf.hasHtmlForm ? 'Có' : 'Không'} />
                </div>
              </div>
            )}

            {/* URLs found */}
            {result.urlsFound && result.urlsFound.length > 0 && (
              <div className="saiCard saiCardPad">
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link2 size={16} color="#38bdf8" />
                  <span>URL trích xuất trong email ({result.urlsFound.length})</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.urlsFound.map((u, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(7, 11, 20, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, fontFamily: 'monospace', color: '#e2e8f0' }} title={u.url}>
                        {u.url}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: u.riskScore >= 0.7 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: u.riskScore >= 0.7 ? '#fca5a5' : '#a7f3d0',
                          border: `1px solid ${u.riskScore >= 0.7 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(u.riskScore * 100).toFixed(0)}% Risk
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function AuthBadge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      style={{
        padding: '10px',
        borderRadius: 8,
        background: pass ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
        border: `1px solid ${pass ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: pass ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        {pass ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        <span>{pass ? 'PASS' : 'FAIL'}</span>
      </div>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(7, 11, 20, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{value}</div>
    </div>
  )
}
