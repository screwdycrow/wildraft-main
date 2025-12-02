<template>
  <div 
    class="terrain-node-container"
    :style="containerStyle"
  >
    <!-- Display generated terrain as scalable image -->
    <img
      v-if="generatedImageUrl && !isGenerating"
      :src="generatedImageUrl"
      class="terrain-image"
      alt="Generated terrain"
    />
    
    <!-- Generating indicator -->
    <div v-if="isGenerating" class="generating-overlay">
      <v-progress-circular indeterminate size="24" color="white" />
      <span class="generating-text">Generating...</span>
    </div>
    
    <!-- Placeholder while no image -->
    <div v-if="!generatedImageUrl && !isGenerating" class="terrain-placeholder">
      <v-icon icon="mdi-terrain" size="32" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as PIXI from 'pixi.js'
import type { DmScreenItem, TerrainConfig } from '@/types/dmScreen.types'

// =====================================================
// PROPS & STATE
// =====================================================

interface Props {
  item: DmScreenItem
  libraryId: number
  selected?: boolean
  rotation?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:generatedImage': [url: string]
}>()

const isGenerating = ref(false)
const generatedImageUrl = ref<string | null>(null)

// Get terrain config from item data
const terrainConfig = computed<TerrainConfig>(() => {
  return props.item.data.terrainConfig || {
    terrainType: 'cave',
    seed: 12345,
    complexity: 0.5,
    scale: 1,
    primaryColor: '#4a3d3a',
    secondaryColor: '#2d2420',
  }
})

// Check if we already have a generated image stored
const storedImageUrl = computed(() => {
  return props.item.data.generatedTerrainImage || null
})

const containerStyle = computed(() => ({
  width: '100%',
  height: '100%',
}))

// =====================================================
// SEEDED RANDOM NUMBER GENERATOR
// =====================================================

class SeededRandom {
  private seed: number
  
  constructor(seed: number) {
    this.seed = seed
  }
  
  next(): number {
    let t = this.seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
  
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
  
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }
  
  nextBool(probability = 0.5): boolean {
    return this.next() < probability
  }
}

// =====================================================
// SIMPLEX NOISE
// =====================================================

class SimplexNoise {
  private perm: number[] = []
  private gradP: { x: number; y: number }[] = []
  private grad3 = [
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 },
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
  ]
  
  constructor(seed: number) {
    const rng = new SeededRandom(seed)
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng.next() * (i + 1))
      const tmp = p[i]
      p[i] = p[j]
      p[j] = tmp
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
      this.gradP[i] = this.grad3[this.perm[i] % 8]
    }
  }
  
  noise2D(x: number, y: number): number {
    const F2 = 0.5 * (Math.sqrt(3) - 1)
    const G2 = (3 - Math.sqrt(3)) / 6
    const s = (x + y) * F2
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)
    const t = (i + j) * G2
    const x0 = x - (i - t)
    const y0 = y - (j - t)
    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1
    const x1 = x0 - i1 + G2
    const y1 = y0 - j1 + G2
    const x2 = x0 - 1 + 2 * G2
    const y2 = y0 - 1 + 2 * G2
    const ii = i & 255
    const jj = j & 255
    let n0 = 0, n1 = 0, n2 = 0
    let t0 = 0.5 - x0 * x0 - y0 * y0
    if (t0 >= 0) {
      const gi0 = this.gradP[ii + this.perm[jj]]
      t0 *= t0
      n0 = t0 * t0 * (gi0.x * x0 + gi0.y * y0)
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1
    if (t1 >= 0) {
      const gi1 = this.gradP[ii + i1 + this.perm[jj + j1]]
      t1 *= t1
      n1 = t1 * t1 * (gi1.x * x1 + gi1.y * y1)
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2
    if (t2 >= 0) {
      const gi2 = this.gradP[ii + 1 + this.perm[jj + 1]]
      t2 *= t2
      n2 = t2 * t2 * (gi2.x * x2 + gi2.y * y2)
    }
    return 70 * (n0 + n1 + n2)
  }
  
  fbm(x: number, y: number, octaves = 4, lacunarity = 2, persistence = 0.5): number {
    let value = 0, amplitude = 1, frequency = 1, maxValue = 0
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency)
      maxValue += amplitude
      amplitude *= persistence
      frequency *= lacunarity
    }
    return value / maxValue
  }
}

// =====================================================
// COLOR UTILITIES
// =====================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 74, g: 61, b: 58 }
}

function rgbToHex(r: number, g: number, b: number): number {
  return (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)
}

function lerpColor(color1: string, color2: string, t: number): number {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  return rgbToHex(
    c1.r + (c2.r - c1.r) * t,
    c1.g + (c2.g - c1.g) * t,
    c1.b + (c2.b - c1.b) * t
  )
}

function hexStringToNumber(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

// =====================================================
// CAVE GENERATION (Cellular Automata)
// =====================================================

function generateCaveGrid(w: number, h: number, config: TerrainConfig, rng: SeededRandom): boolean[][] {
  const fillDensity = config.fillDensity ?? 0.45
  const iterations = config.smoothIterations ?? 4
  
  const grid: boolean[][] = []
  for (let y = 0; y < h; y++) {
    grid[y] = []
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        grid[y][x] = true
      } else {
        grid[y][x] = rng.next() < fillDensity
      }
    }
  }
  
  for (let iter = 0; iter < iterations; iter++) {
    const newGrid: boolean[][] = []
    for (let y = 0; y < h; y++) {
      newGrid[y] = []
      for (let x = 0; x < w; x++) {
        let neighbors = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx, ny = y + dy
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || grid[ny][nx]) neighbors++
          }
        }
        newGrid[y][x] = grid[y][x] ? neighbors >= 4 : neighbors >= 5
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        grid[y][x] = newGrid[y][x]
      }
    }
  }
  
  // Connect regions if enabled
  if (config.connectRegions) {
    connectRegions(grid, w, h, rng)
  }
  
  return grid
}

function connectRegions(grid: boolean[][], w: number, h: number, rng: SeededRandom): void {
  const visited: boolean[][] = Array(h).fill(null).map(() => Array(w).fill(false))
  const regions: { x: number; y: number }[][] = []
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!grid[y][x] && !visited[y][x]) {
        const region: { x: number; y: number }[] = []
        const stack = [{ x, y }]
        while (stack.length > 0) {
          const { x: cx, y: cy } = stack.pop()!
          if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue
          if (visited[cy][cx] || grid[cy][cx]) continue
          visited[cy][cx] = true
          region.push({ x: cx, y: cy })
          stack.push({ x: cx + 1, y: cy }, { x: cx - 1, y: cy }, { x: cx, y: cy + 1 }, { x: cx, y: cy - 1 })
        }
        if (region.length > 0) regions.push(region)
      }
    }
  }
  
  if (regions.length > 1) {
    regions.sort((a, b) => b.length - a.length)
    for (let i = 1; i < regions.length; i++) {
      const r1 = regions[0], r2 = regions[i]
      let minDist = Infinity, bestFrom = r1[0], bestTo = r2[0]
      for (let j = 0; j < Math.min(30, r1.length); j++) {
        const from = r1[rng.nextInt(0, r1.length - 1)]
        for (let k = 0; k < Math.min(30, r2.length); k++) {
          const to = r2[rng.nextInt(0, r2.length - 1)]
          const dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y)
          if (dist < minDist) { minDist = dist; bestFrom = from; bestTo = to }
        }
      }
      let cx = bestFrom.x, cy = bestFrom.y
      while (cx !== bestTo.x || cy !== bestTo.y) {
        grid[cy][cx] = false
        if (cy > 0) grid[cy - 1][cx] = false
        if (cy < h - 1) grid[cy + 1][cx] = false
        if (cx !== bestTo.x) cx += cx < bestTo.x ? 1 : -1
        else if (cy !== bestTo.y) cy += cy < bestTo.y ? 1 : -1
      }
    }
  }
}

// =====================================================
// DUNGEON GENERATION (BSP-based)
// =====================================================

interface Room { x: number; y: number; w: number; h: number; type?: string }
interface Corridor { x1: number; y1: number; x2: number; y2: number; width: number }

// BSP Node for dungeon generation
interface BSPNode {
  x: number; y: number; w: number; h: number
  left?: BSPNode; right?: BSPNode
  room?: Room
}

function generateDungeonBSP(gw: number, gh: number, config: TerrainConfig, rng: SeededRandom): { rooms: Room[]; corridors: Corridor[] } {
  const minRoomSize = 6
  const maxDepth = 4 + Math.floor((config.complexity || 0.5) * 3)
  
  // Create BSP tree
  function splitNode(node: BSPNode, depth: number): void {
    if (depth >= maxDepth) return
    if (node.w < minRoomSize * 2 + 2 && node.h < minRoomSize * 2 + 2) return
    
    const splitH = node.w > node.h ? rng.next() > 0.3 : rng.next() > 0.7
    
    if (splitH && node.w >= minRoomSize * 2 + 2) {
      const split = rng.nextInt(minRoomSize + 1, node.w - minRoomSize - 1)
      node.left = { x: node.x, y: node.y, w: split, h: node.h }
      node.right = { x: node.x + split, y: node.y, w: node.w - split, h: node.h }
    } else if (!splitH && node.h >= minRoomSize * 2 + 2) {
      const split = rng.nextInt(minRoomSize + 1, node.h - minRoomSize - 1)
      node.left = { x: node.x, y: node.y, w: node.w, h: split }
      node.right = { x: node.x, y: node.y + split, w: node.w, h: node.h - split }
    } else {
      return
    }
    
    splitNode(node.left!, depth + 1)
    splitNode(node.right!, depth + 1)
  }
  
  // Create rooms in leaf nodes
  function createRooms(node: BSPNode): void {
    if (node.left && node.right) {
      createRooms(node.left)
      createRooms(node.right)
    } else {
      // Leaf node - create room
      const padding = 2
      const roomW = rng.nextInt(minRoomSize, node.w - padding * 2)
      const roomH = rng.nextInt(minRoomSize, node.h - padding * 2)
      const roomX = node.x + rng.nextInt(padding, node.w - roomW - padding)
      const roomY = node.y + rng.nextInt(padding, node.h - roomH - padding)
      node.room = { x: roomX, y: roomY, w: roomW, h: roomH }
    }
  }
  
  // Get room from node (find in subtree)
  function getRoom(node: BSPNode): Room | undefined {
    if (node.room) return node.room
    if (node.left) {
      const leftRoom = getRoom(node.left)
      if (leftRoom) return leftRoom
    }
    if (node.right) return getRoom(node.right)
    return undefined
  }
  
  // Connect rooms with corridors
  function connectRooms(node: BSPNode, corridors: Corridor[]): void {
    if (node.left && node.right) {
      connectRooms(node.left, corridors)
      connectRooms(node.right, corridors)
      
      const room1 = getRoom(node.left)
      const room2 = getRoom(node.right)
      
      if (room1 && room2) {
        const cx1 = Math.floor(room1.x + room1.w / 2)
        const cy1 = Math.floor(room1.y + room1.h / 2)
        const cx2 = Math.floor(room2.x + room2.w / 2)
        const cy2 = Math.floor(room2.y + room2.h / 2)
        const corridorWidth = config.corridorWidth || 2
        
        // L-shaped corridor
        if (rng.next() > 0.5) {
          corridors.push({ x1: cx1, y1: cy1, x2: cx2, y2: cy1, width: corridorWidth })
          corridors.push({ x1: cx2, y1: cy1, x2: cx2, y2: cy2, width: corridorWidth })
        } else {
          corridors.push({ x1: cx1, y1: cy1, x2: cx1, y2: cy2, width: corridorWidth })
          corridors.push({ x1: cx1, y1: cy2, x2: cx2, y2: cy2, width: corridorWidth })
        }
      }
    }
  }
  
  // Collect all rooms
  function collectRooms(node: BSPNode, rooms: Room[]): void {
    if (node.room) rooms.push(node.room)
    if (node.left) collectRooms(node.left, rooms)
    if (node.right) collectRooms(node.right, rooms)
  }
  
  const root: BSPNode = { x: 0, y: 0, w: gw, h: gh }
  splitNode(root, 0)
  createRooms(root)
  
  const rooms: Room[] = []
  const corridors: Corridor[] = []
  collectRooms(root, rooms)
  connectRooms(root, corridors)
  
  return { rooms, corridors }
}

// =====================================================
// BUILDING INTERIOR GENERATION
// =====================================================

type RoomType = 'bedroom' | 'kitchen' | 'living' | 'bathroom' | 'storage' | 'hallway' | 'dining'

interface BuildingRoom extends Room {
  type: RoomType
  doors: { x: number; y: number; horizontal: boolean }[]
  windows: { x: number; y: number; horizontal: boolean }[]
}

interface Furniture {
  x: number; y: number; w: number; h: number
  type: string; rotation: number
}

