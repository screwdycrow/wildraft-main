<template>
  <div class="dm-screen-flow-node-container" :style="containerStyle">
    <!-- Custom Rotation-Aware Resize Handles -->
    <template v-if="isSelected">
      <!-- Corner handles -->
      <div 
        class="resize-handle corner top-left" 
        @mousedown.stop="startResize($event, 'top-left')"
      />
      <div 
        class="resize-handle corner top-right" 
        @mousedown.stop="startResize($event, 'top-right')"
      />
      <div 
        class="resize-handle corner bottom-left" 
        @mousedown.stop="startResize($event, 'bottom-left')"
      />
      <div 
        class="resize-handle corner bottom-right" 
        @mousedown.stop="startResize($event, 'bottom-right')"
      />
      <!-- Edge handles -->
      <div 
        class="resize-handle edge top" 
        @mousedown.stop="startResize($event, 'top')"
      />
      <div 
        class="resize-handle edge bottom" 
        @mousedown.stop="startResize($event, 'bottom')"
      />
      <div 
        class="resize-handle edge left" 
        @mousedown.stop="startResize($event, 'left')"
      />
      <div 
        class="resize-handle edge right" 
        @mousedown.stop="startResize($event, 'right')"
      />
      <!-- Selection border -->
      <div class="selection-border" />
    </template>
    
    <!-- Rotation Handle and Action Toolbar -->
    <div v-if="isSelected" class="top-controls">
      <!-- Rotation Handle -->
      <div
        class="rotation-handle"
        @mousedown.stop="handleRotationStart"
      >
        <v-icon size="small" color="#6366f1">mdi-rotate-3d-variant</v-icon>
      </div>
      
      <!-- Action Toolbar -->
      <div class="node-action-toolbar">
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="white"
          @click.stop="resetRotation"
        >
          <v-icon size="small">mdi-rotate-left-variant</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Reset Rotation
          </v-tooltip>
        </v-btn>
        
        <!-- Object Fit Toggle (only for background images) -->
        <v-btn
          v-if="isBackgroundImage"
          icon
          size="x-small"
          variant="text"
          :color="currentObjectFit === 'cover' ? 'warning' : 'white'"
          @click.stop="toggleObjectFit"
        >
          <v-icon size="small">{{ currentObjectFit === 'cover' ? 'mdi-crop' : 'mdi-arrow-expand-all' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ currentObjectFit === 'cover' ? 'Cover (cropped)' : 'Fill (stretched)' }} - Click to toggle
          </v-tooltip>
        </v-btn>
        
        <!-- Convert to Token (for items that can become tokens) -->
        <v-btn
          v-if="canConvertToToken"
          icon
          size="x-small"
          variant="text"
          color="white"
          @click.stop="convertToToken"
        >
          <v-icon size="small">mdi-circle-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Convert to Token
          </v-tooltip>
        </v-btn>
        
        <!-- Restore from Token -->
        <v-btn
          v-if="isTokenNode"
          icon
          size="x-small"
          variant="text"
          color="white"
          @click.stop="restoreFromToken"
        >
          <v-icon size="small">mdi-card-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Restore to Card
          </v-tooltip>
        </v-btn>
        
        <!-- Token Settings -->
        <v-menu
          v-if="isTokenNode"
          :close-on-content-click="false"
          location="bottom"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              size="x-small"
              variant="text"
              color="white"
              @click.stop
            >
              <v-icon size="small">mdi-cog</v-icon>
              <v-tooltip activator="parent" location="bottom">
                Token Settings
              </v-tooltip>
            </v-btn>
          </template>
          <v-card min-width="250" class="token-settings-menu">
            <v-card-text class="pa-3">
              <div class="text-subtitle-2 mb-3">Token Settings</div>
              
              <!-- Show Label -->
              <v-switch
                v-model="tokenShowLabel"
                label="Show Name"
                density="compact"
                hide-details
                color="primary"
                class="mb-2"
              />
              
              <!-- Border Width -->
              <div class="text-caption mb-1">Border Width</div>
              <v-slider
                v-model="tokenBorderWidth"
                :min="0"
                :max="8"
                :step="1"
                thumb-label
                density="compact"
                hide-details
                class="mb-2"
              />
              
              <!-- Border Color -->
              <div class="text-caption mb-1">Border Color</div>
              <div class="d-flex gap-1 flex-wrap mb-2">
                <div
                  v-for="color in borderColorPresets"
                  :key="color"
                  class="color-preset"
                  :class="{ active: tokenBorderColor === color }"
                  :style="{ backgroundColor: color }"
                  @click="tokenBorderColor = color"
                />
              </div>
              <v-text-field
                v-model="tokenBorderColor"
                label="Custom Color"
                density="compact"
                hide-details
                variant="outlined"
                class="mb-2"
              >
                <template #prepend-inner>
                  <div 
                    class="color-preview" 
                    :style="{ backgroundColor: tokenBorderColor }"
                  />
                </template>
              </v-text-field>
              
              <v-btn
                block
                size="small"
                color="primary"
                variant="tonal"
                @click="saveTokenSettings"
              >
                Apply
              </v-btn>
            </v-card-text>
          </v-card>
        </v-menu>
        
        <!-- Effect Settings -->
        <v-menu
          v-if="isEffectNode"
          :close-on-content-click="false"
          location="bottom"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              size="x-small"
              variant="text"
              color="white"
              @click.stop
            >
              <v-icon size="small">mdi-tune-variant</v-icon>
              <v-tooltip activator="parent" location="bottom">
                Effect Settings
              </v-tooltip>
            </v-btn>
          </template>
          <v-card min-width="300" max-width="350" class="effect-settings-menu">
            <v-card-text class="pa-3">
              <div class="text-subtitle-2 mb-3 d-flex align-center">
                <v-icon :icon="currentEffectIcon" size="small" class="mr-2" :color="effectColor" />
                {{ effectTypeName }} Settings
              </div>
              
              <!-- Intensity -->
              <div class="text-caption mb-1">Intensity</div>
              <v-slider
                v-model="effectIntensity"
                :min="0.1"
                :max="1.5"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <!-- Speed -->
              <div class="text-caption mb-1">Animation Speed</div>
              <v-slider
                v-model="effectSpeed"
                :min="0.2"
                :max="3"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <!-- Scale -->
              <div class="text-caption mb-1">Effect Scale</div>
              <v-slider
                v-model="effectScale"
                :min="0.3"
                :max="2"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <!-- Primary Color -->
              <div class="text-caption mb-1">Primary Color</div>
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
                class="mb-3"
              >
                <template #prepend-inner>
                  <div 
                    class="color-preview" 
                    :style="{ backgroundColor: effectColor }"
                  />
                </template>
              </v-text-field>
              
              <!-- Secondary Color -->
              <div class="text-caption mb-1">Secondary Color</div>
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
                class="mb-3"
              >
                <template #prepend-inner>
                  <div 
                    class="color-preview" 
                    :style="{ backgroundColor: effectSecondaryColor }"
                  />
                </template>
              </v-text-field>
              
              <!-- Particle Count (for particle effects) -->
              <template v-if="isParticleEffect">
                <div class="text-caption mb-1">Particle Density</div>
                <v-slider
                  v-model="effectParticleCount"
                  :min="10"
                  :max="100"
                  :step="5"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-3"
                />
              </template>
              
              <!-- Pulse Speed (for light effects) -->
              <template v-if="isLightEffect">
                <div class="text-caption mb-1">Pulse Speed</div>
                <v-slider
                  v-model="effectPulseSpeed"
                  :min="0.5"
                  :max="4"
                  :step="0.25"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-3"
                />
                
                <div class="text-caption mb-1">Glow Intensity</div>
                <v-slider
                  v-model="effectGlowIntensity"
                  :min="0.2"
                  :max="1.5"
                  :step="0.1"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-3"
                />
              </template>
              
              <!-- Light Pool Settings (screen blend lighting) -->
              <v-divider class="my-3" />
              <div class="text-caption font-weight-medium mb-2 d-flex align-center">
                <v-icon icon="mdi-lightbulb-on" size="small" class="mr-1" />
                Light Pool (Illumination)
              </div>
              
              <div class="text-caption mb-1">Light Intensity</div>
              <v-slider
                v-model="effectLightPoolIntensity"
                :min="0"
                :max="1"
                :step="0.05"
                thumb-label
                density="compact"
                hide-details
                class="mb-3"
              >
                <template #prepend>
                  <span class="text-caption">Off</span>
                </template>
                <template #append>
                  <span class="text-caption">Max</span>
                </template>
              </v-slider>
              
              <div class="text-caption mb-1">Light Size</div>
              <v-slider
                v-model="effectLightPoolSize"
                :min="0.5"
                :max="2.5"
                :step="0.1"
                thumb-label
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <v-btn
                block
                size="small"
                color="primary"
                variant="tonal"
                @click="saveEffectSettings"
              >
                Apply
              </v-btn>
            </v-card-text>
          </v-card>
        </v-menu>
        
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="error"
          @click.stop="handleDelete"
        >
          <v-icon size="small">mdi-close</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Delete
          </v-tooltip>
        </v-btn>
      </div>
    </div>
    
    <div 
      class="dm-screen-flow-node" 
      :class="{ 
        'selected': isSelected,
        'is-dragging': props.dragging,
        'rotating': isRotating,
        'resizing': isResizing,
        'is-token': isTokenNode,
        'is-effect': isEffectNode
      }"
    >
      <dm-screen-item-wrapper
        :key="data.item.id"
        :item="data.item"
        :library-id="data.libraryId"
        :dm-screen-id="data.dmScreenId"
        :snap-to-grid="data.snapToGrid"
        :grid-size="data.gridSize"
        :background-opacity="data.backgroundOpacity"
        @update="handleItemUpdate"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { DmScreenItem } from '@/types/dmScreen.types'
