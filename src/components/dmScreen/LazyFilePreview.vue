<template>
  <div ref="target" class="lazy-file-preview">
    <transition name="fade-in" appear>
      <div
        v-if="isVisible"
        class="file-preview"
        :class="{ 'file-preview--image': isImage }"
        @click="$emit('click', file)"
        @dragstart="handleDragStart"
        draggable="true"
      >
        <v-img
          v-if="isImage"
          :src="file.downloadUrl"
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
        <div v-else class="file-preview-icon">
          <v-icon :icon="getFileIcon(file.fileType)" size="32" />
        </div>
      </div>
    </transition>
    <div v-if="!isVisible" class="file-preview file-preview--skeleton">
      <div class="skeleton-placeholder" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import type { UserFile } from '@/api/files'
import { getFileIcon } from '@/api/files'

interface Props {
  file: UserFile
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [file: UserFile]
  dragstart: [event: DragEvent, file: UserFile]
}>()

const target = ref<HTMLElement>()
const isVisible = ref(false)

const isImage = props.file.fileType.startsWith('image/')

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      isVisible.value = true
    }
  },
  {
    rootMargin: '100px',
    threshold: 0.01,
    immediate: true,
  }
)

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
  // The parent (KitbashingDrawers) will override with 'user-file-background' type
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

.file-preview-icon {
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

