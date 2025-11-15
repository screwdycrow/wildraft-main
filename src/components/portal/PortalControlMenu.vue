<template>
  <v-menu location="bottom" :close-on-content-click="false" max-width="400">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="text"
        class="portal-control-button"
      >
        <v-icon icon="mdi-monitor-dashboard" class="mr-2" />
        <span class="portal-name">{{ activePortal?.name || 'No Active Portal' }}</span>
        <v-icon icon="mdi-menu-down" class="ml-1" />
        
        <!-- Connection Status Badge -->
        <v-badge
          :color="isConnected ? 'success' : 'error'"
          :content="isConnected ? '●' : '○'"
          floating
          offset-x="-8"
          offset-y="8"
        />
      </v-btn>
    </template>

    <v-card class="portal-control-card">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-3">
        <v-icon icon="mdi-monitor-dashboard" size="small" class="mr-2" />
        <span class="text-subtitle-2">Portal Controls</span>
        <v-spacer />
        <v-chip
          :color="isConnected ? 'success' : 'error'"
          size="x-small"
          variant="flat"
        >
          {{ isConnected ? 'Connected' : 'Disconnected' }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <!-- Active Portal Selection -->
      <v-card-text class="pa-3">
        <v-select
          :model-value="activePortal?.portalViewId"
          :items="portalViewOptions"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          placeholder="Select a portal..."
          prepend-inner-icon="mdi-view-dashboard-variant"
          @update:model-value="handlePortalChange"
        >
          <template #append>
            <v-btn
              v-if="activePortal"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click.stop="clearActivePortal"
            />
          </template>
        </v-select>

        <template v-if="activePortal">
          <v-divider class="my-3" />

          <!-- Items Preview Row -->
          <div class="mb-3">
            <div class="d-flex align-center gap-2 mb-2">
              <span class="text-caption text-medium-emphasis">Items:</span>
              <v-spacer />
              <v-btn
                icon="mdi-television-off"
                size="x-small"
                variant="text"
                @click="hideOnTop"
                :disabled="!isConnected"
              >
                <v-icon />
                <v-tooltip activator="parent" location="top">Hide On Top</v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-delete-sweep"
                size="x-small"
                variant="text"
                color="error"
                @click="clearAllItems"
                :disabled="!isConnected || !currentPortal?.items || currentPortal.items.length === 0"
              >
                <v-icon />
                <v-tooltip activator="parent" location="top">Clear All Items</v-tooltip>
              </v-btn>
            </div>
            <div class="items-preview-scroll">
              <div class="items-preview-container">
                <div
                  v-for="(item, index) in currentPortal?.items || []"
                  :key="item.id || index"
                  class="item-preview-card"
                  :class="{ 'item-preview-card--active': index === (currentPortal?.currentItem || 0) }"
                  @click="setActiveItem(index)"
                >
                  <!-- UserFile Preview (ImageViewer, VideoViewer, PDFViewer) -->
                  <div v-if="isUserFileType(item.type)" class="item-preview-image">
                    <img
                      v-if="itemPreviewUrls[index]"
                      :src="itemPreviewUrls[index]"
                      :alt="getItemTitle(item, index)"
                      @error="handlePreviewError(index)"
                    />
                    <v-icon
                      v-else-if="itemPreviewLoading[index]"
                      icon="mdi-loading"
                      size="small"
                      class="item-preview-loading"
                    />
                    <v-icon
                      v-else
                      :icon="getItemTypeIcon(item.type)"
                      size="small"
                      class="item-preview-placeholder"
                    />
                    <div class="item-preview-overlay">
                      <span class="item-preview-index">{{ index + 1 }}</span>
                    </div>
                  </div>
                  <!-- Non-UserFile Type (libraryItemViewer) -->
                  <div v-else class="item-preview-text">
                    <v-icon :icon="getItemTypeIcon(item.type)" size="small" />
                    <span class="text-caption">{{ item.type }}</span>
                  </div>
                  
                  <!-- Hover Action: Show On Top -->
                  <div class="item-preview-hover-action">
                    <v-btn
                      icon="mdi-television-play"
                      size="x-small"
                      variant="flat"
                      color="purple"
                      @click.stop="showOnTopForItem(index)"
                      :disabled="!isConnected"
                    >
                      <v-icon size="x-small" />
                      <v-tooltip activator="parent" location="top">Show On Top</v-tooltip>
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- Navigation Controls -->
          <div class="mb-3">
            <div class="d-flex gap-2">
              <v-btn
                icon="mdi-chevron-left"
                size="small"
                variant="tonal"
                @click="previousItem"
                :disabled="!isConnected"
              >
                <v-icon />
                <v-tooltip activator="parent">Previous Item</v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-chevron-right"
                size="small"
                variant="tonal"
                @click="nextItem"
                :disabled="!isConnected"
              >
                <v-icon />
                <v-tooltip activator="parent">Next Item</v-tooltip>
              </v-btn>
              <v-spacer />
              <v-btn
                icon="mdi-sword-cross"
                size="small"
                variant="tonal"
                @click="toggleEncounter"
                :disabled="!isConnected"
              >
                <v-icon />
                <v-tooltip activator="parent">Toggle Encounter</v-tooltip>
              </v-btn>
              <v-btn
                icon="mdi-cog"
                size="small"
                variant="tonal"
                color="primary"
                @click="openPortalSettings"
              >
                <v-icon />
                <v-tooltip activator="parent">Settings</v-tooltip>
              </v-btn>
            </div>
          </div>

          <!-- Image Viewer Controls (only show for ImageViewer/UrlImageViewer) -->
          <template v-if="isImageViewerActive">
            <v-divider class="my-3" />
            
            <!-- Zoom & Pan -->
            <div class="control-section mb-2">
              <div class="d-flex gap-1 mb-2">
                <v-btn
                  icon="mdi-magnify-minus"
                  size="x-small"
                  variant="tonal"
                  @click="zoomOut"
                  :disabled="!isConnected || combatLock"
                >
                  <v-icon />
                </v-btn>
                <v-btn
                  icon="mdi-magnify-plus"
                  size="x-small"
                  variant="tonal"
                  @click="zoomIn"
                  :disabled="!isConnected || combatLock"
                >
                  <v-icon />
                </v-btn>
                <v-btn
                  icon="mdi-rotate-right"
                  size="x-small"
                  variant="tonal"
                  @click="rotate"
                  :disabled="!isConnected || combatLock"
                >
                  <v-icon />
                </v-btn>
                <v-btn
                  icon="mdi-fit-to-screen"
                  size="x-small"
                  variant="tonal"
                  @click="resetView"
                  :disabled="!isConnected || combatLock"
                >
                  <v-icon />
                  <v-tooltip activator="parent" location="bottom">Reset View</v-tooltip>
                </v-btn>
                <v-btn
                  icon="mdi-restore"
                  size="x-small"
                  variant="tonal"
                  @click="restoreState"
                  :disabled="!isConnected || combatLock"
                >
                  <v-icon />
                  <v-tooltip activator="parent" location="bottom">Restore Last State</v-tooltip>
                </v-btn>
              </div>

              <!-- Pan Controls -->
              <div class="pan-controls">
                <div class="pan-row">
                  <v-btn
                    icon="mdi-arrow-up"
                    size="x-small"
                    variant="tonal"
                    @click="panUp"
                    :disabled="!isConnected || combatLock"
                  />
                </div>
                <div class="pan-row">
                  <v-btn
                    icon="mdi-arrow-left"
                    size="x-small"
                    variant="tonal"
                    @click="panLeft"
                    :disabled="!isConnected || combatLock"
                  />
                  <v-btn
                    icon="mdi-crosshairs"
                    size="x-small"
                    variant="tonal"
                    @click="resetPosition"
                    :disabled="!isConnected || combatLock"
                  />
                  <v-btn
                    icon="mdi-arrow-right"
                    size="x-small"
                    variant="tonal"
                    @click="panRight"
                    :disabled="!isConnected || combatLock"
                  />
                </div>
                <div class="pan-row">
                  <v-btn
                    icon="mdi-arrow-down"
                    size="x-small"
                    variant="tonal"
                    @click="panDown"
                    :disabled="!isConnected || combatLock"
                  />
                </div>
              </div>
            </div>

            <!-- Combat Lock -->
            <div class="mb-2">
              <v-btn
                :prepend-icon="combatLock ? 'mdi-lock' : 'mdi-lock-open'"
                :color="combatLock ? 'error' : 'success'"
                variant="tonal"
                size="small"
                block
                @click="toggleCombatLock"
                :disabled="!isConnected"
              >
                {{ combatLock ? 'Locked' : 'Unlocked' }}
              </v-btn>
            </div>

            <!-- Grid Toggle -->
            <div class="mb-2">
              <v-btn
                :prepend-icon="showGrid ? 'mdi-grid' : 'mdi-grid-off'"
                :color="showGrid ? 'primary' : undefined"
                variant="tonal"
                size="small"
                block
                @click="toggleGrid"
                :disabled="!isConnected"
              >
                Grid {{ showGrid ? 'ON' : 'OFF' }}
              </v-btn>
            </div>
            
            <!-- Grid Settings (collapsed) -->
            <v-expand-transition>
              <div v-if="showGrid" class="grid-settings pa-2 mb-2">
                <div class="mb-2">
                  <div class="d-flex align-center gap-2">
                    <v-icon icon="mdi-resize" size="x-small" />
                    <v-slider
                      v-model="gridSize"
                      :min="5"
                      :max="100"
                      :step="5"
                      density="compact"
                      hide-details
                      @update:model-value="updateViewerState"
                      :disabled="!isConnected"
                    />
                    <span class="text-caption">{{ gridSize }}vh</span>
                  </div>
                </div>
                
                <div class="mb-2">
                  <div class="d-flex align-center gap-2">
                    <v-icon icon="mdi-opacity" size="x-small" />
                    <v-slider
                      v-model="gridOpacity"
                      :min="0.1"
                      :max="1"
                      :step="0.1"
                      density="compact"
                      hide-details
                      @update:model-value="updateViewerState"
                      :disabled="!isConnected"
                    />
                    <span class="text-caption">{{ Math.round(gridOpacity * 100) }}%</span>
                  </div>
                </div>
                
                <div class="d-flex gap-1">
                  <v-btn
                    size="x-small"
                    :color="gridColor === '#ffffff' ? 'primary' : undefined"
                    @click="setGridColor('#ffffff')"
                    variant="tonal"
                    :disabled="!isConnected"
                  >
                    W
                  </v-btn>
                  <v-btn
                    size="x-small"
                    :color="gridColor === '#000000' ? 'primary' : undefined"
                    @click="setGridColor('#000000')"
                    variant="tonal"
                    :disabled="!isConnected"
                  >
                    B
                  </v-btn>
                  <v-btn
                    size="x-small"
                    :color="gridColor === '#ff0000' ? 'primary' : undefined"
                    @click="setGridColor('#ff0000')"
                    variant="tonal"
                    :disabled="!isConnected"
                  >
                    R
                  </v-btn>
                  <v-btn
                    size="x-small"
                    :color="gridColor === '#00ff00' ? 'primary' : undefined"
                    @click="setGridColor('#00ff00')"
                    variant="tonal"
                    :disabled="!isConnected"
                  >
                    G
                  </v-btn>
                  <v-btn
                    size="x-small"
                    :color="gridColor === '#0000ff' ? 'primary' : undefined"
                    @click="setGridColor('#0000ff')"
                    variant="tonal"
                    :disabled="!isConnected"
                  >
                    B
                  </v-btn>
                </div>
              </div>
            </v-expand-transition>
          </template>

        </template>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { usePortalViewsStore } from '@/stores/portalViews'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useFilesStore } from '@/stores/files'