import DmScreenItemWrapper from './DmScreenItemWrapper.vue'
import { useDmScreensStore } from '@/stores/dmScreens'

// =====================================================
// PROPS
// =====================================================

interface Props {
  id: string
  data: {
    item: DmScreenItem
    libraryId: number
    dmScreenId: string
    snapToGrid?: boolean
    gridSize?: number
    backgroundOpacity?: number
    rotation?: number
  }
  selected?: boolean
  dragging?: boolean
  width?: number
  height?: number
  position?: { x: number; y: number }
}

const props = defineProps<Props>()

// =====================================================
// STORE & VUEFLOW
// =====================================================

const dmScreensStore = useDmScreensStore()
const { findNode, setNodes } = useVueFlow()

// =====================================================
// LOCAL STATE
// =====================================================

const isRotating = ref(false)
const rotationStartAngle = ref(0)
const rotationStartMouseAngle = ref(0)
const currentRotation = ref(props.data.rotation ?? props.data.item.nodeOptions?.rotation ?? 0)

// Resize state
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const resizeStartMouse = ref({ x: 0, y: 0 })
const resizeStartDimensions = ref({ width: 0, height: 0 })
const resizeStartPosition = ref({ x: 0, y: 0 })
const currentDimensions = ref({ width: 0, height: 0 })
const currentPosition = ref({ x: 0, y: 0 })

