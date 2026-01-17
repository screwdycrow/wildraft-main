<template>
  <div class="portal-view-view">
    <!-- Loading State -->
    <div v-if="portalViewsStore.isLoading && !portalView" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading portal view...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="portalViewsStore.error && !portalView" class="error-state">
      <v-icon icon="mdi-alert-circle" size="120" color="error" class="mb-6" />
      <h2 class="text-h4 font-weight-bold mb-4">Failed to load portal view</h2>
      <p class="text-body-1 text-grey-lighten-1 mb-6">{{ portalViewsStore.error }}</p>
    </div>

    <!-- Portal View Content -->
    <div v-else-if="portalView" class="portal-content">
      <!-- Items Display -->
      <div v-if="portalView.items && portalView.items.length > 0" class="portal-items">
        <portal-view-item
          v-for="(item, index) in portalView.items"
          :key="item.id || index"
          :ref="index === currentItemIndex ? (el: any) => { if (el && typeof el !== 'string') currentItemRef = el } : undefined"
          :item="item"
          :index="index"
          :viewer-state="index === currentItemIndex ? currentViewerState : null"
          :should-restore-state="index === currentItemIndex ? shouldRestoreState : 0"
          v-show="index === currentItemIndex"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <v-icon icon="mdi-view-grid-outline" size="120" color="grey-lighten-1" class="mb-6" />
        <h2 class="text-h4 font-weight-bold mb-4">No items in portal view</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Add items to this portal view to display them to players.
        </p>
      </div>
    </div>
    
    <!-- Show On Top Dialog (Simple File Viewer) -->
    <v-dialog
      :model-value="showOnTopVisible"
      @update:model-value="showOnTopVisible = false"
      max-width="80vw"
      width="80vw"
    >
      <v-card class="show-on-top-dialog">
        <v-card-title class="d-flex align-center pa-2">
          <span class="text-subtitle-1">{{ showOnTopItem?.object?.fileName || 'File Viewer' }}</span>
          <v-spacer />
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="showOnTopVisible = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0" style="height: calc(100vh - 64px);">
          <portal-view-item
            v-if="showOnTopItem"
            :item="showOnTopItem"
            :index="0"
            :fullscreen="true"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, onUnmounted, ref, inject, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { usePortalSocket } from '@/composables/usePortalSocket'
import PortalViewItem from '@/components/portal/PortalViewItem.vue'

const route = useRoute()
const portalViewsStore = usePortalViewsStore()

// Initialize as viewer (not controller) - create instance ONCE
const { on, off, requestSync } = usePortalSocket({ isViewer: true })

// Inject the toggle method from PortalLayout
const toggleEncounterSidebar = inject<() => void>('toggleEncounterSidebar', () => {
  console.warn('[Portal Viewer] toggleEncounterSidebar not provided by layout')
})

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const portalViewId = computed(() => {
  return route.params.portalViewId as string
})

const portalView = computed(() => portalViewsStore.currentPortalView)

// Viewer state (for ImageViewer component)
const currentViewerState = ref<any>(null)

// Show On Top state
const showOnTopVisible = ref(false)
const showOnTopItem = ref<any>(null)

// Restore state trigger (use counter to ensure watch fires)
const shouldRestoreState = ref(0)

// Ref to current PortalViewItem component
const currentItemRef = ref<InstanceType<typeof PortalViewItem> | null>(null)

// Current item index from portal view
const currentItemIndex = computed(() => {
  return portalView.value?.currentItem || 0
})

// Helper function to save current item state if it's an image
const saveCurrentItemState = () => {
  if (currentItemRef.value && portalView.value?.items) {
    const currentItem = portalView.value.items[currentItemIndex.value]
    if (currentItem?.type === 'ImageViewer') {
      currentItemRef.value.saveState()
    }
  }
}

// Set this portal as active when viewer loads
const activatePortal = async () => {
  if (libraryId.value && portalViewId.value) {
    try {
      await portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value)
      
      // Set as active portal for viewer connection
      if (portalView.value) {
        portalViewsStore.setActivePortal(portalView.value)
      }
    } catch (error) {
      console.error('Failed to load portal view:', error)
    }
  }
}

// Debounce toggle to prevent rapid toggles
let toggleDebounceTimer: number | null = null
const debouncedToggle = () => {
  if (toggleDebounceTimer) {
    clearTimeout(toggleDebounceTimer)
  }
  toggleDebounceTimer = window.setTimeout(() => {
    toggleEncounterSidebar()
    toggleDebounceTimer = null
  }, 100) // 100ms debounce
}

