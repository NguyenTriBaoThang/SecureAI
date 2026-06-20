export type ThreatLabel = 'benign' | 'phishing' | 'malware' | 'defacement'
export type ThreatStatus = 'Pending' | 'Confirmed' | 'FalsePositive' | 'Escalated' | 'Archived'
export type ThreatSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type AlertSeverity = 'Info' | 'Medium' | 'High' | 'Critical'

export interface AttentionToken {
  char: string
  weight: number
}

export interface ThreatDto {
  id: string
  url: string
  predictedLabel: ThreatLabel
  riskScore: number
  benignProb: number
  phishingProb: number
  malwareProb: number
  defacementProb: number
  topAttention: AttentionToken[]
  status: ThreatStatus
  severity: ThreatSeverity
  detectedAt: string
}

export interface AlertDto {
  id: string
  threatId: string
  threatUrl: string
  severity: AlertSeverity
  message: string
  isRead: boolean
  sentAt: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface DashboardSummary {
  totalThreats: number
  todayThreats: number
  unreadAlerts: number
  criticalAlerts: number
  pendingReview: number
  labelBreakdown: {
    benign: number
    phishing: number
    malware: number
    defacement: number
  }
}

export interface TimelinePoint {
  date: string
  benign: number
  phishing: number
  malware: number
  defacement: number
}

export interface TopThreat {
  id: string
  url: string
  label: string
  riskScore: number
  detectedAt: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  role: string
  userId: string
}