// Token settings state (local state for editing)
const tokenShowLabel = ref(true)
const tokenBorderWidth = ref(0)
const tokenBorderColor = ref('#6366f1')

// Border color presets
const borderColorPresets = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#000000', // Black
  'transparent',
]

// Effect settings state (local state for editing)
const effectIntensity = ref(0.7)
const effectSpeed = ref(1)
const effectScale = ref(1)
const effectColor = ref('#ff6600')
const effectSecondaryColor = ref('#ffcc00')
const effectParticleCount = ref(50)
const effectPulseSpeed = ref(2)
const effectGlowIntensity = ref(0.8)
const effectLightPoolIntensity = ref(0.5)
const effectLightPoolSize = ref(1.0)

// Effect color presets
const effectColorPresets = [
  '#ff6600', // Fire Orange
  '#ffcc00', // Yellow
  '#ff4444', // Red
  '#44aaff', // Cyan
  '#6666ff', // Blue
  '#aa66ff', // Purple
  '#ff66aa', // Pink
  '#66ff66', // Green
  '#ffffff', // White
  '#aabbcc', // Fog Gray
]

// Sync rotation with props when not actively rotating
watch(() => props.data.item.nodeOptions?.rotation, (newRotation) => {
  if (!isRotating.value && newRotation !== undefined) {
    currentRotation.value = newRotation
  }
}, { immediate: false })

