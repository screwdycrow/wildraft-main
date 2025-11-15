import { Component, defineAsyncComponent } from 'vue'
import type { ItemType, LibraryItem } from '@/types/item.types'
import type { Combatant } from '@/types/combat.types'
import { itemTypeJsonSchemas as importedJsonSchemas, type JsonImportSchema as ImportedJsonImportSchema } from '@/config/jsonImportSchemas'

// Component type definitions
export type ComponentType = 'card' | 'detail' | 'form' | 'quickView' | 'combatantListItem' | 'combatantDetail'

// Filter type definitions
export type FilterType = 'select' | 'multiselect' | 'range' | 'boolean' | 'search'

export interface FilterDefinition {
  key: string
  label: string
  type: FilterType
  dataPath: string // Path in item.data to get values (e.g., 'level', 'cr', 'rarity')
  options?: { label: string; value: any }[] // Static options (optional)
  min?: number
  max?: number
}

// Component registry mapping
const componentRegistry: Partial<Record<ItemType, Record<ComponentType, () => Promise<any>>>> = {
  // ===== DND 5E Template-Specific Components =====
  STAT_BLOCK_DND_5E: {
    card: () => import('@/components/items/dnd5e/stat-blocks/StatBlockCard.vue'),
    detail: () => import('@/components/items/dnd5e/stat-blocks/StatBlockDetail.vue'),
    form: () => import('@/components/items/dnd5e/stat-blocks/StatBlockForm.vue'),
    quickView: () => import('@/components/items/dnd5e/stat-blocks/StatBlockQuickView.vue'),
    combatantListItem: () => import('@/components/combat/combatants/StatBlockCombatantItem.vue'),
    combatantDetail: () => import('@/components/combat/combatantDetails/StatBlockCombatantDetail.vue'),
  },
  CHARACTER_DND_5E: {
    card: () => import('@/components/items/dnd5e/characters/CharacterCard.vue'),
    detail: () => import('@/components/items/dnd5e/characters/CharacterDetail.vue'),
    form: () => import('@/components/items/dnd5e/characters/CharacterForm.vue'),
    quickView: () => import('@/components/items/dnd5e/characters/CharacterCard.vue'),
    combatantListItem: () => import('@/components/combat/combatants/CharacterCombatantItem.vue'),
    combatantDetail: () => import('@/components/combat/combatantDetails/CharacterCombatantDetail.vue'),
  },
  ITEM_DND_5E: {
    card: () => import('@/components/items/dnd5e/items/MagicItemCard.vue'),
    detail: () => import('@/components/items/dnd5e/items/MagicItemDetail.vue'),
    form: () => import('@/components/items/dnd5e/items/MagicItemForm.vue'),
    quickView: () => import('@/components/items/dnd5e/items/MagicItemCard.vue'),
    combatantListItem: () => import('@/components/combat/combatants/GenericCombatantItem.vue'),
  },

  // ===== Universal Components (Template-Independent) =====
  NOTE: {
    card: () => import('@/components/items/universal/notes/NoteCard.vue'),
    detail: () => import('@/components/items/universal/notes/NoteDetail.vue'),
    form: () => import('@/components/items/universal/notes/NoteForm.vue'),
    quickView: () => import('@/components/items/universal/notes/NoteCard.vue'),
    combatantListItem: () => import('@/components/combat/combatants/GenericCombatantItem.vue'),
  },
}

// Fallback components for unknown types
const fallbackComponents: Record<ComponentType, () => Promise<any>> = {
  card: () => import('@/components/items/common/GenericItemCard.vue'),
  detail: () => import('@/components/items/common/GenericItemDetail.vue'),
  form: () => import('@/components/items/common/GenericItemForm.vue'),
  quickView: () => import('@/components/items/common/GenericItemCard.vue'),
  combatantListItem: () => import('@/components/combat/combatants/GenericCombatantItem.vue'),
  combatantDetail: null as any, // Will use item's detail component as fallback
}

// Item type metadata
interface ItemTypeInfo {
  icon: string
  color: string
  label: string
  template?: string // undefined for universal types
}

const itemTypeMetadata: Record<ItemType, ItemTypeInfo> = {
  // DND 5E
  STAT_BLOCK_DND_5E: { 
    icon: 'mdi-sword-cross', 
    color: '#E74C3C', 
    label: 'Stat Block',
    template: 'DND_5E'
  },
  CHARACTER_DND_5E: { 
    icon: 'mdi-account-multiple', 
    color: '#3498DB', 
    label: 'Character',
    template: 'DND_5E'
  },
  ITEM_DND_5E: { 
    icon: 'mdi-treasure-chest', 
    color: '#F39C12', 
    label: 'Magic Item',
    template: 'DND_5E'
  },

  // Universal
  NOTE: { 
    icon: 'mdi-note-text', 
    color: '#95A5A6', 
    label: 'Note',
    // No template - works everywhere
  },
}

