<template>
  <div class="dm-screen-flow-node-container" :style="containerStyle" :class="containerClass">
    <!-- Custom Rotation-Aware Resize Handles (hidden in portal mode) -->
    <template v-if="showControls">
      <!-- Corner handles -->
      <div class="resize-handle corner top-left" @mousedown.stop="startResize($event, 'top-left')" />
      <div class="resize-handle corner top-right" @mousedown.stop="startResize($event, 'top-right')" />
      <div class="resize-handle corner bottom-left" @mousedown.stop="startResize($event, 'bottom-left')" />
      <div class="resize-handle corner bottom-right" @mousedown.stop="startResize($event, 'bottom-right')" />
      <!-- Edge handles -->
      <div class="resize-handle edge top" @mousedown.stop="startResize($event, 'top')" />
      <div class="resize-handle edge bottom" @mousedown.stop="startResize($event, 'bottom')" />
      <div class="resize-handle edge left" @mousedown.stop="startResize($event, 'left')" />
      <div class="resize-handle edge right" @mousedown.stop="startResize($event, 'right')" />
      <!-- Selection border -->
      <div class="selection-border" />
    </template>

    <!-- Rotation Handle and Action Toolbar (hidden in portal mode) -->
    <div v-if="showControls" class="top-controls">
      <!-- Rotation Handle -->
      <div class="rotation-handle" @mousedown.stop="handleRotationStart">
        <v-icon size="small" color="#6366f1">mdi-rotate-3d-variant</v-icon>
      </div>

      <!-- Action Toolbar -->
      <div class="node-action-toolbar">
        <v-btn icon size="x-small" variant="text" color="white" @click.stop="resetRotation">
          <v-icon size="small">mdi-rotate-left-variant</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Reset Rotation
          </v-tooltip>
        </v-btn>

        <!-- Object Fit Toggle (only for background images) -->
        <v-btn v-if="isBackgroundImage" icon size="x-small" variant="text"
          :color="currentObjectFit === 'cover' ? 'warning' : 'white'" @click.stop="toggleObjectFit">
          <v-icon size="small">{{ currentObjectFit === 'cover' ? 'mdi-crop' : 'mdi-arrow-expand-all' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ currentObjectFit === 'cover' ? 'Cover (cropped)' : 'Fill (stretched)' }} - Click to toggle
          </v-tooltip>
        </v-btn>

        <!-- Convert to Token (for items that can become tokens) -->
        <v-btn v-if="canConvertToToken" icon size="x-small" variant="text" color="white" @click.stop="convertToToken">
          <v-icon size="small">mdi-circle-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Convert to Token
          </v-tooltip>
        </v-btn>

        <!-- Restore from Token -->
        <v-btn v-if="isTokenNode" icon size="x-small" variant="text" color="white" @click.stop="restoreFromToken">
          <v-icon size="small">mdi-card-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Restore to Card
          </v-tooltip>
        </v-btn>

        <!-- Token Settings -->
        <v-btn v-if="isTokenNode" icon size="x-small" variant="text" color="white" @click.stop="openSettings">
          <v-icon size="small">mdi-cog</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Token Settings
          </v-tooltip>
        </v-btn>

        <!-- Effect Settings -->
        <v-btn v-if="isEffectNode" icon size="x-small" variant="text" color="white" @click.stop="openSettings">
          <v-icon size="small">mdi-tune-variant</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Effect Settings
          </v-tooltip>
        </v-btn>

        <!-- Shape Settings -->
        <v-btn v-if="isShapeNode" icon size="x-small" variant="text" color="white" @click.stop="openSettings">
          <v-icon size="small">mdi-shape</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Shape Settings
          </v-tooltip>
        </v-btn>

        <!-- Text Note Settings -->
        <v-btn v-if="isTextNode" icon size="x-small" variant="text" color="white" @click.stop="openSettings">
          <v-icon size="small">mdi-text-box-edit</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Note Settings
          </v-tooltip>
        </v-btn>

        <!-- Minimize / Expand -->
        <v-btn v-if="!isTokenNode && !isBackgroundImage" icon size="x-small" variant="text" color="white" @click.stop="toggleMinimize">
          <v-icon size="small">{{ isItemMinimized ? 'mdi-arrow-expand' : 'mdi-arrow-collapse' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ isItemMinimized ? 'Expand' : 'Minimize' }}
          </v-tooltip>
        </v-btn>

        <v-btn icon size="x-small" variant="text" color="error" @click.stop="handleDelete">
          <v-icon size="small">mdi-close</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Delete
          </v-tooltip>
        </v-btn>
      </div>
    </div>

    <div class="dm-screen-flow-node" :class="{
      'selected': isSelected,
      'is-dragging': props.dragging,
      'rotating': isRotating,
      'resizing': isResizing,
      'is-token': isTokenNode,
      'is-effect': isEffectNode,
      'is-shape': isShapeNode,
      'is-terrain': isTerrainNode,
      'is-minimized': isItemMinimized
    }" @dblclick.stop="handleDoubleClick">
      <dm-screen-item-wrapper v-show="!isItemMinimized" :key="data.item.id" :item="data.item" :library-id="data.libraryId"
        :dm-screen-id="data.dmScreenId" :snap-to-grid="data.snapToGrid" :grid-size="data.gridSize"
        :background-opacity="data.backgroundOpacity" :selected="isSelected" :rotation="rotation"
        @update="handleItemUpdate" @delete="handleDelete" @open-settings="openSettings" />
      <!-- Minimized label -->
      <div v-if="isItemMinimized" class="minimized-label">
        <v-icon size="14" color="rgba(255,255,255,0.6)" class="mr-1">mdi-text-box</v-icon>
        <span>{{ minimizedLabel }}</span>
      </div>
    </div>

    <!-- Settings Dialogs -->
    <!-- Effect Node Settings -->
    <v-dialog v-model="showEffectSettings" max-width="450" scrollable persistent>
      <EffectNodeSettings v-if="showEffectSettings" ref="effectSettingsRef" :config="currentEffectConfig"
        @save="saveEffectSettings" />
    </v-dialog>

    <!-- Token Node Settings -->
    <v-dialog v-model="showTokenSettings" max-width="350" scrollable persistent>
      <TokenNodeSettings v-if="showTokenSettings" ref="tokenSettingsRef" :show-label="tokenShowLabel"
        :border-width="tokenBorderWidth" :border-color="tokenBorderColor" @save="saveTokenSettings" />
    </v-dialog>

    <!-- Shape Node Settings -->
    <v-dialog v-model="showShapeSettings" max-width="500" scrollable persistent>
      <ShapeNodeSettings v-if="showShapeSettings" ref="shapeSettingsRef" :shape-data="currentShapeData"
        @save="saveShapeSettings" />
    </v-dialog>

    <!-- Terrain Node Settings -->
    <v-dialog v-model="showTerrainSettings" max-width="500" scrollable persistent>
      <TerrainNodeSettings v-if="showTerrainSettings" ref="terrainSettingsRef" :config="currentTerrainConfig"
        @save="saveTerrainSettings" @cancel="showTerrainSettings = false" @regenerate="handleTerrainRegenerate" />
    </v-dialog>

    <!-- Text Node Settings -->
    <TextNodeSettings
      v-model="showTextSettings"
      :item="props.data.item"
      @save="saveTextSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { DmScreenItem, SVGShapeData, TerrainConfig, EffectConfig } from '@/types/dmScreen.types'
