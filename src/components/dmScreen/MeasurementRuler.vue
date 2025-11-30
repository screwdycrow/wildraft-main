<template>
  <div 
    class="measurement-ruler-container"
    :class="{ active: isActive }"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <!-- All measurement lines (stacked path) -->
    <svg 
      v-if="allLines.length > 0 || isDrawing"
      class="measurement-svg"
    >
      <!-- Completed measurement lines (path segments) -->
      <g v-for="(line, idx) in completedLines" :key="line.id">
        <!-- Trail glow -->
        <line
          :x1="toScreenX(line.startX)"
          :y1="toScreenY(line.startY)"
          :x2="toScreenX(line.endX)"
          :y2="toScreenY(line.endY)"
          stroke="rgba(255, 212, 59, 0.3)"
          stroke-width="14"
          stroke-linecap="round"
        />
        <!-- Main line -->
        <line
          :x1="toScreenX(line.startX)"
          :y1="toScreenY(line.startY)"
          :x2="toScreenX(line.endX)"
          :y2="toScreenY(line.endY)"
          stroke="#fbbf24"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="10,5"
        />
        <!-- Waypoint circle -->
        <circle
          :cx="toScreenX(line.startX)"
          :cy="toScreenY(line.startY)"
          r="8"
          fill="#fbbf24"
          stroke="white"
          stroke-width="2"
        />
        <!-- Segment number -->
        <g :transform="`translate(${toScreenX(line.startX)}, ${toScreenY(line.startY) - 18})`">
          <circle r="10" fill="rgba(0,0,0,0.8)" stroke="#fbbf24" stroke-width="1" />
          <text x="0" y="4" text-anchor="middle" fill="white" font-size="10" font-weight="bold">{{ idx + 1 }}</text>
        </g>
      </g>
      
      <!-- Current line being drawn -->
      <g v-if="currentLine">
        <!-- Trail glow -->
        <line
          :x1="toScreenX(currentLine.startX)"
          :y1="toScreenY(currentLine.startY)"
          :x2="toScreenX(currentLine.endX)"
          :y2="toScreenY(currentLine.endY)"
          :stroke="lineColor"
          stroke-width="16"
          stroke-linecap="round"
          opacity="0.3"
        />
        <!-- Main line -->
        <line
          :x1="toScreenX(currentLine.startX)"
          :y1="toScreenY(currentLine.startY)"
          :x2="toScreenX(currentLine.endX)"
          :y2="toScreenY(currentLine.endY)"
          :stroke="lineColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-dasharray="12,6"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="18" dur="0.5s" repeatCount="indefinite" />
        </line>
        <!-- Start point -->
        <circle
          :cx="toScreenX(currentLine.startX)"
          :cy="toScreenY(currentLine.startY)"
          r="10"
          :fill="lineColor"
          stroke="white"
          stroke-width="3"
        />
        <!-- End point -->
        <circle
          :cx="toScreenX(currentLine.endX)"
          :cy="toScreenY(currentLine.endY)"
          r="10"
          :fill="lineColor"
          stroke="white"
          stroke-width="3"
        />
        <!-- Grid squares indicator -->
        <g v-if="showPathSquares && pathSquares.length > 0">
          <rect
            v-for="(square, idx) in pathSquares"
            :key="idx"
            :x="toScreenX(square.x)"
            :y="toScreenY(square.y)"
            :width="gridSize * zoom"
            :height="gridSize * zoom"
            :fill="lineColor"
            fill-opacity="0.15"
            :stroke="lineColor"
            stroke-width="1"
            stroke-opacity="0.4"
          />
        </g>
        <!-- Current segment distance label -->
        <g v-if="currentMeasurement && currentMeasurement.squares > 0" :transform="`translate(${(toScreenX(currentLine.startX) + toScreenX(currentLine.endX)) / 2}, ${(toScreenY(currentLine.startY) + toScreenY(currentLine.endY)) / 2 - 25})`">
          <rect x="-45" y="-16" width="90" height="32" rx="8" fill="rgba(0, 0, 0, 0.9)" :stroke="lineColor" stroke-width="2" />
          <text x="0" y="6" text-anchor="middle" :fill="lineColor" font-size="16" font-weight="bold" font-family="JetBrains Mono, monospace">
            {{ currentMeasurement.feet }} ft
          </text>
        </g>
      </g>
      
      <!-- Final waypoint for completed lines -->
      <g v-if="completedLines.length > 0 && !isDrawing">
        <circle
          :cx="toScreenX(completedLines[completedLines.length - 1].endX)"
          :cy="toScreenY(completedLines[completedLines.length - 1].endY)"
          r="8"
          fill="#fbbf24"
          stroke="white"
          stroke-width="2"
        />
      </g>
      
      <!-- Total distance display -->
      <g v-if="totalDistance.feet > 0" :transform="`translate(${totalLabelPosition.x}, ${totalLabelPosition.y})`">
        <rect x="-55" y="-18" width="110" height="36" rx="8" fill="rgba(34, 197, 94, 0.95)" stroke="white" stroke-width="2" />
        <text x="0" y="2" text-anchor="middle" fill="white" font-size="11" font-weight="bold">TOTAL</text>
        <text x="0" y="16" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="JetBrains Mono, monospace">
          {{ totalDistance.feet }} ft
        </text>
      </g>
    </svg>
    
    <!-- Instructions overlay -->
    <div v-if="isActive && !isDrawing && completedLines.length === 0" class="measurement-instructions">
      <v-icon icon="mdi-ruler" size="small" class="mr-2" />
      Click and drag to measure. Double-click to add waypoints. ESC to clear.
    </div>
    
    <!-- Path info when we have segments -->
    <div v-if="isActive && completedLines.length > 0" class="measurement-path-info">
      <span class="path-segments">{{ completedLines.length }} segment{{ completedLines.length > 1 ? 's' : '' }}</span>
      <span class="path-total">Total: {{ totalDistance.feet }} ft</span>
      <v-btn size="x-small" variant="text" color="error" @click="clearAll" class="ml-2">
        <v-icon size="small">mdi-close</v-icon> Clear
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { calculateDistanceFeet, type MeasurementLine } from '@/types/dmScreen.types'

