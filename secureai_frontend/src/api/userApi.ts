import api from './axiosInstance'

export interface UserDto {
  id:          string
  email:       string
  role:        string
  isActive:    boolean
  createdAt:   string
  lastLoginAt: string | null
}

export interface CreateUserRequest {
  email:    string
  password: string
  role:     string
}

export interface UpdateUserRequest {
  role?:     string
  isActive?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword:     string
}

export const userApi = {
  getList: async (): Promise<UserDto[]> => {
    const res = await api.get<UserDto[]>('/users')
    return res.data
  },

  getById: async (id: string): Promise<UserDto> => {
    const res = await api.get<UserDto>(`/users/${id}`)
    return res.data
  },

  create: async (req: CreateUserRequest): Promise<UserDto> => {
    const res = await api.post<UserDto>('/users', req)
    return res.data
  },

  update: async (id: string, req: UpdateUserRequest): Promise<UserDto> => {
    const res = await api.patch<UserDto>(`/users/${id}`, req)
    return res.data
  },

  changePassword: async (id: string, req: ChangePasswordRequest): Promise<void> => {
    await api.patch(`/users/${id}/password`, req)
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
