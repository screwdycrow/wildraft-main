<template>
  <div class="effect-node-container">
    <!-- Light pool that illuminates content below (screen blend mode) -->
    <div 
      v-if="hasLightPool"
      class="light-pool"
      :style="lightPoolStyle"
    />
    <!-- Main effect canvas -->
    <div 
      ref="containerRef"
      class="effect-node-display"
      :style="containerGlowStyle"
    />
    
    <!-- Path editor overlay for beam effects -->
    <svg
      v-if="isBeamEffect && isSelected && containerRef"
      ref="pathEditorSvg"
      class="beam-path-editor"
      :viewBox="`0 0 100 100`"
      preserveAspectRatio="none"
    >
      <!-- Path preview -->
      <path
        v-if="currentBeamPath"
        :d="currentBeamPath"
        fill="none"
        stroke="#6366f1"
        :stroke-width="handleStrokeWidth"
        stroke-opacity="0.5"
        class="path-preview"
      />
      
      <!-- Editable points -->
      <g v-if="editablePoints.length > 0">
        <!-- Control lines for curves -->
        <template v-for="(point, idx) in editablePoints" :key="`ctrl-line-${idx}`">
          <line
            v-if="point.hasCurve && point.cx1 != null"
            :x1="point.prevX"
            :y1="point.prevY"
            :x2="point.cx1"
            :y2="point.cy1"
            :stroke-width="handleStrokeWidth"
            class="control-line"
          />
          <line
            v-if="point.type === 'C' && point.cx2 != null"
            :x1="point.x"
            :y1="point.y"
            :x2="point.cx2"
            :y2="point.cy2"
            :stroke-width="handleStrokeWidth"
            class="control-line"
          />
        </template>
        
        <!-- Path segments for adding points -->
        <path
          v-for="(segment, idx) in pathSegments"
          :key="`segment-${idx}`"
          :d="segment.d"
          :stroke-width="hitAreaWidth"
          class="path-segment-hitarea"
          @click.stop="addPointOnSegment(idx, $event)"
        />
        
        <!-- Control points -->
        <template v-for="(point, idx) in editablePoints" :key="`ctrl-${idx}`">
          <circle
            v-if="point.hasCurve && point.cx1 != null"
            :cx="point.cx1"
            :cy="point.cy1"
            :r="controlPointRadius"
            :stroke-width="handleStrokeWidth"
            class="control-point"
            @mousedown.stop="startDrag('control1', idx, $event)"
          />
          <circle
            v-if="point.type === 'C' && point.cx2 != null"
            :cx="point.cx2"
            :cy="point.cy2"
            :r="controlPointRadius"
            :stroke-width="handleStrokeWidth"
            class="control-point"
            @mousedown.stop="startDrag('control2', idx, $event)"
          />
        </template>
        
        <!-- Main path points -->
        <circle
          v-for="(point, idx) in editablePoints"
          :key="`point-${idx}`"
          :cx="point.x"
          :cy="point.y"
          :r="selectedPointIndex === idx ? handleRadius * 1.2 : handleRadius"
          :stroke-width="handleStrokeWidth"
          class="path-point"
          :class="{ 'path-point--selected': selectedPointIndex === idx }"
          @mousedown.stop="startDrag('point', idx, $event)"
          @contextmenu.prevent="showPointContextMenu($event, idx)"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as PIXI from 'pixi.js'
import type { DmScreenItem, EffectConfig } from '@/types/dmScreen.types'

interface Props {
  item: DmScreenItem
  libraryId?: number
  selected?: boolean
  rotation?: number
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  rotation: 0,
})