interface Props {
  isActive: boolean
  gridSize: number
  feetPerSquare?: number
  diagonalRule?: 'standard' | 'alternating' | 'euclidean'
  lineColor?: string
  showPathSquares?: boolean
  sendToPortal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  feetPerSquare: 5,
  diagonalRule: 'standard',
  lineColor: '#ffd43b',
  showPathSquares: true,
  sendToPortal: false,
})

const emit = defineEmits<{
  'measurement-start': []
  'measurement-end': [result: { feet: number; squares: number; lines: MeasurementLine[] }]
  'measurement-clear': []
  'send-to-portal': [data: { command: string; lines: MeasurementLine[]; totalFeet: number }]
}>()

const { project, viewport } = useVueFlow()

// State
const isDrawing = ref(false)
const currentLine = ref<MeasurementLine | null>(null)
const completedLines = ref<MeasurementLine[]>([])

// Computed
const zoom = computed(() => viewport.value.zoom || 1)

const allLines = computed(() => {
  const lines = [...completedLines.value]
  if (currentLine.value) lines.push(currentLine.value)
  return lines
})

// Convert flow to screen coordinates
function toScreenX(flowX: number): number {
  return flowX * (viewport.value.zoom || 1) + (viewport.value.x || 0)
}

function toScreenY(flowY: number): number {
  return flowY * (viewport.value.zoom || 1) + (viewport.value.y || 0)
}

// Current segment measurement
const currentMeasurement = computed(() => {
  if (!currentLine.value) return null
  return calculateDistanceFeet(
    currentLine.value.startX, currentLine.value.startY,
    currentLine.value.endX, currentLine.value.endY,
    props.gridSize, props.feetPerSquare, props.diagonalRule
  )
})

// Total distance across all segments
const totalDistance = computed(() => {
  let totalFeet = 0
  let totalSquares = 0
  
  for (const line of completedLines.value) {
    const dist = calculateDistanceFeet(
      line.startX, line.startY, line.endX, line.endY,
      props.gridSize, props.feetPerSquare, props.diagonalRule
    )
    totalFeet += dist.feet
    totalSquares += dist.squares
  }
  
  if (currentMeasurement.value) {
    totalFeet += currentMeasurement.value.feet
    totalSquares += currentMeasurement.value.squares
  }
  
  return { feet: totalFeet, squares: totalSquares }
})

// Position for total label
const totalLabelPosition = computed(() => {
  if (completedLines.value.length === 0 && !currentLine.value) {
    return { x: 100, y: 50 }
  }
  
  // Position near the end of the path
  const lastLine = currentLine.value || completedLines.value[completedLines.value.length - 1]
  if (!lastLine) return { x: 100, y: 50 }
  
  return {
    x: toScreenX(lastLine.endX) + 30,
    y: toScreenY(lastLine.endY) - 30,
  }
})

// Path squares for current segment
const pathSquares = computed(() => {
  if (!currentLine.value || !props.showPathSquares) return []
  
  const squares: { x: number; y: number }[] = []
  const { startX, startY, endX, endY } = currentLine.value
  const gridSize = props.gridSize
  
  const startCol = Math.floor(startX / gridSize)
  const startRow = Math.floor(startY / gridSize)
  const endCol = Math.floor(endX / gridSize)
  const endRow = Math.floor(endY / gridSize)
  
  const dx = Math.abs(endCol - startCol)
  const dy = Math.abs(endRow - startRow)
  const sx = startCol < endCol ? 1 : -1
  const sy = startRow < endRow ? 1 : -1
  let err = dx - dy
  let x = startCol
  let y = startRow
  
  while (true) {
    squares.push({ x: x * gridSize, y: y * gridSize })
    if (x === endCol && y === endRow) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x += sx }
    if (e2 < dx) { err += dx; y += sy }
  }
  
  return squares
})