import DmScreenItemWrapper from './DmScreenItemWrapper.vue'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useItemsStore } from '@/stores/items'
import EffectNodeSettings from './EffectNodeSettings.vue'
import TokenNodeSettings from './TokenNodeSettings.vue'
import ShapeNodeSettings from './ShapeNodeSettings.vue'
import TerrainNodeSettings from './TerrainNodeSettings.vue'
import TextNodeSettings from './TextNodeSettings.vue'

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
    isPortalMode?: boolean // Hide controls in portal view
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
const itemsStore = useItemsStore()
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

// Settings dialog state
const showEffectSettings = ref(false)
const showTokenSettings = ref(false)
const showShapeSettings = ref(false)
const showTerrainSettings = ref(false)
const showTextSettings = ref(false)
const effectSettingsRef = ref<InstanceType<typeof EffectNodeSettings> | null>(null)
const tokenSettingsRef = ref<InstanceType<typeof TokenNodeSettings> | null>(null)
const shapeSettingsRef = ref<InstanceType<typeof ShapeNodeSettings> | null>(null)
const terrainSettingsRef = ref<InstanceType<typeof TerrainNodeSettings> | null>(null)

// Token settings state (local state for editing)
const tokenShowLabel = ref(true)
const tokenBorderWidth = ref(0)
const tokenBorderColor = ref('#6366f1')


