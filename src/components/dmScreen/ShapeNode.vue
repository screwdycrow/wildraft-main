<template>
  <div 
    class="shape-node"
    :class="{ 'is-selected': isSelected }"
    @dblclick.stop="openSettings"
  >
    <!-- SVG Shape Renderer -->
    <svg 
      ref="svgRef"
      class="shape-svg" 
      :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`"
      preserveAspectRatio="none"
      @mousedown="handleSvgMouseDown"
      @click="handleSvgClick"
    >
      <defs>
        <!-- Gradient definitions -->
        <linearGradient 
          v-if="shapeData.fill.type === 'linearGradient'" 
          :id="`gradient-${item.id}`"
          :gradientTransform="`rotate(${shapeData.fill.gradientAngle || 0} 0.5 0.5)`"
        >
          <stop 
            v-for="(stop, idx) in gradientStops" 
            :key="idx"
            :offset="`${stop.offset}%`"
            :stop-color="stop.color"
            :stop-opacity="stop.opacity"
          />
        </linearGradient>
        <radialGradient 
          v-if="shapeData.fill.type === 'radialGradient'" 
          :id="`gradient-${item.id}`"
        >
          <stop 
            v-for="(stop, idx) in gradientStops" 
            :key="idx"
            :offset="`${stop.offset}%`"
            :stop-color="stop.color"
            :stop-opacity="stop.opacity"
          />
        </radialGradient>
        
        <!-- Shadow filter -->
        <filter v-if="shapeData.shadow?.enabled" :id="`shadow-${item.id}`" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow 
            :dx="shapeData.shadow.offsetX" 
            :dy="shapeData.shadow.offsetY" 
            :stdDeviation="shapeData.shadow.blur / 2"
            :flood-color="shapeData.shadow.color"
            :flood-opacity="shapeData.shadow.opacity"
          />
        </filter>
      </defs>
      
      <!-- The shape path -->
      <path
        ref="pathRef"
        :d="shapePath"
        :fill="fillValue"
        :fill-opacity="shapeData.fill.type !== 'none' ? shapeData.fill.opacity : 0"
        :stroke="shapeData.stroke.enabled ? shapeData.stroke.color : 'none'"
        :stroke-width="shapeData.stroke.enabled ? shapeData.stroke.width : 0"
        :stroke-opacity="shapeData.stroke.opacity"
        :stroke-dasharray="shapeData.stroke.dashArray || 'none'"
        :stroke-linecap="shapeData.stroke.lineCap || 'round'"
        :stroke-linejoin="shapeData.stroke.lineJoin || 'round'"
        :filter="shapeData.shadow?.enabled ? `url(#shadow-${item.id})` : 'none'"
        :transform="shapeTransform"
        class="shape-path"
      />
      
      <!-- Path editing overlay (when selected) -->
      <g v-if="isSelected && editablePoints.length > 0" class="path-edit-overlay">
        <!-- Control point lines (for curves) -->
        <template v-for="(point, idx) in editablePoints" :key="`ctrl-line-${idx}`">
          <line
            v-if="point.hasCurve && point.cx1 != null"
            :x1="point.prevX"
            :y1="point.prevY"
            :x2="point.cx1"
            :y2="point.cy1"
            class="control-line"
          />
          <line
            v-if="point.type === 'C' && point.cx2 != null"
            :x1="point.x"
            :y1="point.y"
            :x2="point.cx2"
            :y2="point.cy2"
            class="control-line"
          />
        </template>
        
        <!-- Clickable path segments for adding points -->
        <path
          v-for="(segment, idx) in pathSegments"
          :key="`segment-${idx}`"
          :d="segment.d"
          class="path-segment-hitarea"
          @click.stop="addPointOnSegment(idx, $event)"
        />
        
        <!-- Control points (for curves) -->
        <template v-for="(point, idx) in editablePoints" :key="`ctrl-${idx}`">
          <circle
            v-if="point.hasCurve && point.cx1 != null"
            :cx="point.cx1"
            :cy="point.cy1"
            r="4"
            class="control-point"
            @mousedown.stop="startDrag('control1', idx, $event)"
          />
          <circle
            v-if="point.type === 'C' && point.cx2 != null"
            :cx="point.cx2"
            :cy="point.cy2"
            r="4"
            class="control-point"
            @mousedown.stop="startDrag('control2', idx, $event)"
          />
        </template>
        
        <!-- Main anchor points -->
        <circle
          v-for="(point, idx) in editablePoints"
          :key="`point-${idx}`"
          :cx="point.x"
          :cy="point.y"
          :r="selectedPointIndex === idx ? 6 : 5"
          :class="['anchor-point', { selected: selectedPointIndex === idx }]"
          @mousedown.stop="startDrag('point', idx, $event)"
          @dblclick.stop="togglePointCurve(idx)"
          @contextmenu.prevent.stop="handlePointContextMenu(idx, $event)"
        />
      </g>
    </svg>
    
    <!-- Label -->
    <div 
      v-if="shapeData.label" 
      class="shape-label"
      :style="labelStyle"
    >
      {{ shapeData.label }}
    </div>

    <!-- Point Context Menu -->
    <div
      v-if="showPointMenu"
      class="point-context-menu"
      :style="{ left: `${pointMenuPos.x}px`, top: `${pointMenuPos.y}px` }"
    >
      <button @click="convertPointToLine" :disabled="!canConvertPoint">
        <v-icon icon="mdi-vector-line" size="small" />
        Line
      </button>
      <button @click="convertPointToCurve" :disabled="!canConvertPoint">
        <v-icon icon="mdi-vector-curve" size="small" />
        Curve
      </button>
      <button @click="deletePoint" :disabled="editablePoints.length <= 3" class="delete">
        <v-icon icon="mdi-delete" size="small" />
        Delete
      </button>
    </div>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="480" scrollable>
      <v-card class="shape-settings-dialog">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-shape" class="mr-2" />
          Shape Settings
        </v-card-title>
        <v-divider />
        
        <v-card-text class="pa-0">
          <v-tabs v-model="activeTab" grow>
            <v-tab value="shape">Shape</v-tab>
            <v-tab value="fill">Fill</v-tab>
            <v-tab value="stroke">Stroke</v-tab>
            <v-tab value="effects">Effects</v-tab>
          </v-tabs>
          
          <v-window v-model="activeTab" class="pa-4">
            <!-- Shape Tab -->
            <v-window-item value="shape">
              <div class="text-subtitle-2 mb-3">Shape Type</div>
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
                <div class="text-caption mb-1">Corner Radius: {{ localData.cornerRadius }}px</div>
                <v-slider
                  v-model="localData.cornerRadius"
                  :min="0"
                  :max="50"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-4"
                />
              </template>
              
              <template v-if="localData.shapeType === 'star'">
                <div class="text-caption mb-1">Points: {{ localData.points }}</div>
                <v-slider
                  v-model="localData.points"
                  :min="3"
                  :max="12"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-3"
                />
                <div class="text-caption mb-1">Inner Radius: {{ localData.innerRadius }}%</div>
                <v-slider
                  v-model="localData.innerRadius"
                  :min="10"
                  :max="90"
                  :step="5"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-4"
                />
              </template>
              
              <template v-if="localData.shapeType === 'arrow' || localData.shapeType === 'arrowDouble'">
                <div class="text-caption mb-1">Arrow Head Size: {{ localData.arrowHeadSize }}%</div>
                <v-slider
                  v-model="localData.arrowHeadSize"
                  :min="15"
                  :max="50"
                  :step="5"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-4"
                />
              </template>
              
              <!-- Label -->
              <v-text-field
                v-model="localData.label"
                label="Label Text"
                density="compact"
                variant="outlined"
                hide-details
                class="mb-3"
              />
              
              <div class="d-flex gap-2 mb-3">
                <v-text-field
                  v-model="localData.labelColor"
                  label="Label Color"
                  density="compact"
                  variant="outlined"
                  hide-details
                  style="flex: 1"
                >
                  <template #prepend-inner>
                    <div class="color-preview" :style="{ backgroundColor: localData.labelColor }" />
                  </template>
                </v-text-field>
                <input type="color" v-model="localData.labelColor" class="color-input" />
              </div>
              
              <!-- Transform options -->
              <div class="text-subtitle-2 mt-4 mb-3">Transform</div>
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
            </v-window-item>
            
            <!-- Fill Tab -->
            <v-window-item value="fill">
              <div class="text-subtitle-2 mb-3">Fill Type</div>
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
                <div class="text-caption mb-1">Fill Color</div>
                <div class="d-flex gap-2 mb-3">
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
              </template>
              
              <template v-if="localData.fill.type === 'linearGradient' || localData.fill.type === 'radialGradient'">
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
                    style="flex: 1"
                  />
                  <span class="text-caption" style="width: 30px">{{ stop.offset }}%</span>
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
                  <div class="text-caption mb-1">Gradient Angle: {{ localData.fill.gradientAngle || 0 }}°</div>
                  <v-slider
                    v-model="localData.fill.gradientAngle"
                    :min="0"
                    :max="360"
                    :step="15"
                    thumb-label
                    density="compact"
                    hide-details
                    class="mb-3"
                  />
                </template>
              </template>
              
              <div class="text-caption mb-1">Fill Opacity: {{ Math.round(localData.fill.opacity * 100) }}%</div>
              <v-slider
                v-model="localData.fill.opacity"
                :min="0"
                :max="1"
                :step="0.05"
                thumb-label
                density="compact"
                hide-details
              />
            </v-window-item>
            
            <!-- Stroke Tab -->
            <v-window-item value="stroke">
              <v-switch
                v-model="localData.stroke.enabled"
                label="Enable Stroke"
                color="primary"
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <template v-if="localData.stroke.enabled">
                <div class="text-caption mb-1">Stroke Color</div>
                <div class="d-flex gap-2 mb-3">
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
                
                <div class="text-caption mb-1">Stroke Width: {{ localData.stroke.width }}px</div>
                <v-slider
                  v-model="localData.stroke.width"
                  :min="1"
                  :max="20"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-3"
                />
                
                <div class="text-caption mb-2">Dash Pattern</div>
                <v-btn-toggle 
                  v-model="dashPattern" 
                  density="compact"
                  class="mb-3"
                >
                  <v-btn value="" size="small">Solid</v-btn>
                  <v-btn value="5,5" size="small">Dashed</v-btn>
                  <v-btn value="2,2" size="small">Dotted</v-btn>
                  <v-btn value="10,5,2,5" size="small">Dash-Dot</v-btn>
                </v-btn-toggle>
              </template>
            </v-window-item>
            
            <!-- Effects Tab -->
            <v-window-item value="effects">
              <div class="text-subtitle-2 mb-3">Drop Shadow</div>
              <v-switch
                v-model="localData.shadow.enabled"
                label="Enable Shadow"
                color="primary"
                density="compact"
                hide-details
                class="mb-3"
              />
              
              <template v-if="localData.shadow.enabled">
                <div class="text-caption mb-1">Shadow Color</div>
                <div class="d-flex gap-2 mb-3">
                  <input type="color" v-model="localData.shadow.color" class="color-input" />
                  <v-text-field
                    v-model="localData.shadow.color"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="flex: 1"
                  />
                </div>
                
                <div class="d-flex gap-3 mb-3">
                  <div style="flex: 1">
                    <div class="text-caption mb-1">Offset X</div>
                    <v-slider
                      v-model="localData.shadow.offsetX"
                      :min="-20"
                      :max="20"
                      :step="1"
                      thumb-label
                      density="compact"
                      hide-details
                    />
                  </div>
                  <div style="flex: 1">
                    <div class="text-caption mb-1">Offset Y</div>
                    <v-slider
                      v-model="localData.shadow.offsetY"
                      :min="-20"
                      :max="20"
                      :step="1"
                      thumb-label
                      density="compact"
                      hide-details
                    />
                  </div>
                </div>
                
                <div class="text-caption mb-1">Blur: {{ localData.shadow.blur }}px</div>
                <v-slider
                  v-model="localData.shadow.blur"
                  :min="0"
                  :max="30"
                  :step="1"
                  thumb-label
                  density="compact"
                  hide-details
                  class="mb-3"
                />
                
                <div class="text-caption mb-1">Shadow Opacity: {{ Math.round(localData.shadow.opacity * 100) }}%</div>
                <v-slider
                  v-model="localData.shadow.opacity"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  thumb-label
                  density="compact"
                  hide-details
                />
              </template>
            </v-window-item>
          </v-window>
        </v-card-text>
        
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelSettings">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveSettings">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { DmScreenItem, SVGShapeData, SVGShapeType, SVGShapePreset, SVGGradientStop } from '@/types/dmScreen.types'
import { SVG_SHAPE_PRESETS, SVG_SHAPE_PATHS, getDefaultSVGShapeData } from '@/types/dmScreen.types'

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

const props = defineProps<{
  item: DmScreenItem
  width?: number
  height?: number
  selected?: boolean
  rotation?: number // Parent node rotation in degrees
}>()

const emit = defineEmits<{
  'update:data': [data: any]
}>()

// =====================================================
// STATE
// =====================================================

const svgRef = ref<SVGSVGElement | null>(null)
const pathRef = ref<SVGPathElement | null>(null)
const showSettings = ref(false)
const activeTab = ref('shape')
const viewBoxSize = 100

// Path editing state
const editablePoints = ref<EditablePoint[]>([])
const selectedPointIndex = ref<number | null>(null)
const isDragging = ref(false)
const dragType = ref<'point' | 'control1' | 'control2' | null>(null)
const dragPointIndex = ref<number | null>(null)

// Point context menu
const showPointMenu = ref(false)
const pointMenuPos = ref({ x: 0, y: 0 })
const contextMenuPointIndex = ref<number | null>(null)

// Local editing state for dialog
const localData = ref<SVGShapeData & { gradientStops: SVGGradientStop[] }>(getDefaultLocalData())

// Color presets
const colorPresets = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#14b8a6', '#3b82f6', '#ffffff', '#000000',
]

