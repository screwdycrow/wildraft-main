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
        :key="dmScreen.id"
        ref="vueFlowRef"
        :nodes="allNodes"
        :edges="edges"
        :node-types="nodeTypes"
        :default-viewport="{ zoom: 1, x: 0, y: 0 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :fit-view-on-init="false"
        :zoom-on-double-click="false"
        class="dm-screen-flow"
        @nodes-change="onNodesChange"
        @node-drag-stop="onNodeDragStop"
      >
        <Background
          v-if="showGrid"
          :pattern-color="gridColor"
          :gap="gridSize"
          :size="gridSize"
          :line-width="gridLineWidth"
        />
        <Controls />
        <MiniMap v-if="!isPortalMode" />
      </VueFlow>
    </div>


    <!-- Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="500" scrollable>
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
            <v-slider
              v-model.number="localGridOptions.gridSize"
              label="Grid Size"
              min="10"
              max="100"
              step="5"
              thumb-label
              hide-details
              class="mb-3"
            />
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
              {{ backgroundImageCount }} background node{{ backgroundImageCount > 1 ? 's' : '' }} on canvas. Click any to delete.
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
              <v-btn
                v-if="backgroundImageCount > 0"
                color="error"
                variant="outlined"
                size="small"
                @click="removeBackgroundImage"
                prepend-icon="mdi-delete"
              >
                Remove All
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
            
            <v-alert
              v-if="canvasBackgroundUrl"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Canvas background is set
            </v-alert>
            
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
            <v-alert
              v-if="!hasActivePortal"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              No active portal. Set an active portal from the portal control menu.
            </v-alert>
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

    <!-- File Manager for Background Image (images only) -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="false"
      return-type="id"
      filter-type="image"
      @select="handleBackgroundImageSelect"
    />

    <!-- File Manager for Canvas Background (images only) -->
    <file-manager
      v-model="showCanvasBackgroundSelector"
      select-mode
      :multiple="false"
      return-type="id"
      filter-type="image"
      @select="handleCanvasBackgroundSelect"
    />

    <!-- Shape Style Editor Dialog -->
    <v-dialog v-model="showShapeStyleDialog" max-width="400" persistent>
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
                  @input="updateShapePreview"
                />
                <v-text-field
                  v-model="editingShapeData.color"
                  label="Hex Color"
                  density="compact"
                  @update:model-value="updateShapePreview"
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
                @update:model-value="updateShapePreview"
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
                  @input="updateShapePreview"
                />
                <v-text-field
                  v-model="editingShapeData.borderColor"
                  label="Hex Color"
                  density="compact"
                  @update:model-value="updateShapePreview"
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
                @update:model-value="updateShapePreview"
              />
            </div>

            <!-- Label -->
            <v-text-field
              v-model="editingShapeData.label"
              label="Label (optional)"
              density="compact"
              @update:model-value="updateShapePreview"
            />

            <!-- Preview -->
            <div class="shape-preview-container">
              <div class="shape-preview-label">Preview</div>
              <svg width="150" height="150" viewBox="0 0 150 150" class="shape-preview">
                <circle
                  v-if="editingShapeData.shape === 'circle'"
                  cx="75"
                  cy="75"
                  r="50"
                  :fill="editingShapeData.color"
                  :fill-opacity="editingShapeData.opacity"
                  :stroke="editingShapeData.borderColor"
                  :stroke-width="editingShapeData.borderWidth"
                />
                <rect
                  v-else-if="editingShapeData.shape === 'square'"
                  x="35"
                  y="35"
                  width="100"
                  height="100"
                  :fill="editingShapeData.color"
                  :fill-opacity="editingShapeData.opacity"
                  :stroke="editingShapeData.borderColor"
                  :stroke-width="editingShapeData.borderWidth"
                />
                <polygon
                  v-else-if="editingShapeData.shape === 'triangle'"
                  points="75,25 125,125 25,125"
                  :fill="editingShapeData.color"
                  :fill-opacity="editingShapeData.opacity"
                  :stroke="editingShapeData.borderColor"
                  :stroke-width="editingShapeData.borderWidth"
                />
              </svg>
            </div>
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

    <!-- Empty State (overlay on VueFlow) -->
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
import { ref, computed, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge, NodeChange, NodeDragEvent } from '@vue-flow/core'
import type { DmScreen, DmScreenItem, DmScreenSettings, GridOptions } from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import DmScreenFlowNode from './DmScreenFlowNode.vue'
import LibraryItemSelector from './LibraryItemSelector.vue'
import FileManager from '@/components/files/FileManager.vue'
import { useDmScreensStore } from '@/stores/dmScreens'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'vue-toastification'
import { debounce } from '@/utils/helpers'

// Get Vue Flow instance for viewport calculations
const { project, viewport, getNode, zoomIn, zoomOut, setViewport, getViewport } = useVueFlow()
const vueFlowRef = ref<any>(null)

// Register custom node types
const nodeTypes = {
  dmScreenItem: DmScreenFlowNode,
}

const props = defineProps<{
  dmScreen: DmScreen
  isPortalMode?: boolean
}>()

const emit = defineEmits<{
  'update:lock-background-images': [value: boolean]
  'update:show-grid': [value: boolean]
  'selected-item': [item: DmScreenItem | null]
}>()

