<template>
  <div>
    <page-top-bar
      :title="tagName || 'Tag Items'"
      icon="mdi-tag"
      :description="tagDescription"
      :breadcrumbs="breadcrumbs"
    >
      <template #search>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search items..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
        />
      </template>

      <template #filters>
        <!-- View Controls -->
        <view-controls
          v-model:view-mode="viewMode"
          v-model:group-by="groupBy"
        />
      </template>

      <template #actions>
        <quick-actions :initial-tag-ids="tagId ? [tagId] : undefined" />
      </template>
    </page-top-bar>

    <!-- Items Grid -->
    <item-grid-list
      :items="filteredItems"
      :is-loading="isLoading"
      :can-create="canEdit"
      :library-id="libraryId"
      :view-mode="viewMode"
      :group-by="groupBy"
      :collapsed-groups="collapsedGroups"
      item-type-name="item"
      item-type-name-plural="items"
      empty-icon="mdi-tag-off"
      empty-icon-color="primary"
      empty-title="No Items with This Tag"
      empty-message="This tag doesn't have any items yet."
      @view="viewItem"
      @edit="editItem"
      @delete="deleteItemConfirmed"
      @refresh="handleRefresh"
      @add-tag="handleAddTag"
      @create="openCreateDialog"
      @update:collapsed-groups="collapsedGroups = $event"
    />

    <!-- Create/Edit Dialog -->
    <item-dialog
      v-model="showFormDialog"
      :library-id="libraryId!"
      :item="editingItem"
      :item-type="editingItem?.type || creatingType!"
      :initial-tag-ids="editingItem ? undefined : (tagId ? [tagId] : undefined)"
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
import { useTagsStore } from '@/stores/tags'
import { useToast } from 'vue-toastification'
import { useViewPreferences } from '@/composables/useViewPreferences'
import PageTopBar from '@/components/common/PageTopBar.vue'
import QuickActions from '@/components/common/QuickActions.vue'
import ViewControls from '@/components/common/ViewControls.vue'
import { ItemGridList, ItemDialog } from '@/components/items'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { LibraryItem, ItemType } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const tagsStore = useTagsStore()
const toast = useToast()

// View preferences with localStorage persistence (global for all library views)
const { viewMode, groupBy, collapsedGroups } = useViewPreferences('tag-library-items')

const searchQuery = ref('')
const showFormDialog = ref(false)
const editingItem = ref<LibraryItem | null>(null)
const creatingType = ref<ItemType | null>(null)
const isLoading = ref(false)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const tagId = computed(() => {
  const id = route.params.tagId
  return id ? Number(id) : null
})

const tagName = computed(() => {
  // Get tag from the cached tags array (no need to fetch)
  if (tagId.value) {
    const tag = tagsStore.getTagById(tagId.value)
    return tag?.name || 'Tag'
  }
  return 'Tag'
})

const tagDescription = computed(() => {
  return `Items tagged with "${tagName.value}"`
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'Tags', to: { name: 'LibraryTags', params: { id: libraryId.value } } },
    { text: tagName.value }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

// Get items for this tag - filter items from store by tag ID
const tagItems = computed(() => {
  if (!tagId.value) return []
  
  // Filter items that have this tag
  return itemsStore.items.filter(item => 
    item.tags?.some(tag => tag.id === tagId.value)
  )
})

// Filtered items based on search
const filteredItems = computed(() => {
  let items = [...tagItems.value]
  
  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    )
  }
  
  return items
})

// Load tag info and items (only if not already cached)
onMounted(async () => {
  if (libraryId.value && tagId.value) {
    isLoading.value = true
    try {
      // Ensure tags are loaded (for tag name in breadcrumbs)
      if (tagsStore.tags.length === 0 || !tagsStore.getTagById(tagId.value)) {
        await tagsStore.fetchTags(libraryId.value)
      }
      
      // No need to fetch tag - we can get it from cache via getTagById
      
      // Only fetch items if not already loaded for this library
      if (!itemsStore.isAlreadyLoaded(libraryId.value)) {
        await itemsStore.fetchItems(libraryId.value)
      }
    } catch (error) {
      toast.error('Failed to load tag items')
    } finally {
      isLoading.value = false
    }
  }
})

// Reload when tag or library changes (only if not already cached)
watch([libraryId, tagId], async ([newLibraryId, newTagId], [oldLibraryId, oldTagId]) => {
  if (newLibraryId && newTagId) {
    isLoading.value = true
    try {
      // Ensure tags are loaded
      if (tagsStore.tags.length === 0 || !tagsStore.getTagById(newTagId)) {
        await tagsStore.fetchTags(newLibraryId)
      }
      
      // No need to fetch tag - we can get it from cache via getTagById
      // The tagName computed property will automatically use the cached tag
      
      // Only fetch items if not already loaded for this library
      if (!itemsStore.isAlreadyLoaded(newLibraryId)) {
        await itemsStore.fetchItems(newLibraryId)
      }
    } catch (error) {
      toast.error('Failed to load tag items')
    } finally {
      isLoading.value = false
    }
  }
})

// Item actions
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
  // Items are automatically filtered by tag in the computed property
}

function handleItemUpdated(item: LibraryItem) {
  // Item already updated in store by ItemDialog
  console.log('Item updated:', item.name)
  editingItem.value = null
  creatingType.value = null
  // Items are automatically filtered by tag in the computed property
}

async function deleteItemConfirmed(item: LibraryItem) {
  if (!libraryId.value) return

  try {
    await itemsStore.deleteItem(libraryId.value, item.id)
    toast.success('Item deleted successfully')
    // Item is automatically removed from the filtered list
  } catch (error) {
    toast.error('Failed to delete item')
  }
}

async function handleRefresh() {
  if (libraryId.value && tagId.value) {
    isLoading.value = true
    try {
      // Force refresh on manual refresh
      await itemsStore.fetchItems(libraryId.value, undefined, true)
      // Also refresh tags in case tag info changed
      await tagsStore.fetchTags(libraryId.value)
    } catch (error) {
      toast.error('Failed to refresh items')
    } finally {
      isLoading.value = false
    }
  }
}

function handleAddTag() {
  // Emit event to parent or open tag creation dialog
  console.log('Add tag requested')
}

function openCreateDialog() {
  // Open create dialog with default type (NOTE)
  // User can change the type in the dialog if needed
  creatingType.value = 'NOTE'
  editingItem.value = null
  showFormDialog.value = true
}
</script>

<style scoped>
/* Styles moved to ItemGridList component */
</style>
