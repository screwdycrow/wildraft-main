// SVG Terrain Generators
// Pure SVG generation for procedural terrains - clean, simple vector shapes

import type { TerrainConfig } from '@/types/dmScreen.types'

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
}

// =====================================================
// SIMPLEX NOISE (for organic shapes)
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
  
  fbm(x: number, y: number, octaves = 3, lacunarity = 2, persistence = 0.5): number {
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
// HELPER FUNCTIONS
// =====================================================

function generateBlobShape(cx: number, cy: number, radiusX: number, radiusY: number, points: number, noise: SimplexNoise, variation: number): string {
  const pts: number[] = []
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const nv = noise.fbm(Math.cos(angle) * 2, Math.sin(angle) * 2, 2) * variation
    const rx = radiusX * (1 + nv)
    const ry = radiusY * (1 + nv)
    pts.push(cx + Math.cos(angle) * rx)
    pts.push(cy + Math.sin(angle) * ry)
  }
  return pts.map(p => p.toFixed(1)).join(',')
}

// =====================================================
// CAVE GENERATION (Simple)
// =====================================================

export function generateCaveSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  const gridSize = 20 + Math.floor((config.complexity || 0.5) * 15)
  const fillDensity = config.fillDensity ?? 0.45
  const iterations = config.smoothIterations ?? 3
  
  // Generate simple cave grid
  let grid: boolean[][] = []
  for (let y = 0; y < gridSize; y++) {
    grid[y] = []
    for (let x = 0; x < gridSize; x++) {
      if (x === 0 || y === 0 || x === gridSize - 1 || y === gridSize - 1) {
        grid[y][x] = true
      } else {
        grid[y][x] = rng.next() < fillDensity
      }
    }
  }
  
  // Simple smoothing
  for (let iter = 0; iter < iterations; iter++) {
    const newGrid: boolean[][] = []
    for (let y = 0; y < gridSize; y++) {
      newGrid[y] = []
      for (let x = 0; x < gridSize; x++) {
        let neighbors = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx, ny = y + dy
            if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize || grid[ny][nx]) neighbors++
          }
        }
        newGrid[y][x] = grid[y][x] ? neighbors >= 4 : neighbors >= 5
      }
    }
    grid = newGrid
  }
  
  const cellW = w / gridSize
  const cellH = h / gridSize
  const floorColor = config.secondaryColor || '#4a3d3a'
  const outlineColor = config.outlineColor || '#1a1512'
  const outlineWidth = config.outlineWidth || 2
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Draw floor tiles
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!grid[y][x]) {
        const px = x * cellW
        const py = y * cellH
        svg += `<rect x="${px}" y="${py}" width="${cellW}" height="${cellH}" fill="${floorColor}"/>`
        
        // Subtle texture dots
        if (rng.next() > 0.9) {
          const shadowColor = config.shadowColor || '#2d2420'
          svg += `<circle cx="${px + cellW / 2}" cy="${py + cellH / 2}" r="${cellW * 0.2}" fill="${shadowColor}" opacity="0.3"/>`
        }
      }
    }
  }
  
  // Draw wall outlines
  if (config.hasOutline !== false) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (!grid[y][x]) {
          const px = x * cellW
          const py = y * cellH
          if (y === 0 || grid[y - 1][x]) {
            svg += `<line x1="${px}" y1="${py}" x2="${px + cellW}" y2="${py}" stroke="${outlineColor}" stroke-width="${outlineWidth}" stroke-linecap="round"/>`
          }
          if (y === gridSize - 1 || grid[y + 1][x]) {
            svg += `<line x1="${px}" y1="${py + cellH}" x2="${px + cellW}" y2="${py + cellH}" stroke="${outlineColor}" stroke-width="${outlineWidth}" stroke-linecap="round"/>`
          }
          if (x === 0 || grid[y][x - 1]) {
            svg += `<line x1="${px}" y1="${py}" x2="${px}" y2="${py + cellH}" stroke="${outlineColor}" stroke-width="${outlineWidth}" stroke-linecap="round"/>`
          }
          if (x === gridSize - 1 || grid[y][x + 1]) {
            svg += `<line x1="${px + cellW}" y1="${py}" x2="${px + cellW}" y2="${py + cellH}" stroke="${outlineColor}" stroke-width="${outlineWidth}" stroke-linecap="round"/>`
          }
        }
      }
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// DUNGEON GENERATION (Simple BSP)
// =====================================================

