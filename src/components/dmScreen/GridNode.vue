<template>
  <!-- VueFlow Background component - properly synced with pan/zoom -->
  <Background
    :variant="BackgroundVariant.Lines"
    :gap="gridSize"
    :size="lineWidth"
    :color="gridColorWithOpacity"
    :offset="gridOffset"
    class="vtt-grid-background"
  />
  
  <!-- Major grid lines (second background layer) -->
  <Background
    v-if="showMajorGridLines"
    :variant="BackgroundVariant.Lines"
    :gap="majorGridSize"
    :size="majorLineWidth"
    :color="majorColorWithOpacity"
    :offset="gridOffset"
    class="vtt-major-grid-background"
  />
  
  <!-- Scale indicator (fixed to screen) -->
  <div v-if="showScaleIndicator" class="scale-indicator">
    <div class="scale-bar">
      <div class="scale-line" :style="scaleLineStyle" />
      <span class="scale-label">{{ feetPerSquare }} ft</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { Background, BackgroundVariant } from '@vue-flow/background'

interface Props {
  gridSize?: number
  gridColor?: string
  gridOpacity?: number
  lineWidth?: number
  offsetX?: number
  offsetY?: number
  showMajorGridLines?: boolean
  majorGridInterval?: number
  majorGridColor?: string
  feetPerSquare?: number
  showScaleIndicator?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  gridSize: 50,
  gridColor: '#ffffff',
  gridOpacity: 0.6,
  lineWidth: 1,
  offsetX: 0,
  offsetY: 0,
  showMajorGridLines: true,
  majorGridInterval: 5,
  majorGridColor: '#ffffff',
  feetPerSquare: 5,
  showScaleIndicator: true,
})

const { viewport } = useVueFlow()

// Grid offset for alignment
const gridOffset = computed(() => [props.offsetX, props.offsetY] as [number, number])

// Major grid size
const majorGridSize = computed(() => props.gridSize * props.majorGridInterval)
const majorLineWidth = computed(() => Math.max(2, props.lineWidth * 2))

// Convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // Handle shorthand hex
  const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)
  if (shortResult) {
    const r = parseInt(shortResult[1] + shortResult[1], 16)
    const g = parseInt(shortResult[2] + shortResult[2], 16)
    const b = parseInt(shortResult[3] + shortResult[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(255, 255, 255, ${alpha})`
}

// Colors with opacity
const gridColorWithOpacity = computed(() => hexToRgba(props.gridColor, props.gridOpacity))
const majorColorWithOpacity = computed(() => hexToRgba(props.majorGridColor || props.gridColor, Math.min(1, props.gridOpacity * 1.3)))

// Scale indicator width based on zoom
const scaledGridSize = computed(() => props.gridSize * (viewport.value.zoom || 1))
const scaleLineStyle = computed(() => ({
  width: `${scaledGridSize.value}px`,
  background: props.gridColor,
}))
</script>

<style scoped>
/* Grid on TOP of everything - high z-index */
.vtt-grid-background {
  z-index: 9999 !important;
  pointer-events: none !important;
}

.vtt-major-grid-background {
  z-index: 9999 !important;
  pointer-events: none !important;
}

/* Override VueFlow Background default styles */
:deep(.vue-flow__background) {
  z-index: 9999 !important;
  pointer-events: none !important;
}

.scale-indicator {
  position: fixed;
  bottom: 80px;
  right: 20px;
  pointer-events: none;
  z-index: 10000;
}

.scale-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.scale-line {
  height: 4px;
  border-left: 2px solid white;
  border-right: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: width 0.1s ease;
}

.scale-label {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.7);
  padding: 3px 10px;
  border-radius: 6px;
}
</style>
