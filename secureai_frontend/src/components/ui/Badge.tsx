import type { ThreatLabel, ThreatSeverity, AlertSeverity, ThreatStatus } from '../../types'

const labelColors: Record<string, string> = {
  benign:      'background:#d1fae5;color:#065f46',
  phishing:    'background:#fee2e2;color:#991b1b',
  malware:     'background:#fef3c7;color:#92400e',
  defacement:  'background:#ede9fe;color:#5b21b6',
}

const severityColors: Record<string, string> = {
  Low:      'background:#f0fdf4;color:#166534',
  Medium:   'background:#fefce8;color:#854d0e',
  High:     'background:#fff7ed;color:#9a3412',
  Critical: 'background:#fef2f2;color:#7f1d1d',
  Info:     'background:#eff6ff;color:#1e40af',
}

const statusColors: Record<string, string> = {
  Pending:      'background:#f3f4f6;color:#374151',
  Confirmed:    'background:#fee2e2;color:#991b1b',
  FalsePositive:'background:#f0fdf4;color:#166534',
  Escalated:    'background:#fef3c7;color:#92400e',
  Archived:     'background:#f9fafb;color:#6b7280',
}

interface Props {
  type: 'label' | 'severity' | 'status'
  value: ThreatLabel | ThreatSeverity | AlertSeverity | ThreatStatus | string
}

export function Badge({ type, value }: Props) {
  const map = type === 'label' ? labelColors : type === 'severity' ? severityColors : statusColors
  const style = map[value] ?? 'background:#f3f4f6;color:#374151'

  return (
    <span style={{
      ...Object.fromEntries(style.split(';').map(s => s.split(':') as [string,string])),
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {value}
    </span>
  )
}
