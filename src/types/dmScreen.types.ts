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
}

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
    
    // For ShapeNode
    shape?: 'circle' | 'square' | 'triangle'
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

// Grid options for DM Screen background
export interface GridOptions {
  showGrid?: boolean
  gridSize?: number // Size of grid cells in pixels
  gridColor?: string // Color of grid lines (hex or rgba)
  gridLineWidth?: number // Width of grid lines
  gridOpacity?: number // Opacity of grid lines (0-1)
  snapToGrid?: boolean // Whether items snap to grid
}

// DM Screen Settings (flexible JSON object)
export interface DmScreenSettings {
  layout?: string
  columns?: number
  theme?: string
  autoSave?: boolean
  grid?: GridOptions
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
]
