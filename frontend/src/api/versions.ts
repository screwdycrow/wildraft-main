import apiClient from './axios'

export interface LibraryVersionsResponse {
  itemsVersion: number
  tagsVersion: number
}

export async function getLibraryVersions(libraryId: number): Promise<LibraryVersionsResponse> {
  const response = await apiClient.get<LibraryVersionsResponse>(`/libraries/${libraryId}/versions`)
  return response.data
}

