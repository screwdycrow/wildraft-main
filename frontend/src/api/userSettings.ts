import apiClient from './axios'
import type { User } from '@/types/auth.types'

export interface UserSettings {
    openaiApiKey?: string
    aiSettings?: Record<string, any>
}

export const userSettingsApi = {
    async updateSettings(settings: UserSettings): Promise<{ user: User }> {
        const response = await apiClient.put<{ user: User }>('/users/me', settings)
        return response.data
    },
}
