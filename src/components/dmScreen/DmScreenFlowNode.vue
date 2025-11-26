<template>
  <div class="dm-screen-flow-node-container" :style="containerStyle">
    <!-- NodeResizer - @resize-end triggers the store update -->
    <NodeResizer
      v-if="isSelected"
      :min-width="data.item.isMinimized ? 20 : 100"
      :min-height="data.item.isMinimized ? 20 : 100"
      :color="'#6366f1'"
      :handle-style="{ 
        width: '12px', 
        height: '12px', 
        borderRadius: '2px',
        border: '2px solid #fff',
        background: '#6366f1'
      }"
      :line-style="{ 
        borderWidth: '2px',
        borderColor: '#6366f1'
      }"
      @resize-end="handleResizeEnd"
    />
    
    <!-- Rotation Handle and Action Toolbar -->
    <div v-if="isSelected" class="top-controls">
      <!-- Rotation Handle -->
      <div
        class="rotation-handle"
        @mousedown.stop="handleRotationStart"
      >
        <v-icon size="small" color="#6366f1">mdi-rotate-3d-variant</v-icon>
      </div>
      
      <!-- Action Toolbar -->
      <div class="node-action-toolbar">
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="white"
          @click.stop="resetRotation"
        >
          <v-icon size="small">mdi-rotate-left-variant</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Reset Rotation
          </v-tooltip>
        </v-btn>
        
        <v-btn
          v-if="canMinimize"
          icon
          size="x-small"
          variant="text"
          color="white"
          @click.stop="toggleMinimize"
        >
          <v-icon size="small">{{ data.item.isMinimized ? 'mdi-window-maximize' : 'mdi-window-minimize' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ data.item.isMinimized ? 'Maximize' : 'Minimize' }}
          </v-tooltip>
        </v-btn>
        
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="error"
          @click.stop="handleDelete"
        >
          <v-icon size="small">mdi-close</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Delete
          </v-tooltip>
        </v-btn>
      </div>
    </div>
    
    <div 
      class="dm-screen-flow-node" 
      :class="{ 
        'minimized': data.item.isMinimized, 
        'selected': isSelected,
        'is-dragging': props.dragging,
        'rotating': isRotating
      }"
    >
      <dm-screen-item-wrapper
        :key="data.item.id"
        :item="data.item"
        :library-id="data.libraryId"
        :dm-screen-id="data.dmScreenId"
        :snap-to-grid="data.snapToGrid"
        :grid-size="data.gridSize"
        :background-opacity="data.backgroundOpacity"
        @update="handleItemUpdate"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { NodeResizer } from '@vue-flow/node-resizer'
import { useVueFlow } from '@vue-flow/core'
import type { DmScreenItem } from '@/types/dmScreen.types'
import DmScreenItemWrapper from './DmScreenItemWrapper.vue'
import { useDmScreensStore } from '@/stores/dmScreens'

// =====================================================
// PROPS
// =====================================================

interface Props {
  id: string
  data: {
    item: DmScreenItem
    libraryId: number
    dmScreenId: string
    snapToGrid?: boolean
    gridSize?: number
    backgroundOpacity?: number
    rotation?: number
  }
  selected?: boolean
  dragging?: boolean
  width?: number
  height?: number
  position?: { x: number; y: number }
}

const props = defineProps<Props>()

// =====================================================
// STORE & VUEFLOW
// =====================================================

const dmScreensStore = useDmScreensStore()
const { findNode } = useVueFlow()

// =====================================================
// LOCAL STATE
// =====================================================

const isRotating = ref(false)
const rotationStartAngle = ref(0)
const rotationStartMouseAngle = ref(0)
const currentRotation = ref(props.data.rotation ?? props.data.item.nodeOptions?.rotation ?? 0)

// Sync rotation with props when not actively rotating
watch(() => props.data.item.nodeOptions?.rotation, (newRotation) => {
  if (!isRotating.value && newRotation !== undefined) {
    currentRotation.value = newRotation
  }
}, { immediate: false })

// =====================================================
// COMPUTED
// =====================================================

const isSelected = computed(() => props.selected || false)

const rotation = computed(() => {
  return currentRotation.value
})

