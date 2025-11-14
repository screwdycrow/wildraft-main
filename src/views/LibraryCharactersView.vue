<template>
  <div>
    <page-top-bar
      title="Characters"
      icon="mdi-account-circle"
      description="Browse and manage all characters in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #search>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search characters..."
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

        <!-- Level Filter (Quick Filter) -->
        <v-select
          v-model="filterLevel"
          :items="levelOptions"
          label="Level"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 120px;"
        />
      </template>

      <template #actions>
        <!-- More Filters Button -->
        <v-btn
          variant="outlined"
          prepend-icon="mdi-filter-variant"
          @click="showFilterDialog = true"
        >
          More Filters
          <v-badge
            v-if="activeFilterCount > 0"
            :content="activeFilterCount"
            color="primary"
            inline
            class="ml-2"
          />
        </v-btn>
        
        <!-- Create Button -->
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Create Character
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
      :library-id="libraryId"
      item-type-name="character"
      item-type-name-plural="characters"
      empty-icon="mdi-account-circle"
      empty-icon-color="success"
      empty-title="No Characters Yet"
      empty-message="Create your first character to start building your party or NPC roster."
      create-button-text="Create Your First Character"
      @create="openCreateDialog"
      @view="viewItem"
      @edit="editItem"
      @delete="handleDeleteConfirmed"
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

    <!-- Advanced Filters Modal -->
    <item-filters-modal
      v-model="showFilterDialog"
      :item-type="ITEM_TYPE"
      :items="allCharacters"
      :filters="{ class: filterClass, race: filterRace }"
      @update:filters="updateAdvancedFilters"
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
import ItemFiltersModal from '@/components/items/ItemFiltersModal.vue'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { LibraryItem } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const toast = useToast()

const ITEM_TYPE = 'CHARACTER_DND_5E' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const filterLevel = ref<number | null>(null)
const filterClass = ref<string | null>(null)
const filterRace = ref<string | null>(null)
const showFormDialog = ref(false)
const showFilterDialog = ref(false)
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
    { text: 'Characters' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

// Level options for filter
const levelOptions = computed(() => {
  return Array.from({ length: 20 }, (_, i) => ({
    title: `Level ${i + 1}`,
    value: i + 1
  }))
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filterClass.value) count++
  if (filterRace.value) count++
  return count
})

// Get all characters
const allCharacters = computed(() => 
  itemsStore.items.filter(item => item.type === ITEM_TYPE)
)


// Filtered items
const filteredItems = computed(() => {
  let items = [...allCharacters.value]
  
  // Filter by level
  if (filterLevel.value !== null) {
    items = items.filter(item => item.data?.level === filterLevel.value)
  }
  
  // Filter by class
  if (filterClass.value) {
    items = items.filter(item => item.data?.class === filterClass.value)
  }
  
  // Filter by race
  if (filterRace.value) {
    items = items.filter(item => item.data?.race === filterRace.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.data?.playerName?.toLowerCase().includes(query)
    )
  }
  
  // Filter by tags
  if (filterTags.value.length > 0) {
    items = items.filter(item =>
      item.tags?.some(tag => filterTags.value.includes(tag.id))
    )
  }
  
  // Sort by level descending, then by name
  return items.sort((a, b) => {
    const levelDiff = (b.data?.level || 0) - (a.data?.level || 0)
    if (levelDiff !== 0) return levelDiff
    return a.name.localeCompare(b.name)
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
      toast.error('Failed to load characters')
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
      toast.error('Failed to load characters')
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
  console.log('Character created:', item.name)
}

function handleItemUpdated(item: LibraryItem) {
  // Item already updated in store by ItemDialog
  console.log('Character updated:', item.name)
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

async function handleDeleteConfirmed(item: LibraryItem) {
  if (!libraryId.value) return

  try {
    await itemsStore.deleteItem(libraryId.value, item.id)
    toast.success('Character deleted successfully')
  } catch (error) {
    toast.error('Failed to delete character')
  }
}

function updateAdvancedFilters(filters: Record<string, any>) {
  filterClass.value = filters.class || null
  filterRace.value = filters.race || null
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>

