export type PortalViewItemType = 
  | 'libraryItemViewer' 
  | 'VideoViewer' 
  | 'ImageViewer' 
  | 'PDFViewer'
  | 'DmScreenViewer'

export interface PortalViewItem {
  id: string
  type: PortalViewItemType
  [key: string]: any // Allow any additional JSON properties
}

export interface LibraryPortalView {
  id: string // UUID
  libraryId: number
  name: string
  showEncounter: boolean
  showHealth: boolean
  showAC: boolean
  showActions: boolean
  autoResetImageState: boolean
  combatEncounterId: number | null
  currentItem: number | null
  items: PortalViewItem[] | null
  combatEncounter?: {
    id: number
    name: string
    round?: number
    initativeCount?: number
  } | null
  createdAt: string
  updatedAt: string
}

export interface CreatePortalViewPayload {
  name: string
  showEncounter?: boolean
  showHealth?: boolean
  showAC?: boolean
  showActions?: boolean
  autoResetImageState?: boolean
  combatEncounterId?: number | null
  currentItem?: number | null
  items?: PortalViewItem[]
}

export interface UpdatePortalViewPayload {
  name?: string
  showEncounter?: boolean
  showHealth?: boolean
  showAC?: boolean
  showActions?: boolean
  autoResetImageState?: boolean
  combatEncounterId?: number | null
  currentItem?: number | null
  items?: PortalViewItem[]
}

export interface PortalViewsListResponse {
  portalViews: LibraryPortalView[]
}

export interface PortalViewResponse {
  portalView: LibraryPortalView
}

// Active Portal State (stored in localStorage and Pinia)
export interface ActivePortalState {
  portalViewId: string
  libraryId: number
  name: string
}

// Viewer State for Image Viewer (mirrors ImageViewer.vue ViewerState)
export interface ViewerState {
  timestamp: number
  scale: number
  position: { x: number; y: number }
  rotation: number
  showGrid: boolean
  gridSize: number
  gridColor: string
  gridOpacity: number
  combatLock?: boolean // Optional for backwards compatibility
}

// Portal Control Commands
export type PortalCommand = 
  | 'next-item'
  | 'previous-item'
  | 'change-item'
  | 'reset-view'
  | 'restore-state'
  | 'zoom-in'
  | 'zoom-out'
  | 'rotate'
  | 'toggle-encounter'
  | 'toggle-grid'
  | 'update-viewer-state'
  | 'toggle-combat-lock'
  | 'show-on-top'
  | 'hide-on-top'
  | 'refetch-encounter'
  | 'update-screen-item'
  | 'dm-screen-zoom-in'
  | 'dm-screen-zoom-out'
  | 'dm-screen-pan'
  | 'dm-screen-reset-view'