const containerStyle = computed(() => {
  if (rotation.value) {
    return {
      transform: `rotate(${rotation.value}deg)`,
      transformOrigin: 'center center',
    }
  }
  return {}
})

const canMinimize = computed(() => {
  const item = props.data.item
  return item.type !== 'CombatantItemToken' && 
         !item.data.isBackground && 
         item.type !== 'TextNode' && 
         item.type !== 'ShapeNode'
})

// =====================================================
// ITEM UPDATE HANDLER
// =====================================================

function handleItemUpdate(updatedItem: DmScreenItem) {
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    updatedItem.id,
    updatedItem
  )
}

// =====================================================
// DELETE HANDLER
// =====================================================

function handleDelete() {
  dmScreensStore.deleteItem(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id
  )
}

// =====================================================
// RESIZE END HANDLER
// =====================================================

function handleResizeEnd(_event: any) {
  // Get the actual node from VueFlow - this has the correct dimensions and position
  const node = findNode(props.id)
  if (!node) {
    console.warn('[DmScreenFlowNode] Could not find node for resize end:', props.id)
    return
  }
  
  // Get dimensions from VueFlow's node state
  const width = node.dimensions?.width || props.data.item.nodeOptions?.width || 300
  const height = node.dimensions?.height || props.data.item.nodeOptions?.height || 200
  const x = node.position?.x ?? props.data.item.nodeOptions?.position?.x ?? 0
  const y = node.position?.y ?? props.data.item.nodeOptions?.position?.y ?? 0
  
  console.log('[DmScreenFlowNode] Resize end:', { id: props.id, width, height, x, y })
  
  // Update dimensions in store (triggers debounced API call)
  dmScreensStore.updateItemDimensions(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id,
    width,
    height,
    x,
    y
  )
}

// =====================================================
// ROTATION HANDLERS
// =====================================================

function getAngleFromCenter(centerX: number, centerY: number, mouseX: number, mouseY: number): number {
  const dx = mouseX - centerX
  const dy = mouseY - centerY
  return Math.atan2(dy, dx) * (180 / Math.PI)
}

function handleRotationStart(event: MouseEvent) {
  isRotating.value = true
  rotationStartAngle.value = currentRotation.value
  
  const nodeElement = document.querySelector(`[data-id="${props.id}"]`)
  if (nodeElement) {
    const nodeRect = nodeElement.getBoundingClientRect()
    const nodeCenterX = nodeRect.left + nodeRect.width / 2
    const nodeCenterY = nodeRect.top + nodeRect.height / 2
    
    rotationStartMouseAngle.value = getAngleFromCenter(
      nodeCenterX,
      nodeCenterY,
      event.clientX,
      event.clientY
    )
  }
  
  event.preventDefault()
  event.stopPropagation()
}

function handleRotationMove(event: MouseEvent) {
  if (!isRotating.value) return
  
  const nodeElement = document.querySelector(`[data-id="${props.id}"]`)
  if (!nodeElement) return
  
  const nodeRect = nodeElement.getBoundingClientRect()
  const nodeCenterX = nodeRect.left + nodeRect.width / 2
  const nodeCenterY = nodeRect.top + nodeRect.height / 2
  
  const currentMouseAngle = getAngleFromCenter(
    nodeCenterX,
    nodeCenterY,
    event.clientX,
    event.clientY
  )
  
  let deltaAngle = currentMouseAngle - rotationStartMouseAngle.value
  
  if (deltaAngle > 180) deltaAngle -= 360
  if (deltaAngle < -180) deltaAngle += 360
  
  let newRotation = rotationStartAngle.value + deltaAngle
  newRotation = ((newRotation % 360) + 360) % 360
  
  // Snap to 15 degrees when shift is held
  if (event.shiftKey) {
    newRotation = Math.round(newRotation / 15) * 15
  }
  
  // Update local rotation for immediate visual feedback
  currentRotation.value = newRotation
}

function handleRotationEnd() {
  if (!isRotating.value) return
  
  isRotating.value = false
  
  // Persist rotation to store (debounced API call)
  dmScreensStore.updateItemRotation(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id,
    currentRotation.value
  )
}

