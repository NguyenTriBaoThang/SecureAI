import type { CSSProperties } from 'react'
import type { AlertSeverity, AlertStatus, IncidentStatus, ThreatLabel, ThreatSeverity, ThreatStatus } from '../../types'

interface BadgeConfig {
  bg: string
  color: string
  border: string
  glow?: string
}

const labelStyles: Record<string, BadgeConfig> = {
  benign: {
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.35)',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  phishing: {
    bg: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    border: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.25)',
  },
  malware: {
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  defacement: {
    bg: 'rgba(168, 85, 247, 0.15)',
    color: '#c084fc',
    border: 'rgba(168, 85, 247, 0.35)',
    glow: 'rgba(168, 85, 247, 0.25)',
  },
}

const severityStyles: Record<string, BadgeConfig> = {
  Low: {
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  Medium: {
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.35)',
  },
  High: {
    bg: 'rgba(249, 115, 22, 0.15)',
    color: '#fb923c',
    border: 'rgba(249, 115, 22, 0.35)',
  },
  Critical: {
    bg: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    border: 'rgba(239, 68, 68, 0.45)',
    glow: 'rgba(239, 68, 68, 0.4)',
  },
  Info: {
    bg: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.35)',
  },
}

const statusStyles: Record<string, BadgeConfig> = {
  Pending: {
    bg: 'rgba(148, 163, 184, 0.12)',
    color: '#94a3b8',
    border: 'rgba(148, 163, 184, 0.25)',
  },
  Confirmed: {
    bg: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    border: 'rgba(239, 68, 68, 0.35)',
  },
  FalsePositive: {
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.35)',
  },
  Archived: {
    bg: 'rgba(100, 116, 139, 0.12)',
    color: '#64748b',
    border: 'rgba(100, 116, 139, 0.2)',
  },
  New: {
    bg: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  Open: {
    bg: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
    border: 'rgba(56, 189, 248, 0.35)',
  },
  Escalated: {
    bg: 'rgba(245, 158, 11, 0.18)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  Investigating: {
    bg: 'rgba(245, 158, 11, 0.18)',
    color: '#fbbf24',
    border: 'rgba(245, 158, 11, 0.4)',
  },
  Resolved: {
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#34d399',
    border: 'rgba(16, 185, 129, 0.35)',
  },
}

const displayLabels: Record<string, string> = {
  benign: 'Benign (An toàn)',
  phishing: 'Phishing (Lừa đảo)',
  malware: 'Malware (Mã độc)',
  defacement: 'Defacement (Bị sửa giao diện)',
  Low: 'Thấp',
  Medium: 'Trung bình',
  High: 'Cao',
  Critical: 'Nghiêm trọng',
  Info: 'Thông tin',
  Pending: 'Chờ xử lý',
  Confirmed: 'Đã xác nhận',
  FalsePositive: 'Báo động giả (FP)',
  Escalated: 'Leo thang',
  Archived: 'Lưu trữ',
  New: 'Mới',
  Open: 'Mở',
  Investigating: 'Đang điều tra',
  Resolved: 'Đã giải quyết',
  confirmed: 'Đã xác nhận',
  false_positive: 'Báo động giả (FP)',
  escalated: 'Leo thang',
}

interface Props {
  type: 'label' | 'severity' | 'status'
  value: ThreatLabel | ThreatSeverity | AlertSeverity | ThreatStatus | AlertStatus | IncidentStatus | string
}

export function Badge({ type, value }: Props) {
  const map = type === 'label' ? labelStyles : type === 'severity' ? severityStyles : statusStyles
  const config = map[value] ?? {
    bg: 'rgba(148, 163, 184, 0.12)',
    color: '#cbd5e1',
    border: 'rgba(148, 163, 184, 0.25)',
  }

  const badgeStyle: CSSProperties = {
    background: config.bg,
    color: config.color,
    border: `1px solid ${config.border}`,
    boxShadow: config.glow ? `0 0 10px ${config.glow}` : 'none',
    padding: '3px 9px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <span style={badgeStyle}>
      {displayLabels[value] ?? value}
    </span>
  )
}
