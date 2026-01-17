<template>
  <div 
    class="portal-view-item" 
    :class="[`item-type-${item.type}`, { 'fullscreen-mode': fullscreen }]"
  >
    <!-- Loading State -->
    <div v-if="isLoadingUrl" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-body-1 mt-4">Loading file...</p>
    </div>

    <!-- Image Viewer -->
    <ImageViewer
      v-else-if="item.type === 'ImageViewer' && downloadUrl"
      ref="imageViewerRef"
      :url="downloadUrl"
      :file-name="item.object?.fileName || 'Portal Image'"
      :auto-hide-controls="fullscreen"
      :show-grid-overlay="viewerState?.showGrid || false"
      :grid-overlay-size="viewerState?.gridSize || 50"
      :grid-overlay-color="viewerState?.gridColor || '#000000'"
      :grid-overlay-opacity="viewerState?.gridOpacity || 0.2"
      :initial-state="viewerState"
      :external-state="viewerState"
      :should-restore-state="shouldRestoreState ?? 0"
    />
    
    <!-- Video Viewer -->
    <VideoViewer
      v-else-if="item.type === 'VideoViewer' && downloadUrl"
      :url="downloadUrl"
      :file-name="item.object?.fileName || 'Portal Video'"
    />
    
    <!-- PDF Viewer -->
    <PdfViewer
      v-else-if="item.type === 'PDFViewer' && downloadUrl"
      :url="downloadUrl"
      :file-name="item.object?.fileName || 'Portal PDF'"
    />
    
    <!-- DM Screen Viewer -->
    <DmScreenWrapper
      v-else-if="item.type === 'DmScreenViewer' && dmScreen"
      ref="dmScreenWrapperRef"
      :dm-screen="dmScreen"
      :is-portal-mode="true"
      class="portal-dm-screen-wrapper"
    />
    
    <!-- Placeholder for other types -->
    <div v-else class="item-placeholder">
      <v-icon icon="mdi-file" size="48" color="grey" />
      <p class="text-body-2 mt-2">Item type: {{ item.type }}</p>
      <p class="text-caption text-grey">{{ downloadUrl ? 'Viewer not yet implemented' : 'No file URL available' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import ImageViewer from '@/components/files/viewers/ImageViewer.vue'
import VideoViewer from '@/components/files/viewers/VideoViewer.vue'
import PdfViewer from '@/components/files/viewers/PdfViewer.vue'
import DmScreenWrapper from '@/components/dmScreen/DmScreenWrapper.vue'
import { useFilesStore } from '@/stores/files'
import { useDmScreensStore } from '@/stores/dmScreens'
import type { PortalViewItem, ViewerState } from '@/types/portal.types'
import type { DmScreen } from '@/types/dmScreen.types'

interface Props {
  item: PortalViewItem
  index: number
  viewerState?: ViewerState | null
  fullscreen?: boolean
  shouldRestoreState?: boolean | number
}

const props = withDefaults(defineProps<Props>(), {
  fullscreen: false
})

const filesStore = useFilesStore()
const dmScreensStore = useDmScreensStore()
const downloadUrl = ref<string | null>(null)
const isLoadingUrl = ref(false)
const imageViewerRef = ref<InstanceType<typeof ImageViewer> | null>(null)
const dmScreen = ref<DmScreen | null>(null)
const dmScreenWrapperRef = ref<InstanceType<typeof DmScreenWrapper> | null>(null)

// Fetch download URL if item has a UserFile object
const fetchDownloadUrl = async () => {
  console.log('[PortalViewItem] Fetching download URL for item:', props.item)
  
  // Check if item has object property
  if (!props.item?.object) {
    console.warn('[PortalViewItem] Item has no object property:', props.item)
    downloadUrl.value = null
    return
  }

  // Check if object is valid and has an id
  const itemObject = props.item.object as any
  const fileId = itemObject?.id
  
  console.log('[PortalViewItem] File ID:', fileId, 'Type:', typeof fileId)
  
  if (!fileId || typeof fileId !== 'number') {
    console.warn('[PortalViewItem] Invalid file ID:', fileId)
    downloadUrl.value = null
    return
  }

  isLoadingUrl.value = true
  try {
    const url = await filesStore.getDownloadUrl(fileId)
    console.log('[PortalViewItem] Got download URL:', url ? 'Success' : 'Failed')
    downloadUrl.value = url
  } catch (error) {
    console.error('[PortalViewItem] Failed to get download URL:', error)
    downloadUrl.value = null
  } finally {
    isLoadingUrl.value = false
  }
}

// Fetch DM screen if item is DmScreenViewer
const fetchDmScreen = async () => {
  if (props.item.type !== 'DmScreenViewer') {
    dmScreen.value = null
    return
  }
  
  const dmScreenId = props.item.dmScreenId
  const libraryId = props.item.libraryId
  
  if (!dmScreenId || !libraryId) {
    console.warn('[PortalViewItem] DmScreenViewer item missing dmScreenId or libraryId')
    dmScreen.value = null
    return
  }
  
  try {
    const screen = await dmScreensStore.fetchDmScreen(libraryId, dmScreenId)
    dmScreen.value = screen
  } catch (error) {
    console.error('[PortalViewItem] Failed to fetch DM screen:', error)
    dmScreen.value = null
  }
}

// Watch for item changes
watch(() => props.item, () => {
  if (props.item.type === 'DmScreenViewer') {
    fetchDmScreen()
  } else {
    fetchDownloadUrl()
  }
}, { immediate: true })

onMounted(() => {
  if (props.item.type === 'DmScreenViewer') {
    fetchDmScreen()
  } else {
    fetchDownloadUrl()
  }
})

// Expose method to save state if this is an ImageViewer
const saveState = () => {
  if (props.item.type === 'ImageViewer' && imageViewerRef.value) {
    imageViewerRef.value.saveStateToHistory()
  }
}

// Expose DM screen control methods
const handleDmScreenZoomIn = () => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleDmScreenZoomIn()
  }
}

