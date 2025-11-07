<template>
  <div>
    <page-top-bar
      title="Stat Blocks"
      icon="mdi-sword-cross"
      description="Browse and manage all stat blocks in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <!-- CR Filter -->
        <v-select
          v-model="filterCR"
          :items="crOptions"
          label="Challenge Rating"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 200px;"
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
          style="min-width: 180px;"
        />
        
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

    <!-- Search and Filters -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search stat blocks"
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
        <v-row v-if="availableTypes.length > 0">
          <v-col cols="12">
            <v-chip-group
              v-model="selectedType"
              filter
              selected-class="text-primary"
            >
              <v-chip
                v-for="type in availableTypes"
                :key="type"
                :value="type"
                variant="outlined"
              >
                {{ type }}
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
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading stat blocks...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!itemsStore.isLoading && filteredItems.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-sword-cross" size="120" color="error" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold text-white mb-4">
            {{ hasFilters ? 'No stat blocks found' : 'No Stat Blocks Yet' }}
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            {{ hasFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first stat block to start building your bestiary of creatures and NPCs.' 
            }}
          </p>
          <v-btn
            v-if="canEdit && !hasFilters"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First Stat Block
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stat Blocks Grid -->
    <v-row v-else>
      <v-col
        v-for="item in filteredItems"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <component
          :is="getItemCard(item.type)"
          :item="item"
          :show-actions="canEdit"
          @click="viewItem(item)"
          @edit="editItem(item)"
          @delete="confirmDelete(item)"
        />
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="showFormDialog" max-width="1200" scrollable persistent>
      <component
        :is="getCurrentForm"
        :item="editingItem"
        :library-id="libraryId!"
        @submit="handleCreateOrUpdate"
        @cancel="closeFormDialog"
      />
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Stat Block?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            This will permanently remove this stat block and all its data. This action cannot be undone.
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
            Delete Stat Block
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
import { useItemComponents } from '@/composables/useItemComponents'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TagSelector from '@/components/tags/TagSelector.vue'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const toast = useToast()
const { getItemComponent } = useItemComponents()

const ITEM_TYPE = 'STAT_BLOCK_DND_5E' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const filterCR = ref<string | null>(null)
const filterSize = ref<string | null>(null)
const selectedType = ref<string | null>(null)
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

const hasFilters = computed(() => 
  searchQuery.value || 
  filterTags.value.length > 0 || 
  filterCR.value !== null || 
  filterSize.value !== null || 
  selectedType.value !== null
)

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

// Dynamic component getters
const getItemCard = (itemType: string) => {
  return getItemComponent(itemType, 'card')
}

const getCurrentForm = computed(() => {
  return getItemComponent(ITEM_TYPE, 'form')
})

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

function confirmDelete(item: LibraryItem) {
  deletingItem.value = item
  showDeleteDialog.value = true
}

async function handleCreateOrUpdate(
  data: CreateLibraryItemPayload | UpdateLibraryItemPayload,
  callback?: (success: boolean) => void
) {
  if (!libraryId.value) return

  try {
    if (editingItem.value) {
      await itemsStore.updateItem(libraryId.value, editingItem.value.id, data as UpdateLibraryItemPayload)
      toast.success('Stat block updated successfully!')
    } else {
      await itemsStore.createItem(libraryId.value, data as CreateLibraryItemPayload)
      toast.success('Stat block created successfully!')
    }
    closeFormDialog()
    callback?.(true)
  } catch (error) {
    toast.error(editingItem.value ? 'Failed to update stat block' : 'Failed to create stat block')
    callback?.(false)
  }
}

function closeFormDialog() {
  showFormDialog.value = false
  editingItem.value = null
}

async function deleteItemConfirmed() {
  if (!deletingItem.value || !libraryId.value) return

  isDeleting.value = true
  try {
    await itemsStore.deleteItem(libraryId.value, deletingItem.value.id)
    toast.success('Stat block deleted successfully')
    showDeleteDialog.value = false
    deletingItem.value = null
  } catch (error) {
    toast.error('Failed to delete stat block')
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

