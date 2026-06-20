interface Props {
  label: string
  value: number | string
  color?: string
  icon?: string
}

export function StatCard({ label, value, color = '#3b82f6', icon }: Props) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: '16px 20px',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{icon} {label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  )
}
