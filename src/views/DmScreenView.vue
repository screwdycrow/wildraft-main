<template>
  <div class="dm-screen-view">
    <!-- Loading State -->
    <div v-if="dmScreensStore.isLoading && !dmScreen" class="loading-state">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading DM screen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="dmScreensStore.error && !dmScreen" class="error-state">
      <v-icon icon="mdi-alert-circle" size="120" color="error" class="mb-6" />
      <h2 class="text-h4 font-weight-bold mb-4">Failed to load DM screen</h2>
      <p class="text-body-1 text-grey-lighten-1 mb-6">{{ dmScreensStore.error }}</p>
      <v-btn color="primary" @click="loadDmScreen">Retry</v-btn>
    </div>

    <!-- DM Screen Content -->
    <div v-else-if="dmScreen" class="dm-screen-container">
      <dm-screen-wrapper
        ref="wrapperRef"
        :dm-screen="dmScreen"
      />
    </div>

    <!-- Floating Toolbar -->
    <dm-screen-floating-toolbar
      v-if="dmScreen"
      :lock-background-images="lockBackgroundImages"
      :show-grid="showGrid"
      :selected-item="selectedItem"
      :layers="layers"
      @add-item="handleAddItem"
      @add-background="handleAddBackground"
      @add-file="handleAddFile"
      @add-text-node="handleAddTextNode"
      @add-shape-node="handleAddShapeNode"
      @open-settings="handleOpenSettings"
      @toggle-lock-background="handleToggleLockBackground"
      @toggle-grid="handleToggleGrid"
      @duplicate-item="handleDuplicateItem"
      @send-to-back="handleSendToBack"
      @send-to-front="handleSendToFront"
      @rotate-left="handleRotateLeft"
      @rotate-right="handleRotateRight"
      @edit-shape-style="handleEditShapeStyle"
      @delete-selected="handleDeleteSelected"
      @move-to-layer="handleMoveToLayer"
    />

    <!-- File Manager Dialog -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleFilesSelected"
    />

    <!-- Kitbashing Drawers -->
    <kitbashing-drawers
      v-if="dmScreen"
      @add-file="handleAddFileFromDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useToast } from 'vue-toastification'
import DmScreenWrapper from '@/components/dmScreen/DmScreenWrapper.vue'
import DmScreenFloatingToolbar from '@/components/dmScreen/DmScreenFloatingToolbar.vue'
import KitbashingDrawers from '@/components/dmScreen/KitbashingDrawers.vue'
import FileManager from '@/components/files/FileManager.vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

// =====================================================
// ROUTE & STORES
// =====================================================

const route = useRoute()
const dmScreensStore = useDmScreensStore()
const toast = useToast()

// =====================================================
// REFS
// =====================================================

const wrapperRef = ref<InstanceType<typeof DmScreenWrapper> | null>(null)
const showFileManager = ref(false)

// =====================================================
// COMPUTED - Derived from route params
// =====================================================

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(route.params.id) : null
})

const dmScreenId = computed(() => {
  return route.params.dmScreenId as string
})

// =====================================================
// COMPUTED - Derived from store (NO WATCHERS)
// =====================================================

const dmScreen = computed(() => {
  return dmScreensStore.currentDmScreen
})

const selectedItem = computed(() => {
  return dmScreensStore.selectedItem
})

const lockBackgroundImages = computed(() => {
  return dmScreen.value?.settings?.lockBackgroundImages || false
})

const showGrid = computed(() => {
  return dmScreen.value?.settings?.grid?.showGrid !== false
})

const layers = computed(() => {
  if (!dmScreen.value) return []
  return dmScreensStore.getLayers(dmScreen.value.id)
})

// =====================================================
// LIFECYCLE
// =====================================================

onMounted(async () => {
  await loadDmScreen()
})

async function loadDmScreen() {
  if (!libraryId.value || !dmScreenId.value) return

  try {
    await dmScreensStore.fetchDmScreen(libraryId.value, dmScreenId.value)
  } catch (error) {
    toast.error('Failed to load DM screen')
  }
}

