<template>
  <div>
    <page-top-bar
      title="Notes"
      icon="mdi-note-text"
      description="Browse and manage all notes in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #search>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search notes..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </template>

      <template #filters>
        <!-- Tag Filter -->
        <tag-selector
          v-model="filterTags"
          :library-id="libraryId!"
          label="Tags"
          hint=""
          :show-add-button="false"
          density="compact"
          hide-details
          style="min-width: 180px;"
        />

        <!-- Category Filter -->
        <v-select
          v-if="availableCategories.length > 0"
          v-model="selectedCategory"
          :items="availableCategories"
          label="Category"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 150px;"
        />
      </template>

      <template #actions>
        <!-- Create Button -->
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Create Note
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
      :library-id="libraryId"
      item-type-name="note"
      item-type-name-plural="notes"
      empty-icon="mdi-note-text"
      empty-icon-color="info"
      empty-title="No Notes Yet"
      empty-message="Create your first note to capture ideas, plans, and important information."
      create-button-text="Create Your First Note"
      @create="openCreateDialog"
      @view="viewItem"
      @edit="editItem"
      @delete="deleteItemConfirmed"
      @refresh="handleRefresh"
      @add-tag="handleAddTag"
    />

    <!-- Create/Edit Dialog -->
    <item-dialog
      v-model="showFormDialog"
      :library-id="libraryId!"
      :item="editingItem"
      :item-type="ITEM_TYPE"
      @created="handleItemCreated"
      @updated="handleItemUpdated"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TagSelector from '@/components/tags/TagSelector.vue'
import { ItemGridList, ItemDialog } from '@/components/items'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { LibraryItem } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const toast = useToast()

const ITEM_TYPE = 'NOTE' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const selectedCategory = ref<string | null>(null)
const showFormDialog = ref(false)
const editingItem = ref<LibraryItem | null>(null)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'Notes' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

// Get all notes
const allNotes = computed(() => 
  itemsStore.items.filter(item => item.type === ITEM_TYPE)
)

// Get available categories from existing notes
const availableCategories = computed(() => {
  const categories = new Set<string>()
  allNotes.value.forEach(note => {
    const category = note.data?.category
    if (category && typeof category === 'string') {
      categories.add(category)
    }
  })
  return Array.from(categories).sort()
})

// Filtered items
const filteredItems = computed(() => {
  let items = [...allNotes.value]
  
  // Filter by category
  if (selectedCategory.value) {
    items = items.filter(item => item.data?.category === selectedCategory.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.data?.content?.toLowerCase().includes(query)
    )
  }
  
  // Filter by tags
  if (filterTags.value.length > 0) {
    items = items.filter(item =>
      item.tags?.some(tag => filterTags.value.includes(tag.id))
    )
  }
  
  // Sort by pinned, then by updated date
  return items.sort((a, b) => {
    const aPinned = a.data?.isPinned || false
    const bPinned = b.data?.isPinned || false
    
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1
    }
    
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
})

// Load items (only if not already cached)
onMounted(async () => {
  if (libraryId.value) {
    try {
      // Only fetch if items aren't already loaded for this library
      if (!itemsStore.isAlreadyLoaded(libraryId.value)) {
      await itemsStore.fetchItems(libraryId.value)
      }
    } catch (error) {
      toast.error('Failed to load notes')
    }
  }
})

// Reload items when library changes (only if not already cached)
watch(libraryId, async (newId) => {
  if (newId) {
    try {
      // Only fetch if items aren't already loaded for this library
      if (!itemsStore.isAlreadyLoaded(newId)) {
      await itemsStore.fetchItems(newId)
      }
    } catch (error) {
      toast.error('Failed to load notes')
    }
  }
})

// Item actions
function openCreateDialog() {
  editingItem.value = null
  showFormDialog.value = true
}

function viewItem(item: LibraryItem) {
  router.push({
    name: 'ItemDetail',
    params: {
      libraryId: libraryId.value,
      itemId: item.id,
    },
  })
}

function editItem(item: LibraryItem) {
  editingItem.value = item
  showFormDialog.value = true
}

function handleItemCreated(item: LibraryItem) {
  // Item already added to store by ItemDialog
  console.log('Note created:', item.name)
}

function handleItemUpdated(item: LibraryItem) {
  // Item already updated in store by ItemDialog
  console.log('Note updated:', item.name)
  editingItem.value = null
}

async function handleRefresh() {
  if (libraryId.value) {
    try {
      // Force refresh on manual refresh
      await itemsStore.fetchItems(libraryId.value, undefined, true)
    } catch (error) {
      toast.error('Failed to refresh items')
    }
  }
}

function handleAddTag() {
  // Emit event to parent or open tag creation dialog
  console.log('Add tag requested')
}

async function deleteItemConfirmed(item: LibraryItem) {
  if (!libraryId.value) return

  try {
    await itemsStore.deleteItem(libraryId.value, item.id)
    toast.success('Note deleted successfully')
  } catch (error) {
    toast.error('Failed to delete note')
  }
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>

