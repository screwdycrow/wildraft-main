<template>
  <div class="dm-screen-wrapper">
    <div 
      class="dm-screen-flow-container" 
      :style="canvasBackgroundStyle"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <VueFlow
        v-if="dmScreen"
        ref="vueFlowRef"
        :nodes="nodes"
        :edges="[]"
        :node-types="nodeTypes"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :fit-view-on-init="false"
        :zoom-on-double-click="false"
        class="dm-screen-flow"
        @nodes-change="onNodesChange"
        @node-drag-stop="onNodeDragStop"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
      >
        <Controls />
        <MiniMap v-if="!isPortalMode" class="minimap-top-right" />
        
        <!-- Grid Overlay - on top of everything, non-selectable -->
        <GridNode
          v-if="gridOptions.showGrid"
          :grid-size="gridOptions.gridSize"
          :grid-color="gridOptions.gridColor"
          :grid-opacity="gridOptions.gridOpacity"
          :line-width="gridOptions.gridLineWidth"
        />
      </VueFlow>
      
      <!-- Layer Control - positioned next to floating toolbar at bottom -->
      <LayerControl
        v-if="!isPortalMode"
        :dm-screen-id="dmScreen.id"
        :library-id="dmScreen.libraryId"
        class="layer-control-panel"
        @layer-select="handleLayerSelect"
      />
      
      <!-- Effects Panel - for adding particle/lighting effects -->
      <EffectsPanel
        v-if="!isPortalMode"
        @add-effect="handleAddEffect"
      />
    </div>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="500" scrollable :attach="false">
      <v-card>
        <v-card-title>
          <v-icon icon="mdi-cog" class="mr-2" />
          DM Screen Settings
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <!-- Grid Settings -->
          <div class="mb-6">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              <v-icon icon="mdi-grid" class="mr-2" size="small" />
              Grid
            </h3>
            <v-switch
              v-model="localGridOptions.showGrid"
              label="Show Grid"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            <div class="d-flex align-center gap-2 mb-3">
              <v-slider
                v-model.number="localGridOptions.gridSize"
                label="Grid Size"
                min="10"
                max="200"
                step="5"
                thumb-label
                hide-details
                class="flex-grow-1"
              />
              <v-text-field
                v-model.number="localGridOptions.gridSize"
                type="number"
                density="compact"
                hide-details
                style="max-width: 80px;"
                suffix="px"
              />
            </div>
            <div class="d-flex align-center gap-2 mb-3">
              <v-slider
                v-model.number="localGridOptions.gridOpacity"
                label="Grid Opacity"
                min="0.05"
                max="1"
                step="0.05"
                thumb-label
                hide-details
                class="flex-grow-1"
              />
              <v-text-field
                v-model.number="localGridOptions.gridOpacity"
                type="number"
                density="compact"
                hide-details
                style="max-width: 80px;"
                :min="0.05"
                :max="1"
                :step="0.05"
              />
            </div>
            <v-switch
              v-model="localGridOptions.snapToGrid"
              label="Snap to Grid"
              color="primary"
              density="compact"
              hide-details
            />
          </div>

          <v-divider class="my-4" />

          <!-- Background Settings -->
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              <v-icon icon="mdi-image" class="mr-2" size="small" />
              Background Nodes
            </h3>
            <v-switch
              v-model="localLockBackgroundImages"
              label="Lock Background Nodes"
              color="primary"
              density="compact"
              hide-details
              class="mb-3"
            />
            <v-slider
              v-if="backgroundImageCount > 0"
              v-model="localBackgroundOpacity"
              label="Background Opacity"
              min="0"
              max="1"
              step="0.05"
              thumb-label
              hide-details
              class="mb-3"
            >
              <template #prepend>
                <v-icon icon="mdi-opacity" />
              </template>
            </v-slider>
            
            <v-alert
              v-if="backgroundImageCount > 0"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ backgroundImageCount }} background node{{ backgroundImageCount > 1 ? 's' : '' }} on canvas.
            </v-alert>
            
            <div class="d-flex gap-2 mb-4">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="showFileManager = true"
                :prepend-icon="backgroundImageCount > 0 ? 'mdi-plus' : 'mdi-image-plus'"
              >
                {{ backgroundImageCount > 0 ? 'Add Another' : 'Add Background Node' }}
              </v-btn>
            </div>

            <v-divider class="my-3" />

            <h3 class="text-subtitle-1 font-weight-bold mb-3 mt-3">
              <v-icon icon="mdi-image-filter-hdr" class="mr-2" size="small" />
              Canvas Background (Fixed)
            </h3>
            <p class="text-caption text-grey-lighten-1 mb-3">
              A fixed background image that doesn't scale with zoom
            </p>
            
            <div class="d-flex gap-2">
              <v-btn
                color="primary"
                variant="outlined"
                size="small"
                @click="showCanvasBackgroundSelector = true"
                prepend-icon="mdi-image-plus"
              >
                {{ canvasBackgroundUrl ? 'Change' : 'Set Canvas Background' }}
              </v-btn>
              <v-btn
                v-if="canvasBackgroundUrl"
                color="error"
                variant="outlined"
                size="small"
                @click="removeCanvasBackground"
                prepend-icon="mdi-delete"
              >
                Remove
              </v-btn>
            </div>
          </div>

          <v-divider class="my-4" />

          <!-- Portal Actions -->
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-3">
              <v-icon icon="mdi-projector-screen" class="mr-2" size="small" />
              Portal
            </h3>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-projector-screen"
              block
              @click="handleSendToPortal"
              :disabled="!hasActivePortal"
            >
              Send to Portal
            </v-btn>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showSettingsDialog = false">
            Close
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveSettings">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Library Item Selector -->
    <library-item-selector
      v-model="showItemSelector"
      :library-id="dmScreen.libraryId"
      @select="handleAddLibraryItem"
    />

    <!-- File Manager for Background Image -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="false"
      return-type="id"
      filter-type="image"
      @select="handleBackgroundImageSelect"
    />

    <!-- File Manager for Canvas Background -->
    <file-manager
      v-model="showCanvasBackgroundSelector"
      select-mode
      :multiple="false"
      return-type="id"
      filter-type="image"
      @select="handleCanvasBackgroundSelect"
    />

    <!-- Shape Style Editor Dialog -->
    <v-dialog v-model="showShapeStyleDialog" max-width="400" persistent :attach="false">
      <v-card>
        <v-card-title>Edit Shape Style</v-card-title>
        <v-divider />
        <v-card-text class="py-6">
          <div class="d-flex flex-column gap-4">
            <!-- Fill Color -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">Fill Color</label>
              <div class="d-flex gap-2">
                <input
                  v-model="editingShapeData.color"
                  type="color"
                  class="shape-color-picker"
                />
                <v-text-field
                  v-model="editingShapeData.color"
                  label="Hex Color"
                  density="compact"
                />
              </div>
            </div>

            <!-- Opacity -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">
                Opacity: {{ Math.round((editingShapeData.opacity || 1) * 100) }}%
              </label>
              <v-slider
                v-model="editingShapeData.opacity"
                :min="0"
                :max="1"
                :step="0.1"
              />
            </div>

            <!-- Border Color -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">Border Color</label>
              <div class="d-flex gap-2">
                <input
                  v-model="editingShapeData.borderColor"
                  type="color"
                  class="shape-color-picker"
                />
                <v-text-field
                  v-model="editingShapeData.borderColor"
                  label="Hex Color"
                  density="compact"
                />
              </div>
            </div>

            <!-- Border Width -->
            <div>
              <label class="text-body2 font-weight-600 mb-2 d-block">
                Border Width: {{ editingShapeData.borderWidth || 0 }}px
              </label>
              <v-slider
                v-model="editingShapeData.borderWidth"
                :min="0"
                :max="10"
                :step="1"
              />
            </div>

            <!-- Label -->
            <v-text-field
              v-model="editingShapeData.label"
              label="Label (optional)"
              density="compact"
            />
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showShapeStyleDialog = false">
            Cancel
          </v-btn>
          <v-btn color="primary" variant="flat" @click="saveShapeStyle">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Empty State -->
    <div v-if="!dmScreen.items || dmScreen.items.length === 0" class="empty-state-overlay">
      <div class="empty-state-content">
        <v-icon icon="mdi-monitor-dashboard" size="120" color="grey-lighten-1" class="mb-6" />
        <h2 class="text-h4 font-weight-bold mb-4">No items in DM screen</h2>
        <p class="text-body-1 text-grey-lighten-1 mb-4">
          Use the toolbar buttons to add items or background images.
        </p>
        <div class="empty-state-actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            @click="showItemSelector = true"
          >
            Add Item
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            prepend-icon="mdi-image-plus"
            @click="showFileManager = true"
          >
            Add Background
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted, onUnmounted, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, NodeDragEvent, NodeChange } from '@vue-flow/core'
import type { DmScreen, DmScreenItem, DmScreenSettings, GridOptions, DmScreenLayer } from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import DmScreenFlowNode from './DmScreenFlowNode.vue'
import GridNode from './GridNode.vue'
import LayerControl from './LayerControl.vue'
import LibraryItemSelector from './LibraryItemSelector.vue'
import FileManager from '@/components/files/FileManager.vue'
import EffectsPanel from './EffectsPanel.vue'
import type { EffectPreset } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useFilesStore } from '@/stores/files'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useToast } from 'vue-toastification'

