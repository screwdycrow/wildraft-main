import apiClient from './axios'
import type { FileCategory, CreateFileCategoryPayload, UpdateFileCategoryPayload } from './files'

export const fileCategoriesApi = {
  // Get all file categories for a library
  async getAll(libraryId: number): Promise<{ categories: FileCategory[] }> {
    const response = await apiClient.get<{ categories: FileCategory[] }>(`/libraries/${libraryId}/file-categories`)
    return response.data
  },

  // Get single file category
  async getById(libraryId: number, categoryId: number): Promise<{ category: FileCategory & { userFiles: any[] } }> {
    const response = await apiClient.get<{ category: FileCategory & { userFiles: any[] } }>(`/libraries/${libraryId}/file-categories/${categoryId}`)
    return response.data
  },

  // Create file category
  async create(libraryId: number, payload: CreateFileCategoryPayload): Promise<{ message: string; category: FileCategory }> {
    const response = await apiClient.post<{ message: string; category: FileCategory }>(`/libraries/${libraryId}/file-categories`, payload)
    return response.data
  },

  // Update file category
  async update(libraryId: number, categoryId: number, payload: UpdateFileCategoryPayload): Promise<{ message: string; category: FileCategory }> {
    const response = await apiClient.put<{ message: string; category: FileCategory }>(`/libraries/${libraryId}/file-categories/${categoryId}`, payload)
    return response.data
  },

  // Delete file category
  async delete(libraryId: number, categoryId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/file-categories/${categoryId}`)
  },
}

