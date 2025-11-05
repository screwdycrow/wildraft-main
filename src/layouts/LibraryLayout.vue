<template>
  <v-app>
    <v-app-bar elevation="0" class="glass-header" height="70">
      <v-app-bar-nav-icon @click="rail = !rail" />
      
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
      
      <quick-actions
       
        @add-stat-block="handleAddStatBlock"
        @add-character="handleAddCharacter"
        @add-item="handleAddItem"
        @add-note="handleAddNote"
      />
      
      <user-menu />
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      width="250"
      class="glass-sidebar"
    >
      <!-- Back to Dashboard -->
      <div class="pa-4">
        <v-btn
          :to="{ name: 'Dashboard' }"
          variant="text"
          elevation="0"
          color="primary"
          :block="!rail"
          :icon="rail"
          :prepend-icon="!rail ? 'mdi-arrow-left' : undefined"
        >
        <v-icon icon="mdi-arrow-left" v-if="rail" />
          <template v-if="!rail">Back to Dashboard</template>
        </v-btn>
      </div>

      <v-divider class="my-2" />

      <!-- Library Navigation -->
      <v-list density="comfortable">
        <v-list-subheader v-if="!rail" class="text-overline font-weight-bold">
          Library
        </v-list-subheader>

        <v-list-item
          :to="{ name: 'Library', params: { id: libraryId } }"
          prepend-icon="mdi-view-dashboard-outline"
          :title="!rail ? 'Overview' : undefined"
          exact  
        />

        <v-divider class="my-2" />

        <v-list-subheader v-if="!rail" class="text-overline font-weight-bold">
          Content
        </v-list-subheader>

        <v-list-item
          prepend-icon="mdi-sword-cross"
          :title="!rail ? 'Stat Blocks' : undefined"
          :value="'stat-blocks'"
        >
          <template v-if="!rail" #append>
            <v-chip size="x-small" color="primary">0</v-chip>
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-account-multiple"
          :title="!rail ? 'Characters' : undefined"
          :value="'characters'"
        >
          <template v-if="!rail" #append>
            <v-chip size="x-small" color="secondary">0</v-chip>
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-treasure-chest"
          :title="!rail ? 'Items' : undefined"
          :value="'items'"
        >
          <template v-if="!rail" #append>
            <v-chip size="x-small" color="accent">0</v-chip>
          </template>
        </v-list-item>

        <v-list-item
          prepend-icon="mdi-note-text"
          :title="!rail ? 'Notes' : undefined"
          :value="'notes'"
        >
          <template v-if="!rail" #append>
            <v-chip size="x-small" color="info">0</v-chip>
          </template>
        </v-list-item>

        <v-divider class="my-2" />

        <v-list-subheader v-if="!rail" class="text-overline font-weight-bold">
          Organization
        </v-list-subheader>

        <v-list-item
          prepend-icon="mdi-tag-multiple"
          :title="!rail ? 'Tags' : undefined"
          :value="'tags'"
        />

        <v-list-item
          prepend-icon="mdi-folder"
          :title="!rail ? 'Collections' : undefined"
          :value="'collections'"
        />

        <v-divider class="my-2" />

        <v-list-subheader v-if="!rail" class="text-overline font-weight-bold">
          Development
        </v-list-subheader>

        <v-list-item
          :to="{ name: 'Playground', params: { libraryId } }"
          prepend-icon="mdi-hammer-wrench"
          :title="!rail ? 'UI Playground' : undefined"
          :value="'playground'"
        />

        <template v-if="canManage">
          <v-divider class="my-2" />

          <v-list-subheader v-if="!rail" class="text-overline font-weight-bold">
            Management
          </v-list-subheader>

          <v-list-item
            prepend-icon="mdi-account-group"
            :title="!rail ? 'Sharing' : undefined"
            :value="'sharing'"
          />

          <v-list-item
            v-if="isOwner"
            prepend-icon="mdi-cog"
            :title="!rail ? 'Library Settings' : undefined"
            :value="'settings'"
          />
        </template>
      </v-list>


    </v-navigation-drawer>

    <v-main class="gradient-background">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useToast } from 'vue-toastification'
import UserMenu from '@/components/common/UserMenu.vue'
import QuickActions from '@/components/common/QuickActions.vue'

const drawer = ref(true)
const rail = ref(false)
const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const toast = useToast()

const libraryId = computed(() => {
  const id = route.params.id || route.params.libraryId
  return id ? Number(id) : null
})

const currentLibrary = computed(() => libraryStore.currentLibrary)

const isOwner = computed(() => currentLibrary.value?.role === 'OWNER')
const canManage = computed(() => ['OWNER', 'EDITOR'].includes(currentLibrary.value?.role || ''))

const roleColor = computed(() => {
  switch (currentLibrary.value?.role) {
    case 'OWNER': return 'primary'
    case 'EDITOR': return 'secondary'
    case 'VIEWER': return 'info'
    default: return 'grey'
  }
})

// Fetch library when ID changes
watch(libraryId, async (newId) => {
  if (newId) {
    try {
      await libraryStore.fetchLibrary(newId)
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
}, { immediate: true })

onMounted(async () => {
  if (libraryId.value) {
    try {
      await libraryStore.fetchLibrary(libraryId.value)
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
})

function handleAddStatBlock() {
  toast.info('Stat block creation coming soon!')
}

function handleAddCharacter() {
  toast.info('Character creation coming soon!')
}

function handleAddItem() {
  toast.info('Item creation coming soon!')
}

function handleAddNote() {
  toast.info('Note creation coming soon!')
}
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
