<template>
  <Panel position="top-left" class="grid-panel">
    <svg 
      class="grid-svg" 
      :width="viewportWidth"
      :height="viewportHeight"
      :style="gridTransformStyle"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern 
          :id="patternId" 
          :width="scaledGridSize" 
          :height="scaledGridSize" 
          patternUnits="userSpaceOnUse"
          :patternTransform="`translate(${patternOffset.x}, ${patternOffset.y})`"
        >
          <!-- Horizontal line -->
          <line 
            x1="0" 
            :y1="scaledGridSize" 
            :x2="scaledGridSize" 
            :y2="scaledGridSize" 
            :stroke="gridColor" 
            :stroke-width="lineWidth"
          />
          <!-- Vertical line -->
          <line 
            :x1="scaledGridSize" 
            y1="0" 
            :x2="scaledGridSize" 
            :y2="scaledGridSize" 
            :stroke="gridColor" 
            :stroke-width="lineWidth"
          />
        </pattern>
      </defs>
      <rect 
        width="100%" 
        height="100%" 
        :fill="`url(#${patternId})`"
        :opacity="gridOpacity"
      />
    </svg>
  </Panel>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Panel, useVueFlow } from '@vue-flow/core'

interface Props {
  gridSize?: number
  gridColor?: string
  gridOpacity?: number
  lineWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  gridSize: 20,
  gridColor: 'rgba(255, 255, 255, 0.3)',
  gridOpacity: 0.3,
  lineWidth: 1,
})

const { viewport, dimensions } = useVueFlow()

// Unique ID for the SVG pattern to avoid conflicts
const patternId = computed(() => `grid-pattern-${Math.random().toString(36).substr(2, 9)}`)

// Viewport dimensions
const viewportWidth = computed(() => dimensions.value.width || 2000)
const viewportHeight = computed(() => dimensions.value.height || 2000)

// Scale grid size based on zoom
const scaledGridSize = computed(() => {
  return props.gridSize * (viewport.value.zoom || 1)
})

// Calculate pattern offset to align grid with viewport pan
const patternOffset = computed(() => {
  const zoom = viewport.value.zoom || 1
  const x = (viewport.value.x || 0) * zoom % scaledGridSize.value
  const y = (viewport.value.y || 0) * zoom % scaledGridSize.value
  return { x, y }
})

// Transform style for the grid
const gridTransformStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  pointerEvents: 'none' as const,
  zIndex: 9999,
}))
</script>

<style scoped>
.grid-panel {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  pointer-events: none !important;
  z-index: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.grid-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
