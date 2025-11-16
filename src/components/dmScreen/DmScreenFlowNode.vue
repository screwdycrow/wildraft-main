<template>
  <NodeResizer
    v-if="!data.item.isMinimized && isSelected"
    :min-width="200"
    :min-height="150"
    :handle-color="'#6366f1'"
    :handle-size="16"
    :line-style="{ stroke: '#6366f1', strokeWidth: 2 }"
  />
  <div 
    class="dm-screen-flow-node" 
    :class="{ 
      'minimized': data.item.isMinimized, 
      'selected': isSelected,
      'is-dragging': props.dragging || isDragging
    }"
    @mousedown="handleDragStart"
    @mouseup="handleDragEnd"
    @dragend="handleDragEnd"
  >
    <dm-screen-item-wrapper
      :key="data.item.id"
      :item="data.item"
      :library-id="data.libraryId"
      :dm-screen-id="data.dmScreenId"
      :snap-to-grid="data.snapToGrid"
      :grid-size="data.gridSize"
      :background-opacity="data.backgroundOpacity"
      @update="handleUpdate"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import type { DmScreenItem } from '@/types/dmScreen.types'
import DmScreenItemWrapper from './DmScreenItemWrapper.vue'

interface Props {
  id: string
  data: {
    item: DmScreenItem
    libraryId: number
    dmScreenId: string
    snapToGrid?: boolean
    gridSize?: number
    onUpdate?: (item: DmScreenItem) => void
    onDelete?: (itemId: string) => void
  }
  selected?: boolean
  dragging?: boolean
}

const props = defineProps<Props>()

const isDragging = ref(false)

// Use the selected prop directly from Vue Flow
const isSelected = computed(() => props.selected || false)

function handleUpdate(updatedItem: DmScreenItem) {
  if (props.data.onUpdate) {
    props.data.onUpdate(updatedItem)
  }
}

function handleDelete(itemId: string) {
  if (props.data.onDelete) {
    props.data.onDelete(itemId)
  }
}

function handleDragStart() {
  isDragging.value = true
}

function handleDragEnd() {
  // Reset immediately when mouse is released or drag ends
  isDragging.value = false
}

// Watch for Vue Flow's dragging state and sync
watch(() => props.dragging, (newDragging) => {
  if (newDragging === false) {
    // Ensure animation resets when Vue Flow finishes dragging
    isDragging.value = false
  }
})
</script>

<style scoped>
.dm-screen-flow-node {
  width: 100%;
  height: 100%;
  min-width: 200px;
  min-height: 150px;
}

.dm-screen-flow-node.minimized {
  width: auto;
  min-width: 80px;
  max-width: 120px;
  height: auto;
  min-height: 100px;
}

.dm-screen-flow-node.selected {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.dm-screen-flow-node.is-dragging {
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
</style>