function generateBuildingInterior(gw: number, gh: number, config: TerrainConfig, rng: SeededRandom): { rooms: BuildingRoom[]; furniture: Furniture[] } {
  const wallThickness = config.wallThickness || 2
  const rooms: BuildingRoom[] = []
  const furniture: Furniture[] = []
  const roomTypes: RoomType[] = ['bedroom', 'kitchen', 'living', 'bathroom', 'storage', 'dining']
  
  // Simple grid-based room division
  const numRoomsX = 2 + Math.floor((config.complexity || 0.5) * 2)
  const numRoomsY = 2 + Math.floor((config.complexity || 0.5) * 1)
  const cellW = Math.floor((gw - wallThickness) / numRoomsX)
  const cellH = Math.floor((gh - wallThickness) / numRoomsY)
  
  // Create rooms
  for (let ry = 0; ry < numRoomsY; ry++) {
    for (let rx = 0; rx < numRoomsX; rx++) {
      const x = rx * cellW + wallThickness
      const y = ry * cellH + wallThickness
      const w = cellW - wallThickness
      const h = cellH - wallThickness
      
      // Assign room type
      let type: RoomType
      if (rx === 0 && ry === 0) type = 'living'
      else if (rx === numRoomsX - 1 && ry === 0) type = 'kitchen'
      else if (ry === numRoomsY - 1) type = rng.next() > 0.5 ? 'bedroom' : 'bathroom'
      else type = roomTypes[rng.nextInt(0, roomTypes.length - 1)]
      
      const room: BuildingRoom = { x, y, w, h, type, doors: [], windows: [] }
      
      // Add doors between adjacent rooms
      if (rx > 0) {
        const doorY = y + Math.floor(h / 2)
        room.doors.push({ x: x - wallThickness / 2, y: doorY, horizontal: false })
      }
      if (ry > 0) {
        const doorX = x + Math.floor(w / 2)
        room.doors.push({ x: doorX, y: y - wallThickness / 2, horizontal: true })
      }
      
      // Add windows on exterior walls
      if (rx === 0) room.windows.push({ x: x - wallThickness, y: y + h / 2, horizontal: false })
      if (rx === numRoomsX - 1) room.windows.push({ x: x + w, y: y + h / 2, horizontal: false })
      if (ry === 0) room.windows.push({ x: x + w / 2, y: y - wallThickness, horizontal: true })
      if (ry === numRoomsY - 1) room.windows.push({ x: x + w / 2, y: y + h, horizontal: true })
      
      rooms.push(room)
      
      // Add furniture based on room type
      addFurnitureToRoom(room, furniture, rng)
    }
  }
  
  return { rooms, furniture }
}

function addFurnitureToRoom(room: BuildingRoom, furniture: Furniture[], rng: SeededRandom): void {
  const padding = 4
  const rx = room.x + padding
  const ry = room.y + padding
  const rw = room.w - padding * 2
  const rh = room.h - padding * 2
  
  switch (room.type) {
    case 'bedroom':
      // Bed
      furniture.push({ x: rx + rw * 0.1, y: ry + rh * 0.2, w: rw * 0.45, h: rh * 0.55, type: 'bed', rotation: 0 })
      // Nightstand
      furniture.push({ x: rx + rw * 0.6, y: ry + rh * 0.2, w: rw * 0.15, h: rh * 0.15, type: 'nightstand', rotation: 0 })
      // Wardrobe
      furniture.push({ x: rx + rw * 0.7, y: ry + rh * 0.5, w: rw * 0.25, h: rh * 0.4, type: 'wardrobe', rotation: 0 })
      break
      
    case 'kitchen':
      // Counter (L-shaped)
      furniture.push({ x: rx, y: ry, w: rw * 0.2, h: rh * 0.8, type: 'counter', rotation: 0 })
      furniture.push({ x: rx, y: ry, w: rw * 0.6, h: rh * 0.2, type: 'counter', rotation: 0 })
      // Stove
      furniture.push({ x: rx + rw * 0.3, y: ry + 2, w: rw * 0.2, h: rh * 0.15, type: 'stove', rotation: 0 })
      // Table
      furniture.push({ x: rx + rw * 0.4, y: ry + rh * 0.5, w: rw * 0.35, h: rh * 0.35, type: 'table', rotation: 0 })
      break
      
    case 'living':
      // Sofa
      furniture.push({ x: rx + rw * 0.1, y: ry + rh * 0.6, w: rw * 0.5, h: rh * 0.25, type: 'sofa', rotation: 0 })
      // Coffee table
      furniture.push({ x: rx + rw * 0.2, y: ry + rh * 0.35, w: rw * 0.3, h: rh * 0.2, type: 'coffeetable', rotation: 0 })
      // Chair
      furniture.push({ x: rx + rw * 0.7, y: ry + rh * 0.3, w: rw * 0.2, h: rh * 0.2, type: 'chair', rotation: 45 })
      break
      
    case 'bathroom':
      // Toilet
      furniture.push({ x: rx + rw * 0.1, y: ry + rh * 0.1, w: rw * 0.2, h: rh * 0.25, type: 'toilet', rotation: 0 })
      // Sink
      furniture.push({ x: rx + rw * 0.4, y: ry + rh * 0.05, w: rw * 0.2, h: rh * 0.15, type: 'sink', rotation: 0 })
      // Bathtub/shower
      furniture.push({ x: rx + rw * 0.6, y: ry + rh * 0.1, w: rw * 0.35, h: rh * 0.5, type: 'bathtub', rotation: 0 })
      break
      
    case 'dining':
      // Dining table
      furniture.push({ x: rx + rw * 0.2, y: ry + rh * 0.25, w: rw * 0.6, h: rh * 0.5, type: 'diningtable', rotation: 0 })
      // Chairs
      for (let i = 0; i < 4; i++) {
        const cx = rx + rw * (0.15 + (i % 2) * 0.6)
        const cy = ry + rh * (0.3 + Math.floor(i / 2) * 0.35)
        furniture.push({ x: cx, y: cy, w: rw * 0.12, h: rh * 0.12, type: 'chair', rotation: (i % 2) * 180 })
      }
      break
      
    case 'storage':
      // Shelves
      furniture.push({ x: rx, y: ry + rh * 0.1, w: rw * 0.2, h: rh * 0.8, type: 'shelf', rotation: 0 })
      furniture.push({ x: rx + rw * 0.8, y: ry + rh * 0.1, w: rw * 0.2, h: rh * 0.8, type: 'shelf', rotation: 0 })
      // Boxes
      for (let i = 0; i < 3; i++) {
        furniture.push({ 
          x: rx + rw * (0.3 + rng.next() * 0.3), 
          y: ry + rh * (0.2 + i * 0.25), 
          w: rw * 0.15, h: rh * 0.12, type: 'box', rotation: rng.next() * 20 - 10 
        })
      }
      break
  }
}

// =====================================================
// RENDERING FUNCTIONS
// =====================================================

function renderCave(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const gridSize = 48 + Math.floor((config.complexity || 0.5) * 32)
  const grid = generateCaveGrid(gridSize, gridSize, config, rng)
  const cellW = w / gridSize, cellH = h / gridSize
  
  // Only draw floor tiles (no background - transparent)
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!grid[y][x]) { // Floor tiles only
        const px = x * cellW, py = y * cellH
        const n = noise.fbm(x * 0.2, y * 0.2, 3) * 0.3 + 0.7
        const floorColor = lerpColor(config.secondaryColor || '#4a3d3a', config.primaryColor, n)
        g.fill({ color: floorColor, alpha: 1 })
        g.rect(px, py, cellW + 0.5, cellH + 0.5)
        g.fill()
        
        // Add floor texture
        if (rng.next() > 0.85) {
          g.fill({ color: hexStringToNumber(config.shadowColor || '#2d2420'), alpha: 0.3 })
          g.circle(px + cellW / 2, py + cellH / 2, cellW * 0.3)
          g.fill()
        }
      }
    }
  }
  
  // Draw wall outlines around floor
  if (config.hasOutline !== false) {
    const wallColor = hexStringToNumber(config.outlineColor || '#1a1512')
    const wallWidth = (config.outlineWidth || 2) * 1.5
    
    g.setStrokeStyle({ width: wallWidth, color: wallColor, alpha: 1, cap: 'round', join: 'round' })
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (!grid[y][x]) { // Floor tile
          const px = x * cellW, py = y * cellH
          // Draw wall edge where floor meets wall
          if (y === 0 || grid[y - 1][x]) { g.moveTo(px, py); g.lineTo(px + cellW, py); g.stroke() }
          if (y === gridSize - 1 || grid[y + 1][x]) { g.moveTo(px, py + cellH); g.lineTo(px + cellW, py + cellH); g.stroke() }
          if (x === 0 || grid[y][x - 1]) { g.moveTo(px, py); g.lineTo(px, py + cellH); g.stroke() }
          if (x === gridSize - 1 || grid[y][x + 1]) { g.moveTo(px + cellW, py); g.lineTo(px + cellW, py + cellH); g.stroke() }
        }
      }
    }
  }
}

function renderDungeon(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, _noise: SimplexNoise): void {
  const gridSize = 50 + Math.floor((config.complexity || 0.5) * 30)
  const { rooms, corridors } = generateDungeonBSP(gridSize, gridSize, config, rng)
  const cellW = w / gridSize, cellH = h / gridSize
  
  const floorColor = hexStringToNumber(config.secondaryColor || '#5a5550')
  const wallColor = hexStringToNumber(config.outlineColor || '#2a2520')
  const wallWidth = (config.wallThickness || 2) * 2
  
  // Draw corridor floors FIRST (so rooms draw on top)
  for (const corridor of corridors) {
    const x1 = corridor.x1 * cellW, y1 = corridor.y1 * cellH
    const x2 = corridor.x2 * cellW, y2 = corridor.y2 * cellH
    const cw = corridor.width * cellW
    
    g.fill({ color: floorColor, alpha: 1 })
    if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
      const minX = Math.min(x1, x2) - cw / 2
      const maxX = Math.max(x1, x2) + cw / 2
      g.rect(minX, y1 - cw / 2, maxX - minX, cw)
    } else {
      const minY = Math.min(y1, y2) - cw / 2
      const maxY = Math.max(y1, y2) + cw / 2
      g.rect(x1 - cw / 2, minY, cw, maxY - minY)
    }
    g.fill()
  }
  
  // Draw room floors as single solid rectangles
  for (const room of rooms) {
    const rx = room.x * cellW, ry = room.y * cellH
    const rw = room.w * cellW, rh = room.h * cellH
    
    g.fill({ color: floorColor, alpha: 1 })
    g.rect(rx, ry, rw, rh)
    g.fill()
  }
  
  // Draw walls - only the outer boundary of each room
  g.setStrokeStyle({ width: wallWidth, color: wallColor, alpha: 1, cap: 'square', join: 'miter' })
  for (const room of rooms) {
    const rx = room.x * cellW, ry = room.y * cellH
    const rw = room.w * cellW, rh = room.h * cellH
    g.rect(rx, ry, rw, rh)
    g.stroke()
  }
}

// =====================================================
// BUILDING EXTERIOR (Top-down medieval roof view)
// =====================================================

interface RoofSection {
  x: number; y: number; w: number; h: number
  ridgeDirection: 'horizontal' | 'vertical' // ridge line direction
}

function generateRoofSections(w: number, h: number, config: TerrainConfig, rng: SeededRandom): RoofSection[] {
  const sections: RoofSection[] = []
  const padding = w * 0.08
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  // Choose building shape based on complexity
  const complexity = config.complexity || 0.5
  const shapeRoll = rng.next()
  
  if (complexity < 0.3 || shapeRoll < 0.3) {
    // Simple rectangle
    const rw = availW * rng.nextFloat(0.6, 0.9)
    const rh = availH * rng.nextFloat(0.5, 0.8)
    sections.push({
      x: padding + (availW - rw) / 2,
      y: padding + (availH - rh) / 2,
      w: rw, h: rh,
      ridgeDirection: rw > rh ? 'horizontal' : 'vertical'
    })
  } else if (shapeRoll < 0.5) {
    // L-shape
    const mainW = availW * rng.nextFloat(0.5, 0.7)
    const mainH = availH * rng.nextFloat(0.6, 0.85)
    const wingW = availW * rng.nextFloat(0.4, 0.6)
    const wingH = availH * rng.nextFloat(0.3, 0.45)
    
    sections.push({ x: padding, y: padding, w: mainW, h: mainH, ridgeDirection: 'vertical' })
    sections.push({ x: padding + mainW * 0.5, y: padding + mainH - wingH, w: wingW, h: wingH, ridgeDirection: 'horizontal' })
  } else if (shapeRoll < 0.7) {
    // T-shape
    const stemW = availW * rng.nextFloat(0.35, 0.5)
    const stemH = availH * rng.nextFloat(0.45, 0.6)
    const topW = availW * rng.nextFloat(0.75, 0.95)
    const topH = availH * rng.nextFloat(0.3, 0.45)
    
    sections.push({ x: padding + (availW - topW) / 2, y: padding, w: topW, h: topH, ridgeDirection: 'horizontal' })
    sections.push({ x: padding + (availW - stemW) / 2, y: padding + topH * 0.8, w: stemW, h: stemH, ridgeDirection: 'vertical' })
  } else {
    // Complex multi-section
    const numSections = 2 + Math.floor(complexity * 2)
    let cx = padding + availW * 0.3
    let cy = padding + availH * 0.2
    
    for (let i = 0; i < numSections; i++) {
      const sw = availW * rng.nextFloat(0.25, 0.5)
      const sh = availH * rng.nextFloat(0.25, 0.5)
      sections.push({ x: cx, y: cy, w: sw, h: sh, ridgeDirection: sw > sh ? 'horizontal' : 'vertical' })
      
      // Move for next section
      if (rng.next() > 0.5) {
        cx += sw * rng.nextFloat(0.4, 0.8)
        cy += sh * rng.nextFloat(-0.3, 0.3)
      } else {
        cx += sw * rng.nextFloat(-0.3, 0.3)
        cy += sh * rng.nextFloat(0.4, 0.8)
      }
      cx = Math.max(padding, Math.min(cx, w - sw - padding))
      cy = Math.max(padding, Math.min(cy, h - sh - padding))
    }
  }
  
  return sections
}

