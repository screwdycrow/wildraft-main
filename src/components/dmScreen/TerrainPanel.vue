<template>
  <div class="terrain-panel">
    <!-- Toggle Button -->
    <button
      class="terrain-toggle-button"
      :class="{ 'terrain-toggle-button--active': isOpen }"
      @click="isOpen = !isOpen"
    >
      <v-icon :icon="isOpen ? 'mdi-close' : 'mdi-terrain'" size="small" />
      <span class="toggle-label">Terrain</span>
    </button>

    <!-- Terrain Drawer -->
    <transition name="terrain-drawer">
      <div v-show="isOpen" class="terrain-drawer">
        <div class="drawer-header">
          <h3 class="drawer-title">
            <v-icon icon="mdi-terrain" size="small" class="mr-2" />
            Quick Map Elements
          </h3>
          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            @click="isOpen = false"
          />
        </div>

        <!-- Layer Selector -->
        <div class="drawer-layer-selector">
          <v-select
            v-model="selectedLayer"
            :items="availableLayers"
            item-title="name"
            item-value="id"
            label="Drop to layer"
            density="compact"
            variant="outlined"
            hide-details
            class="layer-select"
          >
            <template #prepend-inner>
              <v-icon size="small" color="grey">mdi-layers</v-icon>
            </template>
          </v-select>
        </div>

        <!-- Category Tabs -->
        <div class="category-tabs">
          <button
            v-for="category in TERRAIN_CATEGORIES"
            :key="category.id"
            class="category-tab"
            :class="{ 'category-tab--active': selectedCategory === category.id }"
            @click="selectedCategory = category.id"
          >
            <v-icon :icon="category.icon" size="x-small" />
            <span>{{ category.name }}</span>
          </button>
        </div>

        <!-- Terrain Grid -->
        <div class="terrain-grid">
          <div
            v-for="preset in filteredPresets"
            :key="preset.id"
            class="terrain-card"
            draggable="true"
            @dragstart="handleDragStart($event, preset)"
            @click="handleTerrainClick(preset)"
          >
            <div class="terrain-preview" :style="getPreviewStyle(preset)">
              <div class="terrain-icon">
                <v-icon :icon="preset.icon" size="20" />
              </div>
              <div class="terrain-texture" :style="getTextureStyle(preset)" />
            </div>
            <div class="terrain-info">
              <span class="terrain-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="drawer-tips">
          <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
          <span>Drag terrain onto map • Double-click to edit • Settings to regenerate</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TERRAIN_PRESETS, TERRAIN_CATEGORIES, DEFAULT_LAYERS } from '@/types/dmScreen.types'
import type { TerrainPreset, DmScreenLayer } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'

const emit = defineEmits<{
  'add-terrain': [preset: TerrainPreset, layerId: string]
}>()

const dmScreensStore = useDmScreensStore()

const isOpen = ref(false)
const selectedLayer = ref(DEFAULT_LAYERS.SCREEN)
const selectedCategory = ref<string>('dungeons')

// Filter presets by selected category
const filteredPresets = computed(() => {
  return TERRAIN_PRESETS.filter(preset => preset.category === selectedCategory.value)
})

// Available layers from the current DM screen
const availableLayers = computed<DmScreenLayer[]>(() => {
  const currentScreen = dmScreensStore.currentDmScreen
  if (!currentScreen) return []
  return dmScreensStore.getLayers(currentScreen.id)
})

