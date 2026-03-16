<template>
  <v-card class="portal-control-card elevation-0 h-100 d-flex flex-column" :class="{ 'glass-card': !inline }">
    <!-- Header -->
    <v-card-title v-if="!hideHeader" class="d-flex align-center pa-3">
      <v-icon icon="mdi-monitor" size="small" class="mr-2" />
      <span class="text-subtitle-2">Portal Controls</span>
      <v-spacer />
      <v-chip
        v-if="hasLoadedPortals"
        :color="isConnected ? 'success' : 'error'"
        size="x-small"
        variant="flat"
      >
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </v-chip>
    </v-card-title>

    <v-divider v-if="!hideHeader" />

    <!-- Active Portal Selection -->
    <v-card-text class="pa-3 flex-grow-1 overflow-y-auto">
      <div v-if="!hasLoadedPortals" class="text-center py-4">
        <v-icon icon="mdi-television" size="48" color="primary" class="mb-3" />
        <p class="text-body-2 text-medium-emphasis mb-4">
          Connect to a portal to manage and control player-facing displays
        </p>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-television"
          :loading="isLoadingPortals"
          @click="loadPortals"
        >
          Connect Portal
        </v-btn>
      </div>
      <template v-else>
        <v-select
          :model-value="activePortal?.portalViewId"
          :items="portalViewOptions"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          placeholder="Select a portal..."
          prepend-inner-icon="mdi-monitor"
          :loading="isLoadingPortals"
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
            <v-btn
              v-else
              icon="mdi-refresh"
              size="x-small"
              variant="text"
              :loading="isLoadingPortals"
              @click.stop="loadPortals"
            >
              <v-icon />
              <v-tooltip activator="parent" location="top">Refresh</v-tooltip>
            </v-btn>
          </template>
        </v-select>
      </template>

      <template v-if="activePortal && hasLoadedPortals">
        <v-divider class="my-3" />

        <!-- Drag & Drop Upload (Compact) -->
        <div class="mb-3">
          <drag-drop-upload
            compact
            @uploaded="handleFileUploaded"
            @upload-complete="handleUploadComplete"
            @upload-error="handleUploadError"
          />
        </div>

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
                <!-- UserFile/DmScreen Preview -->
                <div v-if="shouldShowImagePreview(item.type)" class="item-preview-image">
                  <img
                    v-if="item.type !== 'DmScreenViewer' && itemPreviewUrls[index]"
                    :src="itemPreviewUrls[index]"
                    :alt="getItemTitle(item, index)"
                    @error="handlePreviewError(index)"
                  />
                  <v-icon
                    v-else-if="item.type === 'DmScreenViewer' || (item.type !== 'DmScreenViewer' && itemPreviewLoading[index])"
                    :icon="item.type === 'DmScreenViewer' ? 'mdi-monitor-dashboard' : 'mdi-loading'"
                    size="small"
                    :class="item.type === 'DmScreenViewer' ? 'item-preview-placeholder' : 'item-preview-loading'"
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
                <!-- Non-UserFile Type -->
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
            <v-btn
              icon="mdi-link-variant"
              size="small"
              variant="tonal"
              @click="copyPortalUrl"
              :disabled="!activePortal"
            >
              <v-icon />
              <v-tooltip activator="parent">Copy Portal URL</v-tooltip>
            </v-btn>
          </div>
        </div>

        <!-- DM Screen Controls -->
        <template v-if="isDmScreenViewerActive">
          <v-divider class="my-3" />
          <div class="mb-3">
            <div class="d-flex align-center gap-2 mb-2">
              <v-icon icon="mdi-monitor-dashboard" size="small" class="mr-1" />
              <span class="text-caption font-weight-medium">DM Screen Controls</span>
            </div>
            <div class="control-items-row mb-3">
              <v-btn icon="mdi-magnify-minus" size="x-small" variant="tonal" @click="dmScreenZoomOut" :disabled="!isConnected" />
              <v-btn icon="mdi-magnify-plus" size="x-small" variant="tonal" @click="dmScreenZoomIn" :disabled="!isConnected" />
              <v-btn icon="mdi-fit-to-screen" size="x-small" variant="tonal" @click="dmScreenResetView" :disabled="!isConnected" />
            </div>
            <div class="pan-controls">
              <div class="pan-row"><v-btn icon="mdi-arrow-up" size="x-small" variant="tonal" @click="dmScreenPanUp" :disabled="!isConnected" /></div>
              <div class="pan-row">
                <v-btn icon="mdi-arrow-left" size="x-small" variant="tonal" @click="dmScreenPanLeft" :disabled="!isConnected" />
                <v-btn icon="mdi-crosshairs" size="x-small" variant="tonal" @click="dmScreenResetPosition" :disabled="!isConnected" />
                <v-btn icon="mdi-arrow-right" size="x-small" variant="tonal" @click="dmScreenPanRight" :disabled="!isConnected" />
              </div>
              <div class="pan-row"><v-btn icon="mdi-arrow-down" size="x-small" variant="tonal" @click="dmScreenPanDown" :disabled="!isConnected" /></div>
            </div>
          </div>
        </template>

        <!-- Image Viewer Controls -->
        <template v-if="isImageViewerActive">
          <v-divider class="my-3" />
          <div class="control-items-row mb-3">
            <v-btn icon="mdi-magnify-minus" size="x-small" variant="tonal" @click="zoomOut" :disabled="!isConnected || combatLock" />
            <v-btn icon="mdi-magnify-plus" size="x-small" variant="tonal" @click="zoomIn" :disabled="!isConnected || combatLock" />
            <v-btn icon="mdi-rotate-right" size="x-small" variant="tonal" @click="rotate" :disabled="!isConnected || combatLock" />
            <v-btn icon="mdi-fit-to-screen" size="x-small" variant="tonal" @click="resetView" :disabled="!isConnected || combatLock" />
            <v-btn icon="mdi-restore" size="x-small" variant="tonal" @click="restoreState" :disabled="!isConnected || combatLock" />
            <v-btn :icon="combatLock ? 'mdi-lock' : 'mdi-lock-open'" :color="combatLock ? 'error' : 'success'" size="x-small" variant="tonal" @click="toggleCombatLock" :disabled="!isConnected" />
            <v-btn :icon="showGrid ? 'mdi-grid' : 'mdi-grid-off'" :color="showGrid ? 'primary' : undefined" size="x-small" variant="tonal" @click="toggleGrid" :disabled="!isConnected" />
          </div>
          <div class="pan-controls mb-2">
            <div class="pan-row"><v-btn icon="mdi-arrow-up" size="x-small" variant="tonal" @click="panUp" :disabled="!isConnected || combatLock" /></div>
            <div class="pan-row">
              <v-btn icon="mdi-arrow-left" size="x-small" variant="tonal" @click="panLeft" :disabled="!isConnected || combatLock" />
              <v-btn icon="mdi-crosshairs" size="x-small" variant="tonal" @click="resetPosition" :disabled="!isConnected || combatLock" />
              <v-btn icon="mdi-arrow-right" size="x-small" variant="tonal" @click="panRight" :disabled="!isConnected || combatLock" />
            </div>
            <div class="pan-row"><v-btn icon="mdi-arrow-down" size="x-small" variant="tonal" @click="panDown" :disabled="!isConnected || combatLock" /></div>
          </div>
          <v-expand-transition>
            <div v-if="showGrid" class="grid-settings pa-2 mb-2">
              <v-slider v-model="gridSize" :min="5" :max="100" :step="5" label="Size" density="compact" hide-details @update:model-value="updateViewerState" />
              <v-slider v-model="gridOpacity" :min="0.1" :max="1" :step="0.1" label="Opacity" density="compact" hide-details @update:model-value="updateViewerState" />
              <div class="d-flex gap-1 justify-center mt-2">
                <v-btn v-for="c in ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff']" :key="c" size="x-small" :color="gridColor === c ? 'primary' : undefined" @click="setGridColor(c)" variant="tonal">{{ c === '#ffffff' ? 'W' : c === '#000000' ? 'B' : c.substring(1, 2).toUpperCase() }}</v-btn>
              </div>
            </div>
          </v-expand-transition>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePortalViewsStore } from '@/stores/portalViews'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'vue-toastification'
