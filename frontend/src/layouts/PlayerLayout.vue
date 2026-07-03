<template>
  <v-app>
    <!-- Top bar -->
    <v-app-bar density="compact" flat class="player-app-bar" elevation="0">
      <v-app-bar-nav-icon @click="drawerOpen = !drawerOpen" />
      <v-app-bar-title class="text-body-1 font-weight-bold">
        <v-icon icon="mdi-sword-cross" size="20" class="mr-2" color="primary" />
        {{ playerContent.library?.name || 'Player' }}
      </v-app-bar-title>
      <v-spacer />
      <v-btn
        icon="mdi-dice-d20"
        variant="text"
        title="Dice roller"
        @click="diceRollerStore.toggle()"
      />
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text">
            <v-avatar color="primary" size="30">
              <v-img v-if="authStore.user?.picture" :src="authStore.user.picture" />
              <span v-else class="text-caption">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list class="glass-menu">
          <v-list-item :title="authStore.user?.name || authStore.user?.email" :subtitle="authStore.user?.email" />
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-view-dashboard" title="My Libraries" :to="{ name: 'PlayerHome' }" />
          <v-list-item prepend-icon="mdi-logout" title="Log out" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Shared content sidebar -->
    <v-navigation-drawer v-model="drawerOpen" width="300" class="player-drawer">
      <player-sidebar v-if="libraryId" :library-id="libraryId" />
      <div v-else class="pa-4 text-center text-medium-emphasis text-body-2">
        Pick a library to see your content.
      </div>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main class="player-main">
      <router-view />
    </v-main>

    <!-- Combat sidebar overlay (same behavior as the portal layout) -->
    <div
      v-if="isPortalRoute"
      class="portal-combat-sidebar"
      :class="{ 'sidebar-hidden': !combatSidebarVisible }"
    >
      <portal-combat-encounter
        :portal-view="portalView"
        :show-health="portalView?.showHealth || false"
        :show-ac="portalView?.showAC || false"
        :show-actions="portalView?.showActions || false"
        :show-encounter="portalView?.showEncounter || false"
      />
    </div>

    <!-- 3D Dice Box -->
    <DiceBox3D />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerContentStore } from '@/stores/playerContent'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { useDiceRollerStore } from '@/stores/diceRoller'
import PlayerSidebar from '@/components/player/PlayerSidebar.vue'
import PortalCombatEncounter from '@/components/portal/PortalCombatEncounter.vue'
import DiceBox3D from '@/components/dice/DiceBox3D.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const playerContent = usePlayerContentStore()
const portalViewsStore = usePortalViewsStore()
const combatEncountersStore = useCombatEncountersStore()
const diceRollerStore = useDiceRollerStore()

const drawerOpen = ref(true)
const combatSidebarVisible = ref(true)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isPortalRoute = computed(() => route.name === 'PlayerPortal')
const portalView = computed(() => portalViewsStore.currentPortalView)

const userInitials = computed(() => {
  const source = authStore.user?.name || authStore.user?.email || '?'
  return source
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('')
})

// Load shared content whenever the library changes
watch(
  libraryId,
  async (id) => {
    if (id) {
      try {
        await playerContent.fetchSharedContent(id)
      } catch {
        // 403 = not a member; send them to the picker
        router.replace({ name: 'PlayerHome' })
      }
    }
  },
  { immediate: true }
)

// Load the portal + encounter when viewing a portal (mirrors PortalLayout)
async function loadPortalAndEncounter() {
  if (!isPortalRoute.value || !libraryId.value) return
  const portalViewId = route.params.portalViewId as string
  if (!portalViewId) return
  try {
    await portalViewsStore.fetchPortalView(libraryId.value, portalViewId)
    if (portalView.value?.combatEncounterId) {
      await combatEncountersStore.fetchEncounter(libraryId.value, portalView.value.combatEncounterId)
      combatEncountersStore.setActiveEncounter(portalView.value.combatEncounterId)
      combatSidebarVisible.value = true
    } else {
      combatEncountersStore.setActiveEncounter(null)
      combatSidebarVisible.value = false
    }
  } catch (error) {
    console.error('[PlayerLayout] Failed to load portal view or encounter:', error)
  }
}

watch([() => route.name, () => route.params.portalViewId], loadPortalAndEncounter, {
  immediate: true,
})

// PortalViewView injects this to toggle the combat sidebar
provide('toggleEncounterSidebar', () => {
  combatSidebarVisible.value = !combatSidebarVisible.value
})

async function logout() {
  await authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.player-app-bar {
  background: rgba(var(--v-theme-surface), 0.75) !important;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.player-drawer {
  background: rgba(var(--v-theme-surface), 0.9) !important;
  backdrop-filter: blur(12px);
}

.player-main {
  height: 100vh;
  overflow: auto;
}

.portal-combat-sidebar {
  position: fixed;
  top: 48px;
  right: 0;
  width: 250px;
  height: calc(100vh - 48px);
  background: transparent !important;
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
  transition: transform 0.3s ease;
  pointer-events: all;
}

.portal-combat-sidebar.sidebar-hidden {
  transform: translateX(100%);
}
</style>
