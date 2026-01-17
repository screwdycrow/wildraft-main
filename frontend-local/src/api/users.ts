import apiClient from './axios'
import type { User } from '@/types/auth.types'

export const usersApi = {
  async findByEmail(email: string): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>(`/users/by-email/${encodeURIComponent(email)}`)
    return response.data
  },
}

