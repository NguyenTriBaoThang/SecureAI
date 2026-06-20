import api from './axiosInstance'
import type { AlertDto, PagedResult, AlertSeverity } from '../types'

export const alertApi = {
  getList: async (params: {
    page?: number
    pageSize?: number
    severity?: AlertSeverity
    unreadOnly?: boolean
  } = {}): Promise<PagedResult<AlertDto>> => {
    const res = await api.get<PagedResult<AlertDto>>('/alerts', { params })
    return res.data
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<number>('/alerts/unread-count')
    return res.data
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/alerts/${id}/read`)
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/alerts/read-all')
  },
}
