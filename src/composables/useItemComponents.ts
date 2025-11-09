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

  return {
    getItemComponent,
    hasItemComponent,
    getItemTypeInfo,
    getItemTypesForTemplate,
    getUniversalItemTypes,
    isUniversalType,
    getFilterDefinitions,
  }
}

