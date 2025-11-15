import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { itemsApi } from '@/api/items'
import type { UserFile } from '@/api/files'
import type { 
  LibraryItem, 
  CreateLibraryItemPayload, 
  UpdateLibraryItemPayload 
} from '@/types/item.types'
import { useFilesStore } from './files'

interface CacheMetadata {
  libraryId: number | null
  params: string
  timestamp: number
}

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<LibraryItem[]>([])
  const currentItem = ref<LibraryItem | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)
  
  // Cache metadata (not persisted, just for runtime checks)
  const cacheMetadata = ref<CacheMetadata>({
    libraryId: null,
    params: '',
    timestamp: 0
  })

  // Getters
  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  const getItemsByType = computed(() => (type: string) => {
    return items.value.filter(item => item.type === type)
  })

  const getItemsByTag = computed(() => (tagId: number) => {
    return items.value.filter(item => 
      item.tags?.some(tag => tag.id === tagId)
    )
  })

  const getItemById = computed(() => (id: number) => {
    return items.value.find(item => item.id === id)
  })

  // Helper: Check if items are already loaded for this library
  // We don't check params because all items are stored together and filtered client-side
  function isAlreadyLoaded(libraryId: number, _params?: Record<string, any>): boolean {
    // Check if we have items for this library
    if (cacheMetadata.value.libraryId !== libraryId) return false
    if (items.value.length === 0) return false
    
    // If we have items and the library matches, they're already loaded
    // (params don't matter since we filter client-side)
    return true
  }

  // Helper: Serialize params for comparison
  function serializeParams(params?: Record<string, any>): string {
    if (!params) return ''
    const sorted = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)
    return JSON.stringify(sorted)
  }

  // Helper: Extract and cache UserFiles from items
  const extractAndCacheUserFiles = (items: LibraryItem[]) => {
    const filesStore = useFilesStore()
    const filesToAdd: UserFile[] = []
    
    items.forEach(item => {
      // Extract userFiles array if it exists
      if (item.userFiles && Array.isArray(item.userFiles)) {
        item.userFiles.forEach(file => {
          filesToAdd.push(file)
          // Cache download URL if it exists
          if (file.downloadUrl) {
            filesStore.cacheDownloadUrl(file.id, file.downloadUrl, true)
          }
        })
      }
      
      // Extract featuredImage if it exists
      if (item.featuredImage) {
        filesToAdd.push(item.featuredImage)
        // Cache download URL if it exists
        if (item.featuredImage.downloadUrl) {
          filesStore.cacheDownloadUrl(item.featuredImage.id, item.featuredImage.downloadUrl, true)
        }
      }
    })
    
    // Add all files to the files store
    if (filesToAdd.length > 0) {
      filesStore.addFiles(filesToAdd)
    }
  }

  // Actions
  async function fetchItems(
    libraryId: number, 
    params?: { 
      type?: string 
      tagIds?: number[]
      search?: string
      limit?: number
      offset?: number
    },
    forceRefresh: boolean = false
  ) {
    // Check if already loaded (unless force refresh)
    if (!forceRefresh && isAlreadyLoaded(libraryId, params)) {
      console.log('Items already loaded from cache, skipping API call')
      return items.value
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await itemsApi.getAll(libraryId, params)
      
      // Update cached items with API response
      items.value = response.items
      total.value = response.total
      
      // Extract and cache UserFiles from items
      extractAndCacheUserFiles(response.items)
      
      // Update cache metadata
      cacheMetadata.value = {
        libraryId,
        params: serializeParams(params),
        timestamp: Date.now()
      }
      
      return response.items
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch items'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchItem(libraryId: number, itemId: number, forceRefresh: boolean = false) {
    // Check if item is already in cached items
    if (!forceRefresh) {
      const existingItem = items.value.find(item => item.id === itemId)
      if (existingItem) {
        if (currentItem.value?.id === itemId) {
          console.log('Item already loaded from cache, skipping API call')
          return currentItem.value
        }
        // Update current item from cache
        currentItem.value = existingItem
        return existingItem
      }
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await itemsApi.getById(libraryId, itemId)
      
      // Update cached items with API response
      currentItem.value = response.item
      
      const index = items.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        // Update existing item in cache
        items.value[index] = response.item
      } else {
        // Add new item to cache
        items.value.push(response.item)
      }
      
      // Extract and cache UserFiles from the item
      extractAndCacheUserFiles([response.item])
      
      return response.item
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createItem(libraryId: number, payload: CreateLibraryItemPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await itemsApi.create(libraryId, payload)
      
      // Update cached items with API response
      items.value.unshift(response.item)
      total.value++
      
      // Extract and cache UserFiles from the item
      extractAndCacheUserFiles([response.item])
      
      // Invalidate cache metadata (items changed, might need refresh)
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.params = '' // Force reload on next fetch
      }
      
      return response.item
      
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateItem(libraryId: number, itemId: number, payload: UpdateLibraryItemPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await itemsApi.update(libraryId, itemId, payload)
      
      // Update cached items with API response
      const index = items.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        items.value[index] = response.item
      }
      if (currentItem.value?.id === itemId) {
        currentItem.value = response.item
      }
      
      // Extract and cache UserFiles from the item
      extractAndCacheUserFiles([response.item])
      
      return response.item
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteItem(libraryId: number, itemId: number) {
    isLoading.value = true
    error.value = null
    try {
      await itemsApi.delete(libraryId, itemId)
      
      // Update cached items (remove deleted item)
      items.value = items.value.filter(item => item.id !== itemId)
      if (currentItem.value?.id === itemId) {
        currentItem.value = null
      }
      total.value--
      
      // Invalidate cache metadata (items changed)
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.params = '' // Force reload on next fetch
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete item'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function attachFile(libraryId: number, itemId: number, fileId: number) {
    error.value = null
    try {
      await itemsApi.attachFile(libraryId, itemId, fileId)
      
      // Refresh item to get updated file list from API, then update cache
      const existingItem = items.value.find(item => item.id === itemId)
      if (!existingItem || !existingItem.userFiles?.some(f => f.id === fileId)) {
        await fetchItem(libraryId, itemId, true) // Force refresh to get updated file list
      } else {
        await fetchItem(libraryId, itemId) // Will use cache if available
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to attach file'
      throw err
    }
  }

  async function detachFile(libraryId: number, itemId: number, fileId: number) {
    error.value = null
    try {
      await itemsApi.detachFile(libraryId, itemId, fileId)
      
      // Update local state
      if (currentItem.value?.id === itemId) {
        currentItem.value.userFiles = currentItem.value.userFiles?.filter(f => f.id !== fileId) || []
      }
      
      const itemIndex = items.value.findIndex(item => item.id === itemId)
      if (itemIndex !== -1) {
        items.value[itemIndex].userFiles = items.value[itemIndex].userFiles?.filter(f => f.id !== fileId) || []
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to detach file'
      throw err
    }
  }

  function setCurrentItem(item: LibraryItem | null) {
    currentItem.value = item
  }

  function clearError() {
    error.value = null
  }

  function clearItems() {
    items.value = []
    currentItem.value = null
    total.value = 0
    cacheMetadata.value = {
      libraryId: null,
      params: '',
      timestamp: 0
    }
  }

  // Force refresh function
  async function refreshItems(libraryId: number, params?: Record<string, any>) {
    return fetchItems(libraryId, params, true)
  }

  async function batchAddTags(libraryId: number, itemIds: number[], tagIds: number[]) {
    isLoading.value = true
    error.value = null
    try {
      // Update each item individually (batch endpoint can be added later if needed)
      const updatePromises = itemIds.map(async (itemId) => {
        const item = items.value.find(i => i.id === itemId)
        if (!item) return null
        
        // Merge existing tags with new tags
        const existingTagIds = item.tags?.map(t => t.id) || []
        const newTagIds = [...new Set([...existingTagIds, ...tagIds])]
        
        const response = await itemsApi.update(libraryId, itemId, { tagIds: newTagIds })
        return response.item
      })
      
      const updatedItems = await Promise.all(updatePromises)
      
      // Update cached items with API responses
      updatedItems.forEach(updatedItem => {
        if (!updatedItem) return
        const index = items.value.findIndex(item => item.id === updatedItem.id)
        if (index !== -1) {
          items.value[index] = updatedItem
        }
        if (currentItem.value?.id === updatedItem.id) {
          currentItem.value = updatedItem
        }
      })
      
      return updatedItems.filter(Boolean) as LibraryItem[]
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to add tags'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    currentItem,
    isLoading,
    error,
    total,
    sortedItems,
    getItemsByType,
    getItemsByTag,
    getItemById,
    fetchItems,
    fetchItem,
    createItem,
    updateItem,
    deleteItem,
    attachFile,
    detachFile,
    setCurrentItem,
    clearError,
    clearItems,
    batchAddTags,
    refreshItems,
    isAlreadyLoaded,
  }
}, {
  // Persistence configuration
  persist: {
    key: 'items-store',
    storage: localStorage,
    pick: ['items', 'currentItem', 'total'], // Only persist these
    // Don't persist: isLoading, error, cacheMetadata (runtime only)
  }
})