// Helper function to get viewport center position
function getViewportCenter(itemWidth = 300, itemHeight = 200): { x: number; y: number } {
  try {
    // Get the center of the visible viewport in screen coordinates
    const viewportCenterX = window.innerWidth / 2
    const viewportCenterY = window.innerHeight / 2
    
    // Project screen coordinates to flow coordinates
    const flowPosition = project({ x: viewportCenterX, y: viewportCenterY })
    
    // Offset by half the item dimensions to center it
    return {
      x: flowPosition.x - itemWidth / 2,
      y: flowPosition.y - itemHeight / 2,
    }
  } catch (error) {
    // Fallback if project is not available yet
    console.warn('[DmScreenWrapper] Could not get viewport center, using default position')
    return { x: 400, y: 300 }
  }
}

// Methods to be exposed
async function addTextNode() {
  try {
    const center = getViewportCenter(200, 100)
    const newItem: DmScreenItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'TextNode',
      data: {
        text: 'Double-click to edit',
        fontSize: 16,
        fontWeight: 'normal',
        textColor: '#ffffff',
        textAlign: 'center',
      },
      nodeOptions: {
        x: center.x,
        y: center.y,
        position: center,
        width: 200,
        height: 100,
        resizable: true,
      },
      isMinimized: false,
    }

    const updatedItems = [...(props.dmScreen.items || []), newItem]
    
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }

    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )

    toast.success('Text node added')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add text node:', error)
    toast.error('Failed to add text node')
  }
}

async function addShapeNode() {
  try {
    const center = getViewportCenter(150, 150)
    const newItem: DmScreenItem = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ShapeNode',
      data: {
        shape: 'circle',
        color: '#6366f1',
        opacity: 0.8,
        borderColor: '#ffffff',
        borderWidth: 2,
        label: '',
      },
      nodeOptions: {
        x: center.x,
        y: center.y,
        position: center,
        width: 150,
        height: 150,
        resizable: true,
      },
      isMinimized: false,
    }

    const updatedItems = [...(props.dmScreen.items || []), newItem]
    
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }

    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )

    toast.success('Shape node added')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add shape node:', error)
    toast.error('Failed to add shape node')
  }
}

// Handle adding a UserFile to the DM screen
async function addUserFile(userFile: any) {
  if (!props.dmScreen.items) return

  try {
    const fileItem: DmScreenItem = dmScreensStore.convertUserFileToDmScreenItem(userFile)
    
    // Center the item in the viewport
    const center = getViewportCenter(300, 200)
    fileItem.nodeOptions = {
      ...fileItem.nodeOptions,
      x: center.x,
      y: center.y,
      position: center,
    }

    const updatedItems = [...(props.dmScreen.items || []), fileItem]

    // Update local state immediately
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }

    // Save to API
    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )

    toast.success('File added to DM screen')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add file:', error)
    toast.error('Failed to add file')
  }
}

