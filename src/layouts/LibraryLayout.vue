<template>
  <v-app>
    <v-app-bar elevation="0" class="glass-header" height="70">
      <v-app-bar-nav-icon @click="mobile ? drawer = !drawer : toggleRail()" />
      
      <v-toolbar-title class="d-flex align-center">
        <div>
          <span class="text-h6 font-weight-bold">{{ currentLibrary?.name || 'Library' }}</span>
          <v-chip
            v-if="currentLibrary"
            :color="roleColor"
            size="x-small"
            class="ml-2"
          >
            {{ currentLibrary.role || 'Owner' }}
          </v-chip>
        </div>
      </v-toolbar-title>

      <v-spacer />

      <v-btn
        icon="mdi-magnify"
        variant="text"
      />

      <v-btn icon="mdi-bell-outline" variant="text" />
      
      <v-btn
        :icon="rightDrawer ? 'mdi-page-layout-sidebar-right' : 'mdi-page-layout-body'"
        variant="text"
        :permanent="!mobile"
        @click="rightDrawer = !rightDrawer"
      >
        <v-icon />
        <v-tooltip activator="parent" location="bottom">
          {{ rightDrawer ? 'Hide sidebar' : 'Show sidebar' }}
        </v-tooltip>
      </v-btn>
      
      <quick-actions />
      
      <user-menu />
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :rail="effectiveRail"
      :temporary="mobile"
      width="200"
      class="glass-sidebar"
    >
      <!-- Back to Dashboard -->
      <div class="pa-4">
        <v-btn
          :to="{ name: 'Dashboard' }"
          variant="text"
          elevation="0"
          color="primary"
          :block="!effectiveRail"
          :icon="effectiveRail"
          :prepend-icon="!effectiveRail ? 'mdi-arrow-left' : undefined"
        >
        <v-icon icon="mdi-arrow-left" v-if="effectiveRail" />
          <template v-if="!effectiveRail">Back to Dashboard</template>
        </v-btn>
      </div>

      <v-divider class="my-2" />

      <!-- Library Navigation -->
      <v-list density="comfortable">
        <v-list-subheader v-if="!effectiveRail" class="text-overline font-weight-bold">
          Library
        </v-list-subheader>

        <v-list-item
          :to="{ name: 'Library', params: { id: libraryId } }"
          prepend-icon="mdi-view-dashboard-outline"
          :title="!effectiveRail ? 'Overview' : undefined"
          exact  
        />

        <v-divider class="my-2" />

        <v-list-subheader v-if="!effectiveRail" class="text-overline font-weight-bold">
          Content
        </v-list-subheader>

        <v-list-item
          :to="{ name: 'LibraryItems', params: { id: libraryId } }"
          prepend-icon="mdi-bookshelf"
          :title="!effectiveRail ? 'All Content' : undefined"
          :value="'library-items'"
        />

        <v-list-item
          :to="{ name: 'LibraryNotes', params: { id: libraryId } }"
          prepend-icon="mdi-note-text"
          :title="!effectiveRail ? 'Notes' : undefined"
          :value="'library-notes'"
        />

        <v-list-item
          :to="{ name: 'LibraryCharacters', params: { id: libraryId } }"
          prepend-icon="mdi-account-circle"
          :title="!effectiveRail ? 'Characters' : undefined"
          :value="'library-characters'"
        />

        <v-list-item
          :to="{ name: 'LibraryMagicItems', params: { id: libraryId } }"
          prepend-icon="mdi-treasure-chest"
          :title="!effectiveRail ? 'Magic Items' : undefined"
          :value="'library-magic-items'"
        />

        <v-list-item
          :to="{ name: 'LibraryStatBlocks', params: { id: libraryId } }"
          prepend-icon="mdi-sword-cross"
          :title="!effectiveRail ? 'Stat Blocks' : undefined"
          :value="'library-stat-blocks'"
        />

        <v-list-item
          :to="{ name: 'LibraryJsonImport', params: { id: libraryId } }"
          prepend-icon="mdi-import"
          :title="!effectiveRail ? 'JSON Import' : undefined"
          :value="'json-import'"
        />

        <v-divider class="my-2" />

        <v-list-subheader v-if="!effectiveRail" class="text-overline font-weight-bold">
          Organization
        </v-list-subheader>

        <v-list-item
          :to="{ name: 'LibraryTags', params: { id: libraryId } }"
          prepend-icon="mdi-tag-multiple"
          :title="!effectiveRail ? 'Tags' : undefined"
          :value="'tags'"
        />

        <v-list-item
          prepend-icon="mdi-folder"
          :title="!effectiveRail ? 'Collections' : undefined"
          :value="'collections'"
        />

        <v-divider class="my-2" />

        <v-list-subheader v-if="!effectiveRail" class="text-overline font-weight-bold">
          Management
        </v-list-subheader>

        <v-list-item
          v-if="canManage"
          prepend-icon="mdi-account-group"
          :title="!effectiveRail ? 'Sharing' : undefined"
          :value="'sharing'"
        />

        <v-list-item
          :to="{ name: 'LibrarySettings', params: { id: libraryId } }"
          prepend-icon="mdi-cog"
          :title="!effectiveRail ? 'Library Settings' : undefined"
          :value="'settings'"
        />
      </v-list>


    </v-navigation-drawer>

    <v-main class="gradient-background">
      <v-container fluid class="pa-lg-8 pa-md-6 pa-sm-1" >
        <router-view />
      </v-container>
    </v-main>

    <!-- Right Sidebar -->
    <v-navigation-drawer
      v-model="rightDrawer"
      location="right"
      :temporary="mobile"
      width="350"
      class="glass-sidebar"
    >
      <combat-encounter />
    </v-navigation-drawer>

    <!-- Global Item Dialogs -->
    <global-quick-item-view />
    <global-item-dialog />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useLibraryStore } from '@/stores/library'