// =====================================================
// PROPS & EMITS
// =====================================================

const props = defineProps<{
  dmScreen: DmScreen
  isPortalMode?: boolean
}>()

// =====================================================
// STORES & COMPOSABLES
// =====================================================

const dmScreensStore = useDmScreensStore()
const portalViewsStore = usePortalViewsStore()
const filesStore = useFilesStore()
const toast = useToast()

// Portal socket for receiving commands in portal mode
const { on: onPortalEvent, off: offPortalEvent, isConnected } = usePortalSocket()

// VueFlow composable with viewport controls
const { project, zoomIn, zoomOut, setViewport, getViewport, fitView } = useVueFlow()
const vueFlowRef = ref<any>(null)

// =====================================================
// NODE TYPES (marked raw to prevent reactivity)
// =====================================================

const nodeTypes = markRaw({
  dmScreenItem: DmScreenFlowNode,
})

// =====================================================
// UI STATE (local only, no watchers)
// =====================================================

const showSettingsDialog = ref(false)
const showFileManager = ref(false)
const showItemSelector = ref(false)
const showCanvasBackgroundSelector = ref(false)
const showShapeStyleDialog = ref(false)
const canvasBackgroundUrl = ref<string | null>(null)

// Local settings for dialog editing
const localGridOptions = ref<GridOptions>({
  showGrid: true,
  gridSize: 20,
  gridColor: 'rgba(255, 255, 255, 0.1)',
  gridLineWidth: 1,
  gridOpacity: 0.3,
  snapToGrid: false,
})
const localLockBackgroundImages = ref(false)
const localBackgroundOpacity = ref(1)

