<template>
  <div class="item-grid-list">
    <!-- Loading State -->
    <div 
      v-if="isLoading && items.length === 0" 
      class="items-grid loading-grid"
    >
    <MasonryGrid>
      <MasonryGridItem>
        <v-skeleton-loader
          class="skeleton-card glass-card"
            type="card"
          />
        </MasonryGridItem>
      </MasonryGrid>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && items.length === 0">
      <v-card class="glass-card pa-12 text-center" elevation="0">
        <v-icon :icon="emptyIcon" size="120" :color="emptyIconColor" class="mb-6 empty-icon float-animation" />
        <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
          {{ emptyTitle }}
        </h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
          {{ emptyMessage }}
        </p>
        <v-btn
          v-if="canCreate"
          color="primary"
          size="x-large"
          prepend-icon="mdi-plus"
          @click="$emit('create')"
        >
          {{ createButtonText }}
        </v-btn>
      </v-card>
    </div>

    <!-- Items Grid -->
    <MasonryGrid
      v-else
      class="items-grid"
      :columns="masonryColumns"
      :gutter="masonryGutter"
    >
      <MasonryGridItem
        v-for="item in items"
        :key="item.id"
        class="grid-item"
      >
        <lazy-item-card
          :item="item"
          :selected="selectedItems.has(item.id)"
          :selection-mode="selectionMode"
          @view="$emit('view', item)"
          @edit="$emit('edit', item)"
          @delete="handleDelete(item)"
          @select="(emittedItem, ctrlKey, metaKey) => handleItemSelect(emittedItem, ctrlKey, metaKey)"
          @contextmenu="handleContextMenu($event, item)"
        />
      </MasonryGridItem>
    </MasonryGrid>

    <!-- Mass Edit Dialog -->
    <v-dialog v-model="showMassEditDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-tag-multiple" color="primary" size="32" class="mr-3" />
          Add Tags to {{ selectedItems.size }} {{ selectedItems.size === 1 ? props.itemTypeName : props.itemTypeNamePlural }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <tag-selector
            v-if="props.libraryId"
            v-model="selectedTagIds"
            :library-id="props.libraryId"
            label="Select Tags"
            hint="Tags will be added to all selected items"
            :show-add-button="true"
            @add-tag="$emit('add-tag')"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showMassEditDialog = false"
            :disabled="isMassEditing"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="confirmMassEdit"
            :loading="isMassEditing"
            :disabled="selectedTagIds.length === 0"
          >
            Add Tags
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Mass Remove Tags Dialog -->
    <v-dialog v-model="showMassRemoveTagsDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-tag-remove" color="warning" size="32" class="mr-3" />
          Remove Tags from {{ selectedItems.size }} {{ selectedItems.size === 1 ? props.itemTypeName : props.itemTypeNamePlural }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <tag-selector
            v-if="props.libraryId"
            v-model="tagsToRemoveIds"
            :library-id="props.libraryId"
            label="Select Tags to Remove"
            hint="Selected tags will be removed from all selected items"
            :show-add-button="false"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showMassRemoveTagsDialog = false"
            :disabled="isMassRemovingTags"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="confirmMassRemoveTags"
            :loading="isMassRemovingTags"
            :disabled="tagsToRemoveIds.length === 0"
          >
            Remove Tags
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Context Menu -->
    <v-overlay
      v-model="showContextMenu"
      class="context-menu-overlay"
      :style="{ zIndex: 2000 }"
      @click="showContextMenu = false"
    >
      <v-card
        class="glass-card context-menu-card"
        :style="{
          position: 'fixed',
          left: contextMenuLocation.x + 'px',
          top: contextMenuLocation.y + 'px',
          minWidth: '200px'
        }"
        @click.stop
      >
        <v-list density="compact">
          <v-list-item
            v-if="selectedItems.size === 1"
            prepend-icon="mdi-tag-edit"
            title="Edit Tags"
            @click="openSingleEditTagsDialog"
          />
          <v-list-item
            v-if="selectedItems.size > 1"
            prepend-icon="mdi-tag-plus"
            title="Add Tags"
            @click="openMassEditDialog"
          />
          <v-list-item
            v-if="selectedItems.size > 1"
            prepend-icon="mdi-tag-remove"
            title="Remove Tags"
            @click="openMassRemoveTagsDialog"
          />
          <v-list-item
            prepend-icon="mdi-delete"
            title="Delete Selected"
            :disabled="selectedItems.size === 0"
            @click="openMassDeleteDialog"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-selection-off"
            title="Clear Selection"
            :disabled="selectedItems.size === 0"
            @click="clearSelection"
          />
        </v-list>
      </v-card>
    </v-overlay>

    <!-- Single Item Edit Tags Dialog -->
    <v-dialog v-model="showSingleEditTagsDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-tag-edit" color="primary" size="32" class="mr-3" />
          Edit Tags - {{ editingTagsItem?.name }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <tag-selector
            v-if="props.libraryId && editingTagsItem"
            v-model="singleItemTagIds"
            :library-id="props.libraryId"
            label="Tags"
            hint="Select or deselect tags for this item"
            :show-add-button="true"
            @add-tag="$emit('add-tag')"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showSingleEditTagsDialog = false"
            :disabled="isEditingSingleItemTags"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="confirmSingleEditTags"
            :loading="isEditingSingleItemTags"
          >
            Save Tags
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Mass Delete Confirmation Dialog -->
    <v-dialog v-model="showMassDeleteDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete {{ selectedItems.size }} {{ selectedItems.size === 1 ? props.itemTypeName : props.itemTypeNamePlural }}?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ selectedItems.size }}</strong> {{ selectedItems.size === 1 ? props.itemTypeName : props.itemTypeNamePlural }}?
          </p>
          <v-alert type="error" variant="tonal" density="compact" icon="mdi-alert">
            This will permanently remove {{ selectedItems.size === 1 ? 'this ' + props.itemTypeName : 'these ' + props.itemTypeNamePlural }} and all {{ selectedItems.size === 1 ? 'its' : 'their' }} data. This action cannot be undone.
          </v-alert>
          <div v-if="selectedItems.size > 0 && selectedItems.size <= 10" class="mt-4">
            <p class="text-body-2 mb-2 font-weight-medium">Items to be deleted:</p>
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="itemId in Array.from(selectedItems)"
                :key="itemId"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon icon="mdi-circle-small" size="small" />
                </template>
                <v-list-item-title class="text-body-2">
                  {{ getItemName(itemId) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showMassDeleteDialog = false"
            :disabled="isMassDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmMassDelete"
            :loading="isMassDeleting"
          >
            Delete {{ selectedItems.size }} {{ selectedItems.size === 1 ? props.itemTypeName : props.itemTypeNamePlural }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Single Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          {{ deleteDialogTitle }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            {{ deleteWarningMessage }}
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
            @click="confirmDelete"
            :loading="isDeleting"
          >
            {{ deleteButtonText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LibraryItem, Tag } from '@/types/item.types'
import LazyItemCard from './LazyItemCard.vue'
import TagSelector from '@/components/tags/TagSelector.vue'
import { MasonryGrid, MasonryGridItem } from 'vue3-masonry-css'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'

interface Props {
  items: LibraryItem[]
  isLoading?: boolean
  canCreate?: boolean
  itemTypeName?: string
  itemTypeNamePlural?: string
  emptyIcon?: string
  emptyIconColor?: string
  emptyTitle?: string
  emptyMessage?: string
  createButtonText?: string
  skeletonCount?: number
  libraryId?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  canCreate: true,
  itemTypeName: 'item',
  itemTypeNamePlural: 'items',
  emptyIcon: 'mdi-bookshelf',
  emptyIconColor: 'primary',
  emptyTitle: 'No Items Yet',
  emptyMessage: 'Create your first item to get started.',
  createButtonText: 'Create Your First Item',
  skeletonCount: 6,
})

const emit = defineEmits<{
  create: []
  view: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
  'add-tag': []
  refresh: []
}>()

const itemsStore = useItemsStore()
const toast = useToast()

// Selection state
const selectedItems = ref<Set<number>>(new Set())
const lastSelectedIndex = ref<number | null>(null)
const isCtrlClickSelection = ref(false) // Track if selection was made via Ctrl+Click
const selectionMode = computed(() => {
  // Show selection mode if 2+ items selected OR if any item was selected via Ctrl+Click
  return selectedItems.value.size > 1 || (selectedItems.value.size > 0 && isCtrlClickSelection.value)
})

// Context menu state
const showContextMenu = ref(false)
const contextMenuLocation = ref({ x: 0, y: 0 })
const contextMenuItem = ref<LibraryItem | null>(null)

// Mass edit state
const showMassEditDialog = ref(false)
const selectedTagIds = ref<number[]>([])
const isMassEditing = ref(false)

// Mass remove tags state
const showMassRemoveTagsDialog = ref(false)
const tagsToRemoveIds = ref<number[]>([])
const isMassRemovingTags = ref(false)

// Single item edit tags state
const showSingleEditTagsDialog = ref(false)
const editingTagsItem = ref<LibraryItem | null>(null)
const singleItemTagIds = ref<number[]>([])
const isEditingSingleItemTags = ref(false)

// Mass delete state
const showMassDeleteDialog = ref(false)
const isMassDeleting = ref(false)

// Single delete state
const showDeleteDialog = ref(false)
const deletingItem = ref<LibraryItem | null>(null)
const isDeleting = ref(false)

const skeletonCount = computed(() => props.skeletonCount)

const masonryColumns = {
  default: 5,
  3840: 6,
  2560: 6,
  1920: 4,
  1600: 4,
  1280: 3,
  960: 2,
  600: 1,
}

const masonryGutter = {
  default: '20px',
  3840: '24px',
  2560: '20px',
  1920: '16px',
  1600: '16px',
  1280: '12px',
  960: '12px',
  600: '12px',
}

const deleteDialogTitle = computed(() => {
  return `Delete ${props.itemTypeName.charAt(0).toUpperCase() + props.itemTypeName.slice(1)}?`
})

const deleteWarningMessage = computed(() => {
  return `This will permanently remove this ${props.itemTypeName} and all its data. This action cannot be undone.`
})

const deleteButtonText = computed(() => {
  return `Delete ${props.itemTypeName.charAt(0).toUpperCase() + props.itemTypeName.slice(1)}`
})

function handleItemSelect(item: LibraryItem, ctrlKey: boolean, metaKey: boolean) {
  const itemIndex = props.items.findIndex(i => i.id === item.id)
  
  // Check for Ctrl/Cmd key
  const isCtrlClick = !!(ctrlKey || metaKey)
  
  if (isCtrlClick) {
    // Ctrl/Cmd+Click: Toggle selection (multi-select)
    isCtrlClickSelection.value = true // Mark that we're using Ctrl+Click selection
    if (selectedItems.value.has(item.id)) {
      selectedItems.value.delete(item.id)
      if (selectedItems.value.size === 0) {
        lastSelectedIndex.value = null
        isCtrlClickSelection.value = false // Reset if no items selected
      } else if (lastSelectedIndex.value === itemIndex) {
        // Update last selected index if we removed it
        const remaining = Array.from(selectedItems.value)
        if (remaining.length > 0) {
          const remainingIndex = props.items.findIndex(i => i.id === remaining[0])
          lastSelectedIndex.value = remainingIndex >= 0 ? remainingIndex : null
        }
      }
    } else {
      selectedItems.value.add(item.id)
      lastSelectedIndex.value = itemIndex
    }
  } else {
    // Regular click: Single selection only (no multi-select)
    isCtrlClickSelection.value = false // Reset Ctrl+Click flag for regular clicks
    if (selectedItems.value.has(item.id) && selectedItems.value.size === 1) {
      // If this is the only selected item, deselect it
      selectedItems.value.clear()
      lastSelectedIndex.value = null
    } else {
      // Select only this item
      selectedItems.value.clear()
      selectedItems.value.add(item.id)
      lastSelectedIndex.value = itemIndex
    }
  }
}

function handleContextMenu(event: MouseEvent, item: LibraryItem) {
  event.preventDefault()
  event.stopPropagation()
  
  // If item is not selected, select it first
  if (!selectedItems.value.has(item.id)) {
    selectedItems.value.clear()
    selectedItems.value.add(item.id)
    const itemIndex = props.items.findIndex(i => i.id === item.id)
    lastSelectedIndex.value = itemIndex
  }
  
  contextMenuItem.value = item
  // Set menu location to cursor position
  contextMenuLocation.value = { x: event.clientX, y: event.clientY }
  showContextMenu.value = true
}

function clearSelection() {
  selectedItems.value.clear()
  lastSelectedIndex.value = null
  isCtrlClickSelection.value = false
  showContextMenu.value = false
}

function openMassEditDialog() {
  if (selectedItems.value.size === 0) return
  showContextMenu.value = false
  selectedTagIds.value = []
  showMassEditDialog.value = true
}

function openMassRemoveTagsDialog() {
  if (selectedItems.value.size === 0) return
  showContextMenu.value = false
  tagsToRemoveIds.value = []
  showMassRemoveTagsDialog.value = true
}

function openSingleEditTagsDialog() {
  if (selectedItems.value.size !== 1) return
  
  const itemId = Array.from(selectedItems.value)[0]
  const item = props.items.find((i: LibraryItem) => i.id === itemId)
  
  if (!item) return
  
  editingTagsItem.value = item
  singleItemTagIds.value = item.tags?.map((t: Tag) => t.id) || []
  showContextMenu.value = false
  showSingleEditTagsDialog.value = true
}

function openMassDeleteDialog() {
  if (selectedItems.value.size === 0) return
  showContextMenu.value = false
  showMassDeleteDialog.value = true
}

function getItemName(itemId: number): string {
  const item = props.items.find(i => i.id === itemId)
  return item?.name || `Item #${itemId}`
}

async function confirmMassEdit() {
  if (!props.libraryId || selectedItems.value.size === 0 || selectedTagIds.value.length === 0) {
    return
  }

  isMassEditing.value = true
  try {
    const itemIds = Array.from(selectedItems.value)
    await itemsStore.batchAddTags(props.libraryId, itemIds, selectedTagIds.value)
    
    toast.success(`Added ${selectedTagIds.value.length} tag(s) to ${itemIds.length} item(s)`)
    clearSelection()
    showMassEditDialog.value = false
    
    // Refresh items
    emit('refresh')
  } catch (error: any) {
    toast.error(error.message || 'Failed to add tags')
  } finally {
    isMassEditing.value = false
  }
}

async function confirmMassRemoveTags() {
  if (!props.libraryId || selectedItems.value.size === 0 || tagsToRemoveIds.value.length === 0) {
    return
  }

  isMassRemovingTags.value = true
  try {
    const itemIds = Array.from(selectedItems.value)
    const tagsToRemoveSet = new Set(tagsToRemoveIds.value)
    
    // Update each item to remove the selected tags
    const updatePromises = itemIds.map(async (itemId) => {
      const item = props.items.find((i: LibraryItem) => i.id === itemId)
      if (!item) return null
      
      // Get current tag IDs and filter out the ones to remove
      const currentTagIds = item.tags?.map((t: Tag) => t.id) || []
      const newTagIds = currentTagIds.filter((tagId: number) => !tagsToRemoveSet.has(tagId))
      
      // Update the item
      return itemsStore.updateItem(props.libraryId!, itemId, { tagIds: newTagIds })
    })
    
    await Promise.all(updatePromises)
    
    toast.success(`Removed ${tagsToRemoveIds.value.length} tag(s) from ${itemIds.length} item(s)`)
    clearSelection()
    showMassRemoveTagsDialog.value = false
    tagsToRemoveIds.value = []
    
    // Refresh items
    emit('refresh')
  } catch (error: any) {
    toast.error(error.message || 'Failed to remove tags')
  } finally {
    isMassRemovingTags.value = false
  }
}

async function confirmSingleEditTags() {
  if (!props.libraryId || !editingTagsItem.value) {
    return
  }

  isEditingSingleItemTags.value = true
  try {
    await itemsStore.updateItem(
      props.libraryId,
      editingTagsItem.value.id,
      { tagIds: singleItemTagIds.value }
    )
    
    toast.success('Tags updated successfully')
    showSingleEditTagsDialog.value = false
    editingTagsItem.value = null
    singleItemTagIds.value = []
    
    // Refresh items
    emit('refresh')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update tags')
  } finally {
    isEditingSingleItemTags.value = false
  }
}

async function confirmMassDelete() {
  if (!props.libraryId || selectedItems.value.size === 0) {
    return
  }

  isMassDeleting.value = true
  try {
    const itemIds = Array.from(selectedItems.value)
    
    // Delete items one by one, collecting results
    const results = await Promise.allSettled(
      itemIds.map(itemId => 
        itemsStore.deleteItem(props.libraryId!, itemId)
      )
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    if (failed === 0) {
      toast.success(`Deleted ${successful} ${successful === 1 ? props.itemTypeName : props.itemTypeNamePlural}`)
    } else if (successful > 0) {
      toast.warning(`Deleted ${successful} ${successful === 1 ? props.itemTypeName : props.itemTypeNamePlural}, but ${failed} failed`)
    } else {
      toast.error('Failed to delete items')
      return // Don't clear selection or close dialog if all failed
    }
    
    clearSelection()
    showMassDeleteDialog.value = false
    
    // Refresh items
    emit('refresh')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete items')
  } finally {
    isMassDeleting.value = false
  }
}

// Clear selection when items change
watch(() => props.items, () => {
  // Remove items from selection that no longer exist
  const itemIds = new Set(props.items.map(i => i.id))
  selectedItems.value = new Set(Array.from(selectedItems.value).filter(id => itemIds.has(id)))
  if (lastSelectedIndex.value !== null && lastSelectedIndex.value >= props.items.length) {
    lastSelectedIndex.value = null
  }
  if (selectedItems.value.size === 0) {
    isCtrlClickSelection.value = false
  }
}, { deep: true })

function handleDelete(item: LibraryItem) {
  deletingItem.value = item
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return

  isDeleting.value = true
  try {
    emit('delete', deletingItem.value)
    // Wait a bit for the parent to handle the deletion
    await new Promise(resolve => setTimeout(resolve, 100))
    showDeleteDialog.value = false
    deletingItem.value = null
  } finally {
    isDeleting.value = false
  }
}   
</script>

<style scoped>
.item-grid-list {
  width: 100%;
}

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

.items-grid {
  width: 100%;
  padding-bottom: 1rem;
}

.grid-item {
  margin: 0 0 1rem;
}

.loading-grid .grid-item {
  width: 100%;
}

.skeleton-card {
  width: 100%;
  border-radius: 16px;
  padding: 0;
  --v-theme-surface: rgba(255, 255, 255, 0.08);
}

.skeleton-card :deep(.v-skeleton-loader__image) {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.context-menu-overlay :deep(.v-overlay__scrim) {
  background: transparent;
}

.context-menu-card {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>


