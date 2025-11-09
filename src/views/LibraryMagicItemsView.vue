<template>
  <div>
    <page-top-bar
      title="Magic Items"
      icon="mdi-treasure-chest"
      description="Browse and manage all magic items in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #search>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search magic items..."
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

        <!-- Item Type Filter -->
        <v-select
          v-if="availableItemTypes.length > 0"
          v-model="selectedItemType"
          :items="availableItemTypes"
          label="Item Type"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 150px;"
        />

        <!-- Rarity Filter -->
        <v-select
          v-model="filterRarity"
          :items="rarityOptions"
          label="Rarity"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 140px;"
        />
        
        <!-- Attunement Filter -->
        <v-select
          v-model="filterAttunement"
          :items="attunementOptions"
          label="Attunement"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 140px;"
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
          Create Item
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
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
      @delete="deleteItemConfirmed"
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

const ITEM_TYPE = 'ITEM_DND_5E' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const filterRarity = ref<string | null>(null)
const filterAttunement = ref<string | null>(null)
const selectedItemType = ref<string | null>(null)
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
    { text: 'Magic Items' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

// Rarity options for filter
const rarityOptions = [
  { title: 'Common', value: 'common' },
  { title: 'Uncommon', value: 'uncommon' },
  { title: 'Rare', value: 'rare' },
  { title: 'Very Rare', value: 'very rare' },
  { title: 'Legendary', value: 'legendary' },
  { title: 'Artifact', value: 'artifact' },
]

// Attunement options
const attunementOptions = [
  { title: 'Requires Attunement', value: 'yes' },
  { title: 'No Attunement', value: 'no' },
]

// Get all magic items
const allMagicItems = computed(() => 
  itemsStore.items.filter(item => item.type === ITEM_TYPE)
)

// Get available item types from existing items
const availableItemTypes = computed(() => {
  const types = new Set<string>()
  allMagicItems.value.forEach(item => {
    const itemType = item.data?.itemType
    if (itemType && typeof itemType === 'string') {
      types.add(itemType)
    }
  })
  return Array.from(types).sort()
})


// Filtered items
const filteredItems = computed(() => {
  let items = [...allMagicItems.value]
  
  // Filter by rarity
  if (filterRarity.value) {
    items = items.filter(item => item.data?.rarity === filterRarity.value)
  }
  
  // Filter by attunement
  if (filterAttunement.value) {
    const requiresAttunement = filterAttunement.value === 'yes'
    items = items.filter(item => Boolean(item.data?.attunement) === requiresAttunement)
  }
  
  // Filter by item type
  if (selectedItemType.value) {
    items = items.filter(item => item.data?.itemType === selectedItemType.value)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.data?.effect?.toLowerCase().includes(query)
    )
  }
  
  // Filter by tags
  if (filterTags.value.length > 0) {
    items = items.filter(item =>
      item.tags?.some(tag => filterTags.value.includes(tag.id))
    )
  }
  
  // Sort by rarity value, then by name
  const rarityOrder = { 'common': 0, 'uncommon': 1, 'rare': 2, 'very rare': 3, 'legendary': 4, 'artifact': 5 }
  return items.sort((a, b) => {
    const rarityA = rarityOrder[a.data?.rarity as keyof typeof rarityOrder] ?? -1
    const rarityB = rarityOrder[b.data?.rarity as keyof typeof rarityOrder] ?? -1
    const rarityDiff = rarityB - rarityA
    if (rarityDiff !== 0) return rarityDiff
    return a.name.localeCompare(b.name)
  })
})

// Load items
onMounted(async () => {
  if (libraryId.value) {
    try {
      await itemsStore.fetchItems(libraryId.value)
    } catch (error) {
      toast.error('Failed to load magic items')
    }
  }
})

// Reload items when library changes
watch(libraryId, async (newId) => {
  if (newId) {
    try {
      await itemsStore.fetchItems(newId)
    } catch (error) {
      toast.error('Failed to load magic items')
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
  console.log('Item created:', item.name)
}

function handleItemUpdated(item: LibraryItem) {
  // Item already updated in store by ItemDialog
  console.log('Item updated:', item.name)
  editingItem.value = null
}

async function deleteItemConfirmed(item: LibraryItem) {
  if (!libraryId.value) return

  try {
    await itemsStore.deleteItem(libraryId.value, item.id)
    toast.success('Item deleted successfully')
  } catch (error) {
    toast.error('Failed to delete item')
  }
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>

