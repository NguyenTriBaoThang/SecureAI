import api from './axiosInstance'
import type { ThreatDto, PagedResult, ThreatStatus } from '../types'

export interface ThreatListParams {
  page?: number
  pageSize?: number
  label?: string
  status?: ThreatStatus
  severity?: string
  from?: string
  to?: string
}

export const threatApi = {
  analyze: async (url: string): Promise<ThreatDto> => {
    const res = await api.post<ThreatDto>('/threats/analyze', { url })
    return res.data
  },

  getList: async (params: ThreatListParams = {}): Promise<PagedResult<ThreatDto>> => {
    const res = await api.get<PagedResult<ThreatDto>>('/threats', { params })
    return res.data
  },

  getById: async (id: string): Promise<ThreatDto> => {
    const res = await api.get<ThreatDto>(`/threats/${id}`)
    return res.data
  },

  updateStatus: async (id: string, status: ThreatStatus): Promise<ThreatDto> => {
    const res = await api.patch<ThreatDto>(`/threats/${id}/status`, { status })
    return res.data
  },

  label: async (id: string, label: string, note?: string): Promise<ThreatDto> => {
    const res = await api.post<ThreatDto>(`/threats/${id}/label`, { label, note })
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/threats/${id}`)
  },
}
