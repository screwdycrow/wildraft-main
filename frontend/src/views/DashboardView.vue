<template>
  <div>
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-items-center justify-space-between">
          <div>
            <h1 class="text-h3 font-weight-bold mb-2" style="color: rgb(var(--v-theme-on-surface));">
              Welcome, {{ authStore.user?.name || 'Adventurer' }}!
            </h1>
            <p class="text-subtitle-1 text-grey-lighten-1">
              Manage your D&D content libraries
            </p>
          </div>
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            class="pulse-glow-animation"
          >
            Create Library
          </v-btn>
        </div>
      </v-col>
    </v-row>

   

    <!-- Loading State -->
    <v-row v-if="libraryStore.isLoading && libraryStore.libraries.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading your libraries...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!libraryStore.isLoading && libraryStore.libraries.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-book-open-variant" size="120" color="primary" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
            No Libraries Yet
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            Create your first library to start organizing your D&D content. 
            Add stat blocks, characters, items, and notes all in one place!
          </p>
          <v-btn
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First Library
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Libraries Grid -->
    <template v-else>
      <!-- Owned Libraries -->
      <div v-if="libraryStore.ownedLibraries.length > 0" class="mb-8">
        <h2 class="text-h5 font-weight-bold mb-4 d-flex align-center" style="color: rgb(var(--v-theme-on-surface));">
          <v-icon icon="mdi-crown" color="primary" class="mr-2" />
          Your Libraries
        </h2>
        <v-row>
          <v-col
            v-for="library in libraryStore.ownedLibraries"
            :key="library.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <library-card
              :library="library"
              @edit="handleEdit"
              @delete="handleDelete"
              @share="handleShare"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Shared Libraries -->
      <div v-if="libraryStore.sharedLibraries.length > 0">
        <h2 class="text-h5 font-weight-bold mb-4 d-flex align-center" style="color: rgb(var(--v-theme-on-surface));">
          <v-icon icon="mdi-share-variant" color="info" class="mr-2" />
          Shared With You
        </h2>
        <v-row>
          <v-col
            v-for="library in libraryStore.sharedLibraries"
            :key="library.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <library-card
              :library="library"
              @edit="handleEdit"
              @delete="handleDelete"
              @share="handleShare"
            />
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- Create/Edit Library Dialog -->
    <create-library-dialog
      v-model="showCreateDialog"
      :library="editingLibrary"
      @submit="handleCreateOrUpdate"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Library?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ deletingLibrary?.name }}</strong>?
          </p>
          <v-alert type="error" variant="tonal" density="compact" icon="mdi-alert">
            This action cannot be undone. All stat blocks, characters, items, and notes in this library will be permanently deleted.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Delete Library
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share Dialog (Placeholder) -->
    <v-dialog v-model="showShareDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-share-variant" color="primary" size="32" class="mr-3" />
          Share Library
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-center text-grey-lighten-1 py-8">
            Sharing features coming soon!
          </p>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn variant="text" @click="showShareDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'
import { useToast } from 'vue-toastification'
import LibraryCard from '@/components/library/LibraryCard.vue'
import CreateLibraryDialog from '@/components/library/CreateLibraryDialog.vue'
import type { Library } from '@/types/library.types'

const authStore = useAuthStore()
const libraryStore = useLibraryStore()
const toast = useToast()

const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showShareDialog = ref(false)
const editingLibrary = ref<Library | null>(null)
const deletingLibrary = ref<Library | null>(null)
const isDeleting = ref(false)

const recentlyUpdatedCount = computed(() => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return libraryStore.libraries.filter(lib => 
    new Date(lib.updatedAt) > sevenDaysAgo
  ).length
})

onMounted(async () => {
  try {
    await libraryStore.fetchLibraries()
  } catch (error) {
    toast.error('Failed to load libraries')
  }
})

function openCreateDialog() {
  editingLibrary.value = null
  showCreateDialog.value = true
}

function handleEdit(library: Library) {
  editingLibrary.value = library
  showCreateDialog.value = true
}

function handleDelete(library: Library) {
  deletingLibrary.value = library
  showDeleteDialog.value = true
}

function handleShare(library: Library) {
  showShareDialog.value = true
}

async function handleCreateOrUpdate(data: { name: string; description?: string }, callback?: (success: boolean) => void) {
  try {
    if (editingLibrary.value) {
      await libraryStore.updateLibrary(editingLibrary.value.id, data)
      toast.success('Library updated successfully!')
    } else {
      const newLibrary = await libraryStore.createLibrary(data)
      // Verify the library has the correct role
      if (newLibrary && newLibrary.role !== 'OWNER') {
        console.warn('New library does not have OWNER role:', newLibrary)
        // Refresh libraries to get correct role from server
        await libraryStore.fetchLibraries()
      }
      toast.success('Library created successfully!')
    }
    showCreateDialog.value = false
    editingLibrary.value = null
    callback?.(true)
  } catch (error) {
    toast.error(editingLibrary.value ? 'Failed to update library' : 'Failed to create library')
    callback?.(false)
  }
}

async function confirmDelete() {
  if (!deletingLibrary.value) return

  isDeleting.value = true
  try {
    await libraryStore.deleteLibrary(deletingLibrary.value.id)
    toast.success('Library deleted successfully')
    showDeleteDialog.value = false
    deletingLibrary.value = null
  } catch (error) {
    toast.error('Failed to delete library')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
/* Use global glass-card class */

.empty-icon {
  opacity: 0.5;
}
</style>