export function generateDungeonSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const gridSize = 30 + Math.floor((config.complexity || 0.5) * 20)
  const minRoomSize = 5
  const maxDepth = 3 + Math.floor((config.complexity || 0.5) * 2)
  
  interface Room { x: number; y: number; w: number; h: number }
  interface BSPNode {
    x: number; y: number; w: number; h: number
    left?: BSPNode; right?: BSPNode
    room?: Room
  }
  
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
  
  function createRooms(node: BSPNode): void {
    if (node.left && node.right) {
      createRooms(node.left)
      createRooms(node.right)
    } else {
      const padding = 1
      const roomW = rng.nextInt(minRoomSize, node.w - padding * 2)
      const roomH = rng.nextInt(minRoomSize, node.h - padding * 2)
      const roomX = node.x + rng.nextInt(padding, node.w - roomW - padding)
      const roomY = node.y + rng.nextInt(padding, node.h - roomH - padding)
      node.room = { x: roomX, y: roomY, w: roomW, h: roomH }
    }
  }
  
  function getRoom(node: BSPNode): Room | undefined {
    if (node.room) return node.room
    if (node.left) {
      const leftRoom = getRoom(node.left)
      if (leftRoom) return leftRoom
    }
    if (node.right) return getRoom(node.right)
    return undefined
  }
  
  function connectRooms(node: BSPNode, corridors: { x1: number; y1: number; x2: number; y2: number; width: number }[]): void {
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
  
  function collectRooms(node: BSPNode, rooms: Room[]): void {
    if (node.room) rooms.push(node.room)
    if (node.left) collectRooms(node.left, rooms)
    if (node.right) collectRooms(node.right, rooms)
  }
  
  const root: BSPNode = { x: 0, y: 0, w: gridSize, h: gridSize }
  splitNode(root, 0)
  createRooms(root)
  
  const rooms: Room[] = []
  const corridors: { x1: number; y1: number; x2: number; y2: number; width: number }[] = []
  collectRooms(root, rooms)
  connectRooms(root, corridors)
  
  const cellW = w / gridSize
  const cellH = h / gridSize
  const floorColor = config.secondaryColor || '#5a5550'
  const wallColor = config.outlineColor || '#2a2520'
  const wallWidth = (config.wallThickness || 2) * 2
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Draw corridor floors
  for (const corridor of corridors) {
    const x1 = corridor.x1 * cellW
    const y1 = corridor.y1 * cellH
    const x2 = corridor.x2 * cellW
    const y2 = corridor.y2 * cellH
    const cw = corridor.width * cellW
    
    if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
      const minX = Math.min(x1, x2) - cw / 2
      const maxX = Math.max(x1, x2) + cw / 2
      svg += `<rect x="${minX}" y="${y1 - cw / 2}" width="${maxX - minX}" height="${cw}" fill="${floorColor}"/>`
    } else {
      const minY = Math.min(y1, y2) - cw / 2
      const maxY = Math.max(y1, y2) + cw / 2
      svg += `<rect x="${x1 - cw / 2}" y="${minY}" width="${cw}" height="${maxY - minY}" fill="${floorColor}"/>`
    }
  }
  
  // Draw room floors
  for (const room of rooms) {
    const rx = room.x * cellW
    const ry = room.y * cellH
    const rw = room.w * cellW
    const rh = room.h * cellH
    svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${floorColor}"/>`
    
    // Subtle texture
    if (rng.next() > 0.7) {
      svg += `<circle cx="${rx + rw / 2}" cy="${ry + rh / 2}" r="${Math.min(rw, rh) * 0.15}" fill="${config.shadowColor || '#4a4a4a'}" opacity="0.2"/>`
    }
  }
  
  // Draw walls
  for (const room of rooms) {
    const rx = room.x * cellW
    const ry = room.y * cellH
    const rw = room.w * cellW
    const rh = room.h * cellH
    svg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="${wallColor}" stroke-width="${wallWidth}"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// TREE GENERATION (Optimized with foliage layers)
// =====================================================

export function generateTreeSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) / 2 * 0.88
  const density = config.foliageDensity ?? 0.8
  const complexity = config.complexity ?? 0.5
  
  // Pre-calculate colors
  const shadowColor = config.shadowColor || '#1a3a1a'
  const trunkColor = config.trunkColor || '#5c4033'
  const primaryColor = config.primaryColor
  const secondaryColor = config.secondaryColor || config.primaryColor
  const accentColor = config.accentColor || config.secondaryColor || config.primaryColor
  const highlightColor = config.accentColor || '#8ac080'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Shadow
  if (config.hasShadows !== false) {
    svg += `<ellipse cx="${(cx + maxR * 0.08).toFixed(1)}" cy="${(cy + maxR * 0.1).toFixed(1)}" rx="${(maxR * 0.9).toFixed(1)}" ry="${(maxR * 0.8).toFixed(1)}" fill="${shadowColor}" opacity="0.35"/>`
  }
  
  // Trunk
  if (config.trunkVisible !== false) {
    svg += `<ellipse cx="${cx.toFixed(1)}" cy="${(cy + maxR * 0.25).toFixed(1)}" rx="${(maxR * 0.12).toFixed(1)}" ry="${(maxR * 0.2).toFixed(1)}" fill="${trunkColor}"/>`
  }
  
  // Optimized foliage layers - pre-calculate layer properties
  const layers = 3 + Math.floor(complexity * 3) // Max 6 layers instead of 8
  const layerData: { r: number; numCircles: number; yOffset: number }[] = []
  
  for (let layer = 0; layer < layers; layer++) {
    const layerR = maxR * (0.6 + (1 - layer / layers) * 0.4) // Slightly adjusted range
    const numCircles = Math.floor(3 + density * 4) // Max 7 instead of 10
    const yOffset = -layer * maxR * 0.08
    layerData.push({ r: layerR, numCircles, yOffset })
  }
  
  // Generate all foliage circles
  for (let layer = 0; layer < layers; layer++) {
    const layerInfo = layerData[layer]
    const layerR = layerInfo.r
    const numCircles = layerInfo.numCircles
    const yOffset = layerInfo.yOffset
    const angleStep = (Math.PI * 2) / numCircles
    
    for (let i = 0; i < numCircles; i++) {
      const angle = i * angleStep + rng.next() * 0.5 // Reduced randomness
      const dist = rng.nextFloat(0, layerR * 0.35) // Slightly reduced spread
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist + yOffset
      const r = layerR * rng.nextFloat(0.4, 0.6) // Tighter range
      
      // Optimized color selection
      const colorMix = rng.next()
      const color = colorMix < 0.4 ? primaryColor : colorMix < 0.75 ? secondaryColor : accentColor
      const alpha = 0.85 + rng.next() * 0.15 // Tighter alpha range
      
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="${alpha.toFixed(2)}"/>`
    }
  }
  
  // Optimized highlights - fewer and simpler
  if (config.hasHighlights !== false) {
    const numHighlights = 2 + Math.floor(density * 3) // Max 5 instead of 7
    for (let i = 0; i < numHighlights; i++) {
      const angle = rng.next() * Math.PI - Math.PI / 2
      const dist = rng.nextFloat(0, maxR * 0.45)
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist - maxR * 0.15
      const r = maxR * rng.nextFloat(0.1, 0.16) // Tighter range
      
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${highlightColor}" opacity="0.55"/>`
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// ROCKS GENERATION (Optimized irregular polygons)
// =====================================================

function generateIrregularPolygon(cx: number, cy: number, radius: number, points: number, rng: SeededRandom, irregularity: number): string {
  // Optimized: pre-calculate angles and cache random values
  const step = (Math.PI * 2) / points
  const pts: number[] = []
  const baseRadius = radius * (1 - irregularity)
  const radiusVar = radius * irregularity * 2
  
  for (let i = 0; i < points; i++) {
    const angle = i * step
    const r = baseRadius + rng.next() * radiusVar
    pts.push((cx + Math.cos(angle) * r).toFixed(1))
    pts.push((cy + Math.sin(angle) * r).toFixed(1))
  }
  return pts.join(',')
}

export function generateRocksSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) / 2 * 0.85
  
  // Pre-calculate colors
  const shadowColor = config.shadowColor || '#2a2a2a'
  const baseColor = config.secondaryColor || '#4a4a4a'
  const mainColor = config.primaryColor
  const accentColor = config.accentColor
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Shadow (single optimized polygon)
  const shadowPoints = generateIrregularPolygon(cx + maxR * 0.08, cy + maxR * 0.08, maxR * 0.88, 8, rng, 0.25)
  svg += `<polygon points="${shadowPoints}" fill="${shadowColor}" opacity="0.35"/>`
  
  // Optimized: limit number of rocks and reduce polygon complexity
  const numRocks = 2 + Math.floor((config.complexity || 0.5) * 3) // Max 5 rocks instead of 6
  const angles: number[] = []
  const positions: { x: number; y: number; r: number }[] = []
  
  // Pre-calculate all rock positions
  for (let i = 0; i < numRocks; i++) {
    const angle = (i / numRocks) * Math.PI * 2 + rng.next() * 0.4
    const dist = rng.nextFloat(0, maxR * 0.25)
    positions.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      r: maxR * rng.nextFloat(0.3, 0.55)
    })
  }
  
  // Render rocks (optimized: fewer points per polygon)
  for (const pos of positions) {
    // Base shadow (6 points instead of 7)
    const basePoints = generateIrregularPolygon(pos.x + 1, pos.y + 1, pos.r, 6, rng, 0.2)
    svg += `<polygon points="${basePoints}" fill="${baseColor}"/>`
    
    // Main rock (6 points)
    const mainPoints = generateIrregularPolygon(pos.x - 1, pos.y - 1, pos.r * 0.95, 6, rng, 0.18)
    svg += `<polygon points="${mainPoints}" fill="${mainColor}"/>`
    
    // Highlight (only if accent color exists, 4 points for simplicity)
    if (accentColor) {
      const highlightPoints = generateIrregularPolygon(pos.x - 2, pos.y - 2, pos.r * 0.35, 4, rng, 0.12)
      svg += `<polygon points="${highlightPoints}" fill="${accentColor}" opacity="0.45"/>`
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// CLIFF GENERATION (Angular elevation edge)
// =====================================================

export function generateCliffSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const cliffColor = config.primaryColor || '#785e5e'
  const shadowColor = config.shadowColor || '#4a3a3a'
  const highlightColor = config.accentColor || '#9a7e7e'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Background (lower terrain)
  svg += `<rect width="${w}" height="${h}" fill="${config.secondaryColor || '#5a4a4a'}"/>`
  
  // Generate angular cliff edge (irregular V/boomerang shape)
  const complexity = config.complexity || 0.5
  const numPoints = 8 + Math.floor(complexity * 12) // 8-20 points for angular shape
  const points: { x: number; y: number }[] = []
  
  // Start from left side, create angular path
  const startX = w * 0.1
  const startY = h * 0.6
  const endX = w * 0.9
  const endY = h * 0.4
  
  // Create angular path with sharp turns
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const baseX = startX + (endX - startX) * t
    const baseY = startY + (endY - startY) * t
    
    // Add angular variations using noise and random sharp angles
    const angleOffset = noise.noise2D(t * 4, 0) * h * 0.3
    const sharpAngle = rng.next() > 0.7 ? (rng.next() > 0.5 ? 1 : -1) * h * 0.15 : 0
    
    const x = baseX + rng.nextFloat(-w * 0.05, w * 0.05)
    const y = baseY + angleOffset + sharpAngle
    
    points.push({ x, y })
  }
  
  // Create cliff shape (upper terrain area)
  let cliffPath = `M 0 0 L ${w} 0 L ${w} ${points[0].y}`
  
  // Add angular edge points
  for (const point of points) {
    cliffPath += ` L ${point.x} ${point.y}`
  }
  
  cliffPath += ` L 0 ${points[0].y} Z`
  
  // Upper terrain (above cliff)
  svg += `<path d="${cliffPath}" fill="${cliffColor}"/>`
  
  // Shadow along cliff edge (depth indicator)
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const shadowOffset = 3
    svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${shadowColor}" stroke-width="4" opacity="0.6"/>`
    // Shadow drop
    svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p1.x}" y2="${p1.y + shadowOffset}" stroke="${shadowColor}" stroke-width="2" opacity="0.4"/>`
  }
  
  // Highlight on upper edge (light hitting the top)
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${highlightColor}" stroke-width="1.5" opacity="0.5"/>`
  }
  
  // Add some angular protrusions/outcrops
  const numOutcrops = Math.floor(complexity * 4)
  for (let i = 0; i < numOutcrops; i++) {
    const t = rng.next()
    const idx = Math.floor(t * (points.length - 1))
    const p = points[idx]
    const nextP = points[idx + 1]
    
    // Create angular protrusion
    const angle = Math.atan2(nextP.y - p.y, nextP.x - p.x)
    const perpAngle = angle + Math.PI / 2
    const protrusionLength = rng.nextFloat(5, 15)
    const protrusionX = p.x + Math.cos(perpAngle) * protrusionLength
    const protrusionY = p.y + Math.sin(perpAngle) * protrusionLength
    
    // Sharp angular protrusion
    svg += `<polygon points="${p.x},${p.y} ${protrusionX},${protrusionY} ${nextP.x},${nextP.y}" fill="${cliffColor}" opacity="0.8"/>`
    svg += `<line x1="${p.x}" y1="${p.y}" x2="${protrusionX}" y2="${protrusionY}" stroke="${shadowColor}" stroke-width="2" opacity="0.5"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// LAKE GENERATION (Simple Blob)
// =====================================================

export function generateLakeSVG(w: number, h: number, config: TerrainConfig): string {
  const noise = new SimplexNoise(config.seed)
  const cx = w / 2
  const cy = h / 2
  const lakeW = w * 0.75
  const lakeH = h * 0.65
  
  const deepWater = config.shadowColor || '#1a4878'
  const midWater = config.primaryColor || '#2868a8'
  const shallowWater = config.secondaryColor || '#4090c8'
  const shoreColor = config.accentColor || '#6a8a5a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Ground base
  svg += `<rect width="${w}" height="${h}" fill="${shoreColor}"/>`
  
  // Simple blob shape for lake
  const blobPoints = generateBlobShape(cx, cy, lakeW / 2, lakeH / 2, 24, noise, 0.15)
  
  // Deep water
  svg += `<polygon points="${blobPoints}" fill="${deepWater}"/>`
  
  // Mid water (smaller blob)
  const midBlob = generateBlobShape(cx, cy, lakeW / 2 * 0.85, lakeH / 2 * 0.85, 20, noise, 0.1)
  svg += `<polygon points="${midBlob}" fill="${midWater}" opacity="0.8"/>`
  
  // Shallow water (even smaller)
  const shallowBlob = generateBlobShape(cx, cy, lakeW / 2 * 0.7, lakeH / 2 * 0.7, 16, noise, 0.08)
  svg += `<polygon points="${shallowBlob}" fill="${shallowWater}" opacity="0.6"/>`
  
  // Subtle texture - small circles
  const rng = new SeededRandom(config.seed)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const dist = rng.nextFloat(0.3, 0.6) * Math.min(lakeW, lakeH) / 2
    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist
    svg += `<circle cx="${x}" cy="${y}" r="${rng.nextFloat(3, 8)}" fill="${shallowWater}" opacity="0.2"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// GRASSLAND GENERATION (Simple Clean Shapes)
// =====================================================

export function generateGrasslandSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const baseColor = config.primaryColor || '#3d7a40'
  const lightColor = config.secondaryColor || '#5aa050'
  const darkColor = config.accentColor || '#2d5a30'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Base ground - simple gradient patches
  for (let y = 0; y < h; y += 8) {
    for (let x = 0; x < w; x += 8) {
      const n = noise.fbm(x * 0.02, y * 0.02, 2) * 0.5 + 0.5
      let color: string
      if (n > 0.6) color = lightColor
      else if (n < 0.4) color = darkColor
      else color = baseColor
      
      svg += `<rect x="${x}" y="${y}" width="9" height="9" fill="${color}"/>`
    }
  }
  
  // Simple grass blades - just lines
  const numBlades = 30 + Math.floor((config.grassDensity || 0.5) * 40)
  for (let i = 0; i < numBlades; i++) {
    const bx = rng.next() * w
    const by = rng.next() * h
    const height = 8 + rng.next() * 12
    const lean = rng.nextFloat(-2, 2)
    
    const colorRoll = rng.next()
    const bladeColor = colorRoll > 0.6 ? lightColor : colorRoll > 0.3 ? baseColor : darkColor
    
    svg += `<line x1="${bx}" y1="${by}" x2="${bx + lean}" y2="${by - height}" stroke="${bladeColor}" stroke-width="${1 + rng.next() * 1.5}" stroke-linecap="round" opacity="0.7"/>`
  }
  
  // Simple flowers - just circles
  if (config.hasFlowers !== false) {
    const numFlowers = 5 + Math.floor((config.flowerDensity || 0.3) * 15)
    const flowerColors = ['#ffff66', '#ffffff', '#ff6699', '#9966ff']
    
    for (let i = 0; i < numFlowers; i++) {
      const fx = rng.next() * w
      const fy = rng.next() * h
      const flowerSize = 2 + rng.next() * 3
      const flowerColor = flowerColors[rng.nextInt(0, flowerColors.length - 1)]
      
      svg += `<circle cx="${fx}" cy="${fy}" r="${flowerSize}" fill="${flowerColor}" opacity="0.9"/>`
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// OCEAN GENERATION (With Remote Islands)
// =====================================================

export function generateOceanSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const deepWater = config.shadowColor || '#103060'
  const midWater = config.primaryColor || '#2060a0'
  const shallowWater = config.secondaryColor || '#4080c0'
  const sandColor = config.accentColor || '#c4b090'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Deep water base
  svg += `<rect width="${w}" height="${h}" fill="${deepWater}"/>`
  
  // Water variation
  for (let y = 0; y < h; y += 12) {
    for (let x = 0; x < w; x += 12) {
      const n = noise.fbm(x * 0.015, y * 0.015, 2)
      if (n > 0) {
        svg += `<rect x="${x}" y="${y}" width="13" height="13" fill="${midWater}" opacity="${n * 0.4}"/>`
      }
    }
  }
  
  // Remote islands
  const numIslands = 2 + Math.floor((config.complexity || 0.5) * 3)
  for (let i = 0; i < numIslands; i++) {
    const islandX = w * rng.nextFloat(0.15, 0.85)
    const islandY = h * rng.nextFloat(0.15, 0.85)
    const islandSize = Math.min(w, h) * rng.nextFloat(0.08, 0.18)
    
    // Sandy beach
    const beachBlob = generateBlobShape(islandX, islandY, islandSize, islandSize * 0.9, 16, noise, 0.2)
    svg += `<polygon points="${beachBlob}" fill="${sandColor}"/>`
    
    // Green interior
    const greenBlob = generateBlobShape(islandX, islandY, islandSize * 0.7, islandSize * 0.65, 12, noise, 0.15)
    svg += `<polygon points="${greenBlob}" fill="#4a8050"/>`
    
    // Simple tree on larger islands
    if (islandSize > w * 0.1) {
      const treeX = islandX + rng.nextFloat(-islandSize * 0.2, islandSize * 0.2)
      const treeY = islandY + rng.nextFloat(-islandSize * 0.2, islandSize * 0.2)
      const treeR = islandSize * 0.15
      svg += `<circle cx="${treeX}" cy="${treeY}" r="${treeR}" fill="#2d5030"/>`
    }
  }
  
  // Subtle wave lines
  for (let i = 0; i < 5; i++) {
    const waveY = h * (0.2 + i * 0.15)
    let path = `M 0 ${waveY}`
    for (let x = 0; x <= w; x += 10) {
      const wave = Math.sin(x * 0.02 + i) * 3
      path += ` L ${x} ${waveY + wave}`
    }
    svg += `<path d="${path}" stroke="${shallowWater}" stroke-width="1" fill="none" opacity="0.2"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// BUILDING/HOUSE ROOF GENERATION (Complex Multi-Section)
// =====================================================

export function generateHouseSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const roofType = config.roofType || 'house'
  
  // Route to specific building type generator
  switch (roofType) {
    case 'castle':
      return generateCastleSVG(w, h, config)
    case 'church':
      return generateChurchSVG(w, h, config)
    case 'tower':
      return generateTowerSVG(w, h, config)
    case 'barn':
      return generateBarnSVG(w, h, config)
    case 'pagoda':
      return generatePagodaSVG(w, h, config)
    case 'dome':
      return generateDomeSVG(w, h, config)
    case 'windmill':
      return generateWindmillSVG(w, h, config)
    case 'lighthouse':
      return generateLighthouseSVG(w, h, config)
    case 'temple':
      return generateTempleSVG(w, h, config)
    case 'house':
    default:
      return generateStandardHouseSVG(w, h, config)
  }
}

// =====================================================
// STANDARD HOUSE (Complex Multi-Section)
// =====================================================

function generateStandardHouseSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.08
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const roofDark = config.secondaryColor || '#6b4423'
  const roofLight = config.accentColor || '#8b5533'
  const ridgeColor = config.primaryColor || '#654321'
  const shadowColor = config.shadowColor || '#2a1a0a'
  const wallColor = '#4a3a2a'
  
  // Determine building complexity
  const complexity = config.complexity || 0.5
  const shapeRoll = rng.next()
  
  interface RoofSection {
    x: number
    y: number
    w: number
    h: number
    ridgeDirection: 'horizontal' | 'vertical'
  }
  
  const sections: RoofSection[] = []
  
  // Generate roof sections based on complexity
  if (complexity < 0.3 || shapeRoll < 0.3) {
    // Simple rectangle
    const rw = availW * rng.nextFloat(0.6, 0.9)
    const rh = availH * rng.nextFloat(0.5, 0.8)
    sections.push({
      x: padding + (availW - rw) / 2,
      y: padding + (availH - rh) / 2,
      w: rw,
      h: rh,
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
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Sort sections by Y for proper layering
  sections.sort((a, b) => (a.y + a.h) - (b.y + b.h))
  
  // Render each roof section
  for (const section of sections) {
    const { x, y, w: sw, h: sh, ridgeDirection } = section
    const overhang = Math.min(sw, sh) * 0.06
    
    // Shadow underneath
    svg += `<polygon points="${x + overhang + 6},${y + sh + overhang + 6} ${x + sw + overhang + 6},${y + sh + overhang + 6} ${x + sw + overhang + 6},${y - overhang + 6} ${x + sw + overhang},${y - overhang} ${x + sw + overhang},${y + sh + overhang} ${x - overhang},${y + sh + overhang}" fill="${shadowColor}" opacity="0.5"/>`
    
    if (ridgeDirection === 'horizontal') {
      // Ridge runs left-right, slopes go up-down
      const ridgeY = y + sh / 2
      
      // Top slope (darker - north facing)
      svg += `<polygon points="${x - overhang},${y - overhang} ${x + sw + overhang},${y - overhang} ${x + sw + overhang},${ridgeY} ${x - overhang},${ridgeY}" fill="${roofDark}"/>`
      
      // Bottom slope (lighter - south facing)
      svg += `<polygon points="${x - overhang},${ridgeY} ${x + sw + overhang},${ridgeY} ${x + sw + overhang},${y + sh + overhang} ${x - overhang},${y + sh + overhang}" fill="${roofLight}"/>`
      
      // Roof tile lines (horizontal)
      const tileHeight = sh / 10
      for (let ty = y - overhang + tileHeight; ty < y + sh + overhang; ty += tileHeight) {
        if (Math.abs(ty - ridgeY) > tileHeight * 0.3) {
          svg += `<line x1="${x - overhang}" y1="${ty}" x2="${x + sw + overhang}" y2="${ty}" stroke="${shadowColor}" stroke-width="0.8" opacity="0.35"/>`
        }
      }
      
      // Ridge cap
      svg += `<rect x="${x - overhang - 2}" y="${ridgeY - 4}" width="${sw + overhang * 2 + 4}" height="8" rx="2" fill="${ridgeColor}"/>`
      
      // Ridge texture (tiles)
      const capWidth = (sw + overhang * 2) / 12
      for (let cx = x - overhang; cx < x + sw + overhang; cx += capWidth) {
        svg += `<line x1="${cx}" y1="${ridgeY - 3}" x2="${cx}" y2="${ridgeY + 3}" stroke="${shadowColor}" stroke-width="1" opacity="0.4"/>`
      }
      
    } else {
      // Ridge runs up-down, slopes go left-right
      const ridgeX = x + sw / 2
      
      // Left slope (darker - west facing)
      svg += `<polygon points="${x - overhang},${y - overhang} ${ridgeX},${y - overhang} ${ridgeX},${y + sh + overhang} ${x - overhang},${y + sh + overhang}" fill="${roofDark}"/>`
      
      // Right slope (lighter - east facing)
      svg += `<polygon points="${ridgeX},${y - overhang} ${x + sw + overhang},${y - overhang} ${x + sw + overhang},${y + sh + overhang} ${ridgeX},${y + sh + overhang}" fill="${roofLight}"/>`
      
      // Roof tile lines (horizontal across both slopes)
      const tileHeight = sh / 10
      for (let ty = y - overhang + tileHeight; ty < y + sh + overhang; ty += tileHeight) {
        svg += `<line x1="${x - overhang}" y1="${ty}" x2="${ridgeX - 4}" y2="${ty}" stroke="${shadowColor}" stroke-width="0.8" opacity="0.35"/>`
        svg += `<line x1="${ridgeX + 4}" y1="${ty}" x2="${x + sw + overhang}" y2="${ty}" stroke="${shadowColor}" stroke-width="0.8" opacity="0.35"/>`
      }
      
      // Ridge cap
      svg += `<rect x="${ridgeX - 4}" y="${y - overhang - 2}" width="8" height="${sh + overhang * 2 + 4}" rx="2" fill="${ridgeColor}"/>`
      
      // Ridge texture
      const capHeight = (sh + overhang * 2) / 12
      for (let cy = y - overhang; cy < y + sh + overhang; cy += capHeight) {
        svg += `<line x1="${ridgeX - 3}" y1="${cy}" x2="${ridgeX + 3}" y2="${cy}" stroke="${shadowColor}" stroke-width="1" opacity="0.4"/>`
      }
    }
    
    // Roof outline
    svg += `<rect x="${x - overhang}" y="${y - overhang}" width="${sw + overhang * 2}" height="${sh + overhang * 2}" fill="none" stroke="${shadowColor}" stroke-width="1.5" opacity="0.6"/>`
  }
  
  // Add chimneys on larger sections
  if (rng.next() > 0.3 && sections.length > 0) {
    const sec = sections.reduce((a, b) => a.w * a.h > b.w * b.h ? a : b)
    const chimW = Math.min(sec.w, sec.h) * 0.12
    const chimH = chimW * 1.3
    const chimX = sec.x + sec.w * rng.nextFloat(0.55, 0.8)
    const chimY = sec.y + sec.h * rng.nextFloat(0.2, 0.4)
    
    // Chimney shadow
    svg += `<rect x="${chimX + 2}" y="${chimY + 2}" width="${chimW}" height="${chimH}" fill="${shadowColor}" opacity="0.3"/>`
    
    // Chimney body
    svg += `<rect x="${chimX}" y="${chimY}" width="${chimW}" height="${chimH}" fill="#6a5040"/>`
    
    // Chimney cap
    svg += `<rect x="${chimX - 2}" y="${chimY - 3}" width="${chimW + 4}" height="5" fill="#4a3020"/>`
    
    // Chimney hole
    svg += `<rect x="${chimX + 3}" y="${chimY + 3}" width="${chimW - 6}" height="${chimH - 8}" fill="#1a0a00" opacity="0.8"/>`
    
    // Chimney outline
    svg += `<rect x="${chimX}" y="${chimY}" width="${chimW}" height="${chimH}" fill="none" stroke="${shadowColor}" stroke-width="1" opacity="0.7"/>`
  }
  
  // Add dormers (small roof windows) on larger sections
  if (complexity > 0.5 && rng.next() > 0.5) {
    const sec = sections[0] // Main section
    if (sec.w > w * 0.4 && sec.h > h * 0.4) {
      const dormerW = sec.w * 0.15
      const dormerH = sec.h * 0.12
      const dormerX = sec.x + sec.w * rng.nextFloat(0.3, 0.7)
      const dormerY = sec.y + sec.h * 0.15
      
      // Dormer roof (small triangle)
      svg += `<polygon points="${dormerX},${dormerY} ${dormerX + dormerW},${dormerY} ${dormerX + dormerW / 2},${dormerY - dormerH * 0.6}" fill="${roofDark}"/>`
      
      // Dormer wall
      svg += `<rect x="${dormerX}" y="${dormerY}" width="${dormerW}" height="${dormerH}" fill="${wallColor}"/>`
      
      // Dormer window
      svg += `<rect x="${dormerX + dormerW * 0.2}" y="${dormerY + dormerH * 0.2}" width="${dormerW * 0.6}" height="${dormerH * 0.5}" fill="#87ceeb" opacity="0.6"/>`
      svg += `<rect x="${dormerX + dormerW * 0.2}" y="${dormerY + dormerH * 0.2}" width="${dormerW * 0.6}" height="${dormerH * 0.5}" fill="none" stroke="#4a3a2a" stroke-width="1"/>`
      
      // Dormer outline
      svg += `<polygon points="${dormerX},${dormerY} ${dormerX + dormerW},${dormerY} ${dormerX + dormerW / 2},${dormerY - dormerH * 0.6}" fill="none" stroke="${shadowColor}" stroke-width="1" opacity="0.6"/>`
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// LANDMARK BUILDING GENERATORS
// =====================================================

function generateCastleSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.1
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#6a5a4a'
  const roofColor = config.secondaryColor || '#4a3a2a'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Main keep (center) - top-down view
  const keepW = availW * 0.4
  const keepH = availH * 0.5
  const keepX = padding + (availW - keepW) / 2
  const keepY = padding + (availH - keepH) / 2
  
  // Keep roof (top-down: rectangular with gabled roof showing as split)
  const ridgeX = keepX + keepW / 2
  svg += `<rect x="${keepX}" y="${keepY}" width="${keepW}" height="${keepH}" fill="${roofColor}"/>`
  // Ridge line (center split)
  svg += `<line x1="${ridgeX}" y1="${keepY}" x2="${ridgeX}" y2="${keepY + keepH}" stroke="${shadowColor}" stroke-width="2" opacity="0.5"/>`
  
  // Battlements on keep (top-down: crenellations around edges)
  const battlementW = keepW / 8
  for (let i = 0; i < 8; i++) {
    const bx = keepX + i * battlementW
    if (i % 2 === 0) {
      svg += `<rect x="${bx}" y="${keepY}" width="${battlementW}" height="${battlementW * 0.3}" fill="${wallColor}"/>`
      svg += `<rect x="${bx}" y="${keepY + keepH - battlementW * 0.3}" width="${battlementW}" height="${battlementW * 0.3}" fill="${wallColor}"/>`
    }
  }
  for (let i = 0; i < 6; i++) {
    const by = keepY + i * (keepH / 6)
    if (i % 2 === 0) {
      svg += `<rect x="${keepX}" y="${by}" width="${battlementW * 0.3}" height="${keepH / 6}" fill="${wallColor}"/>`
      svg += `<rect x="${keepX + keepW - battlementW * 0.3}" y="${by}" width="${battlementW * 0.3}" height="${keepH / 6}" fill="${wallColor}"/>`
    }
  }
  
  // Towers (4 corners) - top-down: circular/octagonal roofs
  const towerSize = Math.min(keepW, keepH) * 0.25
  const towers = [
    { x: padding, y: padding },
    { x: padding + availW - towerSize, y: padding },
    { x: padding, y: padding + availH - towerSize },
    { x: padding + availW - towerSize, y: padding + availH - towerSize }
  ]
  
  for (const tower of towers) {
    const towerCx = tower.x + towerSize / 2
    const towerCy = tower.y + towerSize / 2
    const towerR = towerSize / 2 * 0.8
    // Tower roof (circular from top)
    svg += `<circle cx="${towerCx}" cy="${towerCy}" r="${towerR}" fill="${roofColor}"/>`
    // Tower base outline
    svg += `<rect x="${tower.x}" y="${tower.y}" width="${towerSize}" height="${towerSize}" fill="none" stroke="${wallColor}" stroke-width="2"/>`
    // Battlements (small squares around edge)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      const bx = towerCx + Math.cos(angle) * towerR * 0.7
      const by = towerCy + Math.sin(angle) * towerR * 0.7
      svg += `<rect x="${bx - 3}" y="${by - 3}" width="6" height="6" fill="${wallColor}"/>`
    }
  }
  
  // Connecting walls (top-down: just lines/rectangles)
  const wallThickness = towerSize * 0.15
  svg += `<rect x="${padding}" y="${padding + towerSize}" width="${wallThickness}" height="${availH - towerSize * 2}" fill="${wallColor}"/>`
  svg += `<rect x="${padding + availW - wallThickness}" y="${padding + towerSize}" width="${wallThickness}" height="${availH - towerSize * 2}" fill="${wallColor}"/>`
  svg += `<rect x="${padding + towerSize}" y="${padding}" width="${availW - towerSize * 2}" height="${wallThickness}" fill="${wallColor}"/>`
  svg += `<rect x="${padding + towerSize}" y="${padding + availH - wallThickness}" width="${availW - towerSize * 2}" height="${wallThickness}" fill="${wallColor}"/>`
  
  svg += '</svg>'
  return svg
}

function generateChurchSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.1
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#8a7a6a'
  const roofColor = config.secondaryColor || '#6b4423'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Main nave (rectangular body) - top-down view
  const naveW = availW * 0.6
  const naveH = availH * 0.7
  const naveX = padding + (availW - naveW) / 2
  const naveY = padding + (availH - naveH) / 2
  
  // Nave roof (top-down: rectangular with ridge line)
  svg += `<rect x="${naveX}" y="${naveY}" width="${naveW}" height="${naveH}" fill="${roofColor}"/>`
  const naveRidgeX = naveX + naveW / 2
  svg += `<line x1="${naveRidgeX}" y1="${naveY}" x2="${naveRidgeX}" y2="${naveY + naveH}" stroke="${shadowColor}" stroke-width="2" opacity="0.5"/>`
  
  // Steeple (tower) - top-down: square with circular/octagonal roof
  const steepleW = naveW * 0.3
  const steepleX = naveX + naveW / 2 - steepleW / 2
  const steepleY = naveY + naveH * 0.1
  
  // Steeple roof (circular from top)
  const steepleCx = steepleX + steepleW / 2
  const steepleCy = steepleY + steepleW / 2
  const steepleR = steepleW / 2 * 0.9
  svg += `<circle cx="${steepleCx}" cy="${steepleCy}" r="${steepleR}" fill="${roofColor}"/>`
  svg += `<rect x="${steepleX}" y="${steepleY}" width="${steepleW}" height="${steepleW}" fill="none" stroke="${wallColor}" stroke-width="2"/>`
  
  // Cross on steeple (top-down: just a cross shape)
  svg += `<line x1="${steepleCx}" y1="${steepleCy - steepleR * 0.5}" x2="${steepleCx}" y2="${steepleCy + steepleR * 0.5}" stroke="${wallColor}" stroke-width="3"/>`
  svg += `<line x1="${steepleCx - steepleR * 0.5}" y1="${steepleCy}" x2="${steepleCx + steepleR * 0.5}" y2="${steepleCy}" stroke="${wallColor}" stroke-width="3"/>`
  
  // Windows (stained glass style) - top-down: rectangular openings
  const windowW = naveW * 0.15
  const windowH = naveH * 0.2
  for (let i = 0; i < 2; i++) {
    const wx = naveX + naveW * (0.25 + i * 0.5) - windowW / 2
    const wy = naveY + naveH * 0.3
    svg += `<rect x="${wx}" y="${wy}" width="${windowW}" height="${windowH}" fill="#4a6a8a" opacity="0.6"/>`
    svg += `<rect x="${wx}" y="${wy}" width="${windowW}" height="${windowH}" fill="none" stroke="${wallColor}" stroke-width="2"/>`
    // Cross in window
    svg += `<line x1="${wx + windowW / 2}" y1="${wy}" x2="${wx + windowW / 2}" y2="${wy + windowH}" stroke="${wallColor}" stroke-width="1"/>`
    svg += `<line x1="${wx}" y1="${wy + windowH / 2}" x2="${wx + windowW}" y2="${wy + windowH / 2}" stroke="${wallColor}" stroke-width="1"/>`
  }
  
  svg += '</svg>'
  return svg
}

function generateTowerSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.15
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#7a6a5a'
  const roofColor = config.secondaryColor || '#5a4a3a'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Tower base (circular/octagonal) - top-down view
  const towerR = Math.min(availW, availH) / 2 * 0.7
  const cx = w / 2
  const cy = h / 2
  
  // Draw octagon (tower base)
  const points: string[] = []
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(angle) * towerR
    const y = cy + Math.sin(angle) * towerR
    points.push(`${x},${y}`)
  }
  svg += `<polygon points="${points.join(' ')}" fill="${roofColor}"/>`
  
  // Inner circle (roof center)
  svg += `<circle cx="${cx}" cy="${cy}" r="${towerR * 0.6}" fill="${roofColor}" opacity="0.8"/>`
  
  // Windows (top-down: circular openings)
  const windowR = towerR * 0.12
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const wx = cx + Math.cos(angle) * towerR * 0.6
    const wy = cy + Math.sin(angle) * towerR * 0.6
    svg += `<circle cx="${wx}" cy="${wy}" r="${windowR}" fill="#4a6a8a" opacity="0.7"/>`
    svg += `<circle cx="${wx}" cy="${wy}" r="${windowR}" fill="none" stroke="${wallColor}" stroke-width="2"/>`
  }
  
  // Battlements at top (top-down: small squares around edge)
  const battlementR = towerR * 0.85
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
      const bx = cx + Math.cos(angle) * battlementR
      const by = cy + Math.sin(angle) * battlementR
      svg += `<rect x="${bx - 4}" y="${by - 4}" width="8" height="8" fill="${wallColor}"/>`
    }
  }
  
  // Outer wall outline
  svg += `<polygon points="${points.join(' ')}" fill="none" stroke="${wallColor}" stroke-width="2"/>`
  
  svg += '</svg>'
  return svg
}

function generateBarnSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.1
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#8b6a4a'
  const roofColor = config.secondaryColor || '#6b4423'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Barn body - top-down view
  const barnW = availW * 0.8
  const barnH = availH * 0.6
  const barnX = padding + (availW - barnW) / 2
  const barnY = padding + (availH - barnH) / 2
  
  // Barn roof (top-down: rectangular with ridge line)
  svg += `<rect x="${barnX}" y="${barnY}" width="${barnW}" height="${barnH}" fill="${roofColor}"/>`
  
  // Ridge line (center split for gabled roof)
  const ridgeX = barnX + barnW / 2
  svg += `<line x1="${ridgeX}" y1="${barnY}" x2="${ridgeX}" y2="${barnY + barnH}" stroke="${shadowColor}" stroke-width="2" opacity="0.5"/>`
  
  // Roof lines (boards) - horizontal lines
  for (let i = 1; i < 6; i++) {
    const lineY = barnY + (barnH / 6) * i
    svg += `<line x1="${barnX}" y1="${lineY}" x2="${barnX + barnW}" y2="${lineY}" stroke="${shadowColor}" stroke-width="1" opacity="0.3"/>`
  }
  
  // Barn doors (double doors) - top-down: rectangular openings
  const doorW = barnW * 0.25
  const doorH = barnH * 0.3
  const doorX = barnX + barnW / 2 - doorW
  const doorY = barnY + barnH * 0.7
  svg += `<rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#5a4a3a"/>`
  svg += `<rect x="${doorX + doorW}" y="${doorY}" width="${doorW}" height="${doorH}" fill="#5a4a3a"/>`
  svg += `<line x1="${doorX + doorW}" y1="${doorY}" x2="${doorX + doorW}" y2="${doorY + doorH}" stroke="${shadowColor}" stroke-width="2"/>`
  
  // X pattern on doors
  svg += `<line x1="${doorX}" y1="${doorY}" x2="${doorX + doorW}" y2="${doorY + doorH}" stroke="${shadowColor}" stroke-width="1.5"/>`
  svg += `<line x1="${doorX + doorW * 2}" y1="${doorY}" x2="${doorX + doorW}" y2="${doorY + doorH}" stroke="${shadowColor}" stroke-width="1.5"/>`
  
  svg += '</svg>'
  return svg
}

function generatePagodaSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.1
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#8a6a4a'
  const roofColor = config.secondaryColor || '#6b4423'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  const cx = w / 2
  const cy = h / 2
  const baseW = availW * 0.6
  
  // Multiple tiered levels - top-down: concentric squares/octagons
  const numTiers = 3 + Math.floor((config.complexity || 0.5) * 2)
  for (let tier = 0; tier < numTiers; tier++) {
    const tierSize = baseW * (1 - tier * 0.15)
    const tierX = cx - tierSize / 2
    const tierY = cy - tierSize / 2
    
    // Tier roof (square from top)
    svg += `<rect x="${tierX}" y="${tierY}" width="${tierSize}" height="${tierSize}" fill="${roofColor}" opacity="${1 - tier * 0.1}"/>`
    
    // Tier corners (upturned edges)
    const cornerSize = tierSize * 0.1
    for (let corner = 0; corner < 4; corner++) {
      const cornerX = corner % 2 === 0 ? tierX : tierX + tierSize - cornerSize
      const cornerY = corner < 2 ? tierY : tierY + tierSize - cornerSize
      svg += `<polygon points="${cornerX},${cornerY} ${cornerX + cornerSize},${cornerY} ${cornerX + cornerSize / 2},${cornerY - cornerSize * 0.3}" fill="${roofColor}" opacity="${1 - tier * 0.1}"/>`
    }
  }
  
  // Spire on top (center circle)
  const spireR = baseW * 0.05
  svg += `<circle cx="${cx}" cy="${cy}" r="${spireR}" fill="${roofColor}"/>`
  
  svg += '</svg>'
  return svg
}

function generateDomeSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.05
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  // Variable colors for modular structure
  const baseColor = config.primaryColor || '#9a8a7a'
  const domeColor = config.secondaryColor || '#c4a484'
  const accentColor = config.accentColor || '#d4b494'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  const complexity = config.complexity || 0.5
  const numDomes = 1 + Math.floor(complexity * 3) // 1-4 domes
  
  // Generate modular structure with multiple domes
  const domes: { cx: number; cy: number; r: number; color: string }[] = []
  
  if (numDomes === 1) {
    // Single central dome
    domes.push({ cx: w / 2, cy: h / 2, r: Math.min(availW, availH) / 2 * 0.6, color: domeColor })
  } else {
    // Multiple domes - modular structure
    const gridCols = numDomes <= 2 ? 2 : 3
    const gridRows = Math.ceil(numDomes / gridCols)
    const cellW = availW / gridCols
    const cellH = availH / gridRows
    const domeR = Math.min(cellW, cellH) / 2 * 0.7
    
    const colors = [domeColor, accentColor, baseColor, config.accentColor || '#e4c4a4']
    
    for (let i = 0; i < numDomes; i++) {
      const col = i % gridCols
      const row = Math.floor(i / gridCols)
      const domeCx = padding + cellW * (col + 0.5)
      const domeCy = padding + cellH * (row + 0.5)
      domes.push({ cx: domeCx, cy: domeCy, r: domeR, color: colors[i % colors.length] })
    }
  }
  
  // Draw connecting structure/base
  if (numDomes > 1) {
    // Base structure connecting domes
    const basePoints: string[] = []
    const minX = Math.min(...domes.map(d => d.cx - d.r))
    const maxX = Math.max(...domes.map(d => d.cx + d.r))
    const minY = Math.min(...domes.map(d => d.cy - d.r))
    const maxY = Math.max(...domes.map(d => d.cy + d.r))
    
    const basePadding = Math.min(availW, availH) * 0.1
    basePoints.push(`${minX - basePadding},${minY - basePadding}`)
    basePoints.push(`${maxX + basePadding},${minY - basePadding}`)
    basePoints.push(`${maxX + basePadding},${maxY + basePadding}`)
    basePoints.push(`${minX - basePadding},${maxY + basePadding}`)
    
    svg += `<polygon points="${basePoints.join(' ')}" fill="${baseColor}" opacity="0.8"/>`
  }
  
  // Draw each dome
  for (const dome of domes) {
    // Shadow
    svg += `<circle cx="${dome.cx + 3}" cy="${dome.cy + 3}" r="${dome.r}" fill="${shadowColor}" opacity="0.3"/>`
    
    // Dome base (octagonal or circular)
    if (rng.next() > 0.5) {
      // Octagonal base
      const points: string[] = []
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
        const x = dome.cx + Math.cos(angle) * dome.r * 0.9
        const y = dome.cy + Math.sin(angle) * dome.r * 0.9
        points.push(`${x},${y}`)
      }
      svg += `<polygon points="${points.join(' ')}" fill="${baseColor}"/>`
    } else {
      // Circular base
      svg += `<circle cx="${dome.cx}" cy="${dome.cy}" r="${dome.r * 0.9}" fill="${baseColor}"/>`
    }
    
    // Dome (circular from top)
    svg += `<circle cx="${dome.cx}" cy="${dome.cy}" r="${dome.r}" fill="${dome.color}"/>`
    
    // Dome segments (radial lines)
    const numSegments = 6 + Math.floor(rng.next() * 4)
    for (let i = 0; i < numSegments; i++) {
      const angle = (i / numSegments) * Math.PI * 2
      const x1 = dome.cx + Math.cos(angle) * dome.r * 0.3
      const y1 = dome.cy + Math.sin(angle) * dome.r * 0.3
      const x2 = dome.cx + Math.cos(angle) * dome.r
      const y2 = dome.cy + Math.sin(angle) * dome.r
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${shadowColor}" stroke-width="1" opacity="0.3"/>`
    }
    
    // Dome top ornament (center circle)
    svg += `<circle cx="${dome.cx}" cy="${dome.cy}" r="${dome.r * 0.15}" fill="${dome.color}"/>`
    
    // Columns/pillars around dome (top-down: circles)
    const pillarR = dome.r * 0.08
    const numPillars = 4 + Math.floor(rng.next() * 4)
    for (let i = 0; i < numPillars; i++) {
      const angle = (i / numPillars) * Math.PI * 2
      const px = dome.cx + Math.cos(angle) * dome.r * 0.7
      const py = dome.cy + Math.sin(angle) * dome.r * 0.7
      svg += `<circle cx="${px}" cy="${py}" r="${pillarR}" fill="${baseColor}"/>`
    }
  }
  
  // Connecting corridors/passages between domes (if multiple)
  if (numDomes > 1) {
    for (let i = 0; i < domes.length - 1; i++) {
      const d1 = domes[i]
      const d2 = domes[i + 1]
      const dx = d2.cx - d1.cx
      const dy = d2.cy - d1.cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const corridorW = Math.min(d1.r, d2.r) * 0.3
      
      if (dist < (d1.r + d2.r) * 1.5) {
        // Draw connecting corridor
        const angle = Math.atan2(dy, dx)
        const perpAngle = angle + Math.PI / 2
        const offsetX = Math.cos(perpAngle) * corridorW / 2
        const offsetY = Math.sin(perpAngle) * corridorW / 2
        
        const startX = d1.cx + Math.cos(angle) * d1.r * 0.7
        const startY = d1.cy + Math.sin(angle) * d1.r * 0.7
        const endX = d2.cx - Math.cos(angle) * d2.r * 0.7
        const endY = d2.cy - Math.sin(angle) * d2.r * 0.7
        
        svg += `<polygon points="${startX - offsetX},${startY - offsetY} ${startX + offsetX},${startY + offsetY} ${endX + offsetX},${endY + offsetY} ${endX - offsetX},${endY - offsetY}" fill="${baseColor}" opacity="0.9"/>`
      }
    }
  }
  
  svg += '</svg>'
  return svg
}

function generateWindmillSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.1
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#8a7a6a'
  const roofColor = config.secondaryColor || '#6b4423'
  const bladeColor = config.accentColor || '#4a3a2a'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  const cx = w / 2
  const cy = h / 2
  const baseW = availW * 0.25
  
  // Mill body (circular/octagonal from top)
  const millR = baseW / 2 * 0.8
  
  // Shadow underneath
  svg += `<circle cx="${cx + 4}" cy="${cy + 4}" r="${millR}" fill="${shadowColor}" opacity="0.4"/>`
  
  // Mill body
  svg += `<circle cx="${cx}" cy="${cy}" r="${millR}" fill="${wallColor}"/>`
  
  // Mill roof (circular cap) with shadow
  const roofR = millR * 0.9
  svg += `<circle cx="${cx + 2}" cy="${cy + 2}" r="${roofR}" fill="${shadowColor}" opacity="0.3"/>`
  svg += `<circle cx="${cx}" cy="${cy}" r="${roofR}" fill="${roofColor}"/>`
  
  // Windmill blades (4 blades) - top-down: lines radiating from center
  const bladeLength = availW * 0.35
  const bladeW = bladeLength * 0.1
  const bladeAngle = (config.seed % 360) * Math.PI / 180
  
  for (let i = 0; i < 4; i++) {
    const angle = bladeAngle + (i / 4) * Math.PI * 2
    const bladeX1 = cx + Math.cos(angle) * millR
    const bladeY1 = cy + Math.sin(angle) * millR
    const bladeX2 = cx + Math.cos(angle) * bladeLength
    const bladeY2 = cy + Math.sin(angle) * bladeLength
    
    // Blade shape (rectangle from top)
    const perpAngle = angle + Math.PI / 2
    const offsetX = Math.cos(perpAngle) * bladeW / 2
    const offsetY = Math.sin(perpAngle) * bladeW / 2
    
    // Blade shadow
    svg += `<polygon points="${bladeX1 - offsetX + 2},${bladeY1 - offsetY + 2} ${bladeX1 + offsetX + 2},${bladeY1 + offsetY + 2} ${bladeX2 + offsetX + 2},${bladeY2 + offsetY + 2} ${bladeX2 - offsetX + 2},${bladeY2 - offsetY + 2}" fill="${shadowColor}" opacity="0.3"/>`
    
    // Blade
    svg += `<polygon points="${bladeX1 - offsetX},${bladeY1 - offsetY} ${bladeX1 + offsetX},${bladeY1 + offsetY} ${bladeX2 + offsetX},${bladeY2 + offsetY} ${bladeX2 - offsetX},${bladeY2 - offsetY}" fill="${bladeColor}"/>`
  }
  
  // Window (circular opening)
  const windowR = millR * 0.3
  svg += `<circle cx="${cx}" cy="${cy}" r="${windowR}" fill="#4a6a8a" opacity="0.7"/>`
  svg += `<circle cx="${cx}" cy="${cy}" r="${windowR}" fill="none" stroke="${wallColor}" stroke-width="2"/>`
  
  svg += '</svg>'
  return svg
}

function generateLighthouseSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.15
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#c4a484'
  const roofColor = config.secondaryColor || '#8a6a4a'
  const lightColor = config.accentColor || '#ffff88'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  const cx = w / 2
  const cy = h / 2
  const baseW = availW * 0.3
  
  // Tower (circular from top)
  const towerR = baseW / 2 * 0.8
  svg += `<circle cx="${cx}" cy="${cy}" r="${towerR}" fill="${wallColor}"/>`
  
  // Stripes (lighthouse pattern) - concentric circles
  svg += `<circle cx="${cx}" cy="${cy}" r="${towerR * 0.85}" fill="${roofColor}"/>`
  svg += `<circle cx="${cx}" cy="${cy}" r="${towerR * 0.7}" fill="${wallColor}"/>`
  svg += `<circle cx="${cx}" cy="${cy}" r="${towerR * 0.55}" fill="${roofColor}"/>`
  
  // Light room (top) - circular
  const lightRoomR = towerR * 0.7
  svg += `<circle cx="${cx}" cy="${cy}" r="${lightRoomR}" fill="${wallColor}"/>`
  
  // Light room windows (circular openings)
  const windowR = lightRoomR * 0.2
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const wx = cx + Math.cos(angle) * lightRoomR * 0.6
    const wy = cy + Math.sin(angle) * lightRoomR * 0.6
    svg += `<circle cx="${wx}" cy="${wy}" r="${windowR}" fill="${lightColor}" opacity="0.8"/>`
    svg += `<circle cx="${wx}" cy="${wy}" r="${windowR}" fill="none" stroke="${wallColor}" stroke-width="1"/>`
  }
  
  // Light room roof (dome) - inner circle
  svg += `<circle cx="${cx}" cy="${cy}" r="${lightRoomR * 0.8}" fill="${roofColor}"/>`
  
  // Light beam (optional) - radiating lines
  if (config.hasHighlights !== false) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const x1 = cx + Math.cos(angle) * lightRoomR
      const y1 = cy + Math.sin(angle) * lightRoomR
      const x2 = cx + Math.cos(angle) * lightRoomR * 1.5
      const y2 = cy + Math.sin(angle) * lightRoomR * 1.5
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lightColor}" stroke-width="2" opacity="0.4"/>`
    }
  }
  
  svg += '</svg>'
  return svg
}

function generateTempleSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const padding = w * 0.1
  const availW = w - padding * 2
  const availH = h - padding * 2
  
  const wallColor = config.primaryColor || '#c4a484'
  const roofColor = config.secondaryColor || '#8a6a4a'
  const accentColor = config.accentColor || '#d4b494'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  const cx = w / 2
  const cy = h / 2
  const baseW = availW * 0.7
  
  // Temple base (rectangular) - top-down
  const baseX = cx - baseW / 2
  const baseY = cy - baseW / 2
  
  // Temple roof (rectangular with pediment showing as triangular front)
  svg += `<rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseW}" fill="${roofColor}"/>`
  
  // Pediment (triangular front) - top-down: triangle at front
  const pedimentW = baseW * 0.3
  const pedimentX = cx - pedimentW / 2
  svg += `<polygon points="${pedimentX},${baseY} ${pedimentX + pedimentW},${baseY} ${cx},${baseY - pedimentW * 0.3}" fill="${roofColor}" opacity="0.9"/>`
  
  // Columns (top-down: circles)
  const columnR = baseW * 0.03
  const numColumns = 4
  const columnSpacing = baseW / (numColumns + 1)
  
  for (let i = 0; i < numColumns; i++) {
    const colX = baseX + columnSpacing * (i + 1)
    const colY = baseY + baseW * 0.7
    svg += `<circle cx="${colX}" cy="${colY}" r="${columnR}" fill="${accentColor}"/>`
    // Column capital (larger circle)
    svg += `<circle cx="${colX}" cy="${colY}" r="${columnR * 1.4}" fill="${roofColor}" opacity="0.7"/>`
  }
  
  // Steps (top-down: rectangles at front)
  const stepH = baseW * 0.05
  for (let i = 0; i < 3; i++) {
    const stepW = baseW + i * baseW * 0.05
    const stepX = baseX - (stepW - baseW) / 2
    const stepY = baseY + baseW + i * stepH
    svg += `<rect x="${stepX}" y="${stepY}" width="${stepW}" height="${stepH}" fill="${wallColor}"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// FENCE GENERATOR (Top-down view)
// =====================================================

export function generateFenceSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const fenceColor = config.primaryColor || '#8a6a4a'
  const postColor = config.secondaryColor || '#6a4a3a'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Generate fence pattern (rectangular enclosure or line)
  const complexity = config.complexity || 0.5
  const patternType = rng.next()
  
  if (patternType < 0.5) {
    // Rectangular fence enclosure
    const padding = Math.min(w, h) * 0.15
    const fenceW = w - padding * 2
    const fenceH = h - padding * 2
    const fenceX = padding
    const fenceY = padding
    
    // Posts (corners and along edges)
    const postSize = Math.min(fenceW, fenceH) * 0.04
    const postSpacing = Math.min(fenceW, fenceH) * 0.12
    
    // Top edge
    for (let x = fenceX; x <= fenceX + fenceW; x += postSpacing) {
      svg += `<rect x="${x - postSize / 2}" y="${fenceY - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>`
      if (x < fenceX + fenceW) {
        svg += `<line x1="${x}" y1="${fenceY}" x2="${x + postSpacing}" y2="${fenceY}" stroke="${fenceColor}" stroke-width="2"/>`
      }
    }
    
    // Bottom edge
    for (let x = fenceX; x <= fenceX + fenceW; x += postSpacing) {
      svg += `<rect x="${x - postSize / 2}" y="${fenceY + fenceH - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>`
      if (x < fenceX + fenceW) {
        svg += `<line x1="${x}" y1="${fenceY + fenceH}" x2="${x + postSpacing}" y2="${fenceY + fenceH}" stroke="${fenceColor}" stroke-width="2"/>`
      }
    }
    
    // Left edge
    for (let y = fenceY; y <= fenceY + fenceH; y += postSpacing) {
      svg += `<rect x="${fenceX - postSize / 2}" y="${y - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>`
      if (y < fenceY + fenceH) {
        svg += `<line x1="${fenceX}" y1="${y}" x2="${fenceX}" y2="${y + postSpacing}" stroke="${fenceColor}" stroke-width="2"/>`
      }
    }
    
    // Right edge
    for (let y = fenceY; y <= fenceY + fenceH; y += postSpacing) {
      svg += `<rect x="${fenceX + fenceW - postSize / 2}" y="${y - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>`
      if (y < fenceY + fenceH) {
        svg += `<line x1="${fenceX + fenceW}" y1="${y}" x2="${fenceX + fenceW}" y2="${y + postSpacing}" stroke="${fenceColor}" stroke-width="2"/>`
      }
    }
  } else {
    // Fence line (straight or curved)
    const isCurved = complexity > 0.5
    const startX = w * 0.1
    const startY = h / 2
    const endX = w * 0.9
    const endY = h / 2
    
    const postSize = Math.min(w, h) * 0.04
    const postSpacing = Math.min(w, h) * 0.1
    const numPosts = Math.floor(Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) / postSpacing)
    
    for (let i = 0; i <= numPosts; i++) {
      const t = i / numPosts
      let px: number, py: number
      
      if (isCurved) {
        // Curved fence
        const midX = (startX + endX) / 2
        const midY = (startY + endY) / 2 + (rng.nextFloat(-1, 1) * h * 0.2)
        px = (1 - t) ** 2 * startX + 2 * (1 - t) * t * midX + t ** 2 * endX
        py = (1 - t) ** 2 * startY + 2 * (1 - t) * t * midY + t ** 2 * endY
      } else {
        // Straight fence
        px = startX + (endX - startX) * t
        py = startY + (endY - startY) * t
      }
      
      svg += `<rect x="${px - postSize / 2}" y="${py - postSize / 2}" width="${postSize}" height="${postSize}" fill="${postColor}"/>`
      
      if (i < numPosts) {
        const nextT = (i + 1) / numPosts
        let nextPx: number, nextPy: number
        if (isCurved) {
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2 + (rng.nextFloat(-1, 1) * h * 0.2)
          nextPx = (1 - nextT) ** 2 * startX + 2 * (1 - nextT) * nextT * midX + nextT ** 2 * endX
          nextPy = (1 - nextT) ** 2 * startY + 2 * (1 - nextT) * nextT * midY + nextT ** 2 * endY
        } else {
          nextPx = startX + (endX - startX) * nextT
          nextPy = startY + (endY - startY) * nextT
        }
        svg += `<line x1="${px}" y1="${py}" x2="${nextPx}" y2="${nextPy}" stroke="${fenceColor}" stroke-width="2"/>`
      }
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// TABLE GENERATOR (Top-down view)
// =====================================================

export function generateTableSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const tableColor = config.primaryColor || '#8a6a4a'
  const legColor = config.secondaryColor || '#6a4a3a'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  const cx = w / 2
  const cy = h / 2
  const tableW = Math.min(w, h) * 0.6
  const tableH = Math.min(w, h) * 0.4
  
  // Table shape (round or rectangular)
  const isRound = rng.next() > 0.5
  const tableX = cx - tableW / 2
  const tableY = cy - tableH / 2
  
  if (isRound) {
    // Round table
    const tableR = Math.min(tableW, tableH) / 2
    svg += `<circle cx="${cx}" cy="${cy}" r="${tableR}" fill="${tableColor}"/>`
    svg += `<circle cx="${cx}" cy="${cy}" r="${tableR}" fill="none" stroke="${shadowColor}" stroke-width="2" opacity="0.5"/>`
    
    // Table legs (4 legs)
    const legR = tableR * 0.08
    const legOffset = tableR * 0.6
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2
      const legX = cx + Math.cos(angle) * legOffset
      const legY = cy + Math.sin(angle) * legOffset
      svg += `<circle cx="${legX}" cy="${legY}" r="${legR}" fill="${legColor}"/>`
    }
  } else {
    // Rectangular table
    svg += `<rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="${Math.min(tableW, tableH) * 0.1}" fill="${tableColor}"/>`
    svg += `<rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="${Math.min(tableW, tableH) * 0.1}" fill="none" stroke="${shadowColor}" stroke-width="2" opacity="0.5"/>`
    
    // Table legs (4 corners)
    const legW = tableW * 0.08
    const legH = tableH * 0.08
    const legPositions = [
      { x: tableX + legW, y: tableY + legH },
      { x: tableX + tableW - legW, y: tableY + legH },
      { x: tableX + legW, y: tableY + tableH - legH },
      { x: tableX + tableW - legW, y: tableY + tableH - legH }
    ]
    
    for (const leg of legPositions) {
      svg += `<rect x="${leg.x - legW / 2}" y="${leg.y - legH / 2}" width="${legW}" height="${legH}" fill="${legColor}"/>`
    }
  }
  
  // Optional: Table center decoration or items
  if (config.hasHighlights !== false && rng.next() > 0.5) {
    const decorR = Math.min(tableW, tableH) * 0.15
    svg += `<circle cx="${cx}" cy="${cy}" r="${decorR}" fill="${config.accentColor || '#c4a484'}" opacity="0.4"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// BUSH GENERATOR (Procedural)
// =====================================================

export function generateBushSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const cx = w / 2
  const cy = h / 2
  const maxR = Math.min(w, h) / 2 * 0.8
  const density = config.foliageDensity ?? 0.7
  
  const primaryColor = config.primaryColor || '#4a8050'
  const secondaryColor = config.secondaryColor || '#3a7040'
  const accentColor = config.accentColor || '#5a9050'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Shadow
  if (config.hasShadows !== false) {
    const shadowColor = config.shadowColor || '#1a3a1a'
    svg += `<ellipse cx="${cx + maxR * 0.06}" cy="${cy + maxR * 0.08}" rx="${maxR * 0.85}" ry="${maxR * 0.75}" fill="${shadowColor}" opacity="0.3"/>`
  }
  
  // Multiple overlapping circles for bush shape
  const numClusters = 3 + Math.floor(density * 4)
  for (let cluster = 0; cluster < numClusters; cluster++) {
    const clusterR = maxR * rng.nextFloat(0.4, 0.7)
    const clusterX = cx + rng.nextFloat(-maxR * 0.3, maxR * 0.3)
    const clusterY = cy + rng.nextFloat(-maxR * 0.2, maxR * 0.2)
    
    const numCircles = 2 + Math.floor(density * 3)
    for (let i = 0; i < numCircles; i++) {
      const angle = rng.next() * Math.PI * 2
      const dist = rng.nextFloat(0, clusterR * 0.5)
      const x = clusterX + Math.cos(angle) * dist
      const y = clusterY + Math.sin(angle) * dist
      const r = clusterR * rng.nextFloat(0.3, 0.6)
      
      const colorMix = rng.next()
      const color = colorMix < 0.5 ? primaryColor : colorMix < 0.8 ? secondaryColor : accentColor
      const alpha = 0.75 + rng.next() * 0.25
      
      svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${alpha}"/>`
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// ROAD GENERATOR (Procedural)
// =====================================================

export function generateRoadSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const roadColor = config.primaryColor || '#6a6a5a'
  const lineColor = config.accentColor || '#ffff00'
  const shadowColor = config.shadowColor || '#4a4a3a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Road path (curved or straight)
  const complexity = config.complexity || 0.5
  const isCurved = complexity > 0.3
  
  // Generate road centerline
  const numPoints = 20
  const points: { x: number; y: number }[] = []
  const roadWidth = Math.min(w, h) * (0.15 + complexity * 0.1)
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    let x: number, y: number
    
    if (isCurved) {
      // Curved road using noise
      const baseX = w * 0.1 + (w * 0.8) * t
      const baseY = h / 2
      const offset = noise.noise2D(t * 5, 0) * h * 0.3
      x = baseX
      y = baseY + offset
    } else {
      // Straight road
      x = w * 0.1 + (w * 0.8) * t
      y = h / 2
    }
    
    points.push({ x, y })
  }
  
  // Draw road surface
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    // Calculate perpendicular for road width
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / len) * roadWidth / 2
    const perpY = (dx / len) * roadWidth / 2
    
    // Road segment
    const nextP1 = i < points.length - 2 ? points[i + 1] : p2
    const nextDx = nextP1.x - p2.x
    const nextDy = nextP1.y - p2.y
    const nextLen = Math.sqrt(nextDx * nextDx + nextDy * nextDy)
    const nextPerpX = (-nextDy / nextLen) * roadWidth / 2
    const nextPerpY = (nextDx / nextLen) * roadWidth / 2
    
    svg += `<polygon points="${p1.x + perpX},${p1.y + perpY} ${p2.x + nextPerpX},${p2.y + nextPerpY} ${p2.x - nextPerpX},${p2.y - nextPerpY} ${p1.x - perpX},${p1.y - perpY}" fill="${roadColor}"/>`
  }
  
  // Center line (dashed)
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    if (i % 3 === 0) { // Dashed pattern
      svg += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${lineColor}" stroke-width="2" opacity="0.8"/>`
    }
  }
  
  // Road edges
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / len) * roadWidth / 2
    const perpY = (dx / len) * roadWidth / 2
    
    svg += `<line x1="${p1.x + perpX}" y1="${p1.y + perpY}" x2="${p2.x + perpX}" y2="${p2.y + perpY}" stroke="${shadowColor}" stroke-width="1.5"/>`
    svg += `<line x1="${p1.x - perpX}" y1="${p1.y - perpY}" x2="${p2.x - perpX}" y2="${p2.y - perpY}" stroke="${shadowColor}" stroke-width="1.5"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// DIRT PATH GENERATOR
// =====================================================

export function generateDirtPathSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const pathColor = config.primaryColor || '#8a7a6a'
  const dirtColor = config.secondaryColor || '#6a5a4a'
  const shadowColor = config.shadowColor || '#4a3a2a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Path (winding, organic)
  const numPoints = 25
  const points: { x: number; y: number }[] = []
  const pathWidth = Math.min(w, h) * (0.12 + (config.complexity || 0.5) * 0.08)
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const baseX = w * 0.1 + (w * 0.8) * t
    const baseY = h / 2
    const offset = noise.noise2D(t * 4, 0) * h * 0.25
    points.push({ x: baseX, y: baseY + offset })
  }
  
  // Draw path segments
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / len) * pathWidth / 2
    const perpY = (dx / len) * pathWidth / 2
    
    const nextP1 = i < points.length - 2 ? points[i + 1] : p2
    const nextDx = nextP1.x - p2.x
    const nextDy = nextP1.y - p2.y
    const nextLen = Math.sqrt(nextDx * nextDx + nextDy * nextDy)
    const nextPerpX = (-nextDy / nextLen) * pathWidth / 2
    const nextPerpY = (nextDx / nextLen) * pathWidth / 2
    
    // Path segment with irregular edges
    const irregularity = pathWidth * 0.1
    svg += `<polygon points="${p1.x + perpX + rng.nextFloat(-irregularity, irregularity)},${p1.y + perpY + rng.nextFloat(-irregularity, irregularity)} ${p2.x + nextPerpX + rng.nextFloat(-irregularity, irregularity)},${p2.y + nextPerpY + rng.nextFloat(-irregularity, irregularity)} ${p2.x - nextPerpX + rng.nextFloat(-irregularity, irregularity)},${p2.y - nextPerpY + rng.nextFloat(-irregularity, irregularity)} ${p1.x - perpX + rng.nextFloat(-irregularity, irregularity)},${p1.y - perpY + rng.nextFloat(-irregularity, irregularity)}" fill="${pathColor}"/>`
  }
  
  // Dirt texture (small random spots)
  for (let i = 0; i < 40; i++) {
    const t = rng.next()
    const p = points[Math.floor(t * points.length)]
    const offsetX = rng.nextFloat(-pathWidth / 2, pathWidth / 2)
    const offsetY = rng.nextFloat(-pathWidth / 2, pathWidth / 2)
    const spotR = rng.nextFloat(1, 3)
    svg += `<circle cx="${p.x + offsetX}" cy="${p.y + offsetY}" r="${spotR}" fill="${dirtColor}" opacity="0.6"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// RIVER GENERATOR (Procedural)
