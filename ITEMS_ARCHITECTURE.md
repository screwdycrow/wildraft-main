# Library Items Dynamic Component Architecture

## Overview
A flexible system that dynamically loads components based on library template and item type.

## 1. File Structure

```
src/
├── components/
│   └── items/
│       ├── common/                    # Shared/fallback components
│       │   ├── ItemListEmpty.vue
│       │   ├── ItemListSkeleton.vue
│       │   ├── ItemNotFound.vue
│       │   ├── GenericItemCard.vue
│       │   ├── GenericItemDetail.vue
│       │   └── GenericItemForm.vue
│       │
│       ├── universal/                 # Template-independent (work everywhere)
│       │   └── notes/
│       │       ├── NoteCard.vue
│       │       ├── NoteDetail.vue
│       │       └── NoteForm.vue
│       │
│       └── dnd5e/                     # DND 5E specific components
│           ├── stat-blocks/
│           │   ├── StatBlockCard.vue          # List view card
│           │   ├── StatBlockDetail.vue        # Detail view
│           │   ├── StatBlockForm.vue          # Create/Edit form
│           │   └── StatBlockQuickView.vue     # Quick preview modal
│           │
│           ├── characters/
│           │   ├── CharacterCard.vue
│           │   ├── CharacterDetail.vue
│           │   └── CharacterForm.vue
│           │
│           └── items/                 # Magic Items
│               ├── MagicItemCard.vue
│               ├── MagicItemDetail.vue
│               └── MagicItemForm.vue
│
├── composables/
│   ├── useItemComponents.ts          # Dynamic component loader
│   └── useItemActions.ts             # Shared item actions
│
├── views/
│   ├── LibraryItemsView.vue          # List all items (with filters)
│   └── ItemDetailView.vue            # Dynamic detail view
│
└── types/
    └── item.types.ts                 # Type definitions (already exists)
```

---

## 2. Component Registry System

### `/composables/useItemComponents.ts`

```typescript
import { Component, defineAsyncComponent } from 'vue'

// Component type definitions
export type ComponentType = 'card' | 'detail' | 'form' | 'quickView'

// Component registry mapping
const componentRegistry: Record<string, Record<ComponentType, () => Promise<Component>>> = {
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

// Fallback components
const fallbackComponents: Record<ComponentType, () => Promise<Component>> = {
  card: () => import('@/components/items/common/GenericItemCard.vue'),
  detail: () => import('@/components/items/common/GenericItemDetail.vue'),
  form: () => import('@/components/items/common/GenericItemForm.vue'),
  quickView: () => import('@/components/items/common/GenericItemCard.vue'),
}

export function useItemComponents() {
  /**
   * Get the appropriate component for an item type
   */
  function getItemComponent(itemType: string, componentType: ComponentType): Component {
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
    return defineAsyncComponent(fallbackComponents[componentType])
  }

  /**
   * Check if a specific component exists for an item type
   */
  function hasItemComponent(itemType: string, componentType: ComponentType): boolean {
    return !!(componentRegistry[itemType]?.[componentType])
  }

  /**
   * Get item type metadata (icon, color, label, template)
   */
  function getItemTypeInfo(itemType: string) {
    const typeMap: Record<string, { icon: string; color: string; label: string; template?: string }> = {
      // DND 5E
      STAT_BLOCK_DND_5E: { icon: 'mdi-sword-cross', color: '#E74C3C', label: 'Stat Block', template: 'DND_5E' },
      CHARACTER_DND_5E: { icon: 'mdi-account-multiple', color: '#3498DB', label: 'Character', template: 'DND_5E' },
      ITEM_DND_5E: { icon: 'mdi-treasure-chest', color: '#F39C12', label: 'Magic Item', template: 'DND_5E' },
      
      // Universal (no template)
      NOTE: { icon: 'mdi-note-text', color: '#95A5A6', label: 'Note' },
    }
    
    return typeMap[itemType] || { icon: 'mdi-file', color: '#7F8C8D', label: 'Unknown' }
  }

  /**
   * Get all item types available for a specific template
   */
  function getItemTypesForTemplate(template: string): string[] {
    return Object.entries(getItemTypeInfo(''))
      .filter(([_, info]) => info.template === template)
      .map(([type]) => type)
  }

  /**
   * Get universal item types (work across all templates)
   */
  function getUniversalItemTypes(): string[] {
    return Object.entries(getItemTypeInfo(''))
      .filter(([_, info]) => !info.template)
      .map(([type]) => type)
  }

  /**
   * Check if an item type is universal
   */
  function isUniversalType(itemType: string): boolean {
    return !getItemTypeInfo(itemType).template
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
```

---

## 3. Usage Examples

### A. List View (LibraryItemsView.vue)

