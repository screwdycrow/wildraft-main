// Template-specific item types

export type ItemType = 
  | 'STAT_BLOCK_DND_5E' 
  | 'ITEM_DND_5E' 
  | 'CHARACTER_DND_5E'
  | 'NOTE' // Universal - not template specific

//DICTIONARY OF ITEM TYPES WITH LABELS AND DESCRIPTIONS

export interface Tag {
  id: number
  name: string
  color: string
  libraryId: number
  createdAt: string
  updatedAt: string
}

export interface UserFile {
  id: number
  userId: number
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  createdAt: string
  updatedAt: string
}

export interface LibraryItem {
  id: number
  libraryId: number
  type: ItemType
  name: string
  description: string | null
  data: Record<string, any>
  tags?: Tag[]
  userFiles?: UserFile[]
  featuredImage?: UserFile | null
  createdAt: string
  updatedAt: string
}

export interface CreateLibraryItemPayload {
  type: ItemType
  name: string
  description?: string
  data: Record<string, any>
  tagIds?: number[]
  userFileIds?: number[]
  featuredImageId?: number
}

export interface UpdateLibraryItemPayload {
  name?: string
  description?: string
  data?: Record<string, any>
  tagIds?: number[]
  userFileIds?: number[]
  featuredImageId?: number
}

export interface LibraryItemsListResponse {
  items: LibraryItem[]
  total: number
}

// Import template-specific types
export type {
  Action,
  Trait,
  Spell,
  SpellSlot,
  CustomCounter,
  Proficiency,
  Skill,
  InventoryItem,
  StatBlockData,
  CharacterData,
  ItemData,
} from './item.DND_5E.types'

// Universal data types (not template-specific)

export interface NoteChapter{
  id?: string
  order: number
  title: string
  content: string
}

export interface NoteData {
  content: string
  chapters?: NoteChapter[]
  isPinned?: boolean
  [key: string]: any
}






