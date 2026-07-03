import apiClient from './axios'

export type ItemPermission = 'VIEW' | 'EDIT'

export interface ShareUser {
  id: number
  email: string
  name: string | null
  picture: string | null
}

export interface ItemShare {
  userId: number
  user: ShareUser
  permission: ItemPermission
}

export interface DmScreenShare {
  userId: number
  user: ShareUser
  canEdit: boolean
}

export interface PortalShare {
  userId: number
  user: ShareUser
}

export interface PlayerSharesAggregate {
  items: { id: number; name: string; type: string; permission: ItemPermission }[]
  dmScreens: { id: string; name: string; canEdit: boolean }[]
  portalViews: { id: string; name: string }[]
}

export const sharesApi = {
  // ----- items -----
  async getItemShares(libraryId: number, itemId: number): Promise<{ shares: ItemShare[] }> {
    const response = await apiClient.get(`/libraries/${libraryId}/items/${itemId}/shares`)
    return response.data
  },

  async putItemShares(
    libraryId: number,
    itemId: number,
    shares: { userId: number; permission?: ItemPermission }[]
  ): Promise<void> {
    await apiClient.put(`/libraries/${libraryId}/items/${itemId}/shares`, { shares })
  },

  // ----- DM screens -----
  async getDmScreenShares(
    libraryId: number,
    dmScreenId: string
  ): Promise<{ shares: DmScreenShare[] }> {
    const response = await apiClient.get(`/libraries/${libraryId}/dm-screens/${dmScreenId}/shares`)
    return response.data
  },

  async putDmScreenShares(
    libraryId: number,
    dmScreenId: string,
    shares: { userId: number; canEdit?: boolean }[]
  ): Promise<void> {
    await apiClient.put(`/libraries/${libraryId}/dm-screens/${dmScreenId}/shares`, { shares })
  },

  // ----- portal views -----
  async getPortalShares(
    libraryId: number,
    portalViewId: string
  ): Promise<{ shares: PortalShare[] }> {
    const response = await apiClient.get(
      `/libraries/${libraryId}/portal-views/${portalViewId}/shares`
    )
    return response.data
  },

  async putPortalShares(
    libraryId: number,
    portalViewId: string,
    shares: { userId: number }[]
  ): Promise<void> {
    await apiClient.put(`/libraries/${libraryId}/portal-views/${portalViewId}/shares`, { shares })
  },

  // ----- per-player aggregate -----
  async getPlayerShares(libraryId: number, userId: number): Promise<PlayerSharesAggregate> {
    const response = await apiClient.get(`/libraries/${libraryId}/player-shares/${userId}`)
    return response.data
  },
}
