<template>
  <v-card min-width="420" max-width="480" class="node-settings-card">
    <v-card-text class="pa-4">
      <div class="text-h6 mb-4 d-flex align-center">
        <v-icon icon="mdi-shape" size="medium" class="mr-2" />
        <span>Shape Settings</span>
      </div>
      
      <v-tabs v-model="activeTab" grow class="mb-4">
        <v-tab value="shape">Shape</v-tab>
        <v-tab value="fill">Fill</v-tab>
        <v-tab value="stroke">Stroke</v-tab>
        <v-tab value="effects">Effects</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab">
        <!-- Shape Tab -->
        <v-window-item value="shape">
          <div class="settings-section mb-4">
            <div class="text-subtitle-2 mb-3 d-flex align-center">
              <v-icon icon="mdi-shape-outline" size="small" class="mr-2" />
              Shape Type
            </div>
            <div class="shape-picker mb-4">
              <div 
                v-for="preset in SVG_SHAPE_PRESETS" 
                :key="preset.id"
                class="shape-preset"
                :class="{ active: localData.shapeType === preset.shapeType }"
                @click="selectShape(preset)"
                :title="preset.name"
              >
                <v-icon :icon="preset.icon" size="24" />
              </div>
            </div>
            
            <!-- Shape-specific options -->
            <template v-if="localData.shapeType === 'roundedRect'">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Corner Radius</span>
                  <span class="text-caption text-medium-emphasis">{{ localData.cornerRadius }}px</span>
                </div>
                <v-slider
                  v-model="localData.cornerRadius"
                  :min="0"
                  :max="50"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  color="primary"
                />
              </div>
            </template>
            
            <template v-if="localData.shapeType === 'star'">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Points</span>
                  <span class="text-caption text-medium-emphasis">{{ localData.points }}</span>
                </div>
                <v-slider
                  v-model="localData.points"
                  :min="3"
                  :max="12"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  color="primary"
                />
              </div>
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Inner Radius</span>
                  <span class="text-caption text-medium-emphasis">{{ localData.innerRadius }}%</span>
                </div>
                <v-slider
                  v-model="localData.innerRadius"
                  :min="10"
                  :max="90"
                  :step="5"
                  thumb-label
                  density="compact"
                  hide-details
                  color="primary"
                />
              </div>
            </template>
            
            <template v-if="localData.shapeType === 'arrow' || localData.shapeType === 'arrowDouble'">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Arrow Head Size</span>
                  <span class="text-caption text-medium-emphasis">{{ localData.arrowHeadSize }}%</span>
                </div>
                <v-slider
                  v-model="localData.arrowHeadSize"
                  :min="15"
                  :max="50"
                  :step="5"
                  thumb-label
                  density="compact"
                  hide-details
                  color="primary"
                />
              </div>
            </template>
            
            <v-divider class="my-4" />
            
            <!-- Label -->
            <div class="setting-item mb-3">
              <div class="text-caption mb-2">Label Text</div>
              <v-text-field
                v-model="localData.label"
                density="compact"
                variant="outlined"
                hide-details
              />
            </div>
            
            <div class="setting-item mb-3">
              <div class="text-caption mb-2">Label Color</div>
              <div class="d-flex gap-2">
                <div class="color-presets">
                  <div 
                    v-for="color in colorPresets" 
                    :key="color"
                    class="color-preset"
                    :class="{ active: localData.labelColor === color }"
                    :style="{ backgroundColor: color }"
                    @click="localData.labelColor = color"
                  />
                </div>
                <input type="color" v-model="localData.labelColor" class="color-input" />
              </div>
            </div>
            
            <!-- Transform options -->
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-3">Transform</div>
            <div class="d-flex gap-2">
              <v-btn
                :variant="localData.flipX ? 'flat' : 'outlined'"
                :color="localData.flipX ? 'primary' : 'default'"
                size="small"
                @click="localData.flipX = !localData.flipX"
              >
                <v-icon icon="mdi-flip-horizontal" class="mr-1" />
                Flip H
              </v-btn>
              <v-btn
                :variant="localData.flipY ? 'flat' : 'outlined'"
                :color="localData.flipY ? 'primary' : 'default'"
                size="small"
                @click="localData.flipY = !localData.flipY"
              >
                <v-icon icon="mdi-flip-vertical" class="mr-1" />
                Flip V
              </v-btn>
            </div>
          </div>
        </v-window-item>
        
        <!-- Fill Tab -->
        <v-window-item value="fill">
          <div class="settings-section mb-4">
            <div class="text-subtitle-2 mb-3 d-flex align-center">
              <v-icon icon="mdi-format-color-fill" size="small" class="mr-2" />
              Fill Type
            </div>
            <v-btn-toggle 
              v-model="localData.fill.type" 
              mandatory 
              density="compact"
              class="mb-4"
            >
              <v-btn value="solid" size="small">Solid</v-btn>
              <v-btn value="linearGradient" size="small">Linear</v-btn>
              <v-btn value="radialGradient" size="small">Radial</v-btn>
              <v-btn value="none" size="small">None</v-btn>
            </v-btn-toggle>
            
            <template v-if="localData.fill.type === 'solid'">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2">Fill Color</div>
                <div class="d-flex gap-2 mb-2">
                  <div class="color-presets">
                    <div 
                      v-for="color in colorPresets" 
                      :key="color"
                      class="color-preset"
                      :class="{ active: localData.fill.color === color }"
                      :style="{ backgroundColor: color }"
                      @click="localData.fill.color = color"
                    />
                  </div>
                  <input type="color" v-model="localData.fill.color" class="color-input" />
                </div>
              </div>
            </template>
            
            <template v-if="localData.fill.type === 'linearGradient' || localData.fill.type === 'radialGradient'">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2">Gradient Stops</div>
                <div 
                  v-for="(stop, idx) in localData.gradientStops" 
                  :key="idx"
                  class="gradient-stop d-flex align-center gap-2 mb-2"
                >
                  <input type="color" v-model="stop.color" class="color-input-small" />
                  <v-slider
                    v-model="stop.offset"
                    :min="0"
                    :max="100"
                    density="compact"
                    hide-details
                    color="primary"
                    style="flex: 1"
                  />
                  <span class="text-caption" style="width: 40px">{{ stop.offset }}%</span>
                  <v-btn 
                    v-if="localData.gradientStops.length > 2"
                    icon
                    size="x-small"
                    variant="text"
                    color="error"
                    @click="removeGradientStop(idx)"
                  >
                    <v-icon icon="mdi-close" size="small" />
                  </v-btn>
                </div>
                <v-btn 
                  size="small" 
                  variant="outlined" 
                  @click="addGradientStop"
                  prepend-icon="mdi-plus"
                  class="mb-3"
                >
                  Add Stop
                </v-btn>
                
                <template v-if="localData.fill.type === 'linearGradient'">
                  <div class="setting-item mb-3">
                    <div class="text-caption mb-2 d-flex justify-space-between align-center">
                      <span>Gradient Angle</span>
                      <span class="text-caption text-medium-emphasis">{{ localData.fill.gradientAngle || 0 }}°</span>
                    </div>
                    <v-slider
                      v-model="localData.fill.gradientAngle"
                      :min="0"
                      :max="360"
                      :step="15"
                      thumb-label
                      density="compact"
                      hide-details
                      color="primary"
                    />
                  </div>
                </template>
              </div>
            </template>
            
            <div class="setting-item mb-3">
              <div class="text-caption mb-2 d-flex justify-space-between align-center">
                <span>Fill Opacity</span>
                <span class="text-caption text-medium-emphasis">{{ Math.round(localData.fill.opacity * 100) }}%</span>
              </div>
              <v-slider
                v-model="localData.fill.opacity"
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
        </v-window-item>
        
        <!-- Stroke Tab -->
        <v-window-item value="stroke">
          <div class="settings-section mb-4">
            <div class="text-subtitle-2 mb-3 d-flex align-center">
              <v-icon icon="mdi-border-color" size="small" class="mr-2" />
              Stroke
            </div>
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-body-2">Enable Stroke</span>
              <v-switch
                v-model="localData.stroke.enabled"
                density="compact"
                hide-details
                color="primary"
              />
            </div>
            
            <template v-if="localData.stroke.enabled">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2">Stroke Color</div>
                <div class="d-flex gap-2 mb-2">
                  <div class="color-presets">
                    <div 
                      v-for="color in colorPresets" 
                      :key="color"
                      class="color-preset"
                      :class="{ active: localData.stroke.color === color }"
                      :style="{ backgroundColor: color }"
                      @click="localData.stroke.color = color"
                    />
                  </div>
                  <input type="color" v-model="localData.stroke.color" class="color-input" />
                </div>
              </div>
              
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Stroke Width</span>
                  <span class="text-caption text-medium-emphasis">{{ localData.stroke.width }}px</span>
                </div>
                <v-slider
                  v-model="localData.stroke.width"
                  :min="1"
                  :max="20"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  color="primary"
                />
              </div>
              
              <div class="setting-item mb-3">
                <div class="text-caption mb-2">Dash Pattern</div>
                <v-btn-toggle 
                  v-model="dashPattern" 
                  density="compact"
                >
                  <v-btn value="" size="small">Solid</v-btn>
                  <v-btn value="8,8" size="small">Dashed</v-btn>
                  <v-btn value="2,6" size="small">Dotted</v-btn>
                  <v-btn value="12,6,2,6" size="small">Dash-Dot</v-btn>
                </v-btn-toggle>
              </div>
            </template>
          </div>
        </v-window-item>
        
        <!-- Effects Tab -->
        <v-window-item value="effects">
          <div class="settings-section mb-4">
            <div class="text-subtitle-2 mb-3 d-flex align-center">
              <v-icon icon="mdi-shadow" size="small" class="mr-2" />
              Drop Shadow
            </div>
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-body-2">Enable Shadow</span>
              <v-switch
                v-model="localData.shadow.enabled"
                density="compact"
                hide-details
                color="primary"
              />
            </div>
            
            <template v-if="localData.shadow.enabled">
              <div class="setting-item mb-3">
                <div class="text-caption mb-2">Shadow Color</div>
                <div class="d-flex gap-2">
                  <input type="color" v-model="localData.shadow.color" class="color-input" />
                  <v-text-field
                    v-model="localData.shadow.color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="flex: 1"
                  />
                </div>
              </div>
              
              <div class="d-flex gap-3 mb-3">
                <div style="flex: 1">
                  <div class="setting-item">
                    <div class="text-caption mb-2 d-flex justify-space-between align-center">
                      <span>Offset X</span>
                      <span class="text-caption text-medium-emphasis">{{ localData.shadow.offsetX }}px</span>
                    </div>
                    <v-slider
                      v-model="localData.shadow.offsetX"
                      :min="-20"
                      :max="20"
                      :step="1"
                      thumb-label
                      density="compact"
                      hide-details
                      color="primary"
                    />
                  </div>
                </div>
                <div style="flex: 1">
                  <div class="setting-item">
                    <div class="text-caption mb-2 d-flex justify-space-between align-center">
                      <span>Offset Y</span>
                      <span class="text-caption text-medium-emphasis">{{ localData.shadow.offsetY }}px</span>
                    </div>
                    <v-slider
                      v-model="localData.shadow.offsetY"
                      :min="-20"
                      :max="20"
                      :step="1"
                      thumb-label
                      density="compact"
                      hide-details
                      color="primary"
                    />
                  </div>
                </div>
              </div>
              
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Blur</span>
                  <span class="text-caption text-medium-emphasis">{{ localData.shadow.blur }}px</span>
                </div>
                <v-slider
                  v-model="localData.shadow.blur"
                  :min="0"
                  :max="30"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  color="primary"
                />
              </div>
              
              <div class="setting-item mb-3">
                <div class="text-caption mb-2 d-flex justify-space-between align-center">
                  <span>Shadow Opacity</span>
                  <span class="text-caption text-medium-emphasis">{{ Math.round(localData.shadow.opacity * 100) }}%</span>
                </div>
                <v-slider
                  v-model="localData.shadow.opacity"
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
        </v-window-item>
      </v-window>
      
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
import { ref, computed, watch } from 'vue'
import type { SVGShapeData, SVGShapePreset, SVGGradientStop } from '@/types/dmScreen.types'
import { SVG_SHAPE_PRESETS, getDefaultSVGShapeData } from '@/types/dmScreen.types'

