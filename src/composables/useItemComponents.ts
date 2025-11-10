import { Component, defineAsyncComponent } from 'vue'
import type { ItemType } from '@/types/item.types'

// Component type definitions
export type ComponentType = 'card' | 'detail' | 'form' | 'quickView'

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
  },
  CHARACTER_DND_5E: {
    card: () => import('@/components/items/dnd5e/characters/CharacterCard.vue'),
    detail: () => import('@/components/items/dnd5e/characters/CharacterDetail.vue'),
    form: () => import('@/components/items/dnd5e/characters/CharacterForm.vue'),
    quickView: () => import('@/components/items/dnd5e/characters/CharacterCard.vue'),
  },
  ITEM_DND_5E: {
    card: () => import('@/components/items/dnd5e/items/MagicItemCard.vue'),
    detail: () => import('@/components/items/dnd5e/items/MagicItemDetail.vue'),
    form: () => import('@/components/items/dnd5e/items/MagicItemForm.vue'),
    quickView: () => import('@/components/items/dnd5e/items/MagicItemCard.vue'),
  },

  // ===== Universal Components (Template-Independent) =====
  NOTE: {
    card: () => import('@/components/items/universal/notes/NoteCard.vue'),
    detail: () => import('@/components/items/universal/notes/NoteDetail.vue'),
    form: () => import('@/components/items/universal/notes/NoteForm.vue'),
    quickView: () => import('@/components/items/universal/notes/NoteCard.vue'),
  },
}

// Fallback components for unknown types
const fallbackComponents: Record<ComponentType, () => Promise<any>> = {
  card: () => import('@/components/items/common/GenericItemCard.vue'),
  detail: () => import('@/components/items/common/GenericItemDetail.vue'),
  form: () => import('@/components/items/common/GenericItemForm.vue'),
  quickView: () => import('@/components/items/common/GenericItemCard.vue'),
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

// JSON Import schemas for each item type
export interface JsonImportSchema {
  title: string
  description: string
  schema: Record<string, any>
  example: string
}

const itemTypeJsonSchemas: Partial<Record<ItemType, JsonImportSchema>> = {
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
      'skills[].name': 'string - Skill name (e.g., "Athletics")',
      'skills[].proficient': 'boolean - Has proficiency in this skill',
      'skills[].expertise': 'boolean (optional) - Has expertise in this skill',
      // Proficiencies (array)
      proficiencies: 'array (optional) - Other proficiencies',
      'proficiencies[].name': 'string - Proficiency name',
      'proficiencies[].type': 'string - Type: armor, weapon, tool, language, other',
      // Traits & Features (array)
      traits: 'array (optional) - Racial/class features',
      'traits[].name': 'string - Feature name',
      'traits[].description': 'string - Feature description',
      // Actions (array)
      actions: 'array (optional) - Combat actions',
      'actions[].name': 'string - Action name',
      'actions[].actionType': 'string - Type: action, bonus, reaction, legendary',
      'actions[].roll': 'string (optional) - Attack/damage roll',
      'actions[].range': 'string (optional) - Attack range',
      'actions[].description': 'string - Action description',
      // Spells
      spellSlots: 'array (optional) - Spell slots by level',
      'spellSlots[].level': 'number (1-9) - Spell level',
      'spellSlots[].max': 'number - Maximum slots',
      'spellSlots[].remaining': 'number - Remaining slots',
      spells: 'array (optional) - Known spells',
      'spells[].name': 'string - Spell name',
      'spells[].level': 'number (0-9) - Spell level (0 for cantrips)',
      'spells[].school': 'string (optional) - Spell school',
      'spells[].castingTime': 'string (optional) - Casting time',
      'spells[].range': 'string (optional) - Spell range',
      'spells[].components': 'string (optional) - Spell components',
      'spells[].roll': 'string (optional) - Spell attack/save',
      'spells[].duration': 'string (optional) - Spell duration',
      'spells[].concentration': 'boolean (optional) - Requires concentration',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual',
      'spells[].description': 'string - Spell description',
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
        { name: "Animal Handling", proficient: true },
        { name: "Medicine", proficient: true },
        { name: "Nature", proficient: true },
        { name: "Perception", proficient: false },
        { name: "Religion", proficient: false },
        { name: "Survival", proficient: true }
      ],
      traits: [
        { name: "Fey Ancestry", description: "Advantage on saves vs. charm, immune to sleep" }
      ],
      actions: [
        { name: "Staff", actionType: "action", roll: "+4 to hit, 1d6+2 bludgeoning", range: "5 ft", description: "Quarterstaff attack" }
      ],
      spellSlots: [
        { level: 1, max: 4, remaining: 4 },
        { level: 2, max: 3, remaining: 3 },
        { level: 3, max: 2, remaining: 2 }
      ],
      spells: [
        { name: "Druidcraft", level: 0, school: "Transmutation", castingTime: "1 action", range: "30 ft", components: "V, S", duration: "Instantaneous", description: "Minor magical effects" },
        { name: "Entangle", level: 1, school: "Conjuration", castingTime: "1 action", range: "90 ft", components: "V, S", duration: "Concentration, 1 minute", concentration: true, description: "Vines restrain creatures" }
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
      'actions[].name': 'string - Action name',
      'actions[].actionType': 'string - Type: action, bonus, reaction, legendary',
      'actions[].roll': 'string (optional) - Attack/damage roll',
      'actions[].range': 'string (optional) - Attack range',
      'actions[].description': 'string - Action description',
      // Spells (array)
      spells: 'array (optional) - Spells the creature can cast',
      'spells[].name': 'string - Spell name',
      'spells[].level': 'number (0-9) - Spell level (0 for cantrips)',
      'spells[].school': 'string (optional) - Spell school',
      'spells[].castingTime': 'string (optional) - Casting time',
      'spells[].range': 'string (optional) - Spell range',
      'spells[].components': 'string (optional) - Spell components',
      'spells[].roll': 'string (optional) - Spell attack/save',
      'spells[].duration': 'string (optional) - Spell duration',
      'spells[].concentration': 'boolean (optional) - Requires concentration',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual',
      'spells[].description': 'string - Spell description'
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
          description: "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
        },
        {
          name: "Bite",
          actionType: "action",
          roll: "+17 to hit, reach 15 ft, one target. Hit: 21 (2d10 + 10) piercing damage plus 14 (4d6) fire damage.",
          description: "Bite attack with fire damage"
        }
      ],
      spells: [
        {
          name: "Detect",
          level: 1,
          school: "Divination",
          castingTime: "1 action",
          range: "Self",
          components: "V, S",
          duration: "Concentration, 10 minutes",
          concentration: true,
          description: "Detects the location of magic within range"
        }
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
   */
  function getJsonImportSchema(itemType: ItemType): JsonImportSchema | null {
    return itemTypeJsonSchemas[itemType] || null
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
  }
}