import type { ViewerState, PortalViewItem } from '@/types/portal.types'

const router = useRouter()
const route = useRoute()
const portalViewsStore = usePortalViewsStore()
const {
  isConnected,
  sendPortalViewUpdate,
} = usePortalSocket()

const activePortal = computed(() => portalViewsStore.activePortal)
const currentPortal = computed(() => portalViewsStore.currentPortalView)
const filesStore = useFilesStore()

const portalViewOptions = computed(() => {
  return portalViewsStore.portalViews.map(pv => ({
    id: pv.id,
    name: pv.name,
    libraryId: pv.libraryId,
  }))
})

// Item preview state
const itemPreviewUrls = ref<Record<number, string>>({})
const itemPreviewLoading = ref<Record<number, boolean>>({})
const itemPreviewErrors = ref<Record<number, boolean>>({})

// Helper functions for item previews
const isUserFileType = (type: string): boolean => {
  return type === 'ImageViewer' || type === 'VideoViewer' || type === 'PDFViewer'
}

const getItemTypeIcon = (type: string): string => {
  switch (type) {
    case 'ImageViewer':
      return 'mdi-image'
    case 'VideoViewer':
      return 'mdi-video'
    case 'PDFViewer':
      return 'mdi-file-pdf-box'
    case 'libraryItemViewer':
      return 'mdi-file-document'
    default:
      return 'mdi-file'
  }
}

