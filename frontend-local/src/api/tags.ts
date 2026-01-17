import apiClient from './axios'
import type { Tag, TagWithItems, CreateTagPayload, UpdateTagPayload } from '@/types/tag.types'

export const tagsApi = {
  async getAll(libraryId: number): Promise<{ tags: Tag[] }> {
    const response = await apiClient.get<{ tags: Tag[] }>(`/libraries/${libraryId}/tags`)
    return response.data
  },

  async getById(libraryId: number, tagId: number): Promise<{ tag: TagWithItems }> {
    const response = await apiClient.get<{ tag: TagWithItems }>(`/libraries/${libraryId}/tags/${tagId}`)
    return response.data
  },

  async create(libraryId: number, payload: CreateTagPayload): Promise<{ message: string; tag: Tag }> {
    const response = await apiClient.post<{ message: string; tag: Tag }>(`/libraries/${libraryId}/tags`, payload)
    return response.data
  },

  async update(libraryId: number, tagId: number, payload: UpdateTagPayload): Promise<{ message: string; tag: Tag }> {
    const response = await apiClient.put<{ message: string; tag: Tag }>(`/libraries/${libraryId}/tags/${tagId}`, payload)
    return response.data
  },

  async delete(libraryId: number, tagId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/tags/${tagId}`)
  },
}