function resetRotation() {
  currentRotation.value = 0
  
  dmScreensStore.updateItemRotation(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id,
    0
  )
}

// =====================================================
// MINIMIZE HANDLER
// =====================================================

function toggleMinimize() {
  const item = props.data.item
  const isCurrentlyMinimized = item.isMinimized
  
  const updatedItem: DmScreenItem = {
    ...item,
    isMinimized: !isCurrentlyMinimized,
  }
  
  if (!isCurrentlyMinimized) {
    // Minimizing: Store current dimensions
    const currentWidth = props.width || item.nodeOptions?.width || 300
    const currentHeight = props.height || item.nodeOptions?.height || 200
    
    updatedItem.nodeOptions = {
      ...updatedItem.nodeOptions,
      fullWidth: currentWidth,
      fullHeight: currentHeight,
      width: updatedItem.minimizedDimensions?.width || 150,
      height: updatedItem.minimizedDimensions?.height || 150,
    }
    
    if (!updatedItem.minimizedDimensions) {
      updatedItem.minimizedDimensions = { width: 150, height: 150 }
    }
  } else {
    // Maximizing: Restore full dimensions
    const fullWidth = item.nodeOptions?.fullWidth || 300
    const fullHeight = item.nodeOptions?.fullHeight || 200
    
    updatedItem.nodeOptions = {
      ...updatedItem.nodeOptions,
      width: fullWidth,
      height: fullHeight,
    }
  }
  
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )
}

// =====================================================
// LIFECYCLE
// =====================================================

onMounted(() => {
  window.addEventListener('mousemove', handleRotationMove)
  window.addEventListener('mouseup', handleRotationEnd)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleRotationMove)
  window.removeEventListener('mouseup', handleRotationEnd)
})
</script>

<style scoped>
.dm-screen-flow-node-container {
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: center center;
}

.dm-screen-flow-node {
  width: 100%;
  height: 100%;
  min-width: 100px;
  min-height: 100px;
  position: relative;
}

.dm-screen-flow-node.minimized {
  width: 100%;
  height: 100%;
  min-width: 10px;
  min-height: 10px;
}

.dm-screen-flow-node.selected {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.dm-screen-flow-node.is-dragging {
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.2s ease;
}

.dm-screen-flow-node:not(.is-dragging) {
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}

.dm-screen-flow-node.rotating {
  cursor: grabbing !important;
}

.top-controls {
  position: absolute;
  top: -46px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001;
  pointer-events: auto;
}

.rotation-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border: 2px solid #6366f1;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.rotation-handle:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  border-width: 3px;
}

.rotation-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.node-action-toolbar {
  display: flex;
  gap: 4px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.node-action-toolbar .v-btn {
  min-width: 28px !important;
  width: 28px !important;
  height: 28px !important;
}

/* Photoshop-style resize handles */
:deep(.vue-flow__resize-control) {
  width: 12px;
  height: 12px;
  border: 2px solid #fff !important;
  background: #6366f1 !important;
  border-radius: 2px !important;
  opacity: 1 !important;
  transition: all 0.15s ease;
}

:deep(.vue-flow__resize-control:hover) {
  width: 14px;
  height: 14px;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
}

:deep(.vue-flow__resize-control.top.left),
:deep(.vue-flow__resize-control.top.right),
:deep(.vue-flow__resize-control.bottom.left),
:deep(.vue-flow__resize-control.bottom.right) {
  cursor: nwse-resize;
}

:deep(.vue-flow__resize-control.top.right),
:deep(.vue-flow__resize-control.bottom.left) {
  cursor: nesw-resize;
}

:deep(.vue-flow__resize-control.top),
:deep(.vue-flow__resize-control.bottom) {
  cursor: ns-resize;
  width: 40px;
}

:deep(.vue-flow__resize-control.left),
:deep(.vue-flow__resize-control.right) {
  cursor: ew-resize;
  height: 40px;
}

:deep(.vue-flow__resize-line) {
  border-width: 2px !important;
  border-color: #6366f1 !important;
  opacity: 1 !important;
}

:deep(.vue-flow__node.selected) {
  outline: 2px solid #6366f1;
  outline-offset: -2px;
}
</style>
