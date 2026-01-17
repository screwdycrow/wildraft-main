<template>
  <v-card
    class="media-card"
    :class="{ 
      'media-card--selected': selected,
      'media-card--dragging': isDragging
    }"
    :draggable="true"
    @click="$emit('click', file)"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    hover
  >
    <!-- Thumbnail/Preview -->
    <div class="media-card__preview">
      <!-- Image Preview -->
      <v-img
        v-if="isImage"
        :src="thumbnailUrl"
        :aspect-ratio="1"
        cover
        class="media-card__image"
      >
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </template>
      </v-img>

      <!-- Video Icon -->
      <div v-else-if="isVideo" class="media-card__icon-container">
        <v-icon icon="mdi-video" size="64" color="secondary" />
      </div>

      <!-- Audio Icon -->
      <div v-else-if="isAudio" class="media-card__icon-container">
        <v-icon icon="mdi-music" size="64" color="accent" />
      </div>

      <!-- PDF Icon -->
      <div v-else-if="isPdf" class="media-card__icon-container">
        <v-icon icon="mdi-file-pdf-box" size="64" color="error" />
      </div>

      <!-- Generic File Icon -->
      <div v-else class="media-card__icon-container">
        <v-icon :icon="fileIcon" size="64" color="grey" />
      </div>

      <!-- Selection Checkbox -->
      <div v-if="selectable" class="media-card__checkbox">
        <v-checkbox-btn
          :model-value="selected"
          color="primary"
          @click.stop="$emit('toggle-select', file)"
        />
      </div>

      <!-- Custom Actions Slot -->
      <div v-if="$slots.actions" class="media-card__actions">
        <slot name="actions" :file="file" />
      </div>

      <!-- View Button -->
      <div v-if="showViewAction" class="media-card__view">
        <v-btn
          icon="mdi-eye"
          size="small"
          color="primary"
          variant="tonal"
          @click.stop="$emit('view', file)"
        />
      </div>

      <!-- Delete Button -->
      <div v-if="deletable && !hideDelete" class="media-card__delete">
        <v-btn
          icon="mdi-delete"
          size="small"
          color="error"
          variant="tonal"
          @click.stop="$emit('delete', file)"
        />
      </div>
      
      <!-- Featured Star Button (Images Only) -->
      <div v-if="showFeaturedToggle && isImage" class="media-card__featured">
        <v-btn
          :icon="isFeatured ? 'mdi-star' : 'mdi-star-outline'"
          size="small"
          :color="isFeatured ? 'amber' : 'white'"
          variant="tonal"
          @click.stop="$emit('toggle-featured', file)"
        />
      </div>

      <!-- Portal Actions (Send to Portal & Show On Top) -->
      <div v-if="hasActivePortal" class="media-card__portal-actions">
        <v-tooltip text="Send to Portal" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon="mdi-television"
              size="x-small"
              color="primary"
              :loading="isSendingToPortal"
              @click.stop="handleSendToPortal"
            />
          </template>
        </v-tooltip>
        <v-tooltip text="Show On Top" location="top">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon="mdi-television-play"
              size="x-small"
              color="primary"
              :disabled="isSendingToPortal"
              @click.stop="handleShowOnTop"
            />
          </template>
        </v-tooltip>
      </div>

      <!-- Move Menu (Three Dots) -->
      <div v-if="showMoveMenu" class="media-card__move-menu">
        <v-menu location="bottom end" v-model="moveMenuOpen">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-vertical"
              size="x-small"
              color="white"
              variant="tonal"
              @click.stop
            />
          </template>
          <v-list>
            <v-list-subheader>Move to</v-list-subheader>
            <v-list-item
              v-for="folder in availableFolders"
              :key="folder.id"
              :title="folder.name"
              :subtitle="`${folder.fileCount || 0} files`"
              @click.stop="handleMoveToFolder(folder.id)"
            >
              <template #prepend>
                <v-icon icon="mdi-folder" class="mr-2" />
              </template>
            </v-list-item>
            <v-list-item
              v-if="file.categoryId !== null"
              title="Uncategorized"
              subtitle="Move out of folder"
              @click.stop="handleMoveToFolder(null)"
            >
              <template #prepend>
                <v-icon icon="mdi-folder-outline" class="mr-2" />
              </template>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- File Info -->
    <v-card-text 
      v-if="!hideTitle"
      class="pa-2"
      :class="{ 'media-card__title--transparent': transparentTitle }"
    >
      <v-tooltip :text="file.fileName" location="top">
        <template #activator="{ props }">
          <div v-bind="props" class="text-body-2 text-truncate font-weight-medium">
            {{ file.fileName }}
          </div>
        </template>
      </v-tooltip>
      <div class="text-caption text-medium-emphasis">
        {{ formatFileSize(file.fileSize) }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UserFile, FileCategory } from '@/api/files'
import { formatFileSize, getFileIcon } from '@/api/files'
import { usePortalViewsStore } from '@/stores/portalViews'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useToast } from 'vue-toastification'

