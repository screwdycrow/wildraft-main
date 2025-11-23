<template>
  <div 
    class="item-card-wrapper"
    :class="{ 
      'selected': selected, 
      'selection-mode': selectionMode,
      'drag-over': isDragOver,
      'draggable-item': !compact && !disableClick
    }"
    :draggable="!compact && !disableClick"
    @mouseenter="showActions = true" 
    @mouseleave="showActions = false"
    @click="handleClick"
    @contextmenu="handleContextMenu"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <component
      :is="cardComponent"
      :item="item"
      :compact="compact"
      v-bind="$attrs"
    />
    
    <!-- Hover Actions -->
    <transition name="fade">
      <div 
        v-if="showActions" 
        class="card-actions"
        @click.stop
        @mouseenter="showActions = true"
        @mouseleave="showActions = false"
      >
        <v-btn
          v-if="canSendToPortal"
          icon="mdi-television"
          size="x-small"
          color="purple"
          variant="flat"
          @click.stop="handleSendToPortal"
          :disabled="isSendingToPortal"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Send Featured Image to Portal
          </v-tooltip>
        </v-btn>
        <v-btn
          v-if="canShowOnTop"
          icon="mdi-television-play"
          size="x-small"
          color="purple"
          variant="flat"
          @click.stop="handleShowOnTop"
          :disabled="isSendingToPortal"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Show Featured Image On Top
          </v-tooltip>
        </v-btn>
        <v-btn
          v-if="canPinToDmScreen"
          icon="mdi-pin"
          size="x-small"
          color="orange"
          variant="flat"
          @click.stop="handlePinToDmScreen"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Pin to Active DM Screen
          </v-tooltip>
        </v-btn>
        <v-btn
          v-if="canAddToCombat"
          icon="mdi-sword-cross"
          size="x-small"
          color="success"
          variant="flat"
          @click.stop="handleAddToCombat"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Add to Active Combat
          </v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-pencil"
          size="x-small"
          color="primary"
          variant="flat"
          @click.stop="handleEditClick"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Edit
          </v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-eye"
          size="x-small"
          color="info"
          variant="flat"
          @click.stop="$emit('view', item)"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Quick View
          </v-tooltip>
        </v-btn>
        <v-btn
          v-if="!hideDelete"
          icon="mdi-delete"
          size="x-small"
          color="error"
          variant="flat"
          @click.stop="$emit('delete', item)"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Delete
          </v-tooltip>
        </v-btn>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LibraryItem } from '@/types/item.types'
import { useItemComponents } from '@/composables/useItemComponents'
import { useQuickItemViewStore } from '@/stores/quickItemView'
import { useCombat } from '@/composables/useCombat'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { useItemsStore } from '@/stores/items'
import { usePortalViewsStore } from '@/stores/portalViews'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'vue-toastification'
import { useDialogsStore } from '@/stores/dialogs'

interface Props {
  item: LibraryItem
  hideDelete?: boolean
  disableClick?: boolean
  selected?: boolean
  selectionMode?: boolean
  libraryId?: number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectionMode: false,
})

const emit = defineEmits<{
  edit: [item: LibraryItem]
  view: [item: LibraryItem]
  delete: [item: LibraryItem]
  select: [item: LibraryItem, ctrlKey: boolean, metaKey: boolean]
  contextmenu: [event: MouseEvent, item: LibraryItem]
  'featured-image-url': [url: string]
}>()

const showActions = ref(false)
const isDragOver = ref(false)
const isDragging = ref(false)

const { getItemComponent } = useItemComponents()
const quickItemViewStore = useQuickItemViewStore()
const { addToActiveEncounter, activeEncounter } = useCombat()
const combatStore = useCombatEncountersStore()
const itemsStore = useItemsStore()
const portalViewsStore = usePortalViewsStore()
const dmScreensStore = useDmScreensStore()
const filesStore = useFilesStore()
const { sendPortalViewUpdate } = usePortalSocket()
const toast = useToast()
const dialogsStore = useDialogsStore()

