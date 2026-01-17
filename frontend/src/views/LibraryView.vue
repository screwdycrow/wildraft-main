<template>
  <div v-if="libraryStore.currentLibrary">
    <!-- Header with Library Title -->
    <v-row class="mb-4">
      <v-col cols="12" class="d-flex align-center">
        <!-- Library Title -->
        <div class="library-title-section">
          <h1 
            class="text-h5 font-weight-bold library-title-text"
            style="cursor: pointer;"
            @click="goToDashboard"
          >
            {{ libraryStore.currentLibrary.name }}
          </h1>
        </div>
      </v-col>
    </v-row>

    <!-- Quick Actions Row (Compact Cards) -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card 
          class="glass-card quick-action-compact-card"
          elevation="0"
          hover
          @click="viewStatBlocks"
        >
          <v-card-text class="d-flex align-center pa-3">
            <v-icon icon="mdi-sword-cross" color="primary" size="24" class="mr-3" />
            <div class="flex-1">
              <div class="text-body-2 font-weight-bold">Stat Blocks</div>
            </div>
            <v-icon icon="mdi-chevron-right" size="small" color="grey-lighten-1" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card 
          class="glass-card quick-action-compact-card"
          elevation="0"
          hover
          @click="viewCharacters"
        >
          <v-card-text class="d-flex align-center pa-3">
            <v-icon icon="mdi-account-multiple" color="secondary" size="24" class="mr-3" />
            <div class="flex-1">
              <div class="text-body-2 font-weight-bold">Characters</div>
            </div>
            <v-icon icon="mdi-chevron-right" size="small" color="grey-lighten-1" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card 
          class="glass-card quick-action-compact-card"
          elevation="0"
          hover
          @click="viewMagicItems"
        >
          <v-card-text class="d-flex align-center pa-3">
            <v-icon icon="mdi-treasure-chest" color="accent" size="24" class="mr-3" />
            <div class="flex-1">
              <div class="text-body-2 font-weight-bold">Magic Items</div>
            </div>
            <v-icon icon="mdi-chevron-right" size="small" color="grey-lighten-1" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card 
          class="glass-card quick-action-compact-card"
          elevation="0"
          hover
          @click="viewNotes"
        >
          <v-card-text class="d-flex align-center pa-3">
            <v-icon icon="mdi-note-text" color="info" size="24" class="mr-3" />
            <div class="flex-1">
              <div class="text-body-2 font-weight-bold">Notes</div>
            </div>
            <v-icon icon="mdi-chevron-right" size="small" color="grey-lighten-1" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tags Section with Most Used and Folders -->
    <v-row class="mb-4">
      <!-- Tags Display (3/4 width) -->
      <v-col cols="12" md="9" order="md-1">
        <v-card class="glass-card" elevation="0">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="section-header">
                <v-icon :icon="tagViewMode === 'mostUsed' ? 'mdi-fire' : 'mdi-clock-outline'" size="small" class="mr-2" />
                <span class="text-caption font-weight-bold text-uppercase">
                  {{ tagViewMode === 'mostUsed' ? 'Most Used Tags' : 'Recently Added Tags' }}
                </span>
              </div>
              <v-btn-toggle
                v-model="tagViewMode"
                mandatory
                density="compact"
                variant="outlined"
                color="primary"
                class="tag-view-toggle"
              >
                <v-btn value="mostUsed" size="small">
                  <v-icon icon="mdi-fire" size="small" class="mr-1" />
                  Most Used
                </v-btn>
                <v-btn value="recent" size="small">
                  <v-icon icon="mdi-clock-outline" size="small" class="mr-1" />
                  Recent
                </v-btn>
              </v-btn-toggle>
            </div>
            
            <!-- Loading State -->
            <div v-if="tagsStore.isLoading" class="pa-8 text-center">
              <v-progress-circular indeterminate size="32" color="primary" />
            </div>
            
            <!-- Tags Grid (4x4) -->
            <div v-else-if="displayedTags.length > 0" class="tags-grid">
              <tag-card
                v-for="tag in displayedTags"
                :key="tag.id"
                :tag="tag"
                :can-edit="false"
                :draggable="false"
                @click="viewTagItems(tag)"
              />
            </div>
            
            <div v-else class="empty-state pa-8 text-center">
              <v-icon icon="mdi-tag-off" size="48" color="grey-lighten-1" class="mb-2" />
              <p class="text-body-2 text-grey-lighten-1">
                {{ tagViewMode === 'mostUsed' ? 'No tags with items yet' : 'No tags yet' }}
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Tag Folders (1/4 width) -->
      <v-col cols="12" md="3" order="md-2">
        <v-card class="glass-card" elevation="0">
          <v-card-text class="pa-4">
            <div class="section-header mb-4">
              <v-icon icon="mdi-folder-multiple" size="small" class="mr-2" />
              <span class="text-caption font-weight-bold text-uppercase">Folders</span>
            </div>
            
            <!-- Loading State -->
            <div v-if="tagsStore.isLoading" class="pa-4 text-center">
              <v-progress-circular indeterminate size="24" color="primary" />
            </div>

            <!-- Folders Accordion -->
            <v-expansion-panels
              v-else-if="tagsStore.folders.length > 0 || uncategorizedTags.length > 0"
              variant="accordion"
              class="folders-accordion"
            >
              <!-- Folders with tags -->
              <v-expansion-panel
                v-for="folder in tagsStore.sortedFolders"
                :key="folder.id"
                class="folder-panel"
              >
                <v-expansion-panel-title class="folder-panel-title">
                  <div class="d-flex align-center flex-1">
                    <v-icon icon="mdi-folder" size="small" color="primary" class="mr-2" />
                    <span class="font-weight-medium text-truncate">{{ folder.name }}</span>
                    <v-chip size="x-small" class="ml-2" color="primary" variant="flat">
                      {{ getTagsInFolder(folder.id).length }}
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="folder-panel-content">
                  <div class="tag-cards-list">
                    <v-card
                      v-for="tag in getTagsInFolder(folder.id)"
                      :key="tag.id"
                      :to="{ name: 'TagLibraryItems', params: { id: libraryId, tagId: tag.id } }"
                      class="tag-mini-card"
                      elevation="0"
                      hover
                    >
                      <v-card-text class="pa-1">
                        <div class="d-flex align-center">
                          <v-icon :color="tag.color" icon="mdi-tag" size="small" class="mr-2" />
                          <span class="text-body-2 font-weight-medium flex-1 text-truncate">{{ tag.name }}</span>
                          <v-chip
                            v-if="tag.itemCount"
                            size="x-small"
                            variant="text"
                            class="ml-1"
                          >
                            {{ tag.itemCount }}
                          </v-chip>
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Uncategorized tags -->
              <v-expansion-panel
                v-if="uncategorizedTags.length > 0"
                value="uncategorized"
                class="folder-panel"
              >
                <v-expansion-panel-title class="folder-panel-title">
                  <div class="d-flex align-center flex-1">
                    <v-icon icon="mdi-tag-multiple" size="small" color="grey" class="mr-2" />
                    <span class="font-weight-medium">Uncategorized</span>
                    <v-chip size="x-small" class="ml-2" color="grey" variant="flat">
                      {{ uncategorizedTags.length }}
                    </v-chip>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="folder-panel-content">
                  <div class="tag-cards-list">
                    <v-card
                      v-for="tag in uncategorizedTags"
                      :key="tag.id"
                      :to="{ name: 'TagLibraryItems', params: { id: libraryId, tagId: tag.id } }"
                      class="tag-mini-card"
                      elevation="0"
                      hover
                    >
                      <v-card-text class="pa-1">
                        <div class="d-flex align-center">
                          <v-icon :color="tag.color" icon="mdi-tag" size="small" class="mr-2" />
                          <span class="text-body-2 font-weight-medium flex-1 text-truncate">{{ tag.name }}</span>
                          <v-chip
                            v-if="tag.itemCount"
                            size="x-small"
                            variant="text"
                            class="ml-1"
                          >
                            {{ tag.itemCount }}
                          </v-chip>
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Empty State -->
            <div v-else class="empty-state pa-4 text-center">
              <v-icon icon="mdi-folder-off" size="48" color="grey-lighten-1" class="mb-2" />
              <p class="text-caption text-grey-lighten-1">No tags yet</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>


  </div>

  <!-- Loading State -->
  <v-row v-else-if="libraryStore.isLoading">
    <v-col cols="12" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading library...</p>
    </v-col>
  </v-row>

  <!-- Error State -->
  <v-row v-else>
    <v-col cols="12">
      <v-card class="glass-card pa-12 text-center" elevation="0">
        <v-icon icon="mdi-alert-circle" size="120" color="error" class="mb-6" />
        <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
          Library Not Found
        </h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6">
          The library you're looking for doesn't exist or you don't have access to it.
        </p>
        <v-btn
          color="primary"
          size="large"
          :to="{ name: 'Dashboard' }"
          prepend-icon="mdi-arrow-left"
        >
          Back to Dashboard
        </v-btn>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useDialogsStore } from '@/stores/dialogs'
