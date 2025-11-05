export type ItemType = 'STAT_BLOCK_DND_5E' | 'NOTE' | 'ITEM_DND_5E' | 'CHARACTER_DND_5E'

export interface Tag {
  id: number
  name: string
  color: string
  libraryId: number
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
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

export interface CreateItemPayload {
  type: ItemType
  name: string
  description?: string
  data: Record<string, any>
  tagIds?: number[]
}

export interface UpdateItemPayload {
  name?: string
  description?: string
  data?: Record<string, any>
  tagIds?: number[]
}

// Specific data types
export interface StatBlockData {
  cr: string
  hp: number
  ac: number
  speed: string
  str?: number
  dex?: number
  con?: number
  int?: number
  wis?: number
  cha?: number
  size?: string
  type?: string
  alignment?: string
  languages?: string
  senses?: string
  actions?: Array<{
    name: string
    roll?: string
    range?: string
    description: string
  }>
  traits?: Array<{
    name: string
    description: string
  }>
  legendaryActions?: Array<{
    name: string
    description: string
  }>
  [key: string]: any
}

export interface NoteData {
  content: string
  format?: 'markdown' | 'html' | 'plain'
  isPinned?: boolean
  category?: string
  [key: string]: any
}

export interface ItemData {
  rarity: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact'
  itemType: string
  attunement?: boolean
  value?: string
  weight?: number
  damage?: string
  properties?: string[]
  effect?: string
  [key: string]: any
}

export interface CharacterData {
  level: number
  class: string
  race: string
  subclass?: string
  background?: string
  playerName?: string
  str?: number
  dex?: number
  con?: number
  int?: number
  wis?: number
  cha?: number
  hp?: number
  maxHp?: number
  ac?: number
  speed?: string
  equipment?: Array<Record<string, any>>
  spells?: Array<Record<string, any>>
  features?: Array<Record<string, any>>
  [key: string]: any
}





