import apiClient from './axios'
import type { 
  DmScreen,
  CreateDmScreenPayload,
  UpdateDmScreenPayload,
  DmScreensListResponse,
  DmScreenResponse
} from '@/types/dmScreen.types'

export const dmScreensApi = {
  // Get all DM screens for a library
  async getAll(libraryId: number): Promise<DmScreensListResponse> {
    const response = await apiClient.get<DmScreensListResponse>(`/libraries/${libraryId}/dm-screens`)
    return response.data
  },

  // Get single DM screen
  async getById(libraryId: number, dmScreenId: string): Promise<DmScreenResponse> {
    const response = await apiClient.get<DmScreenResponse>(`/libraries/${libraryId}/dm-screens/${dmScreenId}`)
    return response.data
  },

  // Create DM screen
  async create(libraryId: number, payload: CreateDmScreenPayload): Promise<DmScreenResponse & { message: string }> {
    const response = await apiClient.post<DmScreenResponse & { message: string }>(`/libraries/${libraryId}/dm-screens`, payload)
    return response.data
  },

  // Update DM screen
  async update(libraryId: number, dmScreenId: string, payload: UpdateDmScreenPayload): Promise<DmScreenResponse & { message: string }> {
    const response = await apiClient.put<DmScreenResponse & { message: string }>(`/libraries/${libraryId}/dm-screens/${dmScreenId}`, payload)
    return response.data
  },

  // Delete DM screen
  async delete(libraryId: number, dmScreenId: string): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/dm-screens/${dmScreenId}`)
  },
}

