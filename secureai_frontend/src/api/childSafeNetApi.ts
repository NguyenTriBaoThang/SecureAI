import api from './axiosInstance'

export type ChildScanAction = 'ALLOW' | 'WARN' | 'BLOCK'
export type ProtectionMode = 'Strict' | 'Balanced' | 'Relaxed'

export interface ChildScanRequest {
  url: string
  title?: string
  text?: string
  source?: 'Web' | 'Extension'
}

export interface ChildScanResult {
  risk_level: string
  label: string
  score: number
  action: ChildScanAction
  explanation: string[]
  meta?: Record<string, unknown>
}

export interface ChildSettings {
  childAge: number
  mode: ProtectionMode
  whitelist: string[]
  blacklist: string[]
  blockAdult: boolean
  blockGambling: boolean
  blockPhishing: boolean
  warnSuspicious: boolean
}

export interface ScanLogItem {
  id: string
  url: string
  title?: string | null
  label: string
  riskLevel: string
  score: number
  action: ChildScanAction | string
  explanationJson: string
  source: string
  createdAt: string
}

export interface LogsResponse {
  total: number
  page: number
  pageSize: number
  items: ScanLogItem[]
}

export interface DatasetItem {
  id: string
  url: string
  host: string
  predictedLabel: string
  predictedScore: number
  action: string
  status: string
  finalLabel?: string | null
  seenCount: number
  lastSeenAt: string
  source: string
}

export interface TrainJob {
  id?: string
  name?: string
  version?: string
  status?: string
  accuracy?: number | null
  f1Weighted?: number | null
  createdAt?: string
  modelVersion?: string
  note?: string
}

export interface FeedbackRequest {
  url: string
  feedbackLabel: string
  isCorrect: boolean
  note?: string
}

export const childSafeNetApi = {
  scan: async (payload: ChildScanRequest): Promise<ChildScanResult> => {
    const res = await api.post<ChildScanResult>('/scan', { source: 'Web', ...payload })
    return res.data
  },

  getSettings: async (): Promise<ChildSettings> => {
    const res = await api.get<ChildSettings>('/settings')
    return res.data
  },

  updateSettings: async (payload: ChildSettings): Promise<ChildSettings> => {
    const res = await api.put<ChildSettings>('/settings', payload)
    return res.data
  },

  getLogs: async (params: { page?: number; pageSize?: number; action?: string; label?: string } = {}): Promise<LogsResponse> => {
    const res = await api.get<LogsResponse>('/logs', { params })
    return res.data
  },

  createFeedback: async (payload: FeedbackRequest): Promise<{ ok: boolean }> => {
    const res = await api.post<{ ok: boolean }>('/feedback', payload)
    return res.data
  },

  getPendingDataset: async (take = 100): Promise<DatasetItem[]> => {
    const res = await api.get<DatasetItem[]>('/dataset/pending', { params: { take } })
    return Array.isArray(res.data) ? res.data : []
  },

  approveDataset: async (ids: string[]): Promise<{ ok: boolean; count: number }> => {
    const res = await api.post<{ ok: boolean; count: number }>('/dataset/approve', { ids })
    return res.data
  },

  rejectDataset: async (ids: string[]): Promise<{ ok: boolean; count: number }> => {
    const res = await api.post<{ ok: boolean; count: number }>('/dataset/reject', { ids })
    return res.data
  },

  exportDataset: async (): Promise<Blob> => {
    const res = await api.get('/dataset/export', { responseType: 'blob' })
    return res.data as Blob
  },

  getTrainJobs: async (): Promise<TrainJob[]> => {
    const res = await api.get<TrainJob[]>('/train/jobs')
    return Array.isArray(res.data) ? res.data : []
  },

  triggerTrain: async (): Promise<{ jobId: string; status: string; message?: string }> => {
    const res = await api.post<{ jobId: string; status: string; message?: string }>('/train/trigger', {})
    return res.data
  },
}