export interface Library {
  id: number
  name: string
  description: string | null
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  createdAt: string
  updatedAt: string
}

export interface CreateLibraryPayload {
  name: string
  description?: string
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





