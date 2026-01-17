import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { combatEncountersApi } from '@/api/combatEncounters'
import { debounce } from '@/utils/helpers'
import type {
  CombatEncounter,
  CreateCombatEncounterRequest,
  UpdateCombatEncounterRequest,
} from '@/types/combat.types'

/**
 * Combat Encounters Store
 * 
 * Manages combat encounters for the current library.
 * Tracks all encounters and maintains a global active encounter.
 */
export const useCombatEncountersStore = defineStore('combatEncounters', () => {
  // State
  const encounters = ref<CombatEncounter[]>([])
  const activeEncounterId = ref<number | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeEncounter = computed(() => {
    if (!activeEncounterId.value) return null
    return encounters.value.find(e => e.id === activeEncounterId.value) || null
  })

  const sortedEncounters = computed(() => {
    return [...encounters.value].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  const latestEncounter = computed(() => {
    return sortedEncounters.value[0] || null
  })

  // Actions

  /**
   * Fetch all encounters for a library
   */
  async function fetchEncounters(libraryId: number) {
    isLoading.value = true
    error.value = null
    try {
      const fetchedEncounters = await combatEncountersApi.getAll(libraryId)
      encounters.value = fetchedEncounters
      
      // Auto-select active encounter if none selected
      if (!activeEncounterId.value && encounters.value.length > 0) {
        activeEncounterId.value = latestEncounter.value?.id || null
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch encounters'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single encounter by ID
   */
  async function fetchEncounter(libraryId: number, encounterId: number) {
    isLoading.value = true
    error.value = null
    try {
      const encounter = await combatEncountersApi.getById(libraryId, encounterId)
      
      // Update or add to encounters array
      const index = encounters.value.findIndex(e => e.id === encounter.id)
      if (index !== -1) {
        encounters.value[index] = encounter
      } else {
        encounters.value.push(encounter)
      }
      
      return encounter
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch encounter'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new encounter
   */
  async function createEncounter(libraryId: number, data: CreateCombatEncounterRequest) {
    isLoading.value = true
    error.value = null
    try {
      const newEncounter = await combatEncountersApi.create(libraryId, data)
      encounters.value.push(newEncounter)
      
      // Auto-set as active encounter
      activeEncounterId.value = newEncounter.id
      
      return newEncounter
    } catch (err: any) {
      error.value = err.message || 'Failed to create encounter'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Debounced backend sync for initiative/round updates
  // Only syncs to backend, doesn't update UI (UI already updated optimistically)
  const debouncedBackendSync = debounce(
    async (
      libraryId: number,
      encounterId: number,
      data: UpdateCombatEncounterRequest,
      originalEncounter: CombatEncounter,
      sendToPortal = true
    ) => {
      try {
        await combatEncountersApi.update(libraryId, encounterId, data)
        // Don't update UI - optimistic update already done
        
        // Send encounter update to active portal AFTER backend update succeeds
        if (sendToPortal) {
          try {
            // Dynamic import to avoid circular dependency
            const { usePortalViewsStore } = await import('@/stores/portalViews')
            const { usePortalSocket } = await import('@/composables/usePortalSocket')
            const portalStore = usePortalViewsStore()
            
            if (portalStore.activePortal && portalStore.activePortal.libraryId === libraryId) {
              // Send refetch command to all viewers AFTER update is saved
              const { sendPortalViewUpdate } = usePortalSocket()
              sendPortalViewUpdate({
                command: 'refetch-encounter',
              })
            }
          } catch (error) {
            // Silently fail portal notification
          }
        }
      } catch (err: any) {
        // Revert to original on error
        encounters.value = encounters.value.map(e => 
          e.id === encounterId ? originalEncounter : e
        )
        error.value = err.message || 'Failed to update encounter'
      }
    },
    1000 // 1000ms debounce delay
  )

  /**
   * Update an existing encounter (immediate optimistic update, debounced backend sync for initiative/round)
   */
  async function updateEncounter(
    libraryId: number,
    encounterId: number,
    data: UpdateCombatEncounterRequest,
    debounceBackend = false,
    sendToPortal = true
  ) {
    error.value = null
    
    // Find the current encounter
    const currentEncounter = encounters.value.find(e => e.id === encounterId)
    if (!currentEncounter) {
      return
    }
    
    // Optimistically update the UI immediately
    const optimisticEncounter = {
      ...currentEncounter,
      ...data,
      combatants: data.combatants || currentEncounter.combatants,
      updatedAt: new Date().toISOString()
    }
    
    // Update UI immediately
    encounters.value = encounters.value.map(e => 
      e.id === encounterId ? optimisticEncounter : e
    )
    
    // If debounceBackend is true, use debounced sync (for initiative/round changes)
    if (debounceBackend) {
      debouncedBackendSync(libraryId, encounterId, data, currentEncounter, sendToPortal)
      return optimisticEncounter
    }
    
    // Otherwise, sync with backend immediately (but don't update UI with response)
    try {
      await combatEncountersApi.update(libraryId, encounterId, data)
      // Don't update UI - optimistic update already done
      
      // Send encounter update to active portal AFTER backend update succeeds
      if (sendToPortal) {
        try {
          // Dynamic import to avoid circular dependency
          const { usePortalViewsStore } = await import('@/stores/portalViews')
          const { usePortalSocket } = await import('@/composables/usePortalSocket')
          const portalStore = usePortalViewsStore()
          
          if (portalStore.activePortal && portalStore.activePortal.libraryId === libraryId) {
            // Send refetch command to all viewers AFTER update is saved
            const { sendPortalViewUpdate } = usePortalSocket()
            sendPortalViewUpdate({
              command: 'refetch-encounter',
            })
          }
        } catch (error) {
          // Silently fail portal notification
        }
      }
      
      return optimisticEncounter
    } catch (err: any) {
      // Revert optimistic update on error
      encounters.value = encounters.value.map(e => 
        e.id === encounterId ? currentEncounter : e
      )
      error.value = err.message || 'Failed to update encounter'
      throw err
    }
  }

  /**
   * Delete an encounter
   */
  async function deleteEncounter(libraryId: number, encounterId: number) {
    isLoading.value = true
    error.value = null
    try {
      await combatEncountersApi.delete(libraryId, encounterId)
      
      // Remove from encounters array
      encounters.value = encounters.value.filter(e => e.id !== encounterId)
      
      // If deleted encounter was active, select the latest
      if (activeEncounterId.value === encounterId) {
        activeEncounterId.value = latestEncounter.value?.id || null
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete encounter'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Set the active encounter
   */
  function setActiveEncounter(encounterId: number | null) {
    activeEncounterId.value = encounterId
  }

  /**
   * Clear all encounters (on library change)
   */
  function clearEncounters() {
    encounters.value = []
    activeEncounterId.value = null
    error.value = null
  }

  return {
    // State
    encounters,
    activeEncounterId,
    isLoading,
    error,
    
    // Getters
    activeEncounter,
    sortedEncounters,
    latestEncounter,
    
    // Actions
    fetchEncounters,
    fetchEncounter,
    createEncounter,
    updateEncounter,
    deleteEncounter,
    setActiveEncounter,
    clearEncounters,
  }
})

