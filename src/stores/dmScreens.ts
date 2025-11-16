import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { dmScreensApi } from '@/api/dmScreens'
import type {
  DmScreen,
  DmScreenItem,
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

export const useDmScreensStore = defineStore('dmScreens', () => {
  // State
  const dmScreens = ref<DmScreen[]>([])
  const currentDmScreen = ref<DmScreen | null>(null)
  const activeDmScreen = ref<DmScreen | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cache metadata
  const cacheMetadata = ref<CacheMetadata>({
    libraryId: null,
    timestamp: 0,
  })
  
  // Load active DM screen from localStorage on init
  const loadActiveDmScreenFromStorage = () => {
    try {
      const stored = localStorage.getItem(ACTIVE_DM_SCREEN_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Find the DM screen in the current list
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

  // Getters
  const sortedDmScreens = computed(() => {
    return [...dmScreens.value].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  const getDmScreenById = computed(() => {
    return (id: string) => dmScreens.value.find((ds) => ds.id === id)
  })

  // Helper: Check if DM screens are already loaded for this library
  function isAlreadyLoaded(libraryId: number): boolean {
    return (
      cacheMetadata.value.libraryId === libraryId &&
      dmScreens.value.length > 0 &&
      Date.now() - cacheMetadata.value.timestamp < 5 * 60 * 1000 // 5 minutes cache
    )
  }

  // Actions
  async function fetchDmScreens(libraryId: number, forceRefresh: boolean = false) {
    // Check if already loaded (unless force refresh)
    if (!forceRefresh && isAlreadyLoaded(libraryId)) {
      console.log('DM screens already loaded from cache, skipping API call')
      return dmScreens.value
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await dmScreensApi.getAll(libraryId)
      dmScreens.value = response.dmScreens

      // Update cache metadata
      cacheMetadata.value = {
        libraryId,
        timestamp: Date.now(),
      }

      // Reload active DM screen from storage after fetching
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
    // Check if already loaded in cache
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

      // Update in cache if it exists
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

      // Add to cache
      dmScreens.value.unshift(response.dmScreen)

      // Update cache metadata
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

  async function updateDmScreen(
    libraryId: number,
    dmScreenId: string,
    payload: UpdateDmScreenPayload
  ) {
    isLoading.value = true
    error.value = null
    try {
      const response = await dmScreensApi.update(libraryId, dmScreenId, payload)

      // Update in cache
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

      // Remove from cache
      const index = dmScreens.value.findIndex((ds) => ds.id === dmScreenId)
      if (index !== -1) {
        dmScreens.value.splice(index, 1)
      }

      // Clear current if it was deleted
      if (currentDmScreen.value?.id === dmScreenId) {
        currentDmScreen.value = null
      }

      // Clear active if it was deleted
      if (activeDmScreen.value?.id === dmScreenId) {
        activeDmScreen.value = null
      }

      // Update cache metadata
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

  /**
   * Convert a LibraryItem to a DmScreenItem
   */
  function convertLibraryItemToDmScreenItem(
    libraryItem: LibraryItem,
    featuredImageUrl?: string | null
  ): DmScreenItem {
    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'LibraryItemId',
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

  /**
   * Convert a UserFile to a DmScreenItem
   */
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

  return {
    // State
    dmScreens,
    currentDmScreen,
    activeDmScreen,
    isLoading,
    error,
    // Getters
    sortedDmScreens,
    getDmScreenById,
    // Actions
    fetchDmScreens,
    fetchDmScreen,
    createDmScreen,
    updateDmScreen,
    deleteDmScreen,
    setActiveDmScreen,
    convertLibraryItemToDmScreenItem,
    convertUserFileToDmScreenItem,
    clearCache,
  }
})