interface Props {
  shapeData: SVGShapeData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'save': []
}>()

const activeTab = ref('shape')

// Local editing state
const localData = ref<SVGShapeData & { gradientStops: SVGGradientStop[] }>(getDefaultLocalData())

function getDefaultLocalData() {
  const current = props.shapeData
  return {
    ...current,
    gradientStops: current.fill.gradientStops?.length 
      ? [...current.fill.gradientStops.map(s => ({ ...s }))]
      : [
          { offset: 0, color: current.fill.color, opacity: 1 },
          { offset: 100, color: '#ffffff', opacity: 1 },
        ],
  }
}

// Initialize from props
function initializeFromProps() {
  const current = props.shapeData
  localData.value = {
    ...current,
    gradientStops: current.fill.gradientStops?.length 
      ? [...current.fill.gradientStops.map(s => ({ ...s }))]
      : [
          { offset: 0, color: current.fill.color, opacity: 1 },
          { offset: 100, color: '#ffffff', opacity: 1 },
        ],
  }
}

// Initialize on mount
initializeFromProps()

// Watch for prop changes
watch(() => props.shapeData, initializeFromProps, { deep: true })

const colorPresets = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#14b8a6', '#3b82f6', '#ffffff', '#000000',
  // Wood Palette
  '#5c4033', '#4a3020', '#6c5043', '#3a2010', '#7c6053',
  // Stone Palette
  '#6a6a6a', '#7a7060', '#5a5a5a', '#8a8a8a', '#4a4a4a',
]

