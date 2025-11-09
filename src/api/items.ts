import apiClient from './axios'
import type { 
  LibraryItem, 
  CreateLibraryItemPayload, 
  UpdateLibraryItemPayload,
  LibraryItemsListResponse 
} from '@/types/item.types'

export const itemsApi = {
  // Get all items for a library
  async getAll(libraryId: number, params?: { 
    type?: string 
    tagIds?: number[]
    search?: string
    limit?: number
    offset?: number
  }): Promise<LibraryItemsListResponse> {
    const response = await apiClient.get<LibraryItemsListResponse>(`/libraries/${libraryId}/items`, { params })
    return response.data
  },

  // Get single item
  async getById(libraryId: number, itemId: number): Promise<{ item: LibraryItem }> {
    const response = await apiClient.get<{ item: LibraryItem }>(`/libraries/${libraryId}/items/${itemId}`)
    return response.data
  },

  // Create item
  async create(libraryId: number, payload: CreateLibraryItemPayload): Promise<{ message: string; item: LibraryItem }> {
    const response = await apiClient.post<{ message: string; item: LibraryItem }>(`/libraries/${libraryId}/items`, payload)
    return response.data
  },

  // Update item
  async update(libraryId: number, itemId: number, payload: UpdateLibraryItemPayload): Promise<{ message: string; item: LibraryItem }> {
    const response = await apiClient.put<{ message: string; item: LibraryItem }>(`/libraries/${libraryId}/items/${itemId}`, payload)
    return response.data
  },

  // Delete item
  async delete(libraryId: number, itemId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/items/${itemId}`)
  },

  // Attach file to item
  async attachFile(libraryId: number, itemId: number, fileId: number): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/libraries/${libraryId}/items/${itemId}/files/${fileId}`)
    return response.data
  },

  // Detach file from item
  async detachFile(libraryId: number, itemId: number, fileId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/items/${itemId}/files/${fileId}`)
  },
}