// JSON Import schemas for each item type (kept for backward compatibility, prefer imported version)
const itemTypeJsonSchemas: Partial<Record<ItemType, ImportedJsonImportSchema>> = {
  // DND 5E Character
  CHARACTER_DND_5E: {
    title: 'D&D 5E Character',
    description: 'Import a D&D 5E character with stats, skills, spells, and equipment',
    schema: {
      name: 'string (required) - Character name',
      level: 'number (required, 1-20) - Character level',
      class: 'string (required) - Character class',
      race: 'string (required) - Character race',
      subclass: 'string (optional) - Character subclass',
      background: 'string (optional) - Character background',
      alignment: 'string (optional) - Character alignment',
      experience: 'number (optional) - Experience points',
      hp: 'number (optional) - Current hit points',
      maxHp: 'number (optional) - Maximum hit points',
      ac: 'number (optional) - Armor class',
      speed: 'string (optional) - Movement speed (e.g., "30 ft")',
      initiative: 'number (optional) - Initiative modifier',
      resistances: 'string (optional) - Damage resistances',
      immunities: 'string (optional) - Damage immunities',
      // Ability Scores
      str: 'number (optional, 1-20) - Strength score',
      dex: 'number (optional, 1-20) - Dexterity score',
      con: 'number (optional, 1-20) - Constitution score',
      int: 'number (optional, 1-20) - Intelligence score',
      wis: 'number (optional, 1-20) - Wisdom score',
      cha: 'number (optional, 1-20) - Charisma score',
      // Saving Throws (boolean flags)
      strSavingThrow: 'boolean (optional) - Proficiency in Strength saves',
      dexSavingThrow: 'boolean (optional) - Proficiency in Dexterity saves',
      conSavingThrow: 'boolean (optional) - Proficiency in Constitution saves',
      intSavingThrow: 'boolean (optional) - Proficiency in Intelligence saves',
      wisSavingThrow: 'boolean (optional) - Proficiency in Wisdom saves',
      chaSavingThrow: 'boolean (optional) - Proficiency in Charisma saves',
      // Skills (array of skill objects)
      skills: 'array (optional) - Character skills',
      'skills[].name': 'string - Skill name (e.g., "Athletics", "Stealth", "Perception")',
      'skills[].ability': 'string (required) - Ability score: str, dex, con, int, wis, or cha',
      'skills[].proficient': 'boolean (required) - Has proficiency in this skill',
      'skills[].expertise': 'boolean (optional) - Has expertise in this skill (double proficiency)',
      'skills[].bonus': 'number (optional) - Additional bonus modifier',
      // Proficiencies (array)
      proficiencies: 'array (optional) - Other proficiencies',
      'proficiencies[].name': 'string - Proficiency name',
      'proficiencies[].type': 'string - Type: armor, weapon, tool, language, saving_throw, or other',
      // Traits & Features (array)
      traits: 'array (optional) - Racial/class features',
      'traits[].name': 'string - Feature name',
      'traits[].description': 'string - Feature description',
      // Actions (array)
      actions: 'array (optional) - Combat actions',
      'actions[].name': 'string (required) - Action name',
      'actions[].actionType': 'string (required) - Type: action, bonus, reaction, or legendary',
      'actions[].description': 'string (required) - Action description',
      'actions[].roll': 'string (optional) - Damage/healing roll ONLY. Format: "1d6 fire", "2d8+3 slashing", "1d4+1 healing". Do NOT include to-hit or DC here.',
      'actions[].toHit': 'string (optional) - Attack bonus ONLY. Format: "+5", "+3", "-1". Only for attacks that require an attack roll.',
      'actions[].dc': 'string (optional) - Saving throw DC ONLY. Format: "15 DEX", "18 CON", "12 WIS". Only for actions requiring a saving throw.',
      'actions[].range': 'string (optional) - Attack range (e.g., "5 ft", "30/120 ft", "60 ft")',
      // Spells
      spellSlots: 'array (optional) - Spell slots by level',
      'spellSlots[].level': 'number (1-9) - Spell level',
      'spellSlots[].max': 'number - Maximum slots',
      'spellSlots[].remaining': 'number - Remaining slots',
      customCounters: 'array (optional) - Custom counters for tracking resources',
      'customCounters[].name': 'string - Counter name',
      'customCounters[].value': 'number - Current value',
      'customCounters[].min': 'number (optional) - Minimum value',
      'customCounters[].max': 'number (optional) - Maximum value',
      'customCounters[].icon': 'string (optional) - Material Design Icon name (mdi-*)',
      'customCounters[].color': 'string (optional) - Hex or theme color name',
      'customCounters[].description': 'string (optional) - Helper text',
      spells: 'array (optional) - Known spells',
      'spells[].name': 'string (required) - Spell name',
      'spells[].level': 'number (required, 0-9) - Spell level (0 for cantrips)',
      'spells[].description': 'string (required) - Spell description',
      'spells[].school': 'string (optional) - Spell school',
      'spells[].castingTime': 'string (optional) - Casting time',
      'spells[].range': 'string (optional) - Spell range',
      'spells[].components': 'string (optional) - Spell components',
      'spells[].roll': 'string (optional) - Damage/healing roll ONLY. Format: "1d6 fire", "2d8+3 cold", "1d4+1 healing". Do NOT include to-hit or DC here.',
      'spells[].toHit': 'string (optional) - Spell attack bonus ONLY. Format: "+5", "+3". Only for spells that make attack rolls (like Fire Bolt).',
      'spells[].dc': 'string (optional) - Spell save DC ONLY. Format: "15 DEX", "18 CON", "12 WIS". Only for spells requiring a saving throw.',
      'spells[].duration': 'string (optional) - Spell duration',
      'spells[].concentration': 'boolean (optional) - Requires concentration',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual',
      // Character-specific fields
      proficiencyBonus: 'number (optional) - Proficiency bonus (usually calculated from level)',
      inspiration: 'boolean (optional) - Has inspiration',
      // Equipment
      gold: 'number (optional) - Gold pieces',
      inventory: 'array (optional) - Inventory items',
      'inventory[].name': 'string - Item name',
      'inventory[].description': 'string (optional) - Item description',
      'inventory[].quantity': 'number (optional) - Quantity',
      'inventory[].weight': 'number (optional) - Weight in lbs',
      'inventory[].equipped': 'boolean (optional) - Is equipped',
      // Notes
      quickNotes: 'string (optional) - Quick notes'
    },
    example: JSON.stringify({
      name: "Elara Moonwhisper",
      level: 5,
      class: "Druid",
      race: "Wood Elf",
      subclass: "Circle of the Moon",
      background: "Hermit",
      alignment: "Neutral Good",
      experience: 6500,
      hp: 38,
      maxHp: 38,
      ac: 14,
      speed: "30 ft",
      initiative: 2,
      resistances: "fire",
      immunities: "",
      str: 14,
      dex: 16,
      con: 16,
      int: 10,
      wis: 18,
      cha: 12,
      strSavingThrow: false,
      dexSavingThrow: false,
      conSavingThrow: true,
      intSavingThrow: false,
      wisSavingThrow: true,
      chaSavingThrow: false,
      skills: [
        { name: "Animal Handling", ability: "wis", proficient: true },
        { name: "Medicine", ability: "wis", proficient: true },
        { name: "Nature", ability: "int", proficient: true },
        { name: "Perception", ability: "wis", proficient: false },
        { name: "Religion", ability: "int", proficient: false },
        { name: "Survival", ability: "wis", proficient: true }
      ],
      traits: [
        { name: "Fey Ancestry", description: "Advantage on saves vs. charm, immune to sleep" }
      ],
      actions: [
        { name: "Staff", actionType: "action", toHit: "+4", roll: "1d6+2 bludgeoning", range: "5 ft", description: "Quarterstaff swing" },
        { name: "Fire Breath", actionType: "action", dc: "15 DEX", roll: "2d6 fire", range: "15 ft cone", description: "Breathes fire in a cone" },
        { name: "Healing Word", actionType: "bonus", roll: "1d4+2 healing", range: "60 ft", description: "Heal an ally" }
      ],
      spellSlots: [
        { level: 1, max: 4, remaining: 4 },
        { level: 2, max: 3, remaining: 3 },
        { level: 3, max: 2, remaining: 2 }
      ],
      customCounters: [
        { name: "Wild Shape", value: 2, min: 0, max: 2, icon: "mdi-paw", description: "Uses per short rest" },
        { name: "Starry Form", value: 1, min: 0, max: 1, icon: "mdi-star-circle" }
      ],
      spells: [
        { name: "Druidcraft", level: 0, school: "Transmutation", castingTime: "1 action", range: "30 ft", components: "V, S", duration: "Instantaneous", description: "Small nature trick" },
        { name: "Entangle", level: 1, school: "Conjuration", castingTime: "1 action", range: "90 ft", components: "V, S", duration: "Concentration, 1 minute", concentration: true, dc: "14 STR", description: "Grasping vines restrain targets" },
        { name: "Fire Bolt", level: 0, school: "Evocation", castingTime: "1 action", range: "120 ft", components: "V, S", toHit: "+5", roll: "1d10 fire", description: "Ranged spell attack" },
        { name: "Cure Wounds", level: 1, school: "Evocation", castingTime: "1 action", range: "Touch", components: "V, S", roll: "1d8+3 healing", description: "Heal a creature" }
      ],
      gold: 125,
      inventory: [
        { name: "Quarterstaff", description: "Wooden staff", quantity: 1, weight: 4, equipped: true },
        { name: "Leather Armor", description: "Basic leather armor", quantity: 1, weight: 10, equipped: true },
        { name: "Explorer's Pack", description: "Standard adventuring gear", quantity: 1, weight: 59 },
        { name: "Druidic Focus", description: "Sprig of mistletoe", quantity: 1, weight: 0 }
      ],
      quickNotes: "Circle of the Moon druid focused on wild shape combat"
    }, null, 2)
  },

  // DND 5E Stat Block (Monster/NPC)
  STAT_BLOCK_DND_5E: {
    title: 'D&D 5E Stat Block',
    description: 'Import a D&D 5E creature stat block (monster, NPC, etc.)',
    schema: {
      name: 'string (required) - Creature name',
      cr: 'string (required) - Challenge Rating (e.g., "1/2", "5", "15")',
      hp: 'number (required) - Hit points',
      ac: 'number (required) - Armor class',
      speed: 'string (required) - Movement speed (e.g., "30 ft, fly 60 ft")',
      initiative: 'number (optional) - Initiative modifier',
      resistances: 'string (optional) - Damage resistances',
      immunities: 'string (optional) - Damage immunities',
      // Basic Info
      size: 'string (optional) - Size category (Tiny, Small, Medium, Large, Huge, Gargantuan)',
      type: 'string (optional) - Creature type (e.g., humanoid, beast, dragon)',
      alignment: 'string (optional) - Alignment',
      senses: 'string (optional) - Special senses (e.g., "darkvision 60 ft")',
      languages: 'string (optional) - Languages spoken',
      // Ability Scores
      str: 'number (optional, 1-30) - Strength score',
      dex: 'number (optional, 1-30) - Dexterity score',
      con: 'number (optional, 1-30) - Constitution score',
      int: 'number (optional, 1-30) - Intelligence score',
      wis: 'number (optional, 1-30) - Wisdom score',
      cha: 'number (optional, 1-30) - Charisma score',
      // Saving Throws (boolean flags for proficiency)
      strSavingThrow: 'boolean (optional) - Proficient in Strength saves',
      dexSavingThrow: 'boolean (optional) - Proficient in Dexterity saves',
      conSavingThrow: 'boolean (optional) - Proficient in Constitution saves',
      intSavingThrow: 'boolean (optional) - Proficient in Intelligence saves',
      wisSavingThrow: 'boolean (optional) - Proficient in Wisdom saves',
      chaSavingThrow: 'boolean (optional) - Proficient in Charisma saves',
      // Traits & Abilities (array)
      traits: 'array (optional) - Special traits and abilities',
      'traits[].name': 'string - Trait name',
      'traits[].description': 'string - Trait description',
      // Actions (array)
      actions: 'array (optional) - Combat actions',
      'actions[].name': 'string (required) - Action name',
      'actions[].actionType': 'string (required) - Type: action, bonus, reaction, or legendary',
      'actions[].description': 'string (required) - Action description',
      'actions[].roll': 'string (optional) - Damage/healing roll ONLY. Format: "1d6 fire", "2d8+3 slashing", "1d4+1 healing". Do NOT include to-hit or DC here.',
      'actions[].toHit': 'string (optional) - Attack bonus ONLY. Format: "+5", "+3", "-1". Only for attacks that require an attack roll.',
      'actions[].dc': 'string (optional) - Saving throw DC ONLY. Format: "15 DEX", "18 CON", "12 WIS". Only for actions requiring a saving throw.',
      'actions[].range': 'string (optional) - Attack range (e.g., "5 ft", "30/120 ft", "60 ft")',
      customCounters: 'array (optional) - Custom counters for recharge abilities or limited uses',
      'customCounters[].name': 'string - Counter name',
      'customCounters[].value': 'number - Current value',
      'customCounters[].min': 'number (optional) - Minimum value',
      'customCounters[].max': 'number (optional) - Maximum value',
      'customCounters[].icon': 'string (optional) - Material Design Icon name (mdi-*)',
      'customCounters[].color': 'string (optional) - Hex or theme color name',
      'customCounters[].description': 'string (optional) - Helper text',
      // Spells (array)
      spells: 'array (optional) - Spells the creature can cast',
      'spells[].name': 'string - Spell name',
      'spells[].level': 'number (0-9) - Spell level (0 for cantrips)',
      'spells[].school': 'string (optional) - Spell school',
      'spells[].castingTime': 'string (optional) - Casting time',
      'spells[].range': 'string (optional) - Spell range',
      'spells[].components': 'string (optional) - Spell components',
      'spells[].roll': 'string (optional) - Damage/healing roll ONLY. Format: "1d6 fire", "2d8+3 cold", "1d4+1 healing". Do NOT include to-hit or DC here.',
      'spells[].toHit': 'string (optional) - Spell attack bonus ONLY. Format: "+5", "+3". Only for spells that make attack rolls (like Fire Bolt).',
      'spells[].dc': 'string (optional) - Spell save DC ONLY. Format: "15 DEX", "18 CON", "12 WIS". Only for spells requiring a saving throw.',
      'spells[].duration': 'string (optional) - Spell duration',
      'spells[].concentration': 'boolean (optional) - Requires concentration',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual',
      'spells[].description': 'string (required) - Spell description'
    },
    example: JSON.stringify({
      name: "Ancient Red Dragon",
      cr: "24",
      hp: 546,
      ac: 22,
      speed: "40 ft, climb 40 ft, fly 80 ft",
      initiative: 0,
      resistances: "fire",
      immunities: "",
      size: "Gargantuan",
      type: "dragon",
      alignment: "Chaotic Evil",
      senses: "blindsight 60 ft, darkvision 120 ft",
      languages: "Common, Draconic",
      str: 30,
      dex: 10,
      con: 29,
      int: 18,
      wis: 15,
      cha: 23,
      strSavingThrow: true,
      dexSavingThrow: false,
      conSavingThrow: true,
      intSavingThrow: false,
      wisSavingThrow: true,
      chaSavingThrow: true,
      traits: [
        {
          name: "Legendary Resistance (3/Day)",
          description: "If the dragon fails a saving throw, it can choose to succeed instead."
        }
      ],
      actions: [
        {
          name: "Multiattack",
          actionType: "action",
          description: "One bite and two claws."
        },
        {
          name: "Bite",
          actionType: "action",
          toHit: "+17",
          roll: "2d10+10 piercing, 4d6 fire",
          range: "10 ft",
          description: "Bite with flame"
        },
        {
          name: "Fire Breath",
          actionType: "action",
          dc: "24 DEX",
          roll: "26d6 fire",
          range: "60 ft cone",
          description: "Breathes fire in a cone. Recharge 5-6."
        }
      ],
      spells: [
        {
          name: "Detect Magic",
          level: 1,
          school: "Divination",
          castingTime: "1 action",
          range: "Self",
          components: "V, S",
          duration: "Concentration, 10 minutes",
          concentration: true,
          description: "Sense nearby magic"
        },
        {
          name: "Fireball",
          level: 3,
          school: "Evocation",
          castingTime: "1 action",
          range: "150 ft",
          components: "V, S, M",
          dc: "18 DEX",
          roll: "8d6 fire",
          duration: "Instantaneous",
          description: "Explosion of fire in a 20-foot radius"
        }
      ],
      customCounters: [
        { name: "Legendary Resistance", value: 3, min: 0, max: 3, icon: "mdi-shield-star", description: "Uses per day" },
        { name: "Fire Breath Recharge", value: 0, min: 0, max: 1, icon: "mdi-fire", color: "#E74C3C" }
      ]
    }, null, 2)
  },

  // DND 5E Magic Item
  ITEM_DND_5E: {
    title: 'D&D 5E Magic Item',
    description: 'Import a D&D 5E magic item with properties and effects',
    schema: {
      name: 'string (required) - Item name',
      rarity: 'string (required) - Rarity: common, uncommon, rare, very rare, legendary, artifact',
      itemType: 'string (required) - Item type (e.g., Weapon, Armor, Wondrous Item, Potion)',
      attunement: 'boolean (optional) - Requires attunement',
      value: 'string (optional) - Monetary value (e.g., "500 gp")',
      weight: 'number (optional) - Weight in pounds',
      damage: 'string (optional) - Damage dice (e.g., "1d8")',
      properties: 'array (optional) - Item properties (e.g., ["Finesse", "Light", "Thrown"])',
      effect: 'string (optional) - Special effects or abilities'
    },
    example: JSON.stringify({
      name: "Flame Tongue",
      rarity: "rare",
      itemType: "Weapon",
      attunement: true,
      value: "5000 gp",
      weight: 3,
      damage: "1d8 slashing",
      properties: ["Finesse", "Light"],
      effect: "While attuned to this sword, you gain +1 to attack and damage rolls. The sword sheds bright light in a 40-foot radius and dim light for another 40 feet. When you hit with it, the target takes an extra 2d6 fire damage."
    }, null, 2)
  },

  // Universal Note
  NOTE: {
    title: 'Note',
    description: 'Import a note with optional chapters and content',
    schema: {
      name: 'string (required) - Note title',
      content: 'string (required) - Main note content (supports rich text/markdown)',
      chapters: 'array (optional) - Additional chapters',
      'chapters[].order': 'number - Chapter order (auto-assigned if not provided)',
      'chapters[].title': 'string - Chapter title',
      'chapters[].content': 'string - Chapter content (supports rich text/markdown)',
      isPinned: 'boolean (optional) - Whether the note is pinned'
    },
    example: JSON.stringify({
      name: "Campaign Session Notes",
      content: "<p>This session covered the party's journey through the Whispering Woods...</p>",
      isPinned: false,
      chapters: [
        {
          order: 1,
          title: "Travel Encounters",
          content: "<p>The party encountered a group of bandits at the crossroads...</p>"
        },
        {
          order: 2,
          title: "Dungeon Exploration",
          content: "<p>Upon entering the ancient ruins, the party found...</p>"
        }
      ]
    }, null, 2)
  }
}

