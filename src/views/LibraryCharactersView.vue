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

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
      :has-filters="!!hasFilters"
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

const ITEM_TYPE = 'CHARACTER_DND_5E' as const

const searchQuery = ref('')
const filterTags = ref<number[]>([])
const filterLevel = ref<number | null>(null)
const filterClass = ref<string | null>(null)
const selectedRace = ref<string | null>(null)
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
    name: 'CharacterView',
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

async function handleDeleteConfirmed(item: LibraryItem) {
  if (!libraryId.value) return

  try {
    await itemsStore.deleteItem(libraryId.value, item.id)
    toast.success('Character deleted successfully')
  } catch (error) {
    toast.error('Failed to delete character')
  }
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>

