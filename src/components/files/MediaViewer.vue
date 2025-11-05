<template>
  <v-dialog
    v-model="isOpen"
    fullscreen
    transition="dialog-bottom-transition"
    class="media-viewer-dialog"
  >
    <v-card color="black">
      <!-- Header -->
      <v-toolbar 
        :color="transparentToolbar ? 'transparent' : 'rgba(0, 0, 0, 0.9)'" 
        dark
        :class="{ 'toolbar-hidden': !showToolbar, 'toolbar-transparent': transparentToolbar }"
        @mouseenter="handleToolbarHover"
      >
        <v-btn icon="mdi-close" @click="close" />
        
        <v-toolbar-title v-if="!hideTitle">
          {{ currentFile?.fileName || 'Media Viewer' }}
        </v-toolbar-title>

        <v-spacer />

        <!-- Navigation -->
        <v-btn
          v-if="canNavigate && currentIndex > 0"
          icon="mdi-chevron-left"
          @click="previous"
        />
        
        <span v-if="canNavigate && files" class="mx-2">
          {{ currentIndex + 1 }} / {{ files.length }}
        </span>
        
        <v-btn
          v-if="canNavigate && files && currentIndex < files.length - 1"
          icon="mdi-chevron-right"
          @click="next"
        />

        <v-btn
          v-if="onDelete && !hideDelete"
          icon="mdi-delete"
          color="error"
          @click="handleDelete"
          class="ml-2"
        />
      </v-toolbar>

      <!-- Viewer Content -->
      <v-card-text class="pa-0 fill-height">
        <div v-if="fileUrl" class="media-viewer__content">
          <!-- Image Viewer -->
          <image-viewer
            v-if="isImage && currentFile"
            :url="fileUrl"
            :file-name="currentFile.fileName"
          />

          <!-- Video Viewer -->
          <video-viewer
            v-else-if="isVideo && currentFile"
            :url="fileUrl"
            :file-name="currentFile.fileName"
          />

          <!-- PDF Viewer -->
          <pdf-viewer
            v-else-if="isPdf && currentFile"
            :url="fileUrl"
            :file-name="currentFile.fileName"
          />

          <!-- Generic/Fallback Viewer -->
          <generic-viewer
            v-else-if="currentFile"
            :url="fileUrl"
            :file-name="currentFile.fileName"
            :file-type="currentFile.fileType"
          />
        </div>

        <!-- Loading -->
        <div v-else class="media-viewer__loading">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="text-h6 mt-4">Loading...</p>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserFile } from '@/api/files'
import { useFilesStore } from '@/stores/files'
import ImageViewer from './viewers/ImageViewer.vue'
import VideoViewer from './viewers/VideoViewer.vue'
import PdfViewer from './viewers/PdfViewer.vue'
import GenericViewer from './viewers/GenericViewer.vue'

interface Props {
  file?: UserFile | null
  files?: UserFile[]
  onDelete?: (file: UserFile) => void | Promise<void>
  hideTitle?: boolean
  hideDelete?: boolean
  transparentToolbar?: boolean
  autoHideToolbar?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  hideTitle: false,
  hideDelete: false,
  transparentToolbar: false,
  autoHideToolbar: false,
  autoHideDelay: 2000
})

const emit = defineEmits<{
  close: []
}>()

const filesStore = useFilesStore()

const isOpen = defineModel<boolean>('modelValue', { default: false })
const currentIndex = ref(0)
const fileUrl = ref<string>('')
const loading = ref(false)
const showToolbar = ref(true)
const hideToolbarTimer = ref<number | null>(null)

const currentFile = computed(() => {
  if (props.files && props.files.length > 0) {
    return props.files[currentIndex.value]
  }
  return props.file
})

const canNavigate = computed(() => {
  return props.files && props.files.length > 1
})

const isImage = computed(() => currentFile.value?.fileType.startsWith('image/'))
const isVideo = computed(() => currentFile.value?.fileType.startsWith('video/'))
const isPdf = computed(() => currentFile.value?.fileType.includes('pdf'))

// Load file URL when file changes
watch([isOpen, currentFile], async ([open, file]: [boolean, UserFile | null | undefined]) => {
  if (open && file) {
    loading.value = true
    fileUrl.value = ''
    
    try {
      const response = await filesStore.getDownloadUrl(file.id)
      fileUrl.value = response
    } catch (error) {
      console.error('Failed to load file URL:', error)
    } finally {
      loading.value = false
    }
  } else {
    fileUrl.value = ''
  }
}, { immediate: true })

// Initialize index when files prop changes
watch(() => props.file, (file: UserFile | null | undefined) => {
  if (file && props.files) {
    const index = props.files.findIndex((f: UserFile) => f.id === file.id)
    if (index !== -1) {
      currentIndex.value = index
    }
  }
}, { immediate: true })

const previous = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const next = () => {
  if (props.files && currentIndex.value < props.files.length - 1) {
    currentIndex.value++
  }
}

const handleDelete = async () => {
  if (currentFile.value && props.onDelete) {
    await props.onDelete(currentFile.value)
    
    // Navigate to next file or close if no more files
    if (props.files) {
      if (props.files.length > 1) {
        if (currentIndex.value >= props.files.length - 1) {
          currentIndex.value = Math.max(0, currentIndex.value - 1)
        }
      } else {
        close()
      }
    } else {
      close()
    }
  }
}

const close = () => {
  isOpen.value = false
  fileUrl.value = ''
  emit('close')
}

const handleToolbarHover = () => {
  if (!props.autoHideToolbar) return
  
  showToolbar.value = true
  
  if (hideToolbarTimer.value !== null) {
    clearTimeout(hideToolbarTimer.value)
  }
  
  hideToolbarTimer.value = window.setTimeout(() => {
    showToolbar.value = false
  }, props.autoHideDelay)
}

// Keyboard navigation
const handleKeyPress = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  
  switch (e.key) {
    case 'Escape':
      close()
      break
    case 'ArrowLeft':
      previous()
      break
    case 'ArrowRight':
      next()
      break
    case 'Delete':
      if (props.onDelete) {
        handleDelete()
      }
      break
  }
}

watch(isOpen, (open: boolean) => {
  if (open) {
    window.addEventListener('keydown', handleKeyPress)
    
    if (props.autoHideToolbar) {
      hideToolbarTimer.value = window.setTimeout(() => {
        showToolbar.value = false
      }, props.autoHideDelay)
    }
  } else {
    window.removeEventListener('keydown', handleKeyPress)
    
    if (hideToolbarTimer.value !== null) {
      clearTimeout(hideToolbarTimer.value)
    }
  }
})
</script>

<style scoped>
.media-viewer__content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-viewer__loading {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
}

.toolbar-transparent {
  background: transparent !important;
}

.toolbar-hidden {
  opacity: 0;
  transform: translateY(-100%);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.v-toolbar:not(.toolbar-hidden) {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
</style>

