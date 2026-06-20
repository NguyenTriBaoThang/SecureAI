import api from './axiosInstance'

export interface Statistics {
  totalThreats:       number
  todayThreats:       number
  avgRiskScore:       number
  totalAlerts:        number
  unreadAlerts:       number
  labelBreakdown:     { label: string; count: number }[]
  severityBreakdown:  { severity: string; count: number }[]
  statusBreakdown:    { status: string; count: number }[]
  last30DaysTrend:    { date: string; count: number }[]
  topMaliciousUrls:   { url: string; predictedLabel: string; riskScore: number; detectedAt: string }[]
}

export const exportApi = {
  downloadThreatsCsv: async (params: {
    label?: string
    status?: string
    from?: string
    to?: string
  } = {}) => {
    const res = await api.get('/export/threats/csv', {
      params,
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.download = `threats_${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  },

  downloadAlertsCsv: async () => {
    const res = await api.get('/export/alerts/csv', { responseType: 'blob' })
    const url  = URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href  = url
    link.download = `alerts_${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  },

  getStatistics: async (): Promise<Statistics> => {
    const res = await api.get<Statistics>('/export/statistics')
    return res.data
  },
}
