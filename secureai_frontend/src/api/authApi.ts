import api from './axiosInstance'
import type { LoginResponse } from '../types'

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await api.post<LoginResponse>('/auth/login', { email, password })
    return res.data
  },

  me: async () => {
    const res = await api.get('/auth/me')
    return res.data
  },
}