```vue
<template>
  <div>
    <page-top-bar title="Items" icon="mdi-file-multiple" :breadcrumbs="breadcrumbs">
      <template #actions>
        <v-btn color="primary" @click="showCreateDialog = true">
          Add Item
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Filter by Type -->
    <v-row class="mb-4">
      <v-col>
        <v-chip-group v-model="selectedType" mandatory>
          <v-chip value="all">All Items</v-chip>
          <v-chip 
            v-for="type in itemTypes" 
            :key="type" 
            :value="type"
            :prepend-icon="getItemTypeInfo(type).icon"
            :color="getItemTypeInfo(type).color"
          >
            {{ getItemTypeInfo(type).label }}
          </v-chip>
        </v-chip-group>
      </v-col>
    </v-row>

    <!-- Dynamic Item Cards -->
    <v-row>
      <v-col 
        v-for="item in filteredItems" 
        :key="item.id"
        cols="12" sm="6" md="4" lg="3"
      >
        <!-- Dynamically load the card component for this item type -->
        <component 
          :is="getItemComponent(item.type, 'card')"
          :item="item"
          @click="handleItemClick(item)"
          @edit="handleEdit(item)"
          @delete="handleDelete(item)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemComponents } from '@/composables/useItemComponents'
import type { LibraryItem } from '@/types/item.types'

const { getItemComponent, getItemTypeInfo } = useItemComponents()

const items = ref<LibraryItem[]>([])
const selectedType = ref('all')

const itemTypes = computed(() => {
  return [...new Set(items.value.map(item => item.type))]
})

const filteredItems = computed(() => {
  if (selectedType.value === 'all') return items.value
  return items.value.filter(item => item.type === selectedType.value)
})
</script>
```

### B. Detail View (ItemDetailView.vue)

```vue
<template>
  <div v-if="item">
    <!-- Dynamically load the detail component -->
    <component 
      :is="getItemComponent(item.type, 'detail')"
      :item="item"
      :library-id="libraryId"
      @update="handleUpdate"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useItemComponents } from '@/composables/useItemComponents'

const route = useRoute()
const { getItemComponent } = useItemComponents()

const item = ref(null)
const libraryId = computed(() => Number(route.params.libraryId))

onMounted(async () => {
  // Fetch item...
})
</script>
```

### C. Create/Edit Dialog

```vue
<template>
  <v-dialog v-model="show" max-width="900" persistent>
    <component
      :is="getItemComponent(itemType, 'form')"
      :item="editingItem"
      :library-id="libraryId"
      @submit="handleSubmit"
      @cancel="show = false"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemComponents } from '@/composables/useItemComponents'

const props = defineProps<{
  modelValue: boolean
  itemType: string
  libraryId: number
  editingItem?: LibraryItem | null
}>()

const { getItemComponent } = useItemComponents()
</script>
```

---

## 4. Template-Based Item Types

### Update `item.types.ts`

```typescript
// Template enum
export enum LibraryTemplate {
  DND_5E = 'DND_5E',
  DND_3_5 = 'DND_3_5',
  PATHFINDER = 'PATHFINDER',
  CUSTOM = 'CUSTOM',
}

// Item type per template
export enum ItemTypeDND5E {
  STAT_BLOCK = 'STAT_BLOCK_DND_5E',
  CHARACTER = 'CHARACTER_DND_5E',
  ITEM = 'ITEM_DND_5E',
  NOTE = 'NOTE_DND_5E',
  SPELL = 'SPELL_DND_5E',
}

// Helper to get available item types for a template
export function getItemTypesForTemplate(template: LibraryTemplate): string[] {
  const templateMap: Record<LibraryTemplate, string[]> = {
    [LibraryTemplate.DND_5E]: Object.values(ItemTypeDND5E),
    [LibraryTemplate.DND_3_5]: [], // Add later
    [LibraryTemplate.PATHFINDER]: [], // Add later
    [LibraryTemplate.CUSTOM]: [], // Add later
  }
  
  return templateMap[template] || []
}
```

---

## 5. Component Props Interface

### Standard props all components should accept:

```typescript
// Card Component Props
interface ItemCardProps {
  item: LibraryItem
}

// Detail Component Props
interface ItemDetailProps {
  item: LibraryItem
  libraryId: number
}

// Form Component Props
interface ItemFormProps {
  item?: LibraryItem | null  // null for create, populated for edit
  libraryId: number
}

// Standard events all components should emit
interface ItemComponentEmits {
  'update': [item: LibraryItem]
  'delete': [itemId: number]
  'click': [item: LibraryItem]
}
```

---

## 6. Implementation Priority

### Phase 1: Core Infrastructure
1. ✅ Create `useItemComponents` composable
2. ✅ Update item types
3. ✅ Create fallback/generic components
4. ✅ Setup component registry

### Phase 2: DND 5E Stat Blocks (First Implementation)
1. Create `StatBlockCard.vue`
2. Create `StatBlockDetail.vue`
3. Create `StatBlockForm.vue`
4. Test dynamic loading

### Phase 3: Other DND 5E Types
1. Characters
2. Magic Items
3. (Notes are universal - separate implementation)

### Phase 4: Views
1. `LibraryItemsView.vue` - List with filters
2. Update `ItemDetailView.vue` - Dynamic detail
3. Create item dialogs

---

## 7. Benefits of This Architecture

✅ **Scalable**: Easy to add new templates (Pathfinder, DND 3.5, etc.)
✅ **Lazy Loading**: Components only load when needed
✅ **Type-Safe**: TypeScript ensures correct props
✅ **Maintainable**: Clear separation by template and type
✅ **Flexible**: Can mix generic and specific components
✅ **Fallback**: Graceful degradation for missing components

---

## Next Steps

1. Should I create the `useItemComponents` composable first?
2. Should I create a basic StatBlock card/detail/form to test the system?
3. Do you want to see the API integration for items?

