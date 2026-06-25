import api from './axiosInstance'

export interface Statistics {
  totalThreats: number
  todayThreats: number
  avgRiskScore: number
  totalAlerts: number
  unreadAlerts: number
  criticalAlerts: number
  labelBreakdown: { label: string; count: number }[]
  severityBreakdown: { severity: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
  last30DaysTrend: { date: string; count: number }[]
  topMaliciousUrls: { url: string; predictedLabel: string; riskScore: number; detectedAt: string }[]
}

interface ExportFilters {
  label?: string
  status?: string
  from?: string
  to?: string
}

function downloadBlob(data: BlobPart, filename: string, type?: string) {
  const url = URL.createObjectURL(new Blob([data], type ? { type } : undefined))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const exportApi = {
  downloadThreatsCsv: async (params: ExportFilters = {}) => {
    const res = await api.get('/export/threats/csv', { params, responseType: 'blob' })
    downloadBlob(res.data, `threats_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
  },

  downloadThreatsPdf: async (params: ExportFilters = {}) => {
    const res = await api.get('/export/threats/pdf', { params, responseType: 'blob' })
    downloadBlob(res.data, `threats_${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf')
  },

  downloadAlertsCsv: async () => {
    const res = await api.get('/export/alerts/csv', { responseType: 'blob' })
    downloadBlob(res.data, `alerts_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
  },

  downloadAlertsPdf: async () => {
    const res = await api.get('/export/alerts/pdf', { responseType: 'blob' })
    downloadBlob(res.data, `alerts_${new Date().toISOString().slice(0, 10)}.pdf`, 'application/pdf')
  },

  getStatistics: async (): Promise<Statistics> => {
    const res = await api.get<Statistics>('/export/statistics')
    return res.data
  },
}
