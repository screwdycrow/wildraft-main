import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { itemsApi } from '@/api/items'
import type { 
  LibraryItem, 
  CreateLibraryItemPayload, 
  UpdateLibraryItemPayload 
} from '@/types/item.types'

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<LibraryItem[]>([])
  const currentItem = ref<LibraryItem | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

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

  // Actions
  async function fetchItems(libraryId: number, params?: { 
    type?: string 
    tagIds?: number[]
    search?: string
    limit?: number
    offset?: number
  }) {
    isLoading.value = true
    error.value = null
    try {
      const response = await itemsApi.getAll(libraryId, params)
      items.value = response.items
      total.value = response.total
      return response.items
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch items'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchItem(libraryId: number, itemId: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await itemsApi.getById(libraryId, itemId)
      currentItem.value = response.item
      
      // Update in the list if it exists
      const index = items.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        items.value[index] = response.item
      } else {
        items.value.push(response.item)
      }
      
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
      items.value.unshift(response.item)
      total.value++
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
      const index = items.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        items.value[index] = response.item
      }
      if (currentItem.value?.id === itemId) {
        currentItem.value = response.item
      }
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
      items.value = items.value.filter(item => item.id !== itemId)
      if (currentItem.value?.id === itemId) {
        currentItem.value = null
      }
      total.value--
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
      
      // Refresh the item to get updated file list
      await fetchItem(libraryId, itemId)
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
  }
})



