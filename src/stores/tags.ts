import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tagsApi } from '@/api/tags'
import type { Tag, TagWithItems, CreateTagPayload, UpdateTagPayload } from '@/types/tag.types'

interface CacheMetadata {
  libraryId: number | null
  timestamp: number
}

export const useTagsStore = defineStore('tags', () => {
  // State
  const tags = ref<Tag[]>([])
  const currentTag = ref<TagWithItems | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Cache metadata (not persisted, just for runtime checks)
  const cacheMetadata = ref<CacheMetadata>({
    libraryId: null,
    timestamp: 0
  })

  // Getters
  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  const tagsByFolder = computed(() => {
    const grouped: Record<string, Tag[]> = {}
    
    tags.value.forEach(tag => {
      const folder = tag.folder || 'Uncategorized'
      if (!grouped[folder]) {
        grouped[folder] = []
      }
      grouped[folder].push(tag)
    })

    // Sort tags within each folder
    Object.keys(grouped).forEach(folder => {
      grouped[folder].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  })

  const uniqueFolders = computed(() => {
    const folders = new Set<string>()
    tags.value.forEach(tag => {
      if (tag.folder) {
        folders.add(tag.folder)
      }
    })
    return Array.from(folders).sort()
  })

  const getTagById = computed(() => {
    return (id: number) => tags.value.find(tag => tag.id === id)
  })

  const getTagsByIds = computed(() => {
    return (ids: number[]) => tags.value.filter(tag => ids.includes(tag.id))
  })

  // Helper: Check if tags are already loaded for this library
  // Tags should only be loaded once per library (unless force refresh)
  function isAlreadyLoaded(libraryId: number): boolean {
    // If we have tags for this library, consider them loaded
    // No timestamp check - tags are loaded once and stay loaded
    return cacheMetadata.value.libraryId === libraryId && tags.value.length > 0
  }

  // Actions
  async function fetchTags(libraryId: number, forceRefresh: boolean = false) {
    // Check if already loaded (unless force refresh)
    if (!forceRefresh && isAlreadyLoaded(libraryId)) {
      console.log('Tags already loaded from cache, skipping API call')
      return tags.value
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.getAll(libraryId)
      
      // Update cached tags with API response
      tags.value = response.tags
      
      // Update cache metadata
      cacheMetadata.value = {
        libraryId,
        timestamp: Date.now()
      }
      
      return response.tags
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch tags'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTag(libraryId: number, tagId: number, forceRefresh: boolean = false) {
    // Check if tag is already in cached tags
    if (!forceRefresh) {
      const existingTag = tags.value.find(tag => tag.id === tagId)
      if (existingTag) {
        if (currentTag.value?.id === tagId) {
          console.log('Tag already loaded from cache, skipping API call')
          return currentTag.value
        }
        // Set as current tag from cache (but we need full TagWithItems, so fetch if needed)
        // For now, we'll still fetch to get the full data with items
      }
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.getById(libraryId, tagId)
      
      // Update cached tags with API response
      currentTag.value = response.tag
      
      const index = tags.value.findIndex(tag => tag.id === tagId)
      if (index !== -1) {
        // Update existing tag in cache
        tags.value[index] = response.tag
      } else {
        // Add new tag to cache
        tags.value.push(response.tag)
      }
      
      return response.tag
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch tag'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createTag(libraryId: number, payload: CreateTagPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.create(libraryId, payload)
      
      // Update cached tags with API response
      tags.value.push(response.tag)
      
      // Invalidate cache metadata (tags changed, might need refresh)
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now() // Update timestamp
      }
      
      return response.tag
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create tag'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateTag(libraryId: number, tagId: number, payload: UpdateTagPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.update(libraryId, tagId, payload)
      
      // Update cached tags with API response
      const index = tags.value.findIndex(tag => tag.id === tagId)
      if (index !== -1) {
        tags.value[index] = response.tag
      }
      if (currentTag.value?.id === tagId) {
        currentTag.value = { ...currentTag.value, ...response.tag }
      }
      
      // Cache is still valid, just updated the tag
      return response.tag
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update tag'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTag(libraryId: number, tagId: number) {
    isLoading.value = true
    error.value = null
    try {
      await tagsApi.delete(libraryId, tagId)
      
      // Update cached tags (remove deleted tag)
      tags.value = tags.value.filter(tag => tag.id !== tagId)
      if (currentTag.value?.id === tagId) {
        currentTag.value = null
      }
      
      // Invalidate cache metadata (tags changed)
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now() // Update timestamp
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete tag'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function clearTags() {
    tags.value = []
    currentTag.value = null
    cacheMetadata.value = {
      libraryId: null,
      timestamp: 0
    }
  }

  function clearError() {
    error.value = null
  }

  // Force refresh function
  async function refreshTags(libraryId: number) {
    return fetchTags(libraryId, true)
  }

  return {
    tags,
    currentTag,
    isLoading,
    error,
    sortedTags,
    tagsByFolder,
    uniqueFolders,
    getTagById,
    getTagsByIds,
    fetchTags,
    fetchTag,
    createTag,
    updateTag,
    deleteTag,
    clearTags,
    clearError,
    refreshTags,
    isAlreadyLoaded,
  }
}, {
  // Persistence configuration
  persist: {
    key: 'tags-store',
    storage: localStorage,
    pick: ['tags', 'currentTag'], // Only persist these
    // Don't persist: isLoading, error, cacheMetadata (runtime only)
  }
})

