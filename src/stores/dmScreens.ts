import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { dmScreensApi } from '@/api/dmScreens'
import type {
  DmScreen,
  DmScreenItem,
  DmScreenSettings,
  CreateDmScreenPayload,
  UpdateDmScreenPayload,
} from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import type { UserFile } from '@/api/files'

interface CacheMetadata {
  libraryId: number | null
  timestamp: number
}

const ACTIVE_DM_SCREEN_KEY = 'wildraft-active-dm-screen'
const CARDS_IN_HAND_ENABLED_KEY = 'wildraft-cards-in-hand-enabled'

// =====================================================
// CENTRALIZED DEBOUNCE - Single location for all API updates
// =====================================================
let updateDebounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 300

export const useDmScreensStore = defineStore('dmScreens', () => {
  // =====================================================
  // STATE
  // =====================================================
  const dmScreens = ref<DmScreen[]>([])
  const currentDmScreen = ref<DmScreen | null>(null)
  const activeDmScreen = ref<DmScreen | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const cardsInHandEnabled = ref<boolean>(true)
  
  // Selected item state (moved from composable)
  const selectedItemId = ref<string | null>(null)

  // Cache metadata
  const cacheMetadata = ref<CacheMetadata>({
    libraryId: null,
    timestamp: 0,
  })

  // =====================================================
  // LOCAL STORAGE HELPERS
  // =====================================================
  
  const loadActiveDmScreenFromStorage = () => {
    try {
      const stored = localStorage.getItem(ACTIVE_DM_SCREEN_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.libraryId && parsed.dmScreenId) {
          const found = dmScreens.value.find(ds => ds.id === parsed.dmScreenId && ds.libraryId === parsed.libraryId)
          if (found) {
            activeDmScreen.value = found
          }
        }
      }
    } catch (error) {
      console.error('Failed to load active DM screen from localStorage:', error)
      activeDmScreen.value = null
    }
  }

  const loadCardsInHandEnabled = () => {
    try {
      const stored = localStorage.getItem(CARDS_IN_HAND_ENABLED_KEY)
      if (stored !== null) {
        cardsInHandEnabled.value = JSON.parse(stored)
      } else {
        cardsInHandEnabled.value = true
      }
    } catch (error) {
      console.error('Failed to load cards in hand enabled state:', error)
      cardsInHandEnabled.value = true
    }
  }

  // Watch cards in hand enabled and save to localStorage
  watch(cardsInHandEnabled, (newValue) => {
    try {
      localStorage.setItem(CARDS_IN_HAND_ENABLED_KEY, JSON.stringify(newValue))
    } catch (error) {
      console.error('Failed to save cards in hand enabled state:', error)
    }
  })

  // Initialize cards in hand enabled state
  loadCardsInHandEnabled()
  
  // Watch active DM screen and save to localStorage
  watch(activeDmScreen, (newValue) => {
    try {
      if (newValue) {
        localStorage.setItem(ACTIVE_DM_SCREEN_KEY, JSON.stringify({
          libraryId: newValue.libraryId,
          dmScreenId: newValue.id
        }))
      } else {
        localStorage.removeItem(ACTIVE_DM_SCREEN_KEY)
      }
    } catch (error) {
      console.error('Failed to save active DM screen to localStorage:', error)
    }
  }, { deep: true })
  
  // Initialize from storage when dmScreens are loaded
  watch(dmScreens, () => {
    if (dmScreens.value.length > 0) {
      loadActiveDmScreenFromStorage()
    }
  }, { deep: true })

  // =====================================================
  // GETTERS
  // =====================================================
  
  const sortedDmScreens = computed(() => {
    return [...dmScreens.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  const getDmScreenById = computed(() => {
    return (id: string) => dmScreens.value.find((ds) => ds.id === id)
  })
  
  // Get selected item for a DM screen
  const selectedItem = computed(() => {
    if (!selectedItemId.value) return null
    
    // Look in currentDmScreen first, then in dmScreens array
    if (currentDmScreen.value?.items) {
      const item = currentDmScreen.value.items.find(item => item.id === selectedItemId.value)
      if (item) return item
    }
    
    // Also check dmScreens array (in case currentDmScreen is out of sync)
    for (const screen of dmScreens.value) {
      const item = screen.items?.find(item => item.id === selectedItemId.value)
      if (item) return item
    }
    
    return null
  })

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================
  
  function isAlreadyLoaded(libraryId: number): boolean {
    return (
      cacheMetadata.value.libraryId === libraryId &&
      dmScreens.value.length > 0 &&
      Date.now() - cacheMetadata.value.timestamp < 5 * 60 * 1000
    )
  }
  
  // Find DM screen by ID - returns the reference from dmScreens array
  // Also syncs currentDmScreen if it matches
  function findDmScreen(dmScreenId: string): DmScreen | null {
    // Always prefer the dmScreens array as the source of truth
    const screen = dmScreens.value.find(ds => ds.id === dmScreenId)
    
    if (screen) {
      // Keep currentDmScreen in sync if it's the same screen
      if (currentDmScreen.value?.id === dmScreenId) {
        currentDmScreen.value = screen
      }
      // Keep activeDmScreen in sync if it's the same screen
      if (activeDmScreen.value?.id === dmScreenId) {
        activeDmScreen.value = screen
      }
      return screen
    }
    
    // Fallback to currentDmScreen or activeDmScreen if not in array
    if (currentDmScreen.value?.id === dmScreenId) {
      return currentDmScreen.value
    }
    if (activeDmScreen.value?.id === dmScreenId) {
      return activeDmScreen.value
    }
    
    return null
  }

  // =====================================================
  // DEBOUNCED API UPDATE - SINGLE LOCATION
  // =====================================================
  
  /**
   * Queue a debounced API update for a DM screen.
   * This is the ONLY place where API updates are debounced.
   * Local state is updated IMMEDIATELY, API call is debounced.
   */
  function queueApiUpdate(libraryId: number, dmScreenId: string, payload: UpdateDmScreenPayload) {
    // Clear existing timer
    if (updateDebounceTimer) {
      clearTimeout(updateDebounceTimer)
    }
    
    // Set new debounced timer
    updateDebounceTimer = setTimeout(async () => {
      updateDebounceTimer = null
      
      try {
        const response = await dmScreensApi.update(libraryId, dmScreenId, payload)
        
        // Update cache with server response
        const index = dmScreens.value.findIndex((ds) => ds.id === dmScreenId)
        if (index !== -1) {
          dmScreens.value[index] = response.dmScreen
        }
        
        if (currentDmScreen.value?.id === dmScreenId) {
          currentDmScreen.value = response.dmScreen
        }
        
        if (activeDmScreen.value?.id === dmScreenId) {
          activeDmScreen.value = response.dmScreen
        }
        
        // Update cache metadata
        if (cacheMetadata.value.libraryId === libraryId) {
          cacheMetadata.value.timestamp = Date.now()
        }
        
        // Send portal update if needed
        sendPortalUpdate(dmScreenId, response.dmScreen)
        
      } catch (err: any) {
        console.error('[DmScreensStore] Failed to update DM screen:', err)
        error.value = err.response?.data?.error || 'Failed to update DM screen'
      }
    }, DEBOUNCE_MS)
  }
  
  // Send update to portal if this DM screen is being displayed
  async function sendPortalUpdate(dmScreenId: string, dmScreen: DmScreen) {
    try {
      const { usePortalViewsStore } = await import('@/stores/portalViews')
      const { usePortalSocket } = await import('@/composables/usePortalSocket')
      const portalViewsStore = usePortalViewsStore()
      const { sendPortalViewUpdate } = usePortalSocket()
      
      const currentPortalView = portalViewsStore.currentPortalView
      if (currentPortalView?.items) {
        const dmScreenItemIndex = currentPortalView.items.findIndex(
          (item: any) => item.type === 'DmScreenViewer' && item.dmScreenId === dmScreenId
        )
        
        if (dmScreenItemIndex !== -1 && currentPortalView.currentItem === dmScreenItemIndex) {
          sendPortalViewUpdate({
            command: 'update-screen-item',
            dmScreen: dmScreen,
          })
        }
      }
    } catch (error) {
      // Silently fail - portal might not be active
    }
  }

  // =====================================================
  // ITEM ACTIONS - Immediate local update + debounced API
  // =====================================================
  
  /**
   * Update a single item's properties (position, size, rotation, etc.)
   * Local state is updated IMMEDIATELY for smooth UX.
   * API call is debounced.
   */
  function updateItem(
    dmScreenId: string, 
    libraryId: number,
    itemId: string, 
    updates: Partial<DmScreenItem>
  ) {
    const screen = findDmScreen(dmScreenId)
    if (!screen || !screen.items) return
    
    const itemIndex = screen.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return
    
    // IMMEDIATE local update
    const updatedItem = { ...screen.items[itemIndex], ...updates }
    
    // Merge nodeOptions if provided
    if (updates.nodeOptions) {
      updatedItem.nodeOptions = {
        ...screen.items[itemIndex].nodeOptions,
        ...updates.nodeOptions,
      }
    }
    
    screen.items[itemIndex] = updatedItem
    
    // Queue debounced API update
    queueApiUpdate(libraryId, dmScreenId, { items: screen.items })
  }
  
  /**
   * Update item position (drag)
   */
  function updateItemPosition(
    dmScreenId: string,
    libraryId: number,
    itemId: string,
    x: number,
    y: number
  ) {
    updateItem(dmScreenId, libraryId, itemId, {
      nodeOptions: { x, y, position: { x, y } }
    })
  }
  
  /**
   * Update item dimensions (resize)
   */
  function updateItemDimensions(
    dmScreenId: string,
    libraryId: number,
    itemId: string,
    width: number,
    height: number,
    x?: number,
    y?: number
  ) {
    const updates: Partial<DmScreenItem> = {
      nodeOptions: { width, height }
    }
    
    // If position changed during resize (from top/left edges)
    if (x !== undefined && y !== undefined) {
      updates.nodeOptions!.x = x
      updates.nodeOptions!.y = y
      updates.nodeOptions!.position = { x, y }
    }
    
    updateItem(dmScreenId, libraryId, itemId, updates)
  }
  
  /**
   * Update item rotation
   */
  function updateItemRotation(
    dmScreenId: string,
    libraryId: number,
    itemId: string,
    rotation: number
  ) {
    updateItem(dmScreenId, libraryId, itemId, {
      nodeOptions: { rotation }
    })
  }
  
  /**
   * Add a new item to DM screen
   */
  function addItem(dmScreenId: string, libraryId: number, newItem: DmScreenItem) {
    const screen = findDmScreen(dmScreenId)
    if (!screen) return
    
    // IMMEDIATE local update
    if (!screen.items) {
      screen.items = []
    }
    screen.items.push(newItem)
    
    // Queue debounced API update
    queueApiUpdate(libraryId, dmScreenId, { items: screen.items })
  }
  
  /**
   * Delete an item from DM screen
   */
  function deleteItem(dmScreenId: string, libraryId: number, itemId: string) {
    const screen = findDmScreen(dmScreenId)
    if (!screen || !screen.items) return
    
    // Clear selection if deleting selected item
    if (selectedItemId.value === itemId) {
      selectedItemId.value = null
    }
    
    // IMMEDIATE local update
    screen.items = screen.items.filter(item => item.id !== itemId)
    
    // Queue debounced API update
    queueApiUpdate(libraryId, dmScreenId, { items: screen.items })
  }
  
  /**
   * Duplicate an item
   */
  function duplicateItem(dmScreenId: string, libraryId: number, itemId: string) {
    const screen = findDmScreen(dmScreenId)
    if (!screen || !screen.items) return
    
    const item = screen.items.find(i => i.id === itemId)
    if (!item) return
    
    // Create a deep copy with new ID and offset position
    const newItem: DmScreenItem = {
      ...JSON.parse(JSON.stringify(item)),
      id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nodeOptions: {
        ...item.nodeOptions,
        x: (item.nodeOptions?.x || 0) + 30,
        y: (item.nodeOptions?.y || 0) + 30,
        position: {
          x: (item.nodeOptions?.x || 0) + 30,
          y: (item.nodeOptions?.y || 0) + 30,
        },
      },
    }
    
    // IMMEDIATE local update
    screen.items.push(newItem)
    
    // Select the new item
    selectedItemId.value = newItem.id
    
    // Queue debounced API update
    queueApiUpdate(libraryId, dmScreenId, { items: screen.items })
  }
  
  /**
   * Update all items (bulk update)
   */
  function updateAllItems(dmScreenId: string, libraryId: number, items: DmScreenItem[]) {
    const screen = findDmScreen(dmScreenId)
    if (!screen) return
    
    // IMMEDIATE local update
    screen.items = items
    
    // Queue debounced API update
    queueApiUpdate(libraryId, dmScreenId, { items })
  }
  
  /**
   * Update settings
   */
  function updateSettings(dmScreenId: string, libraryId: number, settings: DmScreenSettings) {
    const screen = findDmScreen(dmScreenId)
    if (!screen) return
    
    // IMMEDIATE local update
    screen.settings = { ...screen.settings, ...settings }
    
    // Queue debounced API update
    queueApiUpdate(libraryId, dmScreenId, { settings: screen.settings })
  }
  
  /**
   * Select an item
   */
  function selectItem(itemId: string | null) {
    selectedItemId.value = itemId
  }
  
  /**
   * Send item to back (z-index)
   */
  function sendToBack(dmScreenId: string, libraryId: number, itemId: string) {
    updateItem(dmScreenId, libraryId, itemId, {
      nodeOptions: { zIndex: -2 }
    })
  }
  
  /**
   * Send item to front (z-index)
   */
  function sendToFront(dmScreenId: string, libraryId: number, itemId: string) {
    updateItem(dmScreenId, libraryId, itemId, {
      nodeOptions: { zIndex: 100 }
    })
  }

  // =====================================================
  // ADD ITEM HELPERS
  // =====================================================
  
  function addTextNode(dmScreenId: string, libraryId: number, position: { x: number; y: number }) {
    const newItem: DmScreenItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'TextNode',
      data: {
        text: 'Double-click to edit',
        fontSize: 16,
        fontWeight: 'normal',
        textColor: '#ffffff',
        textAlign: 'center',
      },
      nodeOptions: {
        x: position.x,
        y: position.y,
        position: position,
        width: 200,
        height: 100,
        resizable: true,
      },
      isMinimized: false,
    }
    
    addItem(dmScreenId, libraryId, newItem)
    return newItem
  }
  
  function addShapeNode(dmScreenId: string, libraryId: number, position: { x: number; y: number }) {
    const newItem: DmScreenItem = {
      id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ShapeNode',
      data: {
        shape: 'circle',
        color: '#6366f1',
        opacity: 0.8,
        borderColor: '#ffffff',
        borderWidth: 2,
        label: '',
      },
      nodeOptions: {
        x: position.x,
        y: position.y,
        position: position,
        width: 150,
        height: 150,
        resizable: true,
      },
      isMinimized: false,
    }
    
    addItem(dmScreenId, libraryId, newItem)
    return newItem
  }
  
  function addBackgroundImage(
    dmScreenId: string, 
    libraryId: number, 
    fileId: number, 
    position: { x: number; y: number },
    dimensions: { width: number; height: number }
  ) {
    const newItem: DmScreenItem = {
      id: `background-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'UserFileId',
      data: {
        id: fileId,
        isBackground: true,
      },
      nodeOptions: {
        x: position.x,
        y: position.y,
        position: position,
        width: dimensions.width,
        height: dimensions.height,
        resizable: true,
      },
      isMinimized: false,
    }
    
    addItem(dmScreenId, libraryId, newItem)
    return newItem
  }
  
  function addUserFile(
    dmScreenId: string, 
    libraryId: number, 
    fileId: number, 
    position: { x: number; y: number }
  ) {
    const newItem: DmScreenItem = {
      id: `userfile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'UserFileId',
      data: {
        id: fileId,
        isBackground: false,
      },
      nodeOptions: {
        x: position.x,
        y: position.y,
        position: position,
        width: 300,
        height: 400,
        resizable: true,
      },
      isMinimized: false,
    }
    
    addItem(dmScreenId, libraryId, newItem)
    return newItem
  }

  // =====================================================
  // API ACTIONS (non-debounced, direct calls)
  // =====================================================

  async function fetchDmScreens(libraryId: number, forceRefresh: boolean = false) {
    if (!forceRefresh && isAlreadyLoaded(libraryId)) {
      return dmScreens.value
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await dmScreensApi.getAll(libraryId)
      dmScreens.value = response.dmScreens

      cacheMetadata.value = {
        libraryId,
        timestamp: Date.now(),
      }

      loadActiveDmScreenFromStorage()
      return dmScreens.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch DM screens'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchDmScreen(libraryId: number, dmScreenId: string, forceRefresh: boolean = false) {
    if (!forceRefresh) {
      const cached = getDmScreenById.value(dmScreenId)
      if (cached && cacheMetadata.value.libraryId === libraryId) {
        currentDmScreen.value = cached
        return cached
      }
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await dmScreensApi.getById(libraryId, dmScreenId)
      currentDmScreen.value = response.dmScreen

      const index = dmScreens.value.findIndex((ds) => ds.id === dmScreenId)
      if (index !== -1) {
        dmScreens.value[index] = response.dmScreen
      } else {
        dmScreens.value.push(response.dmScreen)
      }

      return response.dmScreen
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch DM screen'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createDmScreen(libraryId: number, payload: CreateDmScreenPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await dmScreensApi.create(libraryId, payload)
      dmScreens.value.unshift(response.dmScreen)

      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }

      return response.dmScreen
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create DM screen'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Direct API update (non-debounced) - for critical updates
  async function updateDmScreen(
    libraryId: number,
    dmScreenId: string,
    payload: UpdateDmScreenPayload
  ) {
    isLoading.value = true
    error.value = null
    try {
      const response = await dmScreensApi.update(libraryId, dmScreenId, payload)

      const index = dmScreens.value.findIndex((ds) => ds.id === dmScreenId)
      if (index !== -1) {
        dmScreens.value[index] = response.dmScreen
      }

      if (currentDmScreen.value?.id === dmScreenId) {
        currentDmScreen.value = response.dmScreen
      }

      if (activeDmScreen.value?.id === dmScreenId) {
        activeDmScreen.value = response.dmScreen
      }

      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }

      sendPortalUpdate(dmScreenId, response.dmScreen)

      return response.dmScreen
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update DM screen'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteDmScreen(libraryId: number, dmScreenId: string) {
    isLoading.value = true
    error.value = null
    try {
      await dmScreensApi.delete(libraryId, dmScreenId)

      const index = dmScreens.value.findIndex((ds) => ds.id === dmScreenId)
      if (index !== -1) {
        dmScreens.value.splice(index, 1)
      }

      if (currentDmScreen.value?.id === dmScreenId) {
        currentDmScreen.value = null
      }

      if (activeDmScreen.value?.id === dmScreenId) {
        activeDmScreen.value = null
      }

      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete DM screen'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setActiveDmScreen(dmScreen: DmScreen | null) {
    activeDmScreen.value = dmScreen
  }

  // =====================================================
  // CONVERSION HELPERS
  // =====================================================

  function convertLibraryItemToDmScreenItem(
    libraryItem: LibraryItem,
    featuredImageUrl?: string | null,
    order?: number
  ): DmScreenItem {
    if (order === undefined && activeDmScreen.value?.items) {
      const libraryItems = activeDmScreen.value.items.filter(item => item.type === 'LibraryItemId')
      const maxOrder = libraryItems.reduce((max, item) => {
        return Math.max(max, item.order ?? -1)
      }, -1)
      order = maxOrder + 1
    } else if (order === undefined) {
      order = 0
    }

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'LibraryItemId',
      order,
      data: {
        id: libraryItem.id,
        featuredImageUrl: featuredImageUrl || undefined,
      },
      nodeOptions: {
        x: 0,
        y: 0,
        position: { x: 0, y: 0 },
        width: 300,
        height: 200,
        draggable: true,
        selected: false,
        resizable: true,
      },
      isMinimized: false,
    }
  }

  function convertUserFileToDmScreenItem(userFile: UserFile): DmScreenItem {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'UserFileId',
      data: {
        id: userFile.id,
      },
      nodeOptions: {
        x: 0,
        y: 0,
        position: { x: 0, y: 0 },
        width: 300,
        height: 200,
        draggable: true,
        selected: false,
        resizable: true,
      },
      isMinimized: false,
    }
  }

  function clearCache() {
    dmScreens.value = []
    currentDmScreen.value = null
    cacheMetadata.value = {
      libraryId: null,
      timestamp: 0,
    }
  }

  function setCardsInHandEnabled(enabled: boolean) {
    cardsInHandEnabled.value = enabled
  }

  function toggleCardsInHand() {
    cardsInHandEnabled.value = !cardsInHandEnabled.value
  }

  return {
    // State
    dmScreens,
    currentDmScreen,
    activeDmScreen,
    isLoading,
    error,
    cardsInHandEnabled,
    selectedItemId,
    
    // Getters
    sortedDmScreens,
    getDmScreenById,
    selectedItem,
    
    // Item Actions (debounced)
    updateItem,
    updateItemPosition,
    updateItemDimensions,
    updateItemRotation,
    addItem,
    deleteItem,
    duplicateItem,
    updateAllItems,
    updateSettings,
    selectItem,
    sendToBack,
    sendToFront,
    
    // Add Item Helpers
    addTextNode,
    addShapeNode,
    addBackgroundImage,
    addUserFile,
    
    // API Actions
    fetchDmScreens,
    fetchDmScreen,
    createDmScreen,
    updateDmScreen,
    deleteDmScreen,
    setActiveDmScreen,
    
    // Conversion Helpers
    convertLibraryItemToDmScreenItem,
    convertUserFileToDmScreenItem,
    
    // Other
    clearCache,
    setCardsInHandEnabled,
    toggleCardsInHand,
  }
})
