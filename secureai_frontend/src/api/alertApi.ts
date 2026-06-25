import api from './axiosInstance'
import type { AlertDto, PagedResult, AlertSeverity, AlertStatus } from '../types'

export const alertApi = {
  getList: async (params: {
    page?: number
    pageSize?: number
    severity?: AlertSeverity
    status?: AlertStatus
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

  updateStatus: async (id: string, status: AlertStatus, note?: string): Promise<AlertDto> => {
    const res = await api.patch<AlertDto>(`/alerts/${id}/status`, { status, note })
    return res.data
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/alerts/read-all')
  },
}
