// DM Screen Types

export type DmScreenItemType = 
  | 'LibraryItemId' 
  | 'UserFileId' 
  | 'quickNote' 
  | 'webLink' 
  | 'CombatantItemToken' 
  | 'ImageUrl'
  | 'TextNode'
  | 'ShapeNode'
  | 'TokenNode' // Compact circular token view of LibraryItem or UserFile
  | 'EffectNode' // WebGL particle/lighting effects (fire, snow, fog, etc.)
  | 'TerrainNode' // Procedurally generated terrain elements (caves, buildings, trees, etc.)

// Effect types for EffectNode
export type EffectType = 
  | 'fire'
  | 'torch'
  | 'campfire'
  | 'snow'
  | 'rain'
  | 'fog'
  | 'smoke'
  | 'sparkles'
  | 'lightRing'
  | 'aura'
  | 'magicCircle'
  | 'fireflies'
  | 'dust'
  | 'embers'
  | 'spiritualWeapon'
  | 'thunder'
  | 'electricBeam'
  | 'energyBeam'
  | 'fireColumn'
  | 'shadowTendrils'
  | 'whirlpool'
  | 'grass'
  | 'water'
  | 'lava'

// Effect preset configuration
export interface EffectPreset {
  id: string
  name: string
  effectType: EffectType
  icon: string
  description: string
  defaultConfig: EffectConfig
}

// Effect configuration for EffectNode
export interface EffectConfig {
  effectType: EffectType
  intensity: number       // 0-1, affects particle count/brightness
  color: string           // Primary color (hex)
  secondaryColor?: string // Secondary color for gradients/trails
  speed: number           // Animation speed multiplier (0.1 - 3)
  scale: number           // Effect scale multiplier (0.5 - 2)
  opacity: number         // Overall opacity (0-1)
  blendMode?: string      // CSS blend mode ('normal', 'screen', 'add', etc.)
  // Particle-specific
  particleCount?: number
  particleSize?: number
  spread?: number         // How spread out particles are
  // Light-specific
  radius?: number
  pulseSpeed?: number
  glowIntensity?: number
  // Light pool settings (screen blend lighting effect)
  lightPoolIntensity?: number  // 0-1, how bright the light pool is (0 = off)
  lightPoolSize?: number       // 0.5-3, multiplier for light pool size (1 = 100% of node)
  // Beam path (for beam effects)
  beamPath?: string            // SVG path d attribute for beam to follow
  // Mask settings
  useCircleMask?: boolean      // Use circular mask instead of full area
  maskFeatherOpacity?: number  // 0-1, feathering opacity at edges (0 = hard edge, 1 = fully feathered)
  maskFeatherSize?: number     // 0-1, feathering size/radius (0 = no feather, 1 = maximum feather)
}

// =====================================================
// SVG SHAPE TYPES for ShapeNode
// =====================================================

export type SVGShapeType = 
  | 'rectangle'
  | 'roundedRect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'arrow'
  | 'arrowDouble'
  | 'cross'
  | 'heart'
  | 'cloud'
  | 'speech'
  | 'line'
  | 'custom' // Custom SVG path

// Point for custom path editing
export interface SVGPathPoint {
  x: number
  y: number
  type: 'M' | 'L' | 'C' | 'Q' | 'Z' // Move, Line, Cubic bezier, Quadratic bezier, Close
  // Control points for curves
  cx1?: number
  cy1?: number
  cx2?: number
  cy2?: number
}

// Gradient stop for gradient fills
export interface SVGGradientStop {
  offset: number  // 0-100 percentage
  color: string   // hex color
  opacity: number // 0-1
}

// Fill configuration
export interface SVGFillConfig {
  type: 'solid' | 'linearGradient' | 'radialGradient' | 'none'
  color: string           // Primary color (for solid)
  opacity: number         // Fill opacity 0-1
  // Gradient options
  gradientStops?: SVGGradientStop[]
  gradientAngle?: number  // 0-360 for linear gradient direction
}

// Stroke/Border configuration
export interface SVGStrokeConfig {
  enabled: boolean
  color: string
  width: number          // Stroke width in pixels
  opacity: number        // Stroke opacity 0-1
  dashArray?: string     // e.g., "5,5" for dashed, "10,5,2,5" for complex
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
}

// Shadow configuration
export interface SVGShadowConfig {
  enabled: boolean
  color: string
  offsetX: number
  offsetY: number
  blur: number
  opacity: number
}

// Complete shape data
export interface SVGShapeData {
  // Shape type and path
  shapeType: SVGShapeType
  customPath?: string        // SVG path d attribute for custom shapes
  pathPoints?: SVGPathPoint[] // Editable points for path editor
  
  // Appearance
  fill: SVGFillConfig
  stroke: SVGStrokeConfig
  shadow?: SVGShadowConfig
  
  // Shape-specific options
  cornerRadius?: number      // For roundedRect
  points?: number            // For star (number of points)
  innerRadius?: number       // For star (inner radius percentage)
  arrowHeadSize?: number     // For arrow shapes
  
  // Text label
  label?: string
  labelColor?: string
  labelFontSize?: number
  labelFontWeight?: 'normal' | 'bold'
  
  // Transform
  rotation?: number          // Rotation in degrees (separate from node rotation)
  flipX?: boolean
  flipY?: boolean
}

// Shape preset for quick selection
export interface SVGShapePreset {
  id: string
  name: string
  icon: string
  shapeType: SVGShapeType
  defaultData: Partial<SVGShapeData>
  svgPath?: string  // Pre-defined SVG path for the shape
}

// Default shape data factory
export function getDefaultSVGShapeData(shapeType: SVGShapeType = 'rectangle'): SVGShapeData {
  return {
    shapeType,
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
      enabled: true,
      color: '#000000',
      offsetX: 0,
      offsetY: 2,
      blur: 8,
      opacity: 0.3,
    },
    cornerRadius: 8,
    points: 5,
    innerRadius: 40,
    arrowHeadSize: 30,
    labelColor: '#ffffff',
    labelFontSize: 14,
    labelFontWeight: 'bold',
  }
}

