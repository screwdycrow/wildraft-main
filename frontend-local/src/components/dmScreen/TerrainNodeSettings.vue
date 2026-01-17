<template>
  <v-card class="terrain-settings-dialog">
    <v-card-title class="d-flex align-center">
      <v-icon :icon="currentIcon" class="mr-2" />
      {{ currentName }} Settings
      <v-spacer />
      <v-btn icon="mdi-close" size="small" variant="text" @click="emit('cancel')" />
    </v-card-title>
    <v-divider />
    
    <v-card-text class="pa-0">
      <v-tabs v-model="activeTab" grow>
        <v-tab value="general">General</v-tab>
        <v-tab value="colors">Colors</v-tab>
        <v-tab value="advanced">Advanced</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab" class="pa-4">
        <!-- General Tab -->
        <v-window-item value="general">
          <!-- Seed -->
          <div class="setting-group">
            <div class="setting-label">
              <v-icon icon="mdi-seed" size="small" class="mr-1" />
              Seed: {{ localConfig.seed }}
            </div>
            <div class="d-flex gap-2 align-center">
              <v-text-field
                v-model.number="localConfig.seed"
                type="number"
                density="compact"
                variant="outlined"
                hide-details
                style="flex: 1"
              />
              <v-btn
                icon="mdi-dice-multiple"
                size="small"
                variant="outlined"
                @click="randomizeSeed"
                title="Generate new seed"
              />
            </div>
          </div>
          
          <!-- Complexity -->
          <div class="setting-group">
            <div class="setting-label">
              Complexity: {{ Math.round(localConfig.complexity * 100) }}%
            </div>
            <v-slider
              v-model="localConfig.complexity"
              :min="0"
              :max="1"
              :step="0.05"
              thumb-label
              density="compact"
              hide-details
            />
          </div>
          
          <!-- Scale -->
          <div class="setting-group">
            <div class="setting-label">
              Scale: {{ localConfig.scale.toFixed(1) }}x
            </div>
            <v-slider
              v-model="localConfig.scale"
              :min="0.5"
              :max="2"
              :step="0.1"
              thumb-label
              density="compact"
              hide-details
            />
          </div>
          
          <!-- Resolution -->
          <div class="setting-group">
            <div class="setting-label">
              <v-icon icon="mdi-quality-high" size="small" class="mr-1" />
              Render Quality
            </div>
            <v-btn-toggle v-model="localConfig.resolution" mandatory density="compact" class="flex-wrap">
              <v-btn value="low" size="small">Low</v-btn>
              <v-btn value="medium" size="small">Medium</v-btn>
              <v-btn value="high" size="small">High</v-btn>
              <v-btn value="ultra" size="small">Ultra</v-btn>
            </v-btn-toggle>
          </div>
          
          <!-- Detail Level -->
          <div class="setting-group">
            <div class="setting-label">
              Detail Level: {{ Math.round((localConfig.detailLevel || 0.5) * 100) }}%
            </div>
            <v-slider
              v-model="localConfig.detailLevel"
              :min="0.1"
              :max="1"
              :step="0.05"
              thumb-label
              density="compact"
              hide-details
            />
          </div>
          
          <!-- Type-specific options -->
          <template v-if="isCaveType">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">Cave Options</div>
            
            <div class="setting-group">
              <div class="setting-label">
                Fill Density: {{ Math.round((localConfig.fillDensity || 0.45) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.fillDensity"
                :min="0.3"
                :max="0.6"
                :step="0.01"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Smooth Iterations: {{ localConfig.smoothIterations || 4 }}
              </div>
              <v-slider
                v-model="localConfig.smoothIterations"
                :min="1"
                :max="8"
                :step="1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <v-switch
              v-model="localConfig.connectRegions"
              label="Connect disconnected areas"
              color="primary"
              density="compact"
              hide-details
            />
          </template>
          
          <template v-if="isDungeonType">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">Room Options</div>
            
            <div class="setting-group">
              <div class="setting-label">
                Room Count: {{ localConfig.roomCount || 5 }}
              </div>
              <v-slider
                v-model="localConfig.roomCount"
                :min="2"
                :max="10"
                :step="1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Wall Thickness: {{ localConfig.wallThickness || 3 }}
              </div>
              <v-slider
                v-model="localConfig.wallThickness"
                :min="1"
                :max="5"
                :step="1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <div class="setting-group">
              <div class="setting-label">Door Style</div>
              <v-btn-toggle v-model="localConfig.doorStyle" mandatory density="compact">
                <v-btn value="open" size="small">Open</v-btn>
                <v-btn value="closed" size="small">Closed</v-btn>
                <v-btn value="arch" size="small">Arch</v-btn>
              </v-btn-toggle>
            </div>
          </template>
          
          <template v-if="isVegetationType">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">Foliage Options</div>
            
            <div class="setting-group">
              <div class="setting-label">Foliage Style</div>
              <v-btn-toggle v-model="localConfig.foliageStyle" mandatory density="compact">
                <v-btn value="round" size="small">Round</v-btn>
                <v-btn value="pointed" size="small">Pointed</v-btn>
                <v-btn value="irregular" size="small">Irregular</v-btn>
              </v-btn-toggle>
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Foliage Density: {{ Math.round((localConfig.foliageDensity || 0.8) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.foliageDensity"
                :min="0.3"
                :max="1"
                :step="0.05"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <v-switch
              v-model="localConfig.trunkVisible"
              label="Show trunk"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <v-switch
              v-model="localConfig.hasHighlights"
              label="Add highlights"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <v-switch
              v-model="localConfig.hasShadows"
              label="Cast shadow"
              color="primary"
              density="compact"
              hide-details
            />
          </template>
          
          <template v-if="isPathType">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">Path Options</div>
            
            <div class="setting-group">
              <div class="setting-label">
                Path Width: {{ localConfig.pathWidth || 30 }}px
              </div>
              <v-slider
                v-model="localConfig.pathWidth"
                :min="10"
                :max="60"
                :step="5"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Curviness: {{ Math.round((localConfig.curviness || 0.5) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.curviness"
                :min="0"
                :max="1"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <v-switch
              v-model="localConfig.hasStones"
              label="Add stones"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <v-switch
              v-model="localConfig.hasBorder"
              label="Add border"
              color="primary"
              density="compact"
              hide-details
            />
          </template>
          
          <!-- Lake/Water Options -->
          <template v-if="isLakeType">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">
              <v-icon icon="mdi-water" size="small" class="mr-1" />
              Water Options
            </div>
            
            <div class="setting-group">
              <div class="setting-label">Lake Shape Style</div>
              <v-btn-toggle v-model="localConfig.lakeStyle" mandatory density="compact">
                <v-btn value="simple" size="small">Simple</v-btn>
                <v-btn value="natural" size="small">Natural</v-btn>
                <v-btn value="complex" size="small">Complex</v-btn>
              </v-btn-toggle>
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Depth Zones: {{ localConfig.waterDepthZones || 3 }}
              </div>
              <v-slider
                v-model="localConfig.waterDepthZones"
                :min="1"
                :max="5"
                :step="1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Shore Detail: {{ Math.round((localConfig.shoreDetail || 0.5) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.shoreDetail"
                :min="0.1"
                :max="1"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <v-switch
              v-model="localConfig.hasIslands"
              label="Add islands"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <template v-if="localConfig.hasIslands">
              <div class="setting-group ml-4">
                <div class="setting-label">
                  Island Count: {{ localConfig.islandCount || 2 }}
                </div>
                <v-slider
                  v-model="localConfig.islandCount"
                  :min="1"
                  :max="5"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                />
              </div>
            </template>
            
            <v-switch
              v-model="localConfig.hasReeds"
              label="Shore vegetation (reeds & lilies)"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <template v-if="localConfig.hasReeds">
              <div class="setting-group ml-4">
                <div class="setting-label">
                  Vegetation Density: {{ Math.round((localConfig.reedDensity || 0.5) * 100) }}%
                </div>
                <v-slider
                  v-model="localConfig.reedDensity"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  thumb-label
                  density="compact"
                  hide-details
                />
              </div>
            </template>
            
            <v-switch
              v-model="localConfig.hasWaves"
              label="Wave patterns"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <template v-if="localConfig.hasWaves">
              <div class="setting-group ml-4">
                <div class="setting-label">
                  Wave Intensity: {{ Math.round((localConfig.waveIntensity || 0.3) * 100) }}%
                </div>
                <v-slider
                  v-model="localConfig.waveIntensity"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  thumb-label
                  density="compact"
                  hide-details
                />
              </div>
            </template>
            
            <v-switch
              v-model="localConfig.hasShoreSand"
              label="Sandy shore ring"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <div class="setting-group">
              <div class="setting-label">
                Water Clarity: {{ Math.round((localConfig.waterTransparency || 0.3) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.waterTransparency"
                :min="0"
                :max="0.8"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
          </template>
          
          <!-- Grassland Options -->
          <template v-if="isGrasslandType">
            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">
              <v-icon icon="mdi-grass" size="small" class="mr-1" />
              Grass Options
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Grass Density: {{ Math.round((localConfig.grassDensity || 0.7) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.grassDensity"
                :min="0.2"
                :max="1"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Grass Blade Size: {{ Math.round((localConfig.grassBladeSize || 0.6) * 100) }}%
              </div>
              <v-slider
                v-model="localConfig.grassBladeSize"
                :min="0.2"
                :max="1"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
            
            <v-switch
              v-model="localConfig.hasFlowers"
              label="Wildflowers"
              color="primary"
              density="compact"
              hide-details
              class="mb-2"
            />
            
            <template v-if="localConfig.hasFlowers">
              <div class="setting-group ml-4">
                <div class="setting-label">
                  Flower Density: {{ Math.round((localConfig.flowerDensity || 0.3) * 100) }}%
                </div>
                <v-slider
                  v-model="localConfig.flowerDensity"
                  :min="0.1"
                  :max="1"
                  :step="0.1"
                  thumb-label
                  density="compact"
                  hide-details
                />
              </div>
            </template>
            
            <v-switch
              v-model="localConfig.hasPathPatches"
              label="Worn dirt patches"
              color="primary"
              density="compact"
              hide-details
            />
          </template>
        </v-window-item>
        
        <!-- Colors Tab -->
        <v-window-item value="colors">
          <div class="setting-group">
            <div class="setting-label">Primary Color</div>
            <div class="d-flex gap-2 align-center">
              <div class="color-presets">
                <div 
                  v-for="color in primaryColorPresets" 
                  :key="color"
                  class="color-preset"
                  :class="{ active: localConfig.primaryColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="localConfig.primaryColor = color"
                />
              </div>
              <input type="color" v-model="localConfig.primaryColor" class="color-input" />
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Secondary Color</div>
            <div class="d-flex gap-2 align-center">
              <div class="color-presets">
                <div 
                  v-for="color in secondaryColorPresets" 
                  :key="color"
                  class="color-preset"
                  :class="{ active: localConfig.secondaryColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="localConfig.secondaryColor = color"
                />
              </div>
              <input type="color" v-model="localConfig.secondaryColor" class="color-input" />
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Accent Color</div>
            <div class="d-flex gap-2 align-center">
              <div class="color-presets">
                <div 
                  v-for="color in accentColorPresets" 
                  :key="color"
                  class="color-preset"
                  :class="{ active: localConfig.accentColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="localConfig.accentColor = color"
                />
              </div>
              <input type="color" v-model="localConfig.accentColor" class="color-input" />
            </div>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Shadow Color</div>
            <div class="d-flex gap-2 align-center">
              <input type="color" v-model="localConfig.shadowColor" class="color-input" />
              <v-text-field
                v-model="localConfig.shadowColor"
                density="compact"
                variant="outlined"
                hide-details
                style="flex: 1"
              />
            </div>
          </div>
          
          <template v-if="isVegetationType">
            <v-divider class="my-3" />
            <div class="setting-group">
              <div class="setting-label">Trunk Color</div>
              <div class="d-flex gap-2 align-center">
                <div class="color-presets">
                  <div 
                    v-for="color in trunkColorPresets" 
                    :key="color"
                    class="color-preset"
                    :class="{ active: localConfig.trunkColor === color }"
                    :style="{ backgroundColor: color }"
                    @click="localConfig.trunkColor = color"
                  />
                </div>
                <input type="color" v-model="localConfig.trunkColor" class="color-input" />
              </div>
            </div>
          </template>
        </v-window-item>
        
        <!-- Advanced Tab -->
        <v-window-item value="advanced">
          <div class="setting-group">
            <div class="setting-label">Texture Pattern</div>
            <v-btn-toggle v-model="localConfig.texturePattern" density="compact">
              <v-btn value="noise" size="small">Noise</v-btn>
              <v-btn value="crosshatch" size="small">Crosshatch</v-btn>
              <v-btn value="stipple" size="small">Stipple</v-btn>
              <v-btn value="solid" size="small">Solid</v-btn>
            </v-btn-toggle>
          </div>
          
          <div class="setting-group">
            <div class="setting-label">Border Style</div>
            <v-btn-toggle v-model="localConfig.borderStyle" density="compact">
              <v-btn value="rough" size="small">Rough</v-btn>
              <v-btn value="smooth" size="small">Smooth</v-btn>
              <v-btn value="none" size="small">None</v-btn>
            </v-btn-toggle>
          </div>
          
          <v-switch
            v-model="localConfig.hasOutline"
            label="Show outline"
            color="primary"
            density="compact"
            hide-details
            class="mb-2"
          />
          
          <template v-if="localConfig.hasOutline">
            <div class="setting-group">
              <div class="setting-label">Outline Color</div>
              <div class="d-flex gap-2 align-center">
                <input type="color" v-model="localConfig.outlineColor" class="color-input" />
                <v-text-field
                  v-model="localConfig.outlineColor"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="flex: 1"
                />
              </div>
            </div>
            
            <div class="setting-group">
              <div class="setting-label">
                Outline Width: {{ localConfig.outlineWidth || 2 }}px
              </div>
              <v-slider
                v-model="localConfig.outlineWidth"
                :min="1"
                :max="5"
                :step="0.5"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
          </template>
          
          <v-divider class="my-3" />
          
          <v-switch
            v-model="localConfig.animated"
            label="Animated (for water/river)"
            color="primary"
            density="compact"
            hide-details
            class="mb-2"
          />
          
          <template v-if="localConfig.animated">
            <div class="setting-group">
              <div class="setting-label">
                Animation Speed: {{ (localConfig.animationSpeed || 1).toFixed(1) }}x
              </div>
              <v-slider
                v-model="localConfig.animationSpeed"
                :min="0.1"
                :max="2"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
              />
            </div>
          </template>
        </v-window-item>
      </v-window>
    </v-card-text>
    
    <v-divider />
    <v-card-actions>
      <v-btn
        variant="outlined"
        prepend-icon="mdi-refresh"
        @click="regenerate"
      >
        Regenerate
      </v-btn>
      <v-spacer />
      <v-btn variant="text" @click="emit('cancel')">Cancel</v-btn>
      <v-btn color="primary" variant="flat" @click="saveSettings">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TerrainConfig } from '@/types/dmScreen.types'
import { TERRAIN_PRESETS } from '@/types/dmScreen.types'

interface Props {
  config: TerrainConfig
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'save': []
  'cancel': []
  'regenerate': []
}>()

const activeTab = ref('general')

// Local editing state
const localConfig = ref<TerrainConfig>({ ...props.config })

// Initialize from props
function initializeFromProps() {
  localConfig.value = { ...props.config }
}

initializeFromProps()

watch(() => props.config, initializeFromProps, { deep: true })

// Computed
const currentPreset = computed(() => {
  return TERRAIN_PRESETS.find(p => p.terrainType === localConfig.value.terrainType)
})

const currentIcon = computed(() => currentPreset.value?.icon || 'mdi-terrain')
const currentName = computed(() => currentPreset.value?.name || 'Terrain')

const isCaveType = computed(() => 
  ['cave'].includes(localConfig.value.terrainType)
)

const isDungeonType = computed(() => 
  ['dungeon', 'building', 'ruins'].includes(localConfig.value.terrainType)
)

const isVegetationType = computed(() => 
  ['treeSingle', 'treeCluster', 'bush'].includes(localConfig.value.terrainType)
)

const isPathType = computed(() => 
  ['river', 'path'].includes(localConfig.value.terrainType)
)

const isLakeType = computed(() => 
  ['lake', 'ocean'].includes(localConfig.value.terrainType)
)

const isGrasslandType = computed(() => 
  ['grassland'].includes(localConfig.value.terrainType)
)

// Color presets based on terrain type
const primaryColorPresets = computed(() => {
  const type = localConfig.value.terrainType
  if (['cave', 'dungeon', 'ruins'].includes(type)) {
    return ['#4a3d3a', '#3d3d4a', '#5a4a3a', '#4a4a4a', '#3a3a3a']
  }
  if (['treeSingle', 'treeCluster', 'bush'].includes(type)) {
    return ['#2d5a2d', '#3d6a3d', '#1a4a1a', '#4a7a4a', '#2a4a2a']
  }
  if (['rocks', 'cliff'].includes(type)) {
    return ['#6a6a6a', '#7a7060', '#5a5a5a', '#8a8a8a', '#4a4a4a']
  }
  if (['river'].includes(type)) {
    return ['#4a90c0', '#3a70a0', '#5aa0d0', '#2a6090', '#6ab0e0']
  }
  return ['#8a7560', '#6a5540', '#9a8570', '#5a4530', '#aa9580']
})

const secondaryColorPresets = computed(() => {
  const type = localConfig.value.terrainType
  if (['cave', 'dungeon', 'ruins'].includes(type)) {
    return ['#2d2420', '#2a2a35', '#4a3a2a', '#3a3a3a', '#2a2a2a']
  }
  if (['treeSingle', 'treeCluster', 'bush'].includes(type)) {
    return ['#4a8a4a', '#5a9a5a', '#3a7a3a', '#6aaa6a', '#4a9a4a']
  }
  return ['#4a4a4a', '#3a3a3a', '#5a5a5a', '#2a2a2a', '#6a6a6a']
})

const accentColorPresets = computed(() => {
  const type = localConfig.value.terrainType
  if (['treeSingle', 'treeCluster', 'bush'].includes(type)) {
    return ['#6ab06a', '#7ac07a', '#5aa05a', '#8ad08a', '#6ac06a']
  }
  if (['building', 'campsite'].includes(type)) {
    return ['#ab8b65', '#c9a571', '#9b7b55', '#bb9b75', '#dbb581']
  }
  return ['#8a8a8a', '#9a9a9a', '#7a7a7a', '#aaaaaa', '#6a6a6a']
})

const trunkColorPresets = ['#5c4033', '#4a3020', '#6c5043', '#3a2010', '#7c6053']

// Methods
function randomizeSeed() {
  localConfig.value.seed = Math.floor(Math.random() * 1000000)
}

function regenerate() {
  randomizeSeed()
  // Emit regenerate to trigger generation with new seed
  emit('regenerate')
}

function saveSettings() {
  emit('save')
}

// Expose getConfig method
function getConfig(): TerrainConfig {
  return { ...localConfig.value }
}

defineExpose({
  getConfig,
})
</script>

<style scoped>
.terrain-settings-dialog {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(10px);
}

.setting-group {
  margin-bottom: 16px;
}

.setting-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
}

.color-presets {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s ease;
}

.color-preset:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.color-preset.active {
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
}

.color-input {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}
</style>

