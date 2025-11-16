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
      @add-text-node="handleAddTextNode"
      @add-shape-node="handleAddShapeNode"
      @open-settings="handleOpenSettings"
      @toggle-lock-background="handleToggleLockBackground"
      @toggle-grid="handleToggleGrid"
      @send-to-back="handleSendToBack"
      @send-to-front="handleSendToFront"
      @edit-shape-style="handleEditShapeStyle"
      @delete-selected="handleDeleteSelected"
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
import type { DmScreenItem } from '@/types/dmScreen.types'

const route = useRoute()
const router = useRouter()
const dmScreensStore = useDmScreensStore()
const toast = useToast()

const dmScreenWrapperRef = ref<InstanceType<typeof DmScreenWrapper> | null>(null)
const lockBackgroundImages = ref(false)
const showGrid = ref(true)
const selectedItem = ref<DmScreenItem | null>(null)

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
</script>

<style scoped>
.dm-screen-view {
  width: 100%;
  height: 100vh;
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
}

.dm-screen-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  flex-shrink: 0;
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

