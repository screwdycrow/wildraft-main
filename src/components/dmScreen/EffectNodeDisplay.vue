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

// Light pool style - radial gradient with screen blend mode
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
  
  const baseStyle = {
    width: `${sizePercent}%`,
    height: `${sizePercent}%`,
    top: `-${offset}%`,
    left: `-${offset}%`,
    mixBlendMode: 'screen' as const,
  }
  
  // Fire effects: light from bottom center, spreading up
  if (isFireType) {
    return {
      ...baseStyle,
      background: `radial-gradient(ellipse 80% 100% at 50% 65%, ${color}${alphaHex(poolIntensity * 0.6)} 0%, ${color2}${alphaHex(poolIntensity * 0.3)} 35%, transparent 55%)`,
    }
  }
  
  // Light effects: circular glow from center
  if (isLightType) {
    return {
      ...baseStyle,
      background: `radial-gradient(circle at 50% 50%, ${color}${alphaHex(poolIntensity * 0.5)} 0%, ${color2}${alphaHex(poolIntensity * 0.25)} 35%, transparent 60%)`,
    }
  }
  
  // Sparkles/fireflies: softer scattered light
  return {
    ...baseStyle,
    background: `radial-gradient(circle at 50% 50%, ${color}${alphaHex(poolIntensity * 0.3)} 0%, transparent 50%)`,
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
// FIRE - Simple colored circles rising
// =====================================================
function createFireEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)

  const s = config.scale * scale
  const maxParticles = Math.min(18, Math.round(10 * config.intensity))
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ffff00')

  // Base glow
  const base = new PIXI.Graphics()
  base.circle(0, 0, 25 * s)
  base.fill({ color: color1, alpha: 0.5 })
  base.circle(0, 0, 15 * s)
  base.fill({ color: color2, alpha: 0.4 })
  base.x = cx
  base.y = cy + height * 0.15
  container.addChild(base)

  interface P { g: PIXI.Graphics; vx: number; vy: number; life: number; max: number; active: boolean; colorT: number }
  const particles: P[] = []
  const spawnY = cy + height * 0.2

  for (let i = 0; i < maxParticles; i++) {
    const g = new PIXI.Graphics()
    g.circle(0, 0, (6 + Math.random() * 8) * s)
    g.fill({ color: color1, alpha: 0.9 })
    g.visible = false
    container.addChild(g)
    particles.push({ g, vx: 0, vy: 0, life: 0, max: 0, active: false, colorT: 0 })
  }

  function spawn() {
    const p = particles.find(x => !x.active)
    if (!p) return
    p.active = true
    p.g.visible = true
    p.g.x = cx + (Math.random() - 0.5) * 40 * s
    p.g.y = spawnY
    p.g.alpha = 0.95
    p.g.scale.set(1)
    p.vx = (Math.random() - 0.5) * 1.5 * s
    p.vy = -(1.5 + Math.random() * 2) * config.speed * s
    p.max = 25 + Math.random() * 15
    p.life = p.max
    p.colorT = Math.random()
    // Apply color blend
    p.g.clear()
    p.g.circle(0, 0, (6 + Math.random() * 8) * s)
    p.g.fill({ color: lerpColor(config.color, config.secondaryColor || '#ffff00', p.colorT), alpha: 0.9 })
  }

  let timer = 0
  startAnimation((t) => {
    timer++
    if (timer > 3 / config.speed) { spawn(); timer = 0 }

    base.scale.set(1 + Math.sin(t * 6 * config.speed) * 0.12)
    base.alpha = 0.4 + Math.sin(t * 10 * config.speed) * 0.15

    for (const p of particles) {
      if (!p.active) continue
      p.life--
      p.g.x += p.vx + (Math.random() - 0.5) * 0.5
      p.g.y += p.vy
      const ratio = p.life / p.max
      p.g.alpha = ratio * 0.9
      p.g.scale.set(ratio * 0.7 + 0.3)
      if (p.life <= 0) { p.active = false; p.g.visible = false }
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
// EMBERS / DUST
// =====================================================
function createParticleEffect(config: EffectConfig, cx: number, cy: number, width: number, height: number, scale: number) {
  if (!app) return

  const container = new PIXI.Container()
  app.stage.addChild(container)

  const s = config.scale * scale
  const isEmbers = config.effectType === 'embers'
  const maxP = Math.min(15, Math.round(10 * config.intensity))
  const color1 = hexToNumber(config.color)
  const color2 = hexToNumber(config.secondaryColor || '#ff8800')

  interface P { g: PIXI.Graphics; vx: number; vy: number; life: number; max: number; phase: number; active: boolean }
  const particles: P[] = []

  for (let i = 0; i < maxP; i++) {
    const g = new PIXI.Graphics()
    const size = (2 + Math.random() * 3) * s
    const col = i % 2 === 0 ? color1 : color2
    g.circle(0, 0, size)
    g.fill({ color: col, alpha: isEmbers ? 0.95 : 0.6 })
    if (isEmbers) {
      g.circle(0, 0, size * 0.5)
      g.fill({ color: 0xffffff, alpha: 0.5 })
    }
    g.visible = false
    container.addChild(g)
    particles.push({ g, vx: 0, vy: 0, life: 0, max: 0, phase: Math.random() * Math.PI * 2, active: false })
  }

  const spawnY = height * 0.85

  function spawn() {
    const p = particles.find(x => !x.active)
    if (!p) return
    p.active = true
    p.g.visible = true
    p.g.x = cx + (Math.random() - 0.5) * width * 0.6
    p.g.y = isEmbers ? spawnY : Math.random() * height
    p.g.alpha = isEmbers ? 0.95 : 0.55
    p.g.scale.set(1)
    p.vx = (Math.random() - 0.5) * config.speed * s
    p.vy = isEmbers ? -(0.6 + Math.random() * 1.2) * config.speed * s : (Math.random() - 0.5) * 0.15 * config.speed * s
    p.max = 60 + Math.random() * 40
    p.life = p.max
  }

  // Initial spawn
  for (let i = 0; i < maxP * 0.4; i++) spawn()

  let timer = 0
  startAnimation((t) => {
    timer++
    if (timer > 6 / config.speed) { spawn(); timer = 0 }

    for (const p of particles) {
      if (!p.active) continue
      p.life--
      p.g.x += p.vx + Math.sin(t * 2 + p.phase) * 0.25 * s
      p.g.y += p.vy

      const ratio = p.life / p.max
      p.g.alpha = ratio * (isEmbers ? 0.9 : 0.5)

      if (isEmbers) {
        p.g.alpha *= 0.6 + Math.sin(t * 10 + p.phase) * 0.4
      }

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
  /* Don't isolate - allow blend modes to work with content below */
  isolation: auto;
}

.light-pool {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  /* z-index -1 puts it behind particles but CSS blend affects everything it overlaps */
  z-index: 0;
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