interface Props {
  file: UserFile
  selected?: boolean
  selectable?: boolean
  deletable?: boolean
  hideTitle?: boolean
  hideDelete?: boolean
  transparentTitle?: boolean
  showFeaturedToggle?: boolean
  isFeatured?: boolean
  showViewAction?: boolean
  showMoveMenu?: boolean
  availableFolders?: FileCategory[]
}

const props = withDefaults(defineProps<Props>(), {
  hideTitle: false,
  hideDelete: false,
  transparentTitle: false,
  showFeaturedToggle: false,
  isFeatured: false,
  showViewAction: false,
  showMoveMenu: false,
  availableFolders: () => [],
})

const emit = defineEmits<{
  click: [file: UserFile]
  'toggle-select': [file: UserFile]
  delete: [file: UserFile]
  'toggle-featured': [file: UserFile]
  view: [file: UserFile]
  'move-to-folder': [file: UserFile, categoryId: number | null]
}>()

const isImage = computed(() => props.file.fileType.startsWith('image/'))
const isVideo = computed(() => props.file.fileType.startsWith('video/'))
const isAudio = computed(() => props.file.fileType.startsWith('audio/'))
const isPdf = computed(() => props.file.fileType.includes('pdf'))

const fileIcon = computed(() => getFileIcon(props.file.fileType))

// Get thumbnail URL for images - use downloadUrl directly from file
const thumbnailUrl = computed(() => {
  if (isImage.value && props.file.downloadUrl) {
    return props.file.downloadUrl
  }
  return ''
})

// Portal integration
const portalViewsStore = usePortalViewsStore()
const { sendPortalViewUpdate } = usePortalSocket()
const toast = useToast()
const isSendingToPortal = ref(false)
const isDragging = ref(false)
const moveMenuOpen = ref(false)

const hasActivePortal = computed(() => !!portalViewsStore.activePortal)

const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return
  
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  
  // Store file ID in dataTransfer
  event.dataTransfer.setData('application/json', JSON.stringify({ 
    type: 'user-file', 
    fileId: props.file.id
  }))
  // Also store as text/plain for better browser compatibility
  event.dataTransfer.setData('text/plain', `file:${props.file.id}`)
  
  // Set a custom drag image
  if (event.target instanceof HTMLElement) {
    const dragImage = event.target.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.pointerEvents = 'none'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
  }
}

const handleDragEnd = () => {
  isDragging.value = false
}

const handleMoveToFolder = (categoryId: number | null) => {
  moveMenuOpen.value = false
  emit('move-to-folder', props.file, categoryId)
}

const handleSendToPortal = async () => {
  isSendingToPortal.value = true
  try {
    await portalViewsStore.addItemToActivePortal(props.file, true)
    toast.success(`Sent "${props.file.fileName}" to portal and set as current`)
  } catch (error: any) {
    console.error('[MediaCard] Failed to send to portal:', error)
    toast.error(error.message || 'Failed to send to portal')
  } finally {
    isSendingToPortal.value = false
  }
}

const handleShowOnTop = () => {
  // Send show-on-top command with the UserFile
  sendPortalViewUpdate({
    command: 'show-on-top',
    userFile: props.file, // Send the UserFile directly
  })
  
  toast.success(`Showing "${props.file.fileName}" on portal`)
}
</script>

<style scoped>
.media-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  user-select: none;
}

.media-card:hover {
  transform: translateY(-4px);
}

.media-card--selected {
  outline: 3px solid rgb(var(--v-theme-primary));
}

.media-card[draggable="true"] {
  cursor: grab;
}

.media-card[draggable="true"]:active {
  cursor: grabbing;
}

.media-card--dragging {
  opacity: 0.5;
}

.media-card__preview {
  position: relative;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.media-card__icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.5), rgba(var(--v-theme-surface-variant), 0.5));
}

.media-card__image {
  width: 100%;
  height: 100%;
}

.media-card__checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.media-card__actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  gap: 4px;
}

.media-card:hover .media-card__actions {
  opacity: 1;
}

.media-card__view {
  position: absolute;
  top: 8px;
  right: 48px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s, right 0.2s;
}

.media-card:hover .media-card__view {
  opacity: 1;
}

.media-card__delete {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s, right 0.2s;
}

.media-card:hover .media-card__delete {
  opacity: 1;
}

.media-card__move-menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-card:hover .media-card__move-menu {
  opacity: 1;
}

/* Adjust button positions when move menu is visible */
.media-card:has(.media-card__move-menu) .media-card__delete {
  right: 48px;
}

.media-card:has(.media-card__move-menu) .media-card__view {
  right: 88px;
}

.media-card__featured {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
}

.media-card__portal-actions {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  gap: 4px;
}

.media-card:hover .media-card__portal-actions {
  opacity: 1;
}

.media-card__title--transparent {
  background: transparent !important;
}
</style>

