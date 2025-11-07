import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tagsApi } from '@/api/tags'
import type { Tag, TagWithItems, CreateTagPayload, UpdateTagPayload } from '@/types/tag.types'

export const useTagsStore = defineStore('tags', () => {
  // State
  const tags = ref<Tag[]>([])
  const currentTag = ref<TagWithItems | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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

  // Actions
  async function fetchTags(libraryId: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.getAll(libraryId)
      tags.value = response.tags
      return response.tags
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch tags'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchTag(libraryId: number, tagId: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await tagsApi.getById(libraryId, tagId)
      currentTag.value = response.tag
      
      // Update in the list if it exists
      const index = tags.value.findIndex(tag => tag.id === tagId)
      if (index !== -1) {
        tags.value[index] = response.tag
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
  }

  function clearError() {
    error.value = null
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
  }
})