// Re-export JsonImportSchema type (prefer imported version from config)
export type { ImportedJsonImportSchema as JsonImportSchema }

// Item to Combatant converter function type
export type ItemToCombatantConverter = (
  libraryItem: LibraryItem,
  combatantId: string,
  customName?: string
) => Omit<Combatant, 'id'> & { id?: string }

// Item to Combatant converter functions (from existing code in useCombat)
const itemToCombatantConverters: Partial<Record<ItemType, ItemToCombatantConverter>> = {
  STAT_BLOCK_DND_5E: (libraryItem, combatantId, customName) => {
    const data = libraryItem.data as any
    return {
      id: combatantId,
      name: customName || libraryItem.name,
      initiative: 0,
      hp: typeof data.hp === 'number' ? data.hp : parseInt(data.hp) || 10,
      maxHp: typeof data.hp === 'number' ? data.hp : parseInt(data.hp) || 10,
      ac: typeof data.ac === 'number' ? data.ac : parseInt(data.ac) || 10,
      conditions: [],
      notes: '',
      isPlayer: false,
      libraryItemId: libraryItem.id,
      actions: data.actions || [],
      customCounters: data.customCounters || [],
    }
  },

  CHARACTER_DND_5E: (libraryItem, combatantId, customName) => {
    const data = libraryItem.data as any
    const hp = data.hp || data.maxHp || data.stats?.hp || data.stats?.maxHp || 10
    const maxHp = data.maxHp || data.hp || data.stats?.maxHp || data.stats?.hp || 10
    const ac = data.ac || data.stats?.ac || 10
    
    return {
      id: combatantId,
      name: customName || libraryItem.name,
      initiative: 0,
      hp: typeof hp === 'number' ? hp : parseInt(hp) || 10,
      maxHp: typeof maxHp === 'number' ? maxHp : parseInt(maxHp) || 10,
      ac: typeof ac === 'number' ? ac : parseInt(ac) || 10,
      conditions: [],
      notes: '',
      isPlayer: true,
      libraryItemId: libraryItem.id,
      actions: data.actions || [],
      customCounters: data.customCounters || [],
    }
  },

  ITEM_DND_5E: (libraryItem, combatantId, customName) => {
    return {
      id: combatantId,
      name: customName || libraryItem.name,
      initiative: 0,
      hp: 0,
      maxHp: 0,
      ac: 0,
      conditions: [],
      notes: '',
      isPlayer: false,
      libraryItemId: libraryItem.id,
    }
  },

  NOTE: (libraryItem, combatantId, customName) => {
    return {
      id: combatantId,
      name: customName || libraryItem.name,
      initiative: 0,
      hp: 0,
      maxHp: 0,
      ac: 0,
      conditions: [],
      notes: '',
      isPlayer: false,
      libraryItemId: libraryItem.id,
    }
  },
}

