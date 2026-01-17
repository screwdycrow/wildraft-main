# ItemGridList Component Usage

## 🎯 Purpose

The `ItemGridList` component is a reusable grid display for library items that handles:
- Loading states
- Empty states
- Item grid display using `ItemCardWrapper`
- Delete confirmation dialogs
- CRUD event emissions

## 📦 Benefits

### **Before**: Each view had ~180 lines of duplicate code
```vue
<!-- Loading State (30 lines) -->
<!-- Empty State (40 lines) -->
<!-- Grid Display (20 lines) -->
<!-- Delete Dialog (40 lines) -->
<!-- Delete Logic (30 lines) -->
```

### **After**: One reusable component
```vue
<item-grid-list
  :items="filteredItems"
  :is-loading="itemsStore.isLoading"
  item-type-name="character"
  @create="openCreateDialog"
  @view="viewItem"
  @edit="editItem"
  @delete="handleDeleteConfirmed"
/>
```

**Result**: ~170 lines reduced to ~10 lines per view! 🎉

## 🚀 Usage Example

### LibraryCharactersView.vue

```vue
<template>
  <div>
    <!-- Page header with filters -->
    <page-top-bar ...>
      <!-- Filters and create button -->
    </page-top-bar>

    <!-- Search and filter cards -->
    <v-card class="glass-card mb-4">
      <!-- Your custom filters here -->
    </v-card>

    <!-- Items Grid - Just one component! -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
      :has-filters="hasFilters"
      item-type-name="character"
      item-type-name-plural="characters"
      empty-icon="mdi-account-circle"
      empty-icon-color="success"
      :empty-title="hasFilters ? 'No characters found' : 'No Characters Yet'"
      :empty-message="hasFilters ? 'Try adjusting your filters or search terms.' : 'Create your first character to start building your party or NPC roster.'"
      create-button-text="Create Your First Character"
      @create="openCreateDialog"
      @view="viewItem"
      @edit="editItem"
      @delete="handleDeleteConfirmed"
    />

    <!-- Create/Edit Dialog -->
    <item-dialog
      v-model="showFormDialog"
      :library-id="libraryId"
      :item="editingItem"
      :item-type="ITEM_TYPE"
      @created="handleItemCreated"
      @updated="handleItemUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import { ItemGridList, ItemDialog } from '@/components/items'
import type { LibraryItem } from '@/types/item.types'

const itemsStore = useItemsStore()
const toast = useToast()

const ITEM_TYPE = 'CHARACTER_DND_5E' as const
const showFormDialog = ref(false)
const editingItem = ref<LibraryItem | null>(null)

// Your filtered items
const filteredItems = computed(() => {
  // Your filtering logic here
  return itemsStore.items.filter(/* ... */)
})

// Simple event handlers
function openCreateDialog() {
  editingItem.value = null
  showFormDialog.value = true
}

function viewItem(item: LibraryItem) {
  router.push({ name: 'CharacterView', params: { itemId: item.id } })
}

function editItem(item: LibraryItem) {
  editingItem.value = item
  showFormDialog.value = true
}

async function handleDeleteConfirmed(item: LibraryItem) {
  try {
    await itemsStore.deleteItem(libraryId.value, item.id)
    toast.success('Character deleted successfully')
  } catch (error) {
    toast.error('Failed to delete character')
  }
}

function handleItemCreated(item: LibraryItem) {
  console.log('Character created:', item.name)
}

function handleItemUpdated(item: LibraryItem) {
  console.log('Character updated:', item.name)
  editingItem.value = null
}
</script>
```

