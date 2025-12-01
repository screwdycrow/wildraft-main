<template>
  <div v-if="libraryStore.currentLibrary">
    <!-- Library Header with Clock -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <page-top-bar
          :title="libraryStore.currentLibrary.name"
          icon="mdi-book-open-variant"
          :description="libraryStore.currentLibrary.description || 'Library overview'"
          :breadcrumbs="breadcrumbs"
        >
          <template #actions>
            <v-btn
              v-if="canEdit"
              icon="mdi-pencil"
              variant="text"
              @click="handleEdit"
            />
          </template>
        </page-top-bar>
      </v-col>
      <v-col cols="12" md="4">
        <digital-clock />
      </v-col>
    </v-row>

    <!-- Quick Actions Row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <quick-action-card
          icon="mdi-sword-cross"
          title="Stat Block"
          description="Create a new monster or NPC"
          icon-color="primary"
          @click="createItem('STAT_BLOCK_DND_5E')"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <quick-action-card
          icon="mdi-account-multiple"
          title="Character"
          description="Create a player character"
          icon-color="secondary"
          @click="createItem('CHARACTER_DND_5E')"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <quick-action-card
          icon="mdi-treasure-chest"
          title="Magic Item"
          description="Create a magic item"
          icon-color="accent"
          @click="createItem('ITEM_DND_5E')"
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <quick-action-card
          icon="mdi-note-plus"
          title="Note"
          description="Write campaign notes"
          icon-color="info"
          @click="createItem('NOTE')"
        />
      </v-col>
    </v-row>

    <!-- Quick Shortcuts Row -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <v-card 
          v-if="activeDmScreen"
          class="glass-card shortcut-card"
          elevation="0"
          hover
          @click="openDmScreen"
        >
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar size="48" color="primary" class="mr-4">
              <v-icon icon="mdi-monitor-dashboard" size="24" />
            </v-avatar>
            <div class="flex-1">
              <div class="text-subtitle-2 font-weight-bold">Active DM Screen</div>
              <div class="text-caption text-grey-lighten-1">{{ activeDmScreen.name }}</div>
            </div>
            <v-icon icon="mdi-arrow-right" />
          </v-card-text>
        </v-card>
        <v-card 
          v-else
          class="glass-card shortcut-card"
          elevation="0"
          @click="goToDmScreens"
        >
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar size="48" color="grey-darken-2" class="mr-4">
              <v-icon icon="mdi-monitor-dashboard" size="24" />
            </v-avatar>
            <div class="flex-1">
              <div class="text-subtitle-2 font-weight-bold">No Active DM Screen</div>
              <div class="text-caption text-grey-lighten-1">Create or select a DM screen</div>
            </div>
            <v-icon icon="mdi-arrow-right" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card 
          v-if="activeEncounter"
          class="glass-card shortcut-card"
          elevation="0"
          hover
          @click="openEncounter"
        >
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar size="48" color="error" class="mr-4">
              <v-icon icon="mdi-sword-cross" size="24" />
            </v-avatar>
            <div class="flex-1">
              <div class="text-subtitle-2 font-weight-bold">Active Encounter</div>
              <div class="text-caption text-grey-lighten-1">{{ activeEncounter.name }}</div>
            </div>
            <v-icon icon="mdi-arrow-right" />
          </v-card-text>
        </v-card>
        <v-card 
          v-else
          class="glass-card shortcut-card"
          elevation="0"
          @click="openEncounter"
        >
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar size="48" color="grey-darken-2" class="mr-4">
              <v-icon icon="mdi-sword-cross" size="24" />
            </v-avatar>
            <div class="flex-1">
              <div class="text-subtitle-2 font-weight-bold">Open Encounter</div>
              <div class="text-caption text-grey-lighten-1">View or create an encounter</div>
            </div>
            <v-icon icon="mdi-arrow-right" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tags Section -->
    <v-row>
      <v-col cols="12">
        <v-card class="glass-card" elevation="0">
          <v-card-text class="pa-6">
            <dashboard-tags-section
              :library-id="libraryId!"
              :can-edit="canEdit"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit Library Dialog -->
    <create-library-dialog
      v-model="showEditDialog"
      :library="libraryStore.currentLibrary"
      @submit="handleUpdate"
    />
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
import { useDialogsStore } from '@/stores/dialogs'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import DigitalClock from '@/components/common/DigitalClock.vue'
import QuickActionCard from '@/components/library/QuickActionCard.vue'
import DashboardTagsSection from '@/components/library/DashboardTagsSection.vue'
import CreateLibraryDialog from '@/components/library/CreateLibraryDialog.vue'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { ItemType } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const dmScreensStore = useDmScreensStore()
const combatEncountersStore = useCombatEncountersStore()
const dialogsStore = useDialogsStore()
const toast = useToast()

const showEditDialog = ref(false)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name }
  ]
})

const canEdit = computed(() => 
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

const activeDmScreen = computed(() => dmScreensStore.activeDmScreen)
const activeEncounter = computed(() => combatEncountersStore.activeEncounter)

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
  }
})

function handleEdit() {
  showEditDialog.value = true
}

async function handleUpdate(data: { name: string; description?: string }, callback?: (success: boolean) => void) {
  if (!libraryStore.currentLibrary) return

  try {
    await libraryStore.updateLibrary(libraryStore.currentLibrary.id, data)
    toast.success('Library updated successfully!')
    showEditDialog.value = false
    callback?.(true)
  } catch (error) {
    toast.error('Failed to update library')
    callback?.(false)
  }
}

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
</style>
