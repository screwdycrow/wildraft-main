import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { portalViewsApi } from '@/api/portalViews'
import type { UserFile } from '@/api/files'
import type {
  LibraryPortalView,
  CreatePortalViewPayload,
  UpdatePortalViewPayload,
  ActivePortalState,
  PortalViewItem,
  PortalViewItemType,
} from '@/types/portal.types'

interface CacheMetadata {
  libraryId: number | null
  timestamp: number
}

const ACTIVE_PORTAL_KEY = 'wildraft-active-portal'

export const usePortalViewsStore = defineStore('portalViews', () => {
  // State
  const portalViews = ref<LibraryPortalView[]>([])
  const currentPortalView = ref<LibraryPortalView | null>(null)
  const activePortal = ref<ActivePortalState | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache metadata
  const cacheMetadata = ref<CacheMetadata>({
    libraryId: null,
    timestamp: 0,
  })
  
  // Load active portal from localStorage on init
  const loadActivePortalFromStorage = () => {
    try {
      const stored = localStorage.getItem(ACTIVE_PORTAL_KEY)
      if (stored) {
        activePortal.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load active portal from localStorage:', error)
      activePortal.value = null
    }
  }
  
  // Watch active portal and save to localStorage
  watch(activePortal, (newValue) => {
    try {
      if (newValue) {
        localStorage.setItem(ACTIVE_PORTAL_KEY, JSON.stringify(newValue))
      } else {
        localStorage.removeItem(ACTIVE_PORTAL_KEY)
      }
    } catch (error) {
      console.error('Failed to save active portal to localStorage:', error)
    }
  }, { deep: true })
  
  // Initialize from storage
  loadActivePortalFromStorage()

  // Getters
  const sortedPortalViews = computed(() => {
    return [...portalViews.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  const getPortalViewById = computed(() => {
    return (id: string) => portalViews.value.find((pv) => pv.id === id)
  })

  // Helper: Check if portal views are already loaded for this library
  function isAlreadyLoaded(libraryId: number): boolean {
    return (
      cacheMetadata.value.libraryId === libraryId &&
      portalViews.value.length > 0 &&
      Date.now() - cacheMetadata.value.timestamp < 5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Actions
  async function fetchPortalViews(libraryId: number, forceRefresh: boolean = false) {
    // Check if already loaded (unless force refresh)
    if (!forceRefresh && isAlreadyLoaded(libraryId)) {
      console.log('Portal views already loaded from cache, skipping API call')
      return portalViews.value
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await portalViewsApi.getAll(libraryId)
      portalViews.value = response.portalViews

      // Update cache metadata
      cacheMetadata.value = {
        libraryId,
        timestamp: Date.now(),
      }

      return portalViews.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch portal views'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPortalView(libraryId: number, portalViewId: string, forceRefresh: boolean = false) {
    // Check if already loaded in cache
    if (!forceRefresh) {
      const cached = getPortalViewById.value(portalViewId)
      if (cached && cacheMetadata.value.libraryId === libraryId) {
        currentPortalView.value = cached
        return cached
      }
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await portalViewsApi.getById(libraryId, portalViewId)
      currentPortalView.value = response.portalView

      // Update in cache if it exists
      const index = portalViews.value.findIndex((pv) => pv.id === portalViewId)
      if (index !== -1) {
        portalViews.value[index] = response.portalView
      } else {
        portalViews.value.push(response.portalView)
      }

      return response.portalView
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch portal view'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createPortalView(libraryId: number, payload: CreatePortalViewPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await portalViewsApi.create(libraryId, payload)

      // Add to cache
      portalViews.value.unshift(response.portalView)

      // Update cache metadata
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }

      return response.portalView
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create portal view'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updatePortalView(
    libraryId: number,
    portalViewId: string,
    payload: UpdatePortalViewPayload
  ) {
    isLoading.value = true
    error.value = null
    try {
      const response = await portalViewsApi.update(libraryId, portalViewId, payload)

      // Update in cache
      const index = portalViews.value.findIndex((pv) => pv.id === portalViewId)
      if (index !== -1) {
        portalViews.value[index] = response.portalView
      }

      if (currentPortalView.value?.id === portalViewId) {
        currentPortalView.value = response.portalView
      }

      // Update cache metadata
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }

      return response.portalView
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update portal view'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deletePortalView(libraryId: number, portalViewId: string) {
    isLoading.value = true
    error.value = null
    try {
      await portalViewsApi.delete(libraryId, portalViewId)

      // Remove from cache
      portalViews.value = portalViews.value.filter((pv) => pv.id !== portalViewId)

      if (currentPortalView.value?.id === portalViewId) {
        currentPortalView.value = null
      }

      // Update cache metadata
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete portal view'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearPortalViews() {
    portalViews.value = []
    currentPortalView.value = null
    cacheMetadata.value = {
      libraryId: null,
      timestamp: 0,
    }
  }

  function clearError() {
    error.value = null
  }

  // Force refresh function
  async function refreshPortalViews(libraryId: number) {
    return fetchPortalViews(libraryId, true)
  }
  
  // Set active portal
  function setActivePortal(portalView: LibraryPortalView | null) {
    if (portalView) {
      activePortal.value = {
        portalViewId: portalView.id,
        libraryId: portalView.libraryId,
        name: portalView.name,
      }
    } else {
      activePortal.value = null
    }
  }
  
  // Clear active portal
  function clearActivePortal() {
    activePortal.value = null
  }
  
  // Helper: Map UserFile to PortalViewItem
  function mapUserFileToPortalViewItem(userFile: UserFile): PortalViewItem {
    // Determine type based on file type
    let type: PortalViewItemType = 'ImageViewer'
    
    if (userFile.fileType.startsWith('video/')) {
      type = 'VideoViewer'
    } else if (userFile.fileType.includes('pdf')) {
      type = 'PDFViewer'
    } else if (userFile.fileType.startsWith('image/')) {
      type = 'ImageViewer'
    }
    
    // Generate unique ID for this portal view item
    const itemId = `file-${userFile.id}-${Date.now()}`
    
    return {
      id: itemId,
      type,
      object: userFile, // Store the entire UserFile object
    }
  }
  
  // Helper: Map DM Screen to PortalViewItem
  function mapDmScreenToPortalViewItem(dmScreen: { id: string; libraryId: number }): PortalViewItem {
    // Generate unique ID for this portal view item
    const itemId = `dmscreen-${dmScreen.id}-${Date.now()}`
    
    return {
      id: itemId,
      type: 'DmScreenViewer',
      dmScreenId: dmScreen.id,
      libraryId: dmScreen.libraryId,
    }
  }
  
  // Add item to active portal and set it as current
  async function addItemToActivePortal(userFile: UserFile, setAsCurrent: boolean = true) {
    if (!activePortal.value) {
      throw new Error('No active portal set')
    }
    
    const { libraryId, portalViewId } = activePortal.value
    
    // Fetch current portal view
    await fetchPortalView(libraryId, portalViewId)
    
    if (!currentPortalView.value) {
      throw new Error('Failed to load current portal view')
    }
    
    // Map UserFile to PortalViewItem
    const newItem = mapUserFileToPortalViewItem(userFile)
    
    // Get current items or initialize empty array
    const currentItems = currentPortalView.value.items || []
    
    // Add new item to the list
    const updatedItems = [...currentItems, newItem]
    
    // Determine the new current item index
    const newCurrentItem = setAsCurrent ? updatedItems.length - 1 : currentPortalView.value.currentItem || 0
    
    // Update portal view
    const updated = await updatePortalView(libraryId, portalViewId, {
      items: updatedItems,
      currentItem: newCurrentItem,
    })
    
    // Send socket command to change item
    try {
      const { usePortalSocket } = await import('@/composables/usePortalSocket')
      const { sendPortalViewUpdate } = usePortalSocket()
      sendPortalViewUpdate({
        command: 'change-item',
        itemIndex: newCurrentItem,
      })
    } catch (error) {
      console.error('[Portal Store] Failed to send item change command:', error)
    }
    
    return newItem
  }
  
  // Add DM screen to active portal and set it as current
  async function addDmScreenToActivePortal(dmScreen: { id: string; libraryId: number }, setAsCurrent: boolean = true) {
    if (!activePortal.value) {
      throw new Error('No active portal set')
    }
    
    const { libraryId, portalViewId } = activePortal.value
    
    // Fetch current portal view
    await fetchPortalView(libraryId, portalViewId)
    
    if (!currentPortalView.value) {
      throw new Error('Failed to load current portal view')
    }
    
    // Map DM Screen to PortalViewItem
    const newItem = mapDmScreenToPortalViewItem(dmScreen)
    
    // Get current items or initialize empty array
    const currentItems = currentPortalView.value.items || []
    
    // Add new item to the list
    const updatedItems = [...currentItems, newItem]
    
    // Determine the new current item index
    const newCurrentItem = setAsCurrent ? updatedItems.length - 1 : currentPortalView.value.currentItem || 0
    
    // Update portal view
    const updated = await updatePortalView(libraryId, portalViewId, {
      items: updatedItems,
      currentItem: newCurrentItem,
    })
    
    // Send socket command to change item
    try {
      const { usePortalSocket } = await import('@/composables/usePortalSocket')
      const { sendPortalViewUpdate } = usePortalSocket()
      sendPortalViewUpdate({
        command: 'change-item',
        itemIndex: newCurrentItem,
      })
    } catch (error) {
      console.error('[Portal Store] Failed to send item change command:', error)
    }
    
    return newItem
  }

  return {
    // State
    portalViews,
    currentPortalView,
    activePortal,
    isLoading,
    error,

    // Getters
    sortedPortalViews,
    getPortalViewById,

    // Actions
    fetchPortalViews,
    fetchPortalView,
    createPortalView,
    updatePortalView,
    deletePortalView,
    clearPortalViews,
    clearError,
    refreshPortalViews,
    isAlreadyLoaded,
    setActivePortal,
    clearActivePortal,
    mapUserFileToPortalViewItem,
    addItemToActivePortal,
    mapDmScreenToPortalViewItem,
    addDmScreenToActivePortal,
  }
})