// Effect settings state (local state for editing)
const effectIntensity = ref(0.7)
const effectSpeed = ref(1)
const effectScale = ref(1)
const effectOpacity = ref(0.9)
const effectColor = ref('#ff6600')
const effectSecondaryColor = ref('#ffcc00')
const effectParticleCount = ref(50)
const effectPulseSpeed = ref(2)
const effectGlowIntensity = ref(0.8)
const effectLightPoolIntensity = ref(0.5)
const effectLightPoolSize = ref(1.0)
const effectBlendMode = ref('screen')
const effectUseCircleMask = ref(false)
const effectMaskFeatherOpacity = ref(0.5)
const effectMaskFeatherSize = ref(0.5)



// Sync rotation with props when not actively rotating
watch(() => props.data.item.nodeOptions?.rotation, (newRotation) => {
  if (!isRotating.value && newRotation !== undefined) {
    currentRotation.value = newRotation
  }
}, { immediate: false })

// Sync token settings from props (only watch specific token properties)
watch(
  () => [
    props.data.item.type,
    props.data.item.data.tokenShowLabel,
    props.data.item.data.tokenBorderWidth,
    props.data.item.data.tokenBorderColor
  ],
  () => {
    const item = props.data.item
    if (item.type === 'TokenNode') {
      tokenShowLabel.value = item.data.tokenShowLabel !== false
      tokenBorderWidth.value = item.data.tokenBorderWidth || 0
      tokenBorderColor.value = item.data.tokenBorderColor || '#6366f1'
    }
  },
  { immediate: true }
)

// Sync effect settings from props (only watch effectConfig)
watch(
  () => props.data.item.data.effectConfig,
  (config: EffectConfig | undefined) => {
    if (props.data.item.type === 'EffectNode' && config) {
      effectIntensity.value = config.intensity ?? 0.7
      effectSpeed.value = config.speed ?? 1
      effectScale.value = config.scale ?? 1
      effectOpacity.value = config.opacity ?? 0.9
      effectColor.value = config.color || '#ff6600'
      effectSecondaryColor.value = config.secondaryColor || '#ffcc00'
      effectParticleCount.value = config.particleCount ?? 50
      effectPulseSpeed.value = config.pulseSpeed ?? 2
      effectGlowIntensity.value = config.glowIntensity ?? 0.8
      effectLightPoolIntensity.value = config.lightPoolIntensity ?? 0.5
      effectLightPoolSize.value = config.lightPoolSize ?? 1.0
      effectBlendMode.value = config.blendMode || 'screen'
      effectUseCircleMask.value = config.useCircleMask ?? false
      effectMaskFeatherOpacity.value = config.maskFeatherOpacity ?? 0.5
      effectMaskFeatherSize.value = config.maskFeatherSize ?? 0.5
    }
  },
  { immediate: true, deep: true }
)

// =====================================================
// COMPUTED
// =====================================================

const isSelected = computed(() => props.selected || false)
const isPortalMode = computed(() => props.data.isPortalMode || false)

// Show controls only when selected and not in portal mode
const showControls = computed(() => isSelected.value && !isPortalMode.value)

const rotation = computed(() => {
  return currentRotation.value
})

