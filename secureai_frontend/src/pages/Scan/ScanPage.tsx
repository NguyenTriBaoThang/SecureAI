import { useState } from 'react'
import { Link } from 'react-router-dom'
import { childSafeNetApi, type ChildScanResult } from '../../api/childSafeNetApi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Pill } from '../../components/ui/Pill'
import {
  ScanSearch,
  Globe,
  Sliders,
  FileText,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from 'lucide-react'

type PillKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

function actionKind(action?: string): PillKind {
  if (action === 'BLOCK') return 'danger'
  if (action === 'WARN') return 'warning'
  if (action === 'ALLOW') return 'success'
  return 'neutral'
}

function riskKind(level?: string): PillKind {
  if (level === 'HIGH') return 'danger'
  if (level === 'MEDIUM') return 'warning'
  if (level === 'LOW') return 'success'
  return 'neutral'
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function getDomain(value: string) {
  try {
    return new URL(normalizeUrl(value)).hostname.replace(/^www\./, '')
  } catch {
    return value || '-'
  }
}

function extractError(err: unknown) {
  const maybe = err as { response?: { data?: { message?: string } }; message?: string }
  return maybe.response?.data?.message ?? maybe.message ?? 'Không thể thực hiện quét URL. Vui lòng kiểm tra backend và dịch vụ AI.'
}

export function ScanPage() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [result, setResult] = useState<ChildScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const target = normalizeUrl(url)
    if (!target) return

    setLoading(true)
    setError('')
    setFeedbackMsg('')
    setResult(null)
    try {
      const response = await childSafeNetApi.scan({ url: target, title, text, source: 'Web' })
      setResult(response)
      setUrl(target)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  const sendFeedback = async (isCorrect: boolean) => {
    if (!result) return
    setFeedbackMsg('')
    try {
      await childSafeNetApi.createFeedback({
        url: normalizeUrl(url),
        feedbackLabel: result.label,
        isCorrect,
        note,
      })
      setFeedbackMsg('Đã ghi nhận phản hồi vào tập dữ liệu huấn luyện.')
      setNote('')
    } catch (err) {
      setFeedbackMsg(extractError(err))
    }
  }

  return (
    <div className="saiPage">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <ScanSearch size={22} color="#38bdf8" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
            Quét & Đánh giá URL Trực tiếp
          </h1>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Đưa URL vào pipeline phân tích trí tuệ nhân tạo, đối chiếu danh sách trắng/đen và tính toán hành động xử lý an ninh.
        </div>
      </div>

      <div className="saiGrid2">
        {/* Scan Input Form */}
        <Card className="saiCardPad">
          <div className="saiCardHeader">
            <div>
              <h2 className="saiCardTitle">
                <Globe size={18} color="#38bdf8" />
                <span>Nhập thông tin mục tiêu</span>
              </h2>
              <p className="saiCardText">Yêu cầu quét sẽ được lưu vào nhật ký và đồng bộ vào luồng phân tích.</p>
            </div>
            <Pill kind="info">KÊNH WEB</Pill>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="saiFormLabel" htmlFor="scan-url">Đường dẫn URL mục tiêu</label>
              <input
                id="scan-url"
                className="saiInput"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/login-verify-account"
                required
              />
            </div>

            <div>
              <label className="saiFormLabel" htmlFor="scan-title">Tiêu đề trang (Không bắt buộc)</label>
              <input
                id="scan-title"
                className="saiInput"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Đăng nhập tài khoản trực tuyến"
              />
            </div>

            <div>
              <label className="saiFormLabel" htmlFor="scan-text">Nội dung trang / Ngữ cảnh đính kèm</label>
              <textarea
                id="scan-text"
                className="saiTextarea"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Dán nội dung trang web hoặc email chứa URL này để tăng độ chính xác phân tích..."
                rows={4}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
              <Button type="submit" disabled={loading || !url.trim()}>
                <ScanSearch size={15} />
                <span>{loading ? 'Đang phân tích AI...' : 'Bắt đầu quét'}</span>
              </Button>
              <Link to="/settings" className="saiButton saiButtonSecondary">
                <Sliders size={15} />
                <span>Cấu hình bảo vệ</span>
              </Link>
              <Link to="/logs" className="saiButton saiButtonSecondary">
                <FileText size={15} />
                <span>Xem nhật ký</span>
              </Link>
            </div>
          </form>

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
                gap: 8,
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </Card>

        {/* Decision & Results Panel */}
        <Card className="saiCardPad">
          <div className="saiCardHeader">
            <div>
              <h2 className="saiCardTitle">
                <Zap size={18} color="#38bdf8" />
                <span>Kết luận từ Hệ thống</span>
              </h2>
              <p className="saiCardText">Đánh giá theo thời gian thực từ mô hình AI và chính sách.</p>
            </div>
            {result ? (
              <Pill kind={actionKind(result.action)}>
                {result.action === 'BLOCK' ? 'CHẶN (BLOCK)' : result.action === 'WARN' ? 'CẢNH BÁO (WARN)' : 'CHO PHÉP (ALLOW)'}
              </Pill>
            ) : (
              <Pill kind="neutral">ĐANG ĐỢI QUÉT</Pill>
            )}
          </div>

          {!result ? (
            <div
              style={{
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: 13,
              }}
            >
              <Globe size={36} color="#475569" style={{ margin: '0 auto 12px', display: 'block' }} />
              Nhập URL ở khung bên trái và nhấn &ldquo;Bắt đầu quét&rdquo; để nhận kết quả phân loại chi tiết.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Risk Hero Banner */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 12,
                  background:
                    result.action === 'BLOCK'
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(127, 29, 29, 0.25) 100%)'
                      : result.action === 'WARN'
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.25) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(4, 120, 87, 0.25) 100%)',
                  border: `1px solid ${
                    result.action === 'BLOCK'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : result.action === 'WARN'
                      ? 'rgba(245, 158, 11, 0.4)'
                      : 'rgba(16, 185, 129, 0.4)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1' }}>
                    Mức độ rủi ro: <strong style={{ color: '#fff' }}>{result.risk_level}</strong>
                  </span>
                  <Pill kind={riskKind(result.risk_level)}>{result.label.toUpperCase()}</Pill>
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  {(result.score * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  {result.explanation?.[0] || 'Phân tích tự động bởi mô hình học máy.'}
                </div>
              </div>

              {/* URL Metrics Facts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FactItem label="Domain" value={getDomain(url)} />
                <FactItem label="Phân loại nhãn" value={result.label.toUpperCase()} />
                <FactItem label="Đề xuất hành động" value={result.action} />
                <FactItem label="Điểm rủi ro (Risk)" value={`${(result.score * 100).toFixed(1)}%`} />
              </div>

              {/* Reasons list */}
              {result.explanation && result.explanation.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                    Dấu hiệu chi tiết:
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.explanation.map((item: string, i: number) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 12,
                          color: '#e2e8f0',
                          background: 'rgba(7, 11, 20, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 8,
                          padding: '8px 12px',
                        }}
                      >
                        &bull; {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback Loop for AI Dataset */}
              <div
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 16,
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                  Đóng góp phản hồi kết quả cho mô hình AI:
                </div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú nhận định của Analyst (tùy chọn)..."
                  className="saiInput"
                  style={{ marginBottom: 10, fontSize: 12, minHeight: 36 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => sendFeedback(true)}
                    className="saiButton saiButtonSecondary"
                    style={{ flex: 1, minHeight: 34, fontSize: 12 }}
                  >
                    <ThumbsUp size={14} color="#34d399" />
                    <span>Kết quả đúng</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback(false)}
                    className="saiButton saiButtonSecondary"
                    style={{ flex: 1, minHeight: 34, fontSize: 12 }}
                  >
                    <ThumbsDown size={14} color="#f87171" />
                    <span>Kết quả sai (Báo động giả)</span>
                  </button>
                </div>
                {feedbackMsg && (
                  <div style={{ fontSize: 12, color: '#34d399', marginTop: 8, textAlign: 'center' }}>
                    {feedbackMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function FactItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        background: 'rgba(7, 11, 20, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        padding: '10px 12px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}