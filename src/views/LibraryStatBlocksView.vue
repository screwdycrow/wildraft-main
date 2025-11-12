<template>
  <div>
    <page-top-bar
      title="Stat Blocks"
      icon="mdi-sword-cross"
      description="Browse and manage all stat blocks in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #search>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search stat blocks..."
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

        <!-- Creature Type Filter -->
        <v-select
          v-if="availableTypes.length > 0"
          v-model="selectedType"
          :items="availableTypes"
          label="Creature Type"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 150px;"
        />

        <!-- CR Filter -->
        <v-select
          v-model="filterCR"
          :items="crOptions"
          label="CR"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 120px;"
        />
        
        <!-- Size Filter -->
        <v-select
          v-model="filterSize"
          :items="sizeOptions"
          label="Size"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 120px;"
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
          Create Stat Block
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
      :library-id="libraryId"
      item-type-name="stat block"
      item-type-name-plural="stat blocks"
      empty-icon="mdi-sword-cross"
      empty-icon-color="error"
      empty-title="No Stat Blocks Yet"
      empty-message="Create your first stat block to start building your bestiary of creatures and NPCs."
      create-button-text="Create Your First Stat Block"
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

const ITEM_TYPE = 'STAT_BLOCK_DND_5E' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const filterCR = ref<string | null>(null)
const filterSize = ref<string | null>(null)
const selectedType = ref<string | null>(null)
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
    { text: 'Stat Blocks' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

// CR options for filter
const crOptions = [
  { title: '0', value: '0' },
  { title: '1/8', value: '1/8' },
  { title: '1/4', value: '1/4' },
  { title: '1/2', value: '1/2' },
  { title: '1', value: '1' },
  { title: '2', value: '2' },
  { title: '3', value: '3' },
  { title: '4', value: '4' },
  { title: '5', value: '5' },
  { title: '6', value: '6' },
  { title: '7', value: '7' },
  { title: '8', value: '8' },
  { title: '9', value: '9' },
  { title: '10', value: '10' },
  { title: '11', value: '11' },
  { title: '12', value: '12' },
  { title: '13', value: '13' },
  { title: '14', value: '14' },
  { title: '15', value: '15' },
  { title: '16', value: '16' },
  { title: '17', value: '17' },
  { title: '18', value: '18' },
  { title: '19', value: '19' },
  { title: '20', value: '20' },
  { title: '21', value: '21' },
  { title: '22', value: '22' },
  { title: '23', value: '23' },
  { title: '24', value: '24' },
  { title: '25', value: '25' },
  { title: '26', value: '26' },
  { title: '27', value: '27' },
  { title: '28', value: '28' },
  { title: '29', value: '29' },
  { title: '30', value: '30' },
]

// Size options
const sizeOptions = [
  { title: 'Tiny', value: 'Tiny' },
  { title: 'Small', value: 'Small' },
  { title: 'Medium', value: 'Medium' },
  { title: 'Large', value: 'Large' },
  { title: 'Huge', value: 'Huge' },
  { title: 'Gargantuan', value: 'Gargantuan' },
]

// Get all stat blocks
const allStatBlocks = computed(() => 
  itemsStore.items.filter(item => item.type === ITEM_TYPE)
)

// Get available creature types from existing stat blocks
const availableTypes = computed(() => {
  const types = new Set<string>()
  allStatBlocks.value.forEach(sb => {
    const type = sb.data?.type
    if (type && typeof type === 'string') {
      types.add(type)
    }
  })
  return Array.from(types).sort()
})


// Filtered items
const filteredItems = computed(() => {
  let items = [...allStatBlocks.value]
  
  // Filter by CR
  if (filterCR.value) {
    items = items.filter(item => item.data?.cr === filterCR.value)
  }
  
  // Filter by size
  if (filterSize.value) {
    items = items.filter(item => item.data?.size === filterSize.value)
  }
  
  // Filter by creature type
  if (selectedType.value) {
    items = items.filter(item => item.data?.type === selectedType.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.data?.type?.toLowerCase().includes(query) ||
      item.data?.alignment?.toLowerCase().includes(query)
    )
  }
  
  // Filter by tags
  if (filterTags.value.length > 0) {
    items = items.filter(item =>
      item.tags?.some(tag => filterTags.value.includes(tag.id))
    )
  }
  
  // Sort by CR value, then by name
  return items.sort((a, b) => {
    const crA = parseCR(a.data?.cr)
    const crB = parseCR(b.data?.cr)
    const crDiff = crB - crA
    if (crDiff !== 0) return crDiff
    return a.name.localeCompare(b.name)
  })
})

// Helper to parse CR for sorting
function parseCR(cr: string | undefined): number {
  if (!cr) return 0
  if (cr === '1/8') return 0.125
  if (cr === '1/4') return 0.25
  if (cr === '1/2') return 0.5
  return parseFloat(cr) || 0
}

// Load items
onMounted(async () => {
  if (libraryId.value) {
    try {
      await itemsStore.fetchItems(libraryId.value)
    } catch (error) {
      toast.error('Failed to load stat blocks')
    }
  }
})

// Reload items when library changes
watch(libraryId, async (newId) => {
  if (newId) {
    try {
      await itemsStore.fetchItems(newId)
    } catch (error) {
      toast.error('Failed to load stat blocks')
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
  console.log('Stat block created:', item.name)
}

function handleItemUpdated(item: LibraryItem) {
  // Item already updated in store by ItemDialog
  console.log('Stat block updated:', item.name)
  editingItem.value = null
}

async function handleRefresh() {
  if (libraryId.value) {
    try {
      await itemsStore.fetchItems(libraryId.value, { type: ITEM_TYPE })
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
    toast.success('Stat block deleted successfully')
  } catch (error) {
    toast.error('Failed to delete stat block')
  }
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>