interface EditablePoint {
  x: number
  y: number
  type: 'M' | 'L' | 'C' | 'Q' | 'Z'
  cx1?: number
  cy1?: number
  cx2?: number
  cy2?: number
  prevX: number
  prevY: number
  hasCurve: boolean
  originalIndex: number
}

// =====================================================
// COMPUTED
// =====================================================

const isSelected = computed(() => props.selected === true)

// Dash pattern computed
const dashPattern = computed({
  get: () => localData.value.stroke.dashArray || '',
  set: (val: string) => { localData.value.stroke.dashArray = val || undefined }
})

// Get shape data from item, with defaults
const shapeData = computed<SVGShapeData>(() => {
  if (props.item.data.shapeData) {
    return props.item.data.shapeData
  }
  
  // Legacy compatibility
  const legacy = props.item.data
  return {
    shapeType: convertLegacyShape(legacy.shape) || 'rectangle',
    fill: {
      type: 'solid',
      color: legacy.color || '#6366f1',
      opacity: legacy.opacity ?? 0.8,
    },
    stroke: {
      enabled: (legacy.borderWidth ?? 2) > 0,
      color: legacy.borderColor || '#ffffff',
      width: legacy.borderWidth ?? 2,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    },
    shadow: {
      enabled: true,
      color: '#000000',
      offsetX: 0,
      offsetY: 2,
      blur: 8,
      opacity: 0.3,
    },
    label: legacy.label,
    labelColor: '#ffffff',
    labelFontSize: 14,
    labelFontWeight: 'bold',
    cornerRadius: 8,
    points: 5,
    innerRadius: 40,
    arrowHeadSize: 30,
  }
})