const containerStyle = computed(() => {
  const style: Record<string, string> = {}

  if (rotation.value) {
    style.transform = `rotate(${rotation.value}deg)`
    style.transformOrigin = 'center center'
  }

  // Apply blend mode for effect nodes at the container level
  // This allows the effect to blend with content below on the canvas
  if (isEffectNode.value) {
    const blendMode = currentEffectConfig.value.blendMode || 'screen'
    if (blendMode !== 'normal') {
      style.mixBlendMode = blendMode
    }
  }

  return style
})

const containerClass = computed(() => {
  return {
    'effect-node-blend': isEffectNode.value && (currentEffectConfig.value.blendMode || 'screen') !== 'normal',
  }
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

const isShapeNode = computed(() => {
  return props.data.item.type === 'ShapeNode'
})

const isTerrainNode = computed(() => {
  return props.data.item.type === 'TerrainNode'
})

const isTextNode = computed(() => {
  return props.data.item.type === 'TextNode'
})

const currentEffectConfig = computed(() => {
  return props.data.item.data.effectConfig || {
    effectType: 'fire' as const,
    intensity: 0.7,
    speed: 1,
    scale: 1,
    color: '#ff6600',
    secondaryColor: '#ffcc00',
    opacity: 0.9,
    blendMode: 'screen',
  }
})

const currentShapeData = computed<SVGShapeData>(() => {
  if (props.data.item.data.shapeData) {
    return props.data.item.data.shapeData
  }
  // Return default shape data with no fill
  return {
    shapeType: 'rectangle',
    fill: {
      type: 'none',
      color: '#6366f1',
      opacity: 0.8,
    },
    stroke: {
      enabled: true,
      color: '#ffffff',
      width: 2,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    },
    shadow: {
      enabled: false,
      color: '#000000',
      offsetX: 0,
      offsetY: 2,
      blur: 8,
      opacity: 0.3,
    },
  }
})

const currentTerrainConfig = computed<TerrainConfig>(() => {
  if (props.data.item.data.terrainConfig) {
    return props.data.item.data.terrainConfig
  }
  // Return default terrain config
  return {
    terrainType: 'cave',
    seed: Math.floor(Math.random() * 1000000),
    complexity: 0.5,
    scale: 1,
    primaryColor: '#4a3d3a',
    secondaryColor: '#2d2420',
    shadowColor: '#1a1512',
    fillDensity: 0.45,
    smoothIterations: 4,
    connectRegions: true,
    wallThickness: 2,
    texturePattern: 'noise',
    borderStyle: 'rough',
    hasOutline: true,
    outlineColor: '#1a1512',
    outlineWidth: 2,
  }
})


// Items that can be converted to tokens (LibraryItemId and UserFileId, not backgrounds)
const canConvertToToken = computed(() => {
  const item = props.data.item
  const convertibleTypes = ['LibraryItemId', 'UserFileId', 'DmScreenNode']
  return convertibleTypes.includes(item.type) &&
    !item.data.isBackground &&
    item.type !== 'TokenNode'
})

// Minimized state
const isItemMinimized = computed(() => {
  return props.data.item.isMinimized || false
})

const minimizedLabel = computed(() => {
  const item = props.data.item
  if (item.type === 'TextNode') {
    if (item.data.title) return item.data.title
    const text = item.data.text || 'Text Note'
    return text.length > 30 ? text.substring(0, 30) + '...' : text
  }
  if (item.type === 'ShapeNode') return 'Shape'
  if (item.type === 'EffectNode') return item.data.effectConfig?.effectType || 'Effect'
  if (item.type === 'TerrainNode') return item.data.terrainConfig?.terrainType || 'Terrain'
  return 'Item'
})

function toggleMinimize() {
  const item = props.data.item
  const newMinimized = !item.isMinimized

  if (newMinimized) {
    // Store current dimensions before minimizing
    const node = findNode(props.id)
    const w = node?.dimensions?.width || item.nodeOptions?.width || 260
    const h = node?.dimensions?.height || item.nodeOptions?.height || 160

    const updatedItem: DmScreenItem = {
      ...item,
      isMinimized: true,
      minimizedDimensions: { width: w, height: h },
    }
    handleItemUpdate(updatedItem)

    // Resize node to minimized height
    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id === props.id) {
          return {
            ...n,
            width: w,
            height: 32,
            style: { ...n.style, width: `${w}px`, height: '32px' },
          }
        }
        return n
      })
    )
    dmScreensStore.updateItemDimensions(
      props.data.dmScreenId,
      props.data.libraryId,
      item.id,
      w,
      32
    )
  } else {
    // Restore original dimensions
    const restoreW = item.minimizedDimensions?.width || item.nodeOptions?.width || 260
    const restoreH = item.minimizedDimensions?.height || item.nodeOptions?.height || 160

    const updatedItem: DmScreenItem = {
      ...item,
      isMinimized: false,
    }
    handleItemUpdate(updatedItem)

    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id === props.id) {
          return {
            ...n,
            width: restoreW,
            height: restoreH,
            style: { ...n.style, width: `${restoreW}px`, height: `${restoreH}px` },
          }
        }
        return n
      })
    )
    dmScreensStore.updateItemDimensions(
      props.data.dmScreenId,
      props.data.libraryId,
      item.id,
      restoreW,
      restoreH
    )
  }
}

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

  // Get raw mouse delta in screen space
  const rawDx = event.clientX - resizeStartMouse.value.x
  const rawDy = event.clientY - resizeStartMouse.value.y

  const angleRad = (currentRotation.value * Math.PI) / 180
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  // Transform mouse delta to local (rotated) coordinate space
  // This makes the resize feel natural relative to the rotated handles
  const localDx = rawDx * cos + rawDy * sin
  const localDy = -rawDx * sin + rawDy * cos

  let newWidth = resizeStartDimensions.value.width
  let newHeight = resizeStartDimensions.value.height

  // Calculate dimension changes based on handle
  const handle = resizeHandle.value
  let widthDelta = 0
  let heightDelta = 0
  let anchorX = 0 // -1 = left edge anchored, 0 = center, 1 = right edge anchored
  let anchorY = 0 // -1 = top edge anchored, 0 = center, 1 = bottom edge anchored

  // For shapes, effects, and tokens, resize from center
  const shouldResizeFromCenter = isShapeNode.value || isEffectNode.value || isTerrainNode.value || isTokenNode.value

  if (shouldResizeFromCenter) {
    // Center-based resizing: all handles resize symmetrically from center
    // For center resizing, anchorX = 0 and anchorY = 0
    anchorX = 0
    anchorY = 0

    // Calculate deltas based on handle direction
    if (handle.includes('right')) {
      widthDelta = localDx
    } else if (handle.includes('left')) {
      widthDelta = -localDx
    }

    if (handle.includes('bottom')) {
      heightDelta = localDy
    } else if (handle.includes('top')) {
      heightDelta = -localDy
    }

    // For center-based resizing, we double the delta since we're expanding from center
    // Each handle moves the edge by the full delta, so total size change is 2x
    widthDelta *= 2
    heightDelta *= 2

    // For tokens, enforce 1:1 aspect ratio
    if (isTokenNode.value) {
      // Use the larger absolute change to drive both dimensions
      const delta = Math.abs(widthDelta) > Math.abs(heightDelta) ? widthDelta : heightDelta
      widthDelta = delta
      heightDelta = delta
    }
  } else {
    // Edge-based resizing for other node types
    if (handle.includes('right')) {
      widthDelta = localDx
      anchorX = -1 // Left edge stays put
    }
    if (handle.includes('left')) {
      widthDelta = -localDx
      anchorX = 1 // Right edge stays put
    }
    if (handle.includes('bottom')) {
      heightDelta = localDy
      anchorY = -1 // Top edge stays put
    }
    if (handle.includes('top')) {
      heightDelta = -localDy
      anchorY = 1 // Bottom edge stays put
    }
  }

  // Apply deltas with minimum constraints
  newWidth = Math.max(MIN_WIDTH, resizeStartDimensions.value.width + widthDelta)
  newHeight = Math.max(MIN_HEIGHT, resizeStartDimensions.value.height + heightDelta)

  // Calculate actual change (may be clamped)
  const actualWidthDelta = newWidth - resizeStartDimensions.value.width
  const actualHeightDelta = newHeight - resizeStartDimensions.value.height

  // Calculate position adjustment
  // The node's position is its top-left corner in world space
  // When resizing with rotation, we need to keep the anchor point fixed
  // The anchor point in local space is at (anchorX * width/2, anchorY * height/2) from center

  // Calculate how much the center moves in local space
  // If left edge is anchored (anchorX = -1), center moves right by widthDelta/2
  // If right edge is anchored (anchorX = 1), center moves left by widthDelta/2
  const localCenterDx = -anchorX * actualWidthDelta / 2
  const localCenterDy = -anchorY * actualHeightDelta / 2

  // Transform center movement back to world space
  const worldCenterDx = localCenterDx * cos - localCenterDy * sin
  const worldCenterDy = localCenterDx * sin + localCenterDy * cos

  // The node position is top-left, which is center - (width/2, height/2) in local space
  // But we also need to account for how the top-left moves relative to the new center
  const oldHalfWidth = resizeStartDimensions.value.width / 2
  const oldHalfHeight = resizeStartDimensions.value.height / 2
  const newHalfWidth = newWidth / 2
  const newHalfHeight = newHeight / 2

  // In local space, top-left is at (-halfWidth, -halfHeight) from center
  // Change in top-left position in local space due to size change:
  const localTopLeftDx = -(newHalfWidth - oldHalfWidth)
  const localTopLeftDy = -(newHalfHeight - oldHalfHeight)

  // Transform to world space
  const worldTopLeftDx = localTopLeftDx * cos - localTopLeftDy * sin
  const worldTopLeftDy = localTopLeftDx * sin + localTopLeftDy * cos

  // Final position = start position + center movement + top-left adjustment
  const newX = resizeStartPosition.value.x + worldCenterDx + worldTopLeftDx
  const newY = resizeStartPosition.value.y + worldCenterDy + worldTopLeftDy

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

  // CRITICAL: Update VueFlow node position FIRST to ensure it matches what we're saving
  // This prevents VueFlow from recalculating the position incorrectly
  setNodes((nodes) =>
    nodes.map((node) => {
      if (node.id === props.id) {
        return {
          ...node,
          position: { x, y },
          width,
          height,
          style: {
            ...node.style,
            width: `${width}px`,
            height: `${height}px`,
          },
        }
      }
      return node
    })
  )

  // Save to store (triggers debounced API call)
  // Position is already updated in VueFlow above, so this should maintain it
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

  // Determine label based on item type
  let tokenLabel = item.data.name || item.data.fileName || 'Token'
  let tokenBorderColor = '#6366f1'

  if (item.type === 'DmScreenNode') {
    tokenLabel = item.data.label || 'DM Screen'
    tokenBorderColor = '#9333ea' // Purple for DM screen tokens
  } else if (item.type === 'LibraryItemId' && item.data.id) {
    // Try to get name from store if available
    const libraryItem = itemsStore.getItemById(item.data.id)
    if (libraryItem) {
      tokenLabel = libraryItem.name
    }
  }

  // Store original type and data for restoration
  const tokenItem: DmScreenItem = {
    ...item,
    type: 'TokenNode',
    data: {
      ...item.data,
      originalType: item.type,
      originalData: { ...item.data },
      tokenLabel,
      tokenShowLabel: true,
      tokenBorderWidth: 3,
      tokenBorderColor,
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

function handleDoubleClick() {
  // Only open settings for effect, shape, terrain nodes, not tokens or text nodes
  // TextNode handles double-click for editing internally
  if (isEffectNode.value) {
    showEffectSettings.value = true
  } else if (isShapeNode.value) {
    showShapeSettings.value = true
  } else if (isTerrainNode.value) {
    showTerrainSettings.value = true
  }
}

function openSettings() {
  if (isEffectNode.value) {
    showEffectSettings.value = true
  } else if (isTokenNode.value) {
    showTokenSettings.value = true
  } else if (isShapeNode.value) {
    showShapeSettings.value = true
  } else if (isTerrainNode.value) {
    showTerrainSettings.value = true
  } else if (isTextNode.value) {
    showTextSettings.value = true
  }
}

function saveTokenSettings() {
  if (!tokenSettingsRef.value) return

  const values = tokenSettingsRef.value.getValues()
  const item = props.data.item

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      tokenShowLabel: values.tokenShowLabel,
      tokenBorderWidth: values.tokenBorderWidth,
      tokenBorderColor: values.tokenBorderColor,
    },
  }

  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )

  showTokenSettings.value = false
}

