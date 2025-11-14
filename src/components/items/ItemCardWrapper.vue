<template>
  <div 
    class="item-card-wrapper"
    :class="{ 'selected': selected, 'selection-mode': selectionMode, 'drag-over': isDragOver }"
    @mouseenter="showActions = true" 
    @mouseleave="showActions = false"
    @click="handleCardClick"
    @contextmenu="handleContextMenu"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <component
      :is="cardComponent"
      :item="item"
      v-bind="$attrs"
    />
    
    <!-- Hover Actions -->
    <transition name="fade">
      <div v-if="showActions" class="card-actions">
        <v-btn
          v-if="canAddToCombat"
          icon="mdi-sword-cross"
          size="small"
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
          size="small"
          color="primary"
          variant="flat"
          @click.stop="$emit('edit', item)"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Edit
          </v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-eye"
          size="small"
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
          icon="mdi-delete"
          size="small"
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
import { useToast } from 'vue-toastification'

interface Props {
  item: LibraryItem
  selected?: boolean
  selectionMode?: boolean
  libraryId?: number
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectionMode: false,
})

const isDragOver = ref(false)

const emit = defineEmits<{
  edit: [item: LibraryItem]
  view: [item: LibraryItem]
  delete: [item: LibraryItem]
  select: [item: LibraryItem, ctrlKey: boolean, metaKey: boolean]
  contextmenu: [event: MouseEvent, item: LibraryItem]
}>()

const showActions = ref(false)

const { getItemComponent } = useItemComponents()
const quickItemViewStore = useQuickItemViewStore()
const { addToActiveEncounter, activeEncounter } = useCombat()
const combatStore = useCombatEncountersStore()
const itemsStore = useItemsStore()
const toast = useToast()

const cardComponent = computed(() => {
  return getItemComponent(props.item.type, 'card')
})

const canAddToCombat = computed(() => {
  // Only show if there's an active encounter
  return !!activeEncounter.value
})

function handleCardClick(event: MouseEvent) {
  // If Ctrl/Cmd is pressed, always handle selection (don't open quick view)
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    event.stopPropagation()
    // Pass ctrlKey and metaKey explicitly
    emit('select', props.item, event.ctrlKey, event.metaKey)
    return
  }
  
  // If in selection mode (2+ items selected), handle selection
  if (props.selectionMode) {
    emit('select', props.item, false, false)
    return
  }
  
  // If this item is selected (single selection), deselect it instead of opening
  if (props.selected) {
    emit('select', props.item, false, false)
    return
  }
  
  // Normal mode: open quick view
  quickItemViewStore.open(props.item)
}

function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event, props.item)
}

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

// Drag and drop handlers for tags
function handleDragOver(event: DragEvent) {
  if (!event.dataTransfer || !props.libraryId) return
  
  // Check if dragging a tag
  if (event.dataTransfer.types.includes('application/json') || event.dataTransfer.types.includes('text/plain')) {
    event.dataTransfer.dropEffect = 'copy'
    isDragOver.value = true
  }
}

function handleDragLeave(event: DragEvent) {
  // Only clear if we're actually leaving the card
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  if (!relatedTarget || !currentTarget?.contains(relatedTarget)) {
    isDragOver.value = false
  }
}

async function handleDrop(event: DragEvent) {
  isDragOver.value = false
  
  if (!event.dataTransfer || !props.libraryId) return
  
  try {
    let tagId: number | null = null
    
    // Try to get tag ID from application/json
    try {
      const data = event.dataTransfer.getData('application/json')
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.type === 'tag' && parsed.tagId) {
          tagId = parsed.tagId
        }
      }
    } catch (e) {
      // Fallback to text/plain
      const textData = event.dataTransfer.getData('text/plain')
      if (textData && textData.startsWith('tag:')) {
        tagId = parseInt(textData.replace('tag:', ''))
      }
    }
    
    if (!tagId || isNaN(tagId)) {
      return
    }
    
    // Add tag to item
    const currentTagIds = props.item.tags?.map(t => t.id) || []
    if (!currentTagIds.includes(tagId)) {
      const newTagIds = [...currentTagIds, tagId]
      const updatedItem = await itemsStore.updateItem(props.libraryId, props.item.id, { tagIds: newTagIds })
      toast.success(`Tag added to "${props.item.name}"`)
      
      // Item is already updated in the store, no need to refresh
      // The reactive props.item will update automatically
    } else {
      toast.info('Item already has this tag')
    }
  } catch (error: any) {
    console.error('Drop error:', error)
    toast.error('Failed to add tag')
  }
}
</script>

<style scoped>
.item-card-wrapper {
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  border: 3px solid transparent;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.item-card-wrapper.selection-mode.selected {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3);
}

.item-card-wrapper.selection-mode {
  cursor: pointer;
}

.item-card-wrapper.selection-mode:hover {
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.item-card-wrapper.drag-over {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3), 0 0 20px rgba(var(--v-theme-primary), 0.5) !important;
}

/* Ensure wrapper maintains card background (theme-based for dark themes, dark for light themes) */

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 10;
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

