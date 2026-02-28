<template>
  <v-app>
    <v-app-bar elevation="0" class="glass-header" height="70">
      <v-app-bar-nav-icon @click="mobile ? drawer = !drawer : toggleRail()" />


      
      <v-toolbar-title class="d-flex align-center">
        <span 
          class="text-h6 font-weight-bold library-title"
          style="cursor: pointer;"
          @click="goToDashboard"
        >
          {{ currentLibrary?.name || 'Library' }}
        </span>
        
        <!-- Portal Control Menu -->
        <portal-control-menu class="ml-4" />
        
        <!-- DM Screen Control Menu -->
        <dm-screen-control-menu class="ml-2" />
      </v-toolbar-title>

      <v-spacer />
      
      <!-- Compact Digital Clock (Centered) -->
      <digital-clock compact class="clock-center" />
      
      <v-spacer />
      
      <!-- Dice Roller -->
      <dice-roller class="mr-1" />
      
      <quick-actions class="mr-2" />
      
      <!-- Right Sidebar Toggle -->
      <v-btn
        icon
        class="sidebar-toggle-btn mr-2"
        :permanent="!mobile"
        @click="rightDrawer = !rightDrawer"
      >
        <v-icon :icon="rightDrawer ? 'mdi-page-layout-sidebar-right' : 'mdi-page-layout-body'" />
        <v-tooltip activator="parent" location="bottom">
          {{ rightDrawer ? 'Hide sidebar' : 'Show sidebar' }}
        </v-tooltip>
      </v-btn>
      
      <user-menu />
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :rail="effectiveRail"
      :temporary="mobile"
      width="200"
      class="glass-sidebar"
    >
     

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
              prepend-icon="mdi-home"
              :title="!effectiveRail ? 'Overview' : undefined"
              exact  
              class="library-menu-item"
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
              prepend-icon="mdi-monitor"
              :title="!effectiveRail ? 'Portal Views' : undefined"
              :value="'portal-views'"
            />

            <v-list-item
              :to="{ name: 'LibraryDmScreens', params: { id: libraryId } }"
              prepend-icon="mdi-monitor-dashboard"
              :title="!effectiveRail ? 'DM Screens' : undefined"
              :value="'dm-screens'"
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
            <div v-else-if="tagsStore.tags.length === 0 && tagsStore.folders.length === 0" class="pa-2 text-center">
              <v-icon icon="mdi-folder-off" size="32" color="grey-lighten-1" class="mb-1" />
              <p class="text-caption text-grey-lighten-1">No tags yet</p>
            </div>

            <!-- Tags by Folder -->
            <template v-else>
              <!-- Folders with tags -->
              <v-list-group
                v-for="folder in tagsStore.sortedFolders"
                :key="folder.id"
                :value="folder.id"
                class="folder-group"
              >
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :prepend-icon="'mdi-folder'"
                    :title="folder.name"
                    density="compact"
                  >
                    <template #prepend>
                      <v-icon icon="mdi-folder" size="small" />
                    </template>
                    <template #append>
                      <v-chip size="x-small" class="ml-1">{{ getTagsInFolder(folder.id).length }}</v-chip>
                    </template>
                  </v-list-item>
                </template>

                <v-list-item
                  v-for="tag in getTagsInFolder(folder.id)"
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

              <!-- Uncategorized tags -->
              <v-list-group
                v-if="uncategorizedTags.length > 0"
                value="uncategorized"
                class="folder-group"
              >
                <template #activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    prepend-icon="mdi-tag-multiple"
                    title="Uncategorized"
                    density="compact"
                  >
                    <template #prepend>
                      <v-icon icon="mdi-tag-multiple" size="small" color="grey" />
                    </template>
                    <template #append>
                      <v-chip size="x-small" class="ml-1">{{ uncategorizedTags.length }}</v-chip>
                    </template>
                  </v-list-item>
                </template>

                <v-list-item
                  v-for="tag in uncategorizedTags"
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
              v-for="folder in tagsStore.sortedFolders"
              :key="folder.id"
              :prepend-icon="'mdi-folder'"
            >
              <v-menu location="right" offset="10">
                <template #activator="{ props }">
                  <v-list-item v-bind="props" />
                </template>
                <v-list density="compact">
                  <v-list-subheader>{{ folder.name }}</v-list-subheader>
                  <v-list-item
                    v-for="tag in getTagsInFolder(folder.id)"
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
            <!-- Uncategorized in rail mode -->
            <v-list-item
              v-if="uncategorizedTags.length > 0"
              prepend-icon="mdi-tag-multiple"
            >
              <v-menu location="right" offset="10">
                <template #activator="{ props }">
                  <v-list-item v-bind="props" />
                </template>
                <v-list density="compact">
                  <v-list-subheader>Uncategorized</v-list-subheader>
                  <v-list-item
                    v-for="tag in uncategorizedTags"
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
      <v-container 
        fluid 
        :class="route.meta.noPadding ? 'pa-0' : 'pa-lg-8 pa-md-6 pa-sm-1'"
      >
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
    <global-item-viewer-dialog />
    <global-item-editor-dialog />
    <global-file-viewer-dialog />

    <!-- DM Screen Cards in Hand -->
    <dm-screen-cards-in-hand
      :left-sidebar-width="leftSidebarWidth"
      :right-sidebar-width="rightSidebarWidth"
    />

    <!-- 3D Dice Box -->
    <DiceBox3D />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useToast } from 'vue-toastification'
