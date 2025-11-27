<template>
  <div 
    class="token-node-display"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <!-- Image Display with configurable border -->
    <div 
      class="token-image-container"
      :style="containerStyle"
    >
      <img 
        v-if="imageUrl" 
        :src="imageUrl" 
        :alt="label"
        class="token-image"
      />
      <div v-else class="token-icon-fallback" :style="{ backgroundColor: fallbackColor }">
        <v-icon :icon="fallbackIcon" class="token-fallback-icon" color="white" />
      </div>
    </div>
    
    <!-- Label (shown below token, configurable) -->
    <div class="token-label" v-if="showLabel && label" :class="{ 'always-visible': showLabel }">
      {{ truncatedLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import type { UserFile } from '@/api/files'
import { useFilesStore } from '@/stores/files'
import { useItemsStore } from '@/stores/items'
import { useDialogsStore } from '@/stores/dialogs'
import { itemsApi } from '@/api/items'
import * as filesApi from '@/api/files'

interface Props {
  item: DmScreenItem
  libraryId: number
}

const props = defineProps<Props>()

const filesStore = useFilesStore()
const itemsStore = useItemsStore()
const dialogsStore = useDialogsStore()

// Loaded data
const libraryItem = ref<LibraryItem | null>(null)
const userFile = ref<UserFile | null>(null)
const imageUrl = ref<string | null>(null)

// Get the original type to determine what to load
const originalType = computed(() => {
  return props.item.data.originalType || props.item.type
})

// Label for the token
const label = computed(() => {
  if (props.item.data.tokenLabel) {
    return props.item.data.tokenLabel
  }
  if (libraryItem.value) {
    return libraryItem.value.name
  }
  if (userFile.value) {
    return userFile.value.fileName
  }
  return 'Token'
})

const truncatedLabel = computed(() => {
  const maxLength = 15
  if (label.value.length > maxLength) {
    return label.value.substring(0, maxLength) + '...'
  }
  return label.value
})

// Token settings
const showLabel = computed(() => {
  return props.item.data.tokenShowLabel !== false // Default to true
})

const borderColor = computed(() => {
  return props.item.data.tokenBorderColor || 'transparent'
})

const borderWidth = computed(() => {
  return props.item.data.tokenBorderWidth || 0
})

// Container style with border
const containerStyle = computed(() => {
  const styles: Record<string, string> = {}
  
  if (borderWidth.value > 0) {
    styles.border = `${borderWidth.value}px solid ${borderColor.value}`
    styles.boxSizing = 'border-box'
  }
  
  return styles
})


// Fallback icon based on original type
const fallbackIcon = computed(() => {
  if (libraryItem.value) {
    // Return icon based on library item type
    const itemType = libraryItem.value.itemType?.name?.toLowerCase() || ''
    if (itemType.includes('character') || itemType.includes('npc')) return 'mdi-account'
    if (itemType.includes('monster') || itemType.includes('creature')) return 'mdi-skull'
    if (itemType.includes('location') || itemType.includes('place')) return 'mdi-map-marker'
    if (itemType.includes('item') || itemType.includes('equipment')) return 'mdi-sword'
    if (itemType.includes('spell')) return 'mdi-auto-fix'
    if (itemType.includes('note')) return 'mdi-note-text'
    return 'mdi-book-open-variant'
  }
  if (userFile.value) {
    const fileType = userFile.value.fileType || ''
    if (fileType.startsWith('image/')) return 'mdi-image'
    if (fileType.startsWith('audio/')) return 'mdi-music'
    if (fileType.startsWith('video/')) return 'mdi-video'
    if (fileType.includes('pdf')) return 'mdi-file-pdf-box'
    return 'mdi-file'
  }
  return 'mdi-circle'
})

// Fallback color
const fallbackColor = computed(() => {
  if (libraryItem.value) {
    const itemType = libraryItem.value.itemType?.name?.toLowerCase() || ''
    if (itemType.includes('character') || itemType.includes('npc')) return '#6366f1'
    if (itemType.includes('monster') || itemType.includes('creature')) return '#ef4444'
    if (itemType.includes('location') || itemType.includes('place')) return '#22c55e'
    if (itemType.includes('item') || itemType.includes('equipment')) return '#f59e0b'
    if (itemType.includes('spell')) return '#8b5cf6'
    return '#6366f1'
  }
  return '#6366f1'
})

// Load data based on original type
async function loadData() {
  const originalData = props.item.data.originalData || props.item.data
  
  if (originalType.value === 'LibraryItemId' && originalData.id) {
    try {
      // Try cache first
      const cached = itemsStore.getItemById(originalData.id)
      if (cached) {
        libraryItem.value = cached
      } else {
        const response = await itemsApi.getById(props.libraryId, originalData.id)
        libraryItem.value = response.item
      }
      
      // Load featured image
      if (libraryItem.value?.featuredImage) {
        imageUrl.value = await filesStore.getDownloadUrl(libraryItem.value.featuredImage.id)
      }
    } catch (error) {
      console.error('[TokenNodeDisplay] Failed to load library item:', error)
    }
  } else if (originalType.value === 'UserFileId' && originalData.id) {
    try {
      userFile.value = await filesApi.getFile(originalData.id)
      
      // If it's an image, use it directly
      if (userFile.value.fileType?.startsWith('image/') && userFile.value.downloadUrl) {
        imageUrl.value = userFile.value.downloadUrl
      }
    } catch (error) {
      console.error('[TokenNodeDisplay] Failed to load user file:', error)
    }
  }
  
  // Check for cached token image URL
  if (!imageUrl.value && props.item.data.tokenImageUrl) {
    imageUrl.value = props.item.data.tokenImageUrl
  }
}

function handleClick() {
  // Single click - could show tooltip or do nothing
}

function handleDoubleClick() {
  // Double click opens the viewer
  if (libraryItem.value) {
    dialogsStore.openItemViewer(libraryItem.value, props.libraryId)
  } else if (userFile.value) {
    dialogsStore.openFileViewer(userFile.value)
  }
}

onMounted(() => {
  loadData()
})

// Watch for item changes
watch(() => props.item.data.id, () => {
  loadData()
})
</script>

<style scoped>
.token-node-display {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.token-image-container {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.4),
    0 0 0 3px rgba(255, 255, 255, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.token-node-display:hover .token-image-container {
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(99, 102, 241, 0.6),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.token-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.token-icon-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
}

.token-fallback-icon {
  font-size: clamp(12px, 50%, 36px) !important;
}

.token-label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  white-space: nowrap;
  padding: 2px 8px;
  background: rgba(30, 30, 40, 0.9);
  border-radius: 4px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  opacity: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>