function renderBuildingExterior(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, _noise: SimplexNoise): void {
  const sections = generateRoofSections(w, h, config, rng)
  
  // Medieval roof colors - terracotta/clay tiles or wooden shingles
  const roofDark = hexStringToNumber(config.secondaryColor || '#8b4513')   // Dark roof slope
  const roofLight = hexStringToNumber(config.accentColor || '#a0522d')     // Light roof slope
  const ridgeColor = hexStringToNumber(config.primaryColor || '#654321')   // Ridge caps
  const shadowColor = hexStringToNumber(config.shadowColor || '#2a1a0a')
  const outlineColor = hexStringToNumber(config.outlineColor || '#1a0a00')
  
  // Sort by Y for layering
  sections.sort((a, b) => (a.y + a.h) - (b.y + b.h))
  
  for (const section of sections) {
    const { x, y, w: sw, h: sh, ridgeDirection } = section
    const overhang = Math.min(sw, sh) * 0.06 // Eave overhang
    
    // Shadow underneath
    g.fill({ color: shadowColor, alpha: 0.5 })
    g.beginPath()
    g.moveTo(x + overhang + 6, y + sh + overhang + 6)
    g.lineTo(x + sw + overhang + 6, y + sh + overhang + 6)
    g.lineTo(x + sw + overhang + 6, y - overhang + 6)
    g.lineTo(x + sw + overhang, y - overhang)
    g.lineTo(x + sw + overhang, y + sh + overhang)
    g.lineTo(x - overhang, y + sh + overhang)
    g.closePath()
    g.fill()
    
    if (ridgeDirection === 'horizontal') {
      // Ridge runs left-right, slopes go up-down
      const ridgeY = y + sh / 2
      
      // Top slope (darker - north facing)
      g.fill({ color: roofDark, alpha: 1 })
      g.beginPath()
      g.moveTo(x - overhang, y - overhang)
      g.lineTo(x + sw + overhang, y - overhang)
      g.lineTo(x + sw + overhang, ridgeY)
      g.lineTo(x - overhang, ridgeY)
      g.closePath()
      g.fill()
      
      // Bottom slope (lighter - south facing)
      g.fill({ color: roofLight, alpha: 1 })
      g.beginPath()
      g.moveTo(x - overhang, ridgeY)
      g.lineTo(x + sw + overhang, ridgeY)
      g.lineTo(x + sw + overhang, y + sh + overhang)
      g.lineTo(x - overhang, y + sh + overhang)
      g.closePath()
      g.fill()
      
      // Roof tile lines (horizontal)
      g.setStrokeStyle({ width: 0.8, color: shadowColor, alpha: 0.35 })
      const tileHeight = sh / 10
      for (let ty = y - overhang + tileHeight; ty < y + sh + overhang; ty += tileHeight) {
        if (Math.abs(ty - ridgeY) > tileHeight * 0.3) {
          g.moveTo(x - overhang, ty)
          g.lineTo(x + sw + overhang, ty)
          g.stroke()
        }
      }
      
      // Ridge cap
      g.fill({ color: ridgeColor, alpha: 1 })
      g.roundRect(x - overhang - 2, ridgeY - 4, sw + overhang * 2 + 4, 8, 2)
      g.fill()
      
      // Ridge texture
      g.setStrokeStyle({ width: 1, color: shadowColor, alpha: 0.4 })
      const capWidth = (sw + overhang * 2) / 12
      for (let cx = x - overhang; cx < x + sw + overhang; cx += capWidth) {
        g.moveTo(cx, ridgeY - 3)
        g.lineTo(cx, ridgeY + 3)
        g.stroke()
      }
      
    } else {
      // Ridge runs up-down, slopes go left-right
      const ridgeX = x + sw / 2
      
      // Left slope (darker - west facing)
      g.fill({ color: roofDark, alpha: 1 })
      g.beginPath()
      g.moveTo(x - overhang, y - overhang)
      g.lineTo(ridgeX, y - overhang)
      g.lineTo(ridgeX, y + sh + overhang)
      g.lineTo(x - overhang, y + sh + overhang)
      g.closePath()
      g.fill()
      
      // Right slope (lighter - east facing)
      g.fill({ color: roofLight, alpha: 1 })
      g.beginPath()
      g.moveTo(ridgeX, y - overhang)
      g.lineTo(x + sw + overhang, y - overhang)
      g.lineTo(x + sw + overhang, y + sh + overhang)
      g.lineTo(ridgeX, y + sh + overhang)
      g.closePath()
      g.fill()
      
      // Roof tile lines (horizontal across both slopes)
      g.setStrokeStyle({ width: 0.8, color: shadowColor, alpha: 0.35 })
      const tileHeight = sh / 10
      for (let ty = y - overhang + tileHeight; ty < y + sh + overhang; ty += tileHeight) {
        g.moveTo(x - overhang, ty)
        g.lineTo(ridgeX - 4, ty)
        g.stroke()
        g.moveTo(ridgeX + 4, ty)
        g.lineTo(x + sw + overhang, ty)
        g.stroke()
      }
      
      // Ridge cap
      g.fill({ color: ridgeColor, alpha: 1 })
      g.roundRect(ridgeX - 4, y - overhang - 2, 8, sh + overhang * 2 + 4, 2)
      g.fill()
      
      // Ridge texture
      g.setStrokeStyle({ width: 1, color: shadowColor, alpha: 0.4 })
      const capHeight = (sh + overhang * 2) / 12
      for (let cy = y - overhang; cy < y + sh + overhang; cy += capHeight) {
        g.moveTo(ridgeX - 3, cy)
        g.lineTo(ridgeX + 3, cy)
        g.stroke()
      }
    }
    
    // Roof outline
    g.setStrokeStyle({ width: 1.5, color: outlineColor, alpha: 0.6 })
    g.rect(x - overhang, y - overhang, sw + overhang * 2, sh + overhang * 2)
    g.stroke()
  }
  
  // Chimney on first/largest section
  if (rng.next() > 0.3 && sections.length > 0) {
    const sec = sections.reduce((a, b) => a.w * a.h > b.w * b.h ? a : b)
    const chimW = Math.min(sec.w, sec.h) * 0.12
    const chimH = chimW * 1.3
    const chimX = sec.x + sec.w * rng.nextFloat(0.55, 0.8)
    const chimY = sec.y + sec.h * rng.nextFloat(0.2, 0.4)
    
    // Chimney body
    g.fill({ color: hexStringToNumber('#6a5040'), alpha: 1 })
    g.rect(chimX, chimY, chimW, chimH)
    g.fill()
    
    // Chimney cap
    g.fill({ color: hexStringToNumber('#4a3020'), alpha: 1 })
    g.rect(chimX - 2, chimY - 3, chimW + 4, 5)
    g.fill()
    
    // Chimney hole
    g.fill({ color: hexStringToNumber('#1a0a00'), alpha: 0.8 })
    g.rect(chimX + 3, chimY + 3, chimW - 6, chimH - 8)
    g.fill()
    
    g.setStrokeStyle({ width: 1, color: outlineColor, alpha: 0.7 })
    g.rect(chimX, chimY, chimW, chimH)
    g.stroke()
  }
}