import type { ViewerState, PortalViewItem } from '@/types/portal.types'
import type { UserFile } from '@/api/files'
import DragDropUpload from '@/components/files/DragDropUpload.vue'

const props = defineProps<{
  inline?: boolean
  hideHeader?: boolean
}>()

const router = useRouter()
const route = useRoute()
const portalViewsStore = usePortalViewsStore()
const { isConnected, sendPortalViewUpdate } = usePortalSocket()
const toast = useToast()

const activePortal = computed(() => portalViewsStore.activePortal)
const currentPortal = computed(() => portalViewsStore.currentPortalView)
const filesStore = useFilesStore()
const isLoadingPortals = ref(false)
const hasLoadedPortals = ref(false)

const portalViewOptions = computed(() => portalViewsStore.portalViews.map(pv => ({ id: pv.id, name: pv.name, libraryId: pv.libraryId })))

// Item preview state
const itemPreviewUrls = ref<Record<number, string>>({})
const itemPreviewLoading = ref<Record<number, boolean>>({})
const itemPreviewErrors = ref<Record<number, boolean>>({})

const isUserFileType = (type: string) => ['ImageViewer', 'VideoViewer', 'PDFViewer'].includes(type)
const shouldShowImagePreview = (type: string) => isUserFileType(type) || type === 'DmScreenViewer'
const getItemTypeIcon = (type: string) => {
  switch (type) {
    case 'ImageViewer': return 'mdi-image'
    case 'VideoViewer': return 'mdi-video'
    case 'PDFViewer': return 'mdi-file-pdf-box'
    case 'libraryItemViewer': return 'mdi-file-document'
    case 'DmScreenViewer': return 'mdi-monitor-dashboard'
    default: return 'mdi-file'
  }
}
const getItemTitle = (item: any, index: number) => item.object?.fileName || `Item ${index + 1}`