// =====================================================

export function generateRiverSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const waterColor = config.primaryColor || '#4080c0'
  const deepWater = config.secondaryColor || '#2060a0'
  const shoreColor = config.accentColor || '#a0b080'
  const shadowColor = config.shadowColor || '#103050'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // River path (winding)
  const numPoints = 30
  const points: { x: number; y: number; width: number }[] = []
  const baseWidth = Math.min(w, h) * (0.15 + (config.complexity || 0.5) * 0.15)
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const baseX = w * 0.05 + (w * 0.9) * t
    const baseY = h / 2
    const offset = noise.noise2D(t * 3, 0) * h * 0.35
    const width = baseWidth * (0.7 + noise.noise2D(t * 2, 1) * 0.3) // Varying width
    points.push({ x: baseX, y: baseY + offset, width })
  }
  
  // Draw river segments
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / len) * p1.width / 2
    const perpY = (dx / len) * p1.width / 2
    
    const nextP1 = i < points.length - 2 ? points[i + 1] : p2
    const nextDx = nextP1.x - p2.x
    const nextDy = nextP1.y - p2.y
    const nextLen = Math.sqrt(nextDx * nextDx + nextDy * nextDy)
    const nextPerpX = (-nextDy / nextLen) * p2.width / 2
    const nextPerpY = (nextDx / nextLen) * p2.width / 2
    
    // River segment
    svg += `<polygon points="${p1.x + perpX},${p1.y + perpY} ${p2.x + nextPerpX},${p2.y + nextPerpY} ${p2.x - nextPerpX},${p2.y - nextPerpY} ${p1.x - perpX},${p1.y - perpY}" fill="${waterColor}"/>`
    
    // Deep water center
    const centerPerpX = (-dy / len) * p1.width / 4
    const centerPerpY = (dx / len) * p1.width / 4
    const centerNextPerpX = (-nextDy / nextLen) * p2.width / 4
    const centerNextPerpY = (nextDx / nextLen) * p2.width / 4
    svg += `<polygon points="${p1.x + centerPerpX},${p1.y + centerPerpY} ${p2.x + centerNextPerpX},${p2.y + centerNextPerpY} ${p2.x - centerNextPerpX},${p2.y - centerNextPerpY} ${p1.x - centerPerpX},${p1.y - centerPerpY}" fill="${deepWater}" opacity="0.6"/>`
  }
  
  // Shore/beach edges
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / len) * p1.width / 2
    const perpY = (dx / len) * p1.width / 2
    
    // Shore line
    svg += `<line x1="${p1.x + perpX}" y1="${p1.y + perpY}" x2="${p2.x + perpX}" y2="${p2.y + perpY}" stroke="${shoreColor}" stroke-width="2"/>`
    svg += `<line x1="${p1.x - perpX}" y1="${p1.y - perpY}" x2="${p2.x - perpX}" y2="${p2.y - perpY}" stroke="${shoreColor}" stroke-width="2"/>`
  }
  
  // Water texture (ripples)
  for (let i = 0; i < 20; i++) {
    const t = rng.next()
    const p = points[Math.floor(t * points.length)]
    const offsetX = rng.nextFloat(-p.width / 3, p.width / 3)
    const offsetY = rng.nextFloat(-p.width / 3, p.width / 3)
    const rippleR = rng.nextFloat(2, 5)
    svg += `<circle cx="${p.x + offsetX}" cy="${p.y + offsetY}" r="${rippleR}" fill="none" stroke="${deepWater}" stroke-width="1" opacity="0.4"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// TREE CLUSTER GENERATOR
// =====================================================

export function generateTreeClusterSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const complexity = config.complexity || 0.5
  const numTrees = 3 + Math.floor(complexity * 4)
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Generate multiple trees
  for (let i = 0; i < numTrees; i++) {
    const treeX = w * rng.nextFloat(0.2, 0.8)
    const treeY = h * rng.nextFloat(0.2, 0.8)
    const treeSize = Math.min(w, h) * rng.nextFloat(0.15, 0.3)
    
    // Create a mini config for this tree
    const treeConfig: TerrainConfig = {
      ...config,
      seed: config.seed + i * 1000,
    }
    
    // Generate tree at offset position
    const treeSVG = generateTreeSVG(treeSize, treeSize, treeConfig)
    // Extract just the inner content (without outer svg tag)
    const innerMatch = treeSVG.match(/<svg[^>]*>(.*)<\/svg>/s)
    if (innerMatch) {
      // Transform coordinates to position
      const transform = `translate(${treeX - treeSize / 2}, ${treeY - treeSize / 2})`
      svg += `<g transform="${transform}">${innerMatch[1]}</g>`
    }
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// PATH GENERATOR (Stone path)
// =====================================================

export function generatePathSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  
  const stoneColor = config.primaryColor || '#8a7a6a'
  const darkStone = config.secondaryColor || '#6a5a4a'
  const shadowColor = config.shadowColor || '#4a3a2a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Path (straighter than dirt path)
  const numPoints = 20
  const points: { x: number; y: number }[] = []
  const pathWidth = Math.min(w, h) * (0.1 + (config.complexity || 0.5) * 0.08)
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints
    const baseX = w * 0.1 + (w * 0.8) * t
    const baseY = h / 2
    const offset = noise.noise2D(t * 2, 0) * h * 0.15 // Less curvy
    points.push({ x: baseX, y: baseY + offset })
  }
  
  // Draw path segments with stone pattern
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = (-dy / len) * pathWidth / 2
    const perpY = (dx / len) * pathWidth / 2
    
    const nextP1 = i < points.length - 2 ? points[i + 1] : p2
    const nextDx = nextP1.x - p2.x
    const nextDy = nextP1.y - p2.y
    const nextLen = Math.sqrt(nextDx * nextDx + nextDy * nextDy)
    const nextPerpX = (-nextDy / nextLen) * pathWidth / 2
    const nextPerpY = (nextDx / nextLen) * pathWidth / 2
    
    // Path segment
    svg += `<polygon points="${p1.x + perpX},${p1.y + perpY} ${p2.x + nextPerpX},${p2.y + nextPerpY} ${p2.x - nextPerpX},${p2.y - nextPerpY} ${p1.x - perpX},${p1.y - perpY}" fill="${stoneColor}"/>`
    
    // Stone pattern (grid lines)
    if (i % 3 === 0) {
      svg += `<line x1="${p1.x + perpX}" y1="${p1.y + perpY}" x2="${p2.x + nextPerpX}" y2="${p2.y + nextPerpY}" stroke="${darkStone}" stroke-width="1" opacity="0.4"/>`
      svg += `<line x1="${p1.x - perpX}" y1="${p1.y - perpY}" x2="${p2.x - nextPerpX}" y2="${p2.y - nextPerpY}" stroke="${darkStone}" stroke-width="1" opacity="0.4"/>`
    }
  }
  
  // Individual stones
  for (let i = 0; i < 30; i++) {
    const t = rng.next()
    const p = points[Math.floor(t * points.length)]
    const offsetX = rng.nextFloat(-pathWidth / 2.5, pathWidth / 2.5)
    const offsetY = rng.nextFloat(-pathWidth / 2.5, pathWidth / 2.5)
    const stoneW = rng.nextFloat(3, 8)
    const stoneH = rng.nextFloat(3, 8)
    svg += `<rect x="${p.x + offsetX - stoneW / 2}" y="${p.y + offsetY - stoneH / 2}" width="${stoneW}" height="${stoneH}" fill="${darkStone}" opacity="0.5" rx="1"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// CAMPSITE GENERATOR
// =====================================================

export function generateCampsiteSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const cx = w / 2
  const cy = h / 2
  
  const groundColor = config.primaryColor || '#6a5a4a'
  const tentColor = config.secondaryColor || '#8a6a4a'
  const fireColor = config.accentColor || '#ff6a00'
  const shadowColor = config.shadowColor || '#2a1a0a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Ground circle
  const groundR = Math.min(w, h) / 2 * 0.7
  svg += `<circle cx="${cx}" cy="${cy}" r="${groundR}" fill="${groundColor}"/>`
  
  // Fire pit (center)
  const fireR = groundR * 0.15
  svg += `<circle cx="${cx}" cy="${cy}" r="${fireR}" fill="${shadowColor}"/>`
  svg += `<circle cx="${cx}" cy="${cy}" r="${fireR * 0.7}" fill="${fireColor}"/>`
  
  // Fire flames
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    const flameX = cx + Math.cos(angle) * fireR * 0.5
    const flameY = cy + Math.sin(angle) * fireR * 0.5 - fireR * 0.3
    const flameH = fireR * rng.nextFloat(0.4, 0.7)
    svg += `<ellipse cx="${flameX}" cy="${flameY}" rx="${fireR * 0.2}" ry="${flameH}" fill="${fireColor}" opacity="0.8"/>`
  }
  
  // Tents (2-3 around the fire)
  const numTents = 2 + Math.floor((config.complexity || 0.5) * 2)
  for (let i = 0; i < numTents; i++) {
    const angle = (i / numTents) * Math.PI * 2 + rng.next() * 0.5
    const tentDist = groundR * 0.5
    const tentX = cx + Math.cos(angle) * tentDist
    const tentY = cy + Math.sin(angle) * tentDist
    const tentW = groundR * 0.25
    const tentH = groundR * 0.3
    
    // Tent (triangle)
    svg += `<polygon points="${tentX},${tentY + tentH} ${tentX - tentW / 2},${tentY} ${tentX + tentW / 2},${tentY}" fill="${tentColor}"/>`
    // Tent opening
    svg += `<line x1="${tentX - tentW / 4}" y1="${tentY + tentH * 0.3}" x2="${tentX + tentW / 4}" y2="${tentY + tentH * 0.3}" stroke="${shadowColor}" stroke-width="2"/>`
    // Tent pole
    svg += `<line x1="${tentX}" y1="${tentY}" x2="${tentX}" y2="${tentY + tentH}" stroke="${shadowColor}" stroke-width="1.5"/>`
  }
  
  // Logs/stones around fire
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + rng.next() * 0.3
    const logDist = fireR * 1.5
    const logX = cx + Math.cos(angle) * logDist
    const logY = cy + Math.sin(angle) * logDist
    const logW = fireR * 0.3
    const logH = fireR * 0.15
    svg += `<ellipse cx="${logX}" cy="${logY}" rx="${logW}" ry="${logH}" fill="${shadowColor}" opacity="0.7"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// OTHER TERRAIN TYPES
// =====================================================

export function generateBeachSVG(w: number, h: number, config: TerrainConfig): string {
  const noise = new SimplexNoise(config.seed)
  const sandColor = config.primaryColor || '#d4b896'
  const waterColor = config.secondaryColor || '#4090c0'
  const wetSand = config.shadowColor || '#a08060'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Water (top)
  svg += `<rect width="${w}" height="${h * 0.4}" fill="${waterColor}"/>`
  
  // Wave line
  const waveY = h * 0.38
  let wavePath = `M 0 ${waveY}`
  for (let x = 0; x <= w; x += 5) {
    const wy = waveY + noise.noise2D(x * 0.03, 0) * 8
    wavePath += ` L ${x} ${wy}`
  }
  wavePath += ` L ${w} ${h * 0.5} L 0 ${h * 0.5} Z`
  svg += `<path d="${wavePath}" fill="${wetSand}"/>`
  
  // Sand
  svg += `<rect x="0" y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="${sandColor}"/>`
  
  // Sand texture dots
  const rng = new SeededRandom(config.seed)
  for (let i = 0; i < 30; i++) {
    const sx = rng.next() * w
    const sy = h * 0.5 + rng.next() * h * 0.5
    svg += `<circle cx="${sx}" cy="${sy}" r="${rng.nextFloat(1, 2)}" fill="${wetSand}" opacity="0.4"/>`
  }
  
  svg += '</svg>'
  return svg
}

export function generateDesertSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  const sandColor = config.primaryColor || '#d4a860'
  const darkSand = config.secondaryColor || '#c49040'
  const shadowColor = config.shadowColor || '#8a6030'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Base sand
  svg += `<rect width="${w}" height="${h}" fill="${sandColor}"/>`
  
  // Simple dunes - ellipses
  const numDunes = 3 + Math.floor((config.complexity || 0.5) * 3)
  for (let i = 0; i < numDunes; i++) {
    const duneX = rng.next() * w
    const duneY = rng.next() * h
    const duneW = w * rng.nextFloat(0.25, 0.5)
    const duneH = h * rng.nextFloat(0.1, 0.2)
    
    // Shadow side
    svg += `<ellipse cx="${duneX + duneW * 0.1}" cy="${duneY}" rx="${duneW * 0.4}" ry="${duneH}" fill="${shadowColor}" opacity="0.5"/>`
    // Light side
    svg += `<ellipse cx="${duneX - duneW * 0.1}" cy="${duneY - duneH * 0.2}" rx="${duneW * 0.35}" ry="${duneH * 0.7}" fill="${darkSand}" opacity="0.6"/>`
  }
  
  svg += '</svg>'
  return svg
}

export function generateSnowSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const noise = new SimplexNoise(config.seed)
  const snowColor = config.primaryColor || '#e8f0f8'
  const shadowSnow = config.secondaryColor || '#d0e0f0'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Base snow
  svg += `<rect width="${w}" height="${h}" fill="${snowColor}"/>`
  
  // Snow variation
  for (let y = 0; y < h; y += 8) {
    for (let x = 0; x < w; x += 8) {
      const n = noise.fbm(x * 0.02, y * 0.02, 2)
      if (n < -0.2) {
        svg += `<rect x="${x}" y="${y}" width="9" height="9" fill="${shadowSnow}" opacity="0.5"/>`
      }
    }
  }
  
  // Sparkles
  for (let i = 0; i < 15; i++) {
    const sx = rng.next() * w
    const sy = rng.next() * h
    svg += `<circle cx="${sx}" cy="${sy}" r="1" fill="#ffffff" opacity="0.8"/>`
  }
  
  svg += '</svg>'
  return svg
}

export function generateMountainsSVG(w: number, h: number, config: TerrainConfig): string {
  const rng = new SeededRandom(config.seed)
  const rockColor = config.primaryColor || '#6a5a4a'
  const snowColor = config.accentColor || '#ffffff'
  const shadowColor = config.shadowColor || '#3a2a1a'
  
  let svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`
  
  // Base
  svg += `<rect width="${w}" height="${h}" fill="${rockColor}"/>`
  
  // Simple mountain peaks - triangles
  const numPeaks = 2 + Math.floor((config.complexity || 0.5) * 3)
  for (let i = 0; i < numPeaks; i++) {
    const peakX = w * rng.nextFloat(0.2, 0.8)
    const peakY = h * rng.nextFloat(0.3, 0.7)
    const peakW = w * rng.nextFloat(0.15, 0.3)
    const peakH = h * rng.nextFloat(0.2, 0.4)
    
    // Shadow
    svg += `<polygon points="${peakX},${peakY} ${peakX + peakW},${peakY} ${peakX + peakW * 0.5},${peakY - peakH}" fill="${shadowColor}" opacity="0.5"/>`
    // Main
    svg += `<polygon points="${peakX},${peakY} ${peakX + peakW},${peakY} ${peakX + peakW * 0.5},${peakY - peakH}" fill="${rockColor}"/>`
    // Snow cap
    svg += `<polygon points="${peakX + peakW * 0.3},${peakY - peakH * 0.3} ${peakX + peakW * 0.7},${peakY - peakH * 0.3} ${peakX + peakW * 0.5},${peakY - peakH}" fill="${snowColor}"/>`
  }
  
  svg += '</svg>'
  return svg
}