function renderBuilding(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, _noise: SimplexNoise): void {
  const gridSize = 60
  const { rooms, furniture } = generateBuildingInterior(gridSize, gridSize, config, rng)
  const cellW = w / gridSize, cellH = h / gridSize
  
  const floorColor = hexStringToNumber(config.secondaryColor || '#c4a882')
  const wallColor = hexStringToNumber(config.primaryColor || '#4a3d35')
  const wallWidth = (config.wallThickness || 2) * 2
  
  // Draw exterior walls first (building outline)
  const padding = 2
  g.setStrokeStyle({ width: wallWidth * 1.5, color: wallColor, alpha: 1 })
  g.rect(padding * cellW, padding * cellH, (gridSize - padding * 2) * cellW, (gridSize - padding * 2) * cellH)
  g.stroke()
  
  // Draw room floors with different colors based on type
  for (const room of rooms) {
    const rx = room.x * cellW, ry = room.y * cellH
    const rw = room.w * cellW, rh = room.h * cellH
    
    // Room type specific floor color
    let roomFloorColor = floorColor
    switch (room.type) {
      case 'bathroom': roomFloorColor = hexStringToNumber('#d8d8d8'); break
      case 'kitchen': roomFloorColor = hexStringToNumber('#e8dcc8'); break
      case 'bedroom': roomFloorColor = hexStringToNumber('#d4c4a8'); break
      case 'living': roomFloorColor = hexStringToNumber('#c8b898'); break
    }
    
    // Floor base
    g.fill({ color: roomFloorColor, alpha: 1 })
    g.rect(rx, ry, rw, rh)
    g.fill()
    
    // Wood grain / tile pattern
    if (room.type === 'bathroom' || room.type === 'kitchen') {
      // Tile pattern
      const tileSize = cellW * 2
      g.setStrokeStyle({ width: 0.5, color: hexStringToNumber('#aaaaaa'), alpha: 0.5 })
      for (let ty = ry; ty < ry + rh; ty += tileSize) {
        g.moveTo(rx, ty); g.lineTo(rx + rw, ty); g.stroke()
      }
      for (let tx = rx; tx < rx + rw; tx += tileSize) {
        g.moveTo(tx, ry); g.lineTo(tx, ry + rh); g.stroke()
      }
    } else {
      // Wood plank pattern
      const plankH = cellH * 1.5
      g.setStrokeStyle({ width: 0.3, color: hexStringToNumber('#8a7a65'), alpha: 0.3 })
      for (let ty = ry; ty < ry + rh; ty += plankH) {
        g.moveTo(rx, ty); g.lineTo(rx + rw, ty); g.stroke()
      }
    }
    
    // Interior walls
    g.setStrokeStyle({ width: wallWidth, color: wallColor, alpha: 1 })
    g.rect(rx, ry, rw, rh)
    g.stroke()
    
    // Draw doors (gaps in walls)
    for (const door of room.doors) {
      const doorSize = cellW * 3
      g.fill({ color: roomFloorColor, alpha: 1 })
      if (door.horizontal) {
        g.rect(door.x * cellW - doorSize / 2, door.y * cellH - wallWidth, doorSize, wallWidth * 2)
      } else {
        g.rect(door.x * cellW - wallWidth, door.y * cellH - doorSize / 2, wallWidth * 2, doorSize)
      }
      g.fill()
      
      // Door frame
      g.setStrokeStyle({ width: 1, color: hexStringToNumber('#5a4a3a'), alpha: 0.8 })
      if (door.horizontal) {
        g.moveTo(door.x * cellW - doorSize / 2, door.y * cellH - wallWidth / 2)
        g.lineTo(door.x * cellW - doorSize / 2, door.y * cellH + wallWidth / 2)
        g.stroke()
        g.moveTo(door.x * cellW + doorSize / 2, door.y * cellH - wallWidth / 2)
        g.lineTo(door.x * cellW + doorSize / 2, door.y * cellH + wallWidth / 2)
        g.stroke()
      } else {
        g.moveTo(door.x * cellW - wallWidth / 2, door.y * cellH - doorSize / 2)
        g.lineTo(door.x * cellW + wallWidth / 2, door.y * cellH - doorSize / 2)
        g.stroke()
        g.moveTo(door.x * cellW - wallWidth / 2, door.y * cellH + doorSize / 2)
        g.lineTo(door.x * cellW + wallWidth / 2, door.y * cellH + doorSize / 2)
        g.stroke()
      }
    }
    
    // Draw windows
    for (const win of room.windows) {
      const winSize = cellW * 4
      g.fill({ color: hexStringToNumber('#87ceeb'), alpha: 0.6 })
      if (win.horizontal) {
        g.rect(win.x * cellW - winSize / 2, win.y * cellH - wallWidth / 2, winSize, wallWidth)
      } else {
        g.rect(win.x * cellW - wallWidth / 2, win.y * cellH - winSize / 2, wallWidth, winSize)
      }
      g.fill()
      
      // Window frame
      g.setStrokeStyle({ width: 1, color: hexStringToNumber('#4a3a2a'), alpha: 1 })
      if (win.horizontal) {
        g.rect(win.x * cellW - winSize / 2, win.y * cellH - wallWidth / 2, winSize, wallWidth)
      } else {
        g.rect(win.x * cellW - wallWidth / 2, win.y * cellH - winSize / 2, wallWidth, winSize)
      }
      g.stroke()
    }
  }
  
  // Draw furniture
  for (const f of furniture) {
    const fx = f.x * cellW, fy = f.y * cellH
    const fw = f.w * cellW, fh = f.h * cellH
    
    let furnitureColor = hexStringToNumber('#6a5a4a')
    let furnitureAlpha = 1
    
    switch (f.type) {
      case 'bed':
        // Bed frame
        g.fill({ color: hexStringToNumber('#5a4030'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.fill()
        // Mattress
        g.fill({ color: hexStringToNumber('#f0e8e0'), alpha: 1 })
        g.rect(fx + 2, fy + 2, fw - 4, fh - 8)
        g.fill()
        // Pillow
        g.fill({ color: hexStringToNumber('#ffffff'), alpha: 1 })
        g.rect(fx + 4, fy + 4, fw - 8, fh * 0.2)
        g.fill()
        break
        
      case 'table':
      case 'coffeetable':
      case 'diningtable':
        g.fill({ color: hexStringToNumber('#7a6050'), alpha: 1 })
        g.roundRect(fx, fy, fw, fh, 2)
        g.fill()
        g.setStrokeStyle({ width: 1, color: hexStringToNumber('#5a4030'), alpha: 1 })
        g.roundRect(fx, fy, fw, fh, 2)
        g.stroke()
        break
        
      case 'chair':
        g.fill({ color: hexStringToNumber('#8a7060'), alpha: 1 })
        g.roundRect(fx, fy, fw, fh, 2)
        g.fill()
        break
        
      case 'sofa':
        // Back
        g.fill({ color: hexStringToNumber('#6a5a8a'), alpha: 1 })
        g.roundRect(fx, fy + fh * 0.6, fw, fh * 0.4, 3)
        g.fill()
        // Seat
        g.fill({ color: hexStringToNumber('#8a7aaa'), alpha: 1 })
        g.roundRect(fx + 2, fy, fw - 4, fh * 0.65, 3)
        g.fill()
        break
        
      case 'counter':
        g.fill({ color: hexStringToNumber('#d8d0c8'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.fill()
        g.setStrokeStyle({ width: 1, color: hexStringToNumber('#a89888'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.stroke()
        break
        
      case 'stove':
        g.fill({ color: hexStringToNumber('#2a2a2a'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.fill()
        // Burners
        g.fill({ color: hexStringToNumber('#4a4a4a'), alpha: 1 })
        g.circle(fx + fw * 0.25, fy + fh * 0.5, fw * 0.15)
        g.circle(fx + fw * 0.75, fy + fh * 0.5, fw * 0.15)
        g.fill()
        break
        
      case 'toilet':
        g.fill({ color: hexStringToNumber('#f8f8f8'), alpha: 1 })
        g.ellipse(fx + fw / 2, fy + fh * 0.6, fw * 0.4, fh * 0.35)
        g.fill()
        g.fill({ color: hexStringToNumber('#e8e8e8'), alpha: 1 })
        g.rect(fx + fw * 0.2, fy, fw * 0.6, fh * 0.3)
        g.fill()
        break
        
      case 'sink':
        g.fill({ color: hexStringToNumber('#e8e8e8'), alpha: 1 })
        g.ellipse(fx + fw / 2, fy + fh / 2, fw * 0.4, fh * 0.35)
        g.fill()
        g.setStrokeStyle({ width: 1, color: hexStringToNumber('#c8c8c8'), alpha: 1 })
        g.ellipse(fx + fw / 2, fy + fh / 2, fw * 0.4, fh * 0.35)
        g.stroke()
        break
        
      case 'bathtub':
        g.fill({ color: hexStringToNumber('#f0f0f0'), alpha: 1 })
        g.roundRect(fx, fy, fw, fh, 4)
        g.fill()
        g.setStrokeStyle({ width: 2, color: hexStringToNumber('#d0d0d0'), alpha: 1 })
        g.roundRect(fx + 3, fy + 3, fw - 6, fh - 6, 3)
        g.stroke()
        break
        
      case 'wardrobe':
      case 'shelf':
        g.fill({ color: hexStringToNumber('#6a5545'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.fill()
        // Door line
        g.setStrokeStyle({ width: 1, color: hexStringToNumber('#4a3525'), alpha: 1 })
        g.moveTo(fx + fw / 2, fy)
        g.lineTo(fx + fw / 2, fy + fh)
        g.stroke()
        break
        
      case 'nightstand':
        g.fill({ color: hexStringToNumber('#7a6555'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.fill()
        break
        
      case 'box':
        g.fill({ color: hexStringToNumber('#a89070'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.fill()
        g.setStrokeStyle({ width: 0.5, color: hexStringToNumber('#8a7060'), alpha: 1 })
        g.rect(fx, fy, fw, fh)
        g.stroke()
        break
        
      default:
        g.fill({ color: furnitureColor, alpha: furnitureAlpha })
        g.rect(fx, fy, fw, fh)
        g.fill()
    }
  }
}

function renderTree(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom): void {
  const cx = w / 2, cy = h / 2
  const maxR = Math.min(w, h) / 2 * 0.88
  const density = config.foliageDensity ?? 0.8
  const complexity = config.complexity ?? 0.5
  
  // Shadow
  if (config.hasShadows !== false) {
    g.fill({ color: hexStringToNumber(config.shadowColor || '#1a3a1a'), alpha: 0.35 })
    g.ellipse(cx + maxR * 0.08, cy + maxR * 0.1, maxR * 0.9, maxR * 0.8)
    g.fill()
  }
  
  // Trunk
  if (config.trunkVisible !== false) {
    g.fill({ color: hexStringToNumber(config.trunkColor || '#5c4033'), alpha: 1 })
    g.ellipse(cx, cy + maxR * 0.25, maxR * 0.12, maxR * 0.2)
    g.fill()
  }
  
  // Foliage layers
  const layers = 4 + Math.floor(complexity * 4)
  for (let layer = 0; layer < layers; layer++) {
    const layerR = maxR * (0.55 + (1 - layer / layers) * 0.45)
    const numCircles = Math.floor(4 + density * 6)
    
    for (let i = 0; i < numCircles; i++) {
      const angle = (i / numCircles) * Math.PI * 2 + rng.next() * 0.7
      const dist = rng.nextFloat(0, layerR * 0.4)
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist - layer * maxR * 0.09
      const r = layerR * rng.nextFloat(0.38, 0.65)
      
      const colorMix = rng.next()
      let color: number
      if (colorMix < 0.35) color = hexStringToNumber(config.primaryColor)
      else if (colorMix < 0.7) color = hexStringToNumber(config.secondaryColor || config.primaryColor)
      else color = hexStringToNumber(config.accentColor || config.secondaryColor || config.primaryColor)
      
      g.fill({ color, alpha: 0.82 + rng.next() * 0.18 })
      g.circle(x, y, r)
      g.fill()
    }
  }
  
  // Highlights
  if (config.hasHighlights !== false) {
    const numHighlights = 3 + Math.floor(density * 4)
    for (let i = 0; i < numHighlights; i++) {
      const angle = rng.next() * Math.PI - Math.PI / 2
      const dist = rng.nextFloat(0, maxR * 0.5)
      g.fill({ color: hexStringToNumber(config.accentColor || '#8ac080'), alpha: 0.55 })
      g.circle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist - maxR * 0.18, maxR * rng.nextFloat(0.08, 0.18))
      g.fill()
    }
  }
}

function renderTreeCluster(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom): void {
  const cx = w / 2, cy = h / 2
  const clusterR = Math.min(w, h) / 2 * 0.85
  const numTrees = 3 + Math.floor((config.complexity || 0.5) * 4)
  
  // Shadow
  if (config.hasShadows !== false) {
    g.fill({ color: hexStringToNumber(config.shadowColor || '#1a3a1a'), alpha: 0.32 })
    g.ellipse(cx + 6, cy + 8, clusterR * 0.95, clusterR * 0.85)
    g.fill()
  }
  
  for (let t = 0; t < numTrees; t++) {
    const angle = (t / numTrees) * Math.PI * 2 + rng.next() * 0.8
    const dist = rng.nextFloat(0, clusterR * 0.4)
    const treeX = cx + Math.cos(angle) * dist
    const treeY = cy + Math.sin(angle) * dist
    const treeR = clusterR * rng.nextFloat(0.28, 0.5)
    
    const numCircles = 5 + Math.floor(rng.next() * 4)
    for (let i = 0; i < numCircles; i++) {
      const cAngle = rng.next() * Math.PI * 2
      const cDist = rng.nextFloat(0, treeR * 0.3)
      
      const colorMix = rng.next()
      const color = colorMix < 0.4 ? hexStringToNumber(config.primaryColor) 
        : colorMix < 0.75 ? hexStringToNumber(config.secondaryColor || config.primaryColor)
        : hexStringToNumber(config.accentColor || config.secondaryColor || config.primaryColor)
      
      g.fill({ color, alpha: 0.78 + rng.next() * 0.22 })
      g.circle(treeX + Math.cos(cAngle) * cDist, treeY + Math.sin(cAngle) * cDist, treeR * rng.nextFloat(0.5, 0.75))
      g.fill()
    }
  }
  
  // Highlights
  if (config.hasHighlights !== false) {
    for (let i = 0; i < 5; i++) {
      const angle = rng.next() * Math.PI * 2
      const dist = rng.nextFloat(0, clusterR * 0.6)
      g.fill({ color: hexStringToNumber(config.accentColor || '#8ac080'), alpha: 0.5 })
      g.circle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, clusterR * rng.nextFloat(0.06, 0.14))
      g.fill()
    }
  }
}

function renderBush(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom): void {
  const cx = w / 2, cy = h / 2
  const maxR = Math.min(w, h) / 2 * 0.82
  
  // Shadow
  if (config.hasShadows !== false) {
    g.fill({ color: hexStringToNumber(config.shadowColor || '#1a3a1a'), alpha: 0.28 })
    g.ellipse(cx + 5, cy + 6, maxR * 0.85, maxR * 0.65)
    g.fill()
  }
  
  const layers = 5 + Math.floor((config.complexity || 0.5) * 4)
  for (let layer = 0; layer < layers; layer++) {
    const layerR = maxR * (0.5 + (1 - layer / layers) * 0.5)
    const offsetX = rng.nextFloat(-8, 8)
    const offsetY = rng.nextFloat(-8, 8) - layer * 2.5
    
    const colorMix = rng.next()
    const color = colorMix < 0.4 ? hexStringToNumber(config.primaryColor) 
      : colorMix < 0.78 ? hexStringToNumber(config.secondaryColor || config.primaryColor)
      : hexStringToNumber(config.accentColor || config.secondaryColor || config.primaryColor)
    
    g.fill({ color, alpha: 0.72 + rng.next() * 0.28 })
    
    // Irregular blob
    const points: number[] = []
    const numPoints = 12
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2
      const r = layerR * (0.7 + rng.next() * 0.55)
      points.push(cx + offsetX + Math.cos(angle) * r)
      points.push(cy + offsetY + Math.sin(angle) * r * 0.72)
    }
    g.poly(points)
    g.fill()
  }
  
  // Flowers
  if (config.flowerColor) {
    const numFlowers = 4 + Math.floor(rng.next() * 5)
    for (let i = 0; i < numFlowers; i++) {
      const angle = rng.next() * Math.PI * 2
      const dist = rng.nextFloat(maxR * 0.2, maxR * 0.65)
      g.fill({ color: hexStringToNumber(config.flowerColor), alpha: 0.92 })
      g.circle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist * 0.7, 2.5 + rng.next() * 3.5)
      g.fill()
    }
  }
}

function renderRocks(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom): void {
  const cx = w / 2, cy = h / 2
  const maxR = Math.min(w, h) / 2 * 0.85
  
  // Shadow
  g.fill({ color: hexStringToNumber(config.shadowColor || '#2a2a2a'), alpha: 0.38 })
  drawIrregularPoly(g, cx + maxR * 0.08, cy + maxR * 0.08, maxR * 0.88, 9, rng, 0.28)
  g.fill()
  
  const numRocks = 2 + Math.floor((config.complexity || 0.5) * 4)
  for (let i = 0; i < numRocks; i++) {
    const angle = (i / numRocks) * Math.PI * 2 + rng.next() * 0.5
    const dist = rng.nextFloat(0, maxR * 0.28)
    const rockX = cx + Math.cos(angle) * dist
    const rockY = cy + Math.sin(angle) * dist
    const rockR = maxR * rng.nextFloat(0.32, 0.58)
    
    // Base shadow
    g.fill({ color: hexStringToNumber(config.secondaryColor || '#4a4a4a'), alpha: 1 })
    drawIrregularPoly(g, rockX + 1, rockY + 1, rockR, 7, rng, 0.22)
    g.fill()
    
    // Main rock
    g.fill({ color: hexStringToNumber(config.primaryColor), alpha: 1 })
    drawIrregularPoly(g, rockX - 1, rockY - 1, rockR * 0.94, 7, rng, 0.2)
    g.fill()
    
    // Highlight
    g.fill({ color: hexStringToNumber(config.accentColor || '#8a8a8a'), alpha: 0.48 })
    drawIrregularPoly(g, rockX - 3, rockY - 3, rockR * 0.38, 5, rng, 0.15)
    g.fill()
  }
}

function drawIrregularPoly(g: PIXI.Graphics, cx: number, cy: number, radius: number, points: number, rng: SeededRandom, irregularity: number): void {
  const pts: number[] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const r = radius * (1 - irregularity + rng.next() * irregularity * 2)
    pts.push(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
  }
  g.poly(pts)
}

function renderPath(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const pathWidth = config.pathWidth || 35
  const curviness = config.curviness || 0.5
  const isRiver = config.terrainType === 'river'
  
  const numPoints = 7
  const points: { x: number; y: number }[] = []
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1)
    const baseY = h / 2
    const offset = noise.fbm(i * 0.5, 0, 3) * h * 0.35 * curviness
    points.push({ x: t * w, y: baseY + offset })
  }
  
  // Main path
  g.setStrokeStyle({ width: pathWidth, color: hexStringToNumber(config.primaryColor), alpha: isRiver ? 0.72 : 1, cap: 'round', join: 'round' })
  g.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i]
    const midX = (prev.x + curr.x) / 2, midY = (prev.y + curr.y) / 2
    g.quadraticCurveTo(prev.x, prev.y, midX, midY)
  }
  g.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  g.stroke()
  
  // Highlight
  g.setStrokeStyle({ width: pathWidth * 0.28, color: hexStringToNumber(config.accentColor || config.primaryColor), alpha: isRiver ? 0.45 : 0.3, cap: 'round', join: 'round' })
  g.moveTo(points[0].x, points[0].y - pathWidth * 0.15)
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i]
    const midX = (prev.x + curr.x) / 2, midY = (prev.y + curr.y) / 2 - pathWidth * 0.15
    g.quadraticCurveTo(prev.x, prev.y - pathWidth * 0.15, midX, midY)
  }
  g.stroke()
  
  // Stones for path
  if (config.hasStones && !isRiver) {
    for (let i = 0; i < 15; i++) {
      const t = rng.next()
      const idx = Math.floor(t * (points.length - 1))
      const p1 = points[idx], p2 = points[Math.min(idx + 1, points.length - 1)]
      const x = p1.x + (p2.x - p1.x) * (t * (points.length - 1) - idx)
      const y = p1.y + (p2.y - p1.y) * (t * (points.length - 1) - idx)
      const offsetY = rng.nextFloat(-pathWidth * 0.35, pathWidth * 0.35)
      g.fill({ color: hexStringToNumber(config.secondaryColor || '#5a5a5a'), alpha: 0.65 })
      g.circle(x, y + offsetY, rng.nextFloat(2, 5))
      g.fill()
    }
  }
}

function renderCampsite(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, _noise: SimplexNoise): void {
  const cx = w / 2, cy = h / 2
  const siteR = Math.min(w, h) / 2 * 0.9
  
  // Ground
  g.fill({ color: hexStringToNumber(config.primaryColor), alpha: 0.82 })
  g.circle(cx, cy, siteR)
  g.fill()
  
  // Texture
  for (let i = 0; i < 55; i++) {
    const angle = rng.next() * Math.PI * 2
    const dist = rng.next() * siteR * 0.88
    const n = rng.next()
    const color = lerpColor(config.primaryColor, config.secondaryColor || config.primaryColor, n)
    g.fill({ color, alpha: 0.35 })
    g.circle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, rng.nextFloat(3, 10))
    g.fill()
  }
  
  // Fire pit
  g.fill({ color: 0x2a2a2a, alpha: 1 })
  g.circle(cx, cy, siteR * 0.13)
  g.fill()
  
  // Stones
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2
    g.fill({ color: 0x555555, alpha: 1 })
    g.circle(cx + Math.cos(angle) * siteR * 0.11, cy + Math.sin(angle) * siteR * 0.11, siteR * 0.038)
    g.fill()
  }
  
  // Tents
  if (config.hasFurniture !== false) {
    const numTents = 2 + Math.floor(rng.next() * 2)
    for (let i = 0; i < numTents; i++) {
      const angle = (i / numTents) * Math.PI * 2 + Math.PI / 4
      const dist = siteR * 0.58
      const tentX = cx + Math.cos(angle) * dist
      const tentY = cy + Math.sin(angle) * dist
      const tentSize = siteR * 0.24
      
      // Shadow
      g.fill({ color: 0x1a1a1a, alpha: 0.3 })
      g.poly([tentX + 4, tentY - tentSize * 0.28 + 4, tentX - tentSize * 0.48 + 4, tentY + tentSize * 0.48 + 4, tentX + tentSize * 0.48 + 4, tentY + tentSize * 0.48 + 4])
      g.fill()
      
      // Tent
      g.fill({ color: hexStringToNumber(config.accentColor || '#c9a571'), alpha: 0.92 })
      g.poly([tentX, tentY - tentSize * 0.28, tentX - tentSize * 0.48, tentY + tentSize * 0.48, tentX + tentSize * 0.48, tentY + tentSize * 0.48])
      g.fill()
      
      // Highlight
      g.fill({ color: 0xffffff, alpha: 0.22 })
      g.poly([tentX, tentY - tentSize * 0.28, tentX - tentSize * 0.24, tentY + tentSize * 0.18, tentX, tentY + tentSize * 0.08])
      g.fill()
    }
  }
  
  // Logs
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 6
    const dist = siteR * 0.34
    const logX = cx + Math.cos(angle) * dist
    const logY = cy + Math.sin(angle) * dist
    g.fill({ color: 0x5c4033, alpha: 1 })
    g.roundRect(logX - 14, logY - 4, 28, 9, 3)
    g.fill()
  }
}

// =====================================================
// GROUND TERRAIN RENDERING
// =====================================================

function renderMountains(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const baseColor = hexStringToNumber(config.primaryColor || '#6a5a4a')
  const lightColor = hexStringToNumber(config.secondaryColor || '#8a7a6a')
  const snowColor = hexStringToNumber(config.accentColor || '#ffffff')
  const shadowColor = hexStringToNumber(config.shadowColor || '#3a2a1a')
  
  // Base terrain color
  g.fill({ color: baseColor, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Generate elevation map using noise
  const numContours = 6 + Math.floor((config.complexity || 0.5) * 4)
  
  // Draw mountain peaks and ridges using noise-based contours
  for (let level = 0; level < numContours; level++) {
    // Use lightColor for mid elevations, snowColor for peaks
    const elevColor = level > numContours - 2 ? snowColor : level > numContours / 2 ? lightColor : lerpColor(config.primaryColor, config.secondaryColor || config.primaryColor, level / numContours)
    
    g.fill({ color: elevColor, alpha: 0.9 - level * 0.05 })
    
    // Draw contour shapes
    const numPeaks = 2 + Math.floor(rng.next() * 3)
    const levelRatio = (level + 1) / numContours // Higher levels = smaller peaks
    for (let p = 0; p < numPeaks; p++) {
      const peakX = w * rng.nextFloat(0.2, 0.8)
      const peakY = h * rng.nextFloat(0.2, 0.8)
      const peakSize = Math.min(w, h) * rng.nextFloat(0.15, 0.35) * (1 - levelRatio * 0.5)
      
      // Draw irregular mountain shape
      const points: number[] = []
      const numPoints = 12
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2
        const nv = noise.fbm(peakX / 100 + Math.cos(angle) * 2, peakY / 100 + Math.sin(angle) * 2, 3)
        const r = peakSize * (0.6 + nv * 0.5)
        points.push(peakX + Math.cos(angle) * r)
        points.push(peakY + Math.sin(angle) * r)
      }
      g.poly(points)
      g.fill()
    }
  }
  
  // Add shadow lines for depth
  g.setStrokeStyle({ width: 1, color: shadowColor, alpha: 0.3 })
  for (let i = 0; i < 20; i++) {
    const x1 = rng.next() * w
    const y1 = rng.next() * h
    const len = 20 + rng.next() * 40
    g.moveTo(x1, y1)
    g.lineTo(x1 + len * 0.3, y1 + len)
    g.stroke()
  }
}

function renderGrassland(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const baseColor = hexStringToNumber(config.primaryColor || '#3d7a40')
  const lightColor = hexStringToNumber(config.secondaryColor || '#5aa050')
  const darkColor = hexStringToNumber(config.accentColor || '#2d5a30')
  const shadowColor = hexStringToNumber(config.shadowColor || '#1e3a1e')
  
  // Configuration options
  const detailLevel = config.detailLevel || 0.5
  const grassDensity = config.grassDensity || 0.7
  const hasFlowers = config.hasFlowers !== false
  const flowerDensity = config.flowerDensity || 0.3
  const grassBladeSize = config.grassBladeSize || 0.6
  const hasPathPatches = config.hasPathPatches || false
  
  // Pixel size based on detail level (smaller = more detail)
  const pixelSize = Math.max(2, Math.floor(6 - detailLevel * 4))
  
  // ===== LAYER 1: Base ground color with detailed noise variation =====
  for (let y = 0; y < h; y += pixelSize) {
    for (let x = 0; x < w; x += pixelSize) {
      // Multi-octave noise for natural variation
      const n1 = noise.fbm(x * 0.015, y * 0.015, 4, 2, 0.5) * 0.5 + 0.5
      const n2 = noise.fbm(x * 0.04 + 100, y * 0.04 + 100, 2, 2, 0.5) * 0.5 + 0.5
      const combined = n1 * 0.7 + n2 * 0.3
      
      let color: number
      if (combined > 0.65) {
        color = lightColor
      } else if (combined > 0.45) {
        color = baseColor
      } else if (combined > 0.3) {
        color = darkColor
      } else {
        color = shadowColor
      }
      
      g.fill({ color, alpha: 1 })
      g.rect(x, y, pixelSize + 0.5, pixelSize + 0.5)
      g.fill()
    }
  }
  
  // ===== LAYER 2: Subtle ground texture patches =====
  const numPatches = Math.floor(20 + detailLevel * 30)
  for (let i = 0; i < numPatches; i++) {
    const patchX = rng.next() * w
    const patchY = rng.next() * h
    const patchW = 30 + rng.next() * 60
    const patchH = 20 + rng.next() * 40
    
    const patchColor = rng.next() > 0.5 ? lightColor : darkColor
    g.fill({ color: patchColor, alpha: 0.2 + rng.next() * 0.15 })
    g.ellipse(patchX, patchY, patchW, patchH)
    g.fill()
  }
  
  // ===== LAYER 3: Dirt path patches (worn areas) =====
  if (hasPathPatches) {
    const dirtColor = hexStringToNumber('#8a7860')
    const dirtDark = hexStringToNumber('#6a5840')
    
    const numDirtPatches = 3 + Math.floor(rng.next() * 4)
    for (let i = 0; i < numDirtPatches; i++) {
      const dirtX = rng.next() * w
      const dirtY = rng.next() * h
      const dirtW = 40 + rng.next() * 80
      const dirtH = 30 + rng.next() * 50
      
      // Main dirt patch
      g.fill({ color: dirtColor, alpha: 0.8 })
      const dirtPoints: number[] = []
      for (let j = 0; j < 12; j++) {
        const angle = (j / 12) * Math.PI * 2
        const r = (j % 2 === 0 ? dirtW : dirtH) * (0.4 + rng.next() * 0.25)
        dirtPoints.push(dirtX + Math.cos(angle) * r)
        dirtPoints.push(dirtY + Math.sin(angle) * r * 0.7)
      }
      g.poly(dirtPoints)
      g.fill()
      
      // Dirt texture
      for (let d = 0; d < 15; d++) {
        const dotX = dirtX + rng.nextFloat(-dirtW * 0.4, dirtW * 0.4)
        const dotY = dirtY + rng.nextFloat(-dirtH * 0.3, dirtH * 0.3)
        g.fill({ color: rng.next() > 0.5 ? dirtDark : dirtColor, alpha: 0.5 })
        g.circle(dotX, dotY, 1 + rng.next() * 2)
        g.fill()
      }
    }
  }
  
  // ===== LAYER 4: Dense grass blade clusters =====
  const bladeHeight = 8 + grassBladeSize * 16
  const bladeSpread = 10 + grassBladeSize * 8
  const numClusters = Math.floor(40 + grassDensity * 100 * detailLevel)
  
  for (let i = 0; i < numClusters; i++) {
    const clusterX = rng.next() * w
    const clusterY = rng.next() * h
    const numBlades = Math.floor(4 + grassDensity * 8)
    
    for (let b = 0; b < numBlades; b++) {
      const bx = clusterX + rng.nextFloat(-bladeSpread, bladeSpread)
      const by = clusterY + rng.nextFloat(-bladeSpread * 0.6, bladeSpread * 0.6)
      const height = bladeHeight * (0.6 + rng.next() * 0.6)
      const lean = rng.nextFloat(-4, 4)
      const thickness = 1 + rng.next() * grassBladeSize * 1.5
      
      // Blade color variation
      const colorRoll = rng.next()
      let bladeColor: number
      if (colorRoll > 0.7) bladeColor = lightColor
      else if (colorRoll > 0.3) bladeColor = baseColor
      else bladeColor = darkColor
      
      g.setStrokeStyle({ width: thickness, color: bladeColor, alpha: 0.7 + rng.next() * 0.2, cap: 'round' })
      g.moveTo(bx, by)
      g.quadraticCurveTo(bx + lean * 0.4, by - height * 0.5, bx + lean, by - height)
      g.stroke()
    }
  }
  
  // ===== LAYER 5: Individual scattered grass blades =====
  const scatteredBlades = Math.floor(100 + grassDensity * 200 * detailLevel)
  for (let i = 0; i < scatteredBlades; i++) {
    const bx = rng.next() * w
    const by = rng.next() * h
    const height = (bladeHeight * 0.5) * (0.5 + rng.next() * 0.6)
    const lean = rng.nextFloat(-3, 3)
    
    const colorRoll = rng.next()
    const bladeColor = colorRoll > 0.6 ? lightColor : colorRoll > 0.25 ? baseColor : darkColor
    
    g.setStrokeStyle({ width: 0.8 + rng.next() * 0.8, color: bladeColor, alpha: 0.5 + rng.next() * 0.3, cap: 'round' })
    g.moveTo(bx, by)
    g.lineTo(bx + lean, by - height)
    g.stroke()
  }
  
  // ===== LAYER 6: Wildflowers =====
  if (hasFlowers) {
    const flowerColors = [
      { petal: 0xffff66, center: 0xffaa00 }, // Yellow daisies
      { petal: 0xffffff, center: 0xffff66 }, // White daisies
      { petal: 0xff6699, center: 0xffdd88 }, // Pink flowers
      { petal: 0x9966ff, center: 0xffff88 }, // Purple flowers
      { petal: 0xff4444, center: 0xff8800 }, // Red poppies
      { petal: 0x6699ff, center: 0xffffaa }, // Blue flowers
    ]
    
    const numFlowerClusters = Math.floor(8 + flowerDensity * 25)
    
    for (let c = 0; c < numFlowerClusters; c++) {
      const clusterX = rng.next() * w
      const clusterY = rng.next() * h
      const clusterSize = 15 + rng.next() * 30
      const numFlowers = Math.floor(2 + flowerDensity * 6)
      const flowerType = flowerColors[rng.nextInt(0, flowerColors.length - 1)]
      
      for (let f = 0; f < numFlowers; f++) {
        const fx = clusterX + rng.nextFloat(-clusterSize, clusterSize)
        const fy = clusterY + rng.nextFloat(-clusterSize * 0.6, clusterSize * 0.6)
        const flowerSize = 2 + rng.next() * 3
        
        // Simple flower (petals)
        g.fill({ color: flowerType.petal, alpha: 0.9 })
        g.circle(fx, fy, flowerSize)
        g.fill()
        
        // Flower center
        g.fill({ color: flowerType.center, alpha: 0.95 })
        g.circle(fx, fy, flowerSize * 0.4)
        g.fill()
      }
    }
    
    // Scattered individual flowers
    const scatteredFlowers = Math.floor(10 + flowerDensity * 30)
    for (let i = 0; i < scatteredFlowers; i++) {
      const fx = rng.next() * w
      const fy = rng.next() * h
      const flowerType = flowerColors[rng.nextInt(0, flowerColors.length - 1)]
      const flowerSize = 1.5 + rng.next() * 2
      
      g.fill({ color: flowerType.petal, alpha: 0.85 })
      g.circle(fx, fy, flowerSize)
      g.fill()
      
      g.fill({ color: flowerType.center, alpha: 0.9 })
      g.circle(fx, fy, flowerSize * 0.35)
      g.fill()
    }
  }
  
  // ===== LAYER 7: Subtle shadows/depth =====
  const numShadows = Math.floor(5 + detailLevel * 10)
  for (let i = 0; i < numShadows; i++) {
    const sx = rng.next() * w
    const sy = rng.next() * h
    const sw = 40 + rng.next() * 80
    const sh = 30 + rng.next() * 50
    
    g.fill({ color: shadowColor, alpha: 0.08 + rng.next() * 0.06 })
    g.ellipse(sx, sy, sw, sh)
    g.fill()
  }
  
  // ===== LAYER 8: Light highlights =====
  const numHighlights = Math.floor(3 + detailLevel * 6)
  for (let i = 0; i < numHighlights; i++) {
    const hx = rng.next() * w
    const hy = rng.next() * h
    const hw = 30 + rng.next() * 60
    const hh = 20 + rng.next() * 40
    
    g.fill({ color: lightColor, alpha: 0.1 + rng.next() * 0.08 })
    g.ellipse(hx, hy, hw, hh)
    g.fill()
  }
}

function renderOcean(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const deepWater = hexStringToNumber(config.primaryColor || '#2060a0')
  const shallowWater = hexStringToNumber(config.secondaryColor || '#4080c0')
  const sandColor = hexStringToNumber(config.accentColor || '#c4b090')
  
  // Deep water base
  g.fill({ color: deepWater, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Water variation
  for (let y = 0; y < h; y += 8) {
    for (let x = 0; x < w; x += 8) {
      const n = noise.fbm(x * 0.01, y * 0.01, 2)
      if (n > 0) {
        g.fill({ color: shallowWater, alpha: n * 0.5 })
        g.rect(x, y, 10, 10)
        g.fill()
      }
    }
  }
  
  // Wave patterns
  g.setStrokeStyle({ width: 1, color: shallowWater, alpha: 0.3 })
  for (let y = 0; y < h; y += 30) {
    for (let x = 0; x < w; x += 5) {
      const wave = Math.sin(x * 0.05 + y * 0.02 + rng.next()) * 5
      if (x === 0) g.moveTo(x, y + wave)
      else g.lineTo(x, y + wave)
    }
    g.stroke()
  }
  
  // Islands
  const numIslands = 1 + Math.floor((config.complexity || 0.5) * 4)
  for (let i = 0; i < numIslands; i++) {
    const ix = w * rng.nextFloat(0.15, 0.85)
    const iy = h * rng.nextFloat(0.15, 0.85)
    const islandSize = Math.min(w, h) * rng.nextFloat(0.08, 0.2)
    
    // Sandy beach ring
    g.fill({ color: sandColor, alpha: 1 })
    const beachPoints: number[] = []
    for (let a = 0; a < 16; a++) {
      const angle = (a / 16) * Math.PI * 2
      const r = islandSize * (0.9 + noise.noise2D(Math.cos(angle) * 2, Math.sin(angle) * 2) * 0.3)
      beachPoints.push(ix + Math.cos(angle) * r)
      beachPoints.push(iy + Math.sin(angle) * r)
    }
    g.poly(beachPoints)
    g.fill()
    
    // Green interior
    g.fill({ color: hexStringToNumber('#4a8a4a'), alpha: 1 })
    const greenPoints: number[] = []
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2
      const r = islandSize * 0.6 * (0.8 + rng.next() * 0.3)
      greenPoints.push(ix + Math.cos(angle) * r)
      greenPoints.push(iy + Math.sin(angle) * r)
    }
    g.poly(greenPoints)
    g.fill()
  }
}

function renderLake(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  // Colors - water is background, drawn first
  const deepWater = hexStringToNumber(config.shadowColor || '#1a4878')
  const midWater = hexStringToNumber(config.primaryColor || '#2868a8')
  const shallowWater = hexStringToNumber(config.secondaryColor || '#4090c8')
  const veryShallowWater = hexStringToNumber(config.accentColor || '#60b0e8')
  
  // Configuration
  const lakeStyle = config.lakeStyle || 'natural'
  const depthZones = config.waterDepthZones || 3
  const shoreDetail = config.shoreDetail || 0.5
  const hasIslands = config.hasIslands !== false
  const islandCount = config.islandCount ?? 2
  const hasReeds = config.hasReeds !== false
  const reedDensity = config.reedDensity || 0.5
  const hasWaves = config.hasWaves !== false
  const waveIntensity = config.waveIntensity || 0.3
  const hasShoreSand = config.hasShoreSand !== false
  const waterTransparency = config.waterTransparency || 0.3
  
  // Lake takes up most of the canvas (it's the background)
  const padding = w * 0.02
  const lakeW = w - padding * 2
  const lakeH = h - padding * 2
  const cx = w / 2
  const cy = h / 2
  
  // Number of points for organic shape - more = smoother but more complex
  const shapePoints = lakeStyle === 'simple' ? 24 : lakeStyle === 'complex' ? 64 : 48
  const noiseScale = lakeStyle === 'simple' ? 0.1 : lakeStyle === 'complex' ? 0.35 : 0.25
  const noiseFreq = lakeStyle === 'simple' ? 2 : lakeStyle === 'complex' ? 5 : 3.5
  
  // Generate organic lake boundary points
  function generateOrganicShape(radiusX: number, radiusY: number, offsetX = 0, offsetY = 0, variation = shoreDetail): number[] {
    const points: number[] = []
    for (let i = 0; i < shapePoints; i++) {
      const angle = (i / shapePoints) * Math.PI * 2
      const noiseVal = noise.fbm(
        Math.cos(angle) * noiseFreq + offsetX,
        Math.sin(angle) * noiseFreq + offsetY,
        4, 2, 0.5
      )
      const radiusVar = 1 + noiseVal * variation * noiseScale
      const rx = radiusX * radiusVar
      const ry = radiusY * radiusVar
      points.push(cx + Math.cos(angle) * rx)
      points.push(cy + Math.sin(angle) * ry)
    }
    return points
  }
  
  // ===== LAYER 1: Deep water (background/base) =====
  g.fill({ color: deepWater, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // ===== LAYER 2: Water depth zones (from deep to shallow) =====
  const depthColors = [deepWater, midWater, shallowWater, veryShallowWater]
  const baseRadiusX = lakeW / 2 * 0.95
  const baseRadiusY = lakeH / 2 * 0.95
  
  for (let zone = 0; zone < Math.min(depthZones, 4); zone++) {
    const zoneRatio = 1 - (zone / depthZones) * 0.4 // Each zone is slightly smaller
    const zonePoints = generateOrganicShape(
      baseRadiusX * zoneRatio,
      baseRadiusY * zoneRatio,
      zone * 5, // Different noise offset per zone
      zone * 7,
      shoreDetail * (1 - zone * 0.15) // Inner zones are smoother
    )
    
    const color = depthColors[Math.min(zone, depthColors.length - 1)]
    g.fill({ color, alpha: 1 - zone * waterTransparency * 0.2 })
    g.poly(zonePoints)
    g.fill()
  }
  
  // ===== LAYER 3: Wave patterns on water =====
  if (hasWaves) {
    const waveColor = veryShallowWater
    const numWaveLines = 8 + Math.floor(waveIntensity * 12)
    
    g.setStrokeStyle({ width: 1 + waveIntensity, color: waveColor, alpha: 0.2 + waveIntensity * 0.15 })
    
    for (let i = 0; i < numWaveLines; i++) {
      const waveY = cy - lakeH * 0.35 + (i / numWaveLines) * lakeH * 0.7
      const waveStartX = cx - lakeW * 0.4
      const waveEndX = cx + lakeW * 0.4
      
      g.moveTo(waveStartX, waveY)
      for (let x = waveStartX; x <= waveEndX; x += 8) {
        const waveOffset = Math.sin(x * 0.015 + i * 0.8) * (8 + waveIntensity * 15)
        const noiseOffset = noise.noise2D(x * 0.01, i * 0.5) * 10 * waveIntensity
        g.lineTo(x, waveY + waveOffset + noiseOffset)
      }
      g.stroke()
    }
    
    // Ripple circles
    const numRipples = 3 + Math.floor(waveIntensity * 5)
    for (let i = 0; i < numRipples; i++) {
      const rippleX = cx + rng.nextFloat(-lakeW * 0.3, lakeW * 0.3)
      const rippleY = cy + rng.nextFloat(-lakeH * 0.3, lakeH * 0.3)
      const rippleR = 15 + rng.next() * 25
      
      g.setStrokeStyle({ width: 1, color: waveColor, alpha: 0.15 })
      g.circle(rippleX, rippleY, rippleR)
      g.stroke()
      g.circle(rippleX, rippleY, rippleR * 0.6)
      g.stroke()
    }
  }
  
  // ===== LAYER 4: Islands (land on water) =====
  if (hasIslands && islandCount > 0) {
    const sandColor = hexStringToNumber('#c8b888')
    const grassColor = hexStringToNumber('#4a8050')
    const darkGrassColor = hexStringToNumber('#3a6040')
    
    for (let i = 0; i < islandCount; i++) {
      // Island position - avoid center and edges
      const islandAngle = (i / islandCount) * Math.PI * 2 + rng.nextFloat(0, Math.PI * 0.5)
      const islandDist = rng.nextFloat(0.15, 0.35) * Math.min(lakeW, lakeH)
      const islandX = cx + Math.cos(islandAngle) * islandDist
      const islandY = cy + Math.sin(islandAngle) * islandDist
      
      const islandSize = Math.min(lakeW, lakeH) * rng.nextFloat(0.06, 0.12)
      
      // Sandy beach ring
      g.fill({ color: sandColor, alpha: 1 })
      const beachPoints: number[] = []
      const islandShapePoints = 16
      for (let j = 0; j < islandShapePoints; j++) {
        const angle = (j / islandShapePoints) * Math.PI * 2
        const nv = noise.noise2D(Math.cos(angle) * 3 + i * 10, Math.sin(angle) * 3 + i * 10)
        const r = (islandSize + 8) * (0.8 + nv * 0.4)
        beachPoints.push(islandX + Math.cos(angle) * r)
        beachPoints.push(islandY + Math.sin(angle) * r)
      }
      g.poly(beachPoints)
      g.fill()
      
      // Green interior
      g.fill({ color: grassColor, alpha: 1 })
      const greenPoints: number[] = []
      for (let j = 0; j < islandShapePoints; j++) {
        const angle = (j / islandShapePoints) * Math.PI * 2
        const nv = noise.noise2D(Math.cos(angle) * 3 + i * 10, Math.sin(angle) * 3 + i * 10)
        const r = islandSize * 0.7 * (0.8 + nv * 0.35)
        greenPoints.push(islandX + Math.cos(angle) * r)
        greenPoints.push(islandY + Math.sin(angle) * r)
      }
      g.poly(greenPoints)
      g.fill()
      
      // Dark patches on island
      g.fill({ color: darkGrassColor, alpha: 0.6 })
      for (let j = 0; j < 2 + Math.floor(rng.next() * 2); j++) {
        const patchX = islandX + rng.nextFloat(-islandSize * 0.3, islandSize * 0.3)
        const patchY = islandY + rng.nextFloat(-islandSize * 0.3, islandSize * 0.3)
        g.ellipse(patchX, patchY, islandSize * 0.2, islandSize * 0.15)
        g.fill()
      }
      
      // Trees on larger islands
      if (islandSize > w * 0.08) {
        const treeColor = hexStringToNumber('#2d5030')
        const numTrees = 1 + Math.floor(rng.next() * 2)
        for (let t = 0; t < numTrees; t++) {
          const treeX = islandX + rng.nextFloat(-islandSize * 0.3, islandSize * 0.3)
          const treeY = islandY + rng.nextFloat(-islandSize * 0.3, islandSize * 0.3)
          const treeR = islandSize * rng.nextFloat(0.25, 0.4)
          
          // Tree shadow
          g.fill({ color: hexStringToNumber('#1a3020'), alpha: 0.3 })
          g.circle(treeX + 2, treeY + 2, treeR)
          g.fill()
          
          // Tree canopy
          g.fill({ color: treeColor, alpha: 0.9 })
          g.circle(treeX, treeY, treeR)
          g.fill()
        }
      }
    }
  }
  
  // ===== LAYER 5: Shore sand ring (around lake edge) =====
  if (hasShoreSand) {
    const sandColor = hexStringToNumber('#c8b888')
    const wetSandColor = hexStringToNumber('#a89870')
    
    // Outer sand ring
    const outerSandPoints = generateOrganicShape(
      baseRadiusX * 1.08,
      baseRadiusY * 1.08,
      20, 20,
      shoreDetail * 0.8
    )
    g.fill({ color: sandColor, alpha: 1 })
    g.poly(outerSandPoints)
    g.fill()
    
    // Wet sand (closer to water)
    const wetSandPoints = generateOrganicShape(
      baseRadiusX * 1.03,
      baseRadiusY * 1.03,
      15, 15,
      shoreDetail * 0.6
    )
    g.fill({ color: wetSandColor, alpha: 0.7 })
    g.poly(wetSandPoints)
    g.fill()
    
    // Sand texture dots
    const numSandDots = 80 + Math.floor(shoreDetail * 80)
    for (let i = 0; i < numSandDots; i++) {
      const angle = rng.next() * Math.PI * 2
      const dist = (baseRadiusX * 1.05 + rng.nextFloat(-15, 15))
      const dotX = cx + Math.cos(angle) * dist * (lakeW / lakeH)
      const dotY = cy + Math.sin(angle) * dist
      
      g.fill({ color: rng.next() > 0.5 ? sandColor : wetSandColor, alpha: 0.4 + rng.next() * 0.3 })
      g.circle(dotX, dotY, 1 + rng.next() * 2)
      g.fill()
    }
  }
  
  // ===== LAYER 6: Reeds and shore vegetation =====
  if (hasReeds) {
    const reedGreen = hexStringToNumber('#4a7040')
    const reedDark = hexStringToNumber('#3a5030')
    const waterLilyGreen = hexStringToNumber('#3a6835')
    const flowerWhite = hexStringToNumber('#f0f0e8')
    const flowerPink = hexStringToNumber('#e8b0c0')
    
    const numReedClusters = Math.floor(12 + reedDensity * 20)
    
    for (let i = 0; i < numReedClusters; i++) {
      const angle = (i / numReedClusters) * Math.PI * 2 + rng.nextFloat(-0.2, 0.2)
      // Reeds at the water's edge
      const dist = baseRadiusX * rng.nextFloat(0.92, 1.05)
      const clusterX = cx + Math.cos(angle) * dist * (lakeW / Math.max(lakeW, lakeH))
      const clusterY = cy + Math.sin(angle) * dist * (lakeH / Math.max(lakeW, lakeH))
      
      // Reed stalks
      const numReeds = 3 + Math.floor(rng.next() * 5 * reedDensity)
      for (let r = 0; r < numReeds; r++) {
        const reedX = clusterX + rng.nextFloat(-12, 12)
        const reedY = clusterY + rng.nextFloat(-8, 8)
        const reedHeight = 15 + rng.next() * 25
        const lean = rng.nextFloat(-4, 4)
        
        g.setStrokeStyle({ 
          width: 1.5 + rng.next() * 1.5, 
          color: rng.next() > 0.4 ? reedGreen : reedDark, 
          alpha: 0.8 
        })
        g.moveTo(reedX, reedY)
        g.quadraticCurveTo(reedX + lean * 0.5, reedY - reedHeight * 0.5, reedX + lean, reedY - reedHeight)
        g.stroke()
        
        // Reed head/tuft
        if (rng.next() > 0.5) {
          g.fill({ color: hexStringToNumber('#8a7060'), alpha: 0.8 })
          g.ellipse(reedX + lean, reedY - reedHeight - 3, 2, 5)
          g.fill()
        }
      }
    }
    
    // Water lilies (lily pads with flowers)
    const numLilies = Math.floor(5 + reedDensity * 10)
    for (let i = 0; i < numLilies; i++) {
      const angle = rng.next() * Math.PI * 2
      const dist = rng.nextFloat(0.3, 0.8) * Math.min(baseRadiusX, baseRadiusY)
      const lilyX = cx + Math.cos(angle) * dist
      const lilyY = cy + Math.sin(angle) * dist
      const lilySize = 8 + rng.next() * 10
      
      // Lily pad
      g.fill({ color: waterLilyGreen, alpha: 0.9 })
      g.circle(lilyX, lilyY, lilySize)
      g.fill()
      
      // Lily pad notch
      g.fill({ color: shallowWater, alpha: 1 })
      g.beginPath()
      g.moveTo(lilyX, lilyY)
      g.lineTo(lilyX + lilySize, lilyY - lilySize * 0.3)
      g.lineTo(lilyX + lilySize, lilyY + lilySize * 0.3)
      g.closePath()
      g.fill()
      
      // Flower on some
      if (rng.next() > 0.5) {
        const flowerColor = rng.next() > 0.6 ? flowerWhite : flowerPink
        g.fill({ color: flowerColor, alpha: 0.95 })
        g.circle(lilyX - lilySize * 0.3, lilyY, 3 + rng.next() * 2)
        g.fill()
        // Flower center
        g.fill({ color: hexStringToNumber('#ffdd66'), alpha: 0.9 })
        g.circle(lilyX - lilySize * 0.3, lilyY, 1.5)
        g.fill()
      }
    }
  }
  
  // ===== LAYER 7: Subtle light reflections =====
  const reflectionColor = 0xffffff
  for (let i = 0; i < 5; i++) {
    const refX = cx + rng.nextFloat(-lakeW * 0.25, lakeW * 0.25)
    const refY = cy + rng.nextFloat(-lakeH * 0.25, -lakeH * 0.05)
    g.fill({ color: reflectionColor, alpha: 0.08 + rng.next() * 0.06 })
    g.ellipse(refX, refY, 20 + rng.next() * 40, 8 + rng.next() * 15)
    g.fill()
  }
}

function renderBeach(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const sandColor = hexStringToNumber(config.primaryColor || '#d4b896')
  const waterColor = hexStringToNumber(config.secondaryColor || '#4090c0')
  const lightSand = hexStringToNumber(config.accentColor || '#e8d8b8')
  const wetSand = hexStringToNumber(config.shadowColor || '#a08060')
  
  // Water (top portion)
  g.fill({ color: waterColor, alpha: 1 })
  g.rect(0, 0, w, h * 0.4)
  g.fill()
  
  // Waves/foam line
  const waveY = h * 0.38
  g.fill({ color: 0xffffff, alpha: 0.7 })
  for (let x = 0; x < w; x += 3) {
    const wy = waveY + noise.noise2D(x * 0.03, 0) * 15
    g.ellipse(x, wy, 8, 3)
    g.fill()
  }
  
  // Wet sand
  g.fill({ color: wetSand, alpha: 1 })
  g.beginPath()
  g.moveTo(0, h * 0.4)
  for (let x = 0; x <= w; x += 10) {
    const wy = h * 0.4 + noise.noise2D(x * 0.02, 0) * 10
    g.lineTo(x, wy)
  }
  g.lineTo(w, h * 0.55)
  g.lineTo(0, h * 0.55)
  g.closePath()
  g.fill()
  
  // Dry sand
  g.fill({ color: sandColor, alpha: 1 })
  g.rect(0, h * 0.5, w, h * 0.5)
  g.fill()
  
  // Sand texture
  for (let i = 0; i < 200; i++) {
    const sx = rng.next() * w
    const sy = h * 0.45 + rng.next() * h * 0.55
    g.fill({ color: rng.next() > 0.5 ? lightSand : wetSand, alpha: 0.4 })
    g.circle(sx, sy, 1 + rng.next() * 2)
    g.fill()
  }
  
  // Shells and debris
  for (let i = 0; i < 15; i++) {
    const sx = rng.next() * w
    const sy = h * 0.5 + rng.next() * h * 0.3
    g.fill({ color: rng.next() > 0.5 ? 0xf0e0d0 : 0xc0a080, alpha: 0.8 })
    g.ellipse(sx, sy, 3 + rng.next() * 3, 2 + rng.next() * 2)
    g.fill()
  }
}

function renderDesert(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const sandColor = hexStringToNumber(config.primaryColor || '#d4a860')
  const darkSand = hexStringToNumber(config.secondaryColor || '#c49040')
  const lightSand = hexStringToNumber(config.accentColor || '#e8c880')
  const shadowColor = hexStringToNumber(config.shadowColor || '#8a6030')
  
  // Base sand
  g.fill({ color: sandColor, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Sand dunes using noise
  const numDunes = 4 + Math.floor((config.complexity || 0.5) * 4)
  for (let d = 0; d < numDunes; d++) {
    const duneX = rng.next() * w
    const duneY = rng.next() * h
    const duneW = w * rng.nextFloat(0.3, 0.6)
    const duneH = h * rng.nextFloat(0.15, 0.3)
    
    // Dune shadow side
    g.fill({ color: shadowColor, alpha: 0.6 })
    g.ellipse(duneX + duneW * 0.1, duneY, duneW * 0.5, duneH)
    g.fill()
    
    // Dune light side
    g.fill({ color: lightSand, alpha: 0.8 })
    g.ellipse(duneX - duneW * 0.1, duneY - duneH * 0.2, duneW * 0.45, duneH * 0.8)
    g.fill()
  }
  
  // Wind ripples
  g.setStrokeStyle({ width: 0.5, color: darkSand, alpha: 0.3 })
  for (let y = 20; y < h; y += 8 + rng.next() * 8) {
    g.moveTo(0, y)
    for (let x = 0; x < w; x += 5) {
      const ry = y + noise.noise2D(x * 0.05, y * 0.01) * 3
      g.lineTo(x, ry)
    }
    g.stroke()
  }
  
  // Scattered rocks
  for (let i = 0; i < 8; i++) {
    const rx = rng.next() * w
    const ry = rng.next() * h
    g.fill({ color: hexStringToNumber('#8a7060'), alpha: 0.9 })
    g.ellipse(rx, ry, 3 + rng.next() * 5, 2 + rng.next() * 3)
    g.fill()
  }
}

function renderSnow(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const snowColor = hexStringToNumber(config.primaryColor || '#e8f0f8')
  const shadowSnow = hexStringToNumber(config.secondaryColor || '#d0e0f0')
  const brightSnow = hexStringToNumber(config.accentColor || '#f8f8ff')
  const iceColor = hexStringToNumber(config.shadowColor || '#a0b0c0')
  
  // Base snow
  g.fill({ color: snowColor, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Snow drifts and shadows
  for (let y = 0; y < h; y += 6) {
    for (let x = 0; x < w; x += 6) {
      const n = noise.fbm(x * 0.015, y * 0.015, 3)
      if (n < -0.2) {
        g.fill({ color: shadowSnow, alpha: 0.6 })
        g.rect(x, y, 8, 8)
        g.fill()
      } else if (n > 0.3) {
        g.fill({ color: brightSnow, alpha: 0.5 })
        g.rect(x, y, 8, 8)
        g.fill()
      }
    }
  }
  
  // Ice patches
  const numIce = 3 + Math.floor((config.complexity || 0.5) * 5)
  for (let i = 0; i < numIce; i++) {
    const ix = rng.next() * w
    const iy = rng.next() * h
    const iceW = 30 + rng.next() * 50
    const iceH = 20 + rng.next() * 40
    
    g.fill({ color: iceColor, alpha: 0.7 })
    g.ellipse(ix, iy, iceW, iceH)
    g.fill()
    
    // Ice cracks
    g.setStrokeStyle({ width: 0.5, color: 0x8090a0, alpha: 0.5 })
    for (let c = 0; c < 3; c++) {
      g.moveTo(ix - iceW * 0.3 + rng.next() * iceW * 0.6, iy)
      g.lineTo(ix - iceW * 0.3 + rng.next() * iceW * 0.6, iy + rng.nextFloat(-iceH * 0.3, iceH * 0.3))
      g.stroke()
    }
  }
  
  // Snow sparkles
  for (let i = 0; i < 30; i++) {
    const sx = rng.next() * w
    const sy = rng.next() * h
    g.fill({ color: 0xffffff, alpha: 0.8 })
    g.circle(sx, sy, 1)
    g.fill()
  }
}

function renderSwamp(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const murkyGreen = hexStringToNumber(config.primaryColor || '#4a6040')
  const mossColor = hexStringToNumber(config.secondaryColor || '#5a7050')
  const waterColor = hexStringToNumber(config.accentColor || '#3a5030')
  const darkWater = hexStringToNumber(config.shadowColor || '#2a3020')
  
  // Dark water base
  g.fill({ color: darkWater, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Murky patches
  for (let y = 0; y < h; y += 10) {
    for (let x = 0; x < w; x += 10) {
      const n = noise.fbm(x * 0.02, y * 0.02, 2)
      const color = n > 0.2 ? mossColor : n > -0.2 ? murkyGreen : waterColor
      g.fill({ color, alpha: 0.8 })
      g.rect(x, y, 12, 12)
      g.fill()
    }
  }
  
  // Lily pads
  const numPads = 8 + Math.floor((config.complexity || 0.5) * 12)
  for (let i = 0; i < numPads; i++) {
    const px = rng.next() * w
    const py = rng.next() * h
    const padSize = 8 + rng.next() * 12
    
    g.fill({ color: hexStringToNumber('#3a7030'), alpha: 0.9 })
    g.circle(px, py, padSize)
    g.fill()
    
    // Lily pad notch
    g.fill({ color: waterColor, alpha: 1 })
    g.beginPath()
    g.moveTo(px, py)
    g.lineTo(px + padSize, py - padSize * 0.3)
    g.lineTo(px + padSize, py + padSize * 0.3)
    g.closePath()
    g.fill()
    
    // Flower on some
    if (rng.next() > 0.6) {
      g.fill({ color: rng.next() > 0.5 ? 0xffffff : 0xffaaaa, alpha: 0.9 })
      g.circle(px - padSize * 0.3, py, 3)
      g.fill()
    }
  }
  
  // Dead trees/reeds
  for (let i = 0; i < 10; i++) {
    const tx = rng.next() * w
    const ty = rng.next() * h
    g.setStrokeStyle({ width: 2, color: hexStringToNumber('#4a4030'), alpha: 0.8 })
    g.moveTo(tx, ty)
    g.lineTo(tx + rng.nextFloat(-5, 5), ty - 15 - rng.next() * 15)
    g.stroke()
  }
}

function renderVolcano(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const rockColor = hexStringToNumber(config.primaryColor || '#3a2a2a')
  const lavaColor = hexStringToNumber(config.secondaryColor || '#ff4400')
  const hotLava = hexStringToNumber(config.accentColor || '#ffaa00')
  const ashColor = hexStringToNumber(config.shadowColor || '#1a0a0a')
  
  // Dark volcanic rock base
  g.fill({ color: rockColor, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Rock texture variation
  for (let y = 0; y < h; y += 8) {
    for (let x = 0; x < w; x += 8) {
      const n = noise.fbm(x * 0.03, y * 0.03, 2)
      if (n > 0.2) {
        g.fill({ color: ashColor, alpha: 0.5 })
        g.rect(x, y, 10, 10)
        g.fill()
      }
    }
  }
  
  // Lava cracks/rivers
  g.setStrokeStyle({ width: 4, color: lavaColor, alpha: 1 })
  const numCracks = 3 + Math.floor((config.complexity || 0.5) * 4)
  for (let c = 0; c < numCracks; c++) {
    let cx = rng.next() * w
    let cy = rng.next() * h
    g.moveTo(cx, cy)
    
    for (let s = 0; s < 8; s++) {
      cx += rng.nextFloat(-30, 30)
      cy += rng.nextFloat(-30, 30)
      cx = Math.max(0, Math.min(w, cx))
      cy = Math.max(0, Math.min(h, cy))
      g.lineTo(cx, cy)
    }
    g.stroke()
    
    // Hot glow
    g.setStrokeStyle({ width: 2, color: hotLava, alpha: 0.8 })
    g.stroke()
    g.setStrokeStyle({ width: 4, color: lavaColor, alpha: 1 })
  }
  
  // Lava pools
  for (let i = 0; i < 4; i++) {
    const px = rng.next() * w
    const py = rng.next() * h
    const poolSize = 15 + rng.next() * 25
    
    g.fill({ color: lavaColor, alpha: 1 })
    g.ellipse(px, py, poolSize, poolSize * 0.7)
    g.fill()
    
    g.fill({ color: hotLava, alpha: 0.8 })
    g.ellipse(px, py, poolSize * 0.5, poolSize * 0.35)
    g.fill()
  }
  
  // Smoke/steam wisps (circles)
  for (let i = 0; i < 8; i++) {
    const sx = rng.next() * w
    const sy = rng.next() * h
    g.fill({ color: 0x555555, alpha: 0.3 })
    g.circle(sx, sy, 10 + rng.next() * 15)
    g.fill()
  }
}

function renderCanyon(g: PIXI.Graphics, w: number, h: number, config: TerrainConfig, rng: SeededRandom, noise: SimplexNoise): void {
  const rockColor = hexStringToNumber(config.primaryColor || '#9a6a4a')
  const shadowColor = hexStringToNumber(config.secondaryColor || '#7a5030')
  const highlightColor = hexStringToNumber(config.accentColor || '#ba8a6a')
  const deepShadow = hexStringToNumber(config.shadowColor || '#4a3020')
  
  // Top surface
  g.fill({ color: rockColor, alpha: 1 })
  g.rect(0, 0, w, h)
  g.fill()
  
  // Canyon cut through middle (diagonal or winding)
  const canyonWidth = w * rng.nextFloat(0.25, 0.4)
  const canyonPoints: { x: number; y: number }[] = []
  
  // Generate canyon path
  let cx = w * rng.nextFloat(0.3, 0.5)
  for (let y = -20; y <= h + 20; y += 20) {
    cx += noise.noise2D(y * 0.02, 0) * 30
    cx = Math.max(canyonWidth, Math.min(w - canyonWidth, cx))
    canyonPoints.push({ x: cx, y })
  }
  
  // Canyon shadow (deep)
  g.fill({ color: deepShadow, alpha: 1 })
  g.beginPath()
  g.moveTo(canyonPoints[0].x - canyonWidth / 2, canyonPoints[0].y)
  for (const p of canyonPoints) {
    g.lineTo(p.x - canyonWidth / 2, p.y)
  }
  for (let i = canyonPoints.length - 1; i >= 0; i--) {
    g.lineTo(canyonPoints[i].x + canyonWidth / 2, canyonPoints[i].y)
  }
  g.closePath()
  g.fill()
  
  // Canyon walls (layered)
  for (let layer = 0; layer < 4; layer++) {
    const layerOffset = (4 - layer) * canyonWidth * 0.08
    const layerColor = layer < 2 ? shadowColor : highlightColor
    
    g.fill({ color: layerColor, alpha: 0.7 })
    g.beginPath()
    g.moveTo(canyonPoints[0].x - canyonWidth / 2 + layerOffset, canyonPoints[0].y)
    for (const p of canyonPoints) {
      g.lineTo(p.x - canyonWidth / 2 + layerOffset, p.y)
    }
    g.lineTo(canyonPoints[canyonPoints.length - 1].x - canyonWidth / 2 + layerOffset + 5, canyonPoints[canyonPoints.length - 1].y)
    g.lineTo(canyonPoints[0].x - canyonWidth / 2 + layerOffset + 5, canyonPoints[0].y)
    g.closePath()
    g.fill()
  }
  
  // Rock debris at bottom
  for (let i = 0; i < 20; i++) {
    const idx = Math.floor(rng.next() * canyonPoints.length)
    const p = canyonPoints[idx]
    const rx = p.x + rng.nextFloat(-canyonWidth * 0.3, canyonWidth * 0.3)
    const ry = p.y
    
    g.fill({ color: shadowColor, alpha: 0.8 })
    g.ellipse(rx, ry, 3 + rng.next() * 5, 2 + rng.next() * 3)
    g.fill()
  }
  
  // Surface cracks near edge
  g.setStrokeStyle({ width: 1, color: shadowColor, alpha: 0.4 })
  for (let i = 0; i < 15; i++) {
    const idx = Math.floor(rng.next() * canyonPoints.length)
    const p = canyonPoints[idx]
    const side = rng.next() > 0.5 ? 1 : -1
    const sx = p.x + side * (canyonWidth / 2 + 5 + rng.next() * 20)
    
    g.moveTo(sx, p.y - 5)
    g.lineTo(sx + rng.nextFloat(-10, 10), p.y + 10 + rng.next() * 15)
    g.stroke()
  }
}

// =====================================================
// RESOLUTION SETTINGS
// =====================================================

const RESOLUTION_MAP: Record<string, number> = {
  low: 512,
  medium: 768,
  high: 1024,
  ultra: 1536,
}

function getGenerationSize(config: TerrainConfig): number {
  return RESOLUTION_MAP[config.resolution || 'medium'] || 768
}

// =====================================================
// MAIN GENERATION
// =====================================================

async function generateTerrain(shouldSave = true): Promise<void> {
  if (isGenerating.value) return
  
  isGenerating.value = true
  
  // Give UI time to update
  await new Promise(resolve => setTimeout(resolve, 30))
  
  const config = terrainConfig.value
  const GENERATION_SIZE = getGenerationSize(config)
  
  // Create a fresh off-screen canvas each time (PIXI corrupts canvas on destroy)
  const canvas = document.createElement('canvas')
  canvas.width = GENERATION_SIZE
  canvas.height = GENERATION_SIZE
  
  let app: PIXI.Application | null = null
  
  try {
    app = new PIXI.Application()
    await app.init({
      canvas,
      width: GENERATION_SIZE,
      height: GENERATION_SIZE,
      backgroundAlpha: 0,
      antialias: true,
      resolution: 1,
      autoStart: false, // Don't auto-start the ticker!
    })
    
    const rng = new SeededRandom(config.seed)
    const noise = new SimplexNoise(config.seed)
    
    const graphics = new PIXI.Graphics()
    app.stage.addChild(graphics)
    
    switch (config.terrainType) {
      case 'cave':
        renderCave(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'dungeon':
      case 'ruins':
        renderDungeon(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'building':
        renderBuilding(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'house':
        renderBuildingExterior(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'treeSingle':
        renderTree(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng)
        break
      case 'treeCluster':
        renderTreeCluster(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng)
        break
      case 'bush':
        renderBush(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng)
        break
      case 'rocks':
      case 'cliff':
        renderRocks(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng)
        break
      case 'river':
      case 'path':
        renderPath(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'campsite':
        renderCampsite(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      // Ground terrains
      case 'mountains':
        renderMountains(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'grassland':
        renderGrassland(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'ocean':
        renderOcean(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'lake':
        renderLake(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'beach':
        renderBeach(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'desert':
        renderDesert(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'snow':
        renderSnow(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'swamp':
        renderSwamp(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'volcano':
        renderVolcano(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      case 'canyon':
        renderCanyon(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
        break
      default:
        renderCave(graphics, GENERATION_SIZE, GENERATION_SIZE, config, rng, noise)
    }
    
    // Render once (no ticker)
    app.render()
    
    // Extract image BEFORE destroying PIXI
    const dataUrl = canvas.toDataURL('image/png')
    
    // Destroy PIXI first
    app.stop()
    app.destroy(true, { children: true, texture: true, textureSource: true })
    app = null
    
    // Then update state
    generatedImageUrl.value = dataUrl
    
    // Only emit for saving if shouldSave is true (initial generation)
    if (shouldSave) {
      emit('update:generatedImage', dataUrl)
    }
    
  } catch (error) {
    console.error('[TerrainNodeDisplay] Generation error:', error)
    // Clean up on error
    if (app) {
      try {
        app.stop()
        app.destroy(true, { children: true, texture: true, textureSource: true })
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  } finally {
    isGenerating.value = false
  }
}

// =====================================================
// LIFECYCLE
// =====================================================

function handleRegenerateEvent(event: Event) {
  const customEvent = event as CustomEvent<{ itemId: string }>
  if (customEvent.detail.itemId === props.item.id) {
    // Don't emit update on regeneration - just update local image
    generateTerrain(false)
  }
}

onMounted(() => {
  window.addEventListener('terrain-regenerate', handleRegenerateEvent)
  
  if (storedImageUrl.value) {
    generatedImageUrl.value = storedImageUrl.value
  } else {
    generateTerrain()
  }
})

onUnmounted(() => {
  window.removeEventListener('terrain-regenerate', handleRegenerateEvent)
})

defineExpose({
  regenerate: generateTerrain,
})
</script>

<style scoped>
.terrain-node-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}

.terrain-image {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
}

.generating-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}

.generating-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.terrain-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 115, 85, 0.2);
  color: rgba(255, 255, 255, 0.4);
}
</style>

 