// Sync token settings from props
watch(() => props.data.item, (item) => {
  if (item.type === 'TokenNode') {
    tokenShowLabel.value = item.data.tokenShowLabel !== false
    tokenBorderWidth.value = item.data.tokenBorderWidth || 0
    tokenBorderColor.value = item.data.tokenBorderColor || '#6366f1'
  }
  // Sync effect settings from props
  if (item.type === 'EffectNode' && item.data.effectConfig) {
    const config = item.data.effectConfig
    effectIntensity.value = config.intensity ?? 0.7
    effectSpeed.value = config.speed ?? 1
    effectScale.value = config.scale ?? 1
    effectColor.value = config.color || '#ff6600'
    effectSecondaryColor.value = config.secondaryColor || '#ffcc00'
    effectParticleCount.value = config.particleCount ?? 50
    effectPulseSpeed.value = config.pulseSpeed ?? 2
    effectGlowIntensity.value = config.glowIntensity ?? 0.8
    effectLightPoolIntensity.value = config.lightPoolIntensity ?? 0.5
    effectLightPoolSize.value = config.lightPoolSize ?? 1.0
  }
}, { immediate: true, deep: true })

// =====================================================
// COMPUTED
// =====================================================

const isSelected = computed(() => props.selected || false)

const rotation = computed(() => {
  return currentRotation.value
})

const containerStyle = computed(() => {
  if (rotation.value) {
    return {
      transform: `rotate(${rotation.value}deg)`,
      transformOrigin: 'center center',
    }
  }
  return {}
})

const isBackgroundImage = computed(() => {
  return props.data.item.data.isBackground === true
})

const currentObjectFit = computed(() => {
  return props.data.item.data.objectFit || 'fill'
})

const isTokenNode = computed(() => {
  return props.data.item.type === 'TokenNode'
})

const isEffectNode = computed(() => {
  return props.data.item.type === 'EffectNode'
})

const currentEffectConfig = computed(() => {
  return props.data.item.data.effectConfig || {}
})

const currentEffectIcon = computed(() => {
  const effectType = currentEffectConfig.value.effectType
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
  }
  return iconMap[effectType] || 'mdi-creation'
})

const effectTypeName = computed(() => {
  const effectType = currentEffectConfig.value.effectType
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
  }
  return nameMap[effectType] || 'Effect'
})

const isParticleEffect = computed(() => {
  const particleTypes = ['fire', 'torch', 'campfire', 'snow', 'rain', 'fog', 'smoke', 'sparkles', 'fireflies', 'dust', 'embers']
  return particleTypes.includes(currentEffectConfig.value.effectType)
})

const isLightEffect = computed(() => {
  const lightTypes = ['lightRing', 'aura', 'magicCircle']
  return lightTypes.includes(currentEffectConfig.value.effectType)
})

// Items that can be converted to tokens (LibraryItemId and UserFileId, not backgrounds)
const canConvertToToken = computed(() => {
  const item = props.data.item
  const convertibleTypes = ['LibraryItemId', 'UserFileId']
  return convertibleTypes.includes(item.type) && 
         !item.data.isBackground &&
         item.type !== 'TokenNode'
})

// =====================================================
// ITEM UPDATE HANDLER
// =====================================================

function handleItemUpdate(updatedItem: DmScreenItem) {
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    updatedItem.id,
    updatedItem
  )
}

// =====================================================
// DELETE HANDLER
// =====================================================

function handleDelete() {
  dmScreensStore.deleteItem(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id
  )
}

// =====================================================
// OBJECT FIT TOGGLE (for background images)
// =====================================================

function toggleObjectFit() {
  const item = props.data.item
  const newFit = currentObjectFit.value === 'fill' ? 'cover' : 'fill'
  
  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      objectFit: newFit,
    },
  }
  
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )
}

// =====================================================
// ROTATION-AWARE RESIZE HANDLERS
// =====================================================

const MIN_WIDTH = 30
const MIN_HEIGHT = 30

