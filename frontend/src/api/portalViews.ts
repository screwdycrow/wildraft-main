import apiClient from './axios'
import type {
  LibraryPortalView,
  CreatePortalViewPayload,
  UpdatePortalViewPayload,
  PortalViewsListResponse,
  PortalViewResponse,
} from '@/types/portal.types'

export const portalViewsApi = {
  async getAll(libraryId: number): Promise<PortalViewsListResponse> {
    const response = await apiClient.get<PortalViewsListResponse>(
      `/libraries/${libraryId}/portal-views`
    )
    return response.data
  },

  async getById(libraryId: number, portalViewId: string): Promise<PortalViewResponse> {
    const response = await apiClient.get<PortalViewResponse>(
      `/libraries/${libraryId}/portal-views/${portalViewId}`
    )
    return response.data
  },

  async create(
    libraryId: number,
    payload: CreatePortalViewPayload
  ): Promise<{ message: string; portalView: LibraryPortalView }> {
    const response = await apiClient.post<{ message: string; portalView: LibraryPortalView }>(
      `/libraries/${libraryId}/portal-views`,
      payload
    )
    return response.data
  },

  async update(
    libraryId: number,
    portalViewId: string,
    payload: UpdatePortalViewPayload
  ): Promise<{ message: string; portalView: LibraryPortalView }> {
    const response = await apiClient.put<{ message: string; portalView: LibraryPortalView }>(
      `/libraries/${libraryId}/portal-views/${portalViewId}`,
      payload
    )
    return response.data
  },

  async delete(libraryId: number, portalViewId: string): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/portal-views/${portalViewId}`)
  },
}

