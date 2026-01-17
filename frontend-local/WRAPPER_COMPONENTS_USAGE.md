# Wrapper Components Usage Guide

## Overview

The new wrapper components provide a unified, template-agnostic way to work with library items. They handle the complexity of rendering the correct component based on item type.

## Components Created

### 1. `ItemCardWrapper.vue`
Dynamically renders the appropriate card component based on item type.

### 2. `ItemFormWrapper.vue`
Dynamically renders the appropriate form component based on item type.

### 3. `ItemDialog.vue`
A reusable dialog that wraps `ItemFormWrapper` and handles create/update operations.

### 4. `ItemDetailDialog.vue`
A reusable dialog for viewing item details with edit/delete actions.

## Usage Examples

### Example 1: Simplified View with ItemDialog

```vue
<template>
  <div>
    <!-- Header with create button -->
    <v-btn @click="openCreateDialog">Create Character</v-btn>

    <!-- Items Grid -->
    <v-row>
      <v-col v-for="item in items" :key="item.id">
        <item-card-wrapper
          :item="item"
          @click="viewItem(item)"
        />
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog - handles both automatically! -->
    <item-dialog
      v-model="showDialog"
      :library-id="libraryId"
      :item="selectedItem"
      :item-type="itemType"
      @created="handleCreated"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import ItemDialog from '@/components/items/ItemDialog.vue'

const showDialog = ref(false)
const selectedItem = ref(null)
const itemType = ref('CHARACTER_DND_5E')

function openCreateDialog() {
  selectedItem.value = null // null = create mode
  showDialog.value = true
}

function viewItem(item) {
  selectedItem.value = item // item present = edit mode
  showDialog.value = true
}

function handleCreated(newItem) {
  console.log('Created:', newItem)
  // Item is already added to store by ItemDialog
}

function handleUpdated(updatedItem) {
  console.log('Updated:', updatedItem)
  // Item is already updated in store by ItemDialog
}
</script>
```

### Example 2: Custom Dialog with ItemFormWrapper

If you need more control over the dialog:

```vue
<template>
  <v-dialog v-model="showDialog" max-width="1200">
    <v-card>
      <v-card-title>
        {{ editMode ? 'Edit' : 'Create' }} Character
      </v-card-title>
      
      <item-form-wrapper
        :item="selectedItem"
        :library-id="libraryId"
        :item-type="'CHARACTER_DND_5E'"
        @submit="handleSubmit"
        @cancel="showDialog = false"
      />
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import ItemFormWrapper from '@/components/items/ItemFormWrapper.vue'

const itemsStore = useItemsStore()
const showDialog = ref(false)
const selectedItem = ref(null)
const libraryId = ref(1)

const editMode = computed(() => !!selectedItem.value)

async function handleSubmit(data, callback) {
  try {
    if (editMode.value) {
      await itemsStore.updateItem(libraryId.value, selectedItem.value.id, data)
    } else {
      await itemsStore.createItem(libraryId.value, data)
    }
    callback(true)
    showDialog.value = false
  } catch (error) {
    callback(false)
  }
}
</script>
```

### Example 3: Update LibraryCharactersView

Here's how to simplify `LibraryCharactersView.vue`:

```vue
<template>
  <div>
    <!-- ... filters and search ... -->

    <!-- Characters Grid - SIMPLIFIED! -->
    <v-row>
      <v-col
        v-for="item in filteredItems"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <item-card-wrapper
          :item="item"
          @click="viewItem(item)"
        />
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog - MUCH SIMPLER! -->
    <item-dialog
      v-model="showFormDialog"
      :library-id="libraryId!"
      :item="editingItem"
      :item-type="'CHARACTER_DND_5E'"
      @created="handleItemCreated"
      @updated="handleItemUpdated"
    />

    <!-- Delete Dialog stays the same -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import ItemDialog from '@/components/items/ItemDialog.vue'

// Remove these imports - no longer needed!
// import { useItemComponents } from '@/composables/useItemComponents'
// import CharacterForm from '@/components/items/dnd5e/characters/CharacterForm.vue'
// import CharacterCard from '@/components/items/dnd5e/characters/CharacterCard.vue'

const showFormDialog = ref(false)
const editingItem = ref(null)

function openCreateDialog() {
  editingItem.value = null
  showFormDialog.value = true
}

function viewItem(item) {
  editingItem.value = item
  showFormDialog.value = true
}

function handleItemCreated(item) {
  // Item already in store, just close dialog
  console.log('Created:', item)
}

function handleItemUpdated(item) {
  // Item already updated in store
  console.log('Updated:', item)
}

// Remove these functions - no longer needed!
// - getItemCard
// - getCurrentForm
// - handleCreateOrUpdate (logic now in ItemDialog)
</script>
```

## Benefits

### 1. **No Template-Specific Imports**
Before:
```typescript
import CharacterForm from '@/components/items/dnd5e/characters/CharacterForm.vue'
import CharacterCard from '@/components/items/dnd5e/characters/CharacterCard.vue'
import MagicItemForm from '@/components/items/dnd5e/items/MagicItemForm.vue'
// ... etc
```

After:
```typescript
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import ItemDialog from '@/components/items/ItemDialog.vue'
```

### 2. **Reusable Everywhere**
Use the same components in:
- Main library views (Characters, Items, etc.)
- "All Content" view
- Quick-create menus
- Search results
- Related items sections

### 3. **Consistent Behavior**
All CRUD operations handled the same way:
- Forms handle their own validation
- ItemDialog handles API calls
- Store automatically updates
- Toasts show automatically

### 4. **Easy to Add New Templates**
To add a new game system:
1. Create the form component (e.g., `PathfinderCharacterForm.vue`)
2. Create the card component (e.g., `PathfinderCharacterCard.vue`)
3. Add mappings to the wrappers
4. Done! Works everywhere automatically.

### 5. **Type Safety**
All components are fully typed:
```typescript
interface Props {
  item: LibraryItem
  libraryId: number
  itemType: ItemType // 'CHARACTER_DND_5E' | 'ITEM_DND_5E' | ...
}
```

## Architecture

```
ItemDialog (handles API + lifecycle)
    ↓
ItemFormWrapper (routes to correct form)
    ↓
CharacterForm / MagicItemForm / etc (handles UI + validation)
    ↓ (emits)
ItemFormWrapper
    ↓ (emits)
ItemDialog (saves to API + store)
```

## Migration Checklist

For each view file:
- [ ] Replace specific card imports with `ItemCardWrapper`
- [ ] Replace specific form imports with `ItemDialog`
- [ ] Remove `useItemComponents` composable usage
- [ ] Remove `handleCreateOrUpdate` - logic now in `ItemDialog`
- [ ] Update event handlers to use `@created` and `@updated`
- [ ] Remove component resolution logic (`getItemCard`, `getCurrentForm`)
- [ ] Test create, edit, and delete operations

## Next Steps

1. Update all view files to use wrappers
2. Remove the `useItemComponents` composable if no longer needed
3. Consider creating detail view components for each type
4. Add them to `ItemDetailDialog` component map