function startResize(event: MouseEvent, handle: string) {
  console.log('[DmScreenFlowNode] Starting resize:', handle, 'rotation:', currentRotation.value)
  
  isResizing.value = true
  resizeHandle.value = handle
  resizeStartMouse.value = { x: event.clientX, y: event.clientY }
  
  const node = findNode(props.id)
  if (node) {
    const w = node.dimensions?.width || props.data.item.nodeOptions?.width || 300
    const h = node.dimensions?.height || props.data.item.nodeOptions?.height || 200
    console.log('[DmScreenFlowNode] Start dimensions:', w, h, 'position:', node.position)
    resizeStartDimensions.value = { width: w, height: h }
    currentDimensions.value = { width: w, height: h }
    resizeStartPosition.value = {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
    }
    currentPosition.value = { ...resizeStartPosition.value }
  }
  
  event.preventDefault()
  event.stopPropagation()
}

function handleResizeMove(event: MouseEvent) {
  if (!isResizing.value || !resizeHandle.value) return
  
  // Get raw mouse delta
  const rawDx = event.clientX - resizeStartMouse.value.x
  const rawDy = event.clientY - resizeStartMouse.value.y
  
  // Transform mouse delta by inverse of rotation to get local coordinates
  const angleRad = -(currentRotation.value * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)
  
  const dx = rawDx * cos - rawDy * sin
  const dy = rawDx * sin + rawDy * cos
  
  let newWidth = resizeStartDimensions.value.width
  let newHeight = resizeStartDimensions.value.height
  let newX = resizeStartPosition.value.x
  let newY = resizeStartPosition.value.y
  
  const handle = resizeHandle.value
  
  // Apply delta based on which handle is being dragged
  if (handle.includes('right')) {
    newWidth = Math.max(MIN_WIDTH, resizeStartDimensions.value.width + dx)
  }
  if (handle.includes('left')) {
    const widthChange = -dx
    newWidth = Math.max(MIN_WIDTH, resizeStartDimensions.value.width + widthChange)
    if (newWidth > MIN_WIDTH) {
      // Adjust position to keep right edge in place (in rotated space)
      const actualWidthChange = newWidth - resizeStartDimensions.value.width
      const posAngleRad = (currentRotation.value * Math.PI) / 180
      newX = resizeStartPosition.value.x - actualWidthChange * Math.cos(posAngleRad)
      newY = resizeStartPosition.value.y - actualWidthChange * Math.sin(posAngleRad)
    }
  }
  if (handle.includes('bottom')) {
    newHeight = Math.max(MIN_HEIGHT, resizeStartDimensions.value.height + dy)
  }
  if (handle.includes('top')) {
    const heightChange = -dy
    newHeight = Math.max(MIN_HEIGHT, resizeStartDimensions.value.height + heightChange)
    if (newHeight > MIN_HEIGHT) {
      // Adjust position to keep bottom edge in place (in rotated space)
      const actualHeightChange = newHeight - resizeStartDimensions.value.height
      const posAngleRad = (currentRotation.value * Math.PI) / 180
      newX = resizeStartPosition.value.x + actualHeightChange * Math.sin(posAngleRad)
      newY = resizeStartPosition.value.y - actualHeightChange * Math.cos(posAngleRad)
    }
  }
  
  // Store current values for visual feedback and final save
  currentDimensions.value = { width: newWidth, height: newHeight }
  currentPosition.value = { x: newX, y: newY }
  
  // Update the node in VueFlow for immediate visual feedback
  setNodes((nodes) => 
    nodes.map((node) => {
      if (node.id === props.id) {
        return {
          ...node,
          position: { x: newX, y: newY },
          width: newWidth,
          height: newHeight,
          style: {
            ...node.style,
            width: `${newWidth}px`,
            height: `${newHeight}px`,
          },
        }
      }
      return node
    })
  )
}

function handleResizeEnd() {
  if (!isResizing.value) return
  
  const width = currentDimensions.value.width
  const height = currentDimensions.value.height
  const x = currentPosition.value.x
  const y = currentPosition.value.y
  
  isResizing.value = false
  resizeHandle.value = null
  
  // Save to store (triggers debounced API call)
  dmScreensStore.updateItemDimensions(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id,
    width,
    height,
    x,
    y
  )
}

// =====================================================
// ROTATION HANDLERS
// =====================================================

function getAngleFromCenter(centerX: number, centerY: number, mouseX: number, mouseY: number): number {
  const dx = mouseX - centerX
  const dy = mouseY - centerY
  return Math.atan2(dy, dx) * (180 / Math.PI)
}

