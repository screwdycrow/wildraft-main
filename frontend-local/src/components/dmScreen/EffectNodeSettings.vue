<template>
  <v-card min-width="380" max-width="420" class="node-settings-card">
    <v-card-text class="pa-4">
      <div class="text-h6 mb-4 d-flex align-center">
        <v-icon :icon="currentEffectIcon" size="medium" class="mr-2" :color="effectColor" />
        <span>{{ effectTypeName }} Settings</span>
      </div>
      
      <!-- Basic Settings Section -->
      <div class="settings-section mb-4">
        <div class="text-subtitle-2 mb-3 d-flex align-center">
          <v-icon icon="mdi-tune" size="small" class="mr-2" />
          Basic Settings
        </div>
        
        <!-- Intensity -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Intensity</span>
            <span class="text-caption text-medium-emphasis">{{ effectIntensity.toFixed(1) }}</span>
          </div>
          <v-slider
            v-model="effectIntensity"
            :min="0.1"
            :max="1.5"
            :step="0.1"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          />
        </div>
        
        <!-- Speed -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Animation Speed</span>
            <span class="text-caption text-medium-emphasis">{{ effectSpeed.toFixed(1) }}x</span>
          </div>
          <v-slider
            v-model="effectSpeed"
            :min="0.2"
            :max="3"
            :step="0.1"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          />
        </div>
        
        <!-- Scale -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Effect Scale</span>
            <span class="text-caption text-medium-emphasis">{{ effectScale.toFixed(1) }}x</span>
          </div>
          <v-slider
            v-model="effectScale"
            :min="0.3"
            :max="2"
            :step="0.1"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          />
        </div>
        
        <!-- Opacity -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Opacity</span>
            <span class="text-caption text-medium-emphasis">{{ Math.round(effectOpacity * 100) }}%</span>
          </div>
          <v-slider
            v-model="effectOpacity"
            :min="0"
            :max="1"
            :step="0.05"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          />
        </div>
      </div>
      
      <!-- Colors Section -->
      <v-divider class="my-4" />
      <div class="settings-section mb-4">
        <div class="text-subtitle-2 mb-3 d-flex align-center">
          <v-icon icon="mdi-palette" size="small" class="mr-2" />
          Colors
        </div>
        
        <!-- Primary Color -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2">Primary Color</div>
          <div class="d-flex gap-1 flex-wrap mb-2">
            <div
              v-for="color in effectColorPresets"
              :key="color"
              class="color-preset"
              :class="{ active: effectColor === color }"
              :style="{ backgroundColor: color }"
              @click="effectColor = color"
            />
          </div>
          <v-text-field
            v-model="effectColor"
            label="Custom"
            density="compact"
            hide-details
            variant="outlined"
          >
            <template #prepend-inner>
              <div 
                class="color-preview" 
                :style="{ backgroundColor: effectColor }"
              />
            </template>
          </v-text-field>
        </div>
        
        <!-- Secondary Color -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2">Secondary Color</div>
          <div class="d-flex gap-1 flex-wrap mb-2">
            <div
              v-for="color in effectColorPresets"
              :key="'sec-' + color"
              class="color-preset"
              :class="{ active: effectSecondaryColor === color }"
              :style="{ backgroundColor: color }"
              @click="effectSecondaryColor = color"
            />
          </div>
          <v-text-field
            v-model="effectSecondaryColor"
            label="Custom"
            density="compact"
            hide-details
            variant="outlined"
          >
            <template #prepend-inner>
              <div 
                class="color-preview" 
                :style="{ backgroundColor: effectSecondaryColor }"
              />
            </template>
          </v-text-field>
        </div>
      </div>
      
      <!-- Advanced Settings Section -->
      <template v-if="isParticleEffect || isLightEffect">
        <v-divider class="my-4" />
        <div class="settings-section mb-4">
          <div class="text-subtitle-2 mb-3 d-flex align-center">
            <v-icon icon="mdi-cog" size="small" class="mr-2" />
            Advanced Settings
          </div>
          
          <!-- Particle Count (for particle effects) -->
          <template v-if="isParticleEffect">
            <div class="setting-item mb-3">
              <div class="text-caption mb-2 d-flex justify-space-between align-center">
                <span>Particle Density</span>
                <span class="text-caption text-medium-emphasis">{{ effectParticleCount }}</span>
              </div>
              <v-slider
                v-model="effectParticleCount"
                :min="10"
                :max="100"
                :step="5"
                thumb-label
                density="compact"
                hide-details
                color="primary"
              />
            </div>
          </template>
          
          <!-- Pulse Speed (for light effects) -->
          <template v-if="isLightEffect">
            <div class="setting-item mb-3">
              <div class="text-caption mb-2 d-flex justify-space-between align-center">
                <span>Pulse Speed</span>
                <span class="text-caption text-medium-emphasis">{{ effectPulseSpeed.toFixed(2) }}x</span>
              </div>
              <v-slider
                v-model="effectPulseSpeed"
                :min="0.5"
                :max="4"
                :step="0.25"
                thumb-label
                density="compact"
                hide-details
                color="primary"
              />
            </div>
            
            <div class="setting-item mb-3">
              <div class="text-caption mb-2 d-flex justify-space-between align-center">
                <span>Glow Intensity</span>
                <span class="text-caption text-medium-emphasis">{{ effectGlowIntensity.toFixed(1) }}</span>
              </div>
              <v-slider
                v-model="effectGlowIntensity"
                :min="0.2"
                :max="1.5"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
                color="primary"
              />
            </div>
          </template>
        </div>
      </template>
      
      <!-- Lighting Section -->
      <v-divider class="my-4" />
      <div class="settings-section mb-4">
        <div class="text-subtitle-2 mb-3 d-flex align-center">
          <v-icon icon="mdi-lightbulb-on" size="small" class="mr-2" />
          Lighting
        </div>
        
        <!-- Blend Mode Selection -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2">Blend Mode</div>
          <v-select
            v-model="effectBlendMode"
            :items="blendModeOptions"
            item-title="text"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
          />
        </div>
        
        <!-- Light Pool Settings -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Light Intensity</span>
            <span class="text-caption text-medium-emphasis">{{ Math.round(effectLightPoolIntensity * 100) }}%</span>
          </div>
          <v-slider
            v-model="effectLightPoolIntensity"
            :min="0"
            :max="1"
            :step="0.05"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          >
            <template #prepend>
              <span class="text-caption text-xs">Off</span>
            </template>
            <template #append>
              <span class="text-caption text-xs">Max</span>
            </template>
          </v-slider>
        </div>
        
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Light Size</span>
            <span class="text-caption text-medium-emphasis">{{ effectLightPoolSize.toFixed(1) }}x</span>
          </div>
          <v-slider
            v-model="effectLightPoolSize"
            :min="0.5"
            :max="2.5"
            :step="0.1"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          />
        </div>
      </div>
      
      <!-- Mask Settings Section -->
      <v-divider class="my-4" />
      <div class="settings-section mb-4">
        <div class="text-subtitle-2 mb-3 d-flex align-center">
          <v-icon icon="mdi-circle-opacity" size="small" class="mr-2" />
          Mask Settings
        </div>
        
        <div class="d-flex align-center mb-3">
          <v-switch
            v-model="effectUseCircleMask"
            density="compact"
            hide-details
            color="primary"
            class="mr-2"
          />
          <span class="text-body-2">Use Circle Mask</span>
        </div>
        
        <template v-if="effectUseCircleMask">
          <div class="setting-item mb-3">
            <div class="text-caption mb-2 d-flex justify-space-between align-center">
              <span>Feather Size</span>
              <span class="text-caption text-medium-emphasis">{{ Math.round(effectMaskFeatherSize * 100) }}%</span>
            </div>
            <v-slider
              v-model="effectMaskFeatherSize"
              :min="0"
              :max="1"
              :step="0.05"
              thumb-label
              density="compact"
              hide-details
              color="primary"
            />
          </div>
          
          <div class="setting-item mb-3">
            <div class="text-caption mb-2 d-flex justify-space-between align-center">
              <span>Feather Opacity</span>
              <span class="text-caption text-medium-emphasis">{{ Math.round(effectMaskFeatherOpacity * 100) }}%</span>
            </div>
            <v-slider
              v-model="effectMaskFeatherOpacity"
              :min="0"
              :max="1"
              :step="0.05"
              thumb-label
              density="compact"
              hide-details
              color="primary"
            />
          </div>
        </template>
      </div>
      
      <v-btn
        block
        size="default"
        color="primary"
        variant="flat"
        class="mt-2"
        @click="$emit('save')"
      >
        <v-icon icon="mdi-check" size="small" class="mr-2" />
        Apply Changes
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EffectConfig } from '@/types/dmScreen.types'

