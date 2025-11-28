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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as PIXI from 'pixi.js'
import type { DmScreenItem, EffectConfig } from '@/types/dmScreen.types'

interface Props {
  item: DmScreenItem
  libraryId?: number
}

const props = defineProps<Props>()

const containerRef = ref<HTMLDivElement | null>(null)
let app: PIXI.Application | null = null
let animationFrame: number | null = null
let resizeTimeout: number | null = null
let lastFrameTime = 0
const TARGET_FPS = 24 // Lower FPS for better performance

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

// Which effects have a light pool
const hasLightPool = computed(() => {
  const lightTypes = ['fire', 'torch', 'campfire', 'embers', 'lightRing', 'aura', 'magicCircle', 'sparkles', 'fireflies']
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
  const glowTypes = ['fire', 'torch', 'campfire', 'embers', 'lightRing', 'aura', 'magicCircle', 'sparkles', 'fireflies']
  
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
      createLightRingEffect(config, cx, cy, width, height, scale)
      break
    case 'sparkles':
    case 'fireflies':
      createSparklesEffect(config, cx, cy, width, height, scale)
      break
    case 'fog':
    case 'smoke':
      createFogEffect(config, cx, cy, width, height, scale)
      break
    case 'snow':
    case 'rain':
      createWeatherEffect(config, cx, cy, width, height, scale)
      break
    case 'embers':
    case 'dust':
      createParticleEffect(config, cx, cy, width, height, scale)
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

  // Create layered containers for depth
  const backContainer = new PIXI.Container()
  const midContainer = new PIXI.Container()
  const frontContainer = new PIXI.Container()
  const sparkContainer = new PIXI.Container()
  const smokeContainer = new PIXI.Container()
  
  app.stage.addChild(backContainer)
  app.stage.addChild(midContainer)
  app.stage.addChild(frontContainer)
  app.stage.addChild(sparkContainer)
  app.stage.addChild(smokeContainer)

  const s = config.scale * scale
  // LOTS of particles for volume
  const maxFlames = Math.min(55, Math.round(40 * config.intensity))
  const maxSparks = Math.min(15, Math.round(10 * config.intensity))
  const maxSmoke = Math.min(8, Math.round(5 * config.intensity))
  
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ffff00')

  // Layered base glows - creating a bright central hotspot
  const baseBack = new PIXI.Graphics()
  baseBack.circle(0, 0, 55 * s)
  baseBack.fill({ color: color1, alpha: 0.15 })
  baseBack.circle(0, 0, 45 * s)
  baseBack.fill({ color: color1, alpha: 0.2 })
  baseBack.x = cx
  baseBack.y = cy + height * 0.2
  backContainer.addChild(baseBack)

  const baseMid = new PIXI.Graphics()
  baseMid.circle(0, 0, 38 * s)
  baseMid.fill({ color: color2, alpha: 0.25 })
  baseMid.circle(0, 0, 28 * s)
  baseMid.fill({ color: color2, alpha: 0.4 })
  baseMid.circle(0, 0, 20 * s)
  baseMid.fill({ color: 0xffffaa, alpha: 0.45 })
  baseMid.x = cx
  baseMid.y = cy + height * 0.18
  midContainer.addChild(baseMid)

  // Bright central hotspot - the heart of the fire
  const baseCore = new PIXI.Graphics()
  baseCore.circle(0, 0, 16 * s)
  baseCore.fill({ color: 0xffffcc, alpha: 0.5 })
  baseCore.circle(0, 0, 12 * s)
  baseCore.fill({ color: 0xffffee, alpha: 0.65 })
  baseCore.circle(0, 0, 8 * s)
  baseCore.fill({ color: 0xffffff, alpha: 0.8 })
  baseCore.circle(0, 0, 4 * s)
  baseCore.fill({ color: 0xffffff, alpha: 0.95 })
  baseCore.x = cx
  baseCore.y = cy + height * 0.16
  frontContainer.addChild(baseCore)

  // Additional inner glow ring that pulses
  const innerGlow = new PIXI.Graphics()
  innerGlow.circle(0, 0, 22 * s)
  innerGlow.fill({ color: 0xffff88, alpha: 0.35 })
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
    baseBack.alpha = 0.18 + flicker1 * 0.4
    
    baseMid.scale.set(1 + flicker2)
    baseMid.alpha = 0.32 + flicker2 * 0.35
    
    // Bright pulsing central core
    baseCore.scale.set(1 + flicker3 * 1.3)
    baseCore.alpha = 0.7 + corePulse * 0.3
    
    // Inner glow ring pulses opposite to core for dynamic effect
    innerGlow.scale.set(1 + corePulse * 0.8)
    innerGlow.alpha = 0.3 + flicker2 * 0.25 + Math.sin(t * 10 * config.speed) * 0.1

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
      const baseAlpha = p.layer === 'front' ? 0.95 : (p.layer === 'back' ? 0.65 : 0.8)

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
        smokeAlpha = Math.pow(fadeIn, 0.5) * 0.12
      } else {
        // Continue expanding and fade out
        const expandProgress = (age - 0.2) / 0.8
        smokeScale = 0.7 + expandProgress * 1.3
        smokeAlpha = (1 - Math.pow(expandProgress, 0.7)) * 0.12
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

  const s = config.scale * scale
  const maxR = Math.min(width, height) * 0.38
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const ringCount = config.effectType === 'magicCircle' ? 3 : 2

  // Center fill
  const center = new PIXI.Graphics()
  center.circle(0, 0, maxR * 0.25)
  center.fill({ color: color1, alpha: 0.5 })
  center.circle(0, 0, maxR * 0.12)
  center.fill({ color: 0xffffff, alpha: 0.4 })
  center.x = cx
  center.y = cy
  container.addChild(center)

  // Rings
  const rings: { g: PIXI.Graphics; phase: number; dir: number }[] = []
  for (let i = 0; i < ringCount; i++) {
    const g = new PIXI.Graphics()
    const r = maxR * (1 - i * 0.22)
    const thick = (3 - i * 0.5) * scale
    
    g.setStrokeStyle({ width: thick, color: i === 0 ? color1 : color2, alpha: 0.85 - i * 0.15 })
    g.circle(0, 0, r)
    g.stroke()
    
    // Inner glow ring
    g.setStrokeStyle({ width: thick * 3, color: i === 0 ? color1 : color2, alpha: 0.2 })
    g.circle(0, 0, r)
    g.stroke()

    if (config.effectType === 'magicCircle' && i === 0) {
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2
        g.setStrokeStyle({ width: 2 * scale, color: color2, alpha: 0.6 })
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
    center.alpha = 0.45 + Math.sin(t * pulse * 2) * 0.2

    for (const r of rings) {
      r.g.rotation += 0.008 * config.speed * r.dir
      r.g.scale.set(1 + Math.sin(t * pulse + r.phase) * 0.05)
      r.g.alpha = 0.7 + Math.sin(t * 1.5 + r.phase) * 0.25
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

  const s = config.scale * scale
  // Very few sparkles for performance
  const count = Math.min(12, Math.round(8 * config.intensity))
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ffffff')

  interface Sparkle { g: PIXI.Graphics; x: number; y: number; phase: number; speed: number }
  const sparkles: Sparkle[] = []

  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics()
    const size = (3 + Math.random() * 4) * s
    // Simple filled circle with color blend
    const col = i % 2 === 0 ? color1 : color2
    g.circle(0, 0, size)
    g.fill({ color: col, alpha: 0.9 })
    g.circle(0, 0, size * 0.5)
    g.fill({ color: 0xffffff, alpha: 0.7 })

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
      sp.g.alpha = 0.3 + (twinkle + 1) * 0.35
      sp.g.scale.set(0.6 + (twinkle + 1) * 0.25)

      if (config.effectType === 'fireflies') {
        sp.g.x = sp.x + Math.sin(t * sp.speed * 0.8 + sp.phase) * 12 * s
        sp.g.y = sp.y + Math.cos(t * sp.speed * 0.6 + sp.phase) * 12 * s
      }
    }
  })
}

// =====================================================
// FOG / SMOKE - Large visible clouds
// =====================================================
function createFogEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)

  const s = config.scale * scale
  const color = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || config.color)
  const isSmoke = config.effectType === 'smoke'
  // Few but large and visible particles
  const count = Math.min(6, Math.round(4 * config.intensity))

  interface Cloud { g: PIXI.Graphics; vx: number; vy: number; phase: number }
  const clouds: Cloud[] = []

  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics()
    const size = (50 + Math.random() * 40) * s
    
    // Multiple overlapping circles for cloud effect - MORE VISIBLE
    const col = i % 2 === 0 ? color : color2
    g.circle(0, 0, size)
    g.fill({ color: col, alpha: 0.45 })
    g.circle(size * 0.3, -size * 0.2, size * 0.7)
    g.fill({ color: col, alpha: 0.35 })
    g.circle(-size * 0.25, size * 0.15, size * 0.6)
    g.fill({ color: col, alpha: 0.3 })

    g.x = Math.random() * width
    g.y = isSmoke ? height * 0.7 + Math.random() * height * 0.3 : Math.random() * height
    container.addChild(g)

    clouds.push({
      g,
      vx: (Math.random() - 0.5) * 0.4 * config.speed * s,
      vy: isSmoke ? -0.5 * config.speed * s : (Math.random() - 0.5) * 0.15 * config.speed * s,
      phase: Math.random() * Math.PI * 2,
    })
  }

  startAnimation((t) => {
    for (const c of clouds) {
      c.g.x += c.vx + Math.sin(t * 0.5 + c.phase) * 0.3 * s
      c.g.y += c.vy
      c.g.alpha = 0.35 + Math.sin(t * 0.3 + c.phase) * 0.15
      c.g.scale.set(1 + Math.sin(t * 0.2 + c.phase) * 0.08)

      // Wrap
      if (c.g.x < -100 * s) c.g.x = width + 100 * s
      if (c.g.x > width + 100 * s) c.g.x = -100 * s
      if (isSmoke) {
        if (c.g.y < -100 * s) {
          c.g.y = height * 0.8
          c.g.x = cx + (Math.random() - 0.5) * width * 0.5
        }
      } else {
        if (c.g.y < -100 * s) c.g.y = height + 100 * s
        if (c.g.y > height + 100 * s) c.g.y = -100 * s
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

  const s = config.scale * scale
  const isSnow = config.effectType === 'snow'
  const count = Math.min(30, Math.round(20 * config.intensity * Math.sqrt(scale)))
  const color = hexToNumber(config.color)

  interface Drop { g: PIXI.Graphics; vx: number; vy: number; phase: number }
  const drops: Drop[] = []

  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics()
    const size = isSnow ? (2 + Math.random() * 3) * s : (1 + Math.random()) * s

    if (isSnow) {
      g.circle(0, 0, size)
      g.fill({ color: 0xffffff, alpha: 0.85 })
    } else {
      g.rect(-0.5, -size * 2, 1, size * 4)
      g.fill({ color, alpha: 0.6 })
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

  const s = config.scale * scale
  const isEmbers = config.effectType === 'embers'
  const maxP = Math.min(20, Math.round(12 * config.intensity))
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ff8800')

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
    drawEmberParticle(p.g, p.size, col, isEmbers ? 0.95 : 0.6, p.emberType)
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
      p.g.alpha = ratio * (isEmbers ? 0.9 : 0.55)

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
    if (!containerRef.value || !app) return
    const rect = containerRef.value.getBoundingClientRect()
    const w = rect.width || 150
    const h = rect.height || 150
    if (w < 20 || h < 20) return
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

onMounted(async () => {
  await nextTick()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.value)
  }
  setTimeout(() => initPixi(), 50)
})

onUnmounted(() => {
  if (resizeTimeout) clearTimeout(resizeTimeout)
  if (configTimeout) clearTimeout(configTimeout)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
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
</style>