const fetchItemPreview = async (item: any, index: number, forceRefresh = false) => {
  if (!isUserFileType(item.type) || item.type === 'DmScreenViewer') return
  const fileId = item.object?.id
  if (!fileId) return
  if (!forceRefresh && (itemPreviewUrls.value[index] || itemPreviewLoading.value[index])) return
  itemPreviewLoading.value[index] = true
  try {
    const url = await filesStore.getDownloadUrl(fileId)
    if (url) itemPreviewUrls.value[index] = url
  } catch (error) { console.error('Preview error', error) }
  finally { itemPreviewLoading.value[index] = false }
}

const loadItemPreviews = async (forceRefresh = false) => {
  if (!currentPortal.value?.items) return
  currentPortal.value.items.forEach((item, index) => fetchItemPreview(item, index, forceRefresh))
}

const handlePreviewError = (index: number) => {
  const item = currentPortal.value?.items?.[index]
  if (item) fetchItemPreview(item, index, true)
}

const loadPortals = async () => {
  let libraryId = route.params.id ? Number(route.params.id) : activePortal.value?.libraryId
  if (!libraryId) return
  isLoadingPortals.value = true
  try {
    await portalViewsStore.fetchPortalViews(libraryId)
    hasLoadedPortals.value = true
    if (activePortal.value) {
      await portalViewsStore.fetchPortalView(activePortal.value.libraryId, activePortal.value.portalViewId)
      loadItemPreviews()
    }
  } catch (error) { toast.error('Failed to load portals') }
  finally { isLoadingPortals.value = false }
}