const dashPattern = computed({
  get: () => localData.value.stroke.dashArray || '',
  set: (val: string) => { localData.value.stroke.dashArray = val || undefined }
})

function selectShape(preset: SVGShapePreset) {
  localData.value.shapeType = preset.shapeType
  localData.value.customPath = undefined
  if (preset.defaultData) {
    Object.assign(localData.value, preset.defaultData)
  }
}

function addGradientStop() {
  const lastOffset = localData.value.gradientStops[localData.value.gradientStops.length - 1]?.offset || 0
  localData.value.gradientStops.push({
    offset: Math.min(lastOffset + 25, 100),
    color: '#ffffff',
    opacity: 1,
  })
}

function removeGradientStop(idx: number) {
  if (localData.value.gradientStops.length > 2) {
    localData.value.gradientStops.splice(idx, 1)
  }
}

defineExpose({
  getShapeData: () => {
    const newData: SVGShapeData = {
      shapeType: localData.value.shapeType,
      customPath: localData.value.customPath,
      fill: {
        ...localData.value.fill,
        gradientStops: localData.value.fill.type !== 'solid' 
          ? localData.value.gradientStops 
          : undefined,
      },
      stroke: { ...localData.value.stroke },
      shadow: { ...localData.value.shadow },
      label: localData.value.label,
      labelColor: localData.value.labelColor,
      labelFontSize: localData.value.labelFontSize,
      labelFontWeight: localData.value.labelFontWeight,
      cornerRadius: localData.value.cornerRadius,
      points: localData.value.points,
      innerRadius: localData.value.innerRadius,
      arrowHeadSize: localData.value.arrowHeadSize,
      flipX: localData.value.flipX,
      flipY: localData.value.flipY,
    }
    return newData
  }
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

.shape-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.shape-preset {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.shape-preset:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(var(--v-theme-primary), 0.3);
  transform: scale(1.05);
}

.shape-preset.active {
  background: rgba(var(--v-theme-primary), 0.2);
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary-rgb, 99, 102, 241), 0.3);
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-input-small {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper,
.color-input-small::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch,
.color-input-small::-webkit-color-swatch {
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.gradient-stop {
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  border-radius: 6px;
}
</style>

