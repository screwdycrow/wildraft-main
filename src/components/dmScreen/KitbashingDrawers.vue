<template>
  <div v-if="dmScreen" class="kitbashing-drawers-container">
    <div class="drawers-column">
      <!-- Category Buttons with Drawers -->
      <div
        v-for="pinnedCategory in pinnedCategories"
        :key="pinnedCategory.id"
        class="category-button-wrapper"
      >
        <button
          class="category-button"
          :class="{ 'category-button--active': openDrawerIds.has(pinnedCategory.id) }"
          @click="toggleDrawer(pinnedCategory.id)"
        >
          <span class="category-button-text">{{ pinnedCategory.name }}</span>
        </button>
        
        <!-- Drawer next to button -->
        <transition name="drawer">
          <div
            v-show="openDrawerIds.has(pinnedCategory.id)"
            class="drawer"
            @click.stop
          >
            <div class="drawer-header">
              <h3 class="drawer-title">{{ pinnedCategory.name }}</h3>
              <div class="drawer-actions">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="unpinCategory(pinnedCategory.id)"
                  title="Unpin category"
                >
                  <v-icon>mdi-pin-off</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  @click="closeDrawer(pinnedCategory.id)"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
            
            <!-- Layer Selector -->
            <div class="drawer-layer-selector">
              <v-select
                v-model="drawerLayerSelections[pinnedCategory.id]"
                :items="availableLayers"
                item-title="name"
                item-value="id"
                label="Drop to layer"
                density="compact"
                variant="outlined"
                hide-details
                class="layer-select"
              >
                <template #prepend-inner>
                  <v-icon size="small" color="grey">mdi-layers</v-icon>
                </template>
              </v-select>
            </div>
            
            <div 
              class="drawer-content" 
              :ref="(el) => setDrawerContentRef(pinnedCategory.id, el)"
              :data-drawer-id="pinnedCategory.id"
            >
              <MasonryGrid
                v-if="!loadingFiles[pinnedCategory.id] && categoryFiles[pinnedCategory.id]?.length > 0"
                :columns="masonryColumns"
                :gutter="masonryGutter"
                class="files-grid"
              >
                <MasonryGridItem
                  v-for="file in categoryFiles[pinnedCategory.id]"
                  :key="file.id"
                  class="file-item"
                >
                  <lazy-file-preview
                    :file="file"
                    :scroll-container="drawerContentRefs[pinnedCategory.id]"
                    @click="handleFileClick(file)"
                    @dragstart="handleFileDragStart($event, file, pinnedCategory.id)"
                  />
                </MasonryGridItem>
              </MasonryGrid>
              
              <div v-else-if="loadingFiles[pinnedCategory.id]" class="drawer-loading">
                <v-progress-circular indeterminate color="primary" />
              </div>
              
              <div v-else class="drawer-empty">
                <v-icon icon="mdi-folder-open" size="48" color="grey" />
                <p class="text-body-2 text-grey-lighten-1 mt-2">No files in this category</p>
              </div>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- Add Button (Always visible) -->
      <button
        class="category-button category-button--add"
        @click="showAddDialog = true"
      >
        <v-icon>mdi-plus</v-icon>
      </button>
    </div>
    
    <!-- Add Category Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card class="glass-card">
        <v-card-title>Pin Category</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="category in availableCategories"
              :key="category.id"
              :title="category.name"
              :subtitle="`${category.fileCount || 0} files`"
              @click="pinCategory(category)"
            >
              <template #prepend>
                <v-icon icon="mdi-folder" class="mr-2" />
              </template>
            </v-list-item>
            <v-list-item v-if="availableCategories.length === 0">
              <v-list-item-title>No categories available</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAddDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useFileCategoriesStore } from '@/stores/fileCategories'
import { useRoute } from 'vue-router'
import type { FileCategory } from '@/api/files'
import type { UserFile } from '@/api/files'
import type { DmScreenLayer } from '@/types/dmScreen.types'
import { DEFAULT_LAYERS } from '@/types/dmScreen.types'
import { MasonryGrid, MasonryGridItem } from 'vue3-masonry-css'
import LazyFilePreview from './LazyFilePreview.vue'

defineEmits<{
  'add-file': [file: UserFile]
}>()

const route = useRoute()
const dmScreensStore = useDmScreensStore()
const fileCategoriesStore = useFileCategoriesStore()

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const dmScreen = computed(() => dmScreensStore.currentDmScreen)

