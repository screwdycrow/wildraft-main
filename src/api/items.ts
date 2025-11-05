import { apiClient } from './axios'
import type { LibraryItem, CreateItemPayload, UpdateItemPayload } from '@/types/item.types'

export const itemsApi = {
  async getAll(libraryId: number): Promise<{ items: LibraryItem[] }> {
    const response = await apiClient.get<{ items: LibraryItem[] }>(`/libraries/${libraryId}/items`)
    return response.data
  },

  async getById(libraryId: number, itemId: number): Promise<{ item: LibraryItem }> {
    const response = await apiClient.get<{ item: LibraryItem }>(`/libraries/${libraryId}/items/${itemId}`)
    return response.data
  },

  async create(libraryId: number, payload: CreateItemPayload): Promise<{ message: string; item: LibraryItem }> {
    const response = await apiClient.post<{ message: string; item: LibraryItem }>(`/libraries/${libraryId}/items`, payload)
    return response.data
  },

  async update(libraryId: number, itemId: number, payload: UpdateItemPayload): Promise<{ message: string; item: LibraryItem }> {
    const response = await apiClient.put<{ message: string; item: LibraryItem }>(`/libraries/${libraryId}/items/${itemId}`, payload)
    return response.data
  },

  async delete(libraryId: number, itemId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/items/${itemId}`)
  },
}





