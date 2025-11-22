<template>
  <div class="dm-screen-flow-node-container" :style="containerStyle">
  <NodeResizer
    v-if="isSelected"
    :min-width="data.item.isMinimized ? 20 : 100"
    :min-height="data.item.isMinimized ? 20 : 100"
    :handle-color="'#6366f1'"
    :handle-size="16"
    :line-style="{ stroke: '#6366f1', strokeWidth: 2 }"
  />
    
    <!-- Rotation Handle and Action Toolbar - positioned together outside rotated content -->
    <div
      v-if="isSelected"
      class="top-controls"
    >
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
          v-if="data.item.type !== 'CombatantItemToken' && !data.item.data.isBackground && data.item.type !== 'TextNode' && data.item.type !== 'ShapeNode'"
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
          @click.stop="handleDeleteClick"
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
    :style="nodeStyle"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
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
  width?: number
  height?: number
  position?: { x: number; y: number }
}

const props = defineProps<Props>()

const vueFlow = useVueFlow()
const { project, viewport, updateNodeInternals, getNode: vueFlowGetNode } = vueFlow

// Safe wrapper for getNode
const getNode = (id: string) => {
  if (typeof vueFlowGetNode === 'function') {
    return vueFlowGetNode(id)
  }
  return null
}

const isRotating = ref(false)
const rotationStartAngle = ref(0)
const rotationStartMouseAngle = ref(0)

// Use the selected prop directly from Vue Flow
const isSelected = computed(() => props.selected || false)

// Compute rotation from item's nodeOptions or data
const rotation = computed(() => {
  return props.data.rotation ?? props.data.item.nodeOptions?.rotation ?? 0
})

// Container style - applies rotation to entire container including resize handles
const containerStyle = computed(() => {
  if (rotation.value) {
    return {
      transform: `rotate(${rotation.value}deg)`,
      transformOrigin: 'center center',
    }
  }
  return {}
})

// Node style - no additional rotation since container handles it
const nodeStyle = computed(() => {
  return {}
})

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


// Calculate angle from center to mouse position
function getAngleFromCenter(centerX: number, centerY: number, mouseX: number, mouseY: number): number {
  const dx = mouseX - centerX
  const dy = mouseY - centerY
  return Math.atan2(dy, dx) * (180 / Math.PI)
}