const gradientStops = computed(() => {
  if (shapeData.value.fill.gradientStops?.length) {
    return shapeData.value.fill.gradientStops
  }
  return [
    { offset: 0, color: shapeData.value.fill.color, opacity: 1 },
    { offset: 100, color: '#ffffff', opacity: 1 },
  ]
})

const fillValue = computed(() => {
  if (shapeData.value.fill.type === 'none') return 'none'
  if (shapeData.value.fill.type === 'solid') return shapeData.value.fill.color
  return `url(#gradient-${props.item.id})`
})

// Generate SVG path from stored data
const storedShapePath = computed(() => {
  // If we have custom path points, use them
  if (shapeData.value.customPath) {
    return shapeData.value.customPath
  }
  
  const type = shapeData.value.shapeType
  const pathGen = SVG_SHAPE_PATHS[type]
  if (!pathGen) return SVG_SHAPE_PATHS.rectangle(viewBoxSize, viewBoxSize)
  
  return pathGen(viewBoxSize, viewBoxSize, {
    cornerRadius: shapeData.value.cornerRadius,
    points: shapeData.value.points,
    innerRadius: shapeData.value.innerRadius,
    arrowHeadSize: shapeData.value.arrowHeadSize,
  })
})

// Path for rendering - uses local editablePoints when editing for immediate feedback
const shapePath = computed(() => {
  // When editing, generate path from local editable points for immediate feedback
  if (editablePoints.value.length > 0 && isSelected.value) {
    return pointsToPath(editablePoints.value)
  }
  return storedShapePath.value
})

