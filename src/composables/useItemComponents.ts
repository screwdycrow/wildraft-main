import { Component, defineAsyncComponent } from 'vue'
import type { ItemType } from '@/types/item.types'

// Component type definitions
export type ComponentType = 'card' | 'detail' | 'form' | 'quickView'

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

  return {
    getItemComponent,
    hasItemComponent,
    getItemTypeInfo,
    getItemTypesForTemplate,
    getUniversalItemTypes,
    isUniversalType,
  }
}

