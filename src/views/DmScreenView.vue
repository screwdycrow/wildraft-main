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
        ref="dmScreenWrapperRef"
        :dm-screen="dmScreen"
        @update:lock-background-images="lockBackgroundImages = $event"
        @update:show-grid="showGrid = $event"
        @selected-item="selectedItem = $event"
      />
    </div>

    <!-- Floating Toolbar -->
    <dm-screen-floating-toolbar
      v-if="dmScreen"
      :lock-background-images="lockBackgroundImages"
      :show-grid="showGrid"
      :selected-item="selectedItem"
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
      v-model="showFileManager"
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useToast } from 'vue-toastification'
import DmScreenWrapper from '@/components/dmScreen/DmScreenWrapper.vue'
import DmScreenFloatingToolbar from '@/components/dmScreen/DmScreenFloatingToolbar.vue'
import KitbashingDrawers from '@/components/dmScreen/KitbashingDrawers.vue'
import FileManager from '@/components/files/FileManager.vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

const route = useRoute()
const router = useRouter()
const dmScreensStore = useDmScreensStore()
const toast = useToast()

const dmScreenWrapperRef = ref<InstanceType<typeof DmScreenWrapper> | null>(null)
const lockBackgroundImages = ref(false)
const showGrid = ref(true)
const selectedItem = ref<DmScreenItem | null>(null)
const showFileManager = ref(false)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const dmScreenId = computed(() => {
  return route.params.dmScreenId as string
})

const dmScreen = computed(() => {
  return dmScreensStore.currentDmScreen
})

// Watch for sidebar width changes (from LibraryLayout)
// This is a simple approach - in a real app you might use provide/inject or a store
watch(() => dmScreen.value?.settings?.lockBackgroundImages, (value: boolean | undefined) => {
  if (value !== undefined) {
    lockBackgroundImages.value = value
  }
}, { immediate: true })

watch(() => dmScreen.value?.settings?.grid?.showGrid, (value: boolean | undefined) => {
  if (value !== undefined) {
    showGrid.value = value
  } else {
    showGrid.value = true // Default to true
  }
}, { immediate: true })

// Calculate sidebar width based on rail state
// In rail mode, sidebar is ~56px, otherwise 200px
// We'll watch for changes in the DOM or use a more sophisticated approach
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

function goBack() {
  if (libraryId.value) {
    router.push({ name: 'LibraryDmScreens', params: { id: libraryId.value } })
  }
}

function handleEdit() {
  // TODO: Implement edit functionality
  toast.info('Edit functionality coming soon')
}

function handleAddItem() {
  dmScreenWrapperRef.value?.addItem()
}

function handleAddBackground() {
  dmScreenWrapperRef.value?.addBackground()
}

function handleOpenSettings() {
  dmScreenWrapperRef.value?.openSettings()
}

function handleToggleLockBackground() {
  dmScreenWrapperRef.value?.toggleLockBackground()
}

function handleToggleGrid() {
  dmScreenWrapperRef.value?.toggleGrid()
}

function handleAddTextNode() {
  dmScreenWrapperRef.value?.addTextNode()
}

function handleAddShapeNode() {
  dmScreenWrapperRef.value?.addShapeNode()
}

function handleSendToBack() {
  dmScreenWrapperRef.value?.sendToBack(selectedItem.value)
}

function handleSendToFront() {
  dmScreenWrapperRef.value?.sendToFront(selectedItem.value)
}

function handleEditShapeStyle() {
  dmScreenWrapperRef.value?.editShapeStyle(selectedItem.value)
}

function handleDeleteSelected() {
  if (selectedItem.value) {
    dmScreenWrapperRef.value?.deleteItem(selectedItem.value.id)
    selectedItem.value = null
  }
}

function handleRotateLeft() {
  if (selectedItem.value && dmScreenWrapperRef.value) {
    dmScreenWrapperRef.value.rotateItem(selectedItem.value, -90)
  }
}

function handleRotateRight() {
  if (selectedItem.value && dmScreenWrapperRef.value) {
    dmScreenWrapperRef.value.rotateItem(selectedItem.value, 90)
  }
}

function handleAddFile(file: any) {
  dmScreenWrapperRef.value?.addUserFile(file)
}

function handleAddFileFromToolbar() {
  showFileManager.value = true
}

async function handleFilesSelected(fileIds: number | number[] | string | string[]) {
  if (!dmScreen.value) return
  
  // Convert to number array
  const idsArray: number[] = (Array.isArray(fileIds) ? fileIds : [fileIds])
    .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
    .filter(id => !isNaN(id))
  
  if (idsArray.length === 0) return
  
  try {
    const currentItems = dmScreen.value.items || []
    const newItems: DmScreenItem[] = []
    
    // Default size for MediaCard nodes
    const defaultWidth = 300
    const defaultHeight = 400
    
    // Get viewport center from Vue Flow (approximate)
    const centerX = 400
    const centerY = 300
    
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
          x: centerX + offsetX - defaultWidth / 2,
          y: centerY + offsetY - defaultHeight / 2,
          position: { 
            x: centerX + offsetX - defaultWidth / 2,
            y: centerY + offsetY - defaultHeight / 2
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
    
    await dmScreensStore.updateDmScreen(
      dmScreen.value.libraryId,
      dmScreen.value.id,
      { items: updatedItems }
    )
    
    toast.success(`Added ${idsArray.length} file${idsArray.length > 1 ? 's' : ''} to DM screen`)
    showFileManager.value = false
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

