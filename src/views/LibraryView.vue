<template>
  <div v-if="libraryStore.currentLibrary">
    <!-- Library Header -->
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



    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card action-card" elevation="1" hover @click="addStatBlock">
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-sword-cross" size="64" color="primary" class="mb-3" />
            <h3 class="text-h6 font-weight-bold">Add Stat Block</h3>
            <p class="text-caption text-grey-lighten-1">Create a new monster or NPC</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card action-card" elevation="1" hover @click="addCharacter">
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-account-multiple" size="64" color="secondary" class="mb-3" />
            <h3 class="text-h6 font-weight-bold">Add Character</h3>
            <p class="text-caption text-grey-lighten-1">Create a player character</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card action-card" elevation="1" hover @click="addItem">
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-treasure-chest" size="64" color="accent" class="mb-3" />
            <h3 class="text-h6 font-weight-bold">Add Item</h3>
            <p class="text-caption text-grey-lighten-1">Create a magic item</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card action-card" elevation="1" hover @click="addNote">
          <v-card-text class="text-center pa-6">
            <v-icon icon="mdi-note-plus" size="64" color="info" class="mb-3" />
            <h3 class="text-h6 font-weight-bold">Add Note</h3>
            <p class="text-caption text-grey-lighten-1">Write campaign notes</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Content -->
    <v-row>
      <v-col cols="12">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-h5 font-weight-bold pa-6 d-flex align-items-center">
            <v-icon icon="mdi-history" color="primary" class="mr-2" />
            Recent Content
          </v-card-title>
          <v-card-text>
            <v-list class="bg-transparent">
              <v-list-item class="text-center py-12">
                <v-icon icon="mdi-package-variant" size="64" color="grey" class="mb-2" />
                <v-list-item-title class="text-h6 text-grey-lighten-1 mb-2">
                  No content yet
                </v-list-item-title>
                <v-list-item-subtitle class="text-grey">
                  Start adding content to your library using the cards above
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
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
        <h2 class="text-h4 font-weight-bold text-white mb-4">
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import CreateLibraryDialog from '@/components/library/CreateLibraryDialog.vue'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'

const route = useRoute()
const libraryStore = useLibraryStore()
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

function addStatBlock() {
  toast.info('Stat block creation coming soon!')
}

function addCharacter() {
  toast.info('Character creation coming soon!')
}

function addItem() {
  toast.info('Item creation coming soon!')
}

function addNote() {
  toast.info('Note creation coming soon!')
}
</script>

<style scoped>
/* Use global glass-card class */

.action-card {
  cursor: pointer;
}

.action-card:hover .v-icon {
  transform: scale(1.1);
  transition: transform 0.3s ease-in-out;
}
</style>