const getItemTitle = (item: PortalViewItem, index: number): string => {
  if (item.object && typeof item.object === 'object' && 'fileName' in item.object) {
    return (item.object as any).fileName || `Item ${index + 1}`
  }
  return `Item ${index + 1}: ${item.type}`
}

// Fetch preview URL for a UserFile item
const fetchItemPreview = async (item: PortalViewItem, index: number, forceRefresh = false) => {
  if (!isUserFileType(item.type)) return
  
  const itemObject = item.object as any
  const fileId = itemObject?.id
  
  if (!fileId || typeof fileId !== 'number') {
    console.warn(`[PortalControlMenu] Item ${index} has no valid file ID:`, itemObject)
    itemPreviewErrors.value[index] = true
    return
  }
  
  // Skip if already loaded (unless force refresh) or currently loading
  if (!forceRefresh && (itemPreviewUrls.value[index] || itemPreviewLoading.value[index])) {
    return
  }
  
  itemPreviewLoading.value[index] = true
  itemPreviewErrors.value[index] = false
  
  try {
    // Get download URL for all UserFile types
    const url = await filesStore.getDownloadUrl(fileId)
    
    if (url) {
      // For ImageViewer, use the download URL directly as preview
      if (item.type === 'ImageViewer') {
        itemPreviewUrls.value[index] = url
      } else if (item.type === 'VideoViewer') {
        // For videos, we could potentially use a video thumbnail
        // For now, try to use the URL as a preview (browsers can show video thumbnails)
        itemPreviewUrls.value[index] = url
      } else if (item.type === 'PDFViewer') {
        // PDFs don't have image previews, but we can try to use a placeholder
        // or potentially use a PDF thumbnail service in the future
        itemPreviewErrors.value[index] = true
      }
    } else {
      console.warn(`[PortalControlMenu] No download URL returned for item ${index}`)
      itemPreviewErrors.value[index] = true
    }
  } catch (error) {
    console.error(`[PortalControlMenu] Failed to fetch preview for item ${index}:`, error)
    itemPreviewErrors.value[index] = true
    // Try to retry once after a short delay
    setTimeout(() => {
      if (itemPreviewErrors.value[index] && !itemPreviewUrls.value[index]) {
        fetchItemPreview(item, index, true)
      }
    }, 1000)
  } finally {
    itemPreviewLoading.value[index] = false
  }
}