const emit = defineEmits<{
  'update:path': [path: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const pathEditorSvg = ref<SVGSVGElement | null>(null)
const containerSize = ref({ width: 100, height: 100 })
let app: PIXI.Application | null = null
let animationFrame: number | null = null
let resizeTimeout: number | null = null
let lastFrameTime = 0
const TARGET_FPS = 24 // Lower FPS for better performance

// Non-scaling handle sizes - maintain constant screen size regardless of element scale
const viewBoxSize = 100
const handleRadius = computed(() => {
  // Target screen size for handles in pixels
  const targetScreenSize = 8
  // Get element size
  const elementSize = Math.min(containerSize.value.width, containerSize.value.height)
  // Calculate radius in viewBox units that will appear as targetScreenSize on screen
  return Math.max(2, (targetScreenSize * viewBoxSize) / elementSize)
})

const controlPointRadius = computed(() => handleRadius.value * 0.7)
const handleStrokeWidth = computed(() => handleRadius.value * 0.3)
const hitAreaWidth = computed(() => handleRadius.value * 2)

// Path editing state (for beam effects)
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

const editablePoints = ref<EditablePoint[]>([])
const selectedPointIndex = ref<number | null>(null)
const isDragging = ref(false)
const dragType = ref<'point' | 'control1' | 'control2' | null>(null)
const dragPointIndex = ref<number | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const dragStartPoint = ref({ x: 0, y: 0, cx1: 0, cy1: 0, cx2: 0, cy2: 0 })

// Get effect config
const effectConfig = computed<EffectConfig>(() => {
  return props.item.data.effectConfig || {
    effectType: 'fire',
    intensity: 0.7,
    color: '#ff6600',
    secondaryColor: '#ffcc00',
    speed: 1,
    scale: 1,
    opacity: 0.9,
  }
})

// Check if this is a beam effect
const isBeamEffect = computed(() => {
  return ['electricBeam', 'energyBeam', 'fireColumn'].includes(effectConfig.value.effectType)
})

const isSelected = computed(() => props.selected || false)

// Current beam path
const currentBeamPath = computed(() => {
  return effectConfig.value.beamPath || 'M 50 0 L 50 100'
})

// Path segments for click-to-add
const pathSegments = computed(() => {
  if (editablePoints.value.length < 2) return []
  const segments: { d: string }[] = []
  for (let i = 0; i < editablePoints.value.length - 1; i++) {
    const p1 = editablePoints.value[i]
    const p2 = editablePoints.value[i + 1]
    if (p1.type === 'C' && p1.cx1 != null && p1.cx2 != null) {
      segments.push({ d: `M ${p1.x} ${p1.y} C ${p1.cx1} ${p1.cy1}, ${p1.cx2} ${p1.cy2}, ${p2.x} ${p2.y}` })
    } else if (p1.type === 'Q' && p1.cx1 != null) {
      segments.push({ d: `M ${p1.x} ${p1.y} Q ${p1.cx1} ${p1.cy1}, ${p2.x} ${p2.y}` })
    } else {
      segments.push({ d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}` })
    }
  }
  return segments
})

// Which effects have a light pool
const hasLightPool = computed(() => {
  const lightTypes = ['fire', 'torch', 'campfire', 'embers', 'lightRing', 'aura', 'magicCircle', 'sparkles', 'fireflies', 'spiritualWeapon', 'thunder', 'electricBeam', 'energyBeam', 'fireColumn', 'whirlpool']
  return lightTypes.includes(effectConfig.value.effectType)
})

// Light pool style - radial gradient with configurable blend mode
const lightPoolStyle = computed(() => {
  const config = effectConfig.value
  const color = config.color
  const color2 = config.secondaryColor || color
  
  // Use lightPoolIntensity and lightPoolSize from config, with defaults
  const poolIntensity = config.lightPoolIntensity ?? 0.5
  const poolSize = config.lightPoolSize ?? 1.0 // 1.0 = 100% of container
  
  if (poolIntensity <= 0) return { display: 'none' }
  
  // Calculate size as percentage
  const sizePercent = poolSize * 100
  const offset = (sizePercent - 100) / 2
  
  // Different light pool configurations based on effect type
  const isFireType = ['fire', 'torch', 'campfire', 'embers'].includes(config.effectType)
  const isLightType = ['lightRing', 'aura', 'magicCircle'].includes(config.effectType)
  
  // Use configured blend mode, defaulting to screen for light effects
  const blendMode = config.blendMode || 'screen'
  
  const baseStyle: Record<string, any> = {
    width: `${sizePercent}%`,
    height: `${sizePercent}%`,
    top: `-${offset}%`,
    left: `-${offset}%`,
  }
  
  // Only apply blend mode to light pool if it's not handled at parent level
  // For color-dodge and screen, we may want stronger intensity in the pool
  const intensityMultiplier = blendMode === 'color-dodge' ? 1.2 : 1.0
  
  // Fire effects: light from bottom center, spreading up
  if (isFireType) {
    return {
      ...baseStyle,
      background: `radial-gradient(ellipse 80% 100% at 50% 65%, ${color}${alphaHex(poolIntensity * 0.6 * intensityMultiplier)} 0%, ${color2}${alphaHex(poolIntensity * 0.3 * intensityMultiplier)} 35%, transparent 55%)`,
    }
  }
  
  // Light effects: circular glow from center
  if (isLightType) {
    return {
      ...baseStyle,
      background: `radial-gradient(circle at 50% 50%, ${color}${alphaHex(poolIntensity * 0.5 * intensityMultiplier)} 0%, ${color2}${alphaHex(poolIntensity * 0.25 * intensityMultiplier)} 35%, transparent 60%)`,
    }
  }
  
  // Sparkles/fireflies: softer scattered light
  if (config.effectType === 'spiritualWeapon') {
    // Spiritual weapon: bright golden glow from center
    return {
      ...baseStyle,
      background: `radial-gradient(circle at 50% 50%, ${color}${alphaHex(poolIntensity * 0.4 * intensityMultiplier)} 0%, ${color2}${alphaHex(poolIntensity * 0.2 * intensityMultiplier)} 40%, transparent 65%)`,
    }
  }
  
  // Thunder: bright electric flash
  if (config.effectType === 'thunder') {
    return {
      ...baseStyle,
      background: `radial-gradient(circle at 50% 50%, ${color}${alphaHex(poolIntensity * 0.6 * intensityMultiplier)} 0%, ${color2}${alphaHex(poolIntensity * 0.3 * intensityMultiplier)} 30%, transparent 55%)`,
    }
  }
  
  // Beam effects: vertical column of light
  if (['electricBeam', 'energyBeam', 'fireColumn'].includes(config.effectType)) {
    return {
      ...baseStyle,
      background: `linear-gradient(to bottom, ${color}${alphaHex(poolIntensity * 0.5 * intensityMultiplier)} 0%, ${color2}${alphaHex(poolIntensity * 0.3 * intensityMultiplier)} 50%, ${color}${alphaHex(poolIntensity * 0.2 * intensityMultiplier)} 100%)`,
    }
  }
  
  return {
    ...baseStyle,
    background: `radial-gradient(circle at 50% 50%, ${color}${alphaHex(poolIntensity * 0.3 * intensityMultiplier)} 0%, transparent 50%)`,
  }
})

// Convert 0-1 intensity to hex alpha (00-ff)
function alphaHex(value: number): string {
  const clamped = Math.max(0, Math.min(1, value))
  const hex = Math.round(clamped * 255).toString(16).padStart(2, '0')
  return hex
}

// CSS-based glow (much cheaper than WebGL filters!)
const containerGlowStyle = computed(() => {
  const config = effectConfig.value
  const color = config.color
  const glowTypes = ['fire', 'torch', 'campfire', 'embers', 'lightRing', 'aura', 'magicCircle', 'sparkles', 'fireflies', 'spiritualWeapon', 'thunder', 'electricBeam', 'energyBeam', 'fireColumn', 'whirlpool']
  
  if (glowTypes.includes(config.effectType)) {
    const intensity = config.glowIntensity || 0.8
    const size = 15 * intensity
    return {
      filter: `drop-shadow(0 0 ${size}px ${color})`,
    }
  }
  return {}
})

function hexToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

// Lerp between two colors
function lerpColor(color1: string, color2: string, t: number): number {
  const c1 = hexToNumber(color1)
  const c2 = hexToNumber(color2)
  
  const r1 = (c1 >> 16) & 0xff
  const g1 = (c1 >> 8) & 0xff
  const b1 = c1 & 0xff
  
  const r2 = (c2 >> 16) & 0xff
  const g2 = (c2 >> 8) & 0xff
  const b2 = c2 & 0xff
  
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  
  return (r << 16) | (g << 8) | b
}

// Apply circular mask with feathering to a container
function applyCircleMask(container: PIXI.Container, config: EffectConfig, width: number, height: number) {
  if (!config.useCircleMask) return
  
  // Create a canvas to draw the radial gradient mask
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.5
  
  // Feather size: 0 = no feather (hard edge), 1 = maximum feather (30% of radius)
  const featherSizeRatio = config.maskFeatherSize ?? 0.5
  const maxFeatherSize = radius * 0.3
  const featherSize = maxFeatherSize * featherSizeRatio
  
  // Feather opacity: controls how smooth the transition is
  const featherOpacity = config.maskFeatherOpacity ?? 0.5
  
  // Create radial gradient
  const innerRadius = Math.max(0, radius - featherSize)
  const gradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, radius)
  
  // Center is fully opaque
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  // Start fading at the feather point (smooth transition based on opacity)
  const fadeStart = 1 - (featherSize / radius)
  gradient.addColorStop(fadeStart, 'rgba(255, 255, 255, 1)')
  // Edge fades based on opacity setting (0 = hard, 1 = very smooth)
  const edgeAlpha = 1 - featherOpacity
  gradient.addColorStop(1, `rgba(255, 255, 255, ${edgeAlpha})`)
  
  // Fill the entire canvas with the gradient
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // Create PIXI texture from canvas
  const texture = PIXI.Texture.from(canvas)
  const maskSprite = new PIXI.Sprite(texture)
  
  container.mask = maskSprite
  container.addChild(maskSprite)
}

async function initPixi() {
  if (!containerRef.value) return
  await nextTick()
  
  const container = containerRef.value
  const rect = container.getBoundingClientRect()
  const width = rect.width || container.clientWidth || 150
  const height = rect.height || container.clientHeight || 150

  if (app) cleanup()

  app = new PIXI.Application()
  await app.init({
    width,
    height,
    backgroundAlpha: 0,
    antialias: false,
    resolution: 1,
    autoDensity: false,
    powerPreference: 'low-power',
  })

  app.canvas.style.width = '100%'
  app.canvas.style.height = '100%'
  app.canvas.style.position = 'absolute'
  app.canvas.style.top = '0'
  app.canvas.style.left = '0'

  container.appendChild(app.canvas)
  createEffect()
}

function createEffect() {
  if (!app) return

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  app.stage.removeChildren()

  const config = effectConfig.value
  const width = app.screen.width
  const height = app.screen.height
  const cx = width / 2
  const cy = height / 2
  const scale = Math.min(width, height) / 150

  switch (config.effectType) {
    case 'fire':
    case 'torch':
    case 'campfire':
      createFireEffect(config, cx, cy, width, height, scale)
      break
    case 'lightRing':
    case 'aura':
    case 'magicCircle':
    case 'teleportCircle':
    case 'summoningCircle':
      createLightRingEffect(config, cx, cy, width, height, scale)
      break
    case 'sparkles':
    case 'fireflies':
      createSparklesEffect(config, cx, cy, width, height, scale)
      break
    case 'fog':
    case 'smoke':
    case 'mistyStep':
    case 'deathCloud':
    case 'poisonCloud':
    case 'darkness':
      createFogEffect(config, cx, cy, width, height, scale)
      break
    case 'snow':
    case 'rain':
    case 'blizzard':
      createWeatherEffect(config, cx, cy, width, height, scale)
      break
    case 'embers':
    case 'dust':
      createParticleEffect(config, cx, cy, width, height, scale)
      break
    case 'shadowTendrils':
      createTendrilsEffect(config, cx, cy, width, height, scale)
      break
    case 'whirlpool':
      createWhirlpoolEffect(config, cx, cy, width, height, scale)
      break
    case 'spiritualWeapon':
      createSpiritualWeaponEffect(config, cx, cy, width, height, scale)
      break
    case 'thunder':
      createThunderEffect(config, cx, cy, width, height, scale)
      break
    case 'electricBeam':
    case 'energyBeam':
    case 'fireColumn':
      createBeamEffect(config, cx, cy, width, height, scale)
      break
    case 'grass':
      createGrassEffect(config, cx, cy, width, height, scale)
      break
    case 'water':
      createWaterEffect(config, cx, cy, width, height, scale)
      break
    case 'lava':
      createLavaEffect(config, cx, cy, width, height, scale)
      break
    default:
      createFireEffect(config, cx, cy, width, height, scale)
  }
}

function startAnimation(updateFn: (time: number) => void) {
  const frameInterval = 1000 / TARGET_FPS
  
  function animate(currentTime: number) {
    animationFrame = requestAnimationFrame(animate)
    
    const delta = currentTime - lastFrameTime
    if (delta < frameInterval) return
    
    lastFrameTime = currentTime - (delta % frameInterval)
    updateFn(currentTime * 0.001)
  }
  
  animationFrame = requestAnimationFrame(animate)
}

// =====================================================
// FIRE - Simple round + ellipse particles
// =====================================================

// Particle types: round (primary color) or ellipse (secondary color)
type FlameShape = 'round' | 'ellipse' | 'spark' | 'smoke'
type FlameLayer = 'back' | 'mid' | 'front' | 'spark' | 'smoke'

// Draw a soft round particle (primary color)
function drawRoundParticle(g: PIXI.Graphics, size: number, color: number, alpha: number) {
  g.clear()
  // Soft outer glow
  g.circle(0, 0, size * 2.2)
  g.fill({ color, alpha: alpha * 0.08 })
  g.circle(0, 0, size * 1.7)
  g.fill({ color, alpha: alpha * 0.15 })
  g.circle(0, 0, size * 1.3)
  g.fill({ color, alpha: alpha * 0.25 })
  // Main body
  g.circle(0, 0, size)
  g.fill({ color, alpha: alpha * 0.6 })
  // Inner warm
  g.circle(0, 0, size * 0.6)
  g.fill({ color: 0xffffcc, alpha: alpha * 0.5 })
  // Bright core
  g.circle(0, 0, size * 0.3)
  g.fill({ color: 0xffffff, alpha: alpha * 0.7 })
}

// Draw a sharp ellipse particle (secondary color)
function drawEllipseParticle(g: PIXI.Graphics, size: number, color: number, alpha: number) {
  g.clear()
  // Soft outer glow (tall ellipse)
  g.ellipse(0, 0, size * 0.5, size * 2.5)
  g.fill({ color, alpha: alpha * 0.1 })
  g.ellipse(0, 0, size * 0.4, size * 2.0)
  g.fill({ color, alpha: alpha * 0.2 })
  // Main body (sharp ellipse)
  g.ellipse(0, 0, size * 0.3, size * 1.5)
  g.fill({ color, alpha: alpha * 0.7 })
  // Inner bright
  g.ellipse(0, 0, size * 0.15, size * 1.0)
  g.fill({ color: 0xffffcc, alpha: alpha * 0.6 })
  // Core streak
  g.ellipse(0, 0, size * 0.08, size * 0.6)
  g.fill({ color: 0xffffff, alpha: alpha * 0.8 })
}

// Draw a small spark
function drawSparkParticle(g: PIXI.Graphics, size: number, color: number, alpha: number) {
  g.clear()
  // Glow
  g.circle(0, 0, size * 1.5)
  g.fill({ color, alpha: alpha * 0.2 })
  // Core
  g.circle(0, 0, size * 0.8)
  g.fill({ color: 0xffffcc, alpha: alpha * 0.6 })
  // Bright center
  g.circle(0, 0, size * 0.4)
  g.fill({ color: 0xffffff, alpha: alpha * 0.9 })
}

// Draw smoke puff
function drawSmokeParticle(g: PIXI.Graphics, size: number, color: number, alpha: number) {
  g.clear()
  g.circle(0, 0, size * 1.3)
  g.fill({ color, alpha: alpha * 0.06 })
  g.circle(size * 0.3, -size * 0.2, size * 0.9)
  g.fill({ color, alpha: alpha * 0.05 })
  g.circle(-size * 0.25, size * 0.15, size * 0.8)
  g.fill({ color, alpha: alpha * 0.04 })
  g.circle(0, 0, size * 0.9)
  g.fill({ color, alpha: alpha * 0.1 })
}

function createFireEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  // Main container for mask
  const mainContainer = new PIXI.Container()
  app.stage.addChild(mainContainer)
  applyCircleMask(mainContainer, config, width, height)

  // Create layered containers for depth
  const backContainer = new PIXI.Container()
  const midContainer = new PIXI.Container()
  const frontContainer = new PIXI.Container()
  const sparkContainer = new PIXI.Container()
  const smokeContainer = new PIXI.Container()
  
  mainContainer.addChild(backContainer)
  mainContainer.addChild(midContainer)
  mainContainer.addChild(frontContainer)
  mainContainer.addChild(sparkContainer)
  mainContainer.addChild(smokeContainer)

  const s = config.scale * scale
  // LOTS of particles for volume
  const maxFlames = Math.min(55, Math.round(40 * config.intensity))
  const maxSparks = Math.min(15, Math.round(10 * config.intensity))
  const maxSmoke = Math.min(8, Math.round(5 * config.intensity))
  
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ffff00')

  // Layered base glows - creating a bright central hotspot
  const opacity = config.opacity ?? 0.9
  const baseBack = new PIXI.Graphics()
  baseBack.circle(0, 0, 55 * s)
  baseBack.fill({ color: color1, alpha: 0.15 * opacity })
  baseBack.circle(0, 0, 45 * s)
  baseBack.fill({ color: color1, alpha: 0.2 * opacity })
  baseBack.x = cx
  baseBack.y = cy + height * 0.2
  backContainer.addChild(baseBack)

  const baseMid = new PIXI.Graphics()
  baseMid.circle(0, 0, 38 * s)
  baseMid.fill({ color: color2, alpha: 0.25 * opacity })
  baseMid.circle(0, 0, 28 * s)
  baseMid.fill({ color: color2, alpha: 0.4 * opacity })
  baseMid.circle(0, 0, 20 * s)
  baseMid.fill({ color: 0xffffaa, alpha: 0.45 * opacity })
  baseMid.x = cx
  baseMid.y = cy + height * 0.18
  midContainer.addChild(baseMid)

  // Bright central hotspot - the heart of the fire
  const baseCore = new PIXI.Graphics()
  baseCore.circle(0, 0, 16 * s)
  baseCore.fill({ color: 0xffffcc, alpha: 0.5 * opacity })
  baseCore.circle(0, 0, 12 * s)
  baseCore.fill({ color: 0xffffee, alpha: 0.65 * opacity })
  baseCore.circle(0, 0, 8 * s)
  baseCore.fill({ color: 0xffffff, alpha: 0.8 * opacity })
  baseCore.circle(0, 0, 4 * s)
  baseCore.fill({ color: 0xffffff, alpha: 0.95 * opacity })
  baseCore.x = cx
  baseCore.y = cy + height * 0.16
  frontContainer.addChild(baseCore)

  // Additional inner glow ring that pulses
  const innerGlow = new PIXI.Graphics()
  innerGlow.circle(0, 0, 22 * s)
  innerGlow.fill({ color: 0xffff88, alpha: 0.35 * opacity })
  innerGlow.x = cx
  innerGlow.y = cy + height * 0.17
  midContainer.addChild(innerGlow)

  // Flame particle interface (simplified)
  interface FlameParticle {
    g: PIXI.Graphics
    vx: number
    vy: number
    life: number
    max: number
    active: boolean
    shape: FlameShape
    layer: FlameLayer
    baseSize: number
    size: number
    wobblePhase: number
    wobbleSpeed: number
  }

  const flames: FlameParticle[] = []
  const sparks: FlameParticle[] = []
  const smoke: FlameParticle[] = []
  
  const spawnY = cy + height * 0.24

  // Shape weights - mostly round, some ellipse
  const flameWeights: { shape: FlameShape; weight: number }[] = [
    { shape: 'round', weight: 70 },   // Most particles are round (primary color)
    { shape: 'ellipse', weight: 30 }, // Some sharp ellipses (secondary color)
  ]

  function pickFlameShape(): FlameShape {
    const total = flameWeights.reduce((sum, sw) => sum + sw.weight, 0)
    let r = Math.random() * total
    for (const sw of flameWeights) {
      r -= sw.weight
      if (r <= 0) return sw.shape
    }
    return 'round'
  }

  function pickLayer(): FlameLayer {
    const r = Math.random()
    if (r < 0.3) return 'back'
    if (r < 0.7) return 'mid'
    return 'front'
  }

  function getContainer(layer: FlameLayer): PIXI.Container {
    switch (layer) {
      case 'back': return backContainer
      case 'mid': return midContainer
      case 'front': return frontContainer
      case 'spark': return sparkContainer
      case 'smoke': return smokeContainer
    }
  }

  // Pre-create flame particles
  for (let i = 0; i < maxFlames; i++) {
    const layer = pickLayer()
    const g = new PIXI.Graphics()
    g.visible = false
    getContainer(layer).addChild(g)
    flames.push({
      g, vx: 0, vy: 0, life: 0, max: 0, active: false,
      shape: 'round', layer, baseSize: 10, size: 10,
      wobblePhase: 0, wobbleSpeed: 0,
    })
  }

  // Pre-create sparks
  for (let i = 0; i < maxSparks; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    sparkContainer.addChild(g)
    sparks.push({
      g, vx: 0, vy: 0, life: 0, max: 0, active: false,
      shape: 'spark', layer: 'spark', baseSize: 3, size: 3,
      wobblePhase: 0, wobbleSpeed: 0,
    })
  }

  // Pre-create smoke
  for (let i = 0; i < maxSmoke; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    smokeContainer.addChild(g)
    smoke.push({
      g, vx: 0, vy: 0, life: 0, max: 0, active: false,
      shape: 'smoke', layer: 'smoke', baseSize: 15, size: 15,
      wobblePhase: 0, wobbleSpeed: 0,
    })
  }

  function drawFlameParticle(p: FlameParticle, color: number, alpha: number) {
    const sz = p.size * s
    switch (p.shape) {
      case 'round': 
        drawRoundParticle(p.g, sz, color1, alpha)  // Primary color for round
        break
      case 'ellipse': 
        drawEllipseParticle(p.g, sz, color2, alpha)  // Secondary color for ellipse
        break
      case 'spark': 
        drawSparkParticle(p.g, sz, color, alpha)
        break
      case 'smoke': 
        drawSmokeParticle(p.g, sz, 0x444444, alpha)
        break
    }
  }

  function spawnFlame() {
    const p = flames.find(x => !x.active)
    if (!p) return

    p.active = true
    p.g.visible = true
    p.shape = pickFlameShape()

    // Size based on shape and layer
    const layerMult = p.layer === 'back' ? 1.3 : (p.layer === 'front' ? 0.8 : 1.0)
    switch (p.shape) {
      case 'round': p.baseSize = (4 + Math.random() * 5) * layerMult; break
      case 'ellipse': p.baseSize = (3 + Math.random() * 4) * layerMult; break
      default: p.baseSize = 4 * layerMult
    }
    p.size = p.baseSize

    // Spawn position - wide at base
    const spreadX = 55 * s
    p.g.x = cx + (Math.random() - 0.5) * spreadX
    p.g.y = spawnY + (Math.random() - 0.5) * 12 * s

    // Velocity
    p.vx = (Math.random() - 0.5) * 1.8 * s
    p.vy = -(2.0 + Math.random() * 2.8) * config.speed * s

    // Lifespan
    p.max = 40 + Math.random() * 35
    p.life = p.max

    // Animation params
    p.wobblePhase = Math.random() * Math.PI * 2
    p.wobbleSpeed = 2.5 + Math.random() * 3

    // Initial draw
    const layerAlpha = p.layer === 'front' ? 0.95 : (p.layer === 'back' ? 0.7 : 0.85)
    drawFlameParticle(p, 0, layerAlpha)
    
    if (p.shape === 'round') {
      // Round: start big, will shrink
      p.g.scale.set(0.3)
      p.g.alpha = 0
      p.g.rotation = 0
    } else {
      // Ellipse: start very tiny, will grow
      p.g.scale.set(0.05)
      p.g.alpha = 0
      p.g.rotation = (Math.random() - 0.5) * 0.4
    }
  }

  function spawnSpark() {
    const p = sparks.find(x => !x.active)
    if (!p) return

    p.active = true
    p.g.visible = true
    p.baseSize = 2 + Math.random() * 3
    p.size = p.baseSize

    // Spawn from fire area with upward burst
    p.g.x = cx + (Math.random() - 0.5) * 40 * s
    p.g.y = spawnY - Math.random() * 20 * s

    // Fast upward with spread
    p.vx = (Math.random() - 0.5) * 3 * s
    p.vy = -(3 + Math.random() * 4) * config.speed * s

    p.max = 20 + Math.random() * 15
    p.life = p.max
    p.wobblePhase = Math.random() * Math.PI * 2

    drawFlameParticle(p, 0xffffaa, 0.9)
    p.g.rotation = Math.random() * Math.PI * 2
    p.g.scale.set(0.1)  // Start tiny
    p.g.alpha = 0       // Start invisible
  }

  function spawnSmoke() {
    const p = smoke.find(x => !x.active)
    if (!p) return

    p.active = true
    p.g.visible = true
    p.baseSize = 12 + Math.random() * 10
    p.size = p.baseSize

    // Spawn above flames
    p.g.x = cx + (Math.random() - 0.5) * 30 * s
    p.g.y = cy - height * 0.1

    // Slow drift upward
    p.vx = (Math.random() - 0.5) * 0.5 * s
    p.vy = -(0.4 + Math.random() * 0.6) * config.speed * s

    p.max = 80 + Math.random() * 40
    p.life = p.max
    p.wobblePhase = Math.random() * Math.PI * 2
    p.wobbleSpeed = 0.8 + Math.random()

    drawFlameParticle(p, 0x444444, 0.15)
    p.g.scale.set(0.2)  // Start small
    p.g.alpha = 0       // Start invisible
  }

  // Initial spawn
  for (let i = 0; i < maxFlames * 0.6; i++) spawnFlame()
  for (let i = 0; i < 3; i++) spawnSpark()

  let flameTimer = 0
  let sparkTimer = 0
  let smokeTimer = 0
  const flameRate = 1.2 / config.speed
  const sparkRate = 8 / config.speed
  const smokeRate = 20 / config.speed

  startAnimation((t) => {
    // Spawn flames
    flameTimer++
    if (flameTimer > flameRate) {
      spawnFlame()
      spawnFlame()
      if (Math.random() > 0.5) spawnFlame()
      if (Math.random() > 0.7) spawnFlame()
      flameTimer = 0
    }

    // Spawn sparks occasionally
    sparkTimer++
    if (sparkTimer > sparkRate) {
      if (Math.random() > 0.4) {
        spawnSpark()
        if (Math.random() > 0.6) spawnSpark()
      }
      sparkTimer = 0
    }

    // Spawn smoke rarely
    smokeTimer++
    if (smokeTimer > smokeRate) {
      if (Math.random() > 0.5) spawnSmoke()
      smokeTimer = 0
    }

    // Animate base glows with natural flicker
    const flicker1 = Math.sin(t * 7 * config.speed) * 0.08 + Math.sin(t * 11 * config.speed) * 0.05 + Math.random() * 0.03
    const flicker2 = Math.sin(t * 9 * config.speed) * 0.1 + Math.sin(t * 14 * config.speed) * 0.06 + Math.random() * 0.04
    const flicker3 = Math.sin(t * 15 * config.speed) * 0.15 + Math.sin(t * 22 * config.speed) * 0.08 + Math.random() * 0.06
    const corePulse = Math.sin(t * 6 * config.speed) * 0.2 + Math.sin(t * 18 * config.speed) * 0.1 + Math.random() * 0.08
    
    baseBack.scale.set(1 + flicker1)
    baseBack.alpha = (0.18 + flicker1 * 0.4) * opacity
    
    baseMid.scale.set(1 + flicker2)
    baseMid.alpha = (0.32 + flicker2 * 0.35) * opacity
    
    // Bright pulsing central core
    baseCore.scale.set(1 + flicker3 * 1.3)
    baseCore.alpha = (0.7 + corePulse * 0.3) * opacity
    
    // Inner glow ring pulses opposite to core for dynamic effect
    innerGlow.scale.set(1 + corePulse * 0.8)
    innerGlow.alpha = (0.3 + flicker2 * 0.25 + Math.sin(t * 10 * config.speed) * 0.1) * opacity

    // Update flames
    for (const p of flames) {
      if (!p.active) continue

      p.life--
      const lifeRatio = p.life / p.max

      // Wobble movement
      const wobble = Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 0.5 * s * lifeRatio
      p.g.x += p.vx * lifeRatio + wobble
      p.g.y += p.vy

      // Converge towards center
      const dxFromCenter = p.g.x - cx
      p.g.x -= dxFromCenter * 0.012

      // Age: 0 at spawn, 1 at death
      const age = 1 - lifeRatio

      let scaleMult: number
      let alphaMult: number
      const baseAlpha = (p.layer === 'front' ? 0.95 : (p.layer === 'back' ? 0.65 : 0.8)) * opacity

      if (p.shape === 'round') {
        // ROUND: Start big, shrink and fade away
        // Quick fade-in at start, then continuous shrink
        if (age < 0.08) {
          // Very quick pop in
          const fadeIn = age / 0.08
          scaleMult = 0.3 + 0.7 * Math.pow(fadeIn, 0.3)
          alphaMult = Math.pow(fadeIn, 0.4)
        } else {
          // Continuous shrink from 1.0 to 0.1
          const shrinkProgress = (age - 0.08) / 0.92
          scaleMult = 1.0 - 0.9 * Math.pow(shrinkProgress, 0.7)
          // Alpha fades with shrink
          alphaMult = 1.0 - Math.pow(shrinkProgress, 0.6)
        }
      } else {
        // ELLIPSE (flame tongues): Start very tiny, grow bigger, then fade out
        if (age < 0.6) {
          // Grow from tiny (0.05) to big (1.3) over 60% of life
          const growProgress = age / 0.6
          scaleMult = 0.05 + 1.25 * Math.pow(growProgress, 0.6)
          // Alpha fades in during growth
          alphaMult = Math.min(1.0, growProgress * 1.5)
        } else {
          // Last 40%: stay big then shrink and fade
          const fadeProgress = (age - 0.6) / 0.4
          scaleMult = 1.3 - 1.2 * Math.pow(fadeProgress, 0.8)
          alphaMult = 1.0 - Math.pow(fadeProgress, 0.5)
        }
      }

      p.g.scale.set(Math.max(0.05, scaleMult))
      p.g.alpha = baseAlpha * Math.max(0, alphaMult)

      // Redraw periodically (colors are set by shape type in drawFlameParticle)
      if (p.life % 5 === 0) {
        drawFlameParticle(p, 0, p.g.alpha)
      }

      if (p.life <= 0) {
        p.active = false
        p.g.visible = false
      }
    }

    // Update sparks
    for (const p of sparks) {
      if (!p.active) continue

      p.life--
      const lifeRatio = p.life / p.max
      const age = 1 - lifeRatio

      // Fast upward with slight curve
      p.g.x += p.vx * 0.95
      p.g.y += p.vy
      p.vy *= 0.98 // Slow down slightly
      p.vx += (Math.random() - 0.5) * 0.15 * s

      // Sparks: quick fade in (10%), then fade out
      let sparkScale: number
      let sparkAlpha: number
      if (age < 0.1) {
        // Quick pop in
        const fadeIn = age / 0.1
        sparkScale = 0.1 + 0.9 * Math.pow(fadeIn, 0.3)
        sparkAlpha = Math.pow(fadeIn, 0.5) * 0.9
      } else {
        // Fade out
        const fadeOut = (age - 0.1) / 0.9
        sparkScale = 1.0 - fadeOut * 0.7
        sparkAlpha = (1 - Math.pow(fadeOut, 0.6)) * 0.9
      }
      p.g.scale.set(Math.max(0.1, sparkScale))
      p.g.alpha = sparkAlpha
      p.g.rotation += 0.1

      if (p.life <= 0) {
        p.active = false
        p.g.visible = false
      }
    }

    // Update smoke
    for (const p of smoke) {
      if (!p.active) continue

      p.life--
      const lifeRatio = p.life / p.max
      const age = 1 - lifeRatio

      // Slow drift with wobble
      const wobble = Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 0.3 * s
      p.g.x += p.vx + wobble
      p.g.y += p.vy

      // Smoke: fade in (20%), expand throughout, fade out
      let smokeScale: number
      let smokeAlpha: number
      if (age < 0.2) {
        // Fade in: start tiny, grow
        const fadeIn = age / 0.2
        smokeScale = 0.2 + 0.5 * Math.pow(fadeIn, 0.6)
        smokeAlpha = Math.pow(fadeIn, 0.5) * 0.12 * opacity
      } else {
        // Continue expanding and fade out
        const expandProgress = (age - 0.2) / 0.8
        smokeScale = 0.7 + expandProgress * 1.3
        smokeAlpha = (1 - Math.pow(expandProgress, 0.7)) * 0.12 * opacity
      }
      p.g.scale.set(smokeScale)
      p.g.alpha = smokeAlpha

      if (p.life <= 0) {
        p.active = false
        p.g.visible = false
      }
    }
  })
}

// =====================================================
// LIGHT RING - Animated rings with center
// =====================================================
function createLightRingEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const maxR = Math.min(width, height) * 0.38
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const ringCount = config.effectType === 'magicCircle' ? 3 : 2
  const opacity = config.opacity ?? 0.9

  // Center fill
  const center = new PIXI.Graphics()
  center.circle(0, 0, maxR * 0.25)
  center.fill({ color: color1, alpha: 0.5 * opacity })
  center.circle(0, 0, maxR * 0.12)
  center.fill({ color: 0xffffff, alpha: 0.4 * opacity })
  center.x = cx
  center.y = cy
  container.addChild(center)

  // Rings
  const rings: { g: PIXI.Graphics; phase: number; dir: number }[] = []
  for (let i = 0; i < ringCount; i++) {
    const g = new PIXI.Graphics()
    const r = maxR * (1 - i * 0.22)
    const thick = (3 - i * 0.5) * scale
    
    g.setStrokeStyle({ width: thick, color: i === 0 ? color1 : color2, alpha: (0.85 - i * 0.15) * opacity })
    g.circle(0, 0, r)
    g.stroke()
    
    // Inner glow ring
    g.setStrokeStyle({ width: thick * 3, color: i === 0 ? color1 : color2, alpha: 0.2 * opacity })
    g.circle(0, 0, r)
    g.stroke()

    if (config.effectType === 'magicCircle' && i === 0) {
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2
        g.setStrokeStyle({ width: 2 * scale, color: color2, alpha: 0.6 * opacity })
        g.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5)
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        g.stroke()
      }
    }

    g.x = cx
    g.y = cy
    container.addChild(g)
    rings.push({ g, phase: i * 1.2, dir: i % 2 === 0 ? 1 : -1 })
  }

  const pulse = config.pulseSpeed || 2
  startAnimation((t) => {
    center.scale.set(1 + Math.sin(t * pulse * 1.5) * 0.18)
    center.alpha = (0.45 + Math.sin(t * pulse * 2) * 0.2) * opacity

    for (const r of rings) {
      r.g.rotation += 0.008 * config.speed * r.dir
      r.g.scale.set(1 + Math.sin(t * pulse + r.phase) * 0.05)
      r.g.alpha = (0.7 + Math.sin(t * 1.5 + r.phase) * 0.25) * opacity
    }
  })
}

// =====================================================
// SPARKLES / FIREFLIES - Very simple dots
// =====================================================
function createSparklesEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  // Very few sparkles for performance
  const count = Math.min(12, Math.round(8 * config.intensity))
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ffffff')
  const opacity = config.opacity ?? 0.9

  interface Sparkle { g: PIXI.Graphics; x: number; y: number; phase: number; speed: number }
  const sparkles: Sparkle[] = []

  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics()
    const size = (3 + Math.random() * 4) * s
    // Simple filled circle with color blend
    const col = i % 2 === 0 ? color1 : color2
    g.circle(0, 0, size)
    g.fill({ color: col, alpha: 0.9 * opacity })
    g.circle(0, 0, size * 0.5)
    g.fill({ color: 0xffffff, alpha: 0.7 * opacity })

    const bx = Math.random() * width
    const by = Math.random() * height
    g.x = bx
    g.y = by
    container.addChild(g)

    sparkles.push({ g, x: bx, y: by, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() })
  }

  startAnimation((t) => {
    for (const sp of sparkles) {
      const twinkle = Math.sin(t * sp.speed * 3 + sp.phase)
      sp.g.alpha = (0.3 + (twinkle + 1) * 0.35) * opacity
      sp.g.scale.set(0.6 + (twinkle + 1) * 0.25)

      if (config.effectType === 'fireflies') {
        sp.g.x = sp.x + Math.sin(t * sp.speed * 0.8 + sp.phase) * 12 * s
        sp.g.y = sp.y + Math.cos(t * sp.speed * 0.6 + sp.phase) * 12 * s
      }
    }
  })
}

// =====================================================
// FOG / SMOKE - Large visible clouds with blur and masks
// =====================================================
function createFogEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const color = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const isSmoke = config.effectType === 'smoke'
  // More clouds for better coverage, but smaller
  const count = Math.min(15, Math.round(10 * config.intensity))

  interface Cloud {
    g: PIXI.Graphics
    mask: PIXI.Graphics
    container: PIXI.Container
    blurFilter: PIXI.BlurFilter | null
    vx: number
    vy: number
    phase: number
    baseSize: number
    baseAlpha: number
  }
  const clouds: Cloud[] = []

  for (let i = 0; i < count; i++) {
    const cloudContainer = new PIXI.Container()
    container.addChild(cloudContainer)
    
    // Create blur filter for each cloud
    let blurFilter: PIXI.BlurFilter | null = null
    try {
      blurFilter = new PIXI.BlurFilter()
      blurFilter.blur = 12 * s // More blur for cloudier look
      blurFilter.quality = 4 // Higher quality blur
      cloudContainer.filters = [blurFilter]
    } catch (e) {
      console.warn('BlurFilter not available, using manual blur effect')
    }

    const g = new PIXI.Graphics()
    const baseSize = (45 + Math.random() * 40) * s // Slightly bigger particles: 45-85
    const baseAlpha = config.opacity * (0.5 + Math.random() * 0.3)
    
    // Create feathered mask
    const mask = new PIXI.Graphics()
    
    // Draw cloud with many overlapping circles for more cloud-like appearance
    const col = i % 2 === 0 ? color : color2
    const numCircles = 12 + Math.floor(Math.random() * 8) // 12-19 circles per cloud for more cloudiness
    
    for (let j = 0; j < numCircles; j++) {
      const angle = (j / numCircles) * Math.PI * 2
      const offset = (Math.random() - 0.5) * baseSize * 0.7
      const circleX = Math.cos(angle) * offset
      const circleY = Math.sin(angle) * offset
      const circleSize = baseSize * (0.35 + Math.random() * 0.6)
      const circleAlpha = baseAlpha * (0.5 + Math.random() * 0.5)
      
      // Main cloud circle with softer edges (achieved through multiple layers)
      // Outer soft edge
      g.circle(circleX, circleY, circleSize * 1.2)
      g.fill({ color: col, alpha: circleAlpha * 0.2 })
      // Mid soft edge
      g.circle(circleX, circleY, circleSize * 1.1)
      g.fill({ color: col, alpha: circleAlpha * 0.4 })
      // Main cloud circle
      g.circle(circleX, circleY, circleSize)
      g.fill({ color: col, alpha: circleAlpha })
      
      // Additional smaller circles for detail and cloudiness
      const numDetails = 2 + Math.floor(Math.random() * 3)
      for (let d = 0; d < numDetails; d++) {
        const detailX = circleX + (Math.random() - 0.5) * circleSize * 0.6
        const detailY = circleY + (Math.random() - 0.5) * circleSize * 0.6
        const detailSize = circleSize * (0.25 + Math.random() * 0.35)
        g.circle(detailX, detailY, detailSize)
        g.fill({ color: col, alpha: circleAlpha * (0.6 + Math.random() * 0.3) })
      }
    }
    
    // Create feathered circular mask using radial gradient technique
    const maskSize = baseSize * 1.5
    // Draw mask with smooth feathering - create gradient effect with concentric circles
    const maskLayers = 30
    for (let layer = 0; layer < maskLayers; layer++) {
      const progress = layer / maskLayers
      // Use smoothstep for better feathering
      const smoothProgress = progress * progress * (3 - 2 * progress)
      const radius = maskSize * (0.15 + smoothProgress * 0.85)
      // Alpha increases from center to edge for mask (white = visible, alpha controls visibility)
      // Use exponential falloff for smoother edge
      const alpha = Math.pow(smoothProgress, 1.5)
      mask.circle(0, 0, radius)
      mask.fill({ color: 0xffffff, alpha: alpha / maskLayers * 3 })
    }
    
    cloudContainer.addChild(g)
    cloudContainer.mask = mask
    cloudContainer.addChild(mask)
    
    // Position
    cloudContainer.x = Math.random() * width
    cloudContainer.y = isSmoke ? height * 0.7 + Math.random() * height * 0.3 : Math.random() * height

    clouds.push({
      g,
      mask,
      container: cloudContainer,
      blurFilter,
      vx: (Math.random() - 0.5) * 1.2 * config.speed * s, // Faster: 0.4 -> 1.2
      vy: isSmoke ? -1.5 * config.speed * s : (Math.random() - 0.5) * 0.5 * config.speed * s, // Faster: -0.5 -> -1.5, 0.15 -> 0.5
      phase: Math.random() * Math.PI * 2,
      baseSize,
      baseAlpha,
    })
  }

  startAnimation((t) => {
    for (const c of clouds) {
      const cloudContainer = c.container
      if (!cloudContainer) continue
      
      cloudContainer.x += c.vx + Math.sin(t * 0.5 + c.phase) * 0.3 * s
      cloudContainer.y += c.vy
      
      // Calculate distance from edges for fade-out
      const edgeFadeDistance = Math.min(width, height) * 0.15 // Fade zone is 15% of smaller dimension
      const distFromLeft = cloudContainer.x
      const distFromRight = width - cloudContainer.x
      const distFromTop = cloudContainer.y
      const distFromBottom = height - cloudContainer.y
      
      // Calculate fade factor (1.0 = fully visible, 0.0 = fully faded)
      let edgeFade = 1.0
      if (distFromLeft < edgeFadeDistance) {
        edgeFade = Math.min(edgeFade, distFromLeft / edgeFadeDistance)
      }
      if (distFromRight < edgeFadeDistance) {
        edgeFade = Math.min(edgeFade, distFromRight / edgeFadeDistance)
      }
      if (distFromTop < edgeFadeDistance) {
        edgeFade = Math.min(edgeFade, distFromTop / edgeFadeDistance)
      }
      if (distFromBottom < edgeFadeDistance) {
        edgeFade = Math.min(edgeFade, distFromBottom / edgeFadeDistance)
      }
      
      // Opacity variation with config opacity - respect the opacity setting
      const alphaVariation = 0.9 + Math.sin(t * 0.3 + c.phase) * 0.1
      cloudContainer.alpha = c.baseAlpha * alphaVariation * edgeFade
      
      // Scale variation for breathing effect
      const scaleVariation = 1 + Math.sin(t * 0.2 + c.phase) * 0.1
      cloudContainer.scale.set(scaleVariation)
      
      // Update blur intensity slightly for more dynamic clouds
      if (c.blurFilter) {
        c.blurFilter.blur = (12 + Math.sin(t * 0.15 + c.phase) * 2) * s
      }

      // Wrap (with fade consideration - only wrap when fully faded)
      if (cloudContainer.x < -c.baseSize * 2) {
        cloudContainer.x = width + c.baseSize * 2
        cloudContainer.alpha = 0 // Start invisible
      }
      if (cloudContainer.x > width + c.baseSize * 2) {
        cloudContainer.x = -c.baseSize * 2
        cloudContainer.alpha = 0 // Start invisible
      }
      if (isSmoke) {
        if (cloudContainer.y < -c.baseSize * 2) {
          cloudContainer.y = height * 0.8
          cloudContainer.x = cx + (Math.random() - 0.5) * width * 0.5
          cloudContainer.alpha = 0 // Start invisible
        }
      } else {
        if (cloudContainer.y < -c.baseSize * 2) {
          cloudContainer.y = height + c.baseSize * 2
          cloudContainer.alpha = 0 // Start invisible
        }
        if (cloudContainer.y > height + c.baseSize * 2) {
          cloudContainer.y = -c.baseSize * 2
          cloudContainer.alpha = 0 // Start invisible
        }
      }
    }
  })
}

// =====================================================
// WEATHER - Snow / Rain
// =====================================================
function createWeatherEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const isSnow = config.effectType === 'snow'
  const count = Math.min(30, Math.round(20 * config.intensity * Math.sqrt(scale)))
  const color = hexToNumber(config.color)
  const opacity = config.opacity ?? 0.9

  interface Drop { g: PIXI.Graphics; vx: number; vy: number; phase: number }
  const drops: Drop[] = []

  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics()
    const size = isSnow ? (2 + Math.random() * 3) * s : (1 + Math.random()) * s

    if (isSnow) {
      g.circle(0, 0, size)
      g.fill({ color: 0xffffff, alpha: 0.85 * opacity })
    } else {
      g.rect(-0.5, -size * 2, 1, size * 4)
      g.fill({ color, alpha: 0.6 * opacity })
    }

    g.x = Math.random() * width
    g.y = Math.random() * height
    container.addChild(g)

    drops.push({
      g,
      vx: isSnow ? (Math.random() - 0.5) * 0.6 * s : 0.4 * s,
      vy: isSnow ? (0.8 + Math.random() * 0.8) * config.speed * s : (8 + Math.random() * 4) * config.speed * s,
      phase: Math.random() * Math.PI * 2,
    })
  }

  startAnimation((t) => {
    for (const d of drops) {
      d.g.x += d.vx
      d.g.y += d.vy

      if (isSnow) {
        d.g.x += Math.sin(t * 1.5 + d.phase) * 0.4 * s
      }

      if (d.g.y > height + 10) {
        d.g.y = -10
        d.g.x = Math.random() * width
      }
      if (d.g.x < -10) d.g.x = width + 10
      if (d.g.x > width + 10) d.g.x = -10
    }
  })
}

// =====================================================
// EMBERS / DUST - Realistic glowing particles
// =====================================================
function createParticleEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const isEmbers = config.effectType === 'embers'
  const maxP = Math.min(20, Math.round(12 * config.intensity))
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ff8800')
  const opacity = config.opacity ?? 0.9

  interface EmberParticle {
    g: PIXI.Graphics
    vx: number
    vy: number
    life: number
    max: number
    phase: number
    active: boolean
    size: number
    rotSpeed: number
    emberType: 'round' | 'streak' | 'flake'
  }

  const particles: EmberParticle[] = []

  // Draw ember based on type
  function drawEmberParticle(g: PIXI.Graphics, size: number, color: number, alpha: number, type: 'round' | 'streak' | 'flake') {
    g.clear()
    if (type === 'round') {
      // Glowing round ember
      g.circle(0, 0, size * 1.8)
      g.fill({ color, alpha: alpha * 0.2 })
      g.circle(0, 0, size)
      g.fill({ color, alpha })
      g.circle(0, 0, size * 0.4)
      g.fill({ color: 0xffffff, alpha: alpha * 0.8 })
    } else if (type === 'streak') {
      // Elongated streak/trail
      g.ellipse(0, 0, size * 0.4, size * 1.5)
      g.fill({ color, alpha })
      g.ellipse(0, 0, size * 0.2, size * 0.8)
      g.fill({ color: 0xffffcc, alpha: alpha * 0.7 })
    } else {
      // Irregular flake shape
      g.moveTo(0, -size)
      g.lineTo(size * 0.6, -size * 0.3)
      g.lineTo(size * 0.4, size * 0.5)
      g.lineTo(-size * 0.3, size * 0.3)
      g.lineTo(-size * 0.5, -size * 0.4)
      g.closePath()
      g.fill({ color, alpha })
    }
  }

  for (let i = 0; i < maxP; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    container.addChild(g)
    particles.push({
      g,
      vx: 0,
      vy: 0,
      life: 0,
      max: 0,
      phase: Math.random() * Math.PI * 2,
      active: false,
      size: 3,
      rotSpeed: 0,
      emberType: 'round',
    })
  }

  const spawnY = height * 0.85

  function spawn() {
    const p = particles.find(x => !x.active)
    if (!p) return

    p.active = true
    p.g.visible = true

    // Random ember type
    const typeRand = Math.random()
    p.emberType = typeRand < 0.5 ? 'round' : (typeRand < 0.8 ? 'streak' : 'flake')
    p.size = (2 + Math.random() * 4) * s

    p.g.x = cx + (Math.random() - 0.5) * width * 0.6
    p.g.y = isEmbers ? spawnY : Math.random() * height
    p.g.rotation = Math.random() * Math.PI * 2
    p.rotSpeed = (Math.random() - 0.5) * 0.08

    p.vx = (Math.random() - 0.5) * config.speed * s * 0.8
    p.vy = isEmbers ? -(0.5 + Math.random() * 1.0) * config.speed * s : (Math.random() - 0.5) * 0.15 * config.speed * s
    p.max = 70 + Math.random() * 50
    p.life = p.max

    const col = Math.random() > 0.5 ? color1 : color2
    drawEmberParticle(p.g, p.size, col, (isEmbers ? 0.95 : 0.6) * opacity, p.emberType)
  }

  // Initial spawn
  for (let i = 0; i < maxP * 0.4; i++) spawn()

  let timer = 0
  startAnimation((t) => {
    timer++
    if (timer > 5 / config.speed) {
      spawn()
      timer = 0
    }

    for (const p of particles) {
      if (!p.active) continue
      p.life--

      // Wobbling movement
      const wobble = Math.sin(t * 2 + p.phase) * 0.4 * s
      p.g.x += p.vx + wobble
      p.g.y += p.vy

      // Rotation for non-round embers
      if (p.emberType !== 'round') {
        p.g.rotation += p.rotSpeed
      }

      const ratio = p.life / p.max
      p.g.alpha = ratio * (isEmbers ? 0.9 : 0.55) * opacity

      // Flickering for embers
      if (isEmbers) {
        const flicker = 0.5 + Math.sin(t * 12 + p.phase) * 0.3 + Math.random() * 0.2
        p.g.alpha *= flicker
      }

      p.g.scale.set(0.6 + ratio * 0.4)

      if (p.life <= 0 || p.g.y < -20) {
        p.active = false
        p.g.visible = false
      }
    }
  })
}

// =====================================================
// SPIRITUAL WEAPON - Animated floating sword with glow
// =====================================================
async function createSpiritualWeaponEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const opacity = config.opacity ?? 0.9

  // Load sword texture
  let swordTexture: PIXI.Texture | null = null
  try {
    swordTexture = await PIXI.Assets.load('/assets/effects/spiritual-weapon-sword.png')
  } catch (error) {
    console.error('Failed to load spiritual weapon image:', error)
    // Fallback: create a simple sword shape
    const fallbackSword = new PIXI.Graphics()
    fallbackSword.rect(-3, -40, 6, 80)
    fallbackSword.fill({ color: 0xffd700, alpha: 0.9 * opacity })
    fallbackSword.rect(-8, 35, 16, 8)
    fallbackSword.fill({ color: 0xffd700, alpha: 0.9 * opacity })
    fallbackSword.x = cx
    fallbackSword.y = cy
    container.addChild(fallbackSword)
    return
  }

  if (!swordTexture) return

  // Create sword sprite
  const sword = new PIXI.Sprite(swordTexture)
  
  // Calculate size - maintain aspect ratio, fit within container
  const maxSize = Math.min(width, height) * 0.6
  const aspectRatio = swordTexture.width / swordTexture.height
  let swordWidth = maxSize
  let swordHeight = maxSize / aspectRatio
  
  // If height is the limiting factor, adjust
  if (swordHeight > maxSize) {
    swordHeight = maxSize
    swordWidth = maxSize * aspectRatio
  }
  
  sword.width = swordWidth * s
  sword.height = swordHeight * s
  sword.anchor.set(0.5, 0.5) // Center anchor point
  sword.x = cx
  sword.y = cy
  
  // Apply tint color if configured
  if (config.color !== '#ff6600') {
    sword.tint = color1
  }
  
  container.addChild(sword)

  // Add glow effect around sword
  const glow = new PIXI.Graphics()
  const glowSize = Math.max(swordWidth, swordHeight) * 1.3
  glow.circle(0, 0, glowSize * 0.5)
  glow.fill({ color: color1, alpha: 0.15 * opacity })
  glow.circle(0, 0, glowSize * 0.35)
  glow.fill({ color: color2, alpha: 0.25 * opacity })
  glow.x = cx
  glow.y = cy
  container.addChildAt(glow, 0) // Behind sword

  // Add sparkle particles around the sword
  interface Sparkle {
    g: PIXI.Graphics
    x: number
    y: number
    phase: number
    speed: number
    radius: number
  }
  
  const sparkleCount = Math.min(8, Math.round(6 * config.intensity))
  const sparkles: Sparkle[] = []
  
  for (let i = 0; i < sparkleCount; i++) {
    const g = new PIXI.Graphics()
    const sparkleSize = (2 + Math.random() * 3) * s
    const col = i % 2 === 0 ? color1 : color2
    g.circle(0, 0, sparkleSize)
    g.fill({ color: col, alpha: 0.8 * opacity })
    g.circle(0, 0, sparkleSize * 0.5)
    g.fill({ color: 0xffffff, alpha: 0.9 * opacity })
    
    const angle = (i / sparkleCount) * Math.PI * 2
    const radius = Math.max(swordWidth, swordHeight) * (0.6 + Math.random() * 0.4)
    g.x = cx + Math.cos(angle) * radius
    g.y = cy + Math.sin(angle) * radius
    container.addChild(g)
    
    sparkles.push({
      g,
      x: g.x,
      y: g.y,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      radius,
    })
  }

  // Animation state
  let floatPhase = 0
  let rotationPhase = 0

  startAnimation((t) => {
    // Floating motion - gentle up and down
    floatPhase += 0.02 * config.speed
    const floatOffset = Math.sin(floatPhase) * 8 * s
    
    // Gentle rotation - slow spin
    rotationPhase += 0.01 * config.speed
    const rotation = Math.sin(rotationPhase * 0.5) * 0.15 // Slight wobble
    
    // Update sword position and rotation
    sword.y = cy + floatOffset
    sword.rotation = rotation
    
    // Pulse glow
    const glowPulse = 1 + Math.sin(t * 2 * config.speed) * 0.15
    glow.scale.set(glowPulse)
    glow.alpha = (0.2 + Math.sin(t * 1.5 * config.speed) * 0.1) * opacity
    
    // Animate sparkles - orbit around sword
    for (const sp of sparkles) {
      const orbitAngle = (sparkles.indexOf(sp) / sparkleCount) * Math.PI * 2 + t * sp.speed * 0.5
      sp.g.x = cx + Math.cos(orbitAngle) * sp.radius
      sp.g.y = cy + Math.sin(orbitAngle) * sp.radius + floatOffset
      
      // Twinkle effect
      const twinkle = Math.sin(t * sp.speed * 3 + sp.phase)
      sp.g.alpha = (0.4 + (twinkle + 1) * 0.3) * opacity
      sp.g.scale.set(0.7 + (twinkle + 1) * 0.2)
    }
  })
}

// =====================================================
// THUNDER - Lightning bolts and electric sparks
// =====================================================
function createThunderEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ffffff')
  const opacity = config.opacity ?? 0.9

  // Lightning bolt interface
  interface LightningBolt {
    g: PIXI.Graphics
    points: { x: number; y: number }[]
    life: number
    maxLife: number
    active: boolean
    branches: LightningBolt[]
  }

  interface ElectricSpark {
    g: PIXI.Graphics
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    active: boolean
  }

  interface ElectricArc {
    g: PIXI.Graphics
    startX: number
    startY: number
    endX: number
    endY: number
    life: number
    maxLife: number
    active: boolean
  }

  const bolts: LightningBolt[] = []
  const sparks: ElectricSpark[] = []
  const electricArcs: ElectricArc[] = []
  const maxBolts = 3
  const maxSparks = 15
  const maxArcs = 5

  // Pre-create graphics objects
  for (let i = 0; i < maxBolts; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    container.addChild(g)
    bolts.push({
      g,
      points: [],
      life: 0,
      maxLife: 0,
      active: false,
      branches: [],
    })
  }

  for (let i = 0; i < maxSparks; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    container.addChild(g)
    sparks.push({
      g,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      active: false,
    })
  }

  // Pre-create electric arc graphics
  for (let i = 0; i < maxArcs; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    container.addChild(g)
    electricArcs.push({
      g,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      life: 0,
      maxLife: 0,
      active: false,
    })
  }

  // Generate zigzag lightning path
  function generateLightningPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    segments: number,
    jaggedness: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }]
    const dx = endX - startX
    const dy = endY - startY
    const length = Math.sqrt(dx * dx + dy * dy)
    const perpX = -dy / length
    const perpY = dx / length

    for (let i = 1; i < segments; i++) {
      const t = i / segments
      const x = startX + dx * t
      const y = startY + dy * t

      // Add random jaggedness perpendicular to the line
      const offset = (Math.random() - 0.5) * 2 * jaggedness * length
      points.push({
        x: x + perpX * offset,
        y: y + perpY * offset,
      })
    }

    points.push({ x: endX, y: endY })
    return points
  }

  // Draw lightning bolt with enhanced electric effects
  function drawLightning(bolt: LightningBolt, color: number, alpha: number) {
    bolt.g.clear()
    if (bolt.points.length < 2) return

    const thickness = (3 + Math.random() * 2) * s

    // Outer glow - widest, most transparent (feathered edge)
    bolt.g.setStrokeStyle({ width: thickness * 5, color, alpha: alpha * 0.15 })
    bolt.g.moveTo(bolt.points[0].x, bolt.points[0].y)
    for (let i = 1; i < bolt.points.length; i++) {
      bolt.g.lineTo(bolt.points[i].x, bolt.points[i].y)
    }
    bolt.g.stroke()

    // Mid glow - medium width
    bolt.g.setStrokeStyle({ width: thickness * 3, color, alpha: alpha * 0.3 })
    bolt.g.moveTo(bolt.points[0].x, bolt.points[0].y)
    for (let i = 1; i < bolt.points.length; i++) {
      bolt.g.lineTo(bolt.points[i].x, bolt.points[i].y)
    }
    bolt.g.stroke()

    // Main bolt - bright core
    bolt.g.setStrokeStyle({ width: thickness, color, alpha })
    bolt.g.moveTo(bolt.points[0].x, bolt.points[0].y)
    for (let i = 1; i < bolt.points.length; i++) {
      bolt.g.lineTo(bolt.points[i].x, bolt.points[i].y)
    }
    bolt.g.stroke()

    // Bright white core - electric center
    bolt.g.setStrokeStyle({ width: thickness * 0.6, color: 0xffffff, alpha: alpha * 0.9 })
    bolt.g.moveTo(bolt.points[0].x, bolt.points[0].y)
    for (let i = 1; i < bolt.points.length; i++) {
      bolt.g.lineTo(bolt.points[i].x, bolt.points[i].y)
    }
    bolt.g.stroke()

    // Add small electric arcs between segments for more electric effect
    for (let i = 0; i < bolt.points.length - 1; i++) {
      if (Math.random() > 0.7) {
        const p1 = bolt.points[i]
        const p2 = bolt.points[i + 1]
        const midX = (p1.x + p2.x) / 2
        const midY = (p1.y + p2.y) / 2
        
        // Small perpendicular arc
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const perpX = -dy / len
        const perpY = dx / len
        
        const arcOffset = (Math.random() - 0.5) * len * 0.3
        const arcX = midX + perpX * arcOffset
        const arcY = midY + perpY * arcOffset
        
        // Draw small electric arc
        bolt.g.setStrokeStyle({ width: thickness * 0.4, color: 0xffffff, alpha: alpha * 0.6 })
        bolt.g.moveTo(midX, midY)
        bolt.g.lineTo(arcX, arcY)
        bolt.g.stroke()
      }
    }
  }

  // Spawn a lightning bolt
  function spawnLightning() {
    const bolt = bolts.find(b => !b.active)
    if (!bolt) return

    bolt.active = true
    bolt.g.visible = true

    // Random start and end points
    const startX = cx + (Math.random() - 0.5) * width * 0.6
    const startY = cy - height * 0.3 + Math.random() * height * 0.2
    const endX = cx + (Math.random() - 0.5) * width * 0.8
    const endY = cy + height * 0.3 + Math.random() * height * 0.2

    // Generate main path
    const segments = 8 + Math.floor(Math.random() * 6)
    bolt.points = generateLightningPath(startX, startY, endX, endY, segments, 0.15)

    // Create branches (smaller lightning forks)
    bolt.branches = []
    if (Math.random() > 0.5 && bolt.points.length > 3) {
      const branchPoint = bolt.points[Math.floor(bolt.points.length * (0.3 + Math.random() * 0.4))]
      const branchEndX = branchPoint.x + (Math.random() - 0.5) * width * 0.3
      const branchEndY = branchPoint.y + (Math.random() - 0.5) * height * 0.3
      const branchSegments = 4 + Math.floor(Math.random() * 3)
      const branchPoints = generateLightningPath(branchPoint.x, branchPoint.y, branchEndX, branchEndY, branchSegments, 0.2)
      bolt.branches.push({
        g: new PIXI.Graphics(),
        points: branchPoints,
        life: 0,
        maxLife: 0,
        active: true,
        branches: [],
      })
      container.addChild(bolt.branches[0].g)
    }

    bolt.maxLife = 8 + Math.floor(Math.random() * 5) // Very short lifespan for flash effect
    bolt.life = bolt.maxLife

    // Spawn sparks at endpoints
    for (let i = 0; i < 3; i++) {
      spawnSpark(endX, endY)
    }
    if (bolt.branches.length > 0) {
      const branchEnd = bolt.branches[0].points[bolt.branches[0].points.length - 1]
      spawnSpark(branchEnd.x, branchEnd.y)
    }

    // Spawn electric arcs from the bolt
    if (Math.random() > 0.6) {
      spawnElectricArc(bolt.points[Math.floor(bolt.points.length * 0.5)])
    }
  }

  // Spawn electric arc (smaller electric bolt effect)
  function spawnElectricArc(fromPoint: { x: number; y: number }) {
    const arc = electricArcs.find(a => !a.active)
    if (!arc) return

    arc.active = true
    arc.g.visible = true
    arc.startX = fromPoint.x
    arc.startY = fromPoint.y
    
    // Random end point nearby
    const angle = Math.random() * Math.PI * 2
    const distance = 20 + Math.random() * 40
    arc.endX = fromPoint.x + Math.cos(angle) * distance * s
    arc.endY = fromPoint.y + Math.sin(angle) * distance * s

    arc.maxLife = 5 + Math.floor(Math.random() * 4)
    arc.life = arc.maxLife

    // Draw electric arc
    drawElectricArc(arc, color1, 0.8)
  }

  // Draw electric arc (smaller, simpler lightning)
  function drawElectricArc(arc: ElectricArc, color: number, alpha: number) {
    arc.g.clear()
    
    // Generate simple zigzag path
    const segments = 3 + Math.floor(Math.random() * 3)
    const points = generateLightningPath(arc.startX, arc.startY, arc.endX, arc.endY, segments, 0.2)
    
    const thickness = (1.5 + Math.random() * 1) * s

    // Outer glow
    arc.g.setStrokeStyle({ width: thickness * 3, color, alpha: alpha * 0.2 })
    arc.g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      arc.g.lineTo(points[i].x, points[i].y)
    }
    arc.g.stroke()

    // Main arc
    arc.g.setStrokeStyle({ width: thickness, color, alpha })
    arc.g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      arc.g.lineTo(points[i].x, points[i].y)
    }
    arc.g.stroke()

    // Bright white core
    arc.g.setStrokeStyle({ width: thickness * 0.5, color: 0xffffff, alpha: alpha * 0.7 })
    arc.g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      arc.g.lineTo(points[i].x, points[i].y)
    }
    arc.g.stroke()
  }

  // Spawn electric spark
  function spawnSpark(x: number, y: number) {
    const spark = sparks.find(s => !s.active)
    if (!spark) return

    spark.active = true
    spark.g.visible = true
    spark.x = x
    spark.y = y
    spark.vx = (Math.random() - 0.5) * 4 * s
    spark.vy = (Math.random() - 0.5) * 4 * s
    spark.maxLife = 10 + Math.floor(Math.random() * 8)
    spark.life = spark.maxLife

    // Draw spark
    spark.g.clear()
    const size = (2 + Math.random() * 3) * s
    const col = Math.random() > 0.5 ? color1 : color2
    spark.g.circle(0, 0, size)
    spark.g.fill({ color: col, alpha: 0.9 })
    spark.g.circle(0, 0, size * 0.5)
    spark.g.fill({ color: 0xffffff, alpha: 0.95 })
    spark.g.x = x
    spark.g.y = y
  }

  // Initial spawn
  if (Math.random() > 0.5) spawnLightning()

  let lightningTimer = 0
  const lightningInterval = 30 + Math.random() * 40 // Random intervals between strikes

  startAnimation((t) => {
    // Spawn new lightning bolts at random intervals
    lightningTimer++
    if (lightningTimer > lightningInterval / config.speed) {
      if (Math.random() > 0.3) {
        spawnLightning()
      }
      lightningTimer = 0
    }

    // Update lightning bolts
    for (const bolt of bolts) {
      if (!bolt.active) continue

      bolt.life--
      const lifeRatio = bolt.life / bolt.maxLife
      const alpha = lifeRatio * (0.7 + Math.random() * 0.3) // Flicker effect

      // Draw main bolt
      drawLightning(bolt, color1, alpha)

      // Draw branches
      for (const branch of bolt.branches) {
        drawLightning(branch, color2, alpha * 0.7)
      }

      // Fade out quickly
      if (bolt.life <= 0) {
        bolt.active = false
        bolt.g.visible = false
        bolt.g.clear()
        // Clean up branches
        for (const branch of bolt.branches) {
          branch.g.destroy()
        }
        bolt.branches = []
      }
    }

    // Update sparks
    for (const spark of sparks) {
      if (!spark.active) continue

      spark.life--
      spark.x += spark.vx
      spark.y += spark.vy
      spark.vx *= 0.95 // Slow down
      spark.vy *= 0.95

      const lifeRatio = spark.life / spark.maxLife
      spark.g.x = spark.x
      spark.g.y = spark.y
      spark.g.alpha = lifeRatio * opacity
      spark.g.scale.set(0.5 + lifeRatio * 0.5)

      if (spark.life <= 0) {
        spark.active = false
        spark.g.visible = false
        spark.g.clear()
      }
    }

    // Update electric arcs
    for (const arc of electricArcs) {
      if (!arc.active) continue

      arc.life--
      const lifeRatio = arc.life / arc.maxLife
      const alpha = lifeRatio * (0.6 + Math.random() * 0.4) * opacity

      // Redraw arc with fading
      drawElectricArc(arc, color1, alpha)

      if (arc.life <= 0) {
        arc.active = false
        arc.g.visible = false
        arc.g.clear()
      }
    }

    // Occasionally spawn random electric arcs
    if (Math.random() > 0.95) {
      const randomX = cx + (Math.random() - 0.5) * width * 0.8
      const randomY = cy + (Math.random() - 0.5) * height * 0.8
      spawnElectricArc({ x: randomX, y: randomY })
    }

    // Occasional bright flash overlay (thunder flash) - feathered and smooth
    if (Math.random() > 0.98) {
      const flash = new PIXI.Graphics()
      
      // Create feathered flash using radial gradient effect
      // Draw multiple concentric circles with decreasing opacity for smooth feathering
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.max(width, height) * 0.8
      
      // Outer glow - very soft
      flash.circle(centerX, centerY, maxRadius)
      flash.fill({ color: 0xffffff, alpha: 0.08 * opacity })
      
      // Mid glow
      flash.circle(centerX, centerY, maxRadius * 0.7)
      flash.fill({ color: 0xffffff, alpha: 0.15 * opacity })
      
      // Inner glow
      flash.circle(centerX, centerY, maxRadius * 0.5)
      flash.fill({ color: 0xffffff, alpha: 0.25 * opacity })
      
      // Bright center
      flash.circle(centerX, centerY, maxRadius * 0.3)
      flash.fill({ color: 0xffffff, alpha: 0.35 * opacity })
      
      // Add slight blue tint for electric feel
      const blueFlash = new PIXI.Graphics()
      blueFlash.circle(centerX, centerY, maxRadius * 0.4)
      blueFlash.fill({ color: 0xaaccff, alpha: 0.1 * opacity })
      
      container.addChild(flash)
      container.addChild(blueFlash)
      
      // Smooth fade out
      let flashAlpha = 1.0
      const fadeInterval = setInterval(() => {
        flashAlpha -= 0.1
        flash.alpha = flashAlpha
        blueFlash.alpha = flashAlpha
        
        if (flashAlpha <= 0) {
          clearInterval(fadeInterval)
          if (flash.parent) flash.parent.removeChild(flash)
          if (blueFlash.parent) blueFlash.parent.removeChild(blueFlash)
          flash.destroy()
          blueFlash.destroy()
        }
      }, 16) // ~60fps fade
    }
  })
}

// =====================================================
// BEAM EFFECTS - Vertical columns (electric, energy, fire)
// =====================================================

// Get perpendicular offset for beam width
function getPerpendicularOffset(p1: { x: number; y: number }, p2: { x: number; y: number }, offset: number): { x: number; y: number } {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len === 0) return { x: 0, y: 0 }
  const perpX = -dy / len
  const perpY = dx / len
  return { x: perpX * offset, y: perpY * offset }
}

function createBeamEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const isElectric = config.effectType === 'electricBeam'
  const isEnergy = config.effectType === 'energyBeam'
  const isFire = config.effectType === 'fireColumn'
  const opacity = config.opacity ?? 0.9

  // Get beam path - use custom path if provided, otherwise default vertical line
  let beamPathPoints: { x: number; y: number; t: number }[] = []
  const beamWidth = (30 + Math.random() * 20) * s * config.intensity
  
  if (config.beamPath) {
    // Use custom SVG path
    try {
      // Create SVG with viewBox 0-100, then scale to container
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('viewBox', '0 0 100 100')
      svg.setAttribute('width', width.toString())
      svg.setAttribute('height', height.toString())
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', config.beamPath)
      svg.appendChild(path)
      document.body.appendChild(svg)
      
      // Sample points along the path
      const pathLength = path.getTotalLength()
      const numPoints = 50
      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1)
        const distance = pathLength * t
        const point = path.getPointAtLength(distance)
        // Scale from 0-100 to actual container size
        beamPathPoints.push({
          x: (point.x / 100) * width,
          y: (point.y / 100) * height,
          t,
        })
      }
      
      document.body.removeChild(svg)
    } catch (error) {
      console.error('Error parsing beam path:', error)
      // Fallback to default
      beamPathPoints = []
    }
  }
  
  // Default vertical line if no path or path failed
  if (beamPathPoints.length === 0) {
    const numPoints = 50
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1)
      beamPathPoints.push({
        x: cx,
        y: t * height,
        t,
      })
    }
  }

  // Main beam graphics
  const mainBeam = new PIXI.Graphics()
  container.addChild(mainBeam)

  // Particles/sparks for the beam
  interface BeamParticle {
    g: PIXI.Graphics
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    active: boolean
    size: number
    pathT?: number
  }

  const particles: BeamParticle[] = []
  const maxParticles = isFire ? 40 : (isElectric ? 30 : 25)

  // Pre-create particles
  for (let i = 0; i < maxParticles; i++) {
    const g = new PIXI.Graphics()
    g.visible = false
    container.addChild(g)
    particles.push({
      g,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      active: false,
      size: 0,
    })
  }

  // Spawn particle in beam
  function spawnParticle() {
    const p = particles.find(part => !part.active)
    if (!p) return

    p.active = true
    p.g.visible = true

    // Get random point along path
    const pathIndex = isFire 
      ? Math.floor(Math.random() * beamPathPoints.length * 0.7) + Math.floor(beamPathPoints.length * 0.3) // Start from 30% down
      : Math.floor(Math.random() * beamPathPoints.length * 0.3) // Start from top 30%
    
    const pathPoint = beamPathPoints[pathIndex]
    if (!pathPoint) return

    // Position particle on path with random offset perpendicular to path
    const nextPathPoint = beamPathPoints[Math.min(pathIndex + 1, beamPathPoints.length - 1)]
    const offset = getPerpendicularOffset(pathPoint, nextPathPoint, (Math.random() - 0.5) * beamWidth)
    
    p.x = pathPoint.x + offset.x
    p.y = pathPoint.y + offset.y

    // Calculate velocity along path direction
    const dx = nextPathPoint.x - pathPoint.x
    const dy = nextPathPoint.y - pathPoint.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const speed = config.speed * s
    
    if (isFire) {
      // Fire rises (reverse direction)
      p.vx = -(dx / len) * (1 + Math.random() * 2) * speed
      p.vy = -(dy / len) * (1 + Math.random() * 2) * speed
      p.size = (3 + Math.random() * 5) * s
      p.maxLife = 40 + Math.random() * 30
    } else if (isElectric) {
      p.vx = (dx / len) * (2 + Math.random() * 3) * speed
      p.vy = (dy / len) * (2 + Math.random() * 3) * speed
      p.size = (2 + Math.random() * 4) * s
      p.maxLife = 30 + Math.random() * 20
    } else {
      // Energy beam
      p.vx = (dx / len) * (1.5 + Math.random() * 2.5) * speed
      p.vy = (dy / len) * (1.5 + Math.random() * 2.5) * speed
      p.size = (4 + Math.random() * 6) * s
      p.maxLife = 35 + Math.random() * 25
    }

    p.life = p.maxLife
    p.pathT = pathPoint.t // Store path position for tracking

    // Draw particle based on type
    p.g.clear()
    const col = Math.random() > 0.5 ? color1 : color2

    if (isElectric) {
      // Electric: bright spark
      p.g.circle(0, 0, p.size)
      p.g.fill({ color: col, alpha: 0.9 })
      p.g.circle(0, 0, p.size * 0.5)
      p.g.fill({ color: 0xffffff, alpha: 0.95 })
      // Add small electric arc
      p.g.setStrokeStyle({ width: 1 * s, color: 0xffffff, alpha: 0.7 })
      p.g.moveTo(-p.size, 0)
      p.g.lineTo(p.size, 0)
      p.g.stroke()
    } else if (isEnergy) {
      // Energy: glowing orb
      p.g.circle(0, 0, p.size * 1.5)
      p.g.fill({ color: col, alpha: 0.2 })
      p.g.circle(0, 0, p.size)
      p.g.fill({ color: col, alpha: 0.6 })
      p.g.circle(0, 0, p.size * 0.5)
      p.g.fill({ color: 0xffffff, alpha: 0.8 })
    } else {
      // Fire: flame particle
      p.g.circle(0, 0, p.size * 1.2)
      p.g.fill({ color: col, alpha: 0.15 })
      p.g.circle(0, 0, p.size)
      p.g.fill({ color: col, alpha: 0.5 })
      p.g.circle(0, 0, p.size * 0.6)
      p.g.fill({ color: 0xffffcc, alpha: 0.7 })
      p.g.circle(0, 0, p.size * 0.3)
      p.g.fill({ color: 0xffffff, alpha: 0.9 })
    }

    p.g.x = p.x
    p.g.y = p.y
  }

  // Draw main beam along path
  function drawBeam() {
    mainBeam.clear()
    if (beamPathPoints.length < 2) return

    // Create polygon shape along path with width
    function createBeamPolygon(widthMultiplier: number, alpha: number, color: number): void {
      const halfWidth = (beamWidth * widthMultiplier) / 2
      const leftPoints: { x: number; y: number }[] = []
      const rightPoints: { x: number; y: number }[] = []

      // Calculate perpendicular offsets for each point
      for (let i = 0; i < beamPathPoints.length; i++) {
        const point = beamPathPoints[i]
        let nextPoint = beamPathPoints[Math.min(i + 1, beamPathPoints.length - 1)]
        
        // For last point, use previous point for direction
        if (i === beamPathPoints.length - 1) {
          const prevPoint = beamPathPoints[i - 1]
          nextPoint = { x: point.x + (point.x - prevPoint.x), y: point.y + (point.y - prevPoint.y), t: 1 }
        }

        const offset = getPerpendicularOffset(point, nextPoint, halfWidth)
        leftPoints.push({ x: point.x - offset.x, y: point.y - offset.y })
        rightPoints.push({ x: point.x + offset.x, y: point.y + offset.y })
      }

      // Draw polygon
      mainBeam.poly(leftPoints.concat(rightPoints.reverse()), true)
      mainBeam.fill({ color, alpha })
    }

    if (isElectric) {
      // Electric beam: crackling energy with lightning
      createBeamPolygon(1.0, 0.15 * opacity, color1) // Outer glow
      createBeamPolygon(0.8, 0.4 * opacity, color1)  // Main beam
      createBeamPolygon(0.4, 0.3 * opacity, 0xffffff) // Bright core
      
      // Add lightning streaks along path
      for (let i = 0; i < 5; i++) {
        const pathIndex = Math.floor((beamPathPoints.length / 5) * i + Math.random() * (beamPathPoints.length / 5))
        const point = beamPathPoints[pathIndex]
        const nextPoint = beamPathPoints[Math.min(pathIndex + 1, beamPathPoints.length - 1)]
        const offset = getPerpendicularOffset(point, nextPoint, beamWidth * 0.3)
        
        mainBeam.setStrokeStyle({ width: 2 * s, color: 0xffffff, alpha: 0.6 * opacity })
        mainBeam.moveTo(point.x - offset.x, point.y - offset.y)
        mainBeam.lineTo(point.x + offset.x, point.y + offset.y)
        mainBeam.stroke()
      }
    } else if (isEnergy) {
      // Energy beam: smooth flowing energy
      createBeamPolygon(1.0, 0.2 * opacity, color1)   // Outer glow
      createBeamPolygon(0.9, 0.35 * opacity, color1)  // Main beam
      createBeamPolygon(0.7, 0.4 * opacity, color2)   // Mid layer
      createBeamPolygon(0.5, 0.3 * opacity, 0xffffff) // Bright core
    } else {
      // Fire column: rising flames
      createBeamPolygon(1.0, 0.2 * opacity, color1)   // Outer glow
      createBeamPolygon(0.8, 0.4 * opacity, color1)   // Main column
      createBeamPolygon(0.5, 0.5 * opacity, color2)   // Inner hot core
      createBeamPolygon(0.3, 0.4 * opacity, 0xffffcc) // Bright center
    }
  }

  // Initial spawn
  for (let i = 0; i < maxParticles * 0.3; i++) {
    spawnParticle()
  }

  let particleTimer = 0
  const particleRate = isFire ? 2 : (isElectric ? 3 : 2.5)

  let pulsePhase = 0

  startAnimation((t) => {
    // Spawn particles
    particleTimer++
    if (particleTimer > particleRate / config.speed) {
      spawnParticle()
      if (Math.random() > 0.5) spawnParticle()
      particleTimer = 0
    }

    // Animate beam with pulse
    pulsePhase += 0.05 * config.speed
    const flicker = 0.9 + Math.random() * 0.2

    // Redraw beam with animation
    drawBeam()
    mainBeam.alpha = flicker * opacity

    // Update particles
    for (const p of particles) {
      if (!p.active) continue

      p.life--
      p.y += p.vy

      // Update position along path direction
      p.x += p.vx
      p.y += p.vy

      // Wobble for electric
      if (isElectric && p.pathT !== undefined) {
        // Keep particle near path
        const pathIndex = Math.floor(p.pathT * (beamPathPoints.length - 1))
        const pathPoint = beamPathPoints[Math.min(pathIndex, beamPathPoints.length - 1)]
        if (pathPoint) {
          const nextPoint = beamPathPoints[Math.min(pathIndex + 1, beamPathPoints.length - 1)]
          const offset = getPerpendicularOffset(pathPoint, nextPoint, (Math.random() - 0.5) * beamWidth * 0.3)
          p.x = pathPoint.x + offset.x
          p.y = pathPoint.y + offset.y
        }
      }

      const lifeRatio = p.life / p.maxLife
      p.g.x = p.x
      p.g.y = p.y
      p.g.alpha = lifeRatio * 0.9 * opacity

      // Scale based on life
      if (isFire) {
        p.g.scale.set(0.5 + lifeRatio * 0.5)
      } else {
        p.g.scale.set(0.7 + lifeRatio * 0.3)
      }

      // Remove if out of bounds or dead
      if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        p.active = false
        p.g.visible = false
        p.g.clear()
      }
    }
  })
}

// =====================================================
// SHADOW TENDRILS - Writhing, moving tentacle-like tendrils
// =====================================================
function createTendrilsEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const tendrilCount = Math.max(4, Math.min(8, Math.round(6 * config.intensity)))
  const maxRadius = Math.min(width, height) * 0.45 // Maximum tendril reach

  interface Tendril {
    g: PIXI.Graphics
    baseX: number
    baseY: number
    baseAngle: number
    segmentCount: number
    segmentLengths: number[]
    baseAngles: number[]
    phase: number
    speed: number
    thickness: number
    waveOffsets: number[] // Pre-calculated wave offsets for smoothness
  }

  const tendrils: Tendril[] = []

  // Create tendrils radiating from center
  for (let i = 0; i < tendrilCount; i++) {
    const g = new PIXI.Graphics()
    container.addChild(g)

    const angle = (i / tendrilCount) * Math.PI * 2
    const baseX = cx + Math.cos(angle) * (width * 0.05)
    const baseY = cy + Math.sin(angle) * (height * 0.05)

    const segmentCount = 12 + Math.floor((i % 3) * 2) // More segments for smoother curves
    const segmentLengths: number[] = []
    const baseAngles: number[] = []
    const waveOffsets: number[] = []
    
    let currentAngle = angle
    let totalLength = 0

    // Pre-calculate base structure
    for (let j = 0; j < segmentCount; j++) {
      const progress = j / segmentCount
      // Segment length decreases towards the end
      const baseLength = (20 + (1 - progress) * 15) * s
      segmentLengths.push(baseLength)
      
      // Smooth angle variation using sine waves
      const angleOffset = Math.sin(progress * Math.PI * 2 + i) * 0.6
      currentAngle += angleOffset
      baseAngles.push(currentAngle)
      
      // Pre-calculate wave offsets for smooth animation
      waveOffsets.push(Math.sin(i * 0.7 + j * 0.5) * 0.3)
      
      totalLength += baseLength
      // Don't break early - let all segments be created
    }

    tendrils.push({
      g,
      baseX,
      baseY,
      baseAngle: angle,
      segmentCount: segmentLengths.length,
      segmentLengths,
      baseAngles,
      phase: i * 0.8,
      speed: 0.6 + (i % 3) * 0.2,
      thickness: (4 + (i % 3) * 2) * s,
      waveOffsets,
    })
  }

  // Smooth interpolation helper
  function smoothStep(t: number): number {
    return t * t * (3 - 2 * t)
  }

  // Draw a single tendril with smooth curves
  function drawTendril(tendril: Tendril, t: number) {
    tendril.g.clear()
    
    if (tendril.segmentCount < 2) {
      // Draw at least a small circle at base if no segments
      tendril.g.circle(tendril.baseX, tendril.baseY, tendril.thickness)
      tendril.g.fill({ color: color1, alpha: config.opacity })
      return
    }

    const thickness = tendril.thickness
    const color = color1
    const speed = tendril.speed * config.speed

    // Build smooth path points - always start with base point
    const points: { x: number; y: number; alpha: number }[] = [
      { x: tendril.baseX, y: tendril.baseY, alpha: config.opacity }
    ]
    let currentX = tendril.baseX
    let currentY = tendril.baseY
    let totalLength = 0

    for (let i = 0; i < tendril.segmentCount; i++) {
      const progress = i / tendril.segmentCount
      const wavePhase = t * speed + tendril.phase + i * 0.25
      
      // Smooth wave motion using multiple sine waves for organic feel
      const wave1 = Math.sin(wavePhase) * 0.5
      const wave2 = Math.sin(wavePhase * 1.7 + tendril.phase) * 0.3
      const wave3 = Math.sin(wavePhase * 0.6 + i * 0.4) * 0.2
      const combinedWave = wave1 + wave2 + wave3
      
      // Perpendicular wave amplitude (smooth, no random)
      const perpAmplitude = (4 + Math.sin(wavePhase * 0.5) * 2) * s
      const perpOffset = combinedWave * perpAmplitude
      
      // Angle variation (smooth, deterministic)
      const angleWave = Math.sin(wavePhase * 1.3) * 0.3 + Math.cos(wavePhase * 0.9) * 0.2
      const currentAngle = tendril.baseAngles[i] + angleWave + tendril.waveOffsets[i]
      
      // Segment length variation (subtle)
      const lengthVariation = 1 + Math.sin(wavePhase * 0.7) * 0.15
      const segmentLength = tendril.segmentLengths[i] * lengthVariation
      
      // Calculate next point
      const perpAngle = currentAngle + Math.PI / 2
      currentX += Math.cos(currentAngle) * segmentLength
      currentY += Math.sin(currentAngle) * segmentLength
      currentX += Math.cos(perpAngle) * perpOffset
      currentY += Math.sin(perpAngle) * perpOffset
      
      totalLength += segmentLength
      
      // Check bounds and fade out near edges
      const distFromCenter = Math.sqrt(
        Math.pow(currentX - cx, 2) + Math.pow(currentY - cy, 2)
      )
      const edgeFade = Math.max(0.4, 1 - (distFromCenter / maxRadius) * 0.6) // Less aggressive fade
      const progressFade = 1 - progress * 0.25 // Less aggressive end fade
      const alpha = Math.max(0.15, config.opacity * edgeFade * progressFade) // Ensure minimum visibility
      
      // Stop if too far (but allow more overflow)
      if (distFromCenter > maxRadius * 1.5) {
        break
      }
      
      points.push({ x: currentX, y: currentY, alpha })
    }

    if (points.length < 2) return

    // Draw smooth curve using Catmull-Rom-like interpolation
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = i < points.length - 2 ? points[i + 2] : p2

      // Thickness tapers smoothly towards the end
      const t1 = i / (points.length - 1)
      const t2 = (i + 1) / (points.length - 1)
      const thickness1 = thickness * (1 - t1 * 0.7)
      const thickness2 = thickness * (1 - t2 * 0.7)

      // Calculate smooth direction using neighboring points
      const dx1 = p2.x - p0.x
      const dy1 = p2.y - p0.y
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
      const dirX = len1 > 0 ? dx1 / len1 : 1
      const dirY = len1 > 0 ? dy1 / len1 : 0

      const perpX = -dirY
      const perpY = dirX

      // Create smooth tapered segment
      const pointsArray: number[] = [
        p1.x + perpX * thickness1, p1.y + perpY * thickness1,
        p1.x - perpX * thickness1, p1.y - perpY * thickness1,
        p2.x - perpX * thickness2, p2.y - perpY * thickness2,
        p2.x + perpX * thickness2, p2.y + perpY * thickness2,
      ]

      const avgAlpha = Math.max(0.1, (p1.alpha + p2.alpha) / 2)
      tendril.g.poly(pointsArray, true)
      tendril.g.fill({ color, alpha: avgAlpha })
    }

    // Add subtle glow outline (smoother)
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]
      const p2 = points[i + 1]
      
      const t1 = i / (points.length - 1)
      const thickness1 = (thickness * 1.4) * (1 - t1 * 0.7)
      
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len === 0) continue

      const avgAlpha = (p1.alpha + p2.alpha) / 2
      tendril.g.setStrokeStyle({ 
        width: thickness1 * 0.25, 
        color: color2, 
        alpha: avgAlpha * 0.4
      })
      tendril.g.moveTo(p1.x, p1.y)
      tendril.g.lineTo(p2.x, p2.y)
      tendril.g.stroke()
    }
  }

  startAnimation((t) => {
    for (const tendril of tendrils) {
      drawTendril(tendril, t)
    }
  })
}

// =====================================================
// WHIRLPOOL/CYCLONE - Rotating swirling vortex effect
// =====================================================
function createWhirlpoolEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)
  applyCircleMask(container, config, width, height)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const maxRadius = Math.min(width, height) * 0.45
  const particleCount = Math.min(80, Math.round(50 * config.intensity))

  interface SwirlParticle {
    g: PIXI.Graphics
    baseRadius: number
    baseAngle: number
    phase: number
    speed: number
    size: number
    depth: number // 0-1, affects size and opacity
    radiusVariation: number // Random variation in radius
    angleOffset: number // Random angle offset
    sizeVariation: number // Random size multiplier
    speedVariation: number // Random speed multiplier
    colorVariation: number // Random color variation (0-1)
  }

  interface DebrisParticle {
    g: PIXI.Graphics
    startRadius: number
    currentRadius: number
    angle: number
    angularVelocity: number
    radialVelocity: number // Pulled inward
    size: number
    rotation: number
    rotationSpeed: number
    shape: 'square' | 'triangle' | 'circle' | 'irregular'
    color: number
    life: number
    maxLife: number
    phase: number
  }

  const particles: SwirlParticle[] = []
  const debrisParticles: DebrisParticle[] = []

  // Create particles in spiral pattern with more randomness
  for (let i = 0; i < particleCount; i++) {
    const g = new PIXI.Graphics()
    container.addChild(g)

    // More varied distribution - not perfectly linear
    const baseProgress = i / particleCount
    const progress = baseProgress + (Math.random() - 0.5) * 0.15 // Add randomness
    const depth = Math.max(0, Math.min(1, progress)) // Clamp to 0-1
    
    // Radius with variation
    const baseRadius = depth * maxRadius
    const radiusVariation = (Math.random() - 0.5) * maxRadius * 0.2
    
    // Angle with more rotations and randomness
    const baseAngle = progress * Math.PI * 10 + (Math.random() - 0.5) * 0.5
    const angleOffset = (Math.random() - 0.5) * 0.3
    
    // Size with more variation
    const baseSize = (3 + (1 - depth) * 8) * s * config.intensity
    const sizeVariation = 0.7 + Math.random() * 0.6 // 0.7 to 1.3 multiplier
    
    // Speed variation
    const baseSpeed = 0.7 + (1 - depth) * 0.5
    const speedVariation = 0.8 + Math.random() * 0.4 // 0.8 to 1.2 multiplier

    particles.push({
      g,
      baseRadius,
      baseAngle,
      phase: Math.random() * Math.PI * 2,
      speed: baseSpeed * speedVariation,
      size: baseSize * sizeVariation,
      depth,
      radiusVariation,
      angleOffset,
      sizeVariation,
      speedVariation,
      colorVariation: Math.random(), // For color mixing
    })
  }

  // Draw particle as a streak (elongated in direction of motion)
  function drawSwirlParticle(p: SwirlParticle, angle: number, radius: number, t: number) {
    p.g.clear()

    // Add subtle radius wobble for more organic motion
    const radiusWobble = Math.sin(t * p.speed * 1.5 + p.phase * 2) * p.radiusVariation * 0.3
    const finalRadius = radius + radiusWobble
    
    const x = cx + Math.cos(angle) * finalRadius
    const y = cy + Math.sin(angle) * finalRadius

    // Particle opacity based on depth and motion with more variation
    const baseAlpha = config.opacity * (0.5 + (1 - p.depth) * 0.5)
    const motionAlpha = 0.6 + Math.sin(t * p.speed * 2.5 + p.phase) * 0.4
    const flicker = 0.9 + Math.sin(t * p.speed * 4 + p.phase * 3) * 0.1
    const alpha = baseAlpha * motionAlpha * flicker

    // Color mixing for more variety
    const colorMix = p.colorVariation < 0.3 ? color1 : (p.colorVariation < 0.7 ? color2 : lerpColor(color1, color2, 0.5))
    
    // Draw elongated streak in direction of rotation with variation
    const baseStreakLength = p.size * (1.8 + Math.sin(t * p.speed * 3.5 + p.phase) * 0.7)
    const streakLength = baseStreakLength * (0.9 + Math.sin(t * p.speed * 2 + p.phase * 1.5) * 0.2)
    const streakAngle = angle + Math.sin(t * p.speed * 1.2 + p.phase) * 0.1 // Slight angle variation

    // Main streak body with gradient-like effect
    const streakWidth = p.size * (0.7 + Math.sin(t * p.speed * 4 + p.phase) * 0.3)
    p.g.setStrokeStyle({
      width: streakWidth,
      color: colorMix,
      alpha: alpha * 0.85,
    })
    p.g.moveTo(
      x - Math.cos(streakAngle) * streakLength * 0.5,
      y - Math.sin(streakAngle) * streakLength * 0.5
    )
    p.g.lineTo(
      x + Math.cos(streakAngle) * streakLength * 0.5,
      y + Math.sin(streakAngle) * streakLength * 0.5
    )
    p.g.stroke()

    // Bright center point with size variation
    const centerSize = p.size * (0.5 + Math.sin(t * p.speed * 5 + p.phase) * 0.2)
    p.g.circle(x, y, centerSize)
    p.g.fill({ color: color2, alpha: alpha * 0.95 })

    // Secondary glow ring
    p.g.circle(x, y, p.size * 0.9)
    p.g.fill({ color: colorMix, alpha: alpha * 0.5 })

    // Outer glow with pulsing
    const glowSize = p.size * (1.1 + Math.sin(t * p.speed * 2.5 + p.phase) * 0.3)
    p.g.circle(x, y, glowSize)
    p.g.fill({ color: color1, alpha: alpha * 0.25     })
  }

  // Create debris particles
  const debrisCount = Math.min(25, Math.round(15 * config.intensity))
  const debrisColors = [
    hexToNumber('#8B4513'), // Brown
    hexToNumber('#654321'), // Dark brown
    hexToNumber('#A0522D'), // Sienna
    hexToNumber('#696969'), // Dim gray
    hexToNumber('#556B2F'), // Dark olive
    hexToNumber('#2F4F4F'), // Dark slate gray
  ]

  for (let i = 0; i < debrisCount; i++) {
    const g = new PIXI.Graphics()
    container.addChild(g)

    // Start at random position outside the whirlpool
    const startRadius = maxRadius * (1.1 + Math.random() * 0.4)
    const startAngle = Math.random() * Math.PI * 2
    const size = (3 + Math.random() * 8) * s
    const shapeTypes: ('square' | 'triangle' | 'circle' | 'irregular')[] = ['square', 'triangle', 'circle', 'irregular']
    const shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)]

    debrisParticles.push({
      g,
      startRadius,
      currentRadius: startRadius,
      angle: startAngle,
      angularVelocity: (0.3 + Math.random() * 0.5) * config.speed, // Rotation speed
      radialVelocity: (0.02 + Math.random() * 0.03) * config.speed, // Pulled inward
      size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (0.5 + Math.random() * 1.5) * config.speed,
      shape,
      color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
      life: 0,
      maxLife: 200 + Math.random() * 100,
      phase: Math.random() * Math.PI * 2,
    })
  }

  // Draw debris particle
  function drawDebris(p: DebrisParticle, t: number) {
    p.g.clear()

    const x = cx + Math.cos(p.angle) * p.currentRadius
    const y = cy + Math.sin(p.angle) * p.currentRadius

    // Opacity based on life and distance from center
    const lifeRatio = p.life / p.maxLife
    const distanceFade = Math.max(0.3, 1 - (p.currentRadius / maxRadius) * 0.5)
    const alpha = config.opacity * distanceFade * (1 - lifeRatio * 0.3)

    p.g.x = x
    p.g.y = y
    p.g.rotation = p.rotation

    // Draw different shapes
    const halfSize = p.size * 0.5
    switch (p.shape) {
      case 'square':
        p.g.rect(-halfSize, -halfSize, p.size, p.size)
        p.g.fill({ color: p.color, alpha })
        // Add some detail
        p.g.rect(-halfSize * 0.6, -halfSize * 0.6, p.size * 0.6, p.size * 0.6)
        p.g.fill({ color: p.color, alpha: alpha * 0.5 })
        break
      case 'triangle':
        p.g.moveTo(0, -halfSize)
        p.g.lineTo(-halfSize, halfSize)
        p.g.lineTo(halfSize, halfSize)
        p.g.closePath()
        p.g.fill({ color: p.color, alpha })
        break
      case 'circle':
        p.g.circle(0, 0, halfSize)
        p.g.fill({ color: p.color, alpha })
        p.g.circle(0, 0, halfSize * 0.6)
        p.g.fill({ color: p.color, alpha: alpha * 0.6 })
        break
      case 'irregular':
        // Irregular polygon
        const sides = 4 + Math.floor(Math.random() * 3)
        const points: number[] = []
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2 + p.phase
          const r = halfSize * (0.7 + Math.random() * 0.3)
          points.push(Math.cos(angle) * r, Math.sin(angle) * r)
        }
        p.g.poly(points, true)
        p.g.fill({ color: p.color, alpha })
        break
    }

    // Add subtle shadow/outline
    p.g.setStrokeStyle({
      width: 1,
      color: 0x000000,
      alpha: alpha * 0.3,
    })
    p.g.stroke()
  }
  
  // Helper to lerp between colors
  function lerpColor(c1: number, c2: number, t: number): number {
    const r1 = (c1 >> 16) & 0xff
    const g1 = (c1 >> 8) & 0xff
    const b1 = c1 & 0xff
    const r2 = (c2 >> 16) & 0xff
    const g2 = (c2 >> 8) & 0xff
    const b2 = c2 & 0xff
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    return (r << 16) | (g << 8) | b
  }

  // Draw spiral arms (main structure) with more variation
  const spiralArms = 3 + Math.floor(Math.random() * 2) // 3-4 arms
  const spiralGraphics = new PIXI.Graphics()
  container.addChildAt(spiralGraphics, 0) // Behind particles
  
  // Pre-calculate arm variations
  const armVariations: { angleOffset: number; speedMultiplier: number; wavePhase: number }[] = []
  for (let arm = 0; arm < spiralArms; arm++) {
    armVariations.push({
      angleOffset: (Math.random() - 0.5) * 0.3,
      speedMultiplier: 0.8 + Math.random() * 0.4,
      wavePhase: Math.random() * Math.PI * 2,
    })
  }

  function drawSpiralArms(t: number) {
    spiralGraphics.clear()

    for (let arm = 0; arm < spiralArms; arm++) {
      const variation = armVariations[arm]
      const armAngle = (arm / spiralArms) * Math.PI * 2 + variation.angleOffset
      const rotation = t * config.speed * 0.4 * variation.speedMultiplier + armAngle

      // Draw spiral path with more segments for smoother curves
      const segments = 50
      const points: { x: number; y: number; progress: number }[] = []

      for (let i = 0; i <= segments; i++) {
        const progress = i / segments
        const radius = progress * maxRadius
        
        // More varied spiral tightness
        const spiralTightness = 3.5 + Math.sin(progress * Math.PI * 2 + variation.wavePhase) * 0.5
        const angle = rotation + progress * Math.PI * spiralTightness
        
        const x = cx + Math.cos(angle) * radius
        const y = cy + Math.sin(angle) * radius

        // More complex wave variation
        const wave1 = Math.sin(progress * Math.PI * 8 + t * 2 + variation.wavePhase) * radius * 0.08
        const wave2 = Math.sin(progress * Math.PI * 12 + t * 1.5 + variation.wavePhase * 1.3) * radius * 0.05
        const wave = wave1 + wave2
        const perpAngle = angle + Math.PI / 2
        const finalX = x + Math.cos(perpAngle) * wave
        const finalY = y + Math.sin(perpAngle) * wave

        points.push({ x: finalX, y: finalY, progress })
      }

      // Draw spiral as thick line with varying thickness and opacity
      spiralGraphics.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1]
        const p2 = points[i]
        const avgProgress = (p1.progress + p2.progress) / 2
        
        // Thickness tapers more smoothly
        const baseThickness = (2.5 + (1 - avgProgress) * 5) * s
        const thickness = baseThickness * (1 + Math.sin(t * 2 + avgProgress * Math.PI * 4) * 0.15)
        
        // Opacity varies along the spiral
        const opacity = config.opacity * (0.35 + (1 - avgProgress) * 0.25) * (0.9 + Math.sin(t * 1.5 + avgProgress * Math.PI * 6) * 0.1)
        
        spiralGraphics.setStrokeStyle({
          width: thickness,
          color: color1,
          alpha: opacity,
        })
        spiralGraphics.lineTo(p2.x, p2.y)
        spiralGraphics.stroke()
        
        // Add glow around spiral with variation
        const glowThickness = thickness * (1.8 + Math.sin(t * 1.2 + avgProgress * Math.PI * 3) * 0.2)
        spiralGraphics.setStrokeStyle({
          width: glowThickness,
          color: color2,
          alpha: opacity * 0.4,
        })
        spiralGraphics.moveTo(p1.x, p1.y)
        spiralGraphics.lineTo(p2.x, p2.y)
        spiralGraphics.stroke()
        
        // Move back to current point for next segment
        spiralGraphics.moveTo(p2.x, p2.y)
      }
    }
  }

  startAnimation((t) => {
    // Draw spiral arms
    drawSpiralArms(t)

    // Update and draw particles with more organic motion
    for (const p of particles) {
      // Calculate position in spiral with more variation
      const rotation = t * config.speed * p.speed
      const angle = p.baseAngle + rotation + p.angleOffset + Math.sin(t * p.speed * 0.8 + p.phase) * 0.15
      
      // Radius with more dynamic variation
      const radiusPulse = 1 + Math.sin(t * p.speed * 0.6 + p.phase * 1.5) * 0.12
      const radiusDrift = Math.sin(t * p.speed * 0.3 + p.phase * 2) * 0.08
      const radius = (p.baseRadius + p.radiusVariation) * radiusPulse * (1 + radiusDrift)

      drawSwirlParticle(p, angle, radius, t)
    }

    // Update and draw debris particles
    for (const debris of debrisParticles) {
      debris.life++
      
      // Update rotation
      debris.rotation += debris.rotationSpeed * 0.01
      
      // Update angle (spiral inward)
      debris.angle += debris.angularVelocity * (1 + (debris.startRadius - debris.currentRadius) / maxRadius)
      
      // Pull inward (faster as it gets closer to center)
      const pullStrength = 1 + (maxRadius - debris.currentRadius) / maxRadius * 2
      debris.currentRadius -= debris.radialVelocity * pullStrength
      
      // Add some wobble
      const wobble = Math.sin(t * 2 + debris.phase) * debris.size * 0.1
      debris.angle += wobble * 0.01
      
      // Respawn if pulled too far in or life expired
      if (debris.currentRadius < maxRadius * 0.1 || debris.life > debris.maxLife) {
        debris.currentRadius = debris.startRadius * (1 + Math.random() * 0.3)
        debris.angle = Math.random() * Math.PI * 2
        debris.life = 0
        debris.rotation = Math.random() * Math.PI * 2
        debris.phase = Math.random() * Math.PI * 2
        // Randomize some properties
        debris.angularVelocity = (0.3 + Math.random() * 0.5) * config.speed
        debris.radialVelocity = (0.02 + Math.random() * 0.03) * config.speed
      }
      
      drawDebris(debris, t)
    }
  })
}

// =====================================================
// TERRAIN EFFECTS - Tileable terrain textures
// =====================================================

// Grass tile - green rectangle with animated grass blades
function createGrassEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const opacity = config.opacity ?? 1

  // Apply circle mask if enabled, otherwise use rectangular feathering for terrain
  if (config.useCircleMask) {
    applyCircleMask(container, config, width, height)
  } else {
    // Create feathered rectangular mask for terrain tiles
    const mask = new PIXI.Graphics()
    const featherSize = Math.min(width, height) * 0.15
    const maskLayers = 25
    
    // Draw full rectangle first (fully visible)
    mask.rect(0, 0, width, height)
    mask.fill({ color: 0xffffff, alpha: 1 })
    
    // Feather edges by drawing rectangles with decreasing alpha
    for (let layer = 0; layer < maskLayers; layer++) {
      const progress = layer / maskLayers
      const offset = progress * featherSize
      const alpha = 1 - progress
      
      // Top edge
      mask.rect(0, 0, width, offset)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Bottom edge
      mask.rect(0, height - offset, width, offset)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Left edge
      mask.rect(0, offset, offset, height - offset * 2)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Right edge
      mask.rect(width - offset, offset, offset, height - offset * 2)
      mask.fill({ color: 0xffffff, alpha: alpha })
    }
    
    container.mask = mask
    container.addChild(mask)
  }

  // Base grass rectangle with texture variation
  const base = new PIXI.Graphics()
  // Main base first
  base.rect(0, 0, width, height)
  base.fill({ color: color1, alpha: opacity })
  // Add subtle texture with small patches
  for (let i = 0; i < 20; i++) {
    const patchX = Math.random() * width
    const patchY = Math.random() * height
    const patchSize = (5 + Math.random() * 10) * s
    const patchColor = Math.random() > 0.5 ? color1 : color2
    base.circle(patchX, patchY, patchSize)
    base.fill({ color: patchColor, alpha: opacity * 0.3 })
  }
  container.addChild(base)

  // Grass blades layer
  const grassBlades = new PIXI.Graphics()
  container.addChild(grassBlades)

  interface GrassBlade {
    x: number
    y: number
    height: number
    width: number
    phase: number
    swaySpeed: number
    bladeType: 'tall' | 'medium' | 'short'
    color: number
  }

  const bladeCount = Math.max(1, Math.round(30 * config.intensity * (width * height) / (100 * 100)))
  const blades: GrassBlade[] = []

  // Create more natural distribution - clusters
  const clusterCount = Math.max(1, Math.floor(bladeCount / 4))
  for (let i = 0; i < clusterCount; i++) {
    const clusterX = Math.random() * width
    const clusterY = Math.random() * height
    const clusterSize = 3 + Math.random() * 5
    
    for (let j = 0; j < clusterSize && blades.length < bladeCount * 4; j++) {
      const bladeType = Math.random() < 0.3 ? 'tall' : (Math.random() < 0.6 ? 'medium' : 'short')
      const baseHeight = bladeType === 'tall' ? 15 : (bladeType === 'medium' ? 10 : 6)
      
      const bladeColor = Math.random() > 0.3 ? color2 : (Math.random() > 0.5 ? color1 : lerpColor(config.color, config.secondaryColor || config.color, Math.random()))
      
      blades.push({
        x: clusterX + (Math.random() - 0.5) * 8 * s,
        y: clusterY + (Math.random() - 0.5) * 4 * s,
        height: (baseHeight + Math.random() * 5) * s,
        width: (0.8 + Math.random() * 1.5) * s,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.2 + Math.random() * 0.5,
        bladeType,
        color: typeof bladeColor === 'number' ? bladeColor : hexToNumber(bladeColor),
      })
    }
  }

  function drawGrassBlades(t: number) {
    grassBlades.clear()
    
    for (let i = 0; i < blades.length; i++) {
      const blade = blades[i]
      const windWave = Math.sin(t * blade.swaySpeed * config.speed + blade.phase)
      const windStrength = 0.4 + Math.sin(t * 0.3 + blade.phase * 0.5) * 0.2
      const sway = windWave * blade.width * windStrength
      const lean = Math.cos(t * blade.swaySpeed * config.speed * 0.6 + blade.phase) * blade.width * 0.3
      
      // More realistic blade shape - tapered and curved
      const tipX = blade.x + sway + lean
      const tipY = blade.y - blade.height
      const midX = blade.x + sway * 0.6
      const midY = blade.y - blade.height * 0.5
      
      // Draw blade with gradient-like effect
      grassBlades.moveTo(blade.x, blade.y)
      grassBlades.quadraticCurveTo(midX, midY, tipX, tipY)
      grassBlades.lineTo(blade.x + blade.width + sway + lean, tipY)
      grassBlades.quadraticCurveTo(
        blade.x + blade.width + sway * 0.6,
        midY,
        blade.x + blade.width,
        blade.y
      )
      grassBlades.closePath()
      
      // Vary color and opacity for realism (deterministic based on blade index)
      const bladeAlpha = opacity * (0.75 + (i % 4) * 0.0625)
      grassBlades.fill({ color: blade.color, alpha: bladeAlpha })
      
      // Add highlight on some blades (deterministic based on blade index)
      if (i % 5 === 0) {
        const highlightColor = lerpColor(config.secondaryColor || config.color, '#ffffff', 0.3)
        grassBlades.moveTo(blade.x + blade.width * 0.2, blade.y)
        grassBlades.quadraticCurveTo(
          blade.x + blade.width * 0.3 + sway * 0.3,
          blade.y - blade.height * 0.3,
          blade.x + blade.width * 0.4 + sway * 0.5,
          blade.y - blade.height * 0.6
        )
        grassBlades.lineTo(blade.x + blade.width * 0.4 + sway * 0.5, blade.y - blade.height)
        grassBlades.lineTo(blade.x + blade.width * 0.2 + sway * 0.5, blade.y - blade.height)
        grassBlades.closePath()
        grassBlades.fill({ color: highlightColor, alpha: bladeAlpha * 0.4 })
      }
    }
  }

  startAnimation((t) => {
    drawGrassBlades(t)
  })
}

// Water tile - blue translucent with animated waves
function createWaterEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const opacity = config.opacity ?? 0.7

  // Apply circle mask if enabled, otherwise use rectangular feathering for terrain
  if (config.useCircleMask) {
    applyCircleMask(container, config, width, height)
  } else {
    // Create feathered rectangular mask for terrain tiles
    const mask = new PIXI.Graphics()
    const featherSize = Math.min(width, height) * 0.15
    const maskLayers = 25
    
    // Draw full rectangle first (fully visible)
    mask.rect(0, 0, width, height)
    mask.fill({ color: 0xffffff, alpha: 1 })
    
    // Feather edges by drawing rectangles with decreasing alpha
    for (let layer = 0; layer < maskLayers; layer++) {
      const progress = layer / maskLayers
      const offset = progress * featherSize
      const alpha = 1 - progress
      
      // Top edge
      mask.rect(0, 0, width, offset)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Bottom edge
      mask.rect(0, height - offset, width, offset)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Left edge
      mask.rect(0, offset, offset, height - offset * 2)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Right edge
      mask.rect(width - offset, offset, offset, height - offset * 2)
      mask.fill({ color: 0xffffff, alpha: alpha })
    }
    
    container.mask = mask
    container.addChild(mask)
  }

  // Base water rectangle with depth variation
  const base = new PIXI.Graphics()
  // Main base first
  base.rect(0, 0, width, height)
  base.fill({ color: color1, alpha: opacity * 0.65 })
  // Add depth patches for more realistic look
  for (let i = 0; i < 15; i++) {
    const patchX = Math.random() * width
    const patchY = Math.random() * height
    const patchSize = (10 + Math.random() * 20) * s
    const depthColor = lerpColor(config.color, '#1a3a5a', 0.3)
    base.circle(patchX, patchY, patchSize)
    base.fill({ color: depthColor, alpha: opacity * 0.2 })
  }
  container.addChild(base)

  // Wave layers - multiple for depth
  const wavesBack = new PIXI.Graphics()
  const wavesMid = new PIXI.Graphics()
  const wavesFront = new PIXI.Graphics()
  container.addChild(wavesBack)
  container.addChild(wavesMid)
  container.addChild(wavesFront)

  const waveAmplitude = (2 + config.intensity * 6) * s
  const waveFrequency = 0.015 * s
  const waveCount = Math.ceil(height / (18 * s)) + 3

  function drawWaves(t: number) {
    wavesBack.clear()
    wavesMid.clear()
    wavesFront.clear()
    
    // Back waves (deeper, slower)
    for (let waveIndex = 0; waveIndex < waveCount; waveIndex++) {
      const waveY = (waveIndex * 18 * s) - (t * config.speed * 6 * s) % (18 * s)
      const wavePhase = waveIndex * 0.4
      
      const points: { x: number; y: number }[] = []
      for (let x = 0; x <= width; x += 3) {
        const wave1 = Math.sin(x * waveFrequency * 0.8 + t * config.speed * 1.2 + wavePhase) * waveAmplitude * 0.6
        const y = waveY + wave1
        points.push({ x, y })
      }
      
      wavesBack.moveTo(0, waveY + waveAmplitude)
      for (const point of points) {
        wavesBack.lineTo(point.x, point.y)
      }
      wavesBack.lineTo(width, waveY + waveAmplitude)
      wavesBack.closePath()
      wavesBack.fill({ color: color2, alpha: opacity * 0.15 })
    }
    
    // Mid waves (main waves)
    for (let waveIndex = 0; waveIndex < waveCount; waveIndex++) {
      const waveY = (waveIndex * 18 * s) - (t * config.speed * 8 * s) % (18 * s)
      const wavePhase = waveIndex * 0.5
      
      const points: { x: number; y: number }[] = []
      for (let x = 0; x <= width; x += 2) {
        const wave1 = Math.sin(x * waveFrequency + t * config.speed * 2 + wavePhase) * waveAmplitude
        const wave2 = Math.sin(x * waveFrequency * 1.7 + t * config.speed * 1.6 + wavePhase * 1.3) * waveAmplitude * 0.4
        const y = waveY + wave1 + wave2
        points.push({ x, y })
      }
      
      wavesMid.moveTo(0, waveY + waveAmplitude * 1.5)
      for (const point of points) {
        wavesMid.lineTo(point.x, point.y)
      }
      wavesMid.lineTo(width, waveY + waveAmplitude * 1.5)
      wavesMid.closePath()
      
      const waveAlpha = opacity * (0.25 + Math.sin(t * config.speed * 1.5 + wavePhase) * 0.15)
      wavesMid.fill({ color: color2, alpha: waveAlpha })
    }
    
    // Front waves (foam/whitecaps)
    for (let waveIndex = 0; waveIndex < waveCount; waveIndex++) {
      const waveY = (waveIndex * 18 * s) - (t * config.speed * 10 * s) % (18 * s)
      const wavePhase = waveIndex * 0.6
      
      const points: { x: number; y: number }[] = []
      for (let x = 0; x <= width; x += 2) {
        const wave1 = Math.sin(x * waveFrequency * 1.2 + t * config.speed * 2.5 + wavePhase) * waveAmplitude * 0.8
        const y = waveY + wave1
        points.push({ x, y })
      }
      
      // Draw foam on wave crests
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i]
        const p2 = points[i + 1]
        if (p1.y < waveY - waveAmplitude * 0.3) {
          wavesFront.circle(p1.x, p1.y, (1 + Math.random() * 2) * s)
          wavesFront.fill({ color: 0xffffff, alpha: opacity * 0.3 })
        }
      }
      
      wavesFront.moveTo(0, waveY + waveAmplitude * 0.5)
      for (const point of points) {
        wavesFront.lineTo(point.x, point.y)
      }
      wavesFront.lineTo(width, waveY + waveAmplitude * 0.5)
      wavesFront.closePath()
      wavesFront.fill({ color: color2, alpha: opacity * 0.2 })
    }
  }

  // Ripples layer
  const ripples = new PIXI.Graphics()
  container.addChild(ripples)

  interface Ripple {
    x: number
    y: number
    radius: number
    life: number
    maxLife: number
  }

  const rippleList: Ripple[] = []

  function drawRipples(t: number) {
    ripples.clear()
    
    // Spawn new ripples occasionally
    if (Math.random() > 0.98) {
      rippleList.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0,
        life: 0,
        maxLife: 60 + Math.random() * 40,
      })
    }
    
    for (let i = rippleList.length - 1; i >= 0; i--) {
      const ripple = rippleList[i]
      ripple.life++
      ripple.radius += 0.5 * s
      
      if (ripple.life > ripple.maxLife) {
        rippleList.splice(i, 1)
        continue
      }
      
      const lifeRatio = ripple.life / ripple.maxLife
      const rippleAlpha = opacity * (1 - lifeRatio) * 0.2
      
      ripples.circle(ripple.x, ripple.y, ripple.radius)
      ripples.stroke({ width: 1, color: color2, alpha: rippleAlpha })
      ripples.circle(ripple.x, ripple.y, ripple.radius * 0.7)
      ripples.stroke({ width: 1, color: color2, alpha: rippleAlpha * 0.5 })
    }
  }

  startAnimation((t) => {
    drawWaves(t)
    drawRipples(t)
  })
}

// Lava tile - red/orange with animated bubbles and glowing bits
function createLavaEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)

  const s = config.scale * scale
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const opacity = config.opacity ?? 0.9

  // Apply circle mask if enabled, otherwise use rectangular feathering for terrain
  if (config.useCircleMask) {
    applyCircleMask(container, config, width, height)
  } else {
    // Create feathered rectangular mask for terrain tiles
    const mask = new PIXI.Graphics()
    const featherSize = Math.min(width, height) * 0.15
    const maskLayers = 25
    
    // Draw full rectangle first (fully visible)
    mask.rect(0, 0, width, height)
    mask.fill({ color: 0xffffff, alpha: 1 })
    
    // Feather edges by drawing rectangles with decreasing alpha
    for (let layer = 0; layer < maskLayers; layer++) {
      const progress = layer / maskLayers
      const offset = progress * featherSize
      const alpha = 1 - progress
      
      // Top edge
      mask.rect(0, 0, width, offset)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Bottom edge
      mask.rect(0, height - offset, width, offset)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Left edge
      mask.rect(0, offset, offset, height - offset * 2)
      mask.fill({ color: 0xffffff, alpha: alpha })
      // Right edge
      mask.rect(width - offset, offset, offset, height - offset * 2)
      mask.fill({ color: 0xffffff, alpha: alpha })
    }
    
    container.mask = mask
    container.addChild(mask)
  }

  // Base lava rectangle with texture variation
  const base = new PIXI.Graphics()
  // Main base first
  base.rect(0, 0, width, height)
  base.fill({ color: color1, alpha: opacity })
  // Add hot spots and cooler areas for realism
  for (let i = 0; i < 25; i++) {
    const spotX = Math.random() * width
    const spotY = Math.random() * height
    const spotSize = (8 + Math.random() * 15) * s
    const isHot = Math.random() > 0.5
    const spotColor = isHot ? color2 : lerpColor(config.color, '#8b0000', 0.4)
    base.circle(spotX, spotY, spotSize)
    base.fill({ color: spotColor, alpha: opacity * (isHot ? 0.4 : 0.2) })
  }
  container.addChild(base)

  // Lava bubbles and glowing bits
  interface LavaBubble {
    x: number
    y: number
    size: number
    life: number
    maxLife: number
    phase: number
    speed: number
    bubbleType: 'small' | 'medium' | 'large'
    riseSpeed: number
  }

  const bubbleCount = Math.round(20 * config.intensity)
  const bubbles: LavaBubble[] = []

  for (let i = 0; i < bubbleCount; i++) {
    const bubbleType = Math.random() < 0.5 ? 'small' : (Math.random() < 0.8 ? 'medium' : 'large')
    const baseSize = bubbleType === 'small' ? 2 : (bubbleType === 'medium' ? 5 : 9)
    
    bubbles.push({
      x: Math.random() * width,
      y: height + Math.random() * 20 * s, // Start below
      size: (baseSize + Math.random() * 3) * s,
      life: Math.random() * 50,
      maxLife: 80 + Math.random() * 120,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      bubbleType,
      riseSpeed: (0.2 + Math.random() * 0.4) * s,
    })
  }

  const bubbleGraphics = new PIXI.Graphics()
  container.addChild(bubbleGraphics)

  function drawBubbles(t: number) {
    bubbleGraphics.clear()

    for (const bubble of bubbles) {
      bubble.life += bubble.speed * config.speed
      bubble.y -= bubble.riseSpeed * config.speed
      
      // Horizontal drift
      bubble.x += Math.sin(t * 0.5 + bubble.phase) * 0.2 * s
      
      if (bubble.life > bubble.maxLife || bubble.y < -bubble.size * 2) {
        bubble.life = 0
        bubble.x = Math.random() * width
        bubble.y = height + Math.random() * 20 * s
        const bubbleType = Math.random() < 0.5 ? 'small' : (Math.random() < 0.8 ? 'medium' : 'large')
        const baseSize = bubbleType === 'small' ? 2 : (bubbleType === 'medium' ? 5 : 9)
        bubble.size = (baseSize + Math.random() * 3) * s
        bubble.maxLife = 80 + Math.random() * 120
        bubble.bubbleType = bubbleType
      }

      const lifeRatio = bubble.life / bubble.maxLife
      const pulse = 0.85 + Math.sin(t * 4 * config.speed + bubble.phase) * 0.15
      const currentSize = bubble.size * pulse
      const bubbleAlpha = opacity * (0.5 + (1 - lifeRatio) * 0.5)

      // More realistic bubble with multiple layers
      // Outer glow
      bubbleGraphics.circle(bubble.x, bubble.y, currentSize * 2)
      bubbleGraphics.fill({ color: color2, alpha: bubbleAlpha * 0.2 })
      
      // Mid glow
      bubbleGraphics.circle(bubble.x, bubble.y, currentSize * 1.4)
      bubbleGraphics.fill({ color: color2, alpha: bubbleAlpha * 0.4 })
      
      // Main bubble
      bubbleGraphics.circle(bubble.x, bubble.y, currentSize)
      bubbleGraphics.fill({ color: color2, alpha: bubbleAlpha * 0.8 })
      
      // Hot center
      bubbleGraphics.circle(bubble.x, bubble.y, currentSize * 0.5)
      bubbleGraphics.fill({ color: 0xffff88, alpha: bubbleAlpha })
      
      // Bright core
      bubbleGraphics.circle(bubble.x, bubble.y, currentSize * 0.25)
      bubbleGraphics.fill({ color: 0xffffff, alpha: bubbleAlpha * 0.9 })
      
      // Add small bubbles around large ones
      if (bubble.bubbleType === 'large' && Math.random() > 0.7) {
        const smallX = bubble.x + (Math.random() - 0.5) * currentSize * 1.5
        const smallY = bubble.y + (Math.random() - 0.5) * currentSize * 1.5
        const smallSize = currentSize * 0.3
        bubbleGraphics.circle(smallX, smallY, smallSize)
        bubbleGraphics.fill({ color: color2, alpha: bubbleAlpha * 0.6 })
        bubbleGraphics.circle(smallX, smallY, smallSize * 0.5)
        bubbleGraphics.fill({ color: 0xffff88, alpha: bubbleAlpha * 0.8 })
      }
    }
  }

  // Surface glow and flow effects
  const surfaceGlow = new PIXI.Graphics()
  container.addChild(surfaceGlow)

  function drawSurfaceGlow(t: number) {
    surfaceGlow.clear()
    
    // Multiple moving glow bands for flow effect
    for (let i = 0; i < 3; i++) {
      const glowY = ((t * config.speed * (3 + i) * s) + i * height / 3) % (height + 30 * s) - 15 * s
      const glowHeight = (10 + i * 3) * s
      
      // Gradient-like glow
      for (let j = 0; j < 5; j++) {
        const bandY = glowY + j * glowHeight / 5
        const bandAlpha = opacity * 0.25 * (1 - j / 5) * (0.6 + Math.sin(t * config.speed * 2 + i) * 0.4)
        surfaceGlow.rect(0, bandY, width, glowHeight / 5)
        surfaceGlow.fill({ color: color2, alpha: bandAlpha })
      }
    }
    
    // Hot spots that move
    for (let i = 0; i < 5; i++) {
      const spotX = (width / 5 * i + t * config.speed * 10 * s) % (width + 20 * s) - 10 * s
      const spotY = Math.random() * height
      const spotSize = (5 + Math.random() * 8) * s
      const spotAlpha = opacity * 0.4 * (0.5 + Math.sin(t * config.speed * 3 + i) * 0.5)
      
      surfaceGlow.circle(spotX, spotY, spotSize)
      surfaceGlow.fill({ color: color2, alpha: spotAlpha })
      surfaceGlow.circle(spotX, spotY, spotSize * 0.6)
      surfaceGlow.fill({ color: 0xffff88, alpha: spotAlpha * 1.2 })
    }
  }

  startAnimation((t) => {
    drawBubbles(t)
    drawSurfaceGlow(t)
  })
}

function cleanup() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  if (app) {
    app.destroy(true, { children: true, texture: true })
    app = null
  }
}

function handleResize() {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(() => {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const w = rect.width || 150
    const h = rect.height || 150
    
    // Update container size for non-scaling handles
    containerSize.value = { width: w, height: h }
    
    if (w < 20 || h < 20 || !app) return
    app.renderer.resize(w, h)
    createEffect()
  }, 200)
}

let configTimeout: number | null = null
watch(() => props.item.data.effectConfig, () => {
  if (configTimeout) clearTimeout(configTimeout)
  configTimeout = window.setTimeout(() => {
    if (app) createEffect()
  }, 100)
}, { deep: true })

let resizeObserver: ResizeObserver | null = null

// =====================================================
// PATH EDITING FUNCTIONS (for beam effects)
// =====================================================

// Parse SVG path to editable points
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
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    if (i === 0) {
      d += `M ${p.x} ${p.y} `
    } else if (p.type === 'C' && p.cx1 != null && p.cx2 != null) {
      d += `C ${p.cx1} ${p.cy1}, ${p.cx2} ${p.cy2}, ${p.x} ${p.y} `
    } else if (p.type === 'Q' && p.cx1 != null) {
      d += `Q ${p.cx1} ${p.cy1}, ${p.x} ${p.y} `
    } else if (p.type === 'Z') {
      d += 'Z '
    } else {
      d += `L ${p.x} ${p.y} `
    }
  }
  return d.trim()
}

// Get SVG coordinates from mouse event, handling rotation via native SVG transform
function getSvgCoordinates(event: MouseEvent): { x: number; y: number } {
  if (!pathEditorSvg.value) return { x: 0, y: 0 }
  
  const svg = pathEditorSvg.value
  const ctm = svg.getScreenCTM()
  
  if (ctm) {
    // Use SVG's native coordinate system transformation (handles all CSS transforms)
    const point = svg.createSVGPoint()
    point.x = event.clientX
    point.y = event.clientY
    const svgPoint = point.matrixTransform(ctm.inverse())
    return { x: svgPoint.x, y: svgPoint.y }
  }
  
  // Fallback: manual calculation with rotation compensation
  const rect = svg.getBoundingClientRect()
  const viewBox = svg.viewBox.baseVal
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
  
  // Convert to viewBox coordinates
  const scaleX = viewBox.width / rect.width
  const scaleY = viewBox.height / rect.height
  
  return {
    x: (mouseX + rect.width / 2) * scaleX,
    y: (mouseY + rect.height / 2) * scaleY,
  }
}

// Start dragging a point
function startDrag(type: 'point' | 'control1' | 'control2', index: number, event: MouseEvent) {
  if (!pathEditorSvg.value) return
  
  isDragging.value = true
  dragType.value = type
  dragPointIndex.value = index
  
  // Store initial SVG position
  const pos = getSvgCoordinates(event)
  dragStartPos.value = pos
  
  const point = editablePoints.value[index]
  dragStartPoint.value = {
    x: point.x,
    y: point.y,
    cx1: point.cx1 || 0,
    cy1: point.cy1 || 0,
    cx2: point.cx2 || 0,
    cy2: point.cy2 || 0,
  }
  
  selectedPointIndex.value = index
  event.preventDefault()
}

// Handle mouse move for dragging
function handlePathEditorMouseMove(event: MouseEvent) {
  if (!isDragging.value || !pathEditorSvg.value || dragPointIndex.value === null) return
  
  // Get current SVG coordinates (handles rotation automatically)
  const pos = getSvgCoordinates(event)
  
  // Calculate delta in SVG coordinate space
  const dx = pos.x - dragStartPos.value.x
  const dy = pos.y - dragStartPos.value.y
  
  const point = editablePoints.value[dragPointIndex.value]
  
  if (dragType.value === 'point') {
    // Clamp to viewBox
    point.x = Math.max(0, Math.min(100, dragStartPoint.value.x + dx))
    point.y = Math.max(0, Math.min(100, dragStartPoint.value.y + dy))
    // Update prev references for next point
    if (dragPointIndex.value < editablePoints.value.length - 1) {
      editablePoints.value[dragPointIndex.value + 1].prevX = point.x
      editablePoints.value[dragPointIndex.value + 1].prevY = point.y
    }
  } else if (dragType.value === 'control1') {
    point.cx1 = dragStartPoint.value.cx1 + dx
    point.cy1 = dragStartPoint.value.cy1 + dy
  } else if (dragType.value === 'control2') {
    point.cx2 = dragStartPoint.value.cx2 + dx
    point.cy2 = dragStartPoint.value.cy2 + dy
  }
  
  // Save path changes
  saveBeamPath()
}

// Handle mouse up for dragging
function handlePathEditorMouseUp() {
  if (isDragging.value) {
    isDragging.value = false
    dragType.value = null
    dragPointIndex.value = null
  }
}

// Add point on segment
function addPointOnSegment(segmentIndex: number, event: MouseEvent) {
  if (!pathEditorSvg.value) return
  
  // Use the same getSvgCoordinates that handles rotation
  const { x, y } = getSvgCoordinates(event)
  
  // Insert new point after segmentIndex
  const newPoint: EditablePoint = {
    type: 'L',
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    prevX: editablePoints.value[segmentIndex].x,
    prevY: editablePoints.value[segmentIndex].y,
    hasCurve: false,
    originalIndex: segmentIndex + 1,
  }
  
  editablePoints.value.splice(segmentIndex + 1, 0, newPoint)
  
  // Update prev references
  for (let i = segmentIndex + 2; i < editablePoints.value.length; i++) {
    editablePoints.value[i].prevX = editablePoints.value[i - 1].x
    editablePoints.value[i].prevY = editablePoints.value[i - 1].y
  }
  
  saveBeamPath()
}

// Show point context menu
function showPointContextMenu(event: MouseEvent, index: number) {
  // For now, just delete the point
  if (editablePoints.value.length <= 2) return // Need at least 2 points
  
  editablePoints.value.splice(index, 1)
  
  // Update prev references
  for (let i = index; i < editablePoints.value.length; i++) {
    if (i > 0) {
      editablePoints.value[i].prevX = editablePoints.value[i - 1].x
      editablePoints.value[i].prevY = editablePoints.value[i - 1].y
    }
  }
  
  saveBeamPath()
}

// Debounced save for smooth dragging
let pathSaveTimeout: number | null = null
function saveBeamPath() {
  if (pathSaveTimeout) clearTimeout(pathSaveTimeout)
  pathSaveTimeout = window.setTimeout(() => {
    const newPath = pointsToPath(editablePoints.value)
    emit('update:path', newPath)
  }, 150)
}

// Watch for path changes and update editable points
watch([() => currentBeamPath.value, () => isSelected.value, () => isBeamEffect.value], ([newPath, selected, isBeam]) => {
  if (isBeam && selected) {
    editablePoints.value = parsePathToPoints(newPath)
  }
}, { immediate: true })

onMounted(async () => {
  await nextTick()
  if (containerRef.value) {
    // Set initial container size for non-scaling handles
    const rect = containerRef.value.getBoundingClientRect()
    containerSize.value = { width: rect.width || 100, height: rect.height || 100 }
    
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.value)
  }
  
  // Add mouse event listeners for path editing
  window.addEventListener('mousemove', handlePathEditorMouseMove)
  window.addEventListener('mouseup', handlePathEditorMouseUp)
  
  setTimeout(() => initPixi(), 50)
})

onUnmounted(() => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  if (configTimeout) clearTimeout(configTimeout)
  if (pathSaveTimeout) clearTimeout(pathSaveTimeout)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  // Remove path editor listeners
  window.removeEventListener('mousemove', handlePathEditorMouseMove)
  window.removeEventListener('mouseup', handlePathEditorMouseUp)
  
  cleanup()
})
</script>

<style scoped>
.effect-node-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
  /* Don't isolate - allow blend modes from parent to work */
  isolation: auto;
}

.light-pool {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  /* Light pool is behind particles, blend mode is applied at VueFlow node level */
  z-index: 0;
  /* Subtle glow effect for the pool itself */
  filter: blur(2px);
}

.effect-node-display {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
  z-index: 1;
}

/* Beam path editor overlay */
.beam-path-editor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 10;
  overflow: visible;
}

.path-preview {
  pointer-events: none;
}

.control-line {
  stroke: #6366f1;
  stroke-opacity: 0.5;
  stroke-dasharray: 2, 2;
  pointer-events: none;
}

.path-segment-hitarea {
  fill: none;
  stroke: transparent;
  cursor: crosshair;
  pointer-events: stroke;
}

.path-point {
  fill: #6366f1;
  stroke: #ffffff;
  cursor: move;
}

.path-point:hover {
  fill: #818cf8;
}

.path-point--selected {
  fill: #a5b4fc;
}

.control-point {
  fill: #f59e0b;
  stroke: #ffffff;
  cursor: move;
}

.control-point:hover {
  fill: #fbbf24;
}
</style>
