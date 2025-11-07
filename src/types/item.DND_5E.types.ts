// D&D 5E Specific Types

export interface Action {
  name: string
  actionType: 'action' | 'bonus' | 'reaction' | 'legendary'
  roll?: string
  range?: string
  description: string
}

export interface Trait {
  name: string
  description: string
}

export interface Spell {
  name: string
  level: number // 0 for cantrips, 1-9 for spell levels
  school?: string
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  description: string
  concentration?: boolean
  ritual?: boolean
}

export interface SpellSlot {
  level: number // 1-9
  max: number
  remaining: number
}

export interface Proficiency {
  name: string
  type: 'armor' | 'weapon' | 'tool' | 'language' | 'saving_throw' | 'other'
}

export interface Skill {
  name: string
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  proficient: boolean
  expertise?: boolean
  bonus?: number
}

export interface CharacterItem {
  title: string
  description?: string
  uses?: number
  gold?: string
}

// Stat Block Data for D&D 5E creatures/NPCs
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
  actions?: Action[]
  traits?: Trait[]
  spells?: Spell[]
  spellSlots?: SpellSlot[]
  [key: string]: any
}

// Character Data - extends StatBlockData but replaces CR with level
export interface CharacterData extends Omit<StatBlockData, 'cr'> {
  level: number // Replaces CR for characters
  class: string
  race: string
  subclass?: string
  background?: string
  playerName?: string
  experience?: number
  maxHp?: number // Additional field for characters
  items?: CharacterItem[]
  proficiencyBonus?: number
  inspiration?: boolean
  proficiencies?: Proficiency[]
  skills?: Skill[]
  [key: string]: any
}

// Magic Item Data for D&D 5E
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

