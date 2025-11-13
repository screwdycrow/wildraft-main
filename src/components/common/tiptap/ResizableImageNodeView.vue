<template>
  <NodeViewWrapper as="div" class="resizable-image-wrapper" :class="{ 'is-selected': selected }">
    <div class="resizable-image-container">
      <img
        ref="imageRef"
        :src="imageSrc"
        :alt="node.attrs.alt || ''"
        :style="imageStyle"
        class="resizable-image"
        @load="onImageLoad"
      />
      
      <!-- Resize handles -->
      <div
        v-if="selected"
        class="resize-handle resize-handle-se"
        @mousedown.stop="startResize('se', $event)"
      />
      <div
        v-if="selected"
        class="resize-handle resize-handle-sw"
        @mousedown.stop="startResize('sw', $event)"
      />
      <div
        v-if="selected"
        class="resize-handle resize-handle-ne"
        @mousedown.stop="startResize('ne', $event)"
      />
      <div
        v-if="selected"
        class="resize-handle resize-handle-nw"
        @mousedown.stop="startResize('nw', $event)"
      />
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, inject, watch } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { getFileDownloadUrl } from '@/config/api'
import type { UserFile } from '@/types/item.types'

const props = defineProps(nodeViewProps)

// Get userFiles from parent component
const userFiles = inject<Array<{ id: number; downloadUrl?: string; fileUrl?: string }>>('userFiles', [])

const imageRef = ref<HTMLImageElement | null>(null)
const naturalWidth = ref<number>(0)
const naturalHeight = ref<number>(0)
const isResizing = ref(false)
const resizeDirection = ref<string | null>(null)
const startX = ref<number>(0)
const startY = ref<number>(0)
const startWidth = ref<number>(0)
const startHeight = ref<number>(0)

// Resolve image source from fileId or use existing src
const imageSrc = computed(() => {
  const fileId = props.node.attrs.fileId
  const currentSrc = props.node.attrs.src
  
  // If we have a fileId, try to resolve from userFiles
  if (fileId && userFiles?.length) {
    const userFile = userFiles.find(f => f.id === fileId)
    if (userFile) {
      return getFileDownloadUrl(userFile as UserFile) || currentSrc
    }
  }
  
  // Fallback to current src (for base64 or external URLs)
  return currentSrc
})

// Watch for changes in userFiles to update image src
watch(() => [userFiles, props.node.attrs.fileId], () => {
  if (imageRef.value && imageSrc.value && imageRef.value.src !== imageSrc.value) {
    imageRef.value.src = imageSrc.value
  }
}, { deep: true, immediate: true })

// Computed style for the image
const imageStyle = computed(() => {
  const width = props.node.attrs.width
  const height = props.node.attrs.height
  
  if (width && height) {
    return {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: '100%',
      objectFit: 'contain',
    }
  }
  
  return {
    maxWidth: '100%',
    height: 'auto',
  }
})

function onImageLoad() {
  if (imageRef.value) {
    naturalWidth.value = imageRef.value.naturalWidth
    naturalHeight.value = imageRef.value.naturalHeight
    
    // If no width/height set, use natural dimensions but limit to max 800px width
    if (!props.node.attrs.width && !props.node.attrs.height) {
      let width = naturalWidth.value
      let height = naturalHeight.value
      
      // Scale down if too large
      if (width > 800) {
        const scale = 800 / width
        width = 800
        height = height * scale
      }
      
      props.updateAttributes({
        width: Math.round(width),
        height: Math.round(height),
      })
    }
  }
}

function startResize(direction: string, event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  isResizing.value = true
  resizeDirection.value = direction
  startX.value = event.clientX
  startY.value = event.clientY
  
  const currentWidth = props.node.attrs.width || naturalWidth.value
  const currentHeight = props.node.attrs.height || naturalHeight.value
  
  startWidth.value = currentWidth
  startHeight.value = currentHeight
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(event: MouseEvent) {
  if (!isResizing.value || !resizeDirection.value || !imageRef.value) return
  
  const deltaX = event.clientX - startX.value
  const deltaY = event.clientY - startY.value
  
  let newWidth = startWidth.value
  let newHeight = startHeight.value
  
  // Calculate new dimensions based on resize direction
  switch (resizeDirection.value) {
    case 'se': // Southeast (bottom-right)
      newWidth = Math.max(50, startWidth.value + deltaX)
      newHeight = Math.max(50, startHeight.value + deltaY)
      break
    case 'sw': // Southwest (bottom-left)
      newWidth = Math.max(50, startWidth.value - deltaX)
      newHeight = Math.max(50, startHeight.value + deltaY)
      break
    case 'ne': // Northeast (top-right)
      newWidth = Math.max(50, startWidth.value + deltaX)
      newHeight = Math.max(50, startHeight.value - deltaY)
      break
    case 'nw': // Northwest (top-left)
      newWidth = Math.max(50, startWidth.value - deltaX)
      newHeight = Math.max(50, startHeight.value - deltaY)
      break
  }
  
  // Always maintain aspect ratio (unless Alt is held for free resize)
  if (!event.altKey && naturalWidth.value && naturalHeight.value) {
    const aspectRatio = naturalWidth.value / naturalHeight.value
    
    // Use the dimension that changed the most
    const widthChange = Math.abs(newWidth - startWidth.value)
    const heightChange = Math.abs(newHeight - startHeight.value)
    
    if (widthChange > heightChange) {
      // Width changed more, adjust height
      newHeight = newWidth / aspectRatio
    } else {
      // Height changed more, adjust width
      newWidth = newHeight * aspectRatio
    }
  }
  
  // Update attributes
  props.updateAttributes({
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  })
}

function stopResize() {
  isResizing.value = false
  resizeDirection.value = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizable-image-wrapper {
  display: inline-block;
  margin: 1em 0;
  position: relative;
  max-width: 100%;
}

.resizable-image-wrapper.is-selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}

.resizable-image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.resizable-image {
  display: block;
  border-radius: 4px;
  user-select: none;
  object-fit: contain;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: rgb(var(--v-theme-primary));
  border: 2px solid white;
  border-radius: 50%;
  cursor: nwse-resize;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.resize-handle-se {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

.resize-handle-sw {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.resize-handle-ne {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.resize-handle-nw {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.resize-handle:hover {
  background: rgb(var(--v-theme-primary));
  transform: scale(1.2);
}
</style>

