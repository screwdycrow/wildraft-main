export interface Library {
  id: number
  name: string
  description: string | null
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  createdAt: string
  updatedAt: string
}

//DICTIONARY OF LIBRARY TEMPLATES WITH LABELS AND DESCRIPTIONS
export const LibraryTemplates = [
  {
    label: 'Dungeons & Dragons 5E',
    description: 'A library template for Dungeons & Dragons 5E. It includes stat blocks, characters, items, and notes.',
    id:'DND_5E',
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
}

export interface LibraryAccess {
  id: number
  userId: number
  libraryId: number
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  user: {
    id: number
    email: string
    name: string | null 
  }
  createdAt: string
  updatedAt: string
}







