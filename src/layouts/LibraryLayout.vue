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
          <portal-control-menu class="mx-2" />

        </div>
      </v-toolbar-title>

      <v-spacer />

      <!-- Dice Roller -->
      <dice-roller class="mx-2" />
      
      <!-- Portal Control Menu -->

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

      <!-- Tabs for Menu and Folders -->
      <div class="sidebar-tabs-wrapper">
        <v-btn
          v-if="!effectiveRail"
          icon
          size="small"
          variant="text"
          class="tab-nav-btn"
          :disabled="sidebarTab === 'menu'"
          @click="sidebarTab = 'menu'"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-tabs
        v-if="!effectiveRail"
          v-model="sidebarTab"
          :color="effectiveRail ? undefined : 'primary'"
          :grow="effectiveRail"
          density="compact"
          class="sidebar-tabs"
          :show-arrows="false"
          @update:model-value="handleTabChange"
          @keydown="handleTabKeydown"
        >
          <v-tab
            :value="'menu'"
            :icon="effectiveRail ? 'mdi-menu' : undefined"
          >
            <span v-if="!effectiveRail">Menu</span>
          </v-tab>
          <v-tab
            :value="'folders'"
            :icon="effectiveRail ? 'mdi-folder' : undefined"
          >
            <span v-if="!effectiveRail">Folders</span>
          </v-tab>
        </v-tabs>
        <v-btn
          v-if="!effectiveRail"
          icon
          size="small"
          variant="text"
          class="tab-nav-btn"
          :disabled="sidebarTab === 'folders'"
          @click="sidebarTab = 'folders'"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <!-- Menu Tab Content -->
      <v-window v-model="sidebarTab">
        <v-window-item value="menu">
          <v-list density="compact">
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
              :to="{ name: 'LibraryPortalViews', params: { id: libraryId } }"
              prepend-icon="mdi-view-dashboard-variant"
              :title="!effectiveRail ? 'Portal Views' : undefined"
              :value="'portal-views'"
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
        </v-window-item>

        <!-- Folders Tab Content (Tags grouped by folder) -->
        <v-window-item value="folders">
          <v-list density="compact" v-if="!effectiveRail" class="folders-list">
            <!-- Loading State -->
            <div v-if="tagsStore.isLoading" class="pa-2 text-center">
              <v-progress-circular indeterminate size="20" />
            </div>

            <!-- Empty State -->
            <div v-else-if="Object.keys(tagsStore.tagsByFolder).length === 0" class="pa-2 text-center">
              <v-icon icon="mdi-folder-off" size="32" color="grey-lighten-1" class="mb-1" />
              <p class="text-caption text-grey-lighten-1">No tags yet</p>
            </div>

            <!-- Tags by Folder -->
            <template v-else>
              <v-list-group
                v-for="folderName in sortedFolderNames"
                :key="folderName"
                :value="folderName"
                class="folder-group"
              >
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :prepend-icon="'mdi-folder'"
                    :title="folderName"
                    density="compact"
                  >
                    <template #prepend>
                      <v-icon icon="mdi-folder" size="small" />
                    </template>
                    <template #append>
                      <v-chip size="x-small" class="ml-1">{{ tagsStore.tagsByFolder[folderName].length }}</v-chip>
                    </template>
                  </v-list-item>
                </template>

                <v-list-item
                  v-for="tag in tagsStore.tagsByFolder[folderName]"
                  :key="tag.id"
                  :to="{ name: 'TagLibraryItems', params: { id: libraryId, tagId: tag.id } }"
                  :title="tag.name"
                  density="compact"
                  class="tag-item draggable-tag"
                  draggable="true"
                  @dragstart="handleTagDragStart($event, tag.id)"
                >
                  <template #prepend>
                    <v-icon :color="tag.color" icon="mdi-tag" size="small" />
                  </template>
                </v-list-item>
              </v-list-group>
            </template>
          </v-list>

          <!-- Rail Mode: Show icon list -->
          <v-list density="compact" v-else>
            <v-list-item
              v-for="folderName in sortedFolderNames"
              :key="folderName"
              :prepend-icon="'mdi-folder'"
            >
              <v-menu location="right" offset="10">
                <template #activator="{ props }">
                  <v-list-item v-bind="props" />
                </template>
                <v-list density="compact">
                  <v-list-subheader>{{ folderName }}</v-list-subheader>
                  <v-list-item
                    v-for="tag in tagsStore.tagsByFolder[folderName]"
                    :key="tag.id"
                    :to="{ name: 'TagLibraryItems', params: { id: libraryId, tagId: tag.id } }"
                    :prepend-icon="'mdi-tag'"
                    :title="tag.name"
                    draggable="true"
                    @dragstart="handleTagDragStart($event, tag.id)"
                  >
                    <template #prepend>
                      <v-icon :color="tag.color" icon="mdi-tag" size="small" />
                    </template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-list-item>
          </v-list>
        <div class="d-flex justify-end mb-2 mr-2">
          <v-btn
            variant="text"
            size="small"
            color="primary"
            :to="{ name: 'LibraryTags', params: { id: libraryId } }"
            prepend-icon="mdi-tag-multiple"
            title="Manage library tags"
          >
            Manage Tags
          </v-btn>
        </div>
        </v-window-item> 
      </v-window>
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
      :color="isPapyrusTheme ? 'sidebar-background' : undefined"
      class="glass-sidebar"
    >
      <combat-encounter />
    </v-navigation-drawer>

    <!-- Global Item Dialogs -->
    <global-quick-item-view />
    <global-item-dialog />

    <!-- 3D Dice Box -->
    <DiceBox3D />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useToast } from 'vue-toastification'
