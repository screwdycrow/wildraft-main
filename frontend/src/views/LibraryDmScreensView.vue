<template>
  <div>
    <!-- Header -->
    <page-top-bar
      title="DM Screens"
      icon="mdi-monitor-dashboard"
      description="Create and manage DM screens for organizing your resources"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <dm-screen-selector
          v-if="libraryId"
          :library-id="libraryId"
          class="mr-4"
          @change="handleActiveChange"
        />
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Create DM Screen
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Loading State -->
    <v-row v-if="dmScreensStore.isLoading && dmScreensStore.dmScreens.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading DM screens...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!dmScreensStore.isLoading && dmScreensStore.dmScreens.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-monitor-dashboard" size="120" color="primary" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
            No DM Screens Yet
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            Create DM screens to organize your resources. DM screens can contain stat blocks, notes, images, and more.
          </p>
          <v-btn
            v-if="canEdit"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First DM Screen
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- DM Screens Grid -->
    <v-row v-else>
      <v-col
        v-for="dmScreen in dmScreensStore.sortedDmScreens"
        :key="dmScreen.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <dm-screen-card
          :dm-screen="dmScreen"
          :library-id="libraryId!"
          :can-edit="canEdit"
          @edit="handleEdit"
          @delete="handleDelete"
          @set-active="handleSetActive"
        />
      </v-col>
    </v-row>

    <!-- Create/Edit DM Screen Dialog -->
    <v-dialog v-model="showDmScreenDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold pa-6">
          {{ editingDmScreen ? 'Edit DM Screen' : 'Create DM Screen' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-text-field
            v-model="dmScreenForm.name"
            label="Name"
            variant="outlined"
            required
            autofocus
          />
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDmScreenDialog = false"
            :disabled="isSaving"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleCreateOrUpdate"
            :loading="isSaving"
            :disabled="!dmScreenForm.name.trim()"
          >
            {{ editingDmScreen ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete DM Screen?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete the DM screen <strong>{{ deletingDmScreen?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            This action cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Delete DM Screen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import DmScreenCard from '@/components/dmScreen/DmScreenCard.vue'
import DmScreenSelector from '@/components/dmScreen/DmScreenSelector.vue'
import type { DmScreen } from '@/types/dmScreen.types'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const dmScreensStore = useDmScreensStore()
const toast = useToast()

const showDmScreenDialog = ref(false)
const showDeleteDialog = ref(false)
const editingDmScreen = ref<DmScreen | null>(null)
const deletingDmScreen = ref<DmScreen | null>(null)
const isSaving = ref(false)
const isDeleting = ref(false)

const dmScreenForm = ref({
  name: ''
})

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'DM Screens' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

onMounted(async () => {
  if (libraryId.value) {
    try {
      await dmScreensStore.fetchDmScreens(libraryId.value)
    } catch (error) {
      toast.error('Failed to load DM screens')
    }
  }
})

function openCreateDialog() {
  editingDmScreen.value = null
  dmScreenForm.value.name = ''
  showDmScreenDialog.value = true
}

function handleEdit(dmScreen: DmScreen) {
  editingDmScreen.value = dmScreen
  dmScreenForm.value.name = dmScreen.name
  showDmScreenDialog.value = true
}

function handleDelete(dmScreen: DmScreen) {
  deletingDmScreen.value = dmScreen
  showDeleteDialog.value = true
}

function handleSetActive(dmScreen: DmScreen) {
  dmScreensStore.setActiveDmScreen(dmScreen)
  toast.success(`"${dmScreen.name}" set as active DM screen`)
}

function handleActiveChange(dmScreen: DmScreen | null) {
  if (dmScreen) {
    toast.success(`"${dmScreen.name}" set as active DM screen`)
  } else {
    toast.info('Active DM screen cleared')
  }
}

async function handleCreateOrUpdate() {
  if (!libraryId.value || !dmScreenForm.value.name.trim()) return

  isSaving.value = true
  try {
    if (editingDmScreen.value) {
      await dmScreensStore.updateDmScreen(libraryId.value, editingDmScreen.value.id, {
        name: dmScreenForm.value.name
      })
      toast.success('DM screen updated successfully!')
    } else {
      await dmScreensStore.createDmScreen(libraryId.value, {
        name: dmScreenForm.value.name
      })
      toast.success('DM screen created successfully!')
    }
    showDmScreenDialog.value = false
    editingDmScreen.value = null
    dmScreenForm.value.name = ''
  } catch (error: any) {
    toast.error(editingDmScreen.value ? 'Failed to update DM screen' : 'Failed to create DM screen')
  } finally {
    isSaving.value = false
  }
}

async function confirmDelete() {
  if (!deletingDmScreen.value || !libraryId.value) return

  // Check if this is the active DM screen
  if (dmScreensStore.activeDmScreen?.id === deletingDmScreen.value.id) {
    toast.warning('Cannot delete the active DM screen. Please set another screen as active first.')
    showDeleteDialog.value = false
    deletingDmScreen.value = null
    return
  }

  isDeleting.value = true
  try {
    await dmScreensStore.deleteDmScreen(libraryId.value, deletingDmScreen.value.id)
    toast.success('DM screen deleted successfully')
    showDeleteDialog.value = false
    deletingDmScreen.value = null
  } catch (error: any) {
    toast.error(error?.response?.data?.error || 'Failed to delete DM screen')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.empty-icon {
  opacity: 0.5;
}

.float-animation {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
</style>

