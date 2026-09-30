import api from './axiosInstance'

export interface EmailAnalyzeRequest {
  rawEmail:    string
  analyzeUrls?: boolean
}

export interface HeaderFlags {
  spfPass:           boolean
  dkimPass:          boolean
  dmarcPass:         boolean
  replyToMismatch:   boolean
  suspiciousXMailer: boolean
  fromDomain:        string
  subject:           string
}

export interface BodyFlags {
  urgencyKeywords:  number
  phishingKeywords: number
  brandMismatch:    boolean
  mentionedBrands:  string[]
  hasHtmlForm:      boolean
  linkCount:        number
}

export interface UrlResult {
  url:       string
  label:     string
  riskScore: number
  action:    string
}

export interface EmailAnalyzeResponse {
  verdict:     string
  riskScore:   number
  reasons:     string[]
  headerFlags: HeaderFlags
  bodyFlags:   BodyFlags
  urlsFound:   UrlResult[]
  action:      string
}

export interface MethodResult {
  method:     string
  label:      string
  riskScore:  number
  confidence: number
  reason:     string
  latencyMs:  number
}

export interface BaselineResponse {
  url:            string
  methods:        MethodResult[]
  agreement:      boolean
  consensusLabel: string
  summary:        Record<string, string>
}

export interface ExtractedEmailData {
  from?: string
  to?: string
  subject?: string
  body?: string
}

export const emailApi = {
  analyze: async (req: EmailAnalyzeRequest): Promise<EmailAnalyzeResponse> => {
    const res = await api.post<EmailAnalyzeResponse>('/email/analyze', req)
    return res.data
  },
  extractFromFile: async (file: File): Promise<ExtractedEmailData> => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post<ExtractedEmailData>('/email/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    } catch {
      // Fallback: Nếu backend chưa cấu hình proxy sang ML, gọi trực tiếp endpoint ML đã cấu hình
      const mlUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000'
      const response = await fetch(`${mlUrl}/extract/email`, { method: 'POST', body: formData })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail ?? 'Không trích xuất được email từ tệp.')
      }
      return await response.json()
    }
  },
}

export const baselineApi = {
  compare: async (url: string): Promise<BaselineResponse> => {
    const res = await api.post<BaselineResponse>('/baseline/compare', { url })
    return res.data
  },
}
