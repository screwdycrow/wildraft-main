<template>
  <div>
    <page-top-bar
      title="All Content"
      icon="mdi-bookshelf"
      description="Browse and manage all content in this library"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <!-- Type Filter -->
        <v-select
          v-model="filterType"
          :items="availableTypes"
          label="Type"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="min-width: 200px;"
        />
        
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

    <!-- Search and Filters -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Search all content"
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
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <v-row v-if="itemsStore.isLoading && itemsStore.items.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading content...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!itemsStore.isLoading && filteredItems.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-bookshelf" size="120" color="primary" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold text-white mb-4">
            {{ searchQuery || filterTags.length > 0 || filterType ? 'No content found' : 'No Content Yet' }}
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            {{ searchQuery || filterTags.length > 0 || filterType
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first content to get started with your library.' 
            }}
          </p>
          <v-menu v-if="canEdit && !searchQuery && filterTags.length === 0 && !filterType">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="primary"
                size="x-large"
                prepend-icon="mdi-plus"
              >
                Create Your First Content
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
              </v-list-item>
            </v-list>
          </v-menu>
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
      :item-type="editingItem?.type || creatingType!"
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
            This will permanently remove this item and all its data. This action cannot be undone.
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
import { useItemComponents } from '@/composables/useItemComponents'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TagSelector from '@/components/tags/TagSelector.vue'
import { ItemCardWrapper, ItemDialog } from '@/components/items'
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
const showFormDialog = ref(false)
const showDeleteDialog = ref(false)
const editingItem = ref<LibraryItem | null>(null)
const deletingItem = ref<LibraryItem | null>(null)
const isDeleting = ref(false)
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

// Filtered items
const filteredItems = computed(() => {
  let items = [...itemsStore.items]
  
  // Filter by type
  if (filterType.value) {
    items = items.filter(item => item.type === filterType.value)
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

function confirmDelete(item: LibraryItem) {
  deletingItem.value = item
  showDeleteDialog.value = true
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