function handleRotationStart(event: MouseEvent) {
  isRotating.value = true
  rotationStartAngle.value = currentRotation.value
  
  const nodeElement = document.querySelector(`[data-id="${props.id}"]`)
  if (nodeElement) {
    const nodeRect = nodeElement.getBoundingClientRect()
    const nodeCenterX = nodeRect.left + nodeRect.width / 2
    const nodeCenterY = nodeRect.top + nodeRect.height / 2
    
    rotationStartMouseAngle.value = getAngleFromCenter(
      nodeCenterX,
      nodeCenterY,
      event.clientX,
      event.clientY
    )
  }
  
  event.preventDefault()
  event.stopPropagation()
}

function handleRotationMove(event: MouseEvent) {
  if (!isRotating.value) return
  
  const nodeElement = document.querySelector(`[data-id="${props.id}"]`)
  if (!nodeElement) return
  
  const nodeRect = nodeElement.getBoundingClientRect()
  const nodeCenterX = nodeRect.left + nodeRect.width / 2
  const nodeCenterY = nodeRect.top + nodeRect.height / 2
  
  const currentMouseAngle = getAngleFromCenter(
    nodeCenterX,
    nodeCenterY,
    event.clientX,
    event.clientY
  )
  
  let deltaAngle = currentMouseAngle - rotationStartMouseAngle.value
  
  if (deltaAngle > 180) deltaAngle -= 360
  if (deltaAngle < -180) deltaAngle += 360
  
  let newRotation = rotationStartAngle.value + deltaAngle
  newRotation = ((newRotation % 360) + 360) % 360
  
  // Snap to 15 degrees when shift is held
  if (event.shiftKey) {
    newRotation = Math.round(newRotation / 15) * 15
  }
  
  // Update local rotation for immediate visual feedback
  currentRotation.value = newRotation
}

function handleRotationEnd() {
  if (!isRotating.value) return
  
  isRotating.value = false
  
  // Persist rotation to store (debounced API call)
  dmScreensStore.updateItemRotation(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id,
    currentRotation.value
  )
}

function resetRotation() {
  currentRotation.value = 0
  
  dmScreensStore.updateItemRotation(
    props.data.dmScreenId,
    props.data.libraryId,
    props.data.item.id,
    0
  )
}

// =====================================================
// TOKEN CONVERSION HANDLERS
// =====================================================

function convertToToken() {
  const item = props.data.item
  
  // Store original type and data for restoration
  const tokenItem: DmScreenItem = {
    ...item,
    type: 'TokenNode',
    data: {
      ...item.data,
      originalType: item.type,
      originalData: { ...item.data },
      tokenLabel: item.data.name || item.data.fileName || 'Token',
      tokenShowLabel: true,
      tokenBorderWidth: 3,
      tokenBorderColor: '#6366f1',
    },
    nodeOptions: {
      ...item.nodeOptions,
      // Store original dimensions for restoration
      fullWidth: item.nodeOptions?.width || 300,
      fullHeight: item.nodeOptions?.height || 200,
      // Set token size (circular)
      width: 100,
      height: 100,
    },
  }
  
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    tokenItem
  )
}

function restoreFromToken() {
  const item = props.data.item
  
  if (!item.data.originalType) {
    console.warn('[DmScreenFlowNode] Cannot restore token: no original type stored')
    return
  }
  
  // Restore to original type
  const restoredItem: DmScreenItem = {
    ...item,
    type: item.data.originalType,
    data: {
      ...item.data.originalData,
    },
    nodeOptions: {
      ...item.nodeOptions,
      // Restore original dimensions
      width: item.nodeOptions?.fullWidth || 300,
      height: item.nodeOptions?.fullHeight || 200,
    },
  }
  
  // Clean up token-specific fields
  delete restoredItem.data.originalType
  delete restoredItem.data.originalData
  delete restoredItem.data.tokenLabel
  delete restoredItem.data.tokenImageUrl
  delete restoredItem.data.tokenShowLabel
  delete restoredItem.data.tokenBorderColor
  delete restoredItem.data.tokenBorderWidth
  delete restoredItem.data.tokenSize
  
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    restoredItem
  )
}