// Generic fallback converter
function genericItemToCombatantConverter(
  libraryItem: LibraryItem,
  combatantId: string,
  customName?: string
): Omit<Combatant, 'id'> & { id?: string } {
  const data = libraryItem.data as any
  
  let hp = 0
  let maxHp = 0
  let ac = 10
  
  if (data.hp !== undefined) {
    hp = typeof data.hp === 'number' ? data.hp : parseInt(data.hp) || 0
    maxHp = hp
  }
  if (data.maxHp !== undefined) {
    maxHp = typeof data.maxHp === 'number' ? data.maxHp : parseInt(data.maxHp) || 0
    hp = hp || maxHp
  }
  if (data.ac !== undefined) {
    ac = typeof data.ac === 'number' ? data.ac : parseInt(data.ac) || 10
  }
  
  if (data.stats) {
    if (data.stats.hp !== undefined) {
      hp = data.stats.hp
      maxHp = data.stats.hp
    }
    if (data.stats.maxHp !== undefined) {
      maxHp = data.stats.maxHp
      hp = hp || maxHp
    }
    if (data.stats.ac !== undefined) {
      ac = data.stats.ac
    }
  }
  
  return {
    id: combatantId,
    name: customName || libraryItem.name,
    initiative: 0,
    hp: hp,
    maxHp: maxHp,
    ac: ac,
    conditions: [],
    notes: '',
    isPlayer: false,
    libraryItemId: libraryItem.id,
    customCounters: data.customCounters || [],
  }
}