// Shape editor state
const editingShapeData = ref({
  shape: 'circle' as 'circle' | 'square' | 'triangle',
  color: '#6366f1',
  opacity: 1,
  borderColor: '#ffffff',
  borderWidth: 0,
  label: '',
})
const editingShapeItemId = ref<string | null>(null)

// =====================================================
// COMPUTED (derived from props, no watchers needed)
// =====================================================

// Grid options from settings
const gridOptions = computed<GridOptions>(() => {
  return props.dmScreen.settings?.grid || {
    showGrid: true,
    gridSize: 20,
    gridColor: 'rgba(255, 255, 255, 0.1)',
    gridLineWidth: 1,
    gridOpacity: 0.3,
    snapToGrid: false,
  }
})

// Lock background images setting
const lockBackgroundImages = computed(() => {
  return props.dmScreen.settings?.lockBackgroundImages || false
})

// Background opacity setting
const backgroundOpacity = computed(() => {
  return props.dmScreen.settings?.backgroundOpacity ?? 1
})

// Count background images
const backgroundImageCount = computed(() => {
  if (!props.dmScreen.items) return 0
  return props.dmScreen.items.filter((item: DmScreenItem) => 
    item.type === 'UserFileId' && item.data.isBackground === true
  ).length
})

// Check if portal is active
const hasActivePortal = computed(() => !!portalViewsStore.activePortal)