const handleDmScreenZoomOut = () => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleDmScreenZoomOut()
  }
}

const handleDmScreenPan = (deltaX: number, deltaY: number) => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleDmScreenPan(deltaX, deltaY)
  }
}

const handleDmScreenResetView = () => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleDmScreenResetView()
  }
}

// Direct DM screen update from socket (no refetch needed)
const updateDmScreen = (newDmScreen: DmScreen) => {
  if (props.item.type === 'DmScreenViewer' && newDmScreen) {
    console.log('[PortalViewItem] Direct DM screen update from socket')
    // Update local ref
    dmScreen.value = newDmScreen
    
    // Also update the store cache so DmScreenWrapper's computed properties work correctly
    // DmScreenWrapper uses dmScreensStore.getItemsSortedByLayer which fetches from store, not prop
    dmScreensStore.updateDmScreenCache(newDmScreen)
  }
}

// VTT measurement handlers
const handleDrawMeasurements = (lines: any[], totalFeet: number) => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleDrawMeasurements?.(lines, totalFeet)
  }
}

const handleClearMeasurements = () => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleClearMeasurements?.()
  }
}

// VTT movement trail handlers
const handleDrawMovementTrail = (trail: any) => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleDrawMovementTrail?.(trail)
  }
}

const handleClearMovementTrail = (nodeId?: string) => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleClearMovementTrail?.(nodeId)
  }
}

// VTT ping handlers
const handlePing = (x: number, y: number) => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handlePing?.(x, y)
  }
}

const handleClearPing = () => {
  if (props.item.type === 'DmScreenViewer' && dmScreenWrapperRef.value) {
    (dmScreenWrapperRef.value as any).handleClearPing?.()
  }
}

defineExpose({
  saveState,
  handleDmScreenZoomIn,
  handleDmScreenZoomOut,
  handleDmScreenPan,
  handleDmScreenResetView,
  updateDmScreen,
  handleDrawMeasurements,
  handleClearMeasurements,
  handleDrawMovementTrail,
  handleClearMovementTrail,
  handlePing,
  handleClearPing,
})
</script>

<style scoped>
.portal-view-item {
  width: 100%;
  height: 100%;
  position: relative; /* Changed from absolute */
}

.portal-view-item.fullscreen-mode {
  position: absolute; /* Use absolute within dialog container */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
}

.item-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 32px;
  text-align: center;
  background: rgba(0, 0, 0, 0.5);
}

.portal-dm-screen-wrapper {
  width: 100%;
  height: 100%;
}
</style>

