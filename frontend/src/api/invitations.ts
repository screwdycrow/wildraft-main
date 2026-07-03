import apiClient from './axios'
import type { AccessRole, PlayerInvitation, PublicInvitation } from '@/types/library.types'

export interface CreateInvitationPayload {
  role?: AccessRole
  email?: string
  expiresAt?: string
  maxUses?: number
}

export const invitationsApi = {
  async create(
    libraryId: number,
    payload: CreateInvitationPayload = {}
  ): Promise<{ invitation: PlayerInvitation }> {
    const response = await apiClient.post<{ invitation: PlayerInvitation }>(
      `/libraries/${libraryId}/invitations`,
      payload
    )
    return response.data
  },

  async list(libraryId: number): Promise<{ invitations: PlayerInvitation[] }> {
    const response = await apiClient.get<{ invitations: PlayerInvitation[] }>(
      `/libraries/${libraryId}/invitations`
    )
    return response.data
  },

  async revoke(libraryId: number, invitationId: string): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/invitations/${invitationId}`)
  },

  /** Public: inspect an invite link for the landing page (works unauthenticated). */
  async getByToken(token: string): Promise<PublicInvitation> {
    const response = await apiClient.get<PublicInvitation>(`/invitations/${token}`)
    return response.data
  },

  /** Claim an invite as the logged-in user. */
  async claim(
    token: string
  ): Promise<{ libraryId: number; role: AccessRole; alreadyMember: boolean }> {
    const response = await apiClient.post<{
      libraryId: number
      role: AccessRole
      alreadyMember: boolean
    }>(`/invitations/${token}/claim`)
    return response.data
  },

  /** Builds the shareable URL for an invitation token. */
  buildInviteUrl(token: string): string {
    return `${window.location.origin}/invite/${token}`
  },
}
