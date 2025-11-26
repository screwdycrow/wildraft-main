<template>
  <div ref="target" class="lazy-file-preview">
    <transition name="fade-in" appear>
      <div
        v-if="shouldRender"
        class="file-preview"
        :class="{ 'file-preview--image': isImage }"
        @click="$emit('click', file)"
        @dragstart="handleDragStart"
        draggable="true"
      >
        <!-- Loading state while fetching URL -->
        <div v-if="isLoadingUrl" class="file-preview-loading">
          <v-progress-circular indeterminate color="primary" size="24" />
        </div>
        
        <!-- Image preview -->
        <v-img
          v-else-if="isImage && imageUrl"
          :src="imageUrl"
          :aspect-ratio="1"
          cover
          class="file-preview-image"
        >
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular indeterminate color="primary" size="24" />
            </div>
          </template>
        </v-img>
        
        <!-- Non-image file icon -->
        <div v-else class="file-preview-icon">
          <v-icon :icon="getFileIcon(file.fileType)" size="32" />
        </div>
      </div>
    </transition>
    
    <!-- Skeleton placeholder when not visible -->
    <div v-if="!shouldRender" class="file-preview file-preview--skeleton">
      <div class="skeleton-placeholder" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useFilesStore } from '@/stores/files'
import type { UserFile } from '@/api/files'
import { getFileIcon } from '@/api/files'

interface Props {
  file: UserFile
  scrollContainer?: HTMLElement | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [file: UserFile]
  dragstart: [event: DragEvent, file: UserFile]
}>()

const filesStore = useFilesStore()

const target = ref<HTMLElement>()
const hasBeenVisible = ref(false)
const isLoadingUrl = ref(false)
const imageUrl = ref<string | null>(null)
let observer: IntersectionObserver | null = null

const isImage = computed(() => props.file.fileType.startsWith('image/'))
const shouldRender = computed(() => hasBeenVisible.value)

function setupObserver() {
  if (!target.value) return
  
  // Clean up existing observer
  if (observer) {
    observer.disconnect()
    observer = null
  }
  
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting && !hasBeenVisible.value) {
        hasBeenVisible.value = true
        
        // Fetch URL only now
        if (isImage.value) {
          fetchDownloadUrl()
        }
        
        // Stop observing once visible
        if (observer) {
          observer.disconnect()
          observer = null
        }
      }
    },
    {
      // Use the scroll container as root if provided, otherwise use viewport
      root: props.scrollContainer || null,
      rootMargin: '50px', // Start loading 50px before entering viewport
      threshold: 0.01,
    }
  )
  
  observer.observe(target.value)
}

// Watch for scroll container changes and re-setup observer
watch(() => props.scrollContainer, (newContainer) => {
  if (newContainer && target.value && !hasBeenVisible.value) {
    setupObserver()
  }
}, { immediate: false })

onMounted(() => {
  // Wait a tick to ensure scroll container is available
  setTimeout(() => {
    setupObserver()
  }, 0)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

async function fetchDownloadUrl() {
  // Check if URL is already provided
  if (props.file.downloadUrl) {
    imageUrl.value = props.file.downloadUrl
    return
  }
  
  // Fetch the download URL
  isLoadingUrl.value = true
  try {
    const url = await filesStore.getDownloadUrl(props.file.id)
    imageUrl.value = url
  } catch (error) {
    console.error(`[LazyFilePreview] Failed to get download URL for file ${props.file.id}:`, error)
    imageUrl.value = null
  } finally {
    isLoadingUrl.value = false
  }
}

function handleDragStart(event: DragEvent) {
  if (!event.dataTransfer) return
  
  // Set default data first
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'user-file',
    fileId: props.file.id,
  }))
  event.dataTransfer.setData('text/plain', `file:${props.file.id}`)
  
  // Emit the event so parent can override the data if needed
  emit('dragstart', event, props.file)
}
</script>

<style scoped>
.lazy-file-preview {
  width: 100%;
  min-height: 80px;
}

.file-preview {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.file-preview:hover {
  transform: scale(1.05);
  border-color: rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.file-preview-image {
  width: 100%;
  height: 100%;
}

.file-preview-icon,
.file-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
}

.file-preview--skeleton {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.fade-in-enter-active {
  transition: opacity 0.3s ease;
}

.fade-in-enter-from {
  opacity: 0;
}
</style>
