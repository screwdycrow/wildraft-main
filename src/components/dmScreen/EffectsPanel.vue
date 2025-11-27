<template>
  <div class="effects-panel">
    <!-- Toggle Button -->
    <button
      class="effects-toggle-button"
      :class="{ 'effects-toggle-button--active': isOpen }"
      @click="isOpen = !isOpen"
    >
      <v-icon :icon="isOpen ? 'mdi-close' : 'mdi-creation'" size="small" />
      <span class="toggle-label">Effects</span>
    </button>

    <!-- Effects Drawer -->
    <transition name="effects-drawer">
      <div v-show="isOpen" class="effects-drawer">
        <div class="drawer-header">
          <h3 class="drawer-title">
            <v-icon icon="mdi-creation" size="small" class="mr-2" />
            Effects
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

        <!-- Effects Grid -->
        <div class="effects-grid">
          <div
            v-for="preset in effectPresets"
            :key="preset.id"
            class="effect-card"
            draggable="true"
            @dragstart="handleDragStart($event, preset)"
            @click="handleEffectClick(preset)"
          >
            <div class="effect-preview" :style="getPreviewStyle(preset)">
              <div class="effect-icon">
                <v-icon :icon="preset.icon" :color="preset.defaultConfig.color" size="32" />
              </div>
              <div class="effect-glow" :style="getGlowStyle(preset)" />
            </div>
            <div class="effect-info">
              <span class="effect-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="drawer-tips">
          <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
          <span>Drag effects onto the DM screen or click to add at center</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { EFFECT_PRESETS, DEFAULT_LAYERS } from '@/types/dmScreen.types'
import type { EffectPreset, DmScreenLayer } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'

const emit = defineEmits<{
  'add-effect': [preset: EffectPreset, layerId: string]
}>()

const dmScreensStore = useDmScreensStore()

const isOpen = ref(false)
const selectedLayer = ref(DEFAULT_LAYERS.SCREEN)

const effectPresets = EFFECT_PRESETS

// Available layers from the current DM screen
const availableLayers = computed<DmScreenLayer[]>(() => {
  const currentScreen = dmScreensStore.currentDmScreen
  if (!currentScreen) return []
  return dmScreensStore.getLayers(currentScreen.id)
})

// Get preview background style based on effect type
function getPreviewStyle(preset: EffectPreset) {
  const color = preset.defaultConfig.color
  const secondaryColor = preset.defaultConfig.secondaryColor || color
  const effectType = preset.effectType
  
  // Fire effects get warm gradient
  if (['fire', 'torch', 'campfire', 'embers'].includes(effectType)) {
    return {
      background: `radial-gradient(ellipse 80% 100% at 50% 80%, ${color}88 0%, ${secondaryColor}44 40%, transparent 70%)`,
    }
  }
  
  // Light effects get circular glow
  if (['lightRing', 'aura', 'magicCircle'].includes(effectType)) {
    return {
      background: `radial-gradient(circle, ${color}66 0%, ${secondaryColor}33 50%, transparent 70%)`,
      boxShadow: `inset 0 0 20px ${color}44`,
    }
  }
  
  // Weather effects
  if (['snow', 'rain', 'fog', 'smoke', 'dust'].includes(effectType)) {
    return {
      background: `linear-gradient(180deg, transparent 0%, ${color}22 100%)`,
    }
  }
  
  // Sparkles/fireflies
  return {
    background: `radial-gradient(circle, ${color}33 0%, transparent 60%)`,
  }
}

// Get glow style for preview
function getGlowStyle(preset: EffectPreset) {
  const color = preset.defaultConfig.color
  const effectType = preset.effectType
  
  // Fire effects - flickering glow
  if (['fire', 'torch', 'campfire', 'embers'].includes(effectType)) {
    return {
      background: `radial-gradient(ellipse 60% 80% at 50% 70%, ${color}66 0%, transparent 60%)`,
      animation: 'flicker 0.5s ease-in-out infinite alternate',
      filter: `blur(8px)`,
    }
  }
  
  // Light rings - pulsing
  if (['lightRing', 'aura', 'magicCircle'].includes(effectType)) {
    return {
      background: `radial-gradient(circle, transparent 30%, ${color}44 50%, transparent 70%)`,
      animation: 'pulse 2s ease-in-out infinite',
      borderRadius: '50%',
    }
  }
  
  return {
    background: `radial-gradient(circle, ${color}44 0%, transparent 60%)`,
    animation: 'pulse 2s ease-in-out infinite',
  }
}

// Handle drag start
function handleDragStart(event: DragEvent, preset: EffectPreset) {
  if (!event.dataTransfer) return
  
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'effect-node',
    effectPreset: preset,
    targetLayer: selectedLayer.value,
  }))
  event.dataTransfer.setData('text/plain', `effect:${preset.id}:${selectedLayer.value}`)
}

// Handle click to add effect at center
function handleEffectClick(preset: EffectPreset) {
  emit('add-effect', preset, selectedLayer.value)
}
</script>

<style scoped>
.effects-panel {
  position: absolute;
  left: 56px;
  bottom: 120px;
  z-index: 100;
  pointer-events: none;
}

.effects-toggle-button {
  width: 48px;
  height: 48px;
  padding: 0;
  background: rgba(22, 22, 32, 0.8);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35),
              0 2px 6px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.08);
  pointer-events: auto;
  color: rgba(255, 255, 255, 0.7);
}

.effects-toggle-button:hover {
  background: rgba(28, 28, 38, 0.9);
  border-color: rgba(255, 255, 255, 0.15);
  transform: scale(1.02);
  color: rgba(255, 255, 255, 1);
}

.effects-toggle-button--active {
  background: rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.5);
  color: #a5b4fc;
}

.toggle-label {
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.effects-drawer {
  position: absolute;
  left: 56px;
  bottom: 0;
  width: 320px;
  max-height: 500px;
  background: rgba(22, 22, 32, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
              0 2px 8px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  pointer-events: auto;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  display: flex;
  align-items: center;
}

.drawer-layer-selector {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.layer-select {
  font-size: 12px;
}

.layer-select :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.layer-select :deep(.v-field__input) {
  font-size: 12px;
  padding-top: 4px;
  padding-bottom: 4px;
  min-height: 32px;
}

.effects-grid {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.effect-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s ease;
  user-select: none;
}

.effect-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.effect-card:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.effect-preview {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 6px;
}

.effect-icon {
  position: relative;
  z-index: 1;
}

.effect-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  opacity: 0.6;
}

.effect-info {
  text-align: center;
}

.effect-name {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.drawer-tips {
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.1);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
}

/* Scrollbar styling */
.effects-grid::-webkit-scrollbar {
  width: 6px;
}

.effects-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.effects-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.effects-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Drawer transition */
.effects-drawer-enter-active,
.effects-drawer-leave-active {
  transition: all 0.3s ease;
}

.effects-drawer-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.effects-drawer-enter-to {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.effects-drawer-leave-from {
  opacity: 1;
  transform: translateX(0) scale(1);
}

.effects-drawer-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes flicker {
  0% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1.05);
  }
}
</style>