interface Props {
  config: EffectConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:config': [config: EffectConfig]
  'save': []
}>()

// Local state
const effectIntensity = ref(props.config.intensity ?? 0.7)
const effectSpeed = ref(props.config.speed ?? 1)
const effectScale = ref(props.config.scale ?? 1)
const effectOpacity = ref(props.config.opacity ?? 0.9)
const effectColor = ref(props.config.color || '#ff6600')
const effectSecondaryColor = ref(props.config.secondaryColor || '#ffcc00')
const effectParticleCount = ref(props.config.particleCount ?? 50)
const effectPulseSpeed = ref(props.config.pulseSpeed ?? 2)
const effectGlowIntensity = ref(props.config.glowIntensity ?? 0.8)
const effectLightPoolIntensity = ref(props.config.lightPoolIntensity ?? 0.5)
const effectLightPoolSize = ref(props.config.lightPoolSize ?? 1.0)
const effectBlendMode = ref(props.config.blendMode || 'screen')
const effectUseCircleMask = ref(props.config.useCircleMask ?? false)
const effectMaskFeatherOpacity = ref(props.config.maskFeatherOpacity ?? 0.5)
const effectMaskFeatherSize = ref(props.config.maskFeatherSize ?? 0.5)

// Blend mode options
const blendModeOptions = [
  { value: 'normal', text: 'Normal (No Blend)' },
  { value: 'screen', text: 'Screen (Soft Light)' },
  { value: 'color-dodge', text: 'Color Dodge (Intense)' },
  { value: 'lighten', text: 'Lighten' },
  { value: 'overlay', text: 'Overlay' },
  { value: 'hard-light', text: 'Hard Light' },
  { value: 'soft-light', text: 'Soft Light' },
]