import UserMenu from '@/components/common/UserMenu.vue'
import QuickActions from '@/components/common/QuickActions.vue'
import GlobalItemDialog from '@/components/items/GlobalItemDialog.vue'
import GlobalQuickItemView from '@/components/items/GlobalQuickItemView.vue'
import CombatEncounter from '@/components/combat/CombatEncounter.vue'
import DiceRoller from '@/components/dice/DiceRoller.vue'
import DiceBox3D from '@/components/dice/DiceBox3D.vue'
import PortalControlMenu from '@/components/portal/PortalControlMenu.vue'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { usePortalViewsStore } from '@/stores/portalViews'

const { mobile } = useDisplay()
const theme = useTheme()

const drawer = ref(false)
const rail = ref(true)
const rightDrawer = ref(true)
const sidebarTab = ref('menu')
const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const combatEncountersStore = useCombatEncountersStore()
const portalViewsStore = usePortalViewsStore()
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

const isPapyrusTheme = computed(() => theme.global.name.value === 'papyrusTheme')

// Computed rail state - disable on mobile
const effectiveRail = computed(() => mobile.value ? false : rail.value)

// Sorted folder names for consistent ordering
const sortedFolderNames = computed(() => {
  return Object.keys(tagsStore.tagsByFolder).sort()
})

// Check if portal viewer is connected (placeholder - you might want to track this via socket)
const isPortalViewerConnected = computed(() => {
  // This would ideally be tracked via the portal socket
  // For now, just show if portal is active
  return !!portalViewsStore.activePortal
})

// Toggle rail (only works on desktop)
function toggleRail() {
  if (!mobile.value) {
    rail.value = !rail.value
  }
}

// Handle tab navigation with arrow keys
function handleTabChange(newTab: unknown) {
  if (typeof newTab === 'string') {
    sidebarTab.value = newTab
  }
}

// Handle keyboard navigation for tabs
function handleTabKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    const tabs = ['menu', 'folders']
    const currentIndex = tabs.indexOf(sidebarTab.value)
    if (event.key === 'ArrowLeft' && currentIndex > 0) {
      sidebarTab.value = tabs[currentIndex - 1]
    } else if (event.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
      sidebarTab.value = tabs[currentIndex + 1]
    }
  }
}