// Filter definitions per item type
const itemTypeFilters: Partial<Record<ItemType, FilterDefinition[]>> = {
  // DND 5E Stat Blocks
  STAT_BLOCK_DND_5E: [
    {
      key: 'cr',
      label: 'Challenge Rating',
      type: 'select',
      dataPath: 'cr',
    },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      dataPath: 'size',
      options: [
        { label: 'Tiny', value: 'Tiny' },
        { label: 'Small', value: 'Small' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Large', value: 'Large' },
        { label: 'Huge', value: 'Huge' },
        { label: 'Gargantuan', value: 'Gargantuan' },
      ],
    },
    {
      key: 'type',
      label: 'Creature Type',
      type: 'select',
      dataPath: 'type',
    },
    {
      key: 'alignment',
      label: 'Alignment',
      type: 'select',
      dataPath: 'alignment',
    },
  ],

  // DND 5E Characters
  CHARACTER_DND_5E: [
    {
      key: 'level',
      label: 'Level',
      type: 'range',
      dataPath: 'level',
      min: 1,
      max: 20,
    },
    {
      key: 'class',
      label: 'Class',
      type: 'select',
      dataPath: 'class',
    },
    {
      key: 'race',
      label: 'Race',
      type: 'select',
      dataPath: 'race',
    },
    {
      key: 'subclass',
      label: 'Subclass',
      type: 'select',
      dataPath: 'subclass',
    },
  ],

  // DND 5E Magic Items
  ITEM_DND_5E: [
    {
      key: 'rarity',
      label: 'Rarity',
      type: 'select',
      dataPath: 'rarity',
      options: [
        { label: 'Common', value: 'common' },
        { label: 'Uncommon', value: 'uncommon' },
        { label: 'Rare', value: 'rare' },
        { label: 'Very Rare', value: 'very rare' },
        { label: 'Legendary', value: 'legendary' },
        { label: 'Artifact', value: 'artifact' },
      ],
    },
    {
      key: 'itemType',
      label: 'Item Type',
      type: 'select',
      dataPath: 'itemType',
    },
    {
      key: 'attunement',
      label: 'Requires Attunement',
      type: 'boolean',
      dataPath: 'attunement',
    },
  ],

  // Universal Notes
  NOTE: [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      dataPath: 'category',
    },
    {
      key: 'isPinned',
      label: 'Pinned Only',
      type: 'boolean',
      dataPath: 'isPinned',
    },
  ],
}