// Get preview background style based on terrain type
function getPreviewStyle(preset: TerrainPreset) {
  const color = preset.previewColor
  const config = preset.defaultConfig
  const terrainType = preset.terrainType
  
  // Cave/Dungeon - dark rocky texture
  if (['cave', 'dungeon', 'ruins'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${color}88 0%, ${config.shadowColor || '#1a1a1a'}88 80%)`,
      boxShadow: `inset 0 0 15px ${config.shadowColor || '#1a1a1a'}66`,
    }
  }
  
  // Trees/Vegetation - organic green blob
  if (['treeSingle', 'treeCluster', 'bush'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 90% 85% at 50% 55%, ${config.accentColor || color}cc 0%, ${color}aa 50%, ${config.shadowColor || '#1a3a1a'}66 100%)`,
      borderRadius: terrainType === 'bush' ? '40%' : '50%',
    }
  }
  
  // Rocks - irregular gray
  if (['rocks', 'cliff'].includes(terrainType)) {
    return {
      background: `linear-gradient(135deg, ${config.accentColor || '#8a8a8a'}88 0%, ${color}aa 50%, ${config.shadowColor || '#2a2a2a'}88 100%)`,
      borderRadius: '30% 40% 35% 45%',
    }
  }
  
  // Building/Structure - boxy
  if (['building', 'campsite'].includes(terrainType)) {
    return {
      background: `linear-gradient(180deg, ${config.accentColor || color}88 0%, ${color}aa 60%, ${config.shadowColor || '#3a2a1a'}88 100%)`,
      borderRadius: '4px',
    }
  }
  
  // River/Water - flowing
  if (['river'].includes(terrainType)) {
    return {
      background: `linear-gradient(90deg, transparent 0%, ${color}88 20%, ${config.accentColor || color}aa 50%, ${color}88 80%, transparent 100%)`,
      borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
    }
  }
  
  // Path - winding
  if (['path'].includes(terrainType)) {
    return {
      background: `linear-gradient(45deg, transparent 10%, ${color}88 30%, ${config.accentColor || color}aa 50%, ${color}88 70%, transparent 90%)`,
      borderRadius: '40% 60% 50% 50%',
    }
  }
  
  // House - rooftop
  if (['house'].includes(terrainType)) {
    return {
      background: `linear-gradient(180deg, ${config.secondaryColor || '#6b4423'}cc 0%, ${config.accentColor || '#8b5533'}aa 50%, ${config.secondaryColor || '#6b4423'}cc 100%)`,
      borderRadius: '4px',
    }
  }
  
  // Mountains
  if (['mountains'].includes(terrainType)) {
    return {
      background: `linear-gradient(180deg, ${config.accentColor || '#ffffff'}88 0%, ${color}aa 40%, ${config.shadowColor || '#3a2a1a'}88 100%)`,
      borderRadius: '50% 50% 30% 30%',
    }
  }
  
  // Grassland
  if (['grassland'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 100% 80% at 50% 60%, ${config.secondaryColor || '#6aaa6a'}aa 0%, ${color}cc 60%, ${config.accentColor || '#3a6a3a'}88 100%)`,
    }
  }
  
  // Ocean
  if (['ocean'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 60% 50% at 40% 40%, ${config.accentColor || '#c4b090'}aa 0%, ${config.secondaryColor || '#4080c0'}88 30%, ${color}cc 100%)`,
    }
  }
  
  // Lake
  if (['lake'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 80% 70% at 50% 50%, ${color}cc 0%, ${config.secondaryColor || '#50a0d0'}aa 50%, ${config.accentColor || '#6a8a5a'}88 100%)`,
    }
  }
  
  // Beach
  if (['beach'].includes(terrainType)) {
    return {
      background: `linear-gradient(180deg, ${config.secondaryColor || '#4090c0'}aa 0%, #ffffff88 35%, ${color}cc 45%, ${config.accentColor || '#e8d8b8'}aa 100%)`,
    }
  }
  
  // Desert
  if (['desert'].includes(terrainType)) {
    return {
      background: `linear-gradient(135deg, ${config.accentColor || '#e8c880'}aa 0%, ${color}cc 50%, ${config.shadowColor || '#8a6030'}88 100%)`,
    }
  }
  
  // Snow
  if (['snow'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 90% 80% at 40% 40%, ${config.accentColor || '#f8f8ff'}ee 0%, ${color}dd 50%, ${config.secondaryColor || '#d0e0f0'}cc 100%)`,
    }
  }
  
  // Swamp
  if (['swamp'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${config.accentColor || '#3a5030'}cc 0%, ${color}aa 50%, ${config.secondaryColor || '#5a7050'}88 100%)`,
    }
  }
  
  // Volcano
  if (['volcano'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${config.accentColor || '#ffaa00'}dd 0%, ${config.secondaryColor || '#ff4400'}cc 40%, ${color}aa 100%)`,
    }
  }
  
  // Canyon
  if (['canyon'].includes(terrainType)) {
    return {
      background: `linear-gradient(90deg, ${color}cc 0%, ${config.shadowColor || '#4a3020'}aa 40%, ${config.shadowColor || '#4a3020'}aa 60%, ${color}cc 100%)`,
    }
  }
  
  return {
    background: `radial-gradient(circle, ${color}88 0%, ${color}44 100%)`,
  }
}

// Get texture overlay style
function getTextureStyle(preset: TerrainPreset) {
  const terrainType = preset.terrainType
  
  // Add subtle texture patterns
  if (['cave', 'dungeon', 'ruins', 'rocks', 'cliff'].includes(terrainType)) {
    return {
      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 30%),
                   radial-gradient(circle at 70% 60%, rgba(255,255,255,0.05) 0%, transparent 25%),
                   radial-gradient(circle at 20% 70%, rgba(0,0,0,0.1) 0%, transparent 20%)`,
    }
  }
  
  if (['treeSingle', 'treeCluster', 'bush'].includes(terrainType)) {
    return {
      background: `radial-gradient(circle at 35% 40%, rgba(255,255,255,0.15) 0%, transparent 25%),
                   radial-gradient(circle at 65% 35%, rgba(255,255,255,0.1) 0%, transparent 20%)`,
    }
  }
  
  // House - roof texture lines
  if (['house'].includes(terrainType)) {
    return {
      background: `repeating-linear-gradient(0deg, transparent 0px, transparent 4px, rgba(0,0,0,0.15) 4px, rgba(0,0,0,0.15) 5px)`,
    }
  }
  
  // Mountains - contour lines
  if (['mountains'].includes(terrainType)) {
    return {
      background: `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.2) 0%, transparent 20%),
                   radial-gradient(circle at 40% 50%, rgba(0,0,0,0.1) 0%, transparent 30%)`,
    }
  }
  
  // Water terrains - wave texture
  if (['ocean', 'lake'].includes(terrainType)) {
    return {
      background: `repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 10px)`,
    }
  }
  
  // Beach - wave line
  if (['beach'].includes(terrainType)) {
    return {
      background: `linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.4) 35%, transparent 40%)`,
    }
  }
  
  // Desert - dune shadows
  if (['desert'].includes(terrainType)) {
    return {
      background: `radial-gradient(ellipse 80% 30% at 30% 60%, rgba(0,0,0,0.15) 0%, transparent 50%),
                   radial-gradient(ellipse 60% 25% at 70% 40%, rgba(0,0,0,0.1) 0%, transparent 50%)`,
    }
  }
  
  // Snow - sparkle
  if (['snow'].includes(terrainType)) {
    return {
      background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 5%),
                   radial-gradient(circle at 60% 50%, rgba(255,255,255,0.3) 0%, transparent 4%),
                   radial-gradient(circle at 45% 70%, rgba(255,255,255,0.35) 0%, transparent 3%)`,
    }
  }
  
  // Swamp - lily pads
  if (['swamp'].includes(terrainType)) {
    return {
      background: `radial-gradient(circle at 35% 40%, rgba(60,110,50,0.5) 0%, transparent 15%),
                   radial-gradient(circle at 65% 60%, rgba(60,110,50,0.4) 0%, transparent 12%)`,
    }
  }
  
  // Volcano - glow
  if (['volcano'].includes(terrainType)) {
    return {
      background: `radial-gradient(circle at 50% 50%, rgba(255,200,100,0.3) 0%, transparent 30%)`,
    }
  }
  
  return {}
}

// Handle drag start
function handleDragStart(event: DragEvent, preset: TerrainPreset) {
  if (!event.dataTransfer) return
  
  // Generate a new seed for this instance
  const configWithNewSeed = {
    ...preset.defaultConfig,
    seed: Math.floor(Math.random() * 1000000),
  }
  
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'terrain-node',
    terrainPreset: {
      ...preset,
      defaultConfig: configWithNewSeed,
    },
    targetLayer: selectedLayer.value,
  }))
  event.dataTransfer.setData('text/plain', `terrain:${preset.id}:${selectedLayer.value}`)
}

// Handle click to add terrain at center
function handleTerrainClick(preset: TerrainPreset) {
  // Generate a new seed for this instance
  const configWithNewSeed = {
    ...preset.defaultConfig,
    seed: Math.floor(Math.random() * 1000000),
  }
  
  emit('add-terrain', {
    ...preset,
    defaultConfig: configWithNewSeed,
  }, selectedLayer.value)
}
</script>

<style scoped>
.terrain-panel {
  position: relative;
}

.terrain-toggle-button {
  width: auto;
  height: 36px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
}

.terrain-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 1);
}

.terrain-toggle-button--active {
  background: rgba(139, 115, 85, 0.3);
  border-color: rgba(139, 115, 85, 0.5);
  color: #d4b896;
}

.toggle-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.terrain-drawer {
  position: absolute;
  left: 0;
  bottom: 44px;
  width: 320px;
  max-height: 480px;
  background: rgba(22, 22, 32, 0.98);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5),
              0 -2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.drawer-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  display: flex;
  align-items: center;
}

.drawer-layer-selector {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.layer-select {
  font-size: 12px;
}

.layer-select :deep(.v-field__input) {
  font-size: 12px;
  min-height: 32px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 5px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.category-tab--active {
  background: rgba(139, 115, 85, 0.2);
  border-color: rgba(139, 115, 85, 0.4);
  color: #d4b896;
}

.terrain-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  overflow-y: auto;
  max-height: 280px;
}

.terrain-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
}

.terrain-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 115, 85, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.terrain-card:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.terrain-preview {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.terrain-icon {
  position: relative;
  z-index: 2;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.terrain-texture {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.terrain-info {
  text-align: center;
}

.terrain-name {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.2;
}

.drawer-tips {
  padding: 8px 12px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Transitions */
.terrain-drawer-enter-active,
.terrain-drawer-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.terrain-drawer-enter-from,
.terrain-drawer-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

/* Scrollbar styling */
.terrain-grid::-webkit-scrollbar {
  width: 4px;
}

.terrain-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

.terrain-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.terrain-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>

