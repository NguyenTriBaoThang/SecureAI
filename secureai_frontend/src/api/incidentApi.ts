import api from './axiosInstance'
import type { IncidentDto, IncidentStatus, PagedResult, ThreatSeverity } from '../types'

export interface IncidentListParams {
  page?: number
  pageSize?: number
  status?: IncidentStatus
  priority?: ThreatSeverity
  search?: string
}

export const incidentApi = {
  getList: async (params: IncidentListParams = {}): Promise<PagedResult<IncidentDto>> => {
    const res = await api.get<PagedResult<IncidentDto>>('/incidents', { params })
    return res.data
  },

  getById: async (id: string): Promise<IncidentDto> => {
    const res = await api.get<IncidentDto>(`/incidents/${id}`)
    return res.data
  },

  update: async (id: string, status: IncidentStatus, resolutionNote?: string): Promise<IncidentDto> => {
    const res = await api.patch<IncidentDto>(`/incidents/${id}`, { status, resolutionNote })
    return res.data
  },
}