// Load previews for all items
const loadItemPreviews = async (forceRefresh = false) => {
  if (!currentPortal.value?.items) return
  
  const items = currentPortal.value.items
  
  // Load previews in parallel for better performance
  const previewPromises = items.map((item, index) => {
    if (isUserFileType(item.type)) {
      return fetchItemPreview(item, index, forceRefresh).catch(error => {
        console.error(`[PortalControlMenu] Failed to load preview for item ${index}:`, error)
        return null
      })
    }
    return Promise.resolve(null)
  })
  
  await Promise.all(previewPromises)
}

const handlePreviewError = (index: number) => {
  // If image fails to load, try to refetch the download URL
  const currentPortal = portalViewsStore.currentPortalView
  if (!currentPortal?.items || index >= currentPortal.items.length) {
    itemPreviewErrors.value[index] = true
    itemPreviewUrls.value[index] = ''
    return
  }
  
  const item = currentPortal.items[index]
  if (isUserFileType(item.type)) {
    // Clear the failed URL and retry fetching
    itemPreviewUrls.value[index] = ''
    itemPreviewErrors.value[index] = false
    
    // Retry fetching the preview with force refresh
    setTimeout(() => {
      fetchItemPreview(item, index, true)
    }, 500)
  } else {
    itemPreviewErrors.value[index] = true
    itemPreviewUrls.value[index] = ''
  }
}