// Screen to flow conversion
function screenToFlow(clientX: number, clientY: number): { x: number; y: number } {
  const container = document.querySelector('.measurement-ruler-container')
  if (!container) return { x: clientX, y: clientY }
  
  const rect = container.getBoundingClientRect()
  return project({ x: clientX - rect.left, y: clientY - rect.top })
}

// Snap to grid center
function snapToGridCenter(x: number, y: number): { x: number; y: number } {
  const col = Math.floor(x / props.gridSize)
  const row = Math.floor(y / props.gridSize)
  return {
    x: col * props.gridSize + props.gridSize / 2,
    y: row * props.gridSize + props.gridSize / 2,
  }
}

// Mouse handlers
function handleMouseDown(event: MouseEvent) {
  if (!props.isActive) return
  if (event.button !== 0) return
  
  event.preventDefault()
  event.stopPropagation()
  
  const flowPos = screenToFlow(event.clientX, event.clientY)
  
  // If we have completed lines, start from the last end point
  let startPos: { x: number; y: number }
  if (completedLines.value.length > 0) {
    const lastLine = completedLines.value[completedLines.value.length - 1]
    startPos = { x: lastLine.endX, y: lastLine.endY }
  } else {
    startPos = snapToGridCenter(flowPos.x, flowPos.y)
  }
  
  isDrawing.value = true
  currentLine.value = {
    id: `measurement-${Date.now()}`,
    startX: startPos.x,
    startY: startPos.y,
    endX: startPos.x,
    endY: startPos.y,
  }
  
  emit('measurement-start')
}

function handleMouseMove(event: MouseEvent) {
  if (!isDrawing.value || !currentLine.value) return
  
  const flowPos = screenToFlow(event.clientX, event.clientY)
  const snapped = snapToGridCenter(flowPos.x, flowPos.y)
  
  currentLine.value = {
    ...currentLine.value,
    endX: snapped.x,
    endY: snapped.y,
  }
}

function handleMouseUp() {
  if (!isDrawing.value || !currentLine.value) return
  
  isDrawing.value = false
  
  // Only add segment if it has actual distance
  if (currentMeasurement.value && currentMeasurement.value.squares > 0) {
    completedLines.value.push({ ...currentLine.value })
    
    // Send to portal if enabled
    if (props.sendToPortal) {
      sendMeasurementsToPortal()
    }
  }
  
  currentLine.value = null
  
  // Emit with all lines
  if (completedLines.value.length > 0) {
    emit('measurement-end', {
      feet: totalDistance.value.feet,
      squares: totalDistance.value.squares,
      lines: [...completedLines.value],
    })
  }
}

// Clear all measurements
function clearAll() {
  completedLines.value = []
  currentLine.value = null
  isDrawing.value = false
  emit('measurement-clear')
  
  // Send clear to portal
  if (props.sendToPortal) {
    sendClearToPortal()
  }
}

// Send measurements to portal
// Also sends collaborative update so other DM screens can see it
async function sendMeasurementsToPortal() {
  try {
    const { usePortalSocket } = await import('@/composables/usePortalSocket')
    const { sendPortalViewUpdate, sendCollaborativeUpdate } = usePortalSocket()
    
    const payload = {
      command: 'draw-measurements',
      lines: completedLines.value,
      totalFeet: totalDistance.value.feet,
    }
    
    // Send to portal viewers
    sendPortalViewUpdate(payload)
    // Send to other DM screens (collaborative)
    sendCollaborativeUpdate(payload)
  } catch (error) {
    // Portal might not be active
  }
}

// Send clear measurements to portal
// Also sends collaborative update so other DM screens can see it
async function sendClearToPortal() {
  try {
    const { usePortalSocket } = await import('@/composables/usePortalSocket')
    const { sendPortalViewUpdate, sendCollaborativeUpdate } = usePortalSocket()
    
    const payload = {
      command: 'clear-measurements',
    }
    
    // Send to portal viewers
    sendPortalViewUpdate(payload)
    // Send to other DM screens (collaborative)
    sendCollaborativeUpdate(payload)
  } catch (error) {
    // Portal might not be active
  }
}

// Keyboard handler for ESC
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.isActive) {
    clearAll()
  }
}

// Clear on deactivation
watch(() => props.isActive, (active) => {
  if (!active) {
    clearAll()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  clearMeasurements: clearAll,
  getLines: () => completedLines.value,
  getTotalDistance: () => totalDistance.value,
})
</script>

<style scoped>
.measurement-ruler-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9997;
  pointer-events: none;
}

.measurement-ruler-container.active {
  pointer-events: auto !important;
  cursor: crosshair !important;
}

.measurement-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.measurement-instructions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  border: 2px solid rgba(255, 212, 59, 0.5);
  border-radius: 12px;
  padding: 16px 24px;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  pointer-events: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.measurement-path-info {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(34, 197, 94, 0.6);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
  font-size: 13px;
  pointer-events: auto;
}

.path-segments {
  color: rgba(255, 255, 255, 0.7);
}

.path-total {
  font-weight: bold;
  color: #22c55e;
  font-family: 'JetBrains Mono', monospace;
}
</style>