function saveEffectSettings() {
  if (!effectSettingsRef.value) return

  const config = effectSettingsRef.value.getConfig()
  const item = props.data.item

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      effectConfig: config,
    },
  }

  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )

  showEffectSettings.value = false
}

function saveShapeSettings() {
  if (!shapeSettingsRef.value) return

  const shapeData = shapeSettingsRef.value.getShapeData()
  const item = props.data.item

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      shapeData: shapeData,
    },
  }

  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )

  showShapeSettings.value = false
}

function saveTerrainSettings() {
  if (!terrainSettingsRef.value) return

  const terrainConfig = terrainSettingsRef.value.getConfig()
  const item = props.data.item

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      terrainConfig: terrainConfig,
    },
  }

  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )

  showTerrainSettings.value = false
}

function saveTextSettings(newData: Record<string, any>) {
  const item = props.data.item

  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      ...newData,
    },
  }

  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )
}

function handleTerrainRegenerate() {
  if (!terrainSettingsRef.value) return

  const terrainConfig = terrainSettingsRef.value.getConfig()
  const item = props.data.item

  // Save the new config (with new seed)
  const updatedItem: DmScreenItem = {
    ...item,
    data: {
      ...item.data,
      terrainConfig: terrainConfig,
    },
  }

  dmScreensStore.updateItem(
    props.data.dmScreenId,
    props.data.libraryId,
    item.id,
    updatedItem
  )

  // Dispatch a custom event to trigger regeneration in the TerrainNodeDisplay
  // This avoids watcher loops and reactive issues
  window.dispatchEvent(new CustomEvent('terrain-regenerate', {
    detail: { itemId: item.id }
  }))
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
  display: flex;
  flex-direction: column;
}