// Expose methods for parent component
defineExpose({
  addItem: () => { showItemSelector.value = true },
  addBackground: () => { showFileManager.value = true },
  addUserFile,
  openSettings: () => { showSettingsDialog.value = true },
  toggleLockBackground: () => {
    localLockBackgroundImages.value = !localLockBackgroundImages.value
    saveSettings()
  },
  toggleGrid: () => {
    localGridOptions.value.showGrid = !localGridOptions.value.showGrid
    saveSettings()
  },
  addTextNode,
  addShapeNode,
  sendToBack: (item: DmScreenItem | null) => {
    if (!item || !props.dmScreen.items) return
    const updatedItems = props.dmScreen.items.map(i => {
      if (i.id === item.id) {
        return { ...i, nodeOptions: { ...i.nodeOptions, zIndex: -2 } }
      }
      return i
    })
    const currentScreen = dmScreensStore.dmScreens.find(ds => ds.id === props.dmScreen.id)
    if (currentScreen) currentScreen.items = updatedItems
    debouncedUpdate(updatedItems)
  },
  sendToFront: (item: DmScreenItem | null) => {
    if (!item || !props.dmScreen.items) return
    const updatedItems = props.dmScreen.items.map(i => {
      if (i.id === item.id) {
        return { ...i, nodeOptions: { ...i.nodeOptions, zIndex: 100 } }
      }
      return i
    })
    const currentScreen = dmScreensStore.dmScreens.find(ds => ds.id === props.dmScreen.id)
    if (currentScreen) currentScreen.items = updatedItems
    debouncedUpdate(updatedItems)
  },
  editShapeStyle: (item: DmScreenItem | null) => {
    // Open shape style editor dialog
    if (item?.type === 'ShapeNode') {
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
  },
  deleteItem: (itemId: string) => handleItemDelete(itemId),
  rotateItem: (item: DmScreenItem | null, degrees: number) => {
    if (!item || !props.dmScreen.items) return
    
    const currentRotation = item.nodeOptions?.rotation || 0
    const newRotation = (currentRotation + degrees) % 360
    
    const updatedItems = props.dmScreen.items.map((i: DmScreenItem) => {
      if (i.id === item.id) {
        return {
          ...i,
          nodeOptions: {
            ...i.nodeOptions,
            rotation: newRotation,
          },
        }
      }
      return i
    })
    
    // Update local state immediately
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }
    
    // Debounced update
    debouncedUpdate(updatedItems)
  },
  setItemRotation: (item: DmScreenItem | null, rotation: number) => {
    if (!item || !props.dmScreen.items) return
    
    // Normalize rotation to 0-360
    const normalizedRotation = ((rotation % 360) + 360) % 360
    
    const updatedItems = props.dmScreen.items.map((i: DmScreenItem) => {
      if (i.id === item.id) {
        return {
          ...i,
          nodeOptions: {
            ...i.nodeOptions,
            rotation: normalizedRotation,
          },
        }
      }
      return i
    })
    
    // Update local state immediately
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }
    
    // Debounced update
    debouncedUpdate(updatedItems)
  },
  // DM Screen viewport controls for portal
  handleDmScreenZoomIn: () => {
    try {
      const vueFlow = vueFlowRef.value
      if (vueFlow && typeof vueFlow.zoomIn === 'function') {
        vueFlow.zoomIn({ duration: 200 })
      } else if (typeof zoomIn === 'function') {
        zoomIn({ duration: 200 })
      }
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to zoom in:', error)
    }
  },
  handleDmScreenZoomOut: () => {
    try {
      const vueFlow = vueFlowRef.value
      if (vueFlow && typeof vueFlow.zoomOut === 'function') {
        vueFlow.zoomOut({ duration: 200 })
      } else if (typeof zoomOut === 'function') {
        zoomOut({ duration: 200 })
      }
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to zoom out:', error)
    }
  },
  handleDmScreenPan: (deltaX: number, deltaY: number) => {
    try {
      const vueFlow = vueFlowRef.value
      let currentViewport
      
      if (vueFlow && typeof vueFlow.getViewport === 'function') {
        currentViewport = vueFlow.getViewport()
      } else if (typeof getViewport === 'function') {
        currentViewport = getViewport()
      }
      
      if (currentViewport) {
        const newViewport = {
          x: currentViewport.x + deltaX,
          y: currentViewport.y + deltaY,
          zoom: currentViewport.zoom,
        }
        
        if (vueFlow && typeof vueFlow.setViewport === 'function') {
          vueFlow.setViewport(newViewport, { duration: 200 })
        } else if (typeof setViewport === 'function') {
          setViewport(newViewport, { duration: 200 })
        }
      }
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to pan:', error)
    }
  },
  handleDmScreenResetView: () => {
    try {
      const vueFlow = vueFlowRef.value
      if (vueFlow && typeof vueFlow.setViewport === 'function') {
        vueFlow.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })
      } else if (typeof setViewport === 'function') {
        setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })
      }
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to reset view:', error)
    }
  },
})

const dmScreensStore = useDmScreensStore()
const portalViewsStore = usePortalViewsStore()
const filesStore = useFilesStore()
const toast = useToast()

const showSettingsDialog = ref(false)
const showFileManager = ref(false)
const showItemSelector = ref(false)
const showCanvasBackgroundSelector = ref(false) // For canvas background selection
const showShapeStyleDialog = ref(false)
const backgroundImageUrl = ref<string | null>(null)
const canvasBackgroundUrl = ref<string | null>(null) // For canvas background
const localBackgroundImageWidth = ref(props.dmScreen.settings?.backgroundImageWidth || 2500)
const localLockBackgroundImages = ref(props.dmScreen.settings?.lockBackgroundImages || false)
const localBackgroundOpacity = ref(props.dmScreen.settings?.backgroundOpacity ?? 1.0)
const isUpdating = ref(false) // Track if we're currently updating to prevent feedback loops
const hasActivePortal = computed(() => !!portalViewsStore.activePortal)

// Shape style editor state
const editingShapeData = ref({
  shape: 'circle' as 'circle' | 'square' | 'triangle',
  color: '#6366f1',
  opacity: 1,
  borderColor: '#ffffff',
  borderWidth: 0,
  label: '',
})
const editingShapeItemId = ref<string | null>(null)

// Debug logging
console.log('[DmScreenWrapper] Component setup, dmScreen:', props.dmScreen)
console.log('[DmScreenWrapper] DmScreen items:', props.dmScreen?.items)
console.log('[DmScreenWrapper] Initial background opacity:', localBackgroundOpacity.value)

// Local grid options for editing
const localGridOptions = ref<GridOptions>({
  showGrid: true,
  gridSize: 20,
  gridColor: 'rgba(255, 255, 255, 0.1)',
  gridLineWidth: 1,
  gridOpacity: 0.3,
  snapToGrid: false,
})

// Background image width from settings
const backgroundImageWidth = computed(() => {
  return props.dmScreen.settings?.backgroundImageWidth || 2500
})

// Lock background images setting
const lockBackgroundImages = computed(() => {
  return props.dmScreen.settings?.lockBackgroundImages || false
})

// Load background image (legacy)
const loadBackgroundImage = async () => {
  const imageId = props.dmScreen.settings?.backgroundImageId
  if (imageId) {
    try {
      backgroundImageUrl.value = await filesStore.getDownloadUrl(imageId)
      localBackgroundImageWidth.value = backgroundImageWidth.value
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to load background image:', error)
    }
  } else {
    backgroundImageUrl.value = null
  }
}