// Track last fetched libraryId to prevent unnecessary refetches
const lastFetchedLibraryId = ref<number | null>(null)
const lastDmScreenId = ref<string | null>(null)

// Watch for libraryId changes to load categories (only if libraryId changed)
watch(libraryId, async (newLibraryId) => {
  // Only fetch if:
  // 1. We have a valid libraryId
  // 2. The libraryId actually changed
  // 3. We have a dmScreen loaded
  if (newLibraryId && newLibraryId !== lastFetchedLibraryId.value && dmScreen.value) {
    await fileCategoriesStore.fetchCategories(newLibraryId)
    lastFetchedLibraryId.value = newLibraryId
    lastDmScreenId.value = dmScreen.value.id
  }
}, { immediate: true })

// Watch for dmScreen ID changes (when switching between screens or initial load)
watch(() => dmScreen.value?.id, async (newScreenId, oldScreenId) => {
  // Only fetch if:
  // 1. We have a screen ID
  // 2. The screen ID actually changed (not just the object reference)
  // 3. We have a libraryId
  if (newScreenId && newScreenId !== lastDmScreenId.value && libraryId.value) {
    // Only fetch if libraryId changed or this is the first load
    if (libraryId.value !== lastFetchedLibraryId.value || lastDmScreenId.value === null) {
      await fileCategoriesStore.fetchCategories(libraryId.value)
      lastFetchedLibraryId.value = libraryId.value
    }
    lastDmScreenId.value = newScreenId
  }
}, { immediate: true })

const pinnedCategories = computed(() => {
  if (!dmScreen.value?.settings?.pinnedCategories) return []
  return dmScreen.value.settings.pinnedCategories as FileCategory[]
})

const availableCategories = computed(() => {
  const pinnedIds = new Set(pinnedCategories.value.map(c => c.id))
  return fileCategoriesStore.categories.filter(c => !pinnedIds.has(c.id))
})

const openDrawerIds = ref<Set<number>>(new Set())
const showAddDialog = ref(false)
const categoryFiles = ref<Record<number, UserFile[]>>({})
const loadingFiles = ref<Record<number, boolean>>({})
const drawerContentRefs = ref<Record<number, HTMLElement | null>>({})

// Layer selection per drawer (categoryId -> layerId)
const drawerLayerSelections = ref<Record<number, string>>({})

// Available layers from the current DM screen
const availableLayers = computed<DmScreenLayer[]>(() => {
  if (!dmScreen.value) return []
  return dmScreensStore.getLayers(dmScreen.value.id)
})

// Initialize drawer layer selections when drawers open
watch(openDrawerIds, (newIds) => {
  for (const categoryId of Array.from(newIds)) {
    // Default to 'background' layer for kitbashing drawers
    if (!drawerLayerSelections.value[categoryId]) {
      drawerLayerSelections.value[categoryId] = DEFAULT_LAYERS.BACKGROUND
    }
  }
}, { deep: true })

// Function to set drawer content ref
function setDrawerContentRef(categoryId: number, el: any) {
  if (el) {
    drawerContentRefs.value[categoryId] = el as HTMLElement
  }
}

const masonryColumns = {
  default: 3,
  1920: 4,
  1280: 3,
  960: 2,
  600: 2,
}

const masonryGutter = {
  default: '8px',
  1920: '10px',
  1280: '8px',
  960: '8px',
  600: '6px',
}

// Watch for drawer opening to load files
watch(openDrawerIds, async (newIds) => {
  // Load files for all open drawers
  for (const categoryId of Array.from(newIds)) {
    if (!categoryFiles.value[categoryId]) {
      await loadCategoryFiles(categoryId)
    }
  }
}, { deep: true })

async function loadCategoryFiles(categoryId: number) {
  if (!libraryId.value) return
  
  loadingFiles.value[categoryId] = true
  try {
    const category = await fileCategoriesStore.getCategoryWithFiles(libraryId.value, categoryId)
    // The API returns userFiles as part of the category
    const userFiles = (category as any).userFiles || []
    
    // Filter only image files - DON'T fetch download URLs here
    // LazyFilePreview will fetch URLs only when items enter the viewport
    const imageFiles = userFiles.filter((file: any) => 
      file.fileType && file.fileType.startsWith('image/')
    ) as UserFile[]
    
    categoryFiles.value[categoryId] = imageFiles
  } catch (error) {
    console.error('Failed to load category files:', error)
    categoryFiles.value[categoryId] = []
  } finally {
    loadingFiles.value[categoryId] = false
  }
}