const isSendingToPortal = ref(false)

const cardComponent = computed(() => {
  return getItemComponent(props.item.type, 'card')
})

const canAddToCombat = computed(() => {
  return !!activeEncounter.value
})

const hasFeaturedImage = computed(() => {
  return !!props.item.featuredImage
})

const canSendToPortal = computed(() => {
  return hasFeaturedImage.value && !!portalViewsStore.activePortal
})

const canShowOnTop = computed(() => {
  return hasFeaturedImage.value && !!portalViewsStore.activePortal
})

const canPinToDmScreen = computed(() => {
  return !!dmScreensStore.activeDmScreen
})

async function handleAddToCombat() {
  if (!activeEncounter.value) {
    toast.warning('No active combat encounter')
    return
  }

  try {
    await addToActiveEncounter(props.item)
    toast.success(`${props.item.name} added to combat!`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to add to combat')
  }
}

async function handleSendToPortal() {
  if (!props.item.featuredImage) {
    toast.warning('No featured image to send')
    return
  }

  isSendingToPortal.value = true
  try {
    await portalViewsStore.addItemToActivePortal(props.item.featuredImage, true)
    toast.success(`Sent "${props.item.featuredImage.fileName}" to portal and set as current`)
  } catch (error: any) {
    console.error('[ItemCardWrapper] Failed to send to portal:', error)
    toast.error(error.message || 'Failed to send to portal')
  } finally {
    isSendingToPortal.value = false
  }
}

function handleShowOnTop() {
  if (!props.item.featuredImage) {
    toast.warning('No featured image to show')
    return
  }

  sendPortalViewUpdate({
    command: 'show-on-top',
    userFile: props.item.featuredImage,
  })
  
  toast.success(`Showing "${props.item.featuredImage.fileName}" on portal`)
}

async function handlePinToDmScreen() {
  if (!dmScreensStore.activeDmScreen) {
    toast.warning('No active DM screen')
    return
  }

  try {
    // Get featured image URL if available
    let featuredImageUrl: string | null = null
    if (props.item.featuredImage) {
      featuredImageUrl = await filesStore.getDownloadUrl(props.item.featuredImage.id)
      // Emit the URL to parent component
      emit('featured-image-url', featuredImageUrl)
    }

    // Convert library item to DM screen item
    const dmScreenItem = dmScreensStore.convertLibraryItemToDmScreenItem(
      props.item,
      featuredImageUrl
    )

    // Add to active DM screen
    const currentItems = dmScreensStore.activeDmScreen.items || []
    const updatedItems = [...currentItems, dmScreenItem]

    await dmScreensStore.updateDmScreen(
      dmScreensStore.activeDmScreen.libraryId,
      dmScreensStore.activeDmScreen.id,
      { items: updatedItems }
    )

    toast.success(`"${props.item.name}" pinned to DM screen`)
  } catch (error: any) {
    console.error('[ItemCardWrapper] Failed to pin to DM screen:', error)
    toast.error(error.message || 'Failed to pin to DM screen')
  }
}

// Handle click - support selection mode
function handleClick(event: MouseEvent) {
  if (props.selectionMode || event.ctrlKey || event.metaKey) {
    // In selection mode or with Ctrl/Cmd key, emit select event
    emit('select', props.item, event.ctrlKey, event.metaKey)
  } else if (!props.disableClick) {
    // Normal click - open global item viewer dialog
    if (props.libraryId) {
      dialogsStore.openItemViewer(props.item, props.libraryId)
    } else {
      // Fallback to emitting view event if no libraryId
      emit('view', props.item)
    }
  }
}

// Handle edit - use dialogsStore
function handleEditClick() {
  if (props.libraryId) {
    dialogsStore.openItemEditor(props.item, props.libraryId)
  } else {
    // Fallback to emitting edit event if no libraryId
    emit('edit', props.item)
  }
}

// Handle context menu
function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event, props.item)
}