const handlePortalChange = async (id: string) => {
  const portalView = portalViewsStore.portalViews.find(pv => pv.id === id)
  if (!portalView) return
  await portalViewsStore.fetchPortalView(portalView.libraryId, id)
  const fetched = portalViewsStore.currentPortalView
  if (fetched) {
    portalViewsStore.setActivePortal(fetched)
    loadItemPreviews(true)
  }
}

const clearActivePortal = () => portalViewsStore.clearActivePortal()

const openPortalSettings = () => {
  if (activePortal.value) router.push({ name: 'PortalView', params: { id: activePortal.value.libraryId, portalViewId: activePortal.value.portalViewId } })
}

const setActiveItem = async (index: number) => {
  if (!activePortal.value) return
  await portalViewsStore.updatePortalView(activePortal.value.libraryId, activePortal.value.portalViewId, { currentItem: index })
  sendPortalViewUpdate({ command: 'change-item', itemIndex: index })
}

const clearAllItems = async () => {
  if (!activePortal.value || !confirm('Clear all items?')) return
  await portalViewsStore.updatePortalView(activePortal.value.libraryId, activePortal.value.portalViewId, { items: [], currentItem: null })
  itemPreviewUrls.value = {}; itemPreviewLoading.value = {}; itemPreviewErrors.value = {}
}

const nextItem = () => {
  if (!currentPortal.value?.items?.length) return
  setActiveItem(((currentPortal.value.currentItem || 0) + 1) % currentPortal.value.items.length)
}

const previousItem = () => {
  if (!currentPortal.value?.items?.length) return
  const current = currentPortal.value.currentItem || 0
  setActiveItem(current === 0 ? currentPortal.value.items.length - 1 : current - 1)
}

// Viewer state
const scale = ref(1); const position = ref({ x: 0, y: 0 }); const rotation = ref(0); const showGrid = ref(false)
const gridSize = ref(50); const gridColor = ref('#000000'); const gridOpacity = ref(0.2); const combatLock = ref(false)

const updateViewerState = () => {
  if (!isConnected.value) return
  sendPortalViewUpdate({
    command: 'update-viewer-state',
    viewerState: {
      timestamp: Date.now(), scale: scale.value, position: { ...position.value }, rotation: rotation.value,
      showGrid: showGrid.value, gridSize: gridSize.value, gridColor: gridColor.value, gridOpacity: gridOpacity.value, combatLock: combatLock.value
    }
  })
}

const zoomIn = () => { if (combatLock.value) return; scale.value = Math.min(scale.value + 0.25, 5); updateViewerState() }
const zoomOut = () => { if (combatLock.value) return; scale.value = Math.max(scale.value - 0.25, 0.5); updateViewerState() }
const rotate = () => { if (combatLock.value) return; rotation.value = (rotation.value + 90) % 360; updateViewerState() }
const panUp = () => { if (combatLock.value) return; position.value.y += 50; updateViewerState() }
const panDown = () => { if (combatLock.value) return; position.value.y -= 50; updateViewerState() }
const panLeft = () => { if (combatLock.value) return; position.value.x += 50; updateViewerState() }
const panRight = () => { if (combatLock.value) return; position.value.x -= 50; updateViewerState() }
const resetPosition = () => { if (combatLock.value) return; position.value = { x: 0, y: 0 }; updateViewerState() }
const resetView = () => sendPortalViewUpdate({ command: 'reset-view' })
const restoreState = () => sendPortalViewUpdate({ command: 'restore-state' })
const toggleGrid = () => { showGrid.value = !showGrid.value; updateViewerState() }
const setGridColor = (c: string) => { gridColor.value = c; updateViewerState() }
const toggleCombatLock = () => { combatLock.value = !combatLock.value; updateViewerState() }
const toggleEncounter = () => sendPortalViewUpdate({ command: 'toggle-encounter' })

const showOnTopForItem = (index: number) => {
  const item = currentPortal.value?.items?.[index]
  if (!item) return
  const userFile = item.object && typeof item.object === 'object' && 'id' in item.object ? item.object : null
  sendPortalViewUpdate({ command: 'show-on-top', userFile: userFile || undefined, item: userFile ? undefined : item })
}
const hideOnTop = () => sendPortalViewUpdate({ command: 'hide-on-top' })

