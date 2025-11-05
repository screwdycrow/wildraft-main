import { apiClient } from './axios'
import type { Tag } from '@/types/item.types'

export const tagsApi = {
  async getAll(libraryId: number): Promise<{ tags: Tag[] }> {
    const response = await apiClient.get<{ tags: Tag[] }>(`/libraries/${libraryId}/tags`)
    return response.data
  },

  async getById(libraryId: number, tagId: number): Promise<{ tag: Tag & { libraryItems: Array<{ id: number; name: string; type: string }> } }> {
    const response = await apiClient.get(`/libraries/${libraryId}/tags/${tagId}`)
    return response.data
  },

  async create(libraryId: number, payload: { name: string; color?: string }): Promise<{ message: string; tag: Tag }> {
    const response = await apiClient.post<{ message: string; tag: Tag }>(`/libraries/${libraryId}/tags`, payload)
    return response.data
  },

  async update(libraryId: number, tagId: number, payload: { name?: string; color?: string }): Promise<{ message: string; tag: Tag }> {
    const response = await apiClient.put<{ message: string; tag: Tag }>(`/libraries/${libraryId}/tags/${tagId}`, payload)
    return response.data
  },

  async delete(libraryId: number, tagId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/tags/${tagId}`)
  },
}





