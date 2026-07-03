export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'PLAYER'

export interface Library {
  id: number
  name: string
  description: string | null
  role: AccessRole
  createdAt: string
  updatedAt: string
  frontPageDmScreenId: string | null
}

//DICTIONARY OF LIBRARY TEMPLATES WITH LABELS AND DESCRIPTIONS
export const LibraryTemplates = [
  {
    label: 'Dungeons & Dragons 5E',
    description: 'A library template for Dungeons & Dragons 5E. It includes stat blocks, characters, items, and notes.',
    id: 'DND_5E',
  },
]

export interface CreateLibraryPayload {
  name: string
  description?: string
  template?: string
}

export interface UpdateLibraryPayload {
  name?: string
  description?: string
  frontPageDmScreenId?: string | null
}

export interface LibraryAccess {
  id: number
  userId: number
  libraryId: number
  role: AccessRole
  user: {
    id: number
    email: string
    name: string | null
    picture?: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface PlayerInvitation {
  id: string
  token: string
  role: AccessRole
  email: string | null
  expiresAt: string | null
  maxUses: number | null
  uses: number
  revokedAt: string | null
  usedAt: string | null
  createdAt: string
}

export type InvitationStatus = 'valid' | 'expired' | 'revoked' | 'exhausted'

export interface PublicInvitation {
  library: { id: number; name: string }
  role: AccessRole
  email: string | null
  status: InvitationStatus
}