const copyPortalUrl = async () => {
  if (!activePortal.value) return
  const href = router.resolve({ name: 'PortalViewDisplay', params: { id: activePortal.value.libraryId, portalViewId: activePortal.value.portalViewId } }).href
  await navigator.clipboard.writeText(`${window.location.origin}${href}`)
  toast.success('URL copied')
}

// DM Screen
const dmScreenZoomIn = () => sendPortalViewUpdate({ command: 'dm-screen-zoom-in' })
const dmScreenZoomOut = () => sendPortalViewUpdate({ command: 'dm-screen-zoom-out' })
const dmScreenPan = (x: number, y: number) => sendPortalViewUpdate({ command: 'dm-screen-pan', deltaX: x, deltaY: y })
const dmScreenPanUp = () => dmScreenPan(0, 100)
const dmScreenPanDown = () => dmScreenPan(0, -100)
const dmScreenPanLeft = () => dmScreenPan(100, 0)
const dmScreenPanRight = () => dmScreenPan(-100, 0)
const dmScreenResetView = () => sendPortalViewUpdate({ command: 'dm-screen-reset-view' })
const dmScreenResetPosition = () => dmScreenResetView()

const handleFileUploaded = async (file: UserFile) => {
  if (!activePortal.value) return
  await portalViewsStore.addItemToActivePortal(file, true)
  loadItemPreviews(true)
}
const handleUploadComplete = () => loadItemPreviews(true)
const handleUploadError = (e: Error) => console.error(e)

const isImageViewerActive = computed(() => currentPortal.value?.items?.[currentPortal.value.currentItem || 0]?.type === 'ImageViewer')
const isDmScreenViewerActive = computed(() => currentPortal.value?.items?.[currentPortal.value.currentItem || 0]?.type === 'DmScreenViewer')

watch(activePortal, (n, o) => {
  if (n?.portalViewId !== o?.portalViewId) {
    scale.value = 1; position.value = { x: 0, y: 0 }; rotation.value = 0; showGrid.value = false; combatLock.value = false
    itemPreviewUrls.value = {}; itemPreviewLoading.value = {}; itemPreviewErrors.value = {}
    if (n) loadItemPreviews(true)
  }
})

watch(() => currentPortal.value?.items, (n, o) => {
  if (n?.length !== o?.length) {
    itemPreviewUrls.value = {}; itemPreviewLoading.value = {}; itemPreviewErrors.value = {}
    if (n?.length) loadItemPreviews(true)
  }
}, { deep: true })

onMounted(() => { if (activePortal.value) loadPortals() })
</script>

<style scoped>
.portal-control-card { max-height: 100%; overflow-y: auto; }
.items-preview-scroll { overflow-x: auto; scrollbar-width: thin; }
.items-preview-container { display: flex; gap: 8px; padding: 4px 0; }
.item-preview-card { flex-shrink: 0; width: 60px; height: 60px; border-radius: 6px; cursor: pointer; border: 2px solid transparent; background: rgba(var(--v-theme-surface-variant), 0.3); position: relative; }
.item-preview-card--active { border-color: rgb(var(--v-theme-primary)); box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.3); }
.item-preview-image { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 4px; }
.item-preview-image img { width: 100%; height: 100%; object-fit: cover; }
.item-preview-overlay { position: absolute; top: 0; left: 0; padding: 2px; background: rgba(0,0,0,0.4); font-size: 10px; }
.item-preview-hover-action { position: absolute; top: 2px; right: 2px; opacity: 0; transition: opacity 0.2s; }
.item-preview-card:hover .item-preview-hover-action { opacity: 1; }
.control-items-row { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; }
.pan-controls { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 8px; }
.pan-row { display: flex; gap: 4px; }
.grid-settings { background: rgba(var(--v-theme-surface-variant), 0.2); border-radius: 4px; margin-top: 8px; }
</style>
