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
      
      <!-- Combat Lock Toggle -->
      <v-tooltip :text="combatLock ? 'Combat Lock: ON (Press L to unlock)' : 'Combat Lock: OFF (Press L to lock)'" location="top">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            :icon="combatLock ? 'mdi-lock' : 'mdi-lock-open'"
            size="small"
            :color="combatLock ? 'error' : 'success'"
            @click="toggleCombatLock"
            v-bind="tooltipProps"
          />
        </template>
      </v-tooltip>
      
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
      
      <!-- Quick Load Last State -->
      <v-tooltip text="Load Last Saved State" location="top">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            icon="mdi-restore"
            size="small"
            color="info"
            @click="loadLastState"
            :disabled="stateHistory.length === 0"
            v-bind="tooltipProps"
          />
        </template>
      </v-tooltip>
      
      <!-- State History Menu -->
      <v-menu location="top" :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <v-btn
            icon="mdi-history"
            size="small"
            v-bind="menuProps"
            :disabled="stateHistory.length === 0"
          />
        </template>
        <v-card min-width="400" max-height="500">
          <v-card-title class="d-flex align-center">
            <span>State History</span>
            <v-spacer />
            <v-chip size="small">{{ stateHistory.length }} saved</v-chip>
            <v-btn
              icon="mdi-delete-sweep"
              size="small"
              color="error"
              variant="text"
              @click="clearStateHistory"
              class="ml-2"
            />
          </v-card-title>
          <v-divider />
          <v-list>
            <v-list-item
              v-for="(state, index) in stateHistory"
              :key="state.timestamp"
              class="state-history-item"
            >
              <template #prepend>
                <v-icon 
                  :icon="index === 0 ? 'mdi-star' : 'mdi-bookmark'"
                  :color="index === 0 ? 'warning' : 'grey'"
                />
              </template>
              <div @click="loadStateFromHistory(state)" class="flex-grow-1" style="cursor: pointer;">
                <v-list-item-title>
                  {{ formatTimestamp(state.timestamp) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Zoom: {{ Math.round(state.scale * 100) }}% | 
                  Rotation: {{ state.rotation }}° | 
                  Grid: {{ state.showGrid ? `${state.gridSize}vh` : 'OFF' }}
                </v-list-item-subtitle>
              </div>
              <template #append>
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click.stop="deleteState(index)"
                />
              </template>
            </v-list-item>
          </v-list>
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
import { useToast } from 'vue-toastification'

// State interface (exported for external use)
export interface ViewerState {
  timestamp: number
  scale: number
  position: { x: number; y: number }
  rotation: number
  showGrid: boolean
  gridSize: number
  gridColor: string
  gridOpacity: number
}

interface Props {
  url: string
  fileName: string
  autoHideControls?: boolean
  autoHideDelay?: number
  showGridOverlay?: boolean
  gridOverlaySize?: number // In vh units for viewport-relative sizing
  gridOverlayColor?: string
  gridOverlayOpacity?: number
  initialState?: ViewerState | null
}

const props = withDefaults(defineProps<Props>(), {
  autoHideControls: true,
  autoHideDelay: 2000,
  showGridOverlay: false,
  gridOverlaySize: 50, // 50vh = good default for D&D grids
  gridOverlayColor: '#000000',
  gridOverlayOpacity: 0.2, // 20% opacity
  initialState: null
})

const toast = useToast()

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

// Combat lock state
const combatLock = ref(false)
const lastToastTime = ref(0)
const toastDebounceMs = 1000 // Only show toast once per second

// Grid overlay state
const showGrid = ref(props.showGridOverlay)
const gridSize = ref(props.gridOverlaySize) // Now represents vh units
const gridColor = ref(props.gridOverlayColor)
const gridOpacity = ref(props.gridOverlayOpacity)

// State history
const stateHistory = ref<ViewerState[]>([])
const maxHistorySize = 10 // Keep last 10 states

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

// State management functions
const getStorageKey = () => `viewer-state-${props.fileName}`

const getViewerJsonSettings = (): ViewerState => {
  return {
    timestamp: Date.now(),
    scale: scale.value,
    position: { ...position.value },
    rotation: rotation.value,
    showGrid: showGrid.value,
    gridSize: gridSize.value,
    gridColor: gridColor.value,
    gridOpacity: gridOpacity.value
  }
}

const areStatesEqual = (state1: ViewerState, state2: ViewerState): boolean => {
  // Compare all properties except timestamp
  return (
    state1.scale === state2.scale &&
    state1.position.x === state2.position.x &&
    state1.position.y === state2.position.y &&
    state1.rotation === state2.rotation &&
    state1.showGrid === state2.showGrid &&
    state1.gridSize === state2.gridSize &&
    state1.gridColor === state2.gridColor &&
    state1.gridOpacity === state2.gridOpacity
  )
}

const loadStateHistory = () => {
  try {
    const key = getStorageKey()
    const stored = localStorage.getItem(key)
    if (stored) {
      stateHistory.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load state history:', error)
    stateHistory.value = []
  }
}

const saveStateToHistory = () => {
  const currentState = getViewerJsonSettings()
  
  // Check if current state is identical to the last saved state
  if (stateHistory.value.length > 0) {
    const lastState = stateHistory.value[0]
    if (areStatesEqual(currentState, lastState)) {
      toast.info('State unchanged, not saving duplicate', {
        timeout: 1500
      })
      return
    }
  }
  
  // Add to history
  stateHistory.value.unshift(currentState)
  
  // Keep only last N states
  if (stateHistory.value.length > maxHistorySize) {
    stateHistory.value = stateHistory.value.slice(0, maxHistorySize)
  }
  
  // Save to localStorage
  try {
    const key = getStorageKey()
    localStorage.setItem(key, JSON.stringify(stateHistory.value))
    toast.success('Viewer state saved', {
      timeout: 1500
    })
  } catch (error) {
    console.error('Failed to save state:', error)
    toast.error('Failed to save state')
  }
}

const loadStateFromHistory = (state: ViewerState) => {
  scale.value = state.scale
  position.value = { ...state.position }
  rotation.value = state.rotation
  showGrid.value = state.showGrid
  gridSize.value = state.gridSize
  gridColor.value = state.gridColor
  gridOpacity.value = state.gridOpacity
  
  toast.info('Viewer state restored', {
    timeout: 1500
  })
}

const loadLastState = () => {
  if (stateHistory.value.length > 0) {
    loadStateFromHistory(stateHistory.value[0])
  } else {
    toast.warning('No saved states found')
  }
}

const clearStateHistory = () => {
  stateHistory.value = []
  try {
    const key = getStorageKey()
    localStorage.removeItem(key)
    toast.success('State history cleared', {
      timeout: 1500
    })
  } catch (error) {
    console.error('Failed to clear state history:', error)
    toast.error('Failed to clear history')
  }
}

const deleteState = (index: number) => {
  stateHistory.value.splice(index, 1)
  
  try {
    const key = getStorageKey()
    if (stateHistory.value.length === 0) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, JSON.stringify(stateHistory.value))
    }
    toast.success('State deleted', {
      timeout: 1000
    })
  } catch (error) {
    console.error('Failed to delete state:', error)
    toast.error('Failed to delete state')
  }
}

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

const showCombatLockToast = () => {
  const now = Date.now()
  
  // Debounce: only show toast if enough time has passed since last toast
  if (now - lastToastTime.value < toastDebounceMs) {
    return
  }
  
  lastToastTime.value = now
  toast.warning('Combat Lock is on. Press L to unlock', {
    timeout: 2000
  })
}

const toggleCombatLock = () => {
  combatLock.value = !combatLock.value
  if (combatLock.value) {
    // Save current state when locking
    saveStateToHistory()
    toast.success('🔒 Combat Lock activated & state saved', {
      timeout: 2000
    })
  } else {
    toast.info('🔓 Combat Lock deactivated', {
      timeout: 2000
    })
  }
}

const onImageLoad = () => {
  imageLoaded.value = true
}

const zoomIn = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  scale.value = Math.min(scale.value + 0.25, 5)
}

