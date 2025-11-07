export interface Tag {
  id: number
  name: string
  color: string
  folder: string | null
  libraryId: number
  itemCount?: number
  createdAt: string
  updatedAt: string
}

export interface TagWithItems extends Tag {
  libraryItems: Array<{
    id: number
    name: string
    type: string
    description: string | null
  }>
}

export interface CreateTagPayload {
  name: string
  color: string
  folder?: string | null
}

export interface UpdateTagPayload {
  name?: string
  color?: string
  folder?: string | null
}