// Event handler function (defined once to allow proper cleanup)
const handlePortalViewUpdated = (payload: any) => {
  // Handle viewer state updates
  if (payload.command === 'update-viewer-state' && payload.viewerState) {
    currentViewerState.value = payload.viewerState
  }
  
  // Handle reset-view command (reset to default state)
  if (payload.command === 'reset-view') {
    if (currentViewerState.value) {
      currentViewerState.value = {
        ...currentViewerState.value,
        timestamp: Date.now(),
        scale: 1,
        position: { x: 0, y: 0 },
        rotation: 0,
      }
    }
  }
  
  // Handle restore-state command (restore last saved state from history)
  if (payload.command === 'restore-state') {
    // Increment counter to trigger the watch in ImageViewer
    shouldRestoreState.value++
  }
  
  // Handle item navigation (next, previous, change)
  if (payload.command === 'next-item' || payload.command === 'previous-item' || payload.command === 'change-item') {
    // Save current item state if it's an image before changing
    saveCurrentItemState()
    
    // Force refresh to get the updated currentItem
    if (libraryId.value && portalViewId.value) {
      portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value, true)
    }
  }
  
  // Handle encounter toggle (with debouncing)
  if (payload.command === 'toggle-encounter') {
    debouncedToggle()
  }
  
  // Handle encounter refetch
  if (payload.command === 'refetch-encounter') {
    if (portalView.value?.combatEncounterId && libraryId.value) {
      const combatEncountersStore = useCombatEncountersStore()
      combatEncountersStore.fetchEncounter(libraryId.value, portalView.value.combatEncounterId)
    }
  }
  
  // Handle Show On Top
  if (payload.command === 'show-on-top') {
    // Check if the same item is already being shown
    let isSameItem = false
    
    if (payload.item) {
      // Already a PortalViewItem - compare by id
      isSameItem = showOnTopVisible.value && 
                   showOnTopItem.value?.id === payload.item.id
    } else if (payload.userFile) {
      // UserFile - compare by object.id (the file ID)
      isSameItem = showOnTopVisible.value && 
                   showOnTopItem.value?.object?.id === payload.userFile.id
    }
    
    // If same item is already shown, hide it (toggle off)
    if (isSameItem) {
      showOnTopVisible.value = false
      showOnTopItem.value = null
    } else {
      // Show the new item
    if (payload.item) {
      // Already a PortalViewItem
      showOnTopItem.value = payload.item
      showOnTopVisible.value = true
    } else if (payload.userFile) {
      // Map UserFile to PortalViewItem
        let type: 'VideoViewer' | 'PDFViewer' | 'ImageViewer' = 'ImageViewer'
        if (payload.userFile.fileType.startsWith('video/')) {
          type = 'VideoViewer'
        } else if (payload.userFile.fileType.includes('pdf')) {
          type = 'PDFViewer'
        } else if (payload.userFile.fileType.startsWith('image/')) {
          type = 'ImageViewer'
        }
        
        showOnTopItem.value = {
          id: `file-${payload.userFile.id}-${Date.now()}`,
          type,
          object: payload.userFile
        }
      showOnTopVisible.value = true
      }
    }
  }
  
  // Handle Hide On Top
  if (payload.command === 'hide-on-top') {
    showOnTopVisible.value = false
    showOnTopItem.value = null
  }
  
  // Handle Update Screen Item (DM Screen update) - Direct socket update, fallback to refetch
  if (payload.command === 'update-screen-item' && payload.dmScreen) {
    console.log('[PortalViewView] Received dm screen update via socket')
    
    // Try direct update first (fastest - no API call)
    if (currentItemRef.value && typeof (currentItemRef.value as any).updateDmScreen === 'function') {
      console.log('[PortalViewView] Applying direct dm screen update')
      ;(currentItemRef.value as any).updateDmScreen(payload.dmScreen)
    } else {
      // Fallback: force refresh to bypass cache
      console.log('[PortalViewView] Direct update not available, force refreshing')
      if (libraryId.value && portalViewId.value) {
        portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value, true)
      }
    }
  }
  
  // Handle DM Screen controls
  if (payload.command === 'dm-screen-zoom-in') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleDmScreenZoomIn === 'function') {
      (currentItemRef.value as any).handleDmScreenZoomIn()
    }
  }
  
  if (payload.command === 'dm-screen-zoom-out') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleDmScreenZoomOut === 'function') {
      (currentItemRef.value as any).handleDmScreenZoomOut()
    }
  }
  
  if (payload.command === 'dm-screen-pan' && payload.deltaX !== undefined && payload.deltaY !== undefined) {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleDmScreenPan === 'function') {
      (currentItemRef.value as any).handleDmScreenPan(payload.deltaX, payload.deltaY)
    }
  }
  
  if (payload.command === 'dm-screen-reset-view') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleDmScreenResetView === 'function') {
      (currentItemRef.value as any).handleDmScreenResetView()
    }
  }
  
  // Handle VTT measurements (ruler tool)
  if (payload.command === 'draw-measurements') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleDrawMeasurements === 'function') {
      (currentItemRef.value as any).handleDrawMeasurements(payload.lines, payload.totalFeet)
    }
  }
  
  if (payload.command === 'clear-measurements') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleClearMeasurements === 'function') {
      (currentItemRef.value as any).handleClearMeasurements()
    }
  }
  
  // Handle VTT movement trails
  if (payload.command === 'draw-movement-trail') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleDrawMovementTrail === 'function') {
      (currentItemRef.value as any).handleDrawMovementTrail(payload.trail)
    }
  }
  
  if (payload.command === 'clear-movement-trail') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleClearMovementTrail === 'function') {
      (currentItemRef.value as any).handleClearMovementTrail(payload.nodeId)
    }
  }
  
  // Handle VTT pings
  if (payload.command === 'ping') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handlePing === 'function') {
      (currentItemRef.value as any).handlePing(payload.x, payload.y)
    }
  }
  
  if (payload.command === 'clear-ping') {
    if (currentItemRef.value && typeof (currentItemRef.value as any).handleClearPing === 'function') {
      (currentItemRef.value as any).handleClearPing()
    }
  }
}

