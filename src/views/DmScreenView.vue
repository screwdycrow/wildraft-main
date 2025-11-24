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
      <!-- Header -->

      <!-- DM Screen Wrapper -->
      <dm-screen-wrapper
        v-if="dmScreen"
        :dm-screen="dmScreen"
      />
    </div>

    <!-- Floating Toolbar -->
    <dm-screen-floating-toolbar
      v-if="dmScreen && dmScreenComposable"
      :lock-background-images="dmScreenComposable.lockBackgroundImages.value"
      :show-grid="dmScreenComposable.showGrid.value"
      :selected-item="dmScreenComposable.selectedItem.value || null"
      @add-item="handleAddItem"
      @add-background="handleAddBackground"
      @add-file="handleAddFileFromToolbar"
      @add-text-node="handleAddTextNode"
      @add-shape-node="handleAddShapeNode"
      @open-settings="handleOpenSettings"
      @toggle-lock-background="handleToggleLockBackground"
      @toggle-grid="handleToggleGrid"
      @send-to-back="handleSendToBack"
      @send-to-front="handleSendToFront"
      @rotate-left="handleRotateLeft"
      @rotate-right="handleRotateRight"
      @edit-shape-style="handleEditShapeStyle"
      @delete-selected="handleDeleteSelected"
    />

    <!-- File Manager Dialog for adding files -->
    <file-manager
      v-if="dmScreenComposable"
      :model-value="dmScreenComposable.showFileManager.value"
      @update:model-value="dmScreenComposable.showFileManager.value = $event"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleFilesSelected"
    />

    <!-- Kitbashing Drawers -->
    <kitbashing-drawers
      v-if="dmScreen"
      @add-file="handleAddFile"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useToast } from 'vue-toastification'
import { useDmScreen } from '@/composables/useDmScreen'
import DmScreenWrapper from '@/components/dmScreen/DmScreenWrapper.vue'
import DmScreenFloatingToolbar from '@/components/dmScreen/DmScreenFloatingToolbar.vue'
import KitbashingDrawers from '@/components/dmScreen/KitbashingDrawers.vue'
import FileManager from '@/components/files/FileManager.vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

const route = useRoute()
const dmScreensStore = useDmScreensStore()
const toast = useToast()

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(route.params.id) : null
})

const dmScreenId = computed(() => {
  return route.params.dmScreenId as string
})

const dmScreen = computed(() => {
  return dmScreensStore.currentDmScreen
})

// Call composable directly - this is the correct way!
const libId = route.params.id ? Number(route.params.id) : null
const screenId = route.params.dmScreenId as string
const dmScreenComposable = libId && screenId ? useDmScreen(screenId, libId) : null

// Provide composable to child components
if (dmScreenComposable) {
  provide('dmScreenComposable', dmScreenComposable)
}

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

function handleAddItem() {
  if (dmScreenComposable) {
    dmScreenComposable.showItemSelector.value = true
  }
}

function handleAddBackground() {
  if (dmScreenComposable) {
    dmScreenComposable.showFileManager.value = true
  }
}

function handleOpenSettings() {
  if (dmScreenComposable) {
    dmScreenComposable.showSettingsDialog.value = true
  }
}

function handleToggleLockBackground() {
  dmScreenComposable?.toggleLockBackground()
}

function handleToggleGrid() {
  dmScreenComposable?.toggleGrid()
}

function handleAddTextNode() {
  dmScreenComposable?.addTextNode()
}

function handleAddShapeNode() {
  dmScreenComposable?.addShapeNode()
}

function handleSendToBack() {
  if (dmScreenComposable?.selectedItem.value) {
    dmScreenComposable.sendToBack(dmScreenComposable.selectedItem.value)
  }
}

function handleSendToFront() {
  if (dmScreenComposable?.selectedItem.value) {
    dmScreenComposable.sendToFront(dmScreenComposable.selectedItem.value)
  }
}

function handleEditShapeStyle() {
  if (dmScreenComposable?.selectedItem.value) {
    dmScreenComposable.editShapeStyle(dmScreenComposable.selectedItem.value)
  }
}

function handleDeleteSelected() {
  if (dmScreenComposable && dmScreenComposable.selectedItem.value) {
    dmScreenComposable.deleteItem(dmScreenComposable.selectedItem.value.id)
    dmScreenComposable.selectedItem.value = null
  }
}

function handleRotateLeft() {
  if (dmScreenComposable?.selectedItem.value) {
    dmScreenComposable.rotateItem(dmScreenComposable.selectedItem.value, -90)
  }
}

function handleRotateRight() {
  if (dmScreenComposable?.selectedItem.value) {
    dmScreenComposable.rotateItem(dmScreenComposable.selectedItem.value, 90)
  }
}

function handleAddFile(file: any) {
  dmScreenComposable?.addUserFile(file)
}

function handleAddFileFromToolbar() {
  if (dmScreenComposable) {
    dmScreenComposable.showFileManager.value = true
  }
}

async function handleFilesSelected(fileIds: number | number[] | string | string[]) {
  if (!dmScreen.value || !dmScreenComposable) return
  
  // Convert to number array
  const idsArray: number[] = (Array.isArray(fileIds) ? fileIds : [fileIds])
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id))
  
  if (idsArray.length === 0) return
  
  try {
    // Use default position since we don't have VueFlow context here
    const center = { x: 400, y: 300 }
    const currentItems = dmScreen.value.items || []
    const newItems: DmScreenItem[] = []
    
    // Default size for MediaCard nodes
    const defaultWidth = 300
    const defaultHeight = 400
    
    // Add each selected file as a UserFile node
    for (let i = 0; i < idsArray.length; i++) {
      const fileId = idsArray[i]
      
      // Stagger positions slightly for multiple files
      const offsetX = (i % 3) * 50 - 50 // -50, 0, 50
      const offsetY = Math.floor(i / 3) * 50
      
      const userFileItem: DmScreenItem = {
        id: `userfile-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'UserFileId',
        data: {
          id: fileId,
          isBackground: false,
        },
        nodeOptions: {
          x: center.x + offsetX,
          y: center.y + offsetY,
          position: { 
            x: center.x + offsetX,
            y: center.y + offsetY
          },
          width: defaultWidth,
          height: defaultHeight,
          resizable: true,
        },
        isMinimized: false,
      }
      
      newItems.push(userFileItem)
    }
    
    const updatedItems = [...currentItems, ...newItems]
    dmScreenComposable.updateItems(updatedItems)
    
    toast.success(`Added ${idsArray.length} file${idsArray.length > 1 ? 's' : ''} to DM screen`)
    dmScreenComposable.showFileManager.value = false
  } catch (error: any) {
    console.error('[DmScreenView] Failed to add files:', error)
    toast.error('Failed to add files to DM screen')
  }
}
</script>

<style scoped>
.dm-screen-view {
    width: 100%;
  height:90vh;
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


.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: 8px;
}
</style>