import { useToast } from 'vue-toastification'
import DigitalClock from '@/components/common/DigitalClock.vue'
import TagCard from '@/components/tags/TagCard.vue'
import type { ItemType } from '@/types/item.types'
import type { Tag } from '@/types/tag.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const dmScreensStore = useDmScreensStore()
const combatEncountersStore = useCombatEncountersStore()
const portalViewsStore = usePortalViewsStore()
const dialogsStore = useDialogsStore()
const toast = useToast()
const tagViewMode = ref<'mostUsed' | 'recent'>('mostUsed')

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})


const canEdit = computed(() => 
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

const activeDmScreen = computed(() => dmScreensStore.activeDmScreen)
const activeEncounter = computed(() => combatEncountersStore.activeEncounter)
const activePortal = computed(() => portalViewsStore.activePortal)

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

// Most used tags (sorted by itemCount)
const mostUsedTags = computed(() => {
  return [...tagsStore.tags]
    .filter(tag => (tag.itemCount || 0) > 0)
    .sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0))
    .slice(0, 16) // Top 16 most used (4x4 grid)
})

// Recently added tags (sorted by createdAt)
const recentlyAddedTags = computed(() => {
  return [...tagsStore.tags]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 16) // Most recent 16 tags (4x4 grid)
})

// Displayed tags based on view mode
const displayedTags = computed(() => {
  return tagViewMode.value === 'mostUsed' ? mostUsedTags.value : recentlyAddedTags.value
})

