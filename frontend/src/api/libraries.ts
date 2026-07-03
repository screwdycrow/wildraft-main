import apiClient from './axios'
import type { Library, CreateLibraryPayload, UpdateLibraryPayload, LibraryAccess, AccessRole } from '@/types/library.types'

export const librariesApi = {
  async getAll(): Promise<{ libraries: Library[] }> {
    const response = await apiClient.get<{ libraries: Library[] }>('/libraries')
    return response.data
  },

  async getById(id: number): Promise<{ library: Library }> {
    const response = await apiClient.get<{ library: Library }>(`/libraries/${id}`)
    return response.data
  },

  async create(payload: CreateLibraryPayload): Promise<{ message: string; library: Library }> {
    const response = await apiClient.post<{ message: string; library: Library }>('/libraries', payload)
    return response.data
  },

  async update(id: number, payload: UpdateLibraryPayload): Promise<{ message: string; library: Library }> {
    const response = await apiClient.put<{ message: string; library: Library }>(`/libraries/${id}`, payload)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/libraries/${id}`)
  },

  async getAccess(libraryId: number): Promise<{ access: LibraryAccess[] }> {
    const response = await apiClient.get<{ access: LibraryAccess[] }>(`/libraries/${libraryId}/access`)
    return response.data
  },

  // Backend expects { email, role } — grants access to an existing account by email.
  async grantAccess(libraryId: number, email: string, role: AccessRole): Promise<{ message: string; access: LibraryAccess }> {
    const response = await apiClient.post<{ message: string; access: LibraryAccess }>(`/libraries/${libraryId}/access`, { email, role })
    return response.data
  },

  async updateAccess(libraryId: number, accessId: number, role: AccessRole): Promise<{ message: string; access: LibraryAccess }> {
    const response = await apiClient.put<{ message: string; access: LibraryAccess }>(`/libraries/${libraryId}/access/${accessId}`, { role })
    return response.data
  },

  async revokeAccess(libraryId: number, accessId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/access/${accessId}`)
  },
}