// =====================================================
// TOOLBAR EVENT HANDLERS
// All handlers call store actions directly
// =====================================================

function handleAddItem() {
  wrapperRef.value?.openItemSelector()
}

function handleAddBackground() {
  wrapperRef.value?.openFileManager()
}

function handleAddFile() {
  showFileManager.value = true
}

function handleOpenSettings() {
  wrapperRef.value?.openSettings()
}

function handleToggleLockBackground() {
  wrapperRef.value?.toggleLockBackground()
}

function handleToggleGrid() {
  wrapperRef.value?.toggleGrid()
}

function handleAddTextNode() {
  wrapperRef.value?.addTextNode()
}

function handleAddShapeNode() {
  wrapperRef.value?.addShapeNode()
}

function handleDuplicateItem() {
  if (!dmScreen.value || !selectedItem.value) return
  dmScreensStore.duplicateItem(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id
  )
  toast.success('Item duplicated')
}

function handleSendToBack() {
  if (!dmScreen.value || !selectedItem.value) return
  // Use layer-aware version - sends to back within the item's layer
  dmScreensStore.sendToBackInLayer(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id
  )
  toast.success('Sent to back of layer')
}

function handleSendToFront() {
  if (!dmScreen.value || !selectedItem.value) return
  // Use layer-aware version - sends to front within the item's layer
  dmScreensStore.sendToFrontInLayer(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id
  )
  toast.success('Sent to front of layer')
}

function handleRotateLeft() {
  if (!dmScreen.value || !selectedItem.value) return
  const currentRotation = selectedItem.value.nodeOptions?.rotation || 0
  const newRotation = ((currentRotation - 90) % 360 + 360) % 360
  dmScreensStore.updateItemRotation(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id,
    newRotation
  )
}

function handleRotateRight() {
  if (!dmScreen.value || !selectedItem.value) return
  const currentRotation = selectedItem.value.nodeOptions?.rotation || 0
  const newRotation = (currentRotation + 90) % 360
  dmScreensStore.updateItemRotation(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id,
    newRotation
  )
}

function handleEditShapeStyle() {
  if (!selectedItem.value) return
  wrapperRef.value?.openShapeStyleEditor(selectedItem.value)
}

function handleDeleteSelected() {
  if (!dmScreen.value || !selectedItem.value) return
  dmScreensStore.deleteItem(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id
  )
  toast.success('Item deleted')
}

function handleMoveToLayer(layerId: string) {
  if (!dmScreen.value || !selectedItem.value) return
  dmScreensStore.moveItemToLayer(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    selectedItem.value.id,
    layerId
  )
  const layer = layers.value.find(l => l.id === layerId)
  toast.success(`Moved to ${layer?.name || layerId} layer`)
}

// =====================================================
// FILE HANDLERS
// =====================================================

function handleAddFileFromDrawer(file: any) {
  if (!dmScreen.value) return
  
  // Use default position
  const position = { x: 400, y: 300 }
  
  dmScreensStore.addUserFile(
    dmScreen.value.id,
    dmScreen.value.libraryId,
    file.id,
    position
  )
  
  toast.success('File added to DM screen')
}

async function handleFilesSelected(fileIds: number | number[] | string | string[]) {
  if (!dmScreen.value) return
  
  const idsArray: number[] = (Array.isArray(fileIds) ? fileIds : [fileIds])
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id))
  
  if (idsArray.length === 0) return
  
  // Add each file
  for (let i = 0; i < idsArray.length; i++) {
    const fileId = idsArray[i]
    const offsetX = (i % 3) * 50 - 50
    const offsetY = Math.floor(i / 3) * 50
    
    dmScreensStore.addUserFile(
      dmScreen.value.id,
      dmScreen.value.libraryId,
      fileId,
      { x: 400 + offsetX, y: 300 + offsetY }
    )
  }
  
  toast.success(`Added ${idsArray.length} file${idsArray.length > 1 ? 's' : ''} to DM screen`)
  showFileManager.value = false
}
</script>

<style scoped>
.dm-screen-view {
  width: 100%;
  height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  text-align: center;
  padding: 48px;
}

.dm-screen-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
</style>