// SVG path generators for each shape type
export const SVG_SHAPE_PATHS: Record<SVGShapeType, (w: number, h: number, opts?: any) => string> = {
  rectangle: (w, h) => `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`,
  
  roundedRect: (w, h, opts) => {
    const r = Math.min(opts?.cornerRadius || 8, w / 2, h / 2)
    return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z`
  },
  
  circle: (w, h) => {
    const rx = w / 2
    const ry = h / 2
    return `M ${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} ${h} A ${rx} ${ry} 0 1 1 ${rx} 0 Z`
  },
  
  ellipse: (w, h) => {
    const rx = w / 2
    const ry = h / 2
    return `M ${rx} 0 A ${rx} ${ry} 0 1 1 ${rx} ${h} A ${rx} ${ry} 0 1 1 ${rx} 0 Z`
  },
  
  triangle: (w, h) => `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z`,
  
  diamond: (w, h) => `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z`,
  
  pentagon: (w, h) => {
    const cx = w / 2, cy = h / 2
    const r = Math.min(w, h) / 2
    const points = []
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180
      points.push(`${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`)
    }
    return `M ${points.join(' L ')} Z`
  },
  
  hexagon: (w, h) => {
    const cx = w / 2, cy = h / 2
    const r = Math.min(w, h) / 2
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 90) * Math.PI / 180
      points.push(`${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`)
    }
    return `M ${points.join(' L ')} Z`
  },
  
  star: (w, h, opts) => {
    const cx = w / 2, cy = h / 2
    const outerR = Math.min(w, h) / 2
    const innerR = outerR * (opts?.innerRadius || 40) / 100
    const numPoints = opts?.points || 5
    const points = []
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * 180 / numPoints - 90) * Math.PI / 180
      const r = i % 2 === 0 ? outerR : innerR
      points.push(`${cx + r * Math.cos(angle)} ${cy + r * Math.sin(angle)}`)
    }
    return `M ${points.join(' L ')} Z`
  },
  
  arrow: (w, h, opts) => {
    const headSize = (opts?.arrowHeadSize || 30) / 100
    const headW = w * headSize
    const bodyH = h * 0.4
    const bodyY = (h - bodyH) / 2
    return `M 0 ${bodyY} L ${w - headW} ${bodyY} L ${w - headW} 0 L ${w} ${h / 2} L ${w - headW} ${h} L ${w - headW} ${bodyY + bodyH} L 0 ${bodyY + bodyH} Z`
  },
  
  arrowDouble: (w, h, opts) => {
    const headSize = (opts?.arrowHeadSize || 25) / 100
    const headW = w * headSize
    const bodyH = h * 0.35
    const bodyY = (h - bodyH) / 2
    return `M 0 ${h / 2} L ${headW} 0 L ${headW} ${bodyY} L ${w - headW} ${bodyY} L ${w - headW} 0 L ${w} ${h / 2} L ${w - headW} ${h} L ${w - headW} ${bodyY + bodyH} L ${headW} ${bodyY + bodyH} L ${headW} ${h} Z`
  },
  
  cross: (w, h) => {
    const armW = w * 0.33
    const armH = h * 0.33
    const x1 = (w - armW) / 2
    const x2 = x1 + armW
    const y1 = (h - armH) / 2
    const y2 = y1 + armH
    return `M ${x1} 0 L ${x2} 0 L ${x2} ${y1} L ${w} ${y1} L ${w} ${y2} L ${x2} ${y2} L ${x2} ${h} L ${x1} ${h} L ${x1} ${y2} L 0 ${y2} L 0 ${y1} L ${x1} ${y1} Z`
  },
  
  heart: (w, h) => {
    const cx = w / 2
    return `M ${cx} ${h * 0.25} C ${cx} ${h * 0.1} ${w * 0.25} 0 ${w * 0.15} 0 C 0 0 0 ${h * 0.35} 0 ${h * 0.35} C 0 ${h * 0.55} ${cx * 0.5} ${h * 0.75} ${cx} ${h} C ${cx * 1.5} ${h * 0.75} ${w} ${h * 0.55} ${w} ${h * 0.35} C ${w} ${h * 0.35} ${w} 0 ${w * 0.85} 0 C ${w * 0.75} 0 ${cx} ${h * 0.1} ${cx} ${h * 0.25} Z`
  },
  
  cloud: (w, h) => {
    return `M ${w * 0.25} ${h * 0.6} C ${w * 0.1} ${h * 0.6} 0 ${h * 0.45} 0 ${h * 0.35} C 0 ${h * 0.2} ${w * 0.15} ${h * 0.1} ${w * 0.3} ${h * 0.15} C ${w * 0.35} 0 ${w * 0.55} 0 ${w * 0.6} ${h * 0.1} C ${w * 0.75} 0 ${w * 0.95} ${h * 0.1} ${w} ${h * 0.3} C ${w} ${h * 0.5} ${w * 0.85} ${h * 0.6} ${w * 0.75} ${h * 0.6} Z`
  },
  
  speech: (w, h) => {
    const tailH = h * 0.2
    const bodyH = h - tailH
    const r = Math.min(w * 0.15, bodyH * 0.3)
    return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${bodyH - r} Q ${w} ${bodyH} ${w - r} ${bodyH} L ${w * 0.35} ${bodyH} L ${w * 0.15} ${h} L ${w * 0.25} ${bodyH} L ${r} ${bodyH} Q 0 ${bodyH} 0 ${bodyH - r} L 0 ${r} Q 0 0 ${r} 0 Z`
  },
  
  line: (w, h) => `M 0 ${h / 2} L ${w} ${h / 2}`,
  
  custom: () => '', // Custom path is stored in customPath
}

// Shape presets for the shape picker
export const SVG_SHAPE_PRESETS: SVGShapePreset[] = [
  { id: 'rectangle', name: 'Rectangle', icon: 'mdi-rectangle-outline', shapeType: 'rectangle', defaultData: {} },
  { id: 'roundedRect', name: 'Rounded Rectangle', icon: 'mdi-card-outline', shapeType: 'roundedRect', defaultData: { cornerRadius: 12 } },
  { id: 'circle', name: 'Circle', icon: 'mdi-circle-outline', shapeType: 'circle', defaultData: {} },
  { id: 'ellipse', name: 'Ellipse', icon: 'mdi-ellipse-outline', shapeType: 'ellipse', defaultData: {} },
  { id: 'triangle', name: 'Triangle', icon: 'mdi-triangle-outline', shapeType: 'triangle', defaultData: {} },
  { id: 'diamond', name: 'Diamond', icon: 'mdi-rhombus-outline', shapeType: 'diamond', defaultData: {} },
  { id: 'pentagon', name: 'Pentagon', icon: 'mdi-pentagon-outline', shapeType: 'pentagon', defaultData: {} },
  { id: 'hexagon', name: 'Hexagon', icon: 'mdi-hexagon-outline', shapeType: 'hexagon', defaultData: {} },
  { id: 'star', name: 'Star', icon: 'mdi-star-outline', shapeType: 'star', defaultData: { points: 5, innerRadius: 40 } },
  { id: 'arrow', name: 'Arrow', icon: 'mdi-arrow-right-bold-outline', shapeType: 'arrow', defaultData: { arrowHeadSize: 30 } },
  { id: 'arrowDouble', name: 'Double Arrow', icon: 'mdi-arrow-left-right-bold-outline', shapeType: 'arrowDouble', defaultData: { arrowHeadSize: 25 } },
  { id: 'cross', name: 'Cross', icon: 'mdi-plus-thick', shapeType: 'cross', defaultData: {} },
  { id: 'heart', name: 'Heart', icon: 'mdi-heart-outline', shapeType: 'heart', defaultData: {} },
  { id: 'cloud', name: 'Cloud', icon: 'mdi-cloud-outline', shapeType: 'cloud', defaultData: {} },
  { id: 'speech', name: 'Speech Bubble', icon: 'mdi-message-outline', shapeType: 'speech', defaultData: {} },
  { id: 'line', name: 'Line', icon: 'mdi-minus', shapeType: 'line', defaultData: { stroke: { enabled: true, width: 4 } } },
]

// Vue Flow node position and options
export interface VueFlowNodeOptions {
  x?: number
  y?: number
  width?: number
  height?: number
  selected?: boolean
  dragging?: boolean
  position?: { x: number; y: number }
  style?: Record<string, any>
  class?: string
  data?: Record<string, any>
  resizable?: boolean
  rotation?: number // Rotation in degrees (0-360)
  [key: string]: any // Allow additional Vue Flow properties
}

  // Layer definition for organizing items
export interface DmScreenLayer {
  id: string // Unique layer ID
  name: string // Display name
  order: number // Higher order = rendered on top
  visible: boolean // Toggle layer visibility
  opacity: number // Layer opacity (0-1)
  locked?: boolean // Prevent editing items in this layer
  showOnPortal?: boolean // Whether to show this layer in portal mode (default: true)
}

// Default layer IDs
export const DEFAULT_LAYERS = {
  BACKGROUND: 'background',
  SCREEN: 'screen',
} as const

// DM Screen Item
export interface DmScreenItem {
  id: string
  type: DmScreenItemType
  layer?: string // Layer ID this item belongs to (default: 'screen')
  order?: number // Order within the layer (higher = on top within layer)
  data: {
    // For LibraryItemId: just the id number
    id?: number
    // For UserFileId: just the id number
    // For quickNote: note content
    content?: string
    // For webLink: URL
    url?: string
    // For CombatantItemToken: combatant data
    combatantId?: string
    // For ImageUrl: image URL
    imageUrl?: string
    
    // For TextNode
    text?: string
    fontSize?: number
    fontWeight?: string
    textColor?: string
    textAlign?: string
    
    // For ShapeNode (SVG-based)
    shape?: SVGShapeType
    shapeData?: SVGShapeData
    // Legacy simple shape properties (kept for backwards compatibility)
    color?: string
    opacity?: number
    borderColor?: string
    borderWidth?: number
    label?: string
    
    // For TokenNode (compact circular token)
    originalType?: DmScreenItemType // The original type before converting to token
    originalData?: Record<string, any> // Original data to restore when converting back
    tokenImageUrl?: string // Cached image URL for the token
    tokenLabel?: string // Label to show on token (item name or filename)
    tokenShowLabel?: boolean // Whether to show the label below the token (default: true)
    tokenBorderColor?: string // Border color (default: transparent)
    tokenBorderWidth?: number // Border width in pixels (default: 0)
    tokenSize?: number // Token size in pixels (default: 100)
    
    // For EffectNode (particle/lighting effects)
    effectConfig?: EffectConfig // Full effect configuration
    
    // For TerrainNode (procedurally generated terrain)
    terrainConfig?: TerrainConfig // Terrain generation configuration
    generatedTerrainImage?: string | null // Cached generated terrain as data URL
    
    // Background image flag (legacy - now use layer instead)
    isBackground?: boolean
    featuredImageUrl?: string
    
    // Allow any additional data
    [key: string]: any
  }
  // Vue Flow node options
  nodeOptions?: VueFlowNodeOptions
  // Additional properties
  isMinimized?: boolean
  minimizedDimensions?: { width: number; height: number } // Store minimized dimensions separately
  [key: string]: any
}

// Grid options for DM Screen background (VTT-enabled)
export interface GridOptions {
  showGrid?: boolean
  gridSize?: number // Size of grid cells in pixels (default: 50 for VTT)
  gridColor?: string // Color of grid lines (hex)
  gridLineWidth?: number // Width of grid lines
  gridOpacity?: number // Opacity of grid lines (0-1)
  snapToGrid?: boolean // Whether items snap to grid (center to center)
  
  // Grid alignment offset (for matching map image grids)
  offsetX?: number // X offset in pixels
  offsetY?: number // Y offset in pixels
  
  // VTT-specific settings (D&D 5e standard: 1 square = 5 feet)
  feetPerSquare?: number // Distance in feet per grid square (default: 5)
  showCoordinates?: boolean // Show grid coordinates (A1, B2, etc.)
  gridStyle?: 'square' | 'hex' // Grid type (square for D&D, hex for some systems)
  showMajorGridLines?: boolean // Show thicker lines every N squares
  majorGridInterval?: number // Interval for major grid lines (default: 5)
  majorGridColor?: string // Color for major grid lines
  
  // Measurement settings
  diagonalRule?: 'standard' | 'alternating' | 'euclidean'
  // standard = every diagonal = 5ft (simple)
  // alternating = 5-10-5-10 pattern (PHB variant)
  // euclidean = actual diagonal distance (sqrt(2) * 5 ≈ 7ft)
  
  // Portal sync settings
  showMeasurementsOnPortal?: boolean // Send measurement lines/trails/pings to portal
}

// Movement tracking for drag operations
export interface MovementTracker {
  startX: number
  startY: number
  currentX: number
  currentY: number
  distanceSquares: number
  distanceFeet: number
}

// VTT Tool modes
export type VttToolMode = 'select' | 'measure' | 'ping' | 'draw'

// Measurement line for ruler tool
export interface MeasurementLine {
  id: string
  startX: number
  startY: number
  endX: number
  endY: number
  color?: string
  persistent?: boolean // If true, stays on screen until manually removed
}

// DM Screen Settings (flexible JSON object)
export interface DmScreenSettings extends GridOptions {
  layout?: string
  columns?: number
  theme?: string
  autoSave?: boolean
  layers?: DmScreenLayer[] // Layer definitions with order, visibility, opacity
  backgroundImageId?: number // UserFile ID for background image (legacy, kept for backward compatibility)
  backgroundImageWidth?: number // Width of background image in pixels (default: 2500)
  lockBackgroundImages?: boolean // Lock all background image nodes (legacy - use layer.locked instead)
  backgroundOpacity?: number // Opacity for background image nodes (legacy - use layer.opacity instead)
  canvasBackgroundImageId?: number // UserFile ID for fixed canvas background (non-scaling)
  pinnedCategories?: Array<{ id: number; name: string; libraryId: number; fileCount?: number; createdAt: string; updatedAt: string }> // Pinned file categories for kitbashing drawers
  [key: string]: any
}



// DM Screen
export interface DmScreen {
  id: string // UUID
  libraryId: number
  name: string
  items: DmScreenItem[] | null
  settings: DmScreenSettings | null
  createdAt: string
  updatedAt: string
}

// Create DM Screen Payload
export interface CreateDmScreenPayload {
  name: string
  items?: DmScreenItem[]
  settings?: DmScreenSettings
}

// Update DM Screen Payload
export interface UpdateDmScreenPayload {
  name?: string
  items?: DmScreenItem[] | null
  settings?: DmScreenSettings | null
}

// DM Screens List Response
export interface DmScreensListResponse {
  dmScreens: DmScreen[]
}

// Single DM Screen Response
export interface DmScreenResponse {
  dmScreen: DmScreen
}

// Helper function to get default layers
export function getDefaultLayers(): DmScreenLayer[] {
  return [
    {
      id: DEFAULT_LAYERS.BACKGROUND,
      name: 'Background',
      order: 0,
      visible: true,
      opacity: 1,
      locked: false,
      showOnPortal: true,
    },
    {
      id: DEFAULT_LAYERS.SCREEN,
      name: 'Screen',
      order: 1,
      visible: true,
      opacity: 1,
      locked: false,
      showOnPortal: true,
    },
  ]
}

// Helper function to get default VTT grid options
export function getDefaultGridOptions(): GridOptions {
  return {
    showGrid: true,
    gridSize: 50, // 50px per square is good for VTT
    gridColor: '#ffffff', // Pure white, opacity controlled separately
    gridLineWidth: 1,
    gridOpacity: 0.6, // Higher default opacity for better visibility
    snapToGrid: true,
    offsetX: 0, // Grid alignment offset
    offsetY: 0,
    feetPerSquare: 5, // D&D 5e standard
    showCoordinates: false,
    gridStyle: 'square',
    showMajorGridLines: true,
    majorGridInterval: 5, // Thicker line every 5 squares (25 feet)
    majorGridColor: '#ffffff',
    diagonalRule: 'standard',
  }
}

// Calculate distance in feet between two grid positions
export function calculateDistanceFeet(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  gridSize: number,
  feetPerSquare: number = 5,
  diagonalRule: 'standard' | 'alternating' | 'euclidean' = 'standard'
): { squares: number; feet: number; path: string } {
  // Convert pixel positions to grid squares
  const startCol = Math.floor(startX / gridSize)
  const startRow = Math.floor(startY / gridSize)
  const endCol = Math.floor(endX / gridSize)
  const endRow = Math.floor(endY / gridSize)
  
  const deltaX = Math.abs(endCol - startCol)
  const deltaY = Math.abs(endRow - startRow)
  
  let squares: number
  let feet: number
  
  switch (diagonalRule) {
    case 'euclidean':
      // True distance: sqrt(dx² + dy²)
      squares = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      feet = Math.round(squares * feetPerSquare)
      break
      
    case 'alternating':
      // D&D 5e PHB variant: diagonal costs alternate between 5ft and 10ft
      // Each diagonal movement costs 1 square, but every other diagonal costs 2
      const diagonals = Math.min(deltaX, deltaY)
      const straights = Math.abs(deltaX - deltaY)
      // First diagonal = 5ft, second = 10ft, third = 5ft, etc.
      const diagonalCost = Math.floor(diagonals / 2) * 3 + (diagonals % 2) // 1.5 average
      squares = straights + diagonals
      feet = (straights + Math.floor(diagonals * 1.5)) * feetPerSquare
      break
      
    case 'standard':
    default:
      // Simple: each square = 5ft, including diagonals
      // Movement is the greater of horizontal or vertical distance
      squares = Math.max(deltaX, deltaY)
      feet = squares * feetPerSquare
      break
  }
  
  // Generate path description
  const path = `${deltaX} squares horizontal, ${deltaY} squares vertical`
  
  return { squares: Math.round(squares * 10) / 10, feet, path }
}

// Effect presets for the effects panel
export const EFFECT_PRESETS: EffectPreset[] = [
  {
    id: 'fire',
    name: 'Fire',
    effectType: 'fire',
    icon: 'mdi-fire',
    description: 'Blazing flames',
    defaultConfig: {
      effectType: 'fire',
      intensity: 0.7,
      color: '#ff6600',
      secondaryColor: '#ffcc00',
      speed: 1,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
      particleCount: 50,
      particleSize: 15,
      spread: 30,
      lightPoolIntensity: 0.5,
      lightPoolSize: 1.2,
    },
  },
  {
    id: 'torch',
    name: 'Torch',
    effectType: 'torch',
    icon: 'mdi-torch',
    description: 'Flickering torch flame',
    defaultConfig: {
      effectType: 'torch',
      intensity: 0.5,
      color: '#ff8800',
      secondaryColor: '#ffdd44',
      speed: 1.2,
      scale: 0.6,
      opacity: 0.85,
      blendMode: 'screen',
      particleCount: 25,
      particleSize: 10,
      spread: 15,
      lightPoolIntensity: 0.4,
      lightPoolSize: 0.8,
    },
  },
  {
    id: 'campfire',
    name: 'Campfire',
    effectType: 'campfire',
    icon: 'mdi-campfire',
    description: 'Cozy campfire with embers',
    defaultConfig: {
      effectType: 'campfire',
      intensity: 0.6,
      color: '#ff5500',
      secondaryColor: '#ffaa00',
      speed: 0.8,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
      particleCount: 40,
      particleSize: 12,
      spread: 40,
      lightPoolIntensity: 0.55,
      lightPoolSize: 1.0,
    },
  },
  {
    id: 'snow',
    name: 'Snow',
    effectType: 'snow',
    icon: 'mdi-snowflake',
    description: 'Falling snowflakes',
    defaultConfig: {
      effectType: 'snow',
      intensity: 0.5,
      color: '#ffffff',
      secondaryColor: '#e0f0ff',
      speed: 0.5,
      scale: 1,
      opacity: 0.8,
      blendMode: 'normal',
      particleCount: 60,
      particleSize: 8,
      spread: 100,
    },
  },
  {
    id: 'rain',
    name: 'Rain',
    effectType: 'rain',
    icon: 'mdi-weather-rainy',
    description: 'Falling rain drops',
    defaultConfig: {
      effectType: 'rain',
      intensity: 0.7,
      color: '#88aacc',
      secondaryColor: '#6688aa',
      speed: 2,
      scale: 1,
      opacity: 0.6,
      blendMode: 'normal',
      particleCount: 100,
      particleSize: 3,
      spread: 100,
    },
  },
  {
    id: 'fog',
    name: 'Fog',
    effectType: 'fog',
    icon: 'mdi-weather-fog',
    description: 'Mysterious fog/mist',
    defaultConfig: {
      effectType: 'fog',
      intensity: 0.4,
      color: '#aabbcc',
      secondaryColor: '#889999',
      speed: 0.2,
      scale: 2,
      opacity: 0.5,
      blendMode: 'normal',
      particleCount: 15,
      particleSize: 100,
      spread: 80,
    },
  },
  {
    id: 'smoke',
    name: 'Smoke',
    effectType: 'smoke',
    icon: 'mdi-smoke',
    description: 'Rising smoke plume',
    defaultConfig: {
      effectType: 'smoke',
      intensity: 0.5,
      color: '#555555',
      secondaryColor: '#333333',
      speed: 0.4,
      scale: 1,
      opacity: 0.6,
      blendMode: 'normal',
      particleCount: 20,
      particleSize: 40,
      spread: 25,
    },
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    effectType: 'sparkles',
    icon: 'mdi-shimmer',
    description: 'Magical sparkle effect',
    defaultConfig: {
      effectType: 'sparkles',
      intensity: 0.6,
      color: '#ffff88',
      secondaryColor: '#ffffff',
      speed: 0.8,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
      particleCount: 30,
      particleSize: 6,
      spread: 60,
      lightPoolIntensity: 0.25,
      lightPoolSize: 0.8,
    },
  },
  {
    id: 'fireflies',
    name: 'Fireflies',
    effectType: 'fireflies',
    icon: 'mdi-bee',
    description: 'Glowing fireflies',
    defaultConfig: {
      effectType: 'fireflies',
      intensity: 0.4,
      color: '#aaff66',
      secondaryColor: '#88dd44',
      speed: 0.3,
      scale: 1,
      opacity: 0.8,
      blendMode: 'screen',
      particleCount: 15,
      particleSize: 8,
      spread: 80,
      lightPoolIntensity: 0.2,
      lightPoolSize: 1.0,
    },
  },
  {
    id: 'embers',
    name: 'Embers',
    effectType: 'embers',
    icon: 'mdi-flare',
    description: 'Floating hot embers',
    defaultConfig: {
      effectType: 'embers',
      intensity: 0.5,
      color: '#ff4400',
      secondaryColor: '#ff8800',
      speed: 0.6,
      scale: 1,
      opacity: 0.85,
      blendMode: 'screen',
      particleCount: 25,
      particleSize: 5,
      spread: 40,
      lightPoolIntensity: 0.35,
      lightPoolSize: 1.0,
    },
  },
  {
    id: 'dust',
    name: 'Dust',
    effectType: 'dust',
    icon: 'mdi-grain',
    description: 'Floating dust particles',
    defaultConfig: {
      effectType: 'dust',
      intensity: 0.3,
      color: '#ccbb99',
      secondaryColor: '#aa9977',
      speed: 0.15,
      scale: 1,
      opacity: 0.4,
      blendMode: 'normal',
      particleCount: 40,
      particleSize: 4,
      spread: 100,
    },
  },
  {
    id: 'lightRing',
    name: 'Light Ring',
    effectType: 'lightRing',
    icon: 'mdi-circle-outline',
    description: 'Pulsing light ring',
    defaultConfig: {
      effectType: 'lightRing',
      intensity: 0.7,
      color: '#6688ff',
      secondaryColor: '#aaccff',
      speed: 1,
      scale: 1,
      opacity: 0.7,
      blendMode: 'screen',
      radius: 50,
      pulseSpeed: 2,
      glowIntensity: 0.8,
      lightPoolIntensity: 0.4,
      lightPoolSize: 1.0,
    },
  },
  {
    id: 'aura',
    name: 'Aura',
    effectType: 'aura',
    icon: 'mdi-blur-radial',
    description: 'Glowing aura effect',
    defaultConfig: {
      effectType: 'aura',
      intensity: 0.5,
      color: '#aa66ff',
      secondaryColor: '#ff66aa',
      speed: 0.5,
      scale: 1,
      opacity: 0.6,
      blendMode: 'screen',
      radius: 60,
      pulseSpeed: 1.5,
      glowIntensity: 0.6,
      lightPoolIntensity: 0.45,
      lightPoolSize: 1.2,
    },
  },
  {
    id: 'magicCircle',
    name: 'Magic Circle',
    effectType: 'magicCircle',
    icon: 'mdi-star-circle-outline',
    description: 'Rotating magic circle',
    defaultConfig: {
      effectType: 'magicCircle',
      intensity: 0.6,
      color: '#66ffff',
      secondaryColor: '#ff66ff',
      speed: 0.3,
      scale: 1,
      opacity: 0.7,
      blendMode: 'screen',
      radius: 70,
      pulseSpeed: 1,
      glowIntensity: 0.7,
      lightPoolIntensity: 0.5,
      lightPoolSize: 1.3,
    },
  },
  {
    id: 'spiritualWeapon',
    name: 'Spiritual Weapon',
    effectType: 'spiritualWeapon',
    icon: 'mdi-sword',
    description: 'Floating magical weapon',
    defaultConfig: {
      effectType: 'spiritualWeapon',
      intensity: 0.7,
      color: '#ffd700',
      secondaryColor: '#ffaa00',
      speed: 1,
      scale: 1,
      opacity: 0.95,
      blendMode: 'screen',
      glowIntensity: 0.9,
      lightPoolIntensity: 0.5,
      lightPoolSize: 1.0,
    },
  },
  {
    id: 'thunder',
    name: 'Thunder',
    effectType: 'thunder',
    icon: 'mdi-lightning-bolt',
    description: 'Crackling lightning bolts',
    defaultConfig: {
      effectType: 'thunder',
      intensity: 0.7,
      color: '#4a9eff',
      secondaryColor: '#ffffff',
      speed: 1,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
      glowIntensity: 1.0,
      lightPoolIntensity: 0.6,
      lightPoolSize: 1.2,
    },
  },
  {
    id: 'electricBeam',
    name: 'Electric Beam',
    effectType: 'electricBeam',
    icon: 'mdi-lightning-bolt',
    description: 'Vertical beam of crackling electricity',
    defaultConfig: {
      effectType: 'electricBeam',
      intensity: 0.7,
      color: '#4a9eff',
      secondaryColor: '#88ccff',
      speed: 1.5,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
      glowIntensity: 1.0,
      lightPoolIntensity: 0.5,
      lightPoolSize: 1.0,
      beamPath: 'M 50 0 L 50 100', // Default vertical line
    },
  },
  {
    id: 'energyBeam',
    name: 'Energy Beam',
    effectType: 'energyBeam',
    icon: 'mdi-ray-start-end',
    description: 'Vertical beam of pure energy',
    defaultConfig: {
      effectType: 'energyBeam',
      intensity: 0.7,
      color: '#66ffff',
      secondaryColor: '#ffffff',
      speed: 1,
      scale: 1,
      opacity: 0.85,
      blendMode: 'screen',
      glowIntensity: 0.9,
      lightPoolIntensity: 0.5,
      lightPoolSize: 1.0,
      beamPath: 'M 50 0 L 50 100', // Default vertical line
    },
  },
  {
    id: 'fireColumn',
    name: 'Fire Column',
    effectType: 'fireColumn',
    icon: 'mdi-fire',
    description: 'Vertical column of rising flames',
    defaultConfig: {
      effectType: 'fireColumn',
      intensity: 0.7,
      color: '#ff6600',
      secondaryColor: '#ffcc00',
      speed: 1,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
      glowIntensity: 0.8,
      lightPoolIntensity: 0.5,
      lightPoolSize: 1.0,
      beamPath: 'M 50 0 L 50 100', // Default vertical line
    },
  },
  {
    id: 'shadowTendrils',
    name: 'Shadow Tendrils',
    effectType: 'shadowTendrils',
    icon: 'mdi-tentacle',
    description: 'Writhing shadow tendrils',
    defaultConfig: {
      effectType: 'shadowTendrils',
      intensity: 0.7,
      color: '#1a1a1a',
      secondaryColor: '#424242',
      speed: 1,
      scale: 1,
      opacity: 0.8,
      blendMode: 'multiply',
      particleCount: 8,
      particleSize: 30,
      spread: 70,
      lightPoolIntensity: 0.1,
      lightPoolSize: 1.2,
    },
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool',
    effectType: 'whirlpool',
    icon: 'mdi-weather-tornado',
    description: 'Swirling whirlpool/cyclone effect',
    defaultConfig: {
      effectType: 'whirlpool',
      intensity: 0.7,
      color: '#4a90e2',
      secondaryColor: '#87ceeb',
      speed: 1,
      scale: 1,
      opacity: 0.75,
      blendMode: 'normal',
      particleCount: 50,
      particleSize: 8,
      spread: 100,
      lightPoolIntensity: 0.2,
      lightPoolSize: 1.0,
    },
  },
  {
    id: 'grass',
    name: 'Grass',
    effectType: 'grass',
    icon: 'mdi-grass',
    description: 'Grassy terrain tile',
    defaultConfig: {
      effectType: 'grass',
      intensity: 0.7,
      color: '#4a7c3a',
      secondaryColor: '#6b9c5a',
      speed: 0.3,
      scale: 1,
      opacity: 1,
      blendMode: 'normal',
    },
  },
  {
    id: 'water',
    name: 'Water',
    effectType: 'water',
    icon: 'mdi-water',
    description: 'Animated water tile with waves',
    defaultConfig: {
      effectType: 'water',
      intensity: 0.6,
      color: '#4a90e2',
      secondaryColor: '#6bb3ff',
      speed: 1,
      scale: 1,
      opacity: 0.7,
      blendMode: 'normal',
    },
  },
  {
    id: 'lava',
    name: 'Lava',
    effectType: 'lava',
    icon: 'mdi-fire',
    description: 'Molten lava tile with bubbles',
    defaultConfig: {
      effectType: 'lava',
      intensity: 0.8,
      color: '#ff4400',
      secondaryColor: '#ff8800',
      speed: 0.8,
      scale: 1,
      opacity: 0.9,
      blendMode: 'screen',
    },
  },
]

// =====================================================
// TERRAIN NODE TYPES - Procedurally Generated Map Elements
// =====================================================

// Terrain types for TerrainNode
export type TerrainType = 
  | 'cave'           // Organic cave system (cellular automata)
  | 'dungeon'        // Structured dungeon rooms (BSP)
  | 'building'       // Top-down building interior with rooms
  | 'house'          // Top-down building exterior with roof
  | 'treeSingle'     // Single tree canopy
  | 'treeCluster'    // Cluster of trees
  | 'bush'           // Bush/shrub
  | 'rocks'          // Rock formation
  | 'cliff'          // Cliff edge/wall
  | 'river'          // Winding river
  | 'path'           // Dirt/stone path
  | 'ruins'          // Ruined structure
  | 'campsite'       // Campsite with tents/fire pit markers
  // Ground terrains
  | 'mountains'      // Mountain range from above with contours
  | 'grassland'      // Meadow/plains with grass
  | 'ocean'          // Sea with islands
  | 'lake'           // Lake with shore
  | 'beach'          // Shoreline with sand and water
  | 'desert'         // Sandy desert with dunes
  | 'snow'           // Snowy/icy terrain
  | 'swamp'          // Marshland/wetland
  | 'volcano'        // Volcanic terrain with lava
  | 'canyon'         // Deep canyon/ravine

// Terrain generation configuration
export interface TerrainConfig {
  terrainType: TerrainType
  seed: number                    // Random seed for reproducibility
  complexity: number              // 0-1: Simple to complex
  scale: number                   // Size multiplier
  
  // Colors (all terrains)
  primaryColor: string            // Main color
  secondaryColor: string          // Accent/variation color
  accentColor?: string            // Third color for highlights
  shadowColor?: string            // Shadow/depth color
  
  // Quality settings
  resolution?: 'low' | 'medium' | 'high' | 'ultra'  // Rendering resolution (512/768/1024/1536)
  detailLevel?: number            // 0-1: Amount of detail/texture
  
  // Cave/Dungeon specific
  fillDensity?: number            // 0-1: How filled the space is (caves)
  smoothIterations?: number       // Number of smoothing passes
  connectRegions?: boolean        // Whether to connect disconnected areas
  wallThickness?: number          // Thickness of walls (1-5)
  corridorWidth?: number          // Width of corridors (1-4)
  
  // Building specific
  roomCount?: number              // Number of rooms (2-10)
  doorStyle?: 'open' | 'closed' | 'arch'
  hasWindows?: boolean
  hasFurniture?: boolean          // Add furniture markers
  buildingStyle?: 'stone' | 'wood' | 'brick' | 'ruins'
  
  // Tree/Vegetation specific
  foliageStyle?: 'round' | 'pointed' | 'irregular'
  foliageDensity?: number         // 0-1: How full the canopy is
  trunkVisible?: boolean
  trunkColor?: string
  hasHighlights?: boolean         // Light patches on foliage
  hasShadows?: boolean            // Shadow beneath
  flowerColor?: string            // For bushes with flowers
  
  // Terrain specific
  texturePattern?: 'noise' | 'crosshatch' | 'stipple' | 'solid'
  borderStyle?: 'rough' | 'smooth' | 'none'
  hasOutline?: boolean
  outlineColor?: string
  outlineWidth?: number
  
  // Path/River specific
  pathWidth?: number
  curviness?: number              // 0-1: How curvy
  hasStones?: boolean             // Stepping stones for rivers
  hasBorder?: boolean             // Edge/border decoration
  
  // Lake/Water specific
  lakeStyle?: 'simple' | 'natural' | 'complex'  // Shape complexity
  waterDepthZones?: number        // 1-5: Number of depth gradient zones
  hasIslands?: boolean            // Add islands in water
  islandCount?: number            // 0-5: Number of islands
  hasReeds?: boolean              // Vegetation around shore
  reedDensity?: number            // 0-1: Amount of shore vegetation
  shoreDetail?: number            // 0-1: How jagged/organic the shore is
  hasWaves?: boolean              // Show wave patterns on water
  waveIntensity?: number          // 0-1: Wave pattern strength
  hasShoreSand?: boolean          // Sandy beach ring around water
  waterTransparency?: number      // 0-1: How transparent/clear the water looks
  
  // Grassland specific
  grassDensity?: number           // 0-1: Grass blade density
  hasFlowers?: boolean            // Wildflowers in grass
  flowerDensity?: number          // 0-1: Flower density
  grassBladeSize?: number         // 0-1: Size of grass blades (0.5 = small, 1 = large)
  hasPathPatches?: boolean        // Worn dirt patches in grass
  
  // Animation (optional)
  animated?: boolean
  animationSpeed?: number
  
  // Output
  generatedSvgPath?: string       // The generated SVG path data
  generatedCanvasData?: string    // Base64 canvas image for complex textures
}

// Terrain preset for the panel
export interface TerrainPreset {
  id: string
  name: string
  terrainType: TerrainType
  icon: string
  description: string
  category: 'dungeons' | 'nature' | 'structures' | 'terrain' | 'ground'
  defaultConfig: TerrainConfig
  previewColor: string            // Color for panel preview
}

// Get default terrain config for a type
export function getDefaultTerrainConfig(terrainType: TerrainType = 'cave'): TerrainConfig {
  const base: TerrainConfig = {
    terrainType,
    seed: Math.floor(Math.random() * 1000000),
    complexity: 0.5,
    scale: 1,
    primaryColor: '#4a4a4a',
    secondaryColor: '#2a2a2a',
    shadowColor: '#1a1a1a',
  }
  
  switch (terrainType) {
    case 'cave':
      return {
        ...base,
        primaryColor: '#4a3d3a',  // Brown rock
        secondaryColor: '#2d2420', // Dark rock
        accentColor: '#5c4d48',   // Light rock
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
    case 'dungeon':
      return {
        ...base,
        primaryColor: '#3d3d4a',  // Stone floor
        secondaryColor: '#2a2a35', // Dark stone
        accentColor: '#4d4d5a',   // Light stone
        shadowColor: '#1a1a20',
        roomCount: 5,
        doorStyle: 'open',
        wallThickness: 3,
        texturePattern: 'crosshatch',
        borderStyle: 'rough',
        hasOutline: true,
        outlineColor: '#1a1a20',
        outlineWidth: 3,
      }
    case 'building':
      return {
        ...base,
        primaryColor: '#8b7355',  // Wood floor
        secondaryColor: '#6b5345', // Dark wood
        accentColor: '#ab8b65',   // Light wood
        shadowColor: '#4a3a2a',
        roomCount: 4,
        doorStyle: 'open',
        hasWindows: true,
        hasFurniture: true,
        buildingStyle: 'wood',
        wallThickness: 2,
        texturePattern: 'crosshatch',
        hasOutline: true,
        outlineColor: '#3a2a1a',
        outlineWidth: 2,
      }
    case 'house':
      return {
        ...base,
        primaryColor: '#8b7355',  // Wall color
        secondaryColor: '#6b4423', // Roof color
        accentColor: '#8b5533',   // Roof highlight
        shadowColor: '#3a2a1a',
        wallThickness: 2,
        hasOutline: true,
        outlineColor: '#2a1a0a',
        outlineWidth: 1,
      }
    case 'treeSingle':
      return {
        ...base,
        primaryColor: '#2d5a2d',  // Dark green
        secondaryColor: '#4a8a4a', // Mid green
        accentColor: '#6ab06a',   // Light green
        trunkColor: '#5c4033',
        foliageStyle: 'round',
        foliageDensity: 0.8,
        trunkVisible: true,
        hasHighlights: true,
        hasShadows: true,
        borderStyle: 'rough',
      }
    case 'treeCluster':
      return {
        ...base,
        primaryColor: '#2d5a2d',
        secondaryColor: '#4a8a4a',
        accentColor: '#6ab06a',
        trunkColor: '#5c4033',
        foliageStyle: 'round',
        foliageDensity: 0.7,
        trunkVisible: false,
        hasHighlights: true,
        hasShadows: true,
        borderStyle: 'rough',
      }
    case 'bush':
      return {
        ...base,
        primaryColor: '#3d6a3d',
        secondaryColor: '#5a8a5a',
        accentColor: '#7aaa7a',
        foliageStyle: 'irregular',
        foliageDensity: 0.9,
        hasHighlights: true,
        hasShadows: true,
        borderStyle: 'rough',
      }
    case 'rocks':
      return {
        ...base,
        primaryColor: '#6a6a6a',  // Gray rock
        secondaryColor: '#4a4a4a',
        accentColor: '#8a8a8a',
        shadowColor: '#2a2a2a',
        texturePattern: 'stipple',
        borderStyle: 'rough',
        hasOutline: true,
        outlineColor: '#2a2a2a',
        outlineWidth: 1,
      }
    case 'cliff':
      return {
        ...base,
        primaryColor: '#7a7060',
        secondaryColor: '#5a5040',
        accentColor: '#9a9080',
        shadowColor: '#3a3020',
        texturePattern: 'noise',
        borderStyle: 'rough',
        hasOutline: true,
        outlineColor: '#2a2010',
        outlineWidth: 3,
      }
    case 'river':
      return {
        ...base,
        primaryColor: '#4a90c0',  // Water blue
        secondaryColor: '#3a70a0',
        accentColor: '#6ab0e0',
        pathWidth: 30,
        curviness: 0.7,
        hasStones: false,
        hasBorder: true,
        animated: true,
        animationSpeed: 0.5,
      }
    case 'path':
      return {
        ...base,
        primaryColor: '#8a7560',  // Dirt
        secondaryColor: '#6a5540',
        accentColor: '#aa9580',
        pathWidth: 20,
        curviness: 0.3,
        hasStones: true,
        hasBorder: true,
        texturePattern: 'stipple',
      }
    case 'ruins':
      return {
        ...base,
        primaryColor: '#7a7a7a',
        secondaryColor: '#5a5a5a',
        accentColor: '#9a9a9a',
        roomCount: 3,
        wallThickness: 2,
        buildingStyle: 'ruins',
        texturePattern: 'noise',
        hasOutline: true,
        outlineColor: '#3a3a3a',
        outlineWidth: 2,
      }
    case 'campsite':
      return {
        ...base,
        primaryColor: '#8a7560',  // Dirt ground
        secondaryColor: '#6a5540',
        accentColor: '#c9a571',   // Tent fabric
        texturePattern: 'stipple',
        borderStyle: 'rough',
        hasFurniture: true,
      }
    // Ground terrain types
    case 'mountains':
      return {
        ...base,
        primaryColor: '#6a5a4a',  // Rock
        secondaryColor: '#8a7a6a', // Lighter rock
        accentColor: '#ffffff',   // Snow peaks
        shadowColor: '#3a2a1a',
        hasOutline: true,
        outlineColor: '#2a1a0a',
        outlineWidth: 1,
      }
    case 'grassland':
      return {
        ...base,
        primaryColor: '#3d7a40',  // Base grass
        secondaryColor: '#5aa050', // Light grass
        accentColor: '#2d5a30',   // Dark grass patches
        shadowColor: '#1e3a1e',
        resolution: 'high',
        texturePattern: 'noise',
        detailLevel: 0.7,
        grassDensity: 0.8,
        hasFlowers: true,
        flowerDensity: 0.3,
        grassBladeSize: 0.6,
        hasPathPatches: false,
      }
    case 'ocean':
      return {
        ...base,
        primaryColor: '#2060a0',  // Deep water
        secondaryColor: '#4080c0', // Shallow water
        accentColor: '#c4b090',   // Sand/islands
        shadowColor: '#103060',
      }
    case 'lake':
      return {
        ...base,
        primaryColor: '#2868a8',  // Deep lake water
        secondaryColor: '#4090c8', // Mid-depth water
        accentColor: '#60b0e8',   // Shallow water
        shadowColor: '#1a4878',   // Very deep
        resolution: 'high',
        lakeStyle: 'natural',
        waterDepthZones: 4,
        hasIslands: true,
        islandCount: 2,
        hasReeds: true,
        reedDensity: 0.6,
        shoreDetail: 0.7,
        hasWaves: true,
        waveIntensity: 0.4,
        hasShoreSand: true,
        waterTransparency: 0.3,
      }
    case 'beach':
      return {
        ...base,
        primaryColor: '#d4b896',  // Sand
        secondaryColor: '#4090c0', // Water
        accentColor: '#e8d8b8',   // Light sand
        shadowColor: '#a08060',
      }
    case 'desert':
      return {
        ...base,
        primaryColor: '#d4a860',  // Sand
        secondaryColor: '#c49040', // Darker sand
        accentColor: '#e8c880',   // Light sand
        shadowColor: '#8a6030',
      }
    case 'snow':
      return {
        ...base,
        primaryColor: '#e8f0f8',  // Snow
        secondaryColor: '#d0e0f0', // Shadow snow
        accentColor: '#f8f8ff',   // Bright snow
        shadowColor: '#a0b0c0',
        outlineColor: '#8090a0',
      }
    case 'swamp':
      return {
        ...base,
        primaryColor: '#4a6040',  // Murky green
        secondaryColor: '#5a7050', // Moss
        accentColor: '#3a5030',   // Dark water
        shadowColor: '#2a3020',
      }
    case 'volcano':
      return {
        ...base,
        primaryColor: '#3a2a2a',  // Dark rock
        secondaryColor: '#ff4400', // Lava
        accentColor: '#ffaa00',   // Hot lava
        shadowColor: '#1a0a0a',
      }
    case 'canyon':
      return {
        ...base,
        primaryColor: '#9a6a4a',  // Canyon rock
        secondaryColor: '#7a5030', // Shadow
        accentColor: '#ba8a6a',   // Highlight
        shadowColor: '#4a3020',
        hasOutline: true,
        outlineColor: '#2a1a0a',
      }
    default:
      return base
  }
}

// Terrain presets for the panel
export const TERRAIN_PRESETS: TerrainPreset[] = [
  // Dungeons Category
  {
    id: 'cave',
    name: 'Cave System',
    terrainType: 'cave',
    icon: 'mdi-cave',
    description: 'Organic cave with natural rock walls',
    category: 'dungeons',
    defaultConfig: getDefaultTerrainConfig('cave'),
    previewColor: '#4a3d3a',
  },
  {
    id: 'dungeon',
    name: 'Dungeon Rooms',
    terrainType: 'dungeon',
    icon: 'mdi-castle',
    description: 'Structured dungeon with connected rooms',
    category: 'dungeons',
    defaultConfig: getDefaultTerrainConfig('dungeon'),
    previewColor: '#3d3d4a',
  },
  {
    id: 'ruins',
    name: 'Ruins',
    terrainType: 'ruins',
    icon: 'mdi-pillar',
    description: 'Crumbling ancient ruins',
    category: 'dungeons',
    defaultConfig: getDefaultTerrainConfig('ruins'),
    previewColor: '#7a7a7a',
  },
  
  // Nature Category
  {
    id: 'treeSingle',
    name: 'Tree',
    terrainType: 'treeSingle',
    icon: 'mdi-tree',
    description: 'Single tree with canopy',
    category: 'nature',
    defaultConfig: getDefaultTerrainConfig('treeSingle'),
    previewColor: '#2d5a2d',
  },
  {
    id: 'treeCluster',
    name: 'Tree Cluster',
    terrainType: 'treeCluster',
    icon: 'mdi-forest',
    description: 'Group of overlapping trees',
    category: 'nature',
    defaultConfig: getDefaultTerrainConfig('treeCluster'),
    previewColor: '#3d6a3d',
  },
  {
    id: 'bush',
    name: 'Bush',
    terrainType: 'bush',
    icon: 'mdi-flower',
    description: 'Shrub or bush',
    category: 'nature',
    defaultConfig: getDefaultTerrainConfig('bush'),
    previewColor: '#4a7a4a',
  },
  {
    id: 'rocks',
    name: 'Rocks',
    terrainType: 'rocks',
    icon: 'mdi-chart-bubble',
    description: 'Rock formation or boulders',
    category: 'nature',
    defaultConfig: getDefaultTerrainConfig('rocks'),
    previewColor: '#6a6a6a',
  },
  
  // Structures Category
  {
    id: 'building',
    name: 'Building Interior',
    terrainType: 'building',
    icon: 'mdi-home-floor-1',
    description: 'Top-down building with rooms and furniture',
    category: 'structures',
    defaultConfig: getDefaultTerrainConfig('building'),
    previewColor: '#8b7355',
  },
  {
    id: 'house',
    name: 'Building (Roof)',
    terrainType: 'house',
    icon: 'mdi-home-roof',
    description: 'Top-down building exterior with roof',
    category: 'structures',
    defaultConfig: getDefaultTerrainConfig('house'),
    previewColor: '#6b4423',
  },
  {
    id: 'campsite',
    name: 'Campsite',
    terrainType: 'campsite',
    icon: 'mdi-campfire',
    description: 'Camping area with tents',
    category: 'structures',
    defaultConfig: getDefaultTerrainConfig('campsite'),
    previewColor: '#8a7560',
  },
  
  // Terrain Category
  {
    id: 'cliff',
    name: 'Cliff Edge',
    terrainType: 'cliff',
    icon: 'mdi-image-filter-hdr',
    description: 'Rocky cliff or elevation change',
    category: 'terrain',
    defaultConfig: getDefaultTerrainConfig('cliff'),
    previewColor: '#7a7060',
  },
  {
    id: 'river',
    name: 'River',
    terrainType: 'river',
    icon: 'mdi-waves',
    description: 'Winding river or stream',
    category: 'terrain',
    defaultConfig: getDefaultTerrainConfig('river'),
    previewColor: '#4a90c0',
  },
  {
    id: 'path',
    name: 'Path',
    terrainType: 'path',
    icon: 'mdi-road',
    description: 'Dirt or stone path',
    category: 'terrain',
    defaultConfig: getDefaultTerrainConfig('path'),
    previewColor: '#8a7560',
  },
  
  // Ground Terrain Category
  {
    id: 'mountains',
    name: 'Mountains',
    terrainType: 'mountains',
    icon: 'mdi-terrain',
    description: 'Mountain range with elevation contours',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('mountains'),
    previewColor: '#6a5a4a',
  },
  {
    id: 'grassland',
    name: 'Grassland',
    terrainType: 'grassland',
    icon: 'mdi-grass',
    description: 'Meadow or plains with grass',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('grassland'),
    previewColor: '#4a8a4a',
  },
  {
    id: 'ocean',
    name: 'Ocean & Islands',
    terrainType: 'ocean',
    icon: 'mdi-island',
    description: 'Sea with scattered islands',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('ocean'),
    previewColor: '#2060a0',
  },
  {
    id: 'lake',
    name: 'Lake',
    terrainType: 'lake',
    icon: 'mdi-water',
    description: 'Lake with surrounding shore',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('lake'),
    previewColor: '#3080b0',
  },
  {
    id: 'beach',
    name: 'Beach',
    terrainType: 'beach',
    icon: 'mdi-beach',
    description: 'Sandy shoreline with waves',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('beach'),
    previewColor: '#d4b896',
  },
  {
    id: 'desert',
    name: 'Desert',
    terrainType: 'desert',
    icon: 'mdi-weather-sunny',
    description: 'Sandy desert with dunes',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('desert'),
    previewColor: '#d4a860',
  },
  {
    id: 'snow',
    name: 'Snow/Ice',
    terrainType: 'snow',
    icon: 'mdi-snowflake',
    description: 'Snowy or icy terrain',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('snow'),
    previewColor: '#e8f0f8',
  },
  {
    id: 'swamp',
    name: 'Swamp',
    terrainType: 'swamp',
    icon: 'mdi-water-opacity',
    description: 'Marshland with murky water',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('swamp'),
    previewColor: '#4a6040',
  },
  {
    id: 'volcano',
    name: 'Volcano',
    terrainType: 'volcano',
    icon: 'mdi-fire',
    description: 'Volcanic terrain with lava',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('volcano'),
    previewColor: '#8a2a1a',
  },
  {
    id: 'canyon',
    name: 'Canyon',
    terrainType: 'canyon',
    icon: 'mdi-arrow-expand-down',
    description: 'Deep canyon or ravine',
    category: 'ground',
    defaultConfig: getDefaultTerrainConfig('canyon'),
    previewColor: '#9a6a4a',
  },
]

// Terrain categories for organized display
export const TERRAIN_CATEGORIES = [
  { id: 'dungeons', name: 'Dungeons', icon: 'mdi-castle' },
  { id: 'nature', name: 'Nature', icon: 'mdi-tree' },
  { id: 'structures', name: 'Structures', icon: 'mdi-home' },
  { id: 'terrain', name: 'Terrain', icon: 'mdi-terrain' },
  { id: 'ground', name: 'Ground', icon: 'mdi-map' },
]
