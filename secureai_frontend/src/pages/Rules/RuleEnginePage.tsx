import { useEffect, useMemo, useState } from 'react'
import { ruleEngineApi, type RuleConfiguration } from '../../api/ruleEngineApi'

const toggleStyle = (enabled: boolean): React.CSSProperties => ({
  width: 44,
  height: 24,
  borderRadius: 999,
  border: 'none',
  background: enabled ? '#2563eb' : '#d1d5db',
  cursor: 'pointer',
  position: 'relative',
  flexShrink: 0,
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
      .catch(() => setError('Không tải được cấu hình rule engine.'))
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
      setMessage('Đã lưu cấu hình rule engine.')
      setTimeout(() => setMessage(''), 3000)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không lưu được cấu hình.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: '#6b7280' }}>Đang tải cấu hình...</div>
  }

  if (!draft) {
    return <div style={{ padding: 40, color: '#dc2626' }}>{error || 'Không có cấu hình.'}</div>
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Rule Engine</h1>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            Cập nhật lần cuối: {new Date(draft.updatedAt).toLocaleString('vi-VN')}
            {draft.updatedByEmail ? ` bởi ${draft.updatedByEmail}` : ''}
          </div>
        </div>
        <button
          onClick={save}
          disabled={!changed || saving}
          style={{
            background: !changed || saving ? '#bfdbfe' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            cursor: !changed || saving ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </div>

      {message && <Notice color="#166534" bg="#f0fdf4" border="#bbf7d0" text={message} />}
      {error && <Notice color="#b91c1c" bg="#fef2f2" border="#fecaca" text={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <ThresholdPanel
          title="Ngưỡng block"
          value={draft.blockThreshold}
          color="#dc2626"
          onChange={value => updateDraft({ blockThreshold: value })}
        />
        <ThresholdPanel
          title="Ngưỡng review"
          value={draft.reviewThreshold}
          color="#d97706"
          onChange={value => updateDraft({ reviewThreshold: value })}
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
        <ToggleRow
          label="Tự động block"
          detail="Risk score vượt ngưỡng block sẽ nhận action Block."
          enabled={draft.autoBlockEnabled}
          onToggle={() => updateDraft({ autoBlockEnabled: !draft.autoBlockEnabled })}
        />
        <ToggleRow
          label="Tạo alert tự động"
          detail="Threat High/Critical hoặc rule Block sẽ sinh alert."
          enabled={draft.autoAlertEnabled}
          onToggle={() => updateDraft({ autoAlertEnabled: !draft.autoAlertEnabled })}
        />
        <ToggleRow
          label="Ưu tiên nhãn độc hại"
          detail="Phishing, malware, defacement được đẩy lên Block khi risk sát ngưỡng."
          enabled={draft.blockMaliciousLabels}
          onToggle={() => updateDraft({ blockMaliciousLabels: !draft.blockMaliciousLabels })}
          last
        />
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 18 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: '0 0 14px' }}>Mốc hành động hiện tại</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <ActionBand title="Allow" range={`0% - ${(draft.reviewThreshold * 100).toFixed(0)}%`} color="#059669" />
          <ActionBand title="Review" range={`${(draft.reviewThreshold * 100).toFixed(0)}% - ${(draft.blockThreshold * 100).toFixed(0)}%`} color="#d97706" />
          <ActionBand title="Block" range={`>= ${(draft.blockThreshold * 100).toFixed(0)}%`} color="#dc2626" />
        </div>
      </div>
    </div>
  )
}

function Notice({ text, color, bg, border }: { text: string; color: string; bg: string; border: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
      {text}
    </div>
  )
}

function ThresholdPanel({ title, value, color, onChange }: {
  title: string
  value: number
  color: string
  onChange: (value: number) => void
}) {
  const percent = Math.round(value * 100)
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 24, fontWeight: 800, color }}>{percent}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={e => onChange(Number(e.target.value) / 100)}
        style={{ width: '100%', accentColor: color }}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={percent}
        onChange={e => onChange(Math.min(100, Math.max(0, Number(e.target.value))) / 100)}
        style={{ width: 90, marginTop: 12, padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13 }}
      />
    </div>
  )
}

function ToggleRow({ label, detail, enabled, onToggle, last = false }: {
  label: string
  detail: string
  enabled: boolean
  onToggle: () => void
  last?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 18px', borderBottom: last ? 'none' : '1px solid #f3f4f6' }}>
      <button type="button" onClick={onToggle} style={toggleStyle(enabled)} aria-label={label}>
        <span style={{
          position: 'absolute',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          top: 3,
          left: enabled ? 23 : 3,
          transition: 'left 0.15s',
        }} />
      </button>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{label}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{detail}</div>
      </div>
    </div>
  )
}

function ActionBand({ title, range, color }: { title: string; range: string; color: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginTop: 6 }}>{range}</div>
    </div>
  )
}
