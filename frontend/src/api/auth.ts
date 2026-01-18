import apiClient, { authClient } from './axios'
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth.types'

export const authApi = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials)
    return response.data
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    return response.data
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>('/auth/me')
    return response.data
  },

  // Use authClient (no 401 interceptor) to prevent infinite loops
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await authClient.post<AuthResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  // Use authClient (no 401 interceptor) to prevent infinite loops during logout
  async logout(): Promise<void> {
    await authClient.post('/auth/logout')
  },

  getGoogleAuthUrl(): string {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/google`
  },
}






