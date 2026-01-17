<template>
  <div>
    <!-- Header -->
    <page-top-bar
      :title="portalView?.name || 'Portal View'"
      icon="mdi-view-dashboard-variant"
      :description="portalView ? 'Player-facing portal view' : ''"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <v-btn
          color="success"
          prepend-icon="mdi-eye"
          @click="viewPortalDisplay"
        >
          View Portal
        </v-btn>
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-pencil"
          @click="openEditDialog"
        >
          Edit Portal View
        </v-btn>
        <v-btn
          icon="mdi-arrow-left"
          variant="text"
          @click="goBack"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Back to Portal Views
          </v-tooltip>
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Loading State -->
    <v-row v-if="portalViewsStore.isLoading && !portalView">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading portal view...</p>
      </v-col>
    </v-row>

    <!-- Error State -->
    <v-row v-else-if="portalViewsStore.error && !portalView">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" class="glass-card">
          <v-alert-title>Failed to load portal view</v-alert-title>
          {{ portalViewsStore.error }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Portal View Content -->
    <div v-else-if="portalView">
      <!-- Display Options Info -->
      <v-card class="glass-card mb-4" elevation="0">
        <v-card-text>
          <div class="d-flex flex-wrap gap-2 align-center">
            <v-chip
              v-if="portalView.showEncounter"
              size="small"
              color="primary"
              variant="tonal"
            >
              <v-icon icon="mdi-sword-cross" size="small" class="mr-1" />
              Encounter
            </v-chip>
            <v-chip
              v-if="portalView.showHealth"
              size="small"
              color="error"
              variant="tonal"
            >
              <v-icon icon="mdi-heart" size="small" class="mr-1" />
              Health
            </v-chip>
            <v-chip
              v-if="portalView.showAC"
              size="small"
              color="info"
              variant="tonal"
            >
              <v-icon icon="mdi-shield" size="small" class="mr-1" />
              AC
            </v-chip>
            <v-chip
              v-if="portalView.showActions"
              size="small"
              color="warning"
              variant="tonal"
            >
              <v-icon icon="mdi-sword" size="small" class="mr-1" />
              Actions
            </v-chip>
            <v-chip
              v-if="portalView.autoResetImageState"
              size="small"
              variant="tonal"
            >
              <v-icon icon="mdi-refresh" size="small" class="mr-1" />
              Auto Reset
            </v-chip>
            <v-chip
              v-if="portalView.combatEncounter"
              size="small"
              color="primary"
              variant="tonal"
            >
              <v-icon icon="mdi-sword-cross" size="small" class="mr-1" />
              {{ portalView.combatEncounter.name }}
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Items Display -->
      <v-card class="glass-card" elevation="0">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Items ({{ portalView.items?.length || 0 }})</span>
          <v-btn
            v-if="canEdit"
            color="primary"
            size="small"
            prepend-icon="mdi-plus"
            @click="openAddItemDialog"
          >
            Add Item
          </v-btn>
        </v-card-title>
        <v-card-text>
          <div v-if="!portalView.items || portalView.items.length === 0" class="text-center py-8">
            <v-icon icon="mdi-view-grid-outline" size="64" color="grey-lighten-1" class="mb-4" />
            <p class="text-body-1 text-grey-lighten-1">No items in this portal view yet.</p>
            <v-btn
              v-if="canEdit"
              color="primary"
              class="mt-4"
              prepend-icon="mdi-plus"
              @click="openAddItemDialog"
            >
              Add Your First Item
            </v-btn>
          </div>
          <div v-else class="d-flex flex-column gap-4">
            <v-card
              v-for="(item, index) in portalView.items"
              :key="item.id || index"
              class="glass-card"
              elevation="0"
              variant="outlined"
            >
              <v-card-text>
                <div class="d-flex align-center justify-space-between">
                  <div class="flex-grow-1">
                    <div class="d-flex align-center gap-2 mb-2">
                      <v-chip size="small" variant="tonal" color="primary">
                        {{ item.type }}
                      </v-chip>
                      <span class="text-body-2 text-grey-lighten-1">ID: {{ item.id }}</span>
                    </div>
                    <pre class="text-body-2" style="max-height: 200px; overflow: auto;">{{ JSON.stringify(item, null, 2) }}</pre>
                  </div>
                  <v-menu v-if="canEdit">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        variant="text"
                        size="small"
                      />
                    </template>
                    <v-list class="glass-menu">
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit"
                        @click="editItem(item, index)"
                      />
                      <v-divider class="my-2" />
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Remove"
                        class="text-error"
                        @click="removeItem(index)"
                      />
                    </v-list>
                  </v-menu>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Edit Portal View Dialog -->
    <portal-view-form-dialog
      v-model="showEditDialog"
      :portal-view="portalView"
      :library-id="libraryId!"
      @submit="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import PortalViewFormDialog from '@/components/portal/PortalViewFormDialog.vue'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { PortalViewItem } from '@/types/portal.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const portalViewsStore = usePortalViewsStore()
const toast = useToast()

const showEditDialog = ref(false)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const portalViewId = computed(() => {
  return route.params.portalViewId as string
})

const portalView = computed(() => portalViewsStore.currentPortalView)

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'Portal Views', to: { name: 'LibraryPortalViews', params: { id: libraryId.value } } },
    { text: portalView.value?.name || 'Portal View' }
  ]
})

const canEdit = computed(() =>
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

onMounted(async () => {
  if (libraryId.value && portalViewId.value) {
    try {
      await portalViewsStore.fetchPortalView(libraryId.value, portalViewId.value)
    } catch (error) {
      toast.error('Failed to load portal view')
    }
  }
})

watch([() => route.params.id, () => route.params.portalViewId], async ([newLibraryId, newPortalViewId]) => {
  if (newLibraryId && newPortalViewId) {
    try {
      await portalViewsStore.fetchPortalView(Number(newLibraryId), newPortalViewId as string)
    } catch (error) {
      toast.error('Failed to load portal view')
    }
  }
})

function goBack() {
  if (libraryId.value) {
    router.push({ name: 'LibraryPortalViews', params: { id: libraryId.value } })
  }
}

function viewPortalDisplay() {
  if (libraryId.value && portalViewId.value) {
    router.push({
      name: 'PortalViewDisplay',
      params: {
        id: libraryId.value,
        portalViewId: portalViewId.value,
      },
    })
  }
}

function openEditDialog() {
  showEditDialog.value = true
}

function openAddItemDialog() {
  // TODO: Implement add item dialog
  toast.info('Add item functionality coming soon')
}

function editItem(item: PortalViewItem, index: number) {
  // TODO: Implement edit item dialog
  toast.info('Edit item functionality coming soon')
}

async function removeItem(index: number) {
  if (!portalView.value || !libraryId.value) return

  const items = [...(portalView.value.items || [])]
  items.splice(index, 1)

  try {
    await portalViewsStore.updatePortalView(libraryId.value, portalView.value.id, {
      items,
    })
    toast.success('Item removed successfully')
  } catch (error) {
    toast.error('Failed to remove item')
  }
}

async function handleUpdate(
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
  }
) {
  if (!libraryId.value || !portalView.value) return

  try {
    await portalViewsStore.updatePortalView(libraryId.value, portalView.value.id, data)
    toast.success('Portal view updated successfully!')
    showEditDialog.value = false
  } catch (error) {
    toast.error('Failed to update portal view')
  }
}
</script>

<style scoped>
pre {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 4px;
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>

