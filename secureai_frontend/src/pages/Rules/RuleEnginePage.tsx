import { useEffect, useMemo, useState } from 'react'
import { ruleEngineApi, type RuleConfiguration } from '../../api/ruleEngineApi'
import { Sliders, Save, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react'

const toggleStyle = (enabled: boolean): React.CSSProperties => ({
  width: 46,
  height: 26,
  borderRadius: 999,
  border: 'none',
  background: enabled ? 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' : 'rgba(255, 255, 255, 0.15)',
  boxShadow: enabled ? '0 0 12px rgba(56, 189, 248, 0.45)' : 'none',
  cursor: 'pointer',
  position: 'relative',
  flexShrink: 0,
  transition: 'background 0.2s ease, box-shadow 0.2s ease',
})

export function RuleEnginePage() {
  const [config, setConfig] = useState<RuleConfiguration | null>(null)
  const [draft, setDraft] = useState<RuleConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    ruleEngineApi.getConfig()
      .then(res => {
        setConfig(res)
        setDraft(res)
      })
      .catch(() => setError('Không tải được cấu hình Rule Engine. Vui lòng kiểm tra dịch vụ backend.'))
      .finally(() => setLoading(false))
  }, [])

  const changed = useMemo(() => {
    if (!config || !draft) return false
    return JSON.stringify({
      blockThreshold: config.blockThreshold,
      reviewThreshold: config.reviewThreshold,
      autoBlockEnabled: config.autoBlockEnabled,
      autoAlertEnabled: config.autoAlertEnabled,
      blockMaliciousLabels: config.blockMaliciousLabels,
    }) !== JSON.stringify({
      blockThreshold: draft.blockThreshold,
      reviewThreshold: draft.reviewThreshold,
      autoBlockEnabled: draft.autoBlockEnabled,
      autoAlertEnabled: draft.autoAlertEnabled,
      blockMaliciousLabels: draft.blockMaliciousLabels,
    })
  }, [config, draft])

  const updateDraft = (patch: Partial<RuleConfiguration>) => {
    setDraft(current => current ? { ...current, ...patch } : current)
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const updated = await ruleEngineApi.updateConfig({
        blockThreshold: draft.blockThreshold,
        reviewThreshold: draft.reviewThreshold,
        autoBlockEnabled: draft.autoBlockEnabled,
        autoAlertEnabled: draft.autoAlertEnabled,
        blockMaliciousLabels: draft.blockMaliciousLabels,
      })
      setConfig(updated)
      setDraft(updated)
      setMessage('Đã lưu cấu hình Rule Engine thành công.')
      setTimeout(() => setMessage(''), 3500)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không thể lưu cấu hình Rule Engine.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <RefreshCw size={20} className="saiSpin" />
        <span>Đang tải cấu hình Rule Engine...</span>
      </div>
    )
  }

  if (!draft) {
    return (
      <div style={{ padding: 40, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        {error || 'Không tìm thấy cấu hình quy tắc.'}
      </div>
    )
  }

  return (
    <div className="saiPage">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Sliders size={20} color="#38bdf8" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Quy tắc ra quyết định (Rule Engine)
            </h1>
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Điều chỉnh ngưỡng rủi ro và chính sách tự động hóa cho chu trình phản hồi của SOC Analyst.
            {draft.updatedAt && (
              <span style={{ marginLeft: 8, color: '#64748b' }}>
                &bull; Cập nhật: {new Date(draft.updatedAt).toLocaleString('vi-VN')}
                {draft.updatedByEmail ? ` bởi ${draft.updatedByEmail}` : ''}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={save}
          disabled={!changed || saving}
          className="saiButton saiButtonPrimary"
          style={{ opacity: !changed || saving ? 0.6 : 1 }}
        >
          <Save size={16} />
          <span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Threshold Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 22 }}>
        <ThresholdPanel
          title="Ngưỡng Chặn (Block Threshold)"
          description="Điểm rủi ro (Risk Score) vượt ngưỡng này sẽ tự động đề xuất lệnh Chặn (Block)."
          value={draft.blockThreshold}
          color="#ef4444"
          onChange={value => updateDraft({ blockThreshold: value })}
        />
        <ThresholdPanel
          title="Ngưỡng Xem xét (Review Threshold)"
          description="Điểm rủi ro nằm giữa ngưỡng Review và Block sẽ đưa vào hàng đợi xác minh cho Analyst."
          value={draft.reviewThreshold}
          color="#f59e0b"
          onChange={value => updateDraft({ reviewThreshold: value })}
        />
      </div>

      {/* Automation Policies */}
      <div className="saiCard" style={{ marginBottom: 22, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.6)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#38bdf8" />
            <span>Chính sách tự động hóa (Automation Policies)</span>
          </h2>
        </div>

        <ToggleRow
          label="Tự động áp dụng lệnh Chặn (Auto-Block)"
          detail="Khi điểm rủi ro vượt ngưỡng Block, hệ thống tự động gán hành động Block và kích hoạt phản hồi tức thì."
          enabled={draft.autoBlockEnabled}
          onToggle={() => updateDraft({ autoBlockEnabled: !draft.autoBlockEnabled })}
        />
        <ToggleRow
          label="Tự động tạo cảnh báo SOC (Auto-Alert Generation)"
          detail="Các phát hiện có mức độ High/Critical hoặc vượt ngưỡng Block sẽ tự động tạo Alert và thông báo real-time qua SignalR."
          enabled={draft.autoAlertEnabled}
          onToggle={() => updateDraft({ autoAlertEnabled: !draft.autoAlertEnabled })}
        />
        <ToggleRow
          label="Ưu tiên nâng mức nhãn độc hại (Malicious Labels Priority)"
          detail="Các URL được phân loại là Phishing, Malware hoặc Defacement sẽ được ưu tiên đưa vào diện Block ngay cả khi điểm rủi ro tiệm cận ngưỡng."
          enabled={draft.blockMaliciousLabels}
          onToggle={() => updateDraft({ blockMaliciousLabels: !draft.blockMaliciousLabels })}
          last
        />
      </div>

      {/* Decision Action Bands */}
      <div className="saiCard saiCardPad">
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldAlert size={17} color="#38bdf8" />
          <span>Vùng hành động rủi ro hiện tại (Decision Bands)</span>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <ActionBand
            title="Cho phép (Allow)"
            desc="URL an toàn, nguy cơ thấp"
            range={`0% - ${(draft.reviewThreshold * 100).toFixed(0)}%`}
            color="#10b981"
          />
          <ActionBand
            title="Xem xét (Review)"
            desc="Cần Analyst kiểm tra và phân tích sâu"
            range={`${(draft.reviewThreshold * 100).toFixed(0)}% - ${(draft.blockThreshold * 100).toFixed(0)}%`}
            color="#f59e0b"
          />
          <ActionBand
            title="Chặn (Block)"
            desc="Nguy cơ cao, độc hại rõ rệt"
            range={`>= ${(draft.blockThreshold * 100).toFixed(0)}%`}
            color="#ef4444"
          />
        </div>
      </div>
    </div>
  )
}

function ThresholdPanel({
  title,
  description,
  value,
  color,
  onChange,
}: {
  title: string
  description: string
  value: number
  color: string
  onChange: (value: number) => void
}) {
  const percent = Math.round(value * 100)
  return (
    <div className="saiCard saiCardPad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>{title}</h2>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45, maxWidth: 360 }}>{description}</div>
        </div>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color,
            textShadow: `0 0 16px ${color}40`,
            padding: '2px 8px',
            background: `${color}15`,
            borderRadius: 8,
            border: `1px solid ${color}35`,
          }}
        >
          {percent}%
        </span>
      </div>

      <div style={{ marginTop: 16 }}>
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>Nhập giá trị chính xác:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => onChange(Math.min(100, Math.max(0, Number(e.target.value))) / 100)}
            className="saiInput"
            style={{ width: 75, padding: '6px 10px', fontSize: 13, textAlign: 'center' }}
          />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>%</span>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  detail,
  enabled,
  onToggle,
  last = false,
}: {
  label: string
  detail: string
  enabled: boolean
  onToggle: () => void
  last?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '16px 20px',
        borderBottom: last ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <button type="button" onClick={onToggle} style={toggleStyle(enabled)} aria-label={label}>
        <span
          style={{
            position: 'absolute',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            top: 3,
            left: enabled ? 23 : 3,
            transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, lineHeight: 1.45 }}>{detail}</div>
      </div>
    </div>
  )
}

function ActionBand({ title, desc, range, color }: { title: string; desc: string; range: string; color: string }) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '16px 18px',
        borderTop: `4px solid ${color}`,
        boxShadow: `0 8px 20px -4px rgba(0, 0, 0, 0.4), 0 0 12px ${color}20`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{title}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#ffffff', marginTop: 8 }}>{range}</div>
    </div>
  )
}
