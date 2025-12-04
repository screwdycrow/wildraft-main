<template>
  <div class="vtt-toolbar">
    <div class="toolbar-group">
      <v-tooltip location="top" text="Select & Move (V)">
        <template #activator="{ props: tooltipProps }">
          <button 
            v-bind="tooltipProps"
            class="tool-btn"
            :class="{ 'tool-btn--active': currentTool === 'select' }"
            @click="selectTool('select')"
          >
            <v-icon size="18">mdi-cursor-default</v-icon>
          </button>
        </template>
      </v-tooltip>
      
      <v-tooltip location="top" text="Measure Distance (M)">
        <template #activator="{ props: tooltipProps }">
          <button 
            v-bind="tooltipProps"
            class="tool-btn"
            :class="{ 'tool-btn--active': currentTool === 'measure' }"
            @click="selectTool('measure')"
          >
            <v-icon size="18">mdi-ruler</v-icon>
          </button>
        </template>
      </v-tooltip>
      
      <v-tooltip location="top" text="Ping Location (P)">
        <template #activator="{ props: tooltipProps }">
          <button 
            v-bind="tooltipProps"
            class="tool-btn"
            :class="{ 'tool-btn--active': currentTool === 'ping' }"
            @click="selectTool('ping')"
          >
            <v-icon size="18">mdi-crosshairs-gps</v-icon>
          </button>
        </template>
      </v-tooltip>
    </div>
    
    <div class="toolbar-divider" />
    
    <!-- Measurement display when measuring -->
    <transition name="fade">
      <div v-if="currentTool === 'measure' && lastMeasurement" class="measurement-display">
        <span class="measurement-value">{{ lastMeasurement.feet }} ft</span>
        <span class="measurement-squares">({{ lastMeasurement.squares }} sq)</span>
      </div>
    </transition>
    
    <!-- Diagonal rule selector (shown when measure tool is active) -->
    <transition name="fade">
      <div v-if="currentTool === 'measure'" class="diagonal-rule-selector">
        <v-tooltip location="top" :text="diagonalRuleTooltip">
          <template #activator="{ props: tooltipProps }">
            <button 
              v-bind="tooltipProps"
              class="rule-btn"
              @click="cycleDiagonalRule"
            >
              <v-icon size="14" class="mr-1">mdi-vector-line</v-icon>
              <span>{{ diagonalRuleLabel }}</span>
            </button>
          </template>
        </v-tooltip>
      </div>
    </transition>
    
    <div class="toolbar-divider" />
    
    <!-- Grid toggle -->
    <v-tooltip location="top" text="Toggle Grid (G)">
      <template #activator="{ props: tooltipProps }">
        <button 
          v-bind="tooltipProps"
          class="tool-btn"
          :class="{ 'tool-btn--active': showGrid }"
          @click="$emit('toggle-grid')"
        >
          <v-icon size="18">mdi-grid</v-icon>
        </button>
      </template>
    </v-tooltip>
    
    <!-- Snap toggle -->
    <v-tooltip location="top" text="Snap to Grid (S)">
      <template #activator="{ props: tooltipProps }">
        <button 
          v-bind="tooltipProps"
          class="tool-btn"
          :class="{ 'tool-btn--active': snapToGrid }"
          @click="$emit('toggle-snap')"
        >
          <v-icon size="18">mdi-magnet</v-icon>
        </button>
      </template>
    </v-tooltip>
    
    <!-- Scale info -->
    <div class="scale-info">
      <v-icon size="12" class="mr-1">mdi-move-resize</v-icon>
      <span>1 sq = {{ feetPerSquare }} ft</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { VttToolMode } from '@/types/dmScreen.types'

interface Props {
  showGrid?: boolean
  snapToGrid?: boolean
  feetPerSquare?: number
  diagonalRule?: 'standard' | 'alternating' | 'euclidean'
}

const props = withDefaults(defineProps<Props>(), {
  showGrid: true,
  snapToGrid: true,
  feetPerSquare: 5,
  diagonalRule: 'standard',
})

const emit = defineEmits<{
  'tool-change': [tool: VttToolMode]
  'toggle-grid': []
  'toggle-snap': []
  'diagonal-rule-change': [rule: 'standard' | 'alternating' | 'euclidean']
}>()

const currentTool = ref<VttToolMode>('select')
const lastMeasurement = ref<{ feet: number; squares: number } | null>(null)

const diagonalRuleLabel = computed(() => {
  switch (props.diagonalRule) {
    case 'alternating': return '5-10-5'
    case 'euclidean': return 'True'
    default: return 'Simple'
  }
})

const diagonalRuleTooltip = computed(() => {
  switch (props.diagonalRule) {
    case 'alternating': return 'Alternating: 5-10-5-10 ft diagonal movement (PHB variant)'
    case 'euclidean': return 'Euclidean: True geometric distance'
    default: return 'Simple: All movement costs 5 ft per square'
  }
})

function selectTool(tool: VttToolMode) {
  currentTool.value = tool
  emit('tool-change', tool)
}

function cycleDiagonalRule() {
  const rules: Array<'standard' | 'alternating' | 'euclidean'> = ['standard', 'alternating', 'euclidean']
  const currentIndex = rules.indexOf(props.diagonalRule)
  const nextRule = rules[(currentIndex + 1) % rules.length]
  emit('diagonal-rule-change', nextRule)
}

// Update measurement display
function setLastMeasurement(measurement: { feet: number; squares: number } | null) {
  lastMeasurement.value = measurement
}

// Keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  // Ignore if typing in input
  if ((event.target as HTMLElement).tagName === 'INPUT' || (event.target as HTMLElement).tagName === 'TEXTAREA') return
  
  switch (event.key.toLowerCase()) {
    case 'v':
      selectTool('select')
      break
    case 'm':
      selectTool('measure')
      break
    case 'p':
      selectTool('ping')
      break
    case 'g':
      emit('toggle-grid')
      break
    case 's':
      if (!event.ctrlKey && !event.metaKey) {
        emit('toggle-snap')
      }
      break
    case 'escape':
      selectTool('select')
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

defineExpose({
  currentTool,
  selectTool,
  setLastMeasurement,
})
</script>

<style scoped>
.vtt-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(22, 22, 32, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.tool-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.7);
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.tool-btn--active {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
}

.measurement-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 212, 59, 0.15);
  border: 1px solid rgba(255, 212, 59, 0.3);
  border-radius: 8px;
}

.measurement-value {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #ffd43b;
}

.measurement-squares {
  font-size: 11px;
  color: rgba(255, 212, 59, 0.7);
}

.diagonal-rule-selector {
  display: flex;
}

.rule-btn {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.rule-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.scale-info {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>