// Canvas background style
const canvasBackgroundStyle = computed(() => {
  if (canvasBackgroundUrl.value) {
    return {
      backgroundImage: `url(${canvasBackgroundUrl.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return {}
})

// =====================================================
// LAYERS - Get layers from store
// =====================================================

const layers = computed(() => {
  return dmScreensStore.getLayers(props.dmScreen.id)
})

// =====================================================
// NODES COMPUTED - Convert items to VueFlow nodes
// Items are sorted by layer order, then by item order within layer
// =====================================================

const nodes = computed<Node[]>(() => {
  if (!props.dmScreen.items) return []
  
  // Get items sorted by layer order
  const sortedItems = dmScreensStore.getItemsSortedByLayer(props.dmScreen.id)
  
  // Create a map of layer order for z-index calculation
  const layerOrderMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.order]))
  const layerVisibilityMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.visible]))
  const layerOpacityMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.opacity]))
  const layerLockedMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.locked]))
  
  // Create showOnPortal map
  const layerShowOnPortalMap = new Map(layers.value.map((l: DmScreenLayer) => [l.id, l.showOnPortal]))
  
  return sortedItems
    .filter(item => {
      // Filter out items in hidden layers
      const layerId = item.layer || 'screen'
      const isVisible = layerVisibilityMap.get(layerId) !== false
      
      // In portal mode, also filter by showOnPortal
      if (props.isPortalMode) {
        const showOnPortal = layerShowOnPortalMap.get(layerId)
        return isVisible && showOnPortal !== false
      }
      
      return isVisible
    })
    .map((item: DmScreenItem, index: number) => {
      const nodeOptions = item.nodeOptions || {}
      const position = nodeOptions.position || { x: nodeOptions.x || 0, y: nodeOptions.y || 0 }
      const layerId = item.layer || 'screen'
      const layerOrder = layerOrderMap.get(layerId) ?? 1
      const layerOpacity = layerOpacityMap.get(layerId) ?? 1
      const layerLocked = layerLockedMap.get(layerId) ?? false
      
      // Legacy support for isBackground flag
      const isBackground = item.data.isBackground === true || layerId === 'background'
      const isLocked = layerLocked || (isBackground && lockBackgroundImages.value)
      
      // Calculate opacity: layer opacity * item opacity (if background)
      const itemOpacity = isBackground 
        ? layerOpacity * backgroundOpacity.value 
        : layerOpacity
      
      const rotation = nodeOptions.rotation || 0
      
      // Determine dimensions
      let width = nodeOptions.width || 300
      let height = nodeOptions.height || 200
      
      // TokenNode uses smaller circular dimensions
      if (item.type === 'TokenNode') {
        width = nodeOptions.width || 100
        height = nodeOptions.height || 100
      }
      
      // EffectNode uses square dimensions
      if (item.type === 'EffectNode') {
        width = nodeOptions.width || 150
        height = nodeOptions.height || 150
      }
      
      // Calculate z-index based on layer order and item order
      // Layer order * 1000 + item order within layer
      const baseZIndex = layerOrder * 1000
      const itemZIndex = baseZIndex + (item.order || index)
      
      return {
        id: item.id,
        type: 'dmScreenItem',
        position: {
          x: position.x,
          y: position.y,
        },
        data: {
          item,
          libraryId: props.dmScreen.libraryId,
          dmScreenId: props.dmScreen.id,
          snapToGrid: gridOptions.value.snapToGrid,
          gridSize: gridOptions.value.gridSize,
          backgroundOpacity: itemOpacity,
          rotation,
          layerId,
          layerLocked,
        },
        draggable: !isLocked,
        selectable: !isLocked,
        width,
        height,
        style: {
          opacity: itemOpacity,
        },
        zIndex: itemZIndex,
      }
    })
})

// =====================================================
// LIFECYCLE
// =====================================================

onMounted(async () => {
  // Load canvas background if set
  const canvasBackgroundId = props.dmScreen.settings?.canvasBackgroundImageId
  if (canvasBackgroundId) {
    try {
      canvasBackgroundUrl.value = await filesStore.getDownloadUrl(canvasBackgroundId)
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to load canvas background:', error)
    }
  }
  
  // Initialize local settings from props
  initializeLocalSettings()
  
  // Set up portal command listeners if in portal mode
  if (props.isPortalMode) {
    setupPortalCommandListeners()
  }
})

onUnmounted(() => {
  // Clean up portal command listeners
  cleanupPortalCommandListeners()
})

// Watch for portal mode changes
watch(() => props.isPortalMode, (isPortalMode) => {
  if (isPortalMode) {
    setupPortalCommandListeners()
  } else {
    cleanupPortalCommandListeners()
  }
})


// =====================================================
// PORTAL COMMAND HANDLERS (for portal mode)
// =====================================================

function handlePortalViewUpdate(data: any) {
  console.log('[DmScreenWrapper] Received portal-view-updated:', data, 'isPortalMode:', props.isPortalMode)
  
  if (!props.isPortalMode) return
  
  const { command, deltaX, deltaY } = data
  
  console.log('[DmScreenWrapper] Processing command:', command)
  
  switch (command) {
    case 'dm-screen-zoom-in':
      console.log('[DmScreenWrapper] Zoom in')
      handlePortalZoomIn()
      break
    case 'dm-screen-zoom-out':
      console.log('[DmScreenWrapper] Zoom out')
      handlePortalZoomOut()
      break
    case 'dm-screen-pan':
      console.log('[DmScreenWrapper] Pan:', deltaX, deltaY)
      handlePortalPan(deltaX || 0, deltaY || 0)
      break
    case 'dm-screen-reset-view':
      console.log('[DmScreenWrapper] Reset view')
      handlePortalResetView()
      break
    default:
      console.log('[DmScreenWrapper] Unknown command:', command)
  }
}

function setupPortalCommandListeners() {
  // Subscribe to portal-view-updated events via store's event system
  onPortalEvent('portal-view-updated', handlePortalViewUpdate)
  console.log('[DmScreenWrapper] Portal command listeners set up')
}

function cleanupPortalCommandListeners() {
  offPortalEvent('portal-view-updated', handlePortalViewUpdate)
  console.log('[DmScreenWrapper] Portal command listeners cleaned up')
}

function handlePortalZoomIn() {
  const viewport = getViewport()
  const newZoom = Math.min(viewport.zoom * 1.2, 4) // Max zoom 4x
  setViewport({ ...viewport, zoom: newZoom }, { duration: 300 })
}

function handlePortalZoomOut() {
  const viewport = getViewport()
  const newZoom = Math.max(viewport.zoom / 1.2, 0.2) // Min zoom 0.2x
  setViewport({ ...viewport, zoom: newZoom }, { duration: 300 })
}

function handlePortalPan(deltaX: number, deltaY: number) {
  const viewport = getViewport()
  setViewport({
    ...viewport,
    x: viewport.x + deltaX,
    y: viewport.y + deltaY,
  }, { duration: 150 })
}

function handlePortalResetView() {
  // Fit all nodes in view with some padding
  fitView({ padding: 0.2, duration: 500 })
}

function initializeLocalSettings() {
  localGridOptions.value = { ...gridOptions.value }
  localLockBackgroundImages.value = lockBackgroundImages.value
  localBackgroundOpacity.value = backgroundOpacity.value
}

// =====================================================
// VUEFLOW EVENT HANDLERS
// All handlers call store actions directly
// =====================================================

/**
 * Handle node changes - resize is handled by @resize-end in DmScreenFlowNode
 * This is left here for any other node changes VueFlow might emit
 */
function onNodesChange(_changes: NodeChange[]) {
  // Resize is now handled by @resize-end event in DmScreenFlowNode
  // This handler is kept for any other node changes if needed
}

function onNodeDragStop(event: NodeDragEvent) {
  const node = event.node
  let x = node.position.x
  let y = node.position.y
  
  // Snap to grid if enabled
  if (gridOptions.value.snapToGrid && gridOptions.value.gridSize) {
    x = Math.round(x / gridOptions.value.gridSize) * gridOptions.value.gridSize
    y = Math.round(y / gridOptions.value.gridSize) * gridOptions.value.gridSize
  }
  
  // Update position in store (debounced API call)
  dmScreensStore.updateItemPosition(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    node.id,
    x,
    y
  )
}

function onNodeClick(event: any) {
  const nodeId = event.node?.id
  if (nodeId) {
    dmScreensStore.selectItem(nodeId)
  }
}

function onPaneClick() {
  dmScreensStore.selectItem(null)
}

// Selected layer for adding new items
const selectedLayerId = ref<string>('screen')

function handleLayerSelect(layerId: string) {
  selectedLayerId.value = layerId
}

// =====================================================
// ITEM EVENT HANDLERS (called from DmScreenFlowNode)
// =====================================================

function handleItemUpdate(updatedItem: DmScreenItem) {
  dmScreensStore.updateItem(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    updatedItem.id,
    updatedItem
  )
}

function handleItemDelete(itemId: string) {
  dmScreensStore.deleteItem(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    itemId
  )
  toast.success('Item removed')
}

function handleItemResize(itemId: string, width: number, height: number, x?: number, y?: number) {
  dmScreensStore.updateItemDimensions(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    itemId,
    width,
    height,
    x,
    y
  )
}

function handleItemRotate(itemId: string, rotation: number) {
  dmScreensStore.updateItemRotation(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    itemId,
    rotation
  )
}

// =====================================================
// ADD ITEM HANDLERS
// =====================================================

function getViewportCenter(itemWidth = 300, itemHeight = 200): { x: number; y: number } {
  try {
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    const flowPosition = project({ x: viewportCenterX, y: viewportCenterY })
    return {
      x: flowPosition.x - itemWidth / 2,
      y: flowPosition.y - itemHeight / 2,
    }
  } catch (error) {
    return { x: 400, y: 300 }
  }
}

async function handleAddLibraryItem(libraryItem: LibraryItem) {
  try {
    let featuredImageUrl: string | null = null
    if (libraryItem.featuredImage) {
      featuredImageUrl = await filesStore.getDownloadUrl(libraryItem.featuredImage.id)
    }

    const newItem = dmScreensStore.convertLibraryItemToDmScreenItem(
      libraryItem,
      featuredImageUrl
    )
    
    const center = getViewportCenter(300, 500)
    newItem.nodeOptions = {
      ...newItem.nodeOptions,
      x: center.x,
      y: center.y,
      position: center,
    }

    dmScreensStore.addItem(props.dmScreen.id, props.dmScreen.libraryId, newItem)
    toast.success('Item added to DM screen')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add item:', error)
    toast.error('Failed to add item')
  }
}

async function handleBackgroundImageSelect(fileId: number | number[] | string | string[]) {
  const id = Array.isArray(fileId) 
    ? (typeof fileId[0] === 'number' ? fileId[0] : parseInt(fileId[0] as string, 10))
    : (typeof fileId === 'number' ? fileId : parseInt(fileId as string, 10))

  try {
    // Get image dimensions
    const dimensions = await getImageDimensions(id)
    const aspectRatio = dimensions.height / dimensions.width
    const fixedWidth = 500
    const calculatedHeight = Math.round(fixedWidth * aspectRatio)

    const center = getViewportCenter(fixedWidth, calculatedHeight)
    
    dmScreensStore.addBackgroundImage(
      props.dmScreen.id,
      props.dmScreen.libraryId,
      id,
      center,
      { width: fixedWidth, height: calculatedHeight }
    )

    toast.success('Background image added')
    showFileManager.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add background image:', error)
    toast.error('Failed to add background image')
  }
}

async function getImageDimensions(fileId: number): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    filesStore.getDownloadUrl(fileId).then(url => {
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        resolve({ width: 500, height: 375 })
      }
      img.src = url
    }).catch(() => {
      resolve({ width: 500, height: 375 })
    })
  })
}

// =====================================================
// SETTINGS HANDLERS
// =====================================================

function saveSettings() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    grid: { ...localGridOptions.value },
    lockBackgroundImages: localLockBackgroundImages.value,
    backgroundOpacity: localBackgroundOpacity.value,
  }
  
  dmScreensStore.updateSettings(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    updatedSettings
  )
  
  showSettingsDialog.value = false
  toast.success('Settings saved')
}

async function handleCanvasBackgroundSelect(fileId: number | number[] | string | string[]) {
  const id = Array.isArray(fileId) 
    ? (typeof fileId[0] === 'number' ? fileId[0] : parseInt(fileId[0] as string, 10))
    : (typeof fileId === 'number' ? fileId : parseInt(fileId as string, 10))

  try {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      canvasBackgroundImageId: id,
    }
    
    dmScreensStore.updateSettings(
      props.dmScreen.id,
      props.dmScreen.libraryId,
      updatedSettings
    )
    
    canvasBackgroundUrl.value = await filesStore.getDownloadUrl(id)
    toast.success('Canvas background set')
    showCanvasBackgroundSelector.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to set canvas background:', error)
    toast.error('Failed to set canvas background')
  }
}

function removeCanvasBackground() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    canvasBackgroundImageId: undefined,
  }
  
  dmScreensStore.updateSettings(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    updatedSettings
  )
  
  canvasBackgroundUrl.value = null
  toast.success('Canvas background removed')
}

// =====================================================
// SHAPE STYLE HANDLERS
// =====================================================

function openShapeStyleEditor(item: DmScreenItem) {
  if (item.type !== 'ShapeNode') return
  
  editingShapeItemId.value = item.id
  editingShapeData.value = {
    shape: item.data.shape as 'circle' | 'square' | 'triangle',
    color: item.data.color || '#6366f1',
    opacity: item.data.opacity ?? 1,
    borderColor: item.data.borderColor || '#ffffff',
    borderWidth: item.data.borderWidth || 0,
    label: item.data.label || '',
  }
  showShapeStyleDialog.value = true
}

function saveShapeStyle() {
  if (!editingShapeItemId.value) return

  const item = props.dmScreen.items?.find(i => i.id === editingShapeItemId.value)
  if (!item) return

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      color: editingShapeData.value.color,
      opacity: editingShapeData.value.opacity,
      borderColor: editingShapeData.value.borderColor,
      borderWidth: editingShapeData.value.borderWidth,
      label: editingShapeData.value.label,
    },
  }

  dmScreensStore.updateItem(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    editingShapeItemId.value,
    updatedItem
  )
  
  showShapeStyleDialog.value = false
  toast.success('Shape style updated')
}

// =====================================================
// DRAG & DROP HANDLERS
// =====================================================

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  if (!event.dataTransfer) return
  
  try {
    let data = event.dataTransfer.getData('application/json')
    let parsed: any = null
    
    if (data) {
      try {
        parsed = JSON.parse(data)
      } catch (e) {
        // Try text/plain fallback
      }
    }
    
    // Handle effect drops
    if (parsed && parsed.type === 'effect-node') {
      const dropPosition = project({ x: event.clientX, y: event.clientY })
      const effectSize = 150
      
      dmScreensStore.addEffectNode(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.effectPreset,
        { x: dropPosition.x - effectSize / 2, y: dropPosition.y - effectSize / 2 },
        parsed.targetLayer || 'screen'
      )
      
      toast.success(`Added ${parsed.effectPreset.name} effect`)
      return
    }
    
    // Handle text/plain effect format
    const textData = event.dataTransfer.getData('text/plain')
    if (textData && textData.startsWith('effect:')) {
      // Parse format: effect:effectId:layerId
      const parts = textData.split(':')
      const effectId = parts[1]
      const targetLayer = parts[2] || 'screen'
      
      // Find the effect preset
      const { EFFECT_PRESETS } = await import('@/types/dmScreen.types')
      const preset = EFFECT_PRESETS.find(p => p.id === effectId)
      
      if (preset) {
        const dropPosition = project({ x: event.clientX, y: event.clientY })
        const effectSize = 150
        
        dmScreensStore.addEffectNode(
          props.dmScreen.id,
          props.dmScreen.libraryId,
          preset,
          { x: dropPosition.x - effectSize / 2, y: dropPosition.y - effectSize / 2 },
          targetLayer
        )
        
        toast.success(`Added ${preset.name} effect`)
        return
      }
    }
    
    // Handle file drops (existing logic)
    if (!parsed || !parsed.fileId) {
      if (textData && textData.startsWith('file:')) {
        // Parse format: file:123:layerId
        const parts = textData.split(':')
        const fileId = parseInt(parts[1], 10)
        const targetLayer = parts[2] || 'background'
        if (!isNaN(fileId)) {
          parsed = { type: 'user-file-background', fileId, targetLayer }
        }
      }
    }
    
    if (!parsed || !parsed.fileId) return
    
    const isBackgroundType = parsed.type === 'user-file-background'
    const isBackgroundNode = parsed.isBackground === true || isBackgroundType // Explicitly check for isBackground flag
    const targetLayer = parsed.targetLayer || (isBackgroundType ? 'background' : 'screen')
    const dropPosition = project({ x: event.clientX, y: event.clientY })
    
    console.log('[DmScreenWrapper] Drop:', { isBackgroundType, isBackgroundNode, targetLayer, parsed })
    
    if (isBackgroundType) {
      const dimensions = await getImageDimensions(parsed.fileId)
      const aspectRatio = dimensions.height / dimensions.width
      const fixedWidth = 500
      const calculatedHeight = Math.round(fixedWidth * aspectRatio)
      
      dmScreensStore.addBackgroundImage(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.fileId,
        { x: dropPosition.x - fixedWidth / 2, y: dropPosition.y - calculatedHeight / 2 },
        { width: fixedWidth, height: calculatedHeight },
        targetLayer,
        isBackgroundNode // Pass the isBackground flag
      )
    } else {
      dmScreensStore.addUserFile(
        props.dmScreen.id,
        props.dmScreen.libraryId,
        parsed.fileId,
        { x: dropPosition.x - 150, y: dropPosition.y - 200 },
        targetLayer
      )
    }
    
    // Get layer name for toast message
    const layer = layers.value.find((l: DmScreenLayer) => l.id === targetLayer)
    const layerName = layer?.name || targetLayer
    toast.success(`Added to ${layerName} layer`)
  } catch (error) {
    console.error('[DmScreenWrapper] Failed to handle drop:', error)
    toast.error('Failed to add item')
  }
}

// Handle adding effect from click (adds at viewport center)
function handleAddEffect(preset: EffectPreset, layerId: string) {
  const effectSize = 150
  const center = getViewportCenter(effectSize, effectSize)
  
  dmScreensStore.addEffectNode(
    props.dmScreen.id,
    props.dmScreen.libraryId,
    preset,
    center,
    layerId
  )
  
  toast.success(`Added ${preset.name} effect`)
}

// =====================================================
// PORTAL HANDLER
// =====================================================

async function handleSendToPortal() {
  if (!hasActivePortal.value) {
    toast.error('No active portal')
    return
  }
  
  try {
    await portalViewsStore.addDmScreenToActivePortal(props.dmScreen, true)
    toast.success('DM screen sent to portal')
    showSettingsDialog.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to send to portal:', error)
    toast.error(error.message || 'Failed to send to portal')
  }
}

// =====================================================
// EXPOSE METHODS FOR PARENT/TOOLBAR
// =====================================================

defineExpose({
  // Dialog controls
  openSettings: () => {
    initializeLocalSettings()
    showSettingsDialog.value = true
  },
  openItemSelector: () => { showItemSelector.value = true },
  openFileManager: () => { showFileManager.value = true },
  openShapeStyleEditor,
  
  // Item actions (delegate to store)
  addTextNode: () => {
    const center = getViewportCenter(200, 100)
    dmScreensStore.addTextNode(props.dmScreen.id, props.dmScreen.libraryId, center)
    toast.success('Text node added')
  },
  addShapeNode: () => {
    const center = getViewportCenter(150, 150)
    dmScreensStore.addShapeNode(props.dmScreen.id, props.dmScreen.libraryId, center)
    toast.success('Shape node added')
  },
  
  // Toggle actions
  toggleLockBackground: () => {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      lockBackgroundImages: !lockBackgroundImages.value,
    }
    dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
  },
  toggleGrid: () => {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      grid: {
        ...gridOptions.value,
        showGrid: !gridOptions.value.showGrid,
      },
    }
    dmScreensStore.updateSettings(props.dmScreen.id, props.dmScreen.libraryId, updatedSettings)
  },
  
  // Event handlers for node events
  handleItemUpdate,
  handleItemDelete,
  handleItemResize,
  handleItemRotate,
  
  // Portal control methods (called by PortalViewItem)
  handleDmScreenZoomIn: handlePortalZoomIn,
  handleDmScreenZoomOut: handlePortalZoomOut,
  handleDmScreenPan: handlePortalPan,
  handleDmScreenResetView: handlePortalResetView,
})
</script>

<style scoped>
.dm-screen-wrapper {
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dm-screen-flow-container {
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
}

.dm-screen-flow {
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 30, 0.5);
}

.empty-state-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px;
  background: rgba(30, 30, 40, 0.9);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.empty-state-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.shape-color-picker {
  width: 50px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
}

/* MiniMap - positioned top right, smaller */
.minimap-top-right {
  position: absolute !important;
  top: 10px !important;
  right: 10px !important;
  bottom: auto !important;
  left: auto !important;
  width: 120px !important;
  height: 80px !important;
}

/* Layer Control Panel - positioned at bottom right edge */
.layer-control-panel {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
}
</style>


