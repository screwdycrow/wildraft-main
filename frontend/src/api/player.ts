import apiClient from './axios'
import type { AccessRole } from '@/types/library.types'
import type { ItemPermission } from './shares'

export interface SharedItem {
  id: number
  name: string
  type: string
  description: string | null
  color: string
  permission: ItemPermission
  featuredImage: Record<string, any> | null
}

export interface SharedDmScreen {
  id: string
  name: string
  canEdit: boolean
  updatedAt: string
}

export interface SharedPortalView {
  id: string
  name: string
}

export interface SharedContent {
  library: { id: number; name: string; description: string | null }
  role: AccessRole
  items: SharedItem[]
  dmScreens: SharedDmScreen[]
  portalViews: SharedPortalView[]
}

export const playerApi = {
  /** Everything in a library shared with the current user (players) / everything (viewer+). */
  async getSharedContent(libraryId: number): Promise<SharedContent> {
    const response = await apiClient.get<SharedContent>(
      `/libraries/${libraryId}/player/shared-content`
    )
    return response.data
  },
}