function saveTokenSettings() {
  const item = props.data.item
  
  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      tokenShowLabel: tokenShowLabel.value,
      tokenBorderWidth: tokenBorderWidth.value,
      tokenBorderColor: tokenBorderColor.value,
    },
  }
  
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )
}

function saveEffectSettings() {
  const item = props.data.item
  
  const updatedConfig = {
    ...item.data.effectConfig,
    intensity: effectIntensity.value,
    speed: effectSpeed.value,
    scale: effectScale.value,
    color: effectColor.value,
    secondaryColor: effectSecondaryColor.value,
    particleCount: effectParticleCount.value,
    pulseSpeed: effectPulseSpeed.value,
    glowIntensity: effectGlowIntensity.value,
    lightPoolIntensity: effectLightPoolIntensity.value,
    lightPoolSize: effectLightPoolSize.value,
  }
  
  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      effectConfig: updatedConfig,
    },
  }
  
  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )
}

// =====================================================
// LIFECYCLE
// =====================================================

function handleGlobalMouseMove(event: MouseEvent) {
  handleRotationMove(event)
  handleResizeMove(event)
}

function handleGlobalMouseUp() {
  handleRotationEnd()
  handleResizeEnd()
}

onMounted(() => {
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
})
</script>

<style scoped>
.dm-screen-flow-node-container {
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: center center;
}

.dm-screen-flow-node {
  width: 100%;
  height: 100%;
  min-width: 30px;
  min-height: 30px;
  position: relative;
}

.dm-screen-flow-node.is-token {
  width: 100%;
  height: 100%;
  min-width: 20px;
  min-height: 20px;
  border-radius: 50%;
  overflow: hidden;
}

.dm-screen-flow-node.is-effect {
  width: 100%;
  height: 100%;
  min-width: 50px;
  min-height: 50px;
  overflow: visible;
  background: transparent;
  border: none;
  /* Don't isolate - allow blend modes to work */
  isolation: auto;
}

.dm-screen-flow-node.is-effect:hover {
  background: transparent;
}

.dm-screen-flow-node.selected {
  /* Selection border is now handled by .selection-border element */
}

.dm-screen-flow-node.is-dragging {
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.2s ease;
}

.dm-screen-flow-node:not(.is-dragging) {
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}

.dm-screen-flow-node.rotating {
  cursor: grabbing !important;
}

.dm-screen-flow-node.resizing {
  cursor: nwse-resize !important;
}

.top-controls {
  position: absolute;
  top: -46px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1001;
  pointer-events: auto;
}

.rotation-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border: 2px solid #6366f1;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.rotation-handle:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  border-width: 3px;
}

.rotation-handle:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.node-action-toolbar {
  display: flex;
  gap: 4px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.node-action-toolbar .v-btn {
  min-width: 28px !important;
  width: 28px !important;
  height: 28px !important;
}

/* Custom rotation-aware resize handles */
.resize-handle {
  position: absolute;
  background: #6366f1;
  border: 2px solid #fff;
  border-radius: 2px;
  z-index: 1002;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  pointer-events: auto;
  cursor: pointer;
}

.resize-handle:hover {
  transform: scale(1.2);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}

.resize-handle.corner {
  width: 12px;
  height: 12px;
}

.resize-handle.edge {
  background: #6366f1;
}

.resize-handle.edge.top,
.resize-handle.edge.bottom {
  width: 40px;
  height: 8px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.resize-handle.edge.left,
.resize-handle.edge.right {
  width: 8px;
  height: 40px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

.resize-handle.top-left {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.resize-handle.top-right {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.resize-handle.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.resize-handle.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}

.resize-handle.edge.top {
  top: -4px;
}

.resize-handle.edge.bottom {
  bottom: -4px;
}

.resize-handle.edge.left {
  left: -4px;
}

.resize-handle.edge.right {
  right: -4px;
}

.selection-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #6366f1;
  pointer-events: none;
  z-index: 999;
}

:deep(.vue-flow__node.selected) {
  outline: none;
}

/* Token settings menu */
.token-settings-menu,
.effect-settings-menu {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(10px);
}

.effect-settings-menu {
  max-height: 70vh;
  overflow-y: auto;
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
}

.color-preset.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5);
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>