const handleSyncResponse = (payload: any) => {
  // Update current viewer state from sync
  if (payload.viewerState) {
    currentViewerState.value = payload.viewerState
  }
  
  // Force refetch portal view to get latest state
  if (libraryId.value && portalViewId.value) {
    portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value, true)
  }
}

const handleConnected = () => {
  requestSync()
}

onMounted(() => {
  activatePortal()
  
  // Register event listeners
  on('portal-view-updated', handlePortalViewUpdated)
  on('sync-response', handleSyncResponse)
  on('connected', handleConnected)
})

watch([() => route.params.id, () => route.params.portalViewId], async ([newLibraryId, newPortalViewId]) => {
  if (newLibraryId && newPortalViewId) {
    try {
      await portalViewsStore.fetchPortalView(Number(newLibraryId), newPortalViewId as string)
      
      // Update active portal
      if (portalView.value) {
        portalViewsStore.setActivePortal(portalView.value)
      }
    } catch (error) {
      console.error('Failed to load portal view:', error)
    }
  }
})

// Handle item change - restore state if it's an ImageViewer
watch(currentItemIndex, (newIndex) => {
  // Reset ref - it will be set again by the ref callback when the new item renders
  currentItemRef.value = null
  
  // Check if the new item is an ImageViewer
  if (portalView.value?.items && newIndex !== null && newIndex !== undefined) {
    const newItem = portalView.value.items[newIndex]
    
    if (newItem?.type === 'ImageViewer') {
      // Trigger state restoration for ImageViewer
      // Use nextTick + small delay to ensure the component is mounted and state history is loaded
      nextTick(() => {
        // Small delay to ensure ImageViewer's onMounted has loaded state history
        setTimeout(() => {
          shouldRestoreState.value++
        }, 50)
      })
    } else {
      // For non-ImageViewer items, reset viewer state to null
      currentViewerState.value = null
    }
  }
})

// Clean up on unmount
onUnmounted(() => {
  // Remove event listeners to prevent duplicates
  off('portal-view-updated', handlePortalViewUpdated)
  off('sync-response', handleSyncResponse)
  off('connected', handleConnected)
  
  // Clear debounce timer
  if (toggleDebounceTimer) {
    clearTimeout(toggleDebounceTimer)
    toggleDebounceTimer = null
  }
  
  // Socket cleanup is handled by the composable
})
</script>

<style scoped>
.portal-view-view {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 400px;
  text-align: center;
  padding: 32px;
}

.portal-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.portal-items {
  width: 100%;
  height: 100%;
  position: relative;
}

.show-on-top-dialog {
  background: rgba(0, 0, 0, 0.95);
}

.show-on-top-dialog :deep(.v-card-text) {
  overflow: hidden;
}
</style>