function viewTagItems(tag: Tag) {
  if (libraryId.value) {
    router.push({
      name: 'TagLibraryItems',
      params: {
        id: libraryId.value,
        tagId: tag.id,
      },
    })
  }
}


// Provide function to open right sidebar (for encounter)
const openRightSidebar = () => {
  // Dispatch custom event that LibraryLayout can listen to
  window.dispatchEvent(new CustomEvent('open-encounter-sidebar'))
}
provide('openRightSidebar', openRightSidebar)

onMounted(async () => {
  if (libraryId.value) {
    // Load tags for the dashboard
    try {
      await tagsStore.fetchTags(libraryId.value)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }

    // Load DM screens
    try {
      await dmScreensStore.fetchDmScreens(libraryId.value)
    } catch (error) {
      console.error('Failed to load DM screens:', error)
    }

    // Load encounters
    try {
      await combatEncountersStore.fetchEncounters(libraryId.value)
    } catch (error) {
      console.error('Failed to load encounters:', error)
    }

    // Load portal views (non-blocking)
    try {
      await portalViewsStore.fetchPortalViews(libraryId.value)
    } catch (error) {
      console.error('Failed to load portal views:', error)
    }
  }
})

function createItem(itemType: ItemType) {
  if (!libraryId.value) return
  dialogsStore.openItemEditorCreate(itemType, libraryId.value)
}

function openDmScreen() {
  if (activeDmScreen.value) {
    router.push({
      name: 'DmScreen',
      params: {
        id: activeDmScreen.value.libraryId,
        dmScreenId: activeDmScreen.value.id,
      },
    })
  }
}

function goToDmScreens() {
  if (libraryId.value) {
    router.push({
      name: 'LibraryDmScreens',
      params: {
        id: libraryId.value,
      },
    })
  }
}