// Set active item
const setActiveItem = async (index: number) => {
  if (!activePortal.value || !currentPortal.value?.items) return
  if (index < 0 || index >= currentPortal.value.items.length) return
  
  // Update locally first (optimistic)
  await portalViewsStore.updatePortalView(
    activePortal.value.libraryId,
    activePortal.value.portalViewId,
    { currentItem: index }
  )
  
  // Send command to backend
  sendPortalViewUpdate({
    command: 'change-item',
    itemIndex: index,
  })
}

// Clear all items
const clearAllItems = async () => {
  if (!activePortal.value) return
  
  if (!confirm('Are you sure you want to clear all items from this portal?')) {
    return
  }
  
  try {
    await portalViewsStore.updatePortalView(
      activePortal.value.libraryId,
      activePortal.value.portalViewId,
      { items: [], currentItem: null }
    )
    
    // Clear preview URLs
    itemPreviewUrls.value = {}
    itemPreviewLoading.value = {}
    itemPreviewErrors.value = {}
  } catch (error) {
    console.error('[PortalControlMenu] Failed to clear items:', error)
  }
}

// Check if current item is an ImageViewer or UrlImageViewer
const isImageViewerActive = computed(() => {
  if (!currentPortal.value?.items || currentPortal.value.items.length === 0) return false
  
  const currentItemIndex = currentPortal.value.currentItem || 0
  const currentItem = currentPortal.value.items[currentItemIndex]
  
  return currentItem?.type === 'ImageViewer' || currentItem?.type === 'UrlImageViewer'
})

// Viewer state (mirrors ImageViewer.vue)
const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const rotation = ref(0)
const showGrid = ref(false)
const gridSize = ref(50) // vh units
const gridColor = ref('#000000')
const gridOpacity = ref(0.2)
const combatLock = ref(false)


// Build ViewerState object
const buildViewerState = (): ViewerState => {
  return {
    timestamp: Date.now(),
    scale: scale.value,
    position: { ...position.value },
    rotation: rotation.value,
    showGrid: showGrid.value,
    gridSize: gridSize.value,
    gridColor: gridColor.value,
    gridOpacity: gridOpacity.value,
    combatLock: combatLock.value,
  }
}

// Send viewer state update
const updateViewerState = () => {
  if (!isConnected.value) return
  
  const viewerState = buildViewerState()
  sendPortalViewUpdate({
    command: 'update-viewer-state',
    viewerState,
  })
}

// Portal control functions
const handlePortalChange = async (portalViewId: string) => {
  const portalView = portalViewsStore.portalViews.find(pv => pv.id === portalViewId)
  if (!portalView) return
  
  try {
    // Fetch the portal view details to ensure we have the latest data
    await portalViewsStore.fetchPortalView(portalView.libraryId, portalViewId)
    
    // Set as active portal (this will trigger watchers and re-render)
    const fetchedPortalView = portalViewsStore.currentPortalView
    if (fetchedPortalView) {
      portalViewsStore.setActivePortal(fetchedPortalView)
      
      // Load item previews for the new portal (force refresh to get fresh download URLs)
      loadItemPreviews(true)
    }
  } catch (error) {
    console.error('[PortalControlMenu] Failed to fetch portal view:', error)
  }
}

