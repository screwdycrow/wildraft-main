import type { Action, CustomCounter } from './item.types'

/**
 * Custom counter for tracking game mechanics
 * (e.g., Legendary Actions, Spell Slots, etc.)
 */
export interface CombatCounter extends CustomCounter {}
export interface CombatActions extends Action {}
/**
 * Combatant in a combat encounter
 */
export interface Combatant {
  id: string
  name: string
  initiative: number
  initiativeOrder?: number // For sorting/display
  hp: number
  currentHp?: number // Alias for hp
  maxHp: number
  ac: number
  actions?: CombatActions[]
  conditions: string[]
  notes?: string
  isPlayer: boolean
  libraryItemId?: number
  customCounters?: CombatCounter[] // Per-combatant counters
  featuredImageId?: number // UserFile ID for featured image
}

/**
 * Combat encounter
 */
export interface CombatEncounter {
  id: number
  libraryId: number
  name: string
  description?: string
  round: number
  initativeCount: number // Note: typo in backend API
  counters: CombatCounter[]
  combatants: Combatant[]
  portalViews: any[] // Portal view references
  createdAt: string
  updatedAt: string
}

/**
 * Request body for creating a combat encounter
 */
export interface CreateCombatEncounterRequest {
  name: string
  description?: string
  round?: number
  initativeCount?: number
  counters?: CombatCounter[]
  combatants?: Combatant[]
}

/**
 * Request body for updating a combat encounter
 */
export interface UpdateCombatEncounterRequest {
  name?: string
  description?: string
  round?: number
  initativeCount?: number
  counters?: CombatCounter[]
  combatants?: Combatant[]
}

/**
 * Common D&D 5E conditions
 */
export const DND_CONDITIONS = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
  'dead',
  'blessed',
  'hasted',
  'concentrating',
] as const

export type DndCondition = typeof DND_CONDITIONS[number]

