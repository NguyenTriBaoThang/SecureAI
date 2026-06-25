export type ThreatLabel = 'benign' | 'phishing' | 'malware' | 'defacement'
export type ThreatStatus = 'Pending' | 'Confirmed' | 'FalsePositive' | 'Escalated' | 'Archived'
export type ThreatSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type AlertSeverity = 'Info' | 'Medium' | 'High' | 'Critical'
export type AlertStatus = 'New' | 'Investigating' | 'Resolved' | 'FalsePositive'
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'FalsePositive'
export type RuleAction = 'Block' | 'Review' | 'Allow' | string

export interface AttentionToken {
  char: string
  weight: number
}

export interface RuleEvaluation {
  action: RuleAction
  matched: boolean
  blockThreshold: number
  reviewThreshold: number
  triggeredRules: string[]
  recommendedActions: string[]
  evaluatedAt: string
}

export interface ThreatIntelEnrichment {
  normalizedUrl: string
  scheme: string
  host: string
  domain: string
  tld: string
  usesHttps: boolean
  isIpAddress: boolean
  urlLength: number
  subdomainCount: number
  pathDepth: number
  queryParameterCount: number
  hasPunycode: boolean
  containsAtSymbol: boolean
  hasSuspiciousTld: boolean
  fileExtension?: string | null
  suspiciousKeywords: string[]
  indicators: string[]
}

export interface DecisionSupport {
  recommendation: 'Block' | 'Review' | 'Allow' | string
  priority: string
  summary: string
  reasons: string[]
  nextSteps: string[]
}

export interface RiskExplanation {
  modelScore: string
  modelSignals: string[]
  urlIndicators: string[]
  attentionHighlights: string[]
}

export interface AnalystNote {
  id: string
  label: string
  note?: string
  analystEmail: string
  createdAt: string
}

export interface IncidentSummary {
  id: string
  status: IncidentStatus
  priority: ThreatSeverity
  title: string
  recommendedAction: string
  createdAt: string
  updatedAt: string
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
  ruleEvaluation: RuleEvaluation
  enrichment: ThreatIntelEnrichment
  decisionSupport: DecisionSupport
  riskExplanation: RiskExplanation
  incident?: IncidentSummary | null
  analystNotes: AnalystNote[]
}

export interface AlertDto {
  id: string
  threatId: string
  threatUrl: string
  severity: AlertSeverity
  status: AlertStatus
  message: string
  isRead: boolean
  sentAt: string
  updatedAt: string
  workflowNote?: string | null
}

export interface IncidentDto {
  id: string
  threatId: string
  threatUrl: string
  predictedLabel: string
  riskScore: number
  priority: ThreatSeverity
  status: IncidentStatus
  title: string
  summary: string
  recommendedAction: string
  decisionReason: string
  assignedToUserId?: string | null
  assignedToEmail?: string | null
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
  resolutionNote?: string | null
  decisionSupport: DecisionSupport
  riskExplanation: RiskExplanation
  analystNotes: AnalystNote[]
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
  openIncidents: number
  investigatingAlerts: number
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
