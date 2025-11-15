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
      max-width="90vw"
      width="auto"
      fullscreen
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
            :viewer-state="currentViewerState"
            :fullscreen="true"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, onUnmounted, ref, inject } from 'vue'
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

// Current item index from portal view
const currentItemIndex = computed(() => {
  return portalView.value?.currentItem || 0
})

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
    if (libraryId.value && portalViewId.value) {
      portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value)
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
    // Can receive either item (PortalViewItem) or userFile (UserFile)
    if (payload.item) {
      // Already a PortalViewItem
      showOnTopItem.value = payload.item
      showOnTopVisible.value = true
    } else if (payload.userFile) {
      // Map UserFile to PortalViewItem
      showOnTopItem.value = portalViewsStore.mapUserFileToPortalViewItem(payload.userFile)
      showOnTopVisible.value = true
    }
  }
  
  // Handle Hide On Top
  if (payload.command === 'hide-on-top') {
    showOnTopVisible.value = false
    showOnTopItem.value = null
  }
}

const handleSyncResponse = (payload: any) => {
  // Update current viewer state from sync
  if (payload.viewerState) {
    currentViewerState.value = payload.viewerState
  }
  
  // Refetch portal view to get updated currentItem
  if (libraryId.value && portalViewId.value) {
    portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value)
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

// Reset viewer state when active item changes
watch(currentItemIndex, () => {
  // Reset to default state when item changes
  currentViewerState.value = {
    timestamp: Date.now(),
    scale: 1,
    position: { x: 0, y: 0 },
    rotation: 0,
    showGrid: false,
    gridSize: 50,
    gridColor: '#000000',
    gridOpacity: 0.2,
    combatLock: false,
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