// Load canvas background image
const loadCanvasBackgroundImage = async () => {
  const imageId = props.dmScreen.settings?.canvasBackgroundImageId
  if (imageId) {
    try {
      canvasBackgroundUrl.value = await filesStore.getDownloadUrl(imageId)
      console.log('[DmScreenWrapper] Canvas background loaded:', canvasBackgroundUrl.value)
    } catch (error) {
      console.error('[DmScreenWrapper] Failed to load canvas background image:', error)
      canvasBackgroundUrl.value = null
    }
  } else {
    canvasBackgroundUrl.value = null
  }
}

// Computed style for canvas background
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

// Grid settings from DM screen settings
const gridOptions = computed(() => {
  return props.dmScreen.settings?.grid || {}
})

const showGrid = computed(() => {
  return gridOptions.value.showGrid !== false // Default to true
})

const gridSize = computed(() => {
  return gridOptions.value.gridSize || 20
})

const gridColor = computed(() => {
  return gridOptions.value.gridColor || 'rgba(255, 255, 255, 0.1)'
})

const gridLineWidth = computed(() => {
  return gridOptions.value.gridLineWidth || 1
})

const snapToGrid = computed(() => {
  return gridOptions.value.snapToGrid || false
})

// Initialize local grid options from settings
watch(() => props.dmScreen.settings?.grid, (grid: GridOptions | undefined) => {
  if (grid) {
    localGridOptions.value = { ...grid }
  }
}, { immediate: true, deep: true })

// Load background image when settings change
watch(() => props.dmScreen.settings?.backgroundImageId, () => {
  loadBackgroundImage()
}, { immediate: true })

watch(() => props.dmScreen.settings?.canvasBackgroundImageId, () => {
  loadCanvasBackgroundImage()
}, { immediate: true })

watch(() => props.dmScreen.settings?.backgroundImageWidth, (value: number | undefined) => {
  if (value !== undefined) {
    localBackgroundImageWidth.value = value
  }
}, { immediate: true })

watch(() => props.dmScreen.settings?.lockBackgroundImages, (value: boolean | undefined) => {
  if (value !== undefined) {
    localLockBackgroundImages.value = value
  }
}, { immediate: true })

watch(() => props.dmScreen.settings?.backgroundOpacity, (value: number | undefined) => {
  console.log('[DmScreenWrapper] Settings backgroundOpacity changed to:', value)
  if (value !== undefined) {
    localBackgroundOpacity.value = value
  }
}, { immediate: true })

// Watch for local changes to background width and save
watch(localBackgroundImageWidth, (newWidth, oldWidth) => {
  if (newWidth !== oldWidth && props.dmScreen.settings?.backgroundImageWidth !== newWidth) {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      backgroundImageWidth: newWidth,
    }
    debouncedSettingsUpdate(updatedSettings)
  }
})

// Watch for local changes to lock background and emit
watch(localLockBackgroundImages, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    emit('update:lock-background-images', newValue)
  }
})

// Watch for local changes to opacity and save
watch(localBackgroundOpacity, (newOpacity, oldOpacity) => {
  console.log('[DmScreenWrapper] Local opacity changed from', oldOpacity, 'to', newOpacity)
  if (newOpacity !== oldOpacity && props.dmScreen.settings?.backgroundOpacity !== newOpacity) {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      backgroundOpacity: newOpacity,
    }
    console.log('[DmScreenWrapper] Saving opacity to settings:', newOpacity)
    debouncedSettingsUpdate(updatedSettings)
  }
})

// Count background images
const backgroundImageCount = computed(() => {
  if (!props.dmScreen.items) return 0
  
  return props.dmScreen.items.filter((item: DmScreenItem) => 
    item.type === 'UserFileId' && item.data.isBackground === true
  ).length
})

// Get background image item (legacy - for backward compatibility)
const backgroundImageItem = computed<DmScreenItem | null>(() => {
  if (!props.dmScreen.items) return null
  
  const backgroundItems = props.dmScreen.items.filter((item: DmScreenItem) => 
    item.type === 'UserFileId' && item.data.isBackground === true
  )
  
  return backgroundItems.length > 0 ? backgroundItems[0] : null
})