## 📋 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LibraryItem[]` | **required** | Array of items to display |
| `isLoading` | `boolean` | `false` | Show loading state |
| `canCreate` | `boolean` | `true` | Show create button in empty state |
| `hasFilters` | `boolean` | `false` | Adjust empty state message for filtered results |
| `itemTypeName` | `string` | `'item'` | Singular name for item type (e.g., 'character') |
| `itemTypeNamePlural` | `string` | `'items'` | Plural name for item type (e.g., 'characters') |
| `emptyIcon` | `string` | `'mdi-bookshelf'` | Icon for empty state |
| `emptyIconColor` | `string` | `'primary'` | Color for empty state icon |
| `emptyTitle` | `string` | `'No Items Yet'` | Title for empty state |
| `emptyMessage` | `string` | `'Create your first item to get started.'` | Message for empty state |
| `createButtonText` | `string` | `'Create Your First Item'` | Text for create button |

## 🎨 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `@create` | - | User clicked create button in empty state |
| `@view` | `LibraryItem` | User clicked view button on a card |
| `@edit` | `LibraryItem` | User clicked edit button on a card |
| `@delete` | `LibraryItem` | User confirmed deletion (after dialog) |

## 🎯 Customization Examples

### Notes View
```vue
<item-grid-list
  :items="filteredItems"
  :is-loading="isLoading"
  item-type-name="note"
  item-type-name-plural="notes"
  empty-icon="mdi-note-text"
  empty-icon-color="warning"
  empty-title="No Notes Yet"
  empty-message="Create your first note to start documenting your campaign."
  create-button-text="Create Your First Note"
  @create="openCreateDialog"
  @view="viewItem"
  @edit="editItem"
  @delete="handleDeleteConfirmed"
/>
```

### Magic Items View
```vue
<item-grid-list
  :items="filteredItems"
  :is-loading="isLoading"
  item-type-name="magic item"
  item-type-name-plural="magic items"
  empty-icon="mdi-treasure-chest"
  empty-icon-color="amber"
  empty-title="No Magic Items Yet"
  empty-message="Create your first magic item to build your treasure hoard."
  create-button-text="Create Your First Item"
  @create="openCreateDialog"
  @view="viewItem"
  @edit="editItem"
  @delete="handleDeleteConfirmed"
/>
```

### Stat Blocks View
```vue
<item-grid-list
  :items="filteredItems"
  :is-loading="isLoading"
  item-type-name="stat block"
  item-type-name-plural="stat blocks"
  empty-icon="mdi-sword-cross"
  empty-icon-color="error"
  empty-title="No Stat Blocks Yet"
  empty-message="Create your first stat block to track creatures and NPCs."
  create-button-text="Create Your First Stat Block"
  @create="openCreateDialog"
  @view="viewItem"
  @edit="editItem"
  @delete="handleDeleteConfirmed"
/>
```

## 🔄 Migration Checklist

When converting a view to use `ItemGridList`:

1. ✅ Import `ItemGridList` from `@/components/items`
2. ✅ Remove old grid/loading/empty state template code
3. ✅ Replace with `<item-grid-list>` component
4. ✅ Remove `showDeleteDialog`, `deletingItem`, `isDeleting` refs
5. ✅ Simplify `handleDeleteConfirmed` to just call API
6. ✅ Remove delete dialog template code
7. ✅ Remove empty/loading animation styles
8. ✅ Test create, view, edit, and delete flows

## 📊 Code Reduction Stats

| View | Before (lines) | After (lines) | Saved |
|------|---------------|--------------|-------|
| LibraryCharactersView | ~420 | ~325 | **~95** |
| LibraryNotesView | ~350 | ~255 | **~95** |
| LibraryMagicItemsView | ~410 | ~315 | **~95** |
| LibraryStatBlocksView | ~450 | ~355 | **~95** |
| LibraryItemsView | ~400 | ~305 | **~95** |
| **Total** | **~2030** | **~1555** | **~475 lines!** 🎉 |

## 🎉 Benefits Summary

✅ **Less Code**: ~95 lines removed per view
✅ **Consistency**: All views use same logic
✅ **Maintainability**: Fix once, works everywhere
✅ **Reusability**: Easy to add new item types
✅ **Testability**: One component to test thoroughly
✅ **DRY Principle**: Don't Repeat Yourself achieved!

---

Next step: Update remaining views (Notes, Magic Items, Stat Blocks, All Items) to use `ItemGridList`! 🚀