const shapeTransform = computed(() => {
  const transforms = []
  if (shapeData.value.flipX) {
    transforms.push(`translate(${viewBoxSize}, 0) scale(-1, 1)`)
  }
  if (shapeData.value.flipY) {
    transforms.push(`translate(0, ${viewBoxSize}) scale(1, -1)`)
  }
  return transforms.join(' ')
})

const labelStyle = computed(() => ({
  color: shapeData.value.labelColor || '#ffffff',
  fontSize: `${shapeData.value.labelFontSize || 14}px`,
  fontWeight: shapeData.value.labelFontWeight || 'bold',
}))

// Path segments for click-to-add
const pathSegments = computed(() => {
  const segments: { d: string; startIdx: number }[] = []
  const points = editablePoints.value
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (curr.type === 'Z') continue
    
    let d = `M ${prev.x} ${prev.y} `
    if (curr.type === 'L') {
      d += `L ${curr.x} ${curr.y}`
    } else if (curr.type === 'C') {
      d += `C ${curr.cx1} ${curr.cy1} ${curr.cx2} ${curr.cy2} ${curr.x} ${curr.y}`
    } else if (curr.type === 'Q') {
      d += `Q ${curr.cx1} ${curr.cy1} ${curr.x} ${curr.y}`
    }
    
    segments.push({ d, startIdx: i - 1 })
  }
  
  return segments
})

