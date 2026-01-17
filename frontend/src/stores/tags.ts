import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tagsApi } from '@/api/tags'
import { tagFoldersApi } from '@/api/tagFolders'
import type { 
  Tag, 
  TagWithItems, 
  CreateTagPayload, 
  UpdateTagPayload,
  TagFolder,
  TagFolderWithTags,
  CreateTagFolderPayload,
  UpdateTagFolderPayload
} from '@/types/tag.types'

interface CacheMetadata {
  libraryId: number | null
  timestamp: number
}

export const useTagsStore = defineStore('tags', () => {
  // State
  const tags = ref<Tag[]>([])
  const folders = ref<TagFolder[]>([])
  const currentTag = ref<TagWithItems | null>(null)
  const currentFolder = ref<TagFolderWithTags | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Cache metadata (not persisted, just for runtime checks)
  const cacheMetadata = ref<CacheMetadata>({
    libraryId: null,
    timestamp: 0
  })

  // Getters - Tags
  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  })

  const tagsByFolder = computed(() => {
    const grouped: Record<number | 'uncategorized', Tag[]> = {
      uncategorized: []
    }
    
    // Initialize groups for each folder
    folders.value.forEach(folder => {
      grouped[folder.id] = []
    })
    
    // Group tags by folder
    tags.value.forEach(tag => {
      if (tag.folderId && grouped[tag.folderId]) {
        grouped[tag.folderId].push(tag)
      } else {
        grouped.uncategorized.push(tag)
      }
    })

    // Sort tags within each group by order
    Object.keys(grouped).forEach(key => {
      const groupKey = key === 'uncategorized' ? 'uncategorized' : Number(key)
      grouped[groupKey].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    })

    return grouped
  })

  // Getters - Folders
  const sortedFolders = computed(() => {
    return [...folders.value].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  })

  const getTagById = computed(() => {
    return (id: number) => tags.value.find(tag => tag.id === id)
  })

  const getTagsByIds = computed(() => {
    return (ids: number[]) => tags.value.filter(tag => ids.includes(tag.id))
  })

  const getFolderById = computed(() => {
    return (id: number) => folders.value.find(folder => folder.id === id)
  })

  // Get tags for a specific folder
  const getTagsInFolder = computed(() => {
    return (folderId: number | null) => {
      if (folderId === null) {
        return tags.value.filter(tag => !tag.folderId).sort((a, b) => a.order - b.order)
      }
      return tags.value.filter(tag => tag.folderId === folderId).sort((a, b) => a.order - b.order)
    }
  })

  // Helper: Check if tags are already loaded for this library
  function isAlreadyLoaded(libraryId: number): boolean {
    return cacheMetadata.value.libraryId === libraryId && (tags.value.length > 0 || folders.value.length > 0)
  }

  // ==================== TAG ACTIONS ====================

  async function fetchTags(libraryId: number, forceRefresh: boolean = false) {
    if (!forceRefresh && isAlreadyLoaded(libraryId)) {
      console.log('Tags already loaded from cache, skipping API call')
      return tags.value
    }

    isLoading.value = true
    error.value = null
    try {
      // Fetch both tags and folders in parallel
      const [tagsResponse, foldersResponse] = await Promise.all([
        tagsApi.getAll(libraryId),
        tagFoldersApi.getAll(libraryId)
      ])
      
      tags.value = tagsResponse.tags
      folders.value = foldersResponse.folders
      
      cacheMetadata.value = {
        libraryId,
        timestamp: Date.now()
      }
      
      return tags.value
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch tags'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTag(libraryId: number, tagId: number, forceRefresh: boolean = false) {
    if (!forceRefresh) {
      const existingTag = tags.value.find(tag => tag.id === tagId)
      if (existingTag && currentTag.value?.id === tagId) {
        console.log('Tag already loaded from cache, skipping API call')
        return currentTag.value
      }
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.getById(libraryId, tagId)
      currentTag.value = response.tag
      
      const index = tags.value.findIndex(tag => tag.id === tagId)
      if (index !== -1) {
        tags.value[index] = response.tag
      } else {
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
      tags.value.push(response.tag)
      
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
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
      
      const index = tags.value.findIndex(tag => tag.id === tagId)
      if (index !== -1) {
        tags.value[index] = response.tag
      }
      if (currentTag.value?.id === tagId) {
        currentTag.value = { ...currentTag.value, ...response.tag }
      }
      
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
      
      tags.value = tags.value.filter(tag => tag.id !== tagId)
      if (currentTag.value?.id === tagId) {
        currentTag.value = null
      }
      
      if (cacheMetadata.value.libraryId === libraryId) {
        cacheMetadata.value.timestamp = Date.now()
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete tag'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function reorderTags(libraryId: number, tagIds: number[]) {
    try {
      // Update each tag individually with its new order
      await Promise.all(
        tagIds.map((tagId, index) => 
          tagsApi.update(libraryId, tagId, { order: index })
        )
      )
      
      // Update local order
      tagIds.forEach((tagId, index) => {
        const tag = tags.value.find(t => t.id === tagId)
        if (tag) {
          tag.order = index
        }
      })
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to reorder tags'
      throw err
    }
  }

  async function reorderTagsInFolder(libraryId: number, folderId: number | null, tagIds: number[]) {
    try {
      // Update each tag individually with its new order
      await Promise.all(
        tagIds.map((tagId, index) => 
          tagsApi.update(libraryId, tagId, { order: index })
        )
      )
      
      // Update local order
      tagIds.forEach((tagId, index) => {
        const tag = tags.value.find(t => t.id === tagId)
        if (tag) {
          tag.order = index
        }
      })
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to reorder tags in folder'
      throw err
    }
  }

  // ==================== FOLDER ACTIONS ====================

  async function fetchFolders(libraryId: number, forceRefresh: boolean = false) {
    if (!forceRefresh && folders.value.length > 0 && cacheMetadata.value.libraryId === libraryId) {
      return folders.value
    }

    isLoading.value = true
    error.value = null
    try {
      const response = await tagFoldersApi.getAll(libraryId)
      folders.value = response.folders
      return response.folders
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch folders'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchFolder(libraryId: number, folderId: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagFoldersApi.getById(libraryId, folderId)
      currentFolder.value = response.folder
      
      const index = folders.value.findIndex(f => f.id === folderId)
      if (index !== -1) {
        folders.value[index] = response.folder
      }
      
      return response.folder
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch folder'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createFolder(libraryId: number, payload: CreateTagFolderPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagFoldersApi.create(libraryId, payload)
      folders.value.push(response.folder)
      return response.folder
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create folder'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateFolder(libraryId: number, folderId: number, payload: UpdateTagFolderPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagFoldersApi.update(libraryId, folderId, payload)
      
      const index = folders.value.findIndex(f => f.id === folderId)
      if (index !== -1) {
        folders.value[index] = response.folder
      }
      if (currentFolder.value?.id === folderId) {
        currentFolder.value = { ...currentFolder.value, ...response.folder }
      }
      
      return response.folder
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update folder'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteFolder(libraryId: number, folderId: number) {
    isLoading.value = true
    error.value = null
    try {
      await tagFoldersApi.delete(libraryId, folderId)
      
      folders.value = folders.value.filter(f => f.id !== folderId)
      if (currentFolder.value?.id === folderId) {
        currentFolder.value = null
      }
      
      // Update tags that were in this folder
      tags.value.forEach(tag => {
        if (tag.folderId === folderId) {
          tag.folderId = null
        }
      })
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete folder'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function reorderFolders(libraryId: number, folderIds: number[]) {
    try {
      // Update each folder individually with its new order
      await Promise.all(
        folderIds.map((folderId, index) => 
          tagFoldersApi.update(libraryId, folderId, { order: index })
        )
      )
      
      // Update local order
      folderIds.forEach((folderId, index) => {
        const folder = folders.value.find(f => f.id === folderId)
        if (folder) {
          folder.order = index
        }
      })
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to reorder folders'
      throw err
    }
  }

  // ==================== UTILITY ACTIONS ====================

  function clearTags() {
    tags.value = []
    folders.value = []
    currentTag.value = null
    currentFolder.value = null
    cacheMetadata.value = {
      libraryId: null,
      timestamp: 0
    }
  }

  function clearError() {
    error.value = null
  }

  async function refreshTags(libraryId: number) {
    return fetchTags(libraryId, true)
  }

  return {
    // State
    tags,
    folders,
    currentTag,
    currentFolder,
    isLoading,
    error,
    
    // Getters - Tags
    sortedTags,
    tagsByFolder,
    getTagById,
    getTagsByIds,
    getTagsInFolder,
    
    // Getters - Folders
    sortedFolders,
    getFolderById,
    
    // Tag Actions
    fetchTags,
    fetchTag,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    reorderTagsInFolder,
    
    // Folder Actions
    fetchFolders,
    fetchFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    
    // Utility
    clearTags,
    clearError,
    refreshTags,
    isAlreadyLoaded,
  }
}, {
  persist: {
    key: 'tags-store',
    storage: localStorage,
    pick: ['tags', 'folders', 'currentTag', 'currentFolder'],
  }
})