/* Effect node blend mode - allows blending with canvas content below */
.dm-screen-flow-node-container.effect-node-blend {
  /* Don't isolate so blend modes work with content below */
  isolation: auto;
  /* z-index ensures effect is above content it should illuminate */
  z-index: 100;
}

.dm-screen-flow-node {
  width: 100%;
  height: 100%;
  flex: 1;
  min-width: 30px;
  min-height: 30px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.dm-screen-flow-node.is-token {
  width: 100%;
  height: 100%;
  min-width: 20px;
  min-height: 20px;
  overflow: visible;
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
  /* Ensure content is centered */
  display: flex;
  align-items: center;
  justify-content: center;
}

.dm-screen-flow-node.is-effect:hover {
  background: transparent;
}

.dm-screen-flow-node.is-shape {
  width: 100%;
  height: 100%;
  min-width: 30px;
  min-height: 30px;
  /* Ensure content is centered */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Selection border is now handled by .selection-border element */

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

.resize-handle.edge.top {
  width: 40px;
  height: 8px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.resize-handle.edge.bottom {
  width: 40px;
  height: 8px;
  left: 50%;
  transform: translateX(-50%);
  cursor: ns-resize;
}

.resize-handle.edge.left {
  width: 8px;
  height: 40px;
  top: 50%;
  transform: translateY(-50%);
  cursor: ew-resize;
}

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

/* Settings Section Styling */
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

/* Improved color presets */
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

/* Minimized state */
.dm-screen-flow-node.is-minimized {
  overflow: hidden;
}

.minimized-label {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background: rgba(30, 30, 40, 0.85);
  backdrop-filter: blur(8px);
  border-radius: 6px;
  user-select: none;
}
</style>