const clearActivePortal = () => {
  portalViewsStore.clearActivePortal()
}

const openPortalSettings = () => {
  if (activePortal.value) {
    router.push({
      name: 'PortalView',
      params: {
        id: activePortal.value.libraryId,
        portalViewId: activePortal.value.portalViewId,
      },
    })
  }
}

const nextItem = async () => {
  const currentPortal = portalViewsStore.currentPortalView
  if (!currentPortal?.items || currentPortal.items.length === 0) return
  
  const currentIndex = currentPortal.currentItem || 0
  const nextIndex = (currentIndex + 1) % currentPortal.items.length
  
  // Update locally first (optimistic)
  if (activePortal.value) {
    await portalViewsStore.updatePortalView(
      activePortal.value.libraryId,
      activePortal.value.portalViewId,
      { currentItem: nextIndex }
    )
  }
  
  // Send command to backend
  sendPortalViewUpdate({ 
    command: 'change-item',
    itemIndex: nextIndex 
  })
}

const previousItem = async () => {
  const currentPortal = portalViewsStore.currentPortalView
  if (!currentPortal?.items || currentPortal.items.length === 0) return
  
  const currentIndex = currentPortal.currentItem || 0
  const prevIndex = currentIndex === 0 
    ? currentPortal.items.length - 1 
    : currentIndex - 1
  
  // Update locally first (optimistic)
  if (activePortal.value) {
    await portalViewsStore.updatePortalView(
      activePortal.value.libraryId,
      activePortal.value.portalViewId,
      { currentItem: prevIndex }
    )
  }
  
  // Send command to backend
  sendPortalViewUpdate({ 
    command: 'change-item',
    itemIndex: prevIndex 
  })
}

const resetView = () => {
  sendPortalViewUpdate({ command: 'reset-view' })
}

const restoreState = () => {
  sendPortalViewUpdate({ command: 'restore-state' })
}

const zoomIn = () => {
  if (combatLock.value) return
  scale.value = Math.min(scale.value + 0.25, 5)
  updateViewerState()
}

const zoomOut = () => {
  if (combatLock.value) return
  scale.value = Math.max(scale.value - 0.25, 0.5)
  updateViewerState()
}

const rotate = () => {
  if (combatLock.value) return
  rotation.value = (rotation.value + 90) % 360
  updateViewerState()
}

// Pan controls
const PAN_AMOUNT = 50 // pixels

const panUp = () => {
  if (combatLock.value) return
  position.value.y += PAN_AMOUNT
  updateViewerState()
}

const panDown = () => {
  if (combatLock.value) return
  position.value.y -= PAN_AMOUNT
  updateViewerState()
}

const panLeft = () => {
  if (combatLock.value) return
  position.value.x += PAN_AMOUNT
  updateViewerState()
}

const panRight = () => {
  if (combatLock.value) return
  position.value.x -= PAN_AMOUNT
  updateViewerState()
}

const resetPosition = () => {
  if (combatLock.value) return
  position.value = { x: 0, y: 0 }
  updateViewerState()
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
  updateViewerState()
}

const setGridColor = (color: string) => {
  gridColor.value = color
  updateViewerState()
}

const toggleCombatLock = () => {
  combatLock.value = !combatLock.value
  updateViewerState() // Send via viewer state instead of separate command
}

const toggleEncounter = () => {
  sendPortalViewUpdate({
    command: 'toggle-encounter',
  })
}

const showOnTopForItem = (index: number) => {
  const currentPortal = portalViewsStore.currentPortalView
  if (!currentPortal?.items) return
  
  const item = currentPortal.items[index]
  if (!item) return
  
  // Extract UserFile from item.object if it exists
  const userFile = item.object && typeof item.object === 'object' && 'id' in item.object
    ? item.object
    : null
  
  sendPortalViewUpdate({
    command: 'show-on-top',
    userFile: userFile || undefined, // Send userFile if available, otherwise send item
    item: userFile ? undefined : item, // Fallback to item if no userFile
  })
}