const canConvertPoint = computed(() => {
  if (contextMenuPointIndex.value === null) return false
  const point = editablePoints.value[contextMenuPointIndex.value]
  return point && point.type !== 'M' && point.type !== 'Z'
})

// =====================================================
// METHODS
// =====================================================

function getDefaultLocalData() {
  const defaults = getDefaultSVGShapeData()
  return {
    ...defaults,
    gradientStops: [
      { offset: 0, color: defaults.fill.color, opacity: 1 },
      { offset: 100, color: '#ffffff', opacity: 1 },
    ],
  }
}

function convertLegacyShape(shape?: string): SVGShapeType {
  if (!shape) return 'rectangle'
  const map: Record<string, SVGShapeType> = {
    'circle': 'circle',
    'square': 'rectangle',
    'triangle': 'triangle',
  }
  return map[shape] || 'rectangle'
}

// Parse path to editable points
function parsePathToPoints(pathD: string): EditablePoint[] {
  const points: EditablePoint[] = []
  const commands = pathD.match(/[MLCQZ][^MLCQZ]*/gi) || []
  
  let lastX = 0, lastY = 0
  
  for (const cmd of commands) {
    const type = cmd[0].toUpperCase() as 'M' | 'L' | 'C' | 'Q' | 'Z'
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n))
    
    const point: EditablePoint = {
      type,
      x: 0,
      y: 0,
      prevX: lastX,
      prevY: lastY,
      hasCurve: false,
      originalIndex: points.length,
    }
    
    switch (type) {
      case 'M':
      case 'L':
        if (nums.length >= 2) {
          point.x = nums[0]
          point.y = nums[1]
          lastX = point.x
          lastY = point.y
        }
        break
      case 'C':
        if (nums.length >= 6) {
          point.cx1 = nums[0]
          point.cy1 = nums[1]
          point.cx2 = nums[2]
          point.cy2 = nums[3]
          point.x = nums[4]
          point.y = nums[5]
          point.hasCurve = true
          lastX = point.x
          lastY = point.y
        }
        break
      case 'Q':
        if (nums.length >= 4) {
          point.cx1 = nums[0]
          point.cy1 = nums[1]
          point.x = nums[2]
          point.y = nums[3]
          point.hasCurve = true
          lastX = point.x
          lastY = point.y
        }
        break
      case 'Z':
        point.x = points[0]?.x || 0
        point.y = points[0]?.y || 0
        break
    }
    
    points.push(point)
  }
  
  return points
}

