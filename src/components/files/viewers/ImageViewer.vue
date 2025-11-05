<template>
  <div 
    class="image-viewer"
    @mousemove="handleMouseMoveForControls"
  >
    <div
      ref="imageContainer"
      class="image-viewer__container"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <img
        ref="imageEl"
        :src="url"
        :style="imageStyle"
        class="image-viewer__image"
        @load="onImageLoad"
      />
      
      <!-- Grid Overlay -->
      <div
        v-if="showGrid"
        class="image-viewer__grid-overlay"
        :style="gridOverlayStyle"
      />
    </div>

    <!-- Zoom Controls -->
    <div 
      class="image-viewer__controls"
      :class="{ 'image-viewer__controls--hidden': !showControls }"
    >
      <v-btn
        icon="mdi-minus"
        size="small"
        @click="zoomOut"
        :disabled="scale <= 0.5"
      />
      <v-chip>{{ Math.round(scale * 100) }}%</v-chip>
      <v-btn
        icon="mdi-plus"
        size="small"
        @click="zoomIn"
        :disabled="scale >= 5"
      />
      <v-btn
        icon="mdi-fit-to-screen"
        size="small"
        @click="resetZoom"
      />
      <v-btn
        icon="mdi-rotate-right"
        size="small"
        @click="rotate"
      />
      
      <v-divider vertical class="mx-2" />
      
      <!-- Grid Toggle -->
      <v-btn
        :icon="showGrid ? 'mdi-grid' : 'mdi-grid-off'"
        size="small"
        :color="showGrid ? 'primary' : undefined"
        @click="toggleGrid"
      />
      
      <!-- Grid Settings Menu -->
      <v-menu v-if="showGrid" location="top">
        <template #activator="{ props: menuProps }">
          <v-btn
            icon="mdi-cog"
            size="small"
            v-bind="menuProps"
          />
        </template>
        <v-card min-width="300">
          <v-card-text>
            <div class="mb-4">
              <label class="text-caption text-medium-emphasis">Grid Size: {{ gridSize }}vh</label>
              <v-slider
                v-model="gridSize"
                :min="5"
                :max="100"
                :step="1"
                thumb-label
              />
            </div>
            
            <div class="mb-4">
              <label class="text-caption text-medium-emphasis">Grid Opacity: {{ Math.round(gridOpacity * 100) }}%</label>
              <v-slider
                v-model="gridOpacity"
                :min="0.1"
                :max="1"
                :step="0.05"
                thumb-label
              />
            </div>
            
            <div class="mb-2">
              <label class="text-caption text-medium-emphasis">Grid Color</label>
              <div class="d-flex gap-2 mt-2">
                <v-btn
                  size="small"
                  :color="gridColor === '#ffffff' ? 'primary' : undefined"
                  @click="gridColor = '#ffffff'"
                  variant="tonal"
                >
                  White
                </v-btn>
                <v-btn
                  size="small"
                  :color="gridColor === '#000000' ? 'primary' : undefined"
                  @click="gridColor = '#000000'"
                  variant="tonal"
                >
                  Black
                </v-btn>
                <v-btn
                  size="small"
                  :color="gridColor === '#ff0000' ? 'primary' : undefined"
                  @click="gridColor = '#ff0000'"
                  variant="tonal"
                >
                  Red
                </v-btn>
                <v-btn
                  size="small"
                  :color="gridColor === '#00ff00' ? 'primary' : undefined"
                  @click="gridColor = '#00ff00'"
                  variant="tonal"
                >
                  Green
                </v-btn>
                <v-btn
                  size="small"
                  :color="gridColor === '#0000ff' ? 'primary' : undefined"
                  @click="gridColor = '#0000ff'"
                  variant="tonal"
                >
                  Blue
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
      
      <v-divider vertical class="mx-2" />
      
      <v-btn
        icon="mdi-download"
        size="small"
        @click="download"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  url: string
  fileName: string
  autoHideControls?: boolean
  autoHideDelay?: number
  showGridOverlay?: boolean
  gridOverlaySize?: number // In vh units for viewport-relative sizing
  gridOverlayColor?: string
  gridOverlayOpacity?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoHideControls: true,
  autoHideDelay: 2000,
  showGridOverlay: false,
  gridOverlaySize: 20, // 20vh = good default for D&D grids
  gridOverlayColor: '#000000',
  gridOverlayOpacity: 0.7
})