function openDmScreenById(screenId: number) {
  const screen = dmScreensStore.dmScreens.find(s => s.id === screenId)
  if (screen) {
    router.push({
      name: 'DmScreen',
      params: {
        id: screen.libraryId,
        dmScreenId: screen.id,
      },
    })
  }
}

function viewStatBlocks() {
  if (libraryId.value) {
    router.push({ name: 'LibraryStatBlocks', params: { id: libraryId.value } })
  }
}

function viewCharacters() {
  if (libraryId.value) {
    router.push({ name: 'LibraryCharacters', params: { id: libraryId.value } })
  }
}

function viewMagicItems() {
  if (libraryId.value) {
    router.push({ name: 'LibraryMagicItems', params: { id: libraryId.value } })
  }
}

function viewNotes() {
  if (libraryId.value) {
    router.push({ name: 'LibraryNotes', params: { id: libraryId.value } })
  }
}

function openPortal() {
  if (activePortal.value && libraryId.value) {
    router.push({
      name: 'PortalView',
      params: {
        id: libraryId.value,
        portalViewId: activePortal.value.id,
      },
    })
  }
}

function goToPortals() {
  if (libraryId.value) {
    router.push({ name: 'LibraryPortalViews', params: { id: libraryId.value } })
  }
}

function goToDashboard() {
  router.push({ name: 'Dashboard' })
}

function openEncounter() {
  // Open the right sidebar with encounter
  openRightSidebar()
  
  // If no active encounter, navigate to encounters view
  if (!activeEncounter.value && libraryId.value) {
    // You might want to navigate to an encounters view or create one
    // For now, just open the sidebar
  }
}
</script>

<style scoped>
.shortcut-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.shortcut-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.flex-1 {
  flex: 1;
}

.min-width-0 {
  min-width: 0;
}

/* Section Header */
.section-header {
  display: flex;
  align-items: center;
  padding: 8px 0;
  opacity: 0.8;
}

/* Accordion Styling */
.folders-accordion {
  width: 100%;
}

.folders-accordion :deep(.v-expansion-panel) {
  background: rgba(var(--v-theme-surface), 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px !important;
  margin-bottom: 8px;
  backdrop-filter: blur(8px);
}

.folders-accordion :deep(.v-expansion-panel-title) {
  padding: 12px 16px;
  min-height: 48px;
}

.folder-panel-title {
  opacity: 0.9;
}

.folder-panel-title:hover {
  opacity: 1;
}

.folder-panel-content {
  padding: 8px !important;
}

/* Tags Grid (4x4) */
.tags-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1400px) {
  .tags-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 960px) {
  .tags-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .tags-grid {
    grid-template-columns: 1fr;
  }
}

/* Tag View Toggle */
.tag-view-toggle {
  background: rgba(var(--v-theme-surface), 0.3) !important;
  border-radius: 8px;
}

.tag-view-toggle :deep(.v-btn) {
  border-radius: 6px;
  text-transform: none;
  font-weight: 500;
}

/* Tag Cards List (for folders) */
.tag-cards-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-mini-card {
  background: rgba(var(--v-theme-surface), 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tag-mini-card:hover {
  background: rgba(var(--v-theme-surface), 0.25) !important;
  border-color: rgba(var(--v-theme-primary), 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}


.empty-state {
  opacity: 0.6;
}

/* Library Title Section */
.library-title-section {
  flex: 0 0 auto;
}

.library-title-text {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.9;
  transition: all 0.2s ease;
}

.library-title-text:hover {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}


/* Quick Action Compact Cards */
.quick-action-compact-card {
  background: rgba(var(--v-theme-surface), 0.2) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
}

.quick-action-compact-card:hover {
  background: rgba(var(--v-theme-surface), 0.3) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(var(--v-theme-primary), 0.3);
}


/* General Dashboard Improvements */
.glass-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  padding: 8px 0;
  opacity: 0.9;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 12px;
  padding-bottom: 8px;
}

/* Improved Spacing */
.mb-6 {
  margin-bottom: 24px !important;
}

/* Smooth Transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