function handleRotationStart(event: MouseEvent) {
  if (!props.data.onUpdate) return
  
  isRotating.value = true
  rotationStartAngle.value = rotation.value
  
  // Use the current mouse position as the center
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const handleCenterX = rect.left + rect.width / 2
  const handleCenterY = rect.top + rect.height / 2
  
  // Get the node element to find its center
  const nodeElement = document.querySelector(`[data-id="${props.id}"]`)
  if (nodeElement) {
    const nodeRect = nodeElement.getBoundingClientRect()
    const nodeCenterX = nodeRect.left + nodeRect.width / 2
    const nodeCenterY = nodeRect.top + nodeRect.height / 2
    
    // Get initial mouse angle from node center
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
  if (!isRotating.value || !props.data.onUpdate) return
  
  // Get the node element to find its center
  const nodeElement = document.querySelector(`[data-id="${props.id}"]`)
  if (!nodeElement) return
  
  const nodeRect = nodeElement.getBoundingClientRect()
  const nodeCenterX = nodeRect.left + nodeRect.width / 2
  const nodeCenterY = nodeRect.top + nodeRect.height / 2
  
  // Get current mouse angle from node center
  const currentMouseAngle = getAngleFromCenter(
    nodeCenterX,
    nodeCenterY,
    event.clientX,
    event.clientY
  )
  
  // Calculate rotation delta
  let deltaAngle = currentMouseAngle - rotationStartMouseAngle.value
  
  // Normalize to -180 to 180 range
  if (deltaAngle > 180) deltaAngle -= 360
  if (deltaAngle < -180) deltaAngle += 360
  
  // Calculate new rotation
  let newRotation = rotationStartAngle.value + deltaAngle
  
  // Normalize to 0-360 range
  newRotation = ((newRotation % 360) + 360) % 360
  
  // Round to nearest 15 degrees when shift is held for snapping
  if (event.shiftKey) {
    newRotation = Math.round(newRotation / 15) * 15
  }
  
  // Update the item
  const updatedItem: DmScreenItem = {
    ...props.data.item,
    nodeOptions: {
      ...props.data.item.nodeOptions,
      rotation: newRotation,
    },
  }
  
  handleUpdate(updatedItem)
}

function handleRotationEnd() {
  isRotating.value = false
  // Update Vue Flow internals after rotation is complete
  updateNodeInternals(props.id)
}

function resetRotation() {
  if (!props.data.onUpdate) return
  
  const updatedItem: DmScreenItem = {
    ...props.data.item,
    nodeOptions: {
      ...props.data.item.nodeOptions,
      rotation: 0,
    },
  }
  
  handleUpdate(updatedItem)
  updateNodeInternals(props.id)
}

function toggleMinimize() {
  if (!props.data.onUpdate) return
  
  const isCurrentlyMinimized = props.data.item.isMinimized
  
  const updatedItem: DmScreenItem = {
    ...props.data.item,
    isMinimized: !isCurrentlyMinimized,
  }
  
  if (!isCurrentlyMinimized) {
    // Minimizing: Store current dimensions for restoration
    const node = getNode(props.id)
    const currentWidth = node?.dimensions?.width || props.width || props.data.item.nodeOptions?.width || 300
    const currentHeight = node?.dimensions?.height || props.height || props.data.item.nodeOptions?.height || 200
    
    // Store the full-size dimensions
    updatedItem.nodeOptions = {
      ...updatedItem.nodeOptions,
      fullWidth: currentWidth,
      fullHeight: currentHeight,
      width: updatedItem.minimizedDimensions?.width || 150, // Use previous minimized size if exists
      height: updatedItem.minimizedDimensions?.height || 150,
    }
    
    // If minimizedDimensions exist from previous minimize, keep them
    // Otherwise set default
    if (!updatedItem.minimizedDimensions) {
      updatedItem.minimizedDimensions = {
        width: 150,
        height: 150,
      }
    }
  } else {
    // Maximizing: Restore original full dimensions
    const fullWidth = updatedItem.nodeOptions?.fullWidth || 300
    const fullHeight = updatedItem.nodeOptions?.fullHeight || 200
    
    updatedItem.nodeOptions = {
      ...updatedItem.nodeOptions,
      width: fullWidth,
      height: fullHeight,
    }
    
    // Keep minimizedDimensions so we can restore to the custom size when minimizing again
    // Don't delete updatedItem.minimizedDimensions
  }
  
  console.log('[DmScreenFlowNode] Toggle minimize:', {
    wasMinimized: isCurrentlyMinimized,
    nowMinimized: !isCurrentlyMinimized,
    fullWidth: updatedItem.nodeOptions?.fullWidth,
    fullHeight: updatedItem.nodeOptions?.fullHeight,
    width: updatedItem.nodeOptions?.width,
    height: updatedItem.nodeOptions?.height,
  })
  
  handleUpdate(updatedItem)
  
  // Update node internals after dimension change
  if (typeof updateNodeInternals === 'function') {
    setTimeout(() => {
      const node = getNode(props.id)
      if (node) {
        console.log('[DmScreenFlowNode] Node after toggle:', {
          id: node.id,
          isMinimized: updatedItem.isMinimized,
          nodeDimensions: { width: node.width, height: node.height }
        })
      }
      updateNodeInternals(props.id)
    }, 10)
  }
}

function handleDeleteClick() {
  handleDelete(props.data.item.id)
}

// Set up global mouse event listeners for rotation
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', handleRotationMove)
    window.addEventListener('mouseup', handleRotationEnd)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', handleRotationMove)
    window.removeEventListener('mouseup', handleRotationEnd)
  }
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
</style>
