import api from './axiosInstance'
import type { DashboardSummary, TimelinePoint, TopThreat } from '../types'

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary')
    return res.data
  },

  getTimeline: async (days = 7): Promise<TimelinePoint[]> => {
    const res = await api.get<TimelinePoint[]>('/dashboard/timeline', { params: { days } })
    return res.data
  },

  getTopThreats: async (count = 10): Promise<TopThreat[]> => {
    const res = await api.get<TopThreat[]>('/dashboard/top-threats', { params: { count } })
    return res.data
  },
}
