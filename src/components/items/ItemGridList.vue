<template>
  <div class="item-grid-list">
    <!-- Loading State -->
    <v-row v-if="isLoading && items.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">{{ loadingText }}</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!isLoading && items.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon :icon="emptyIcon" size="120" :color="emptyIconColor" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold text-white mb-4">
            {{ hasFilters ? `No ${itemTypeNamePlural} found` : emptyTitle }}
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            {{ hasFilters ? 'Try adjusting your filters or search terms.' : emptyMessage }}
          </p>
          <v-btn
            v-if="canCreate && !hasFilters"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="$emit('create')"
          >
            {{ createButtonText }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Items Grid -->
    <v-row v-else>
      <v-col
        v-for="item in items"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <item-card-wrapper
          :item="item"
          @view="$emit('view', item)"
          @edit="$emit('edit', item)"
          @delete="handleDelete(item)"
        />
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          {{ deleteDialogTitle }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            {{ deleteWarningMessage }}
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
            {{ deleteButtonText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LibraryItem } from '@/types/item.types'
import ItemCardWrapper from './ItemCardWrapper.vue'

interface Props {
  items: LibraryItem[]
  isLoading?: boolean
  canCreate?: boolean
  hasFilters?: boolean
  itemTypeName?: string
  itemTypeNamePlural?: string
  emptyIcon?: string
  emptyIconColor?: string
  emptyTitle?: string
  emptyMessage?: string
  createButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  canCreate: true,
  hasFilters: false,
  itemTypeName: 'item',
  itemTypeNamePlural: 'items',
  emptyIcon: 'mdi-bookshelf',
  emptyIconColor: 'primary',
  emptyTitle: 'No Items Yet',
  emptyMessage: 'Create your first item to get started.',
  createButtonText: 'Create Your First Item',
})

const emit = defineEmits<{
  create: []
  view: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const showDeleteDialog = ref(false)
const deletingItem = ref<LibraryItem | null>(null)
const isDeleting = ref(false)

const loadingText = computed(() => `Loading ${props.itemTypeNamePlural}...`)

const deleteDialogTitle = computed(() => {
  return `Delete ${props.itemTypeName.charAt(0).toUpperCase() + props.itemTypeName.slice(1)}?`
})

const deleteWarningMessage = computed(() => {
  return `This will permanently remove this ${props.itemTypeName} and all its data. This action cannot be undone.`
})

const deleteButtonText = computed(() => {
  return `Delete ${props.itemTypeName.charAt(0).toUpperCase() + props.itemTypeName.slice(1)}`
})

function handleDelete(item: LibraryItem) {
  deletingItem.value = item
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return

  isDeleting.value = true
  try {
    emit('delete', deletingItem.value)
    // Wait a bit for the parent to handle the deletion
    await new Promise(resolve => setTimeout(resolve, 100))
    showDeleteDialog.value = false
    deletingItem.value = null
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.item-grid-list {
  width: 100%;
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

