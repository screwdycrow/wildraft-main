import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { playerApi } from '@/api/player'
import type { SharedContent, SharedItem, SharedDmScreen, SharedPortalView } from '@/api/player'
import type { AccessRole } from '@/types/library.types'

const activePortalKey = (libraryId: number) => `wildraft-player-active-portal-${libraryId}`

/**
 * Content shared with the current user in a library (the player dashboard's
 * data source). For VIEWER+ roles the backend returns the whole library so
 * DMs can preview the player experience.
 */
export const usePlayerContentStore = defineStore('playerContent', () => {
  const library = ref<SharedContent['library'] | null>(null)
  const role = ref<AccessRole | null>(null)
  const items = ref<SharedItem[]>([])
  const dmScreens = ref<SharedDmScreen[]>([])
  const portalViews = ref<SharedPortalView[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const activePortalViewId = ref<string | null>(null)

  const viewableItemIds = computed(() => new Set(items.value.map((i) => i.id)))

  const activePortal = computed(
    () => portalViews.value.find((p) => p.id === activePortalViewId.value) ?? null
  )

  async function fetchSharedContent(libraryId: number) {
    isLoading.value = true
    error.value = null
    try {
      const content = await playerApi.getSharedContent(libraryId)
      library.value = content.library
      role.value = content.role
      items.value = content.items
      dmScreens.value = content.dmScreens
      portalViews.value = content.portalViews

      // Restore (or pick) the active portal for this library
      const stored = localStorage.getItem(activePortalKey(libraryId))
      if (stored && content.portalViews.some((p) => p.id === stored)) {
        activePortalViewId.value = stored
      } else if (content.portalViews.length > 0) {
        activePortalViewId.value = content.portalViews[0].id
      } else {
        activePortalViewId.value = null
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to load shared content'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  function setActivePortal(portalViewId: string | null) {
    activePortalViewId.value = portalViewId
    if (library.value) {
      const key = activePortalKey(library.value.id)
      if (portalViewId) {
        localStorage.setItem(key, portalViewId)
      } else {
        localStorage.removeItem(key)
      }
    }
  }

  function reset() {
    library.value = null
    role.value = null
    items.value = []
    dmScreens.value = []
    portalViews.value = []
    activePortalViewId.value = null
    error.value = null
  }

  return {
    library,
    role,
    items,
    dmScreens,
    portalViews,
    isLoading,
    error,
    activePortalViewId,
    activePortal,
    viewableItemIds,
    fetchSharedContent,
    setActivePortal,
    reset,
  }
})