const imageContainer = ref<HTMLElement>()
const imageEl = ref<HTMLImageElement>()
const scale = ref(1)
const rotation = ref(0)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const imageLoaded = ref(false)
const showControls = ref(true)
const hideControlsTimer = ref<number | null>(null)

// Grid overlay state
const showGrid = ref(props.showGridOverlay)
const gridSize = ref(props.gridOverlaySize) // Now represents vh units
const gridColor = ref(props.gridOverlayColor)
const gridOpacity = ref(props.gridOverlayOpacity)

const imageStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value}) rotate(${rotation.value}deg)`,
  cursor: isDragging.value ? 'grabbing' : (scale.value > 1 ? 'grab' : 'default'),
}))

const gridOverlayStyle = computed(() => {
  // Create a filter to change the grid color
  let filter = ''
  
  // Convert black grid to the desired color using CSS filters
  if (gridColor.value === '#ffffff') {
    filter = 'invert(1)' // White
  } else if (gridColor.value === '#000000') {
    filter = 'invert(0)' // Black (original)
  } else if (gridColor.value === '#ff0000') {
    filter = 'invert(1) sepia(1) saturate(5) hue-rotate(0deg)' // Red
  } else if (gridColor.value === '#00ff00') {
    filter = 'invert(1) sepia(1) saturate(5) hue-rotate(90deg)' // Green
  } else if (gridColor.value === '#0000ff') {
    filter = 'invert(1) sepia(1) saturate(5) hue-rotate(180deg)' // Blue
  }
  
  return {
    backgroundImage: 'url(/grid-png-43559.png)',
    backgroundSize: `${gridSize.value}vh ${gridSize.value}vh`,
    backgroundRepeat: 'repeat',
    backgroundPosition: 'center',
    opacity: gridOpacity.value,
    filter,
    pointerEvents: 'none' as const
  }
})

const onImageLoad = () => {
  imageLoaded.value = true
}

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 5)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

const resetZoom = () => {
  scale.value = 1
  rotation.value = 0
  position.value = { x: 0, y: 0 }
}

const rotate = () => {
  rotation.value = (rotation.value + 90) % 360
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const handleWheel = (e: WheelEvent) => {
  const delta = e.deltaY * -0.001
  const newScale = Math.max(0.5, Math.min(5, scale.value + delta))
  scale.value = newScale
}

const handleMouseDown = (e: MouseEvent) => {
  if (scale.value <= 1) return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  position.value = {
    x: e.clientX - dragStart.value.x,
    y: e.clientY - dragStart.value.y,
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseMoveForControls = () => {
  if (!props.autoHideControls) return
  
  showControls.value = true
  
  if (hideControlsTimer.value !== null) {
    clearTimeout(hideControlsTimer.value)
  }
  
  hideControlsTimer.value = window.setTimeout(() => {
    showControls.value = false
  }, props.autoHideDelay)
}

const download = () => {
  const link = document.createElement('a')
  link.href = props.url
  link.download = props.fileName
  link.click()
}

// Keyboard shortcuts
const handleKeyPress = (e: KeyboardEvent) => {
  switch (e.key) {
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
      zoomOut()
      break
    case '0':
      resetZoom()
      break
    case 'r':
      rotate()
      break
    case 'g':
      toggleGrid()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  
  if (props.autoHideControls) {
    hideControlsTimer.value = window.setTimeout(() => {
      showControls.value = false
    }, props.autoHideDelay)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  
  if (hideControlsTimer.value !== null) {
    clearTimeout(hideControlsTimer.value)
  }
})
</script>

<style scoped>
.image-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
}

.image-viewer__container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-viewer__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease-out;
  user-select: none;
}

.image-viewer__controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 16px;

  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.image-viewer__controls--hidden {
  opacity: 0;
  transform: translateY(100%);
  pointer-events: none;
}

.image-viewer__grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}
</style>