const zoomOut = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

const resetZoom = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  scale.value = 1
  rotation.value = 0
  position.value = { x: 0, y: 0 }
}

const rotate = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  rotation.value = (rotation.value + 90) % 360
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const panLeft = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  position.value.x += 50
}

const panRight = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  position.value.x -= 50
}

const panUp = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  position.value.y += 50
}

const panDown = () => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  position.value.y -= 50
}

const increaseGridSize = () => {
  gridSize.value = Math.min(gridSize.value + 5, 100)
}

const decreaseGridSize = () => {
  gridSize.value = Math.max(gridSize.value - 5, 5)
}

const handleWheel = (e: WheelEvent) => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
  const delta = e.deltaY * -0.001
  const newScale = Math.max(0.5, Math.min(5, scale.value + delta))
  scale.value = newScale
}

const handleMouseDown = (e: MouseEvent) => {
  if (combatLock.value) {
    showCombatLockToast()
    return
  }
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
  switch (e.key.toLowerCase()) {
    // Combat Lock toggle (always works)
    case 'l':
      toggleCombatLock()
      break
    
    // Block escape when combat locked
    case 'escape':
      if (combatLock.value) {
        showCombatLockToast()
        e.preventDefault()
        e.stopPropagation()
      }
      break
    
    // Zoom controls
    case ']':
      zoomIn()
      break
    case '[':
      zoomOut()
      break
    case 'backspace':
      resetZoom()
      e.preventDefault() // Prevent browser back navigation
      break
    
    // Grid size controls
    case '+':
    case '=':
      increaseGridSize()
      break
    case '-':
    case '_':
      decreaseGridSize()
      break
    
    // Rotation
    case 'r':
      rotate()
      break
    
    // Grid toggle
    case 'g':
      toggleGrid()
      break
    
    // Panning with WASD
    case 'w':
      panUp()
      break
    case 'a':
      panLeft()
      break
    case 's':
      panDown()
      break
    case 'd':
      panRight()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  
  // Load state history from localStorage
  loadStateHistory()
  
  // Apply initial state if provided
  if (props.initialState) {
    loadStateFromHistory(props.initialState)
  }
  
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

.state-history-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.state-history-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>

