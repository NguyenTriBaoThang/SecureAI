import { useState } from 'react'
import type { AttentionToken } from '../../types'
import { Sparkles, Info, Eye } from 'lucide-react'

interface Props {
  url: string
  tokens: AttentionToken[]
  label: string
  riskScore: number
}

export function AttentionHeatmap({ url, tokens, label, riskScore }: Props) {
  const [hoveredToken, setHoveredToken] = useState<{ char: string; weight: number; index: number } | null>(null)

  if (!tokens || !tokens.length) {
    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
          borderRadius: 10,
          padding: '16px',
          color: '#94a3b8',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Info size={16} />
        <span>Chưa có dữ liệu trọng số chú ý (Attention Weights) từ mô hình BiLSTM.</span>
      </div>
    )
  }

  const max = Math.max(...tokens.map((t) => t.weight), 0.0001)

  const getColor = (weight: number) => {
    const intensity = weight / max
    if (intensity > 0.75) {
      return {
        bg: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
        text: '#ffffff',
        border: 'rgba(254, 202, 202, 0.6)',
        glow: '0 0 10px rgba(239, 68, 68, 0.65)',
      }
    }
    if (intensity > 0.45) {
      return {
        bg: 'linear-gradient(180deg, #f97316 0%, #c2410c 100%)',
        text: '#ffffff',
        border: 'rgba(254, 215, 170, 0.5)',
        glow: '0 0 8px rgba(249, 115, 22, 0.45)',
      }
    }
    if (intensity > 0.2) {
      return {
        bg: 'rgba(245, 158, 11, 0.25)',
        text: '#fde68a',
        border: 'rgba(245, 158, 11, 0.4)',
        glow: 'none',
      }
    }
    return {
      bg: 'rgba(30, 41, 59, 0.7)',
      text: '#94a3b8',
      border: 'rgba(255, 255, 255, 0.08)',
      glow: 'none',
    }
  }

  return (
    <div
      style={{
        background: 'rgba(11, 18, 33, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: 14,
        padding: '18px 20px',
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(168, 85, 247, 0.18)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(168, 85, 247, 0.35)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Giải thích AI (Attention Heatmap)</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                XAI BiLSTM
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Mô hình tập trung phân tích từng token/ký tự để phát hiện dấu hiệu bất thường.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#e2e8f0', background: 'rgba(15, 23, 42, 0.8)', padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Nhãn: <strong style={{ color: '#38bdf8' }}>{label.toUpperCase()}</strong> | Điểm rủi ro:{' '}
          <strong style={{ color: riskScore >= 0.7 ? '#f87171' : riskScore >= 0.4 ? '#fbbf24' : '#34d399' }}>
            {(riskScore * 100).toFixed(1)}%
          </strong>
        </div>
      </div>

      {/* URL Display */}
      <div
        style={{
          fontSize: 12,
          color: '#cbd5e1',
          fontFamily: 'monospace',
          marginBottom: 12,
          wordBreak: 'break-all',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <span style={{ color: '#64748b' }}>Target URL: </span>
        {url}
      </div>

      {/* Heatmap Token Container */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          fontFamily: 'JetBrains Mono, Menlo, monospace',
          background: 'rgba(7, 11, 20, 0.7)',
          padding: '12px',
          borderRadius: 10,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          maxHeight: 220,
          overflowY: 'auto',
        }}
      >
        {tokens.map((t, i) => {
          const { bg, text, border, glow } = getColor(t.weight)
          return (
            <span
              key={i}
              onMouseEnter={() => setHoveredToken({ char: t.char || 'Space', weight: t.weight, index: i })}
              onMouseLeave={() => setHoveredToken(null)}
              style={{
                background: bg,
                color: text,
                border: `1px solid ${border}`,
                boxShadow: glow,
                padding: '3px 6px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                minWidth: 18,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
            >
              {t.char === ' ' ? '\u00A0' : t.char}
            </span>
          )
        })}
      </div>

      {/* Interactive Tooltip / Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 12,
          fontSize: 11,
          color: '#94a3b8',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          {hoveredToken ? (
            <span style={{ color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Eye size={13} />
              Ký tự &ldquo;<strong>{hoveredToken.char}</strong>&rdquo; (vị trí #{hoveredToken.index}) &rarr; Trọng số: {hoveredToken.weight.toFixed(5)}
            </span>
          ) : (
            <span>Di chuột vào từng ký tự để xem chi tiết trọng số.</span>
          )}
        </div>

        {/* Color Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Thấp</span>
          <div
            style={{
              width: 100,
              height: 8,
              borderRadius: 999,
              background: 'linear-gradient(90deg, #334155 0%, #f59e0b 50%, #ef4444 100%)',
            }}
          />
          <span>Cao (Nguy hiểm)</span>
        </div>
      </div>
    </div>
  )
}