// =====================================================
// MAIN GENERATOR FUNCTION
// =====================================================

export function generateTerrainSVG(w: number, h: number, config: TerrainConfig): string {
  switch (config.terrainType) {
    case 'cave':
      return generateCaveSVG(w, h, config)
    case 'dungeon':
    case 'ruins':
      return generateDungeonSVG(w, h, config)
    case 'treeSingle':
      return generateTreeSVG(w, h, config)
    case 'treeCluster':
      return generateTreeClusterSVG(w, h, config)
    case 'bush':
      return generateBushSVG(w, h, config)
    case 'rocks':
      return generateRocksSVG(w, h, config)
    case 'cliff':
      return generateCliffSVG(w, h, config)
    case 'lake':
      return generateLakeSVG(w, h, config)
    case 'river':
      return generateRiverSVG(w, h, config)
    case 'path':
      return generatePathSVG(w, h, config)
    case 'dirtPath':
      return generateDirtPathSVG(w, h, config)
    case 'road':
      return generateRoadSVG(w, h, config)
    case 'fence':
      return generateFenceSVG(w, h, config)
    case 'table':
      return generateTableSVG(w, h, config)
    case 'campsite':
      return generateCampsiteSVG(w, h, config)
    case 'grassland':
      return generateGrasslandSVG(w, h, config)
    case 'ocean':
      return generateOceanSVG(w, h, config)
    case 'house':
    case 'castle':
    case 'church':
    case 'tower':
    case 'barn':
    case 'pagoda':
    case 'dome':
    case 'windmill':
    case 'lighthouse':
    case 'temple':
      return generateHouseSVG(w, h, config)
    case 'beach':
      return generateBeachSVG(w, h, config)
    case 'desert':
      return generateDesertSVG(w, h, config)
    case 'snow':
      return generateSnowSVG(w, h, config)
    case 'mountains':
      return generateMountainsSVG(w, h, config)
    default:
      // Fallback to simple shape
      return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${config.primaryColor || '#4a4a4a'}"/></svg>`
  }
}