// Convert DM Screen items to Vue Flow nodes
const itemNodes = computed<Node[]>(() => {
  if (!props.dmScreen.items) return []
  
  const nodes = props.dmScreen.items.map((item: DmScreenItem) => {
    const nodeOptions = item.nodeOptions || {}
    const position = nodeOptions.position || { x: 0, y: 0 }
    
    // Check if this is a background image
    const isBackground = item.data.isBackground === true
    const isLocked = isBackground && localLockBackgroundImages.value
    
    // Apply opacity to background images - use current local value
    const backgroundOpacity = isBackground ? localBackgroundOpacity.value : 1
    
    if (isBackground) {
      console.log('[DmScreenWrapper] Creating background node with opacity:', backgroundOpacity, 'for item:', item.id)
    }
    
    const rotation = nodeOptions.rotation || 0
    
    // Determine dimensions based on minimized state
    let nodeWidth: number
    let nodeHeight: number
    
    if (item.isMinimized) {
      // Use stored minimized dimensions if resized, otherwise default to 150x150
      nodeWidth = nodeOptions.width || item.minimizedDimensions?.width || 150
      nodeHeight = nodeOptions.height || item.minimizedDimensions?.height || 150
    } else {
      // Full size dimensions - use fullWidth/fullHeight if available (from minimize), otherwise use current dimensions
      const defaultWidth = 300
      const defaultHeight = 200
      nodeWidth = nodeOptions.fullWidth || nodeOptions.width || (isBackground ? localBackgroundImageWidth.value : defaultWidth)
      nodeHeight = nodeOptions.fullHeight || nodeOptions.height || (isBackground ? Math.round((nodeOptions.width || localBackgroundImageWidth.value) * 0.75) : defaultHeight)
    }
    
    return {
      id: item.id,
      type: 'dmScreenItem',
      position: {
        x: position.x || nodeOptions.x || 0,
        y: position.y || nodeOptions.y || 0,
      },
      data: {
        item,
        libraryId: props.dmScreen.libraryId,
        dmScreenId: props.dmScreen.id,
        snapToGrid: snapToGrid.value,
        gridSize: gridSize.value,
        onUpdate: handleItemUpdate,
        onDelete: handleItemDelete,
        backgroundOpacity,
        rotation,
      },
      draggable: !isLocked,
      selectable: !isLocked,
      resizable: true, // Always allow resizing (NodeResizer handles it)
      style: {
        // Don't set width/height in style - let Vue Flow handle it via width/height props
        minWidth: item.isMinimized ? '20px' : (isBackground ? '100px' : '100px'),
        minHeight: item.isMinimized ? '20px' : (isBackground ? '100px' : '100px'),
        opacity: backgroundOpacity,
        ...nodeOptions.style,
        // Don't apply rotation here - it's handled in DmScreenFlowNode
      },
      width: nodeWidth,
      height: nodeHeight,
      dimensions: {
        width: nodeWidth,
        height: nodeHeight,
      },
      class: nodeOptions.class || '',
      zIndex: isBackground ? -1 : 1, // Background images stay at the back
      rotation,
      ...nodeOptions,
    }
  })
  
  console.log('[DmScreenWrapper] Computed itemNodes:', nodes.length, 'nodes')
  console.log('[DmScreenWrapper] Background images:', nodes.filter(n => n.data.item.data.isBackground).length)
  
  return nodes
})

// All nodes (items only, background is now a regular item)
const allNodes = computed<Node[]>(() => {
  const nodes = itemNodes.value
  console.log('[DmScreenWrapper] Computed nodes:', nodes.length, nodes)
  return nodes
})

const edges = computed<Edge[]>(() => {
  return []
})

// Debounced update function
const debouncedUpdate = debounce(async (updatedItems: DmScreenItem[]) => {
  isUpdating.value = true
  try {
    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to update DM screen:', error)
    toast.error('Failed to save changes')
  } finally {
    // Small delay to ensure the update propagates before we stop ignoring
    setTimeout(() => {
      isUpdating.value = false
    }, 100)
  }
}, 500)

// Debounced settings update
const debouncedSettingsUpdate = debounce(async (settings: DmScreenSettings) => {
  isUpdating.value = true
  try {
    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { settings }
    )
    toast.success('Settings saved')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to update settings:', error)
    toast.error('Failed to save settings')
  } finally {
    setTimeout(() => {
      isUpdating.value = false
    }, 100)
  }
}, 300)

// Handle node changes (position and dimension updates)
function onNodesChange(changes: NodeChange[]) {
  // First, handle selection changes
  const selectChanges = changes.filter((c) => c.type === 'select')
  if (selectChanges.length > 0) {
    const selectChange = selectChanges[0] as any
    if (selectChange.selected) {
      const selectedItem = props.dmScreen.items?.find((item: DmScreenItem) => item.id === selectChange.id)
      console.log('Selected item:', selectedItem)
      emit('selected-item', selectedItem || null)
    } else {
      // Check if any other node is still selected
      const hasSelectedNode = allNodes.value.some((n: any) => n.selected && n.id !== selectChange.id)
      if (!hasSelectedNode) {
        console.log('No selected item')
        emit('selected-item', null)
      }
    }
  }

  // Then handle position/dimension changes
  if (!props.dmScreen.items || isUpdating.value) return // Don't process if we're updating

  const itemChanges = changes.filter((c) => 'id' in c && c.type !== 'select')
  if (itemChanges.length === 0) return

  const positionChanges = itemChanges.filter((c) => c.type === 'position' && 'position' in c && 'id' in c)
  const dimensionChanges = itemChanges.filter((c) => c.type === 'dimensions' && 'dimensions' in c && 'id' in c)
  
  if (positionChanges.length === 0 && dimensionChanges.length === 0) return

  const updatedItems = props.dmScreen.items.map((item: DmScreenItem) => {
    let updated = false
    const newOptions = { ...item.nodeOptions }
    
    // Handle position changes
    const posChange = positionChanges.find((c) => 'id' in c && c.id === item.id)
    if (posChange && 'position' in posChange && posChange.position) {
      newOptions.x = posChange.position.x
      newOptions.y = posChange.position.y
      newOptions.position = posChange.position
      updated = true
    }
    
    // Handle dimension changes
    const dimChange = dimensionChanges.find((c) => 'id' in c && c.id === item.id)
    if (dimChange && 'dimensions' in dimChange && dimChange.dimensions) {
      newOptions.width = dimChange.dimensions.width
      newOptions.height = dimChange.dimensions.height
      updated = true
      
      // If item is minimized, update minimizedDimensions too
      if (item.isMinimized) {
        const newItem = {
          ...item,
          nodeOptions: newOptions,
          minimizedDimensions: {
            width: dimChange.dimensions.width,
            height: dimChange.dimensions.height,
          }
        }
        return newItem
      }
    }
    
    if (updated) {
      return {
        ...item,
        nodeOptions: newOptions,
      }
    }
    return item
  })

  // Update local state immediately (optimistic update)
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen && !isUpdating.value) {
    currentScreen.items = updatedItems
  }

  // Debounced API update
  debouncedUpdate(updatedItems)
}