// Effect color presets
const effectColorPresets = [
  '#ff6600', '#ffcc00', '#ff4444', '#44aaff', '#6666ff',
  '#aa66ff', '#ff66aa', '#66ff66', '#ffffff', '#aabbcc',
]

const currentEffectIcon = computed(() => {
  const effectType = props.config.effectType
  const iconMap: Record<string, string> = {
    fire: 'mdi-fire',
    torch: 'mdi-torch',
    campfire: 'mdi-campfire',
    snow: 'mdi-snowflake',
    rain: 'mdi-weather-rainy',
    fog: 'mdi-weather-fog',
    smoke: 'mdi-smoke',
    sparkles: 'mdi-shimmer',
    lightRing: 'mdi-circle-outline',
    aura: 'mdi-blur-radial',
    magicCircle: 'mdi-star-circle-outline',
    fireflies: 'mdi-bee',
    dust: 'mdi-grain',
    embers: 'mdi-flare',
    grass: 'mdi-grass',
    water: 'mdi-water',
    lava: 'mdi-fire',
  }
  return iconMap[effectType] || 'mdi-creation'
})

const effectTypeName = computed(() => {
  const effectType = props.config.effectType
  const nameMap: Record<string, string> = {
    fire: 'Fire',
    torch: 'Torch',
    campfire: 'Campfire',
    snow: 'Snow',
    rain: 'Rain',
    fog: 'Fog',
    smoke: 'Smoke',
    sparkles: 'Sparkles',
    lightRing: 'Light Ring',
    aura: 'Aura',
    magicCircle: 'Magic Circle',
    fireflies: 'Fireflies',
    dust: 'Dust',
    embers: 'Embers',
    grass: 'Grass',
    water: 'Water',
    lava: 'Lava',
  }
  return nameMap[effectType] || 'Effect'
})

const isParticleEffect = computed(() => {
  const particleTypes = ['fire', 'torch', 'campfire', 'snow', 'rain', 'fog', 'smoke', 'sparkles', 'fireflies', 'dust', 'embers']
  return particleTypes.includes(props.config.effectType)
})

const isLightEffect = computed(() => {
  const lightTypes = ['lightRing', 'aura', 'magicCircle']
  return lightTypes.includes(props.config.effectType)
})

// Expose getter for parent to read values
defineExpose({
  getConfig: () => ({
    ...props.config,
    intensity: effectIntensity.value,
    speed: effectSpeed.value,
    scale: effectScale.value,
    opacity: effectOpacity.value,
    color: effectColor.value,
    secondaryColor: effectSecondaryColor.value,
    particleCount: effectParticleCount.value,
    pulseSpeed: effectPulseSpeed.value,
    glowIntensity: effectGlowIntensity.value,
    lightPoolIntensity: effectLightPoolIntensity.value,
    lightPoolSize: effectLightPoolSize.value,
    blendMode: effectBlendMode.value,
    useCircleMask: effectUseCircleMask.value,
    maskFeatherOpacity: effectMaskFeatherOpacity.value,
    maskFeatherSize: effectMaskFeatherSize.value,
  })
})
</script>

<style scoped>
.node-settings-card {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(10px);
  max-height: 85vh;
  overflow-y: auto;
}

.settings-section {
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.setting-item {
  padding: 8px 0;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.color-preset {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-preset:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.color-preset.active {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary-rgb, 99, 102, 241), 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>

