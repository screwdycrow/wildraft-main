<template>
  <div>
    <page-top-bar
      title="All Content"
      icon="mdi-bookshelf"
      description="Browse and manage all content in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #search>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search all content..."
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

        <!-- Type Filter -->
        <v-select
          v-model="filterType"
          :items="availableTypes"
          label="Type"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 180px;"
        />

        <!-- Magic Item Filters (only show when filtering by magic items or when there are magic items) -->
        <template v-if="!filterType || filterType === 'MAGIC_ITEM_DND_5E'">
          <!-- Rarity Filter -->
          <v-select
            v-if="availableRarities.length > 0"
            v-model="filterRarity"
            :items="availableRarities"
            label="Rarity"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="min-width: 140px;"
          />

          <!-- Item Type Filter -->
          <v-select
            v-if="availableItemTypes.length > 0"
            v-model="filterItemType"
            :items="availableItemTypes"
            label="Item Type"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="min-width: 150px;"
          />

          <!-- Attunement Filter -->
          <v-select
            v-if="allMagicItems.length > 0"
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
      </template>

      <template #actions>
        <!-- Create Button -->
        <v-menu v-if="canEdit">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="primary"
              prepend-icon="mdi-plus"
            >
              Create Item
            </v-btn>
          </template>
          <v-list class="glass-menu">
            <v-list-item
              v-for="type in creatableTypes"
              :key="type.value"
              @click="openCreateDialog(type.value)"
            >
              <template #prepend>
                <v-icon :icon="type.icon" :color="type.color" />
              </template>
              <v-list-item-title>{{ type.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ type.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </page-top-bar>

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="itemsStore.isLoading && itemsStore.items.length === 0"
      :can-create="canEdit"
      :library-id="libraryId"
      item-type-name="item"
      item-type-name-plural="items"
      empty-icon="mdi-bookshelf"
      empty-icon-color="primary"
      empty-title="No Content Yet"
      empty-message="Create your first content to get started with your library."
      create-button-text="Create Your First Content"
      @create="openCreateDialogDefault"
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
      :item-type="editingItem?.type || creatingType!"
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
import { useItemComponents } from '@/composables/useItemComponents'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TagSelector from '@/components/tags/TagSelector.vue'
import { ItemGridList, ItemDialog } from '@/components/items'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { LibraryItem, ItemType } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const toast = useToast()
const { getItemTypeInfo, getItemTypesForTemplate, getUniversalItemTypes } = useItemComponents()

const searchQuery = ref('')
const filterType = ref<string | null>(null)
const filterTags = ref<number[]>([])
const filterRarity = ref<string | null>(null)
const filterItemType = ref<string | null>(null)
const filterAttunement = ref<string | null>(null)
const showFormDialog = ref(false)
const editingItem = ref<LibraryItem | null>(null)
const creatingType = ref<ItemType | null>(null)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'All Content' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

// Get available types for this library
const availableTypes = computed(() => {
  if (!libraryStore.currentLibrary) return []
  
  const template = libraryStore.currentLibrary.template || 'DEFAULT'
  const templateTypes = getItemTypesForTemplate(template)
  const universalTypes = getUniversalItemTypes()
  const allTypes = [...templateTypes, ...universalTypes]
  
  return allTypes.map(type => {
    const info = getItemTypeInfo(type)
    return {
      title: info.label,
      value: type,
      icon: info.icon,
      color: info.color,
    }
  })
})

const creatableTypes = computed(() => {
  return availableTypes.value.map(type => ({
    ...type,
    description: `Create a new ${type.title.toLowerCase()}`,
  }))
})

// Get all magic items
const allMagicItems = computed(() => 
  itemsStore.items.filter(item => item.type === 'MAGIC_ITEM_DND_5E')
)

// Get available rarities from existing magic items
const availableRarities = computed(() => {
  const rarities = new Set<string>()
  allMagicItems.value.forEach(item => {
    const rarity = item.data?.rarity
    if (rarity && typeof rarity === 'string') {
      rarities.add(rarity)
    }
  })
  return Array.from(rarities).sort()
})

// Get available item types from existing magic items
const availableItemTypes = computed(() => {
  const itemTypes = new Set<string>()
  allMagicItems.value.forEach(item => {
    const itemType = item.data?.itemType
    if (itemType && typeof itemType === 'string') {
      itemTypes.add(itemType)
    }
  })
  return Array.from(itemTypes).sort()
})

// Attunement filter options
const attunementOptions = [
  { title: 'Requires Attunement', value: 'yes' },
  { title: 'No Attunement', value: 'no' },
]

// Filtered items
const filteredItems = computed(() => {
  let items = [...itemsStore.items]
  
  // Filter by type
  if (filterType.value) {
    items = items.filter(item => item.type === filterType.value)
  }
  
  // Filter by rarity (for magic items)
  if (filterRarity.value) {
    items = items.filter(item => item.data?.rarity === filterRarity.value)
  }
  
  // Filter by item type (for magic items)
  if (filterItemType.value) {
    items = items.filter(item => item.data?.itemType === filterItemType.value)
  }
  
  // Filter by attunement (for magic items)
  if (filterAttunement.value) {
    const requiresAttunement = filterAttunement.value === 'yes'
    items = items.filter(item => item.data?.attunement === requiresAttunement)
  }
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }
  
  // Filter by tags
  if (filterTags.value.length > 0) {
    items = items.filter(item =>
      item.tags?.some(tag => filterTags.value.includes(tag.id))
    )
  }
  
  return items
})

// Load items
onMounted(async () => {
  if (libraryId.value) {
    try {
      await itemsStore.fetchItems(libraryId.value)
    } catch (error) {
      toast.error('Failed to load items')
    }
  }
})

// Reload items when library changes
watch(libraryId, async (newId) => {
  if (newId) {
    try {
      await itemsStore.fetchItems(newId)
    } catch (error) {
      toast.error('Failed to load items')
    }
  }
})

// Item actions
function openCreateDialog(type: ItemType) {
  creatingType.value = type
  editingItem.value = null
  showFormDialog.value = true
}

function openCreateDialogDefault() {
  // For the empty state button, open the first available type
  if (availableTypes.value.length > 0) {
    openCreateDialog(availableTypes.value[0].value as ItemType)
  }
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
  creatingType.value = null
  showFormDialog.value = true
}

function handleItemCreated(item: LibraryItem) {
  // Item already added to store by ItemDialog
  console.log('Item created:', item.name)
  creatingType.value = null
}

function handleItemUpdated(item: LibraryItem) {
  // Item already updated in store by ItemDialog
  console.log('Item updated:', item.name)
  editingItem.value = null
  creatingType.value = null
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

async function handleRefresh() {
  if (libraryId.value) {
    try {
      await itemsStore.fetchItems(libraryId.value)
    } catch (error) {
      toast.error('Failed to refresh items')
    }
  }
}

function handleAddTag() {
  // Emit event to parent or open tag creation dialog
  // This can be implemented based on your tag creation flow
  console.log('Add tag requested')
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>

