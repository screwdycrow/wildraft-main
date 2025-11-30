<template>
  <div class="shapes-panel">
    <!-- Toggle Button -->
    <button
      class="shapes-toggle-button"
      :class="{ 'shapes-toggle-button--active': isOpen }"
      @click="isOpen = !isOpen"
    >
      <v-icon :icon="isOpen ? 'mdi-close' : 'mdi-shape'" size="small" />
      <span class="toggle-label">Shapes</span>
    </button>

    <!-- Shapes Drawer -->
    <transition name="shapes-drawer">
      <div v-show="isOpen" class="shapes-drawer">
        <div class="drawer-header">
          <h3 class="drawer-title">
            <v-icon icon="mdi-shape" size="small" class="mr-2" />
            Shapes
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

        <!-- Shapes Grid -->
        <div class="shapes-grid">
          <div
            v-for="preset in shapePresets"
            :key="preset.id"
            class="shape-card"
            draggable="true"
            @dragstart="handleDragStart($event, preset)"
            @click="handleShapeClick(preset)"
          >
            <div class="shape-preview" :style="getPreviewStyle(preset)">
              <v-icon :icon="preset.icon" size="24" />
            </div>
            <div class="shape-info">
              <span class="shape-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="drawer-tips">
          <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
          <span>Drag shapes onto the DM screen or click to add at center</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SVG_SHAPE_PRESETS, DEFAULT_LAYERS } from '@/types/dmScreen.types'
import type { SVGShapePreset, DmScreenLayer } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'

const emit = defineEmits<{
  'add-shape': [preset: SVGShapePreset, layerId: string]
}>()

const dmScreensStore = useDmScreensStore()

const isOpen = ref(false)
const selectedLayer = ref(DEFAULT_LAYERS.SCREEN)

const shapePresets = SVG_SHAPE_PRESETS

// Available layers from the current DM screen
const availableLayers = computed<DmScreenLayer[]>(() => {
  const currentScreen = dmScreensStore.currentDmScreen
  if (!currentScreen) return []
  return dmScreensStore.getLayers(currentScreen.id)
})

// Get preview style based on shape type
function getPreviewStyle(preset: SVGShapePreset) {
  const fillColor = preset.defaultData?.fill?.color || '#6366f1'
  const strokeColor = preset.defaultData?.stroke?.color || '#ffffff'
  
  return {
    background: `linear-gradient(135deg, ${fillColor}44 0%, ${fillColor}22 100%)`,
    border: `1px solid ${strokeColor}33`,
  }
}

// Handle drag start
function handleDragStart(event: DragEvent, preset: SVGShapePreset) {
  if (!event.dataTransfer) return
  
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'shape-node',
    shapePreset: preset,
    targetLayer: selectedLayer.value,
  }))
  event.dataTransfer.setData('text/plain', `shape:${preset.id}:${selectedLayer.value}`)
}

// Handle click to add shape at center
function handleShapeClick(preset: SVGShapePreset) {
  emit('add-shape', preset, selectedLayer.value)
}
</script>

<style scoped>
.shapes-panel {
  position: relative;
}

.shapes-toggle-button {
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

.shapes-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 1);
}

.shapes-toggle-button--active {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
}

.toggle-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.shapes-drawer {
  position: absolute;
  left: 0;
  bottom: 44px;
  width: 320px;
  max-height: 420px;
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
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  display: flex;
  align-items: center;
}

.drawer-layer-selector {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.layer-select {
  font-size: 11px;
}

.layer-select :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.layer-select :deep(.v-field__input) {
  font-size: 11px;
  padding-top: 2px;
  padding-bottom: 2px;
  min-height: 28px;
}

.shapes-grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.shape-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.shape-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.shape-card:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.shape-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  color: rgba(255, 255, 255, 0.9);
}

.shape-info {
  text-align: center;
}

.shape-name {
  font-size: 9px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
  display: block;
}

.drawer-tips {
  padding: 6px 8px;
  background: rgba(99, 102, 241, 0.1);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  font-size: 9px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
}

/* Scrollbar styling */
.shapes-grid::-webkit-scrollbar {
  width: 6px;
}

.shapes-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.shapes-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.shapes-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Drawer transition */
.shapes-drawer-enter-active,
.shapes-drawer-leave-active {
  transition: all 0.3s ease;
}

.shapes-drawer-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.shapes-drawer-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.shapes-drawer-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.shapes-drawer-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>


