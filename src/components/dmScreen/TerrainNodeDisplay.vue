<template>
  <div 
    class="terrain-node-container"
    :style="containerStyle"
    @mouseenter="showDownloadButton = true"
    @mouseleave="showDownloadButton = false"
  >
    <!-- Display generated terrain as SVG -->
    <div
      v-if="generatedSVG && !isGenerating"
      class="terrain-svg-container"
      v-html="generatedSVG"
    />
    
    <!-- Copy SVG Code Button -->
    <v-btn
      v-if="generatedSVG && !isGenerating && (showDownloadButton || selected)"
      icon
      size="small"
      variant="flat"
      color="primary"
      class="copy-button"
      @click.stop="copySVGCode"
    >
      <v-icon size="small">mdi-content-copy</v-icon>
      <v-tooltip activator="parent" location="top">
        Copy SVG Code
      </v-tooltip>
    </v-btn>
    
    <!-- Generating indicator -->
    <div v-if="isGenerating" class="generating-overlay">
      <v-progress-circular indeterminate size="24" color="white" />
      <span class="generating-text">Generating...</span>
    </div>
    
    <!-- Placeholder while no SVG -->
    <div v-if="!generatedSVG && !isGenerating" class="terrain-placeholder">
      <v-icon icon="mdi-terrain" size="32" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import type { DmScreenItem, TerrainConfig } from '@/types/dmScreen.types'
import { generateTerrainSVG } from '@/utils/svgTerrainGenerators'

const toast = useToast()

// =====================================================
// PROPS & STATE
// =====================================================

interface Props {
  item: DmScreenItem
  libraryId: number
  selected?: boolean
  rotation?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:generatedSVG': [svg: string]
}>()

const isGenerating = ref(false)
const generatedSVG = ref<string | null>(null)
const showDownloadButton = ref(false)

// Get terrain config from item data
const terrainConfig = computed<TerrainConfig>(() => {
  return props.item.data.terrainConfig || {
    terrainType: 'cave',
    seed: 12345,
    complexity: 0.5,
    scale: 1,
    primaryColor: '#4a3d3a',
    secondaryColor: '#2d2420',
  }
})

// Check if we already have a generated SVG stored
const storedSVG = computed(() => {
  return props.item.data.generatedTerrainSVG || null
})

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
}))

// Get dimensions from node options
const terrainWidth = computed(() => {
  return props.item.nodeOptions?.width || 200
})

const terrainHeight = computed(() => {
  return props.item.nodeOptions?.height || 200
})

// =====================================================
// SVG GENERATION
// =====================================================

async function generateTerrain(shouldSave = true): Promise<void> {
  if (isGenerating.value) return
  
  isGenerating.value = true
  
  // Give UI time to update
  await new Promise(resolve => setTimeout(resolve, 10))
  
  try {
    const config = terrainConfig.value
    const w = terrainWidth.value
    const h = terrainHeight.value
    
    // Generate SVG using the generator
    const svg = generateTerrainSVG(w, h, config)
    
    // Update state
    generatedSVG.value = svg
    
    // Only emit for saving if shouldSave is true (initial generation)
    if (shouldSave) {
      emit('update:generatedSVG', svg)
    }
    
  } catch (error) {
    console.error('[TerrainNodeDisplay] Generation error:', error)
  } finally {
    isGenerating.value = false
  }
}

// =====================================================
// COPY SVG CODE FUNCTIONALITY
// =====================================================

async function copySVGCode(): Promise<void> {
  if (!generatedSVG.value) return
  
  try {
    // Copy SVG code to clipboard
    await navigator.clipboard.writeText(generatedSVG.value)
    
    // Show success toast
    toast.success('SVG code copied to clipboard!')
  } catch (error) {
    console.error('[TerrainNodeDisplay] Copy error:', error)
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = generatedSVG.value
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      toast.success('SVG code copied to clipboard!')
    } catch (fallbackError) {
      console.error('[TerrainNodeDisplay] Copy fallback error:', fallbackError)
      toast.error('Failed to copy SVG code')
    }
  }
}

// =====================================================
// LIFECYCLE
// =====================================================

function handleRegenerateEvent(event: Event) {
  const customEvent = event as CustomEvent<{ itemId: string }>
  if (customEvent.detail.itemId === props.item.id) {
    // Don't emit update on regeneration - just update local SVG
    generateTerrain(false)
  }
}

// Watch for config changes
watch(() => terrainConfig.value, () => {
  generateTerrain(false)
}, { deep: true })

// Watch for size changes
watch([terrainWidth, terrainHeight], () => {
  generateTerrain(false)
})

onMounted(() => {
  window.addEventListener('terrain-regenerate', handleRegenerateEvent)
  
  if (storedSVG.value) {
    generatedSVG.value = storedSVG.value
  } else {
    generateTerrain()
  }
})

onUnmounted(() => {
  window.removeEventListener('terrain-regenerate', handleRegenerateEvent)
})

defineExpose({
  regenerate: generateTerrain,
})
</script>

<style scoped>
.terrain-node-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}

.terrain-svg-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.terrain-svg-container :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.generating-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}

.generating-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.terrain-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 115, 85, 0.2);
  color: rgba(255, 255, 255, 0.4);
}

.copy-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
</style>