function toggleDrawer(categoryId: number) {
  if (openDrawerIds.value.has(categoryId)) {
    openDrawerIds.value.delete(categoryId)
  } else {
    openDrawerIds.value.add(categoryId)
  }
}

function closeDrawer(categoryId: number) {
  openDrawerIds.value.delete(categoryId)
}

async function pinCategory(category: FileCategory) {
  if (!dmScreen.value || !libraryId.value) return
  
  const currentPinned = pinnedCategories.value || []
  const updatedPinned = [...currentPinned, category]
  
  await dmScreensStore.updateDmScreen(libraryId.value, dmScreen.value.id, {
    settings: {
      ...dmScreen.value.settings,
      pinnedCategories: updatedPinned,
    },
  })
  
  showAddDialog.value = false
}

function handleFileClick(file: UserFile) {
  emit('add-file', file)
}

async function unpinCategory(categoryId: number) {
  if (!dmScreen.value || !libraryId.value) return
  
  const currentPinned = pinnedCategories.value || []
  const updatedPinned = currentPinned.filter(c => c.id !== categoryId)
  
  await dmScreensStore.updateDmScreen(libraryId.value, dmScreen.value.id, {
    settings: {
      ...dmScreen.value.settings,
      pinnedCategories: updatedPinned,
    },
  })
  
  // Close the drawer if it's open
  closeDrawer(categoryId)
}

function handleFileDragStart(event: DragEvent, file: UserFile, categoryId: number) {
  if (!event.dataTransfer) return
  
  // Get the selected layer for this drawer
  const targetLayer = drawerLayerSelections.value[categoryId] || DEFAULT_LAYERS.BACKGROUND
  
  // Don't prevent default - we need the drag to start
  // Just override the data that LazyFilePreview set
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'user-file-background', // Always background type from kitbashing drawers
    fileId: file.id,
    targetLayer: targetLayer,
    isBackground: true, // Always mark as background node from kitbashing
  }))
  event.dataTransfer.setData('text/plain', `file:${file.id}:${targetLayer}:background`)
  
  console.log('[KitbashingDrawers] Drag started for file:', file.id, 'to layer:', targetLayer)
}

// Close drawer when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.kitbashing-drawers-container')) {
    closeDrawer()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.kitbashing-drawers-container {
  position: absolute;
  left: 56px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  pointer-events: none;
  max-height: 90vh;
  display: flex;
  flex-direction: row;
}

.drawers-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  pointer-events: auto;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: visible;
  padding-right: 8px;
}

.category-button-wrapper {
  position: relative;
  display: flex;
  align-items: flex-start;
  flex-direction: row;
}

.category-button {
  width: 48px;
  height: 500px;
  padding: 16px 0;
  background: rgba(22, 22, 32, 0.8);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35),
              0 2px 6px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.category-button:hover {
  background: rgba(28, 28, 38, 0.9);
  border-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.02);
}

.category-button--active {
  background: rgba(28, 28, 38, 0.95);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.category-button-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.category-button--add {
  width: 48px;
  min-width: 48px;
  height: 48px;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.category-button--add:hover {
  color: rgba(255, 255, 255, 1);
  background: rgba(var(--v-theme-primary), 0.2);
  transform: scale(1.02);
}

.drawer {
  position: relative;
  margin-left: 8px;
  width: 400px;
  height: 500px;
  max-height: 90vh;
  background: rgba(22, 22, 32, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
              0 2px 8px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
  flex-shrink: 0;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.drawer-actions {
  display: flex;
  gap: 4px;
}

.drawer-layer-selector {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.layer-select {
  font-size: 12px;
}

.layer-select :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.layer-select :deep(.v-field__input) {
  font-size: 12px;
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 32px;
}

.layer-select :deep(.v-field__outline) {
  --v-field-border-opacity: 0.2;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 0;
}

.drawer-loading,
.drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.files-grid {
  width: 100%;
}

.file-item {
  margin-bottom: 8px;
}


/* Drawer transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}

.drawer-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.drawer-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.drawer-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.drawer-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Scrollbar styling for drawers column */
.drawers-column::-webkit-scrollbar {
  width: 8px;
}

.drawers-column::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.drawers-column::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.drawers-column::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Scrollbar styling */
.drawer-content::-webkit-scrollbar {
  width: 8px;
}

.drawer-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.drawer-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.drawer-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

