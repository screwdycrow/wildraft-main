<template>
  <div>
    <!-- Header -->
    <page-top-bar
      title="Portal Views"
      icon="mdi-view-dashboard-variant"
      description="Create and manage player-facing portal views"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Create Portal View
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Loading State -->
    <v-row v-if="portalViewsStore.isLoading && portalViewsStore.portalViews.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading portal views...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!portalViewsStore.isLoading && portalViewsStore.portalViews.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-view-dashboard-variant-outline" size="120" color="primary" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
            No Portal Views Yet
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            Create portal views to display content to players. Portal views can show maps, stat blocks, notes, and more.
          </p>
          <v-btn
            v-if="canEdit"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First Portal View
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Portal Views Grid -->
    <v-row v-else>
      <v-col
        v-for="portalView in portalViewsStore.sortedPortalViews"
        :key="portalView.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          class="glass-card portal-view-card"
          elevation="0"
          hover
          @click="viewPortalView(portalView)"
          style="cursor: pointer;"
        >
          <v-card-text class="pa-4">
            <div class="d-flex align-items-start justify-space-between mb-3">
              <div class="flex-grow-1">
                <h3 class="text-h6 font-weight-bold mb-1">{{ portalView.name }}</h3>
                <div class="d-flex flex-wrap gap-1 mt-2">
                  <v-chip
                    v-if="portalView.showEncounter"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                  >
                    <v-icon icon="mdi-sword-cross" size="x-small" class="mr-1" />
                    Encounter
                  </v-chip>
                  <v-chip
                    v-if="portalView.showHealth"
                    size="x-small"
                    color="error"
                    variant="tonal"
                  >
                    <v-icon icon="mdi-heart" size="x-small" class="mr-1" />
                    Health
                  </v-chip>
                  <v-chip
                    v-if="portalView.showAC"
                    size="x-small"
                    color="info"
                    variant="tonal"
                  >
                    <v-icon icon="mdi-shield" size="x-small" class="mr-1" />
                    AC
                  </v-chip>
                  <v-chip
                    v-if="portalView.showActions"
                    size="x-small"
                    color="warning"
                    variant="tonal"
                  >
                    <v-icon icon="mdi-sword" size="x-small" class="mr-1" />
                    Actions
                  </v-chip>
                </div>
              </div>
              <v-menu v-if="canEdit" location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    @click.stop
                  />
                </template>
                <v-list class="glass-menu">
                  <v-list-item
                    prepend-icon="mdi-eye"
                    title="View"
                    @click.stop="viewPortalViewDisplay(portalView)"
                  />
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Edit"
                    @click.stop="handleEdit(portalView)"
                  />
                  <v-divider class="my-2" />
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Delete"
                    class="text-error"
                    @click.stop="handleDelete(portalView)"
                  />
                </v-list>
              </v-menu>
            </div>

            <div class="d-flex align-items-center text-grey-lighten-1 mb-2">
              <v-icon icon="mdi-view-grid" size="small" class="mr-1" />
              <span class="text-body-2">
                {{ portalView.items?.length || 0 }} {{ portalView.items?.length === 1 ? 'item' : 'items' }}
              </span>
            </div>

            <div v-if="portalView.combatEncounter" class="mt-2">
              <v-chip size="x-small" variant="tonal" color="primary">
                <v-icon icon="mdi-sword-cross" size="x-small" class="mr-1" />
                {{ portalView.combatEncounter.name }}
              </v-chip>
            </div>

            <!-- View Button -->
            <div class="mt-3">
              <v-btn
                block
                color="primary"
                variant="flat"
                prepend-icon="mdi-eye"
                @click.stop="viewPortalViewDisplay(portalView)"
              >
                View Portal
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Portal View Dialog -->
    <portal-view-form-dialog
      v-model="showPortalViewDialog"
      :portal-view="editingPortalView"
      :library-id="libraryId!"
      @submit="handleCreateOrUpdate"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Portal View?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete the portal view <strong>{{ deletingPortalView?.name }}</strong>?
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
            Delete Portal View
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
import { usePortalViewsStore } from '@/stores/portalViews'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import PortalViewFormDialog from '@/components/portal/PortalViewFormDialog.vue'
import type { LibraryPortalView } from '@/types/portal.types'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const portalViewsStore = usePortalViewsStore()
const toast = useToast()

const showPortalViewDialog = ref(false)
const showDeleteDialog = ref(false)
const editingPortalView = ref<LibraryPortalView | null>(null)
const deletingPortalView = ref<LibraryPortalView | null>(null)
const isDeleting = ref(false)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'Portal Views' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

onMounted(async () => {
  if (libraryId.value) {
    try {
      await portalViewsStore.fetchPortalViews(libraryId.value)
    } catch (error) {
      toast.error('Failed to load portal views')
    }
  }
})

function openCreateDialog() {
  editingPortalView.value = null
  showPortalViewDialog.value = true
}

function handleEdit(portalView: LibraryPortalView) {
  editingPortalView.value = portalView
  showPortalViewDialog.value = true
}

function handleDelete(portalView: LibraryPortalView) {
  deletingPortalView.value = portalView
  showDeleteDialog.value = true
}

function viewPortalView(portalView: LibraryPortalView) {
  if (libraryId.value) {
    router.push({
      name: 'PortalView',
      params: {
        id: libraryId.value,
        portalViewId: portalView.id,
      },
    })
  }
}

function viewPortalViewDisplay(portalView: LibraryPortalView) {
  if (libraryId.value) {
    router.push({
      name: 'PortalViewDisplay',
      params: {
        id: libraryId.value,
        portalViewId: portalView.id,
      },
    })
  }
}

async function handleCreateOrUpdate(
  data: {
    name: string
    showEncounter?: boolean
    showHealth?: boolean
    showAC?: boolean
    showActions?: boolean
    autoResetImageState?: boolean
    combatEncounterId?: number | null
    currentItem?: number | null
    items?: any[]
  },
  callback?: (success: boolean) => void
) {
  if (!libraryId.value) return

  try {
    if (editingPortalView.value) {
      await portalViewsStore.updatePortalView(libraryId.value, editingPortalView.value.id, data)
      toast.success('Portal view updated successfully!')
    } else {
      await portalViewsStore.createPortalView(libraryId.value, data)
      toast.success('Portal view created successfully!')
    }
    showPortalViewDialog.value = false
    editingPortalView.value = null
    callback?.(true)
  } catch (error: any) {
    toast.error(editingPortalView.value ? 'Failed to update portal view' : 'Failed to create portal view')
    callback?.(false)
  }
}

async function confirmDelete() {
  if (!deletingPortalView.value || !libraryId.value) return

  isDeleting.value = true
  try {
    await portalViewsStore.deletePortalView(libraryId.value, deletingPortalView.value.id)
    toast.success('Portal view deleted successfully')
    showDeleteDialog.value = false
    deletingPortalView.value = null
  } catch (error) {
    toast.error('Failed to delete portal view')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.portal-view-card {
  transition: transform 0.2s ease-in-out;
}

.portal-view-card:hover {
  transform: translateY(-4px);
}

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

