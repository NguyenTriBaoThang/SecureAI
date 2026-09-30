import type { ReactNode } from 'react'

interface Props {
  label: string
  value: number | string
  color?: string
  icon?: ReactNode
  subtitle?: string
}

export function StatCard({ label, value, color = '#38bdf8', icon, subtitle }: Props) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 24px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      className="saiStatCard"
    >
      {/* 3D Top Accent Glow Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8' }}>
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${color}18`,
              border: `1px solid ${color}35`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 10px ${color}25`,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