const hideOnTop = () => {
  sendPortalViewUpdate({
    command: 'hide-on-top',
  })
}

// Fetch portals on mount
onMounted(async () => {
  // Get library ID from route or active portal
  let libraryId = route.params.id ? Number(route.params.id) : null
  if (!libraryId && activePortal.value) {
    libraryId = activePortal.value.libraryId
  }
  
  if (libraryId) {
    try {
      await portalViewsStore.fetchPortalViews(libraryId)
      
      // If we have an active portal, fetch its details
      if (activePortal.value) {
        await portalViewsStore.fetchPortalView(
          activePortal.value.libraryId,
          activePortal.value.portalViewId
        )
        
        // Load item previews
        loadItemPreviews()
      }
    } catch (error) {
      console.error('[PortalControlMenu] Failed to fetch portals:', error)
    }
  }
})

// Watch for portal changes to reset state
watch(activePortal, (newPortal, oldPortal) => {
  if (newPortal?.portalViewId !== oldPortal?.portalViewId) {
    // Reset viewer state when switching portals
    scale.value = 1
    position.value = { x: 0, y: 0 }
    rotation.value = 0
    showGrid.value = false
    gridSize.value = 50
    gridColor.value = '#000000'
    gridOpacity.value = 0.2
    combatLock.value = false
    
    // Clear and reload previews (force refresh to get fresh download URLs)
    itemPreviewUrls.value = {}
    itemPreviewLoading.value = {}
    itemPreviewErrors.value = {}
    if (newPortal) {
      loadItemPreviews(true)
    }
  }
})

// Watch for items changes to reload previews
watch(() => currentPortal.value?.items, (newItems, oldItems) => {
  // Check if items actually changed
  if (newItems?.length !== oldItems?.length || 
      JSON.stringify(newItems?.map(i => i.id)) !== JSON.stringify(oldItems?.map(i => i.id))) {
    // Clear previews and reload with force refresh to get fresh download URLs
    itemPreviewUrls.value = {}
    itemPreviewLoading.value = {}
    itemPreviewErrors.value = {}
    if (newItems && newItems.length > 0) {
      loadItemPreviews(true) // Force refresh to get fresh download URLs
    }
  }
}, { deep: true })
</script>

<style scoped>
.portal-control-button {
  text-transform: none;
}

.portal-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.portal-control-card {
  backdrop-filter: blur(20px);
  max-height: 80vh;
  overflow-y: auto;
}

.control-section {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  padding: 8px;
}

.pan-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.pan-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.grid-settings {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.items-preview-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
}

.items-preview-scroll::-webkit-scrollbar {
  height: 6px;
}

.items-preview-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.items-preview-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.items-preview-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.items-preview-container {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  min-width: min-content;
}

.item-preview-card {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: visible;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  position: relative;
}

.item-preview-card:hover {
  transform: scale(1.05);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.item-preview-card--active {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3);
}

.item-preview-image {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border-radius: 4px;
}

.item-preview-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 40%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 4px;
}

.item-preview-index {
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.item-preview-loading,
.item-preview-placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.item-preview-text {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  color: rgba(255, 255, 255, 0.7);
}

.item-preview-text .v-icon {
  color: rgba(255, 255, 255, 0.5);
}

.item-preview-text .text-caption {
  font-size: 9px;
  line-height: 1;
  text-align: center;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-preview-hover-action {
  position: absolute;
  top: 2px;
  right: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
  pointer-events: none;
}

.item-preview-card:hover .item-preview-hover-action {
  opacity: 1;
  pointer-events: auto;
}

.item-preview-hover-action :deep(.v-btn) {
  min-width: 20px !important;
  width: 20px !important;
  height: 20px !important;
  padding: 0 !important;
}

.item-preview-hover-action :deep(.v-icon) {
  font-size: 12px !important;
}
</style>
