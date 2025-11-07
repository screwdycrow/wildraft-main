import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { librariesApi } from '@/api/libraries'
import type { Library, CreateLibraryPayload, UpdateLibraryPayload, LibraryAccess, LibraryTemplates } from '@/types/library.types'

export const useLibraryStore = defineStore('library', () => {
  // State
  const libraries = ref<Library[]>([])
  
  const currentLibrary = ref<Library | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const sortedLibraries = computed(() => {
    return [...libraries.value].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  })

  const ownedLibraries = computed(() => 
    libraries.value.filter(lib => lib.role === 'OWNER')
  )

  const sharedLibraries = computed(() => 
    libraries.value.filter(lib => lib.role !== 'OWNER')
  )

  // Actions
  async function fetchLibraries() {
    isLoading.value = true
    error.value = null
    try {
      const response = await librariesApi.getAll()
      libraries.value = response.libraries
      return response.libraries
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch libraries'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function fetchLibrary(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await librariesApi.getById(id)
      currentLibrary.value = response.library
      
      // Update in the list if it exists
      const index = libraries.value.findIndex(lib => lib.id === id)
      if (index !== -1) {
        libraries.value[index] = response.library
      } else {
        libraries.value.push(response.library)
      }
      
      return response.library
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createLibrary(payload: CreateLibraryPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await librariesApi.create(payload)
      libraries.value.unshift(response.library)
      return response.library
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function updateLibrary(id: number, payload: UpdateLibraryPayload) {
    isLoading.value = true
    error.value = null
    try {
      const response = await librariesApi.update(id, payload)
      const index = libraries.value.findIndex(lib => lib.id === id)
      if (index !== -1) {
        libraries.value[index] = response.library
      }
      if (currentLibrary.value?.id === id) {
        currentLibrary.value = response.library
      }
      return response.library
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function deleteLibrary(id: number) {
    isLoading.value = true
    error.value = null
    try {
      await librariesApi.delete(id)
      libraries.value = libraries.value.filter(lib => lib.id !== id)
      if (currentLibrary.value?.id === id) {
        currentLibrary.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to delete library'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentLibrary(library: Library | null) {
    currentLibrary.value = library
  }

  function clearError() {
    error.value = null
  }

  // Library access management
  async function fetchLibraryAccess(libraryId: number): Promise<LibraryAccess[]> {
    try {
      const response = await librariesApi.getAccess(libraryId)
      return response.access
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch library access'
      throw err
    }
  }

  async function grantLibraryAccess(libraryId: number, userId: number, role: 'OWNER' | 'EDITOR' | 'VIEWER'): Promise<LibraryAccess> {
    try {
      const response = await librariesApi.grantAccess(libraryId, userId, role)
      return response.access
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to grant access'
      throw err
    }
  }

  async function updateLibraryAccess(libraryId: number, accessId: number, role: 'OWNER' | 'EDITOR' | 'VIEWER'): Promise<LibraryAccess> {
    try {
      const response = await librariesApi.updateAccess(libraryId, accessId, role)
      return response.access
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to update access'
      throw err
    }
  }

  async function revokeLibraryAccess(libraryId: number, accessId: number): Promise<void> {
    try {
      await librariesApi.revokeAccess(libraryId, accessId)
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to revoke access'
      throw err
    }
  }

  async function removeOwnAccess(libraryId: number, accessId: number): Promise<void> {
    try {
      await librariesApi.revokeAccess(libraryId, accessId)
      // Remove from libraries list
      libraries.value = libraries.value.filter(lib => lib.id !== libraryId)
      if (currentLibrary.value?.id === libraryId) {
        currentLibrary.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to remove access'
      throw err
    }
  }

  return {
    libraries,
    currentLibrary,
    isLoading,
    error,
    sortedLibraries,
    ownedLibraries,
    sharedLibraries,
    fetchLibraries,
    fetchLibrary,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    setCurrentLibrary,
    clearError,
    fetchLibraryAccess,
    grantLibraryAccess,
    updateLibraryAccess,
    revokeLibraryAccess,
    removeOwnAccess,
  }
})