export function useItemComponents() {
  /**
   * Get the appropriate component for an item type
   */
  function getItemComponent(itemType: ItemType, componentType: ComponentType): Component {
    const registry = componentRegistry[itemType]
    
    if (registry && registry[componentType]) {
      return defineAsyncComponent({
        loader: registry[componentType],
        loadingComponent: () => import('@/components/common/LoadingSpinner.vue'),
        errorComponent: () => import('@/components/items/common/ItemNotFound.vue'),
        delay: 200,
        timeout: 3000,
      })
    }
    
    // Fallback to generic component
    console.warn(`Component not found for ${itemType}:${componentType}, using fallback`)
    return defineAsyncComponent(fallbackComponents[componentType])
  }

  /**
   * Check if a specific component exists for an item type
   */
  function hasItemComponent(itemType: ItemType, componentType: ComponentType): boolean {
    return !!(componentRegistry[itemType]?.[componentType])
  }

  /**
   * Get item type metadata (icon, color, label, template)
   */
  function getItemTypeInfo(itemType: ItemType): ItemTypeInfo {
    return itemTypeMetadata[itemType] || { 
      icon: 'mdi-file', 
      color: '#7F8C8D', 
      label: 'Unknown Item' 
    }
  }

  /**
   * Get all available item types for a template
   */
  function getItemTypesForTemplate(template: string): ItemType[] {
    return Object.entries(itemTypeMetadata)
      .filter(([_, info]) => info.template === template)
      .map(([type]) => type as ItemType)
  }

  /**
   * Get all universal item types (template-independent)
   */
  function getUniversalItemTypes(): ItemType[] {
    return Object.entries(itemTypeMetadata)
      .filter(([_, info]) => !info.template)
      .map(([type]) => type as ItemType)
  }

  /**
   * Check if an item type is universal (works across all templates)
   */
  function isUniversalType(itemType: ItemType): boolean {
    return !itemTypeMetadata[itemType]?.template
  }

  /**
   * Get filter definitions for an item type
   */
  function getFilterDefinitions(itemType: ItemType): FilterDefinition[] {
    return itemTypeFilters[itemType] || []
  }

  /**
   * Get JSON import schema for an item type
   * Uses imported schemas from config file
   */
  function getJsonImportSchema(itemType: ItemType): ImportedJsonImportSchema | null {
    return importedJsonSchemas[itemType] || itemTypeJsonSchemas[itemType] || null
  }

  /**
   * Get combatant list item component for an item type
   * Returns null if no specific component exists (caller should use fallback)
   */
  function getCombatantComponent(itemType: ItemType): Component | null {
    const registry = componentRegistry[itemType]
    
    if (registry && registry.combatantListItem) {
      return defineAsyncComponent({
        loader: registry.combatantListItem,
        delay: 200,
        timeout: 3000,
      })
    }
    
    return null
  }

  /**
   * Get combatant detail component for an item type
   * If no combatant-specific detail exists, falls back to the item's detail component
   * Returns null if neither exists
   */
  function getCombatantDetailComponent(itemType: ItemType): Component | null {
    const registry = componentRegistry[itemType]
    
    // First try combatantDetail
    if (registry && registry.combatantDetail) {
      return defineAsyncComponent({
        loader: registry.combatantDetail,
        delay: 200,
        timeout: 3000,
      })
    }
    
    // Fallback to item's detail component
    if (registry && registry.detail) {
      return defineAsyncComponent({
        loader: registry.detail,
        delay: 200,
        timeout: 3000,
      })
    }
    
    return null
  }

  /**
   * Get the item-to-combatant converter function for an item type
   * Returns the type-specific converter or the generic fallback
   */
  function getItemToCombatantConverter(itemType: ItemType): ItemToCombatantConverter {
    return itemToCombatantConverters[itemType] || genericItemToCombatantConverter
  }

  /**
   * Convert a library item to a combatant object
   * Uses type-specific converter if available, otherwise generic converter
   */
  function convertItemToCombatant(
    libraryItem: LibraryItem,
    combatantId: string,
    customName?: string
  ): Omit<Combatant, 'id'> & { id?: string } {
    const converter = getItemToCombatantConverter(libraryItem.type)
    return converter(libraryItem, combatantId, customName)
  }

  return {
    getItemComponent,
    hasItemComponent,
    getItemTypeInfo,
    getItemTypesForTemplate,
    getUniversalItemTypes,
    isUniversalType,
    getFilterDefinitions,
    getJsonImportSchema,
    getCombatantComponent,
    getCombatantDetailComponent,
    getItemToCombatantConverter,
    convertItemToCombatant,
  }
}

