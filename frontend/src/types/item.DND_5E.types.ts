// D&D 5E Specific Types

export interface Action {
  name: string
  actionType: 'action' | 'bonus' | 'reaction' | 'legendary'
  roll?: string
  range?: string
  toHit?: string
  dc?: string
  description: string
}

// Item Action - extends Action with options to use character stats
export interface ItemAction extends Action {
  // If true, calculate toHit/damage using character stats instead of fixed values
  useCharacterStats?: boolean
  // Which ability to use for attack rolls and damage
  abilityModifier?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  // Magic item bonus (e.g., +1, +2, +3 weapons)
  itemBonus?: number
  // Just the damage dice without modifiers (e.g., "1d8", "2d6")
  damageDice?: string
  // Damage type (e.g., "slashing", "fire", "radiant")
  damageType?: string
  // Whether to add ability modifier to damage
  addAbilityToDamage?: boolean
  // Whether the character is proficient with this item (for attack rolls)
  proficient?: boolean
  // Source item name (for display in action list)
  sourceItem?: string
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
  roll?: string
  toHit?: string
  dc?: string
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

export interface CustomCounter {
  id?: string
  name: string
  value: number
  min?: number
  max?: number
  icon?: string
  color?: string
  description?: string
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

// Item Modifiers - applied when item is equipped
export interface ItemModifier {
  // Ability Score Modifiers
  str?: number
  dex?: number
  con?: number
  int?: number
  wis?: number
  cha?: number
  
  // Combat Modifiers
  ac?: number // Armor Class bonus
  maxHp?: number // Maximum HP bonus
  hp?: number // Current HP bonus (healing)
  speed?: number // Speed bonus in feet
  
  // Saving Throw Modifiers
  savingThrowBonus?: number // Bonus to all saving throws
  strSavingThrow?: number // Specific saving throw bonus
  dexSavingThrow?: number
  conSavingThrow?: number
  intSavingThrow?: number
  wisSavingThrow?: number
  chaSavingThrow?: number
  
  // Skill Modifiers
  skillBonus?: number // Bonus to all skills
  skillBonuses?: Record<string, number> // Specific skill bonuses (keyed by skill name)
  
  // Resistance & Immunity
  resistances?: string // Additional resistances (comma-separated)
  immunities?: string // Additional immunities (comma-separated)
  
  // Other Modifiers
  initiative?: number // Initiative bonus
  proficiencyBonus?: number // Proficiency bonus modifier
  
  // Custom modifiers (for extensibility)
  [key: string]: any
}

export interface InventoryItem {
  name: string
  description?: string
  quantity?: number
  weight?: number
  equipped?: boolean
  libraryItemId?: number // Reference to library item if added from library
  modifiers?: ItemModifier // Modifiers applied when equipped
  // Combat properties (for simple items without full actions)
  toHit?: string // Attack bonus (e.g., "+5", "+7")
  dc?: string // Save DC (e.g., "15", "DC 15 DEX")
  roll?: string // Damage/effect roll (e.g., "2d6+3", "1d8 fire")
  range?: string // Range (e.g., "60ft", "5ft melee")
  // Actions granted by the item (shown in character's action list when equipped)
  actions?: ItemAction[]
}

// Stat Block Data for D&D 5E creatures/NPCs
export interface StatBlockData {
  cr: string
  hp: number
  ac: number
  speed: string
  initiative?: number
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
  immunities?: string
  resistances?: string
  strSavingThrow?: boolean
  dexSavingThrow?: boolean
  conSavingThrow?: boolean
  intSavingThrow?: boolean
  wisSavingThrow?: boolean
  chaSavingThrow?: boolean
  actions?: Action[]
  traits?: Trait[]
  spells?: Spell[]
  spellSlots?: SpellSlot[]
  customCounters?: CustomCounter[]
  [key: string]: any
}

// Character Data - extends StatBlockData but replaces CR with level
export interface CharacterData extends Omit<StatBlockData, 'cr'> {
  level: number // Replaces CR for characters
  class: string
  race: string
  subclass?: string
  background?: string
  experience?: number
  maxHp?: number // Additional field for characters
  gold?: number // Gold/currency
  inventory?: InventoryItem[] // Inventory items
  quickNotes?: string // Quick editable notes
  proficiencyBonus?: number
  inspiration?: boolean
  proficiencies?: Proficiency[]
  skills?: Skill[]
  spellSlots?: SpellSlot[] // Spell slots with current/max
  customCounters?: CustomCounter[]
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
  modifiers?: ItemModifier // Modifiers applied when equipped
  // Combat properties (for simple items)
  toHit?: string // Attack bonus (e.g., "+5", "+7")
  dc?: string // Save DC (e.g., "15", "DC 15 DEX")
  roll?: string // Damage/effect roll (e.g., "2d6+3", "1d8 fire")
  range?: string // Range (e.g., "60ft", "5ft melee")
  // Actions granted by the item (shown in character's action list when equipped)
  actions?: ItemAction[]
  [key: string]: any
}

