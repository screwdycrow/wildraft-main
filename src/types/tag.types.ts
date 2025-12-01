import type { UserFile } from './item.types'

// Tag Folder model
export interface TagFolder {
  id: number
  name: string
  order: number
  libraryId: number
  tagCount?: number
  createdAt: string
  updatedAt: string
}

export interface TagFolderWithTags extends TagFolder {
  tags: Tag[]
}

export interface CreateTagFolderPayload {
  name: string
  order?: number
}

export interface UpdateTagFolderPayload {
  name?: string
  order?: number
}

// Tag model
export interface Tag {
  id: number
  name: string
  color: string
  order: number
  folderId: number | null
  folder?: TagFolder | null
  libraryId: number
  featuredImage?: UserFile | null
  featuredImageId?: number | null
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
  folderId?: number | null
  order?: number
  featuredImageId?: number | null
}

export interface UpdateTagPayload {
  name?: string
  color?: string
  folderId?: number | null
  order?: number
  featuredImageId?: number | null
}