// Convert points back to path string
function pointsToPath(points: EditablePoint[]): string {
  let d = ''
  for (const point of points) {
    switch (point.type) {
      case 'M':
        d += `M ${point.x.toFixed(2)} ${point.y.toFixed(2)} `
        break
      case 'L':
        d += `L ${point.x.toFixed(2)} ${point.y.toFixed(2)} `
        break
      case 'C':
        d += `C ${point.cx1?.toFixed(2)} ${point.cy1?.toFixed(2)} ${point.cx2?.toFixed(2)} ${point.cy2?.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)} `
        break
      case 'Q':
        d += `Q ${point.cx1?.toFixed(2)} ${point.cy1?.toFixed(2)} ${point.x.toFixed(2)} ${point.y.toFixed(2)} `
        break
      case 'Z':
        d += 'Z '
        break
    }
  }
  return d.trim()
}

function getSvgCoordinates(event: MouseEvent): { x: number; y: number } {
  if (!svgRef.value) return { x: 0, y: 0 }
  
  // Try to use SVG's native coordinate transformation (most accurate)
  const svg = svgRef.value
  const ctm = svg.getScreenCTM()
  
  if (ctm) {
    // Use SVG's coordinate system transformation
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const svgPoint = point.matrixTransform(ctm.inverse())
    return { x: svgPoint.x, y: svgPoint.y }
  }
  
  // Fallback: manual calculation with rotation compensation
  const rect = svg.getBoundingClientRect()
  const rotation = props.rotation || 0
  
  // Get center of the element
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  
  // Mouse position relative to center
  let mouseX = event.clientX - centerX
  let mouseY = event.clientY - centerY
  
  // Apply inverse rotation if rotated
  if (rotation !== 0) {
    const angleRad = -rotation * Math.PI / 180
    const cos = Math.cos(angleRad)
    const sin = Math.sin(angleRad)
    const rotatedX = mouseX * cos - mouseY * sin
    const rotatedY = mouseX * sin + mouseY * cos
    mouseX = rotatedX
    mouseY = rotatedY
  }
  
  // Use the actual node dimensions from props, or estimate from bounding rect
  const nodeWidth = props.width || rect.width
  const nodeHeight = props.height || rect.height
  
  // Convert to viewBox coordinates
  const scaleX = viewBoxSize / nodeWidth
  const scaleY = viewBoxSize / nodeHeight
  
  return {
    x: (mouseX + nodeWidth / 2) * scaleX,
    y: (mouseY + nodeHeight / 2) * scaleY,
  }
}

// Drag handling
function startDrag(type: 'point' | 'control1' | 'control2', index: number, event: MouseEvent) {
  isDragging.value = true
  dragType.value = type
  dragPointIndex.value = index
  selectedPointIndex.value = index
  closePointMenu()
  
  window.addEventListener('mousemove', handleDrag)
  window.addEventListener('mouseup', stopDrag)
}

function handleDrag(event: MouseEvent) {
  if (!isDragging.value || dragPointIndex.value === null) return
  
  const pos = getSvgCoordinates(event)
  const point = editablePoints.value[dragPointIndex.value]
  if (!point) return
  
  // Clamp to viewbox
  const x = Math.max(0, Math.min(viewBoxSize, pos.x))
  const y = Math.max(0, Math.min(viewBoxSize, pos.y))
  
  switch (dragType.value) {
    case 'point':
      point.x = x
      point.y = y
      // Update next point's prevX/prevY
      if (dragPointIndex.value < editablePoints.value.length - 1) {
        editablePoints.value[dragPointIndex.value + 1].prevX = x
        editablePoints.value[dragPointIndex.value + 1].prevY = y
      }
      break
    case 'control1':
      point.cx1 = x
      point.cy1 = y
      break
    case 'control2':
      point.cx2 = x
      point.cy2 = y
      break
  }
  
  // Don't save during drag - visual feedback is from local editablePoints
  // Save will happen on stopDrag (mouse release)
}

