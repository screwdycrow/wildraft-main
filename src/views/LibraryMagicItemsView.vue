<template>
  <div>
    <page-top-bar
      title="Magic Items"
      icon="mdi-treasure-chest"
      description="Browse and manage all magic items in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <!-- Rarity Filter -->
        <v-select
          v-model="filterRarity"
          :items="rarityOptions"
          label="Rarity"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 200px;"
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
          style="min-width: 180px;"
        />
        
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

    <!-- Search and Filters -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search magic items"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="6">
            <tag-selector
              v-model="filterTags"
              :library-id="libraryId!"
              hint=""
              :show-add-button="false"
            />
          </v-col>
        </v-row>
        <v-row v-if="availableItemTypes.length > 0">
          <v-col cols="12">
            <v-chip-group
              v-model="selectedItemType"
              filter
              selected-class="text-primary"
            >
              <v-chip
                v-for="itemType in availableItemTypes"
                :key="itemType"
                :value="itemType"
                variant="outlined"
              >
                {{ itemType }}
              </v-chip>
            </v-chip-group>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <v-row v-if="itemsStore.isLoading && itemsStore.items.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading magic items...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!itemsStore.isLoading && filteredItems.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-treasure-chest" size="120" color="amber" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold text-white mb-4">
            {{ hasFilters ? 'No items found' : 'No Magic Items Yet' }}
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            {{ hasFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first magic item to build your treasure hoard.' 
            }}
          </p>
          <v-btn
            v-if="canEdit && !hasFilters"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First Item
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Items Grid -->
    <v-row v-else>
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
          @view="viewItem(item)"
          @edit="editItem(item)"
          @delete="confirmDelete(item)"
        />
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <item-dialog
      v-model="showFormDialog"
      :library-id="libraryId!"
      :item="editingItem"
      :item-type="ITEM_TYPE"
      @created="handleItemCreated"
      @updated="handleItemUpdated"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Item?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            This will permanently remove this magic item and all its data. This action cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteItemConfirmed"
            :loading="isDeleting"
          >
            Delete Item
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import { ItemCardWrapper, ItemDialog } from '@/components/items'
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
const showDeleteDialog = ref(false)
const editingItem = ref<LibraryItem | null>(null)
const deletingItem = ref<LibraryItem | null>(null)
const isDeleting = ref(false)

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
  { title: 'Requires Attunement', value: 'true' },
  { title: 'No Attunement', value: 'false' },
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

const hasFilters = computed(() => 
  searchQuery.value || 
  filterTags.value.length > 0 || 
  filterRarity.value !== null || 
  filterAttunement.value !== null || 
  selectedItemType.value !== null
)

// Filtered items
const filteredItems = computed(() => {
  let items = [...allMagicItems.value]
  
  // Filter by rarity
  if (filterRarity.value) {
    items = items.filter(item => item.data?.rarity === filterRarity.value)
  }
  
  // Filter by attunement
  if (filterAttunement.value) {
    const requiresAttunement = filterAttunement.value === 'true'
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

function confirmDelete(item: LibraryItem) {
  deletingItem.value = item
  showDeleteDialog.value = true
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

async function deleteItemConfirmed() {
  if (!deletingItem.value || !libraryId.value) return

  isDeleting.value = true
  try {
    await itemsStore.deleteItem(libraryId.value, deletingItem.value.id)
    toast.success('Item deleted successfully')
    showDeleteDialog.value = false
    deletingItem.value = null
  } catch (error) {
    toast.error('Failed to delete item')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.empty-icon {
  opacity: 0.5;
}

.float-animation {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>