import UserMenu from '@/components/common/UserMenu.vue'
import QuickActions from '@/components/common/QuickActions.vue'
import GlobalQuickItemView from '@/components/items/GlobalQuickItemView.vue'
import CombatEncounter from '@/components/combat/CombatEncounter.vue'
import DiceRoller from '@/components/dice/DiceRoller.vue'
import DiceBox3D from '@/components/dice/DiceBox3D.vue'
import PortalControlMenu from '@/components/portal/PortalControlMenu.vue'
import DmScreenControlMenu from '@/components/dmScreen/DmScreenControlMenu.vue'
import DigitalClock from '@/components/common/DigitalClock.vue'
import GlobalItemViewerDialog from '@/components/dialogs/GlobalItemViewerDialog.vue'
import GlobalItemEditorDialog from '@/components/dialogs/GlobalItemEditorDialog.vue'
import GlobalFileViewerDialog from '@/components/dialogs/GlobalFileViewerDialog.vue'
import DmScreenCardsInHand from '@/components/dmScreen/DmScreenCardsInHand.vue'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useDmScreensStore } from '@/stores/dmScreens'

const { mobile } = useDisplay()
const theme = useTheme()

const drawer = ref(false)
const rail = ref(true)
const rightDrawer = ref(false)
const sidebarTab = ref('menu')
const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const combatEncountersStore = useCombatEncountersStore()
const portalViewsStore = usePortalViewsStore()
const dmScreensStore = useDmScreensStore()
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

// Computed sidebar widths for child components
const leftSidebarWidth = computed(() => {
  if (mobile.value || !drawer.value) return 0
  return effectiveRail.value ? 56 : 200
})

const rightSidebarWidth = computed(() => {
  if (mobile.value || !rightDrawer.value) return 0
  return 350
})

// Get tags in a specific folder
function getTagsInFolder(folderId: number) {
  return tagsStore.tags
    .filter(tag => tag.folderId === folderId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

// Uncategorized tags (no folder)
const uncategorizedTags = computed(() => {
  return tagsStore.tags
    .filter(tag => !tag.folderId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
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

function goToDashboard() {
  router.push({ name: 'Dashboard' })
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
    // Right drawer stays closed by default on desktop
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
      
      // Portal views are now loaded on-demand via PortalControlMenu
      // No longer auto-loading here
      
      // Fetch DM screens for the library (non-blocking)
      try {
        await dmScreensStore.fetchDmScreens(newId)
      } catch (dmScreenError) {
        console.error('Failed to load DM screens:', dmScreenError)
        // Don't block library load if DM screens fail
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
      
      // Portal views are now loaded on-demand via PortalControlMenu
      // No longer auto-loading here
      
      // Fetch DM screens for the library (non-blocking)
      try {
        await dmScreensStore.fetchDmScreens(libraryId.value)
      } catch (dmScreenError) {
        console.error('Failed to load DM screens:', dmScreenError)
        // Don't block library load if DM screens fail
      }
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
  
  // Listen for event to open encounter sidebar
  const handleOpenEncounterSidebar = () => {
    rightDrawer.value = true
  }
  window.addEventListener('open-encounter-sidebar', handleOpenEncounterSidebar)
  
  // Cleanup on unmount
  onUnmounted(() => {
    window.removeEventListener('open-encounter-sidebar', handleOpenEncounterSidebar)
  })
})

</script>

<style scoped>
/* Subtle app bar styling - less prominent */
:deep(.glass-header) {
  background: rgba(var(--v-theme-surface), 0.4) !important;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

:deep(.glass-header .v-toolbar-title) {
  opacity: 0.85;
}

:deep(.glass-header .v-btn) {
  opacity: 0.75;
}

:deep(.glass-header .v-btn:hover) {
  opacity: 1;
}

/* Subtle left sidebar styling - less prominent */
:deep(.glass-sidebar) {
  background: transparent !important;
  backdrop-filter: none;
  border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
}

:deep(.v-list-item--active) {
  background: transparent !important;
  border-left: none !important;
}

.library-title {
  transition: all 0.2s ease;
  opacity: 0.9;
}

.library-title:hover {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}

.library-menu-item {
  transition: all 0.2s ease;
}

.library-menu-item :deep(.v-list-item__prepend) {
  opacity: 0.8;
}

.library-menu-item:hover :deep(.v-list-item__prepend) {
  opacity: 1;
  transform: scale(1.1);
}

:deep(.v-list-subheader) {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.65rem;
  opacity: 0.7;
}

.sidebar-tabs-wrapper {
  display: flex;
  align-items: center;
  border-bottom: none !important;
  opacity: 0.8;
  background: transparent !important;
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
  opacity: 0.7;
  background: transparent !important;
}

:deep(.v-tab--selected) {
  opacity: 1;
  background: transparent !important;
}

/* Subtle list items */
:deep(.v-list-item) {
  opacity: 0.8;
  background: transparent !important;
}

:deep(.v-list-item:hover) {
  opacity: 1;
  background: transparent !important;
}

/* Subtle dividers */
:deep(.v-divider) {
  opacity: 0;
  border-color: transparent !important;
}

/* Compact folder list styling */
.folders-list :deep(.v-list-item) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
  background: transparent !important;
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
  background: transparent !important;
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
  background: transparent;
}

.folders-list :deep(.v-list-group__header) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
  background: transparent !important;
}

.folders-list :deep(.v-list-group__header .v-list-item) {
  min-height: 32px;
  padding-top: 4px;
  padding-bottom: 4px;
  background: transparent !important;
}

.folders-list :deep(.v-chip) {
  height: 16px;
  font-size: 10px;
  padding: 0 4px;
}

/* Sidebar toggle button - match QuickActions style */
.sidebar-toggle-btn {
  background: rgba(var(--v-theme-primary), 0.2) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-theme-primary), 0.3) !important;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.sidebar-toggle-btn:hover {
  background: rgba(var(--v-theme-primary), 0.3) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
  opacity: 1;
}

/* Center the clock in the app bar */
.clock-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>