// Handle node drag stop (snap to grid if enabled)
function onNodeDragStop(event: NodeDragEvent) {
  if (!snapToGrid.value || !gridSize.value) return
  if (!props.dmScreen.items) return

  const node = event.node
  const snappedX = Math.round(node.position.x / gridSize.value) * gridSize.value
  const snappedY = Math.round(node.position.y / gridSize.value) * gridSize.value

  // Update node position
  node.position = { x: snappedX, y: snappedY }

  // Update item
  const updatedItems = props.dmScreen.items.map((item: DmScreenItem) => {
    if (item.id === node.id) {
      return {
        ...item,
        nodeOptions: {
          ...item.nodeOptions,
          x: snappedX,
          y: snappedY,
          position: { x: snappedX, y: snappedY },
        },
      }
    }
    return item
  })

  // Update immediately (no debounce for snap)
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen) {
    currentScreen.items = updatedItems
  }

  debouncedUpdate(updatedItems)
}


// Handle item update from child component
function handleItemUpdate(updatedItem: DmScreenItem) {
  if (!props.dmScreen.items) return

  const updatedItems = props.dmScreen.items.map((item: DmScreenItem) =>
    item.id === updatedItem.id ? updatedItem : item
  )

  // Update local state immediately
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen) {
    currentScreen.items = updatedItems
  }

  // Debounced API update
  debouncedUpdate(updatedItems)
}

// Handle item delete
async function handleItemDelete(itemId: string) {
  if (!props.dmScreen.items) return

  const item = props.dmScreen.items.find((i: DmScreenItem) => i.id === itemId)
  const isBackground = item?.data.isBackground === true

  const updatedItems = props.dmScreen.items.filter((item: DmScreenItem) => item.id !== itemId)

  // If deleting background image, also remove from settings
  if (isBackground) {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      backgroundImageId: undefined,
    }
    
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.settings = updatedSettings
    }
    
    debouncedSettingsUpdate(updatedSettings)
  }

  try {
    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )
    toast.success('Item removed from DM screen')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to delete item:', error)
    toast.error('Failed to remove item')
  }
}

// Update shape preview (visual only, no save yet)
function updateShapePreview() {
  // This is just for the preview, actual save happens in saveShapeStyle
  // No need to do anything here as the preview binds directly to editingShapeData
}

// Save shape style
function saveShapeStyle() {
  if (!editingShapeItemId.value || !props.dmScreen.items) return

  const updatedItems = props.dmScreen.items.map((item: DmScreenItem) => {
    if (item.id === editingShapeItemId.value && item.type === 'ShapeNode') {
      return {
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
    }
    return item
  })

  // Update local state
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen) {
    currentScreen.items = updatedItems
  }

  // Debounced update
  debouncedUpdate(updatedItems)
  
  showShapeStyleDialog.value = false
  toast.success('Shape style updated')
}

// Handle add library item
async function handleAddLibraryItem(libraryItem: LibraryItem) {
  if (!props.dmScreen.items) return

  try {
    // Get featured image URL if available
    let featuredImageUrl: string | null = null
    if (libraryItem.featuredImage) {
      featuredImageUrl = await filesStore.getDownloadUrl(libraryItem.featuredImage.id)
    }

    // Convert library item to DM screen item
    const newItem = dmScreensStore.convertLibraryItemToDmScreenItem(
      libraryItem,
      featuredImageUrl
    )
    
    // Center the item in the viewport
    const center = getViewportCenter(300, 500) // 3:5 ratio
    newItem.nodeOptions = {
      ...newItem.nodeOptions,
      x: center.x,
      y: center.y,
      position: center,
    }

    const updatedItems = [...(props.dmScreen.items || []), newItem]

    // Update local state immediately
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }

    // Save to API
    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )

    toast.success('Item added to DM screen')
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add item:', error)
    toast.error('Failed to add item')
  }
}

// Helper function to get image dimensions and calculate height
async function getImageDimensions(fileId: number): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    filesStore.getDownloadUrl(fileId).then(url => {
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        // Fallback to default aspect ratio (4:3)
        resolve({ width: 500, height: 375 })
      }
      img.src = url
    }).catch(() => {
      resolve({ width: 500, height: 375 })
    })
  })
}

