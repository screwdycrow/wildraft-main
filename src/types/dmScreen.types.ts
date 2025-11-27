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
