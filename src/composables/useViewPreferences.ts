import { ref, watch } from 'vue'

export type ViewMode = 'grid' | 'table'
export type GroupBy = 'none' | 'tag' | 'tagFolder'

export interface ViewPreferences {
  viewMode: ViewMode
  groupBy: GroupBy
  collapsedGroups: string[]
}

const GLOBAL_STORAGE_KEY = 'view-preferences-global-library-items'
const STORAGE_KEY_PREFIX = 'view-preferences-'

// Global shared reactive state for viewMode and groupBy
const globalViewMode = ref<ViewMode>('grid')
const globalGroupBy = ref<GroupBy>('none')

// Load global preferences on module load
try {
  const stored = localStorage.getItem(GLOBAL_STORAGE_KEY)
  if (stored) {
    const parsed = JSON.parse(stored)
    globalViewMode.value = parsed.viewMode || 'grid'
    globalGroupBy.value = parsed.groupBy || 'none'
  }
} catch (e) {
  console.warn('Failed to load global view preferences:', e)
}

// Save global preferences
const saveGlobalPreferences = () => {
  try {
    const prefs = {
      viewMode: globalViewMode.value,
      groupBy: globalGroupBy.value,
    }
    localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(prefs))
    
    // Notify all other instances to update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('viewPreferencesUpdated', { 
        detail: { viewMode: globalViewMode.value, groupBy: globalGroupBy.value }
      }))
    }
  } catch (e) {
    console.warn('Failed to save global view preferences:', e)
  }
}

// Watch for global changes
watch([globalViewMode, globalGroupBy], saveGlobalPreferences)

// Listen for global updates from other instances
if (typeof window !== 'undefined') {
  window.addEventListener('viewPreferencesUpdated', ((event: CustomEvent) => {
    if (event.detail.viewMode !== undefined) {
      globalViewMode.value = event.detail.viewMode
    }
    if (event.detail.groupBy !== undefined) {
      globalGroupBy.value = event.detail.groupBy
    }
  }) as EventListener)
}

/**
 * Composable for managing view preferences with localStorage persistence
 * @param viewKey - Unique key for collapsed groups (e.g., 'library-items', 'library-notes')
 *                  viewMode and groupBy are always global across all views
 */
export function useViewPreferences(viewKey?: string) {
  // Use view-specific key for collapsedGroups only
  const collapsedGroupsKey = viewKey 
    ? `${STORAGE_KEY_PREFIX}${viewKey}-collapsed` 
    : `${STORAGE_KEY_PREFIX}global-collapsed`
  
  // Load collapsed groups from view-specific storage
  const loadCollapsedGroups = (): string[] => {
    try {
      const stored = localStorage.getItem(collapsedGroupsKey)
      if (stored) {
        return JSON.parse(stored) || []
      }
    } catch (e) {
      console.warn('Failed to load collapsed groups:', e)
    }
    return []
  }
  
  // Use global refs for viewMode and groupBy, local ref for collapsedGroups
  const collapsedGroups = ref<string[]>(loadCollapsedGroups())
  
  // Save collapsed groups to view-specific storage
  const saveCollapsedGroups = () => {
    try {
      localStorage.setItem(collapsedGroupsKey, JSON.stringify(collapsedGroups.value))
    } catch (e) {
      console.warn('Failed to save collapsed groups:', e)
    }
  }
  
  // Watch collapsed groups and save
  watch(collapsedGroups, saveCollapsedGroups, { deep: true })
  
  // Toggle group collapsed state
  const toggleGroupCollapsed = (groupName: string) => {
    const index = collapsedGroups.value.indexOf(groupName)
    if (index >= 0) {
      collapsedGroups.value.splice(index, 1)
    } else {
      collapsedGroups.value.push(groupName)
    }
  }
  
  const isGroupCollapsed = (groupName: string) => {
    return collapsedGroups.value.includes(groupName)
  }
  
  // Reset preferences
  const resetPreferences = () => {
    globalViewMode.value = 'grid'
    globalGroupBy.value = 'none'
    collapsedGroups.value = []
  }
  
  return {
    // Return global refs directly (shared across all instances)
    viewMode: globalViewMode,
    groupBy: globalGroupBy,
    // Return local ref for collapsed groups (per-view)
    collapsedGroups,
    toggleGroupCollapsed,
    isGroupCollapsed,
    resetPreferences,
  }
}
