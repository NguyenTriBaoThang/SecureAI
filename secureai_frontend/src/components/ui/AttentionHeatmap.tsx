import type { AttentionToken } from '../../types'

interface Props {
  url: string
  tokens: AttentionToken[]
  label: string
  riskScore: number
}

export function AttentionHeatmap({ url, tokens, label, riskScore }: Props) {
  if (!tokens.length) {
    return <p style={{ color: '#6b7280', fontSize: 13 }}>Khong co du lieu attention.</p>
  }

  const max = Math.max(...tokens.map(t => t.weight), 0)

  const getColor = (weight: number) => {
    const intensity = max > 0 ? weight / max : 0
    if (intensity > 0.7) return { bg: '#dc2626', text: '#fff' }
    if (intensity > 0.4) return { bg: '#f97316', text: '#fff' }
    if (intensity > 0.2) return { bg: '#fbbf24', text: '#1f2937' }
    return { bg: '#fef9c3', text: '#1f2937' }
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
        <strong>{label.toUpperCase()}</strong> - Risk: {(riskScore * 100).toFixed(1)}%
      </div>
      <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 10, wordBreak: 'break-all' }}>
        {url}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, fontFamily: 'monospace' }}>
        {tokens.map((t, i) => {
          const { bg, text } = getColor(t.weight)
          return (
            <span
              key={i}
              title={`${t.char || 'space'} -> weight: ${t.weight.toFixed(4)}`}
              style={{
                background: bg,
                color: text,
                padding: '4px 6px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 500,
                minWidth: 20,
                textAlign: 'center',
              }}
            >
              {t.char === ' ' ? '\u00A0' : t.char}
            </span>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
        Mau dam hon = model chu y nhieu hon vao ky tu do.
      </div>
    </div>
  )
}