// Handle tag drag start
function handleTagDragStart(event: DragEvent, tagId: number) {
  if (event.dataTransfer && event.target instanceof HTMLElement) {
    event.dataTransfer.effectAllowed = 'copy'
    // Store tag ID in dataTransfer
    event.dataTransfer.setData('application/json', JSON.stringify({ type: 'tag', tagId }))
    // Also store as text/plain for better browser compatibility
    event.dataTransfer.setData('text/plain', `tag:${tagId}`)
    
    // Set a custom drag image
    const dragImage = event.target.cloneNode(true) as HTMLElement
    dragImage.style.opacity = '0.8'
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    dragImage.style.pointerEvents = 'none'
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage)
      }
    }, 0)
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
      
      // Fetch tags for the library (non-blocking)
      try {
        await tagsStore.fetchTags(newId)
      } catch (tagError) {
        console.error('Failed to load tags:', tagError)
        // Don't block library load if tags fail
      }
      
      // Fetch combat encounters for the library (non-blocking)
      try {
        await combatEncountersStore.fetchEncounters(newId)
      } catch (encounterError) {
        console.error('Failed to load combat encounters:', encounterError)
        // Don't block library load if encounters fail
      }
      
      // Fetch portal views for the library (non-blocking)
      try {
        await portalViewsStore.fetchPortalViews(newId)
      } catch (portalError) {
        console.error('Failed to load portal views:', portalError)
        // Don't block library load if portals fail
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
      
      // Fetch tags for the library (non-blocking)
      try {
        await tagsStore.fetchTags(libraryId.value)
      } catch (tagError) {
        console.error('Failed to load tags:', tagError)
        // Don't block library load if tags fail
      }
      
      // Fetch combat encounters for the library (non-blocking)
      try {
        await combatEncountersStore.fetchEncounters(libraryId.value)
      } catch (encounterError) {
        console.error('Failed to load combat encounters:', encounterError)
        // Don't block library load if encounters fail
      }
      
      // Fetch portal views for the library (non-blocking)
      try {
        await portalViewsStore.fetchPortalViews(libraryId.value)
      } catch (portalError) {
        console.error('Failed to load portal views:', portalError)
        // Don't block library load if portals fail
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
  font-size: 0.65rem;
}

.sidebar-tabs-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-tabs {
  flex: 1;
}

.tab-nav-btn {
  min-width: 32px;
  width: 32px;
  height: 32px;
}

:deep(.v-tabs) {
  min-height: 40px;
}

:deep(.v-tabs__wrapper) {
  overflow: visible !important;
}

:deep(.v-slide-group__prev),
:deep(.v-slide-group__next) {
  display: none !important;
}

:deep(.v-tab) {
  min-width: auto;
  padding: 0 8px;
  font-size: 0.875rem;
}

/* Compact folder list styling */
.folders-list :deep(.v-list-item) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.folders-list :deep(.v-list-item__prepend) {
  width: 24px;
  margin-inline-end: 8px;
}

.folders-list :deep(.v-list-item__append) {
  margin-inline-start: 4px;
}

.folders-list :deep(.v-list-group__items) {
  padding-bottom: 16px;
  padding-top: 4px;
  padding-left: 16px !important;
  margin-left: 15px !important;
}

.folders-list :deep(.v-list-group__items .v-list-item) {
  padding-left: 8px !important;
  min-height: 24px;
  padding-top: 4px;
  padding-bottom: 4px;
  margin-left: 0 !important;
  font-size: 0.8125rem; /* 13px */
}

.folders-list :deep(.v-list-group__items .v-list-item__prepend) {
  width: 20px;
  margin-inline-end: 6px;
}

.folders-list :deep(.v-list-group__items .v-list-item .v-list-item-title) {
  font-size: 0.8125rem !important; /* 13px */
}

/* Draggable tag styles */
.draggable-tag {
  cursor: grab;
  user-select: none;
}

.draggable-tag:active {
  cursor: grabbing;
}

.draggable-tag:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}

.folders-list :deep(.v-list-group__header) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.folders-list :deep(.v-list-group__header .v-list-item) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.folders-list :deep(.v-chip) {
  height: 16px;
  font-size: 10px;
  padding: 0 4px;
}
</style>