// Handle drag over (for tag dropping)
function handleDragOver(event: DragEvent) {
  if (!event.dataTransfer) return
  
  // Check if dragging a tag
  if (event.dataTransfer.types.includes('application/json') || event.dataTransfer.types.includes('text/plain')) {
    event.dataTransfer.dropEffect = 'copy'
    isDragOver.value = true
  }
}

// Handle drag leave
function handleDragLeave(event: DragEvent) {
  // Only clear drag-over if we're actually leaving the element (not just moving to a child)
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  if (!currentTarget.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

// Handle drop (for tag dropping)
async function handleDrop(event: DragEvent) {
  isDragOver.value = false
  
  if (!event.dataTransfer || !props.libraryId) return
  
  try {
    let tagId: number | null = null
    let libraryItemId: number | null = null
    
    // Try to get data from application/json
    try {
      const data = event.dataTransfer.getData('application/json')
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.type === 'tag' && parsed.tagId) {
          tagId = parsed.tagId
        } else if (parsed.type === 'library-item' && parsed.itemId) {
          libraryItemId = parsed.itemId
        }
      }
    } catch (e) {
      // Fallback to text/plain
      const textData = event.dataTransfer.getData('text/plain')
      if (textData) {
        if (textData.startsWith('tag:')) {
        tagId = parseInt(textData.replace('tag:', ''))
        } else if (textData.startsWith('item:')) {
          libraryItemId = parseInt(textData.replace('item:', ''))
        }
      }
    }
    
    // Handle tag drop
    if (tagId && !isNaN(tagId)) {
    // Get current tag IDs
    const currentTagIds = props.item.tags?.map(t => t.id) || []
    
    // Check if tag is already on this item
    if (currentTagIds.includes(tagId)) {
      toast.info('This tag is already on this item')
      return
    }
    
    // Add tag to item
    await itemsStore.updateItem(props.libraryId, props.item.id, {
      tagIds: [...currentTagIds, tagId]
    })
    
    toast.success('Tag added to item')
    }
    // Library item drops are handled by DmScreenCardsInHand, not here
  } catch (error: any) {
    console.error('Drop error:', error)
    toast.error('Failed to add tag')
  }
}

function handleDragStart(event: DragEvent) {
  if (props.compact || props.disableClick) return
  
  if (event.dataTransfer && event.target instanceof HTMLElement) {
    isDragging.value = true
    event.dataTransfer.effectAllowed = 'move'
    // Store library item ID in dataTransfer
    event.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'library-item', 
      itemId: props.item.id,
      libraryId: props.libraryId
    }))
    // Also store as text/plain for better browser compatibility
    event.dataTransfer.setData('text/plain', `item:${props.item.id}`)
    
    // Set a custom drag image
    const dragImage = event.target.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.pointerEvents = 'none'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }
}

function handleDragEnd() {
  isDragging.value = false
}
</script>

<style scoped>
.item-card-wrapper {
  position: relative;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.item-card-wrapper.selected {
  outline: 3px solid rgba(var(--v-theme-primary), 0.8);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.2);
}

.item-card-wrapper.drag-over {
  outline: 3px solid rgba(var(--v-theme-success), 0.8);
  outline-offset: 2px;
  box-shadow: 
    0 0 0 4px rgba(var(--v-theme-success), 0.2),
    0 0 20px rgba(var(--v-theme-success), 0.4),
    0 0 40px rgba(var(--v-theme-success), 0.2);
  transform: scale(1.02);
  z-index: 100;
}

.item-card-wrapper:hover {
  transform: translateY(-2px);
}

.item-card-wrapper.draggable-item {
  cursor: grab;
  user-select: none;
}

.item-card-wrapper.draggable-item:active {
  cursor: grabbing;
}

.item-card-wrapper.draggable-item:hover {
  opacity: 0.9;
}

.item-card-wrapper.draggable-item.dragging {
  opacity: 0.5;
}

.item-card-wrapper.drag-over:hover {
  transform: scale(1.02) translateY(-2px);
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
  pointer-events: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

