<template>
  <div 
    class="grid-overlay"
    :style="gridStyle"
  >
    <!-- SVG pattern for the grid -->
    <svg 
      class="grid-svg" 
      width="100%" 
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern 
          :id="patternId" 
          :width="gridSize" 
          :height="gridSize" 
          patternUnits="userSpaceOnUse"
        >
          <!-- Horizontal line -->
          <line 
            x1="0" 
            :y1="gridSize" 
            :x2="gridSize" 
            :y2="gridSize" 
            :stroke="gridColor" 
            :stroke-width="lineWidth"
          />
          <!-- Vertical line -->
          <line 
            :x1="gridSize" 
            y1="0" 
            :x2="gridSize" 
            :y2="gridSize" 
            :stroke="gridColor" 
            :stroke-width="lineWidth"
          />
        </pattern>
      </defs>
      <rect 
        width="100%" 
        height="100%" 
        :fill="`url(#${patternId})`"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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

// Unique ID for the SVG pattern to avoid conflicts
const patternId = computed(() => `grid-pattern-${Math.random().toString(36).substr(2, 9)}`)

const gridStyle = computed(() => ({
  opacity: props.gridOpacity,
}))
</script>

<style scoped>
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.grid-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>