import { useToast } from 'vue-toastification'
import UserMenu from '@/components/common/UserMenu.vue'
import QuickActions from '@/components/common/QuickActions.vue'
import GlobalItemDialog from '@/components/items/GlobalItemDialog.vue'
import GlobalQuickItemView from '@/components/items/GlobalQuickItemView.vue'
import CombatEncounter from '@/components/combat/CombatEncounter.vue'
import { useCombatEncountersStore } from '@/stores/combatEncounters'

const { mobile } = useDisplay()

const drawer = ref(false)
const rail = ref(true)
const rightDrawer = ref(true)
const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const combatEncountersStore = useCombatEncountersStore()
const toast = useToast()

const libraryId = computed(() => {
  const id = route.params.id || route.params.libraryId
  return id ? Number(id) : null
})

const currentLibrary = computed(() => libraryStore.currentLibrary)

const canManage = computed(() => ['OWNER', 'EDITOR'].includes(currentLibrary.value?.role || ''))

const roleColor = computed(() => {
  switch (currentLibrary.value?.role) {
    case 'OWNER': return 'primary'
    case 'EDITOR': return 'secondary'
    case 'VIEWER': return 'info'
    default: return 'grey'
  }
})

// Computed rail state - disable on mobile
const effectiveRail = computed(() => mobile.value ? false : rail.value)

// Toggle rail (only works on desktop)
function toggleRail() {
  if (!mobile.value) {
    rail.value = !rail.value
  }
}

// On mobile, drawer should be temporary and closed by default
watch(mobile, (isMobile) => {
  if (isMobile) {
    rail.value = false
    drawer.value = false
    rightDrawer.value = false
  } else {
    drawer.value = true
    rightDrawer.value = true
  }
}, { immediate: true })

// Fetch library when ID changes
watch(libraryId, async (newId, oldId) => {
  if (newId) {
    try {
      await libraryStore.fetchLibrary(newId)
      
      // Fetch combat encounters for the library (non-blocking)
      try {
        await combatEncountersStore.fetchEncounters(newId)
      } catch (encounterError) {
        console.error('Failed to load combat encounters:', encounterError)
        // Don't block library load if encounters fail
      }
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
  
  // Clear encounters when leaving a library
  if (oldId && !newId) {
    combatEncountersStore.clearEncounters()
  }
}, { immediate: true })

onMounted(async () => {
  if (libraryId.value) {
    try {
      await libraryStore.fetchLibrary(libraryId.value)
      
      // Fetch combat encounters for the library (non-blocking)
      try {
        await combatEncountersStore.fetchEncounters(libraryId.value)
      } catch (encounterError) {
        console.error('Failed to load combat encounters:', encounterError)
        // Don't block library load if encounters fail
      }
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
})

</script>

<style scoped>
:deep(.v-list-item--active) {
  background: rgba(220, 20, 60, 0.2) !important;
  border-left: 3px solid #DC143C;
}

:deep(.v-list-subheader) {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
}
</style>
