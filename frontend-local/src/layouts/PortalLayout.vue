<template>
  <v-app>
    <!-- Main Content Area -->
    <v-main class="portal-main">
      <router-view />
    </v-main>
    
    <!-- Transparent Combat Sidebar (overlay) - Custom div instead of v-navigation-drawer -->
    <div
      class="portal-combat-sidebar"
      :class="{ 'sidebar-hidden': !sidebarVisible }"
    >
      <portal-combat-encounter
        :portal-view="portalView"
        :show-health="portalView?.showHealth || false"
        :show-ac="portalView?.showAC || false"
        :show-actions="portalView?.showActions || false"
        :show-encounter="portalView?.showEncounter || false"
      />
    </div>

    <!-- Hide/Show Sidebar Button (only if encounter exists or details should be shown) -->

    
    <!-- 3D Dice Box -->
    <DiceBox3D />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import PortalCombatEncounter from '@/components/portal/PortalCombatEncounter.vue'
import DiceBox3D from '@/components/dice/DiceBox3D.vue'

const route = useRoute()
const portalViewsStore = usePortalViewsStore()
const combatEncountersStore = useCombatEncountersStore()

const sidebarVisible = ref(true)

// NOTE: Socket is initialized in PortalViewView, not here
// This layout just provides the toggle function

const libraryId = computed(() => {
  // Support both /portal/library/:id/portalview/:portalViewId and /portal/:id/portal-views/:portalViewId/view
  const id = route.params.id || route.params.libraryId
  return id ? Number(id) : null
})

const portalViewId = computed(() => {
  return (route.params.portalViewId || route.params.portalviewId) as string
})

const portalView = computed(() => portalViewsStore.currentPortalView)

// Show toggle button if there's an encounter or if any details should be shown
const shouldShowToggleButton = computed(() => {
  if (!portalView.value) return false
  return !!(
    portalView.value.combatEncounterId ||
    portalView.value.showEncounter ||
    portalView.value.showHealth ||
    portalView.value.showAC ||
    portalView.value.showActions
  )
})

// Auto-hide sidebar if no encounter and no details to show
watch([portalView, () => portalView.value?.combatEncounterId], () => {
  if (!shouldShowToggleButton.value) {
    sidebarVisible.value = false
  } else if (portalView.value?.combatEncounterId) {
    // Auto-show if encounter exists
    sidebarVisible.value = true
  }
}, { immediate: true })

// Load portal view and its encounter
async function loadPortalViewAndEncounter() {
  if (!libraryId.value || !portalViewId.value) return
  
  try {
    // Fetch the portal view
    await portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value)
    
    // If portal view has a combat encounter, fetch and set it as active
    if (portalView.value?.combatEncounterId) {
      // Fetch the specific encounter
      await combatEncountersStore.fetchEncounter(
        libraryId.value, 
        portalView.value.combatEncounterId
      )
      
      // Set it as the active encounter
      combatEncountersStore.setActiveEncounter(portalView.value.combatEncounterId)
    } else {
      // No encounter linked, clear active encounter
      combatEncountersStore.setActiveEncounter(null)
    }
  } catch (error) {
    console.error('[PortalLayout] Failed to load portal view or encounter:', error)
  }
}

onMounted(() => {
  loadPortalViewAndEncounter()
})

// Watch for route changes
watch([() => route.params.id, () => route.params.portalViewId], () => {
  loadPortalViewAndEncounter()
})

// Expose method to toggle sidebar (will be called from PortalViewView via provide/inject)
const toggleEncounterSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
}

// Provide the toggle method to child components
provide('toggleEncounterSidebar', toggleEncounterSidebar)
</script>

<style scoped>
.portal-main {
  background: transparent;
  width: 100%;
  height: 100vh;
  overflow: auto;
}

.portal-combat-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 250px;
  height: 100vh;
  background: transparent !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  border: none !important;
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
  transition: transform 0.3s ease;
  pointer-events: all;
}

.portal-combat-sidebar.sidebar-hidden {
  transform: translateX(100%);
}

.portal-combat-sidebar::-webkit-scrollbar {
  width: 6px;
}

.portal-combat-sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.portal-combat-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.portal-combat-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.portal-sidebar-toggle {
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1001;
  background: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(10px);
  transition: right 0.3s ease;
}

.portal-sidebar-toggle.sidebar-hidden {
  right: 16px;
}

.portal-sidebar-toggle:not(.sidebar-hidden) {
  right: 266px; /* 350px sidebar width + 16px margin */
}
</style>

