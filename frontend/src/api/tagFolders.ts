import apiClient from './axios'
import type { TagFolder, TagFolderWithTags, CreateTagFolderPayload, UpdateTagFolderPayload } from '@/types/tag.types'

export const tagFoldersApi = {
  async getAll(libraryId: number): Promise<{ folders: TagFolder[] }> {
    const response = await apiClient.get<{ folders: TagFolder[] }>(`/libraries/${libraryId}/tag-folders`)
    return response.data
  },

  async getById(libraryId: number, folderId: number): Promise<{ folder: TagFolderWithTags }> {
    const response = await apiClient.get<{ folder: TagFolderWithTags }>(`/libraries/${libraryId}/tag-folders/${folderId}`)
    return response.data
  },

  async create(libraryId: number, payload: CreateTagFolderPayload): Promise<{ message: string; folder: TagFolder }> {
    const response = await apiClient.post<{ message: string; folder: TagFolder }>(`/libraries/${libraryId}/tag-folders`, payload)
    return response.data
  },

  async update(libraryId: number, folderId: number, payload: UpdateTagFolderPayload): Promise<{ message: string; folder: TagFolder }> {
    const response = await apiClient.put<{ message: string; folder: TagFolder }>(`/libraries/${libraryId}/tag-folders/${folderId}`, payload)
    return response.data
  },

  async delete(libraryId: number, folderId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/tag-folders/${folderId}`)
  },
}

