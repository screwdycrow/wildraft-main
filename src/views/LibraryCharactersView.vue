<template>
  <div>
    <page-top-bar
      title="Characters"
      icon="mdi-account-circle"
      description="Browse and manage all characters in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <!-- Level Filter -->
        <v-select
          v-model="filterLevel"
          :items="levelOptions"
          label="Level"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 150px;"
        />
        
        <!-- Class Filter -->
        <v-select
          v-model="filterClass"
          :items="availableClasses"
          label="Class"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 200px;"
        />
        
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

    <!-- Search and Filters -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search characters"
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
        <v-row v-if="availableRaces.length > 0">
          <v-col cols="12">
            <v-chip-group
              v-model="selectedRace"
              filter
              selected-class="text-primary"
            >
              <v-chip
                v-for="race in availableRaces"
                :key="race"
                :value="race"
                variant="outlined"
              >
                {{ race }}
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
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading characters...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!itemsStore.isLoading && filteredItems.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-account-circle" size="120" color="success" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold text-white mb-4">
            {{ hasFilters ? 'No characters found' : 'No Characters Yet' }}
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            {{ hasFilters
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first character to start building your party or NPC roster.' 
            }}
          </p>
          <v-btn
            v-if="canEdit && !hasFilters"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First Character
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Characters Grid -->
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
          Delete Character?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            This will permanently remove this character and all its data. This action cannot be undone.
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
            Delete Character
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

const ITEM_TYPE = 'CHARACTER_DND_5E' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const filterLevel = ref<number | null>(null)
const filterClass = ref<string | null>(null)
const selectedRace = ref<string | null>(null)
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

// Get all characters
const allCharacters = computed(() => 
  itemsStore.items.filter(item => item.type === ITEM_TYPE)
)

// Get available classes from existing characters
const availableClasses = computed(() => {
  const classes = new Set<string>()
  allCharacters.value.forEach(char => {
    const charClass = char.data?.class
    if (charClass && typeof charClass === 'string') {
      classes.add(charClass)
    }
  })
  return Array.from(classes).sort().map(c => ({ title: c, value: c }))
})

// Get available races from existing characters
const availableRaces = computed(() => {
  const races = new Set<string>()
  allCharacters.value.forEach(char => {
    const race = char.data?.race
    if (race && typeof race === 'string') {
      races.add(race)
    }
  })
  return Array.from(races).sort()
})

const hasFilters = computed(() => 
  searchQuery.value || 
  filterTags.value.length > 0 || 
  filterLevel.value !== null || 
  filterClass.value !== null || 
  selectedRace.value !== null
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
  if (selectedRace.value) {
    items = items.filter(item => item.data?.race === selectedRace.value)
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
      toast.error('Failed to load characters')
    }
  }
})

// Reload items when library changes
watch(libraryId, async (newId) => {
  if (newId) {
    try {
      await itemsStore.fetchItems(newId)
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
      toast.success('Character updated successfully!')
    } else {
      await itemsStore.createItem(libraryId.value, data as CreateLibraryItemPayload)
      toast.success('Character created successfully!')
    }
    closeFormDialog()
    callback?.(true)
  } catch (error) {
    toast.error(editingItem.value ? 'Failed to update character' : 'Failed to create character')
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
    toast.success('Character deleted successfully')
    showDeleteDialog.value = false
    deletingItem.value = null
  } catch (error) {
    toast.error('Failed to delete character')
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