function stopDrag() {
  if (isDragging.value) {
    // Save changes immediately when drag ends
    savePathChanges(true)
  }
  isDragging.value = false
  dragType.value = null
  dragPointIndex.value = null
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)
}

function handleSvgMouseDown(event: MouseEvent) {
  // Close context menu when clicking elsewhere
  if (showPointMenu.value) {
    closePointMenu()
  }
}

function handleSvgClick(event: MouseEvent) {
  // Only stop propagation if we're in edit mode (selected)
  // This allows VueFlow to handle selection when clicking unselected shapes
  if (isSelected.value) {
    event.stopPropagation()
  }
}

function addPointOnSegment(segmentIdx: number, event: MouseEvent) {
  if (!isSelected.value) return
  
  const pos = getSvgCoordinates(event)
  const insertIdx = segmentIdx + 1
  
  const newPoint: EditablePoint = {
    type: 'L',
    x: pos.x,
    y: pos.y,
    prevX: editablePoints.value[insertIdx - 1]?.x || 0,
    prevY: editablePoints.value[insertIdx - 1]?.y || 0,
    hasCurve: false,
    originalIndex: insertIdx,
  }
  
  editablePoints.value.splice(insertIdx, 0, newPoint)
  
  // Update prev references
  if (insertIdx + 1 < editablePoints.value.length) {
    editablePoints.value[insertIdx + 1].prevX = newPoint.x
    editablePoints.value[insertIdx + 1].prevY = newPoint.y
  }
  
  selectedPointIndex.value = insertIdx
  savePathChanges(true) // Immediate save for adding point
}

function togglePointCurve(idx: number) {
  const point = editablePoints.value[idx]
  if (!point || point.type === 'M' || point.type === 'Z') return
  
  if (point.type === 'L') {
    // Convert to quadratic curve
    point.type = 'Q'
    point.cx1 = (point.prevX + point.x) / 2
    point.cy1 = (point.prevY + point.y) / 2 - 20
    point.hasCurve = true
  } else {
    // Convert to line
    point.type = 'L'
    delete point.cx1
    delete point.cy1
    delete point.cx2
    delete point.cy2
    point.hasCurve = false
  }
  
  savePathChanges(true)
}

function handlePointContextMenu(idx: number, event: MouseEvent) {
  contextMenuPointIndex.value = idx
  selectedPointIndex.value = idx
  pointMenuPos.value = { x: event.offsetX, y: event.offsetY }
  showPointMenu.value = true
}

function closePointMenu() {
  showPointMenu.value = false
  contextMenuPointIndex.value = null
}

function convertPointToLine() {
  if (contextMenuPointIndex.value === null) return
  const point = editablePoints.value[contextMenuPointIndex.value]
  if (!point || point.type === 'M' || point.type === 'Z') return
  
  point.type = 'L'
  delete point.cx1
  delete point.cy1
  delete point.cx2
  delete point.cy2
  point.hasCurve = false
  
  savePathChanges(true)
  closePointMenu()
}

function convertPointToCurve() {
  if (contextMenuPointIndex.value === null) return
  const point = editablePoints.value[contextMenuPointIndex.value]
  if (!point || point.type === 'M' || point.type === 'Z') return
  
  point.type = 'C'
  point.cx1 = point.prevX + (point.x - point.prevX) * 0.25
  point.cy1 = point.prevY + (point.y - point.prevY) * 0.25
  point.cx2 = point.prevX + (point.x - point.prevX) * 0.75
  point.cy2 = point.prevY + (point.y - point.prevY) * 0.75
  point.hasCurve = true
  
  savePathChanges(true)
  closePointMenu()
}

function deletePoint() {
  if (contextMenuPointIndex.value === null || editablePoints.value.length <= 3) return
  
  const idx = contextMenuPointIndex.value
  editablePoints.value.splice(idx, 1)
  
  // Update prev references
  if (idx < editablePoints.value.length) {
    const prev = editablePoints.value[idx - 1] || editablePoints.value[0]
    editablePoints.value[idx].prevX = prev.x
    editablePoints.value[idx].prevY = prev.y
  }
  
  selectedPointIndex.value = null
  savePathChanges(true)
  closePointMenu()
}