// Handle background image selection (supports multiple backgrounds)
async function handleBackgroundImageSelect(fileId: number | number[] | string | string[]) {
  // Convert to number if needed
  let id: number
  if (Array.isArray(fileId)) {
    id = typeof fileId[0] === 'number' ? fileId[0] : parseInt(fileId[0] as string, 10)
  } else {
    id = typeof fileId === 'number' ? fileId : parseInt(fileId as string, 10)
  }

  try {
    // Get image dimensions to calculate correct aspect ratio
    const { width: imgWidth, height: imgHeight } = await getImageDimensions(id)
    const aspectRatio = imgHeight / imgWidth
    const fixedWidth = 500
    const calculatedHeight = Math.round(fixedWidth * aspectRatio)

    // Create new background image item (allow multiple backgrounds)
    const existingBackgroundCount = props.dmScreen.items?.filter((item: DmScreenItem) => 
      item.type === 'UserFileId' && item.data.isBackground === true
    ).length || 0

    console.log('[DmScreenWrapper] Adding background image:', {
      fileId: id,
      existingBackgroundCount,
      currentItemsCount: props.dmScreen.items?.length || 0,
      dimensions: { width: fixedWidth, height: calculatedHeight, aspectRatio }
    })

    const backgroundItem: DmScreenItem = {
      id: `background-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'UserFileId',
      data: {
        id: id,
        isBackground: true,
      },
      nodeOptions: {
        x: 100 + (existingBackgroundCount * 50),
        y: 100 + (existingBackgroundCount * 50),
        position: { 
          x: 100 + (existingBackgroundCount * 50), 
          y: 100 + (existingBackgroundCount * 50)
        },
        width: fixedWidth,
        height: calculatedHeight,
        resizable: true,
      },
      isMinimized: false,
    }

    const updatedItems = [...(props.dmScreen.items || []), backgroundItem]
    
    console.log('[DmScreenWrapper] Created background item:', backgroundItem)
    console.log('[DmScreenWrapper] Updated items count:', updatedItems.length)

    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }

    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )

    console.log('[DmScreenWrapper] Background image saved successfully')
    toast.success('Background image added')
    showFileManager.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to add background image:', error)
    toast.error('Failed to add background image')
  }
}

// Remove background image
async function removeBackgroundImage() {
  if (!backgroundImageItem.value) return

  await handleItemDelete(backgroundImageItem.value.id)

  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    backgroundImageId: undefined,
    backgroundImageWidth: undefined,
  }
  
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen) {
    currentScreen.settings = updatedSettings
  }
  
  backgroundImageUrl.value = null
  debouncedSettingsUpdate(updatedSettings)
}

// Handle canvas background selection
async function handleCanvasBackgroundSelect(fileId: number | number[] | string | string[]) {
  // Convert to number if needed
  let id: number
  if (Array.isArray(fileId)) {
    id = typeof fileId[0] === 'number' ? fileId[0] : parseInt(fileId[0] as string, 10)
  } else {
    id = typeof fileId === 'number' ? fileId : parseInt(fileId as string, 10)
  }

  try {
    const updatedSettings: DmScreenSettings = {
      ...props.dmScreen.settings,
      canvasBackgroundImageId: id,
    }
    
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.settings = updatedSettings
    }

    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { settings: updatedSettings }
    )

    console.log('[DmScreenWrapper] Canvas background set successfully')
    toast.success('Canvas background set')
    showCanvasBackgroundSelector.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to set canvas background:', error)
    toast.error('Failed to set canvas background')
  }
}

// Remove canvas background
function removeCanvasBackground() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    canvasBackgroundImageId: undefined,
  }
  
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen) {
    currentScreen.settings = updatedSettings
  }
  
  canvasBackgroundUrl.value = null
  debouncedSettingsUpdate(updatedSettings)
  toast.success('Canvas background removed')
}

// Handle drag over
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

// Handle drop from kitbashing drawers
async function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  console.log('[DmScreenWrapper] Drop event received', event)
  
  if (!event.dataTransfer) {
    console.warn('[DmScreenWrapper] No dataTransfer in drop event')
    return
  }
  
  try {
    // Try to get data from application/json first
    let data = event.dataTransfer.getData('application/json')
    let parsed: any = null
    
    if (data) {
      try {
        parsed = JSON.parse(data)
        console.log('[DmScreenWrapper] Parsed JSON data:', parsed)
      } catch (e) {
        console.warn('[DmScreenWrapper] Failed to parse JSON data:', e)
      }
    }
    
    // Fallback to text/plain format (file:123)
    if (!parsed || !parsed.fileId) {
      const textData = event.dataTransfer.getData('text/plain')
      console.log('[DmScreenWrapper] Text data:', textData)
      if (textData && textData.startsWith('file:')) {
        const fileId = parseInt(textData.replace('file:', ''), 10)
        if (!isNaN(fileId)) {
          parsed = { type: 'user-file-background', fileId }
          console.log('[DmScreenWrapper] Parsed from text data:', parsed)
        }
      }
    }
    
    // Accept both 'user-file-background' and 'user-file' types
    // (LazyFilePreview might override the type, but we can still process it)
    if (!parsed || !parsed.fileId) {
      console.warn('[DmScreenWrapper] Invalid drop data:', parsed)
      return
    }
    
    // Check if it's a user file (either type)
    const isUserFile = parsed.type === 'user-file-background' || parsed.type === 'user-file'
    if (!isUserFile) {
      console.warn('[DmScreenWrapper] Drop data is not a user file:', parsed)
      return
    }
    
    const isBackground = parsed.type === 'user-file-background'
    console.log('[DmScreenWrapper] Processing user file drop:', parsed.fileId, 'type:', parsed.type, 'isBackground:', isBackground)
    
    // Get drop position in flow coordinates
    const dropPosition = project({ x: event.clientX, y: event.clientY })
    console.log('[DmScreenWrapper] Drop position:', { clientX: event.clientX, clientY: event.clientY, flow: dropPosition })
    
    let newItem: DmScreenItem
    
    if (isBackground) {
      // Background image: fixed width with aspect ratio
      // Get image dimensions to calculate correct aspect ratio
      let imgWidth = 500
      let imgHeight = 375
      let aspectRatio = 0.75
      
      try {
        const dimensions = await getImageDimensions(parsed.fileId)
        imgWidth = dimensions.width
        imgHeight = dimensions.height
        aspectRatio = imgHeight / imgWidth
      } catch (error) {
        console.warn('[DmScreenWrapper] Failed to get image dimensions, using default aspect ratio:', error)
        // Continue with default 4:3 aspect ratio
      }
      
      const fixedWidth = 500
      const calculatedHeight = Math.round(fixedWidth * aspectRatio)
      
      console.log('[DmScreenWrapper] Image dimensions:', { imgWidth, imgHeight, aspectRatio, calculatedHeight })
      
      newItem = {
        id: `background-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'UserFileId',
        data: {
          id: parsed.fileId,
          isBackground: true,
        },
        nodeOptions: {
          x: dropPosition.x - fixedWidth / 2,
          y: dropPosition.y - calculatedHeight / 2,
          position: { 
            x: dropPosition.x - fixedWidth / 2,
            y: dropPosition.y - calculatedHeight / 2
          },
          width: fixedWidth,
          height: calculatedHeight,
          resizable: true,
        },
        isMinimized: false,
      }
    } else {
      // Regular UserFile node: default size for MediaCard
      const defaultWidth = 300
      const defaultHeight = 400
      
      newItem = {
        id: `userfile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'UserFileId',
        data: {
          id: parsed.fileId,
          isBackground: false,
        },
        nodeOptions: {
          x: dropPosition.x - defaultWidth / 2,
          y: dropPosition.y - defaultHeight / 2,
          position: { 
            x: dropPosition.x - defaultWidth / 2,
            y: dropPosition.y - defaultHeight / 2
          },
          width: defaultWidth,
          height: defaultHeight,
          resizable: true,
        },
        isMinimized: false,
      }
    }
    
    console.log('[DmScreenWrapper] Created user file item:', newItem)
    
    const updatedItems = [...(props.dmScreen.items || []), newItem]
    
    const currentScreen = dmScreensStore.dmScreens.find(
      (ds: DmScreen) => ds.id === props.dmScreen.id
    )
    if (currentScreen) {
      currentScreen.items = updatedItems
    }
    
    await dmScreensStore.updateDmScreen(
      props.dmScreen.libraryId,
      props.dmScreen.id,
      { items: updatedItems }
    )
    
    console.log('[DmScreenWrapper] User file added successfully')
    toast.success(isBackground ? 'Background image added' : 'File added to DM screen')
  } catch (error) {
    console.error('[DmScreenWrapper] Failed to handle drop:', error)
    toast.error('Failed to add image')
  }
}

// Save settings
function saveSettings() {
  const updatedSettings: DmScreenSettings = {
    ...props.dmScreen.settings,
    grid: { ...localGridOptions.value },
    backgroundImageWidth: localBackgroundImageWidth.value,
    lockBackgroundImages: localLockBackgroundImages.value,
    backgroundOpacity: localBackgroundOpacity.value,
  }
  
  // Update local state
  const currentScreen = dmScreensStore.dmScreens.find(
    (ds: DmScreen) => ds.id === props.dmScreen.id
  )
  if (currentScreen) {
    currentScreen.settings = updatedSettings
  }
  
  // Emit updates to parent
  emit('update:lock-background-images', localLockBackgroundImages.value)
  emit('update:show-grid', localGridOptions.value.showGrid || false)
  
  debouncedSettingsUpdate(updatedSettings)
  showSettingsDialog.value = false
}

// Send DM screen to portal
async function handleSendToPortal() {
  if (!hasActivePortal.value) {
    toast.error('No active portal. Please set an active portal first.')
    return
  }
  
  try {
    await portalViewsStore.addDmScreenToActivePortal(props.dmScreen, true)
    toast.success('DM screen sent to portal')
    showSettingsDialog.value = false
  } catch (error: any) {
    console.error('[DmScreenWrapper] Failed to send DM screen to portal:', error)
    toast.error(error.message || 'Failed to send DM screen to portal')
  }
}
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

/* Shape Style Editor Styles */
.shape-color-picker {
  width: 50px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
}

.shape-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.shape-preview-label {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.shape-preview {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 8px;
}
</style>