function savePathChanges(immediate = false) {
  const newPath = pointsToPath(editablePoints.value)
  const updateData = { 
    shapeData: { 
      ...shapeData.value, 
      customPath: newPath,
      shapeType: 'custom' as SVGShapeType,
    } 
  }
  
  if (immediate) {
    emit('update:data', updateData)
  } else {
    debouncedSave(updateData)
  }
}

// Debounced save for smooth dragging
const debouncedSave = debounce((data: any) => {
  emit('update:data', data)
}, 150)

// Settings dialog
function openSettings() {
  const current = shapeData.value
  localData.value = {
    ...current,
    fill: { ...current.fill },
    stroke: { ...current.stroke },
    shadow: current.shadow ? { ...current.shadow } : {
      enabled: true,
      color: '#000000',
      offsetX: 0,
      offsetY: 2,
      blur: 8,
      opacity: 0.3,
    },
    gradientStops: current.fill.gradientStops?.length 
      ? [...current.fill.gradientStops.map(s => ({ ...s }))]
      : [
          { offset: 0, color: current.fill.color, opacity: 1 },
          { offset: 100, color: '#ffffff', opacity: 1 },
        ],
  }
  showSettings.value = true
}

function selectShape(preset: SVGShapePreset) {
  localData.value.shapeType = preset.shapeType
  // Clear custom path when selecting a preset shape
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

function saveSettings() {
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
  
  emit('update:data', { shapeData: newData })
  showSettings.value = false
}

function cancelSettings() {
  showSettings.value = false
}

// Update editable points when stored shape changes (but not during dragging)
watch(storedShapePath, (newPath) => {
  // Don't update points while actively dragging - it would cause a loop
  if (!isDragging.value) {
    editablePoints.value = parsePathToPoints(newPath)
  }
}, { immediate: true })

// Close menu on click outside
function handleGlobalClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.point-context-menu')) {
    closePointMenu()
  }
}

onMounted(() => {
  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<style scoped>
.shape-node {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.shape-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.shape-path {
  vector-effect: non-scaling-stroke;
}

.shape-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  max-width: 80%;
  word-wrap: break-word;
  line-height: 1.2;
}

/* Path editing overlay */
.path-edit-overlay {
  pointer-events: none;
}

.path-edit-overlay .anchor-point,
.path-edit-overlay .control-point,
.path-edit-overlay .path-segment-hitarea {
  pointer-events: auto;
}

.anchor-point {
  fill: #fff;
  stroke: #6366f1;
  stroke-width: 2;
  cursor: move;
  transition: all 0.1s ease;
}

.anchor-point:hover {
  fill: #6366f1;
  r: 7;
}

.anchor-point.selected {
  fill: #f59e0b;
  stroke: #fff;
  stroke-width: 2;
}

.control-point {
  fill: #f59e0b;
  stroke: #fff;
  stroke-width: 1;
  cursor: move;
  opacity: 0.9;
}

.control-point:hover {
  r: 5;
  opacity: 1;
}

.control-line {
  stroke: rgba(245, 158, 11, 0.6);
  stroke-width: 1;
  stroke-dasharray: 3,3;
  pointer-events: none;
}

.path-segment-hitarea {
  fill: none;
  stroke: transparent;
  stroke-width: 16;
  cursor: cell; /* Plus cursor for adding */
}

.path-segment-hitarea:hover {
  stroke: rgba(99, 102, 241, 0.5);
  stroke-dasharray: 4,4;
}

/* Point context menu */
.point-context-menu {
  position: absolute;
  background: rgba(30, 30, 40, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.point-context-menu button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.point-context-menu button:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.2);
}

.point-context-menu button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.point-context-menu button.delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

/* Settings Dialog */
.shape-settings-dialog {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(10px);
}

.shape-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.shape-preset {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.15s ease;
}

.shape-preset:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.shape-preset.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: #6366f1;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

.color-input {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-input-small {
  width: 28px;
  height: 28px;
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

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.gradient-stop {
  background: rgba(255, 255, 255, 0.03);
  padding: 8px;
  border-radius: 6px;
}
</style>
