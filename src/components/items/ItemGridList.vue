<template>
  <div class="item-grid-list">
    <!-- Loading State -->
    <div 
      v-if="isLoading && items.length === 0" 
      class="items-grid loading-grid"
    >
      <div
        v-for="index in skeletonCount"
        :key="`skeleton-${index}`"
        class="grid-item"
      >
        <v-skeleton-loader
          class="skeleton-card glass-card"
          type="card"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading && items.length === 0">
      <v-card class="glass-card pa-12 text-center" elevation="0">
        <v-icon :icon="emptyIcon" size="120" :color="emptyIconColor" class="mb-6 empty-icon float-animation" />
        <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
          {{ emptyTitle }}
        </h2>
        <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
          {{ emptyMessage }}
        </p>
        <v-btn
          v-if="canCreate"
          color="primary"
          size="x-large"
          prepend-icon="mdi-plus"
          @click="$emit('create')"
        >
          {{ createButtonText }}
        </v-btn>
      </v-card>
    </div>

    <!-- Items Grid -->
    <MasonryGrid
      v-else
      class="items-grid"
      :columns="masonryColumns"
      :gutter="masonryGutter"
    >
      <MasonryGridItem
        v-for="item in items"
        :key="item.id"
        class="grid-item"
      >
        <item-card-wrapper
          :item="item"
          @view="$emit('view', item)"
          @edit="$emit('edit', item)"
          @delete="handleDelete(item)"
        />
      </MasonryGridItem>
    </MasonryGrid>

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
import { MasonryGrid, MasonryGridItem } from 'vue3-masonry-css'

interface Props {
  items: LibraryItem[]
  isLoading?: boolean
  canCreate?: boolean
  itemTypeName?: string
  itemTypeNamePlural?: string
  emptyIcon?: string
  emptyIconColor?: string
  emptyTitle?: string
  emptyMessage?: string
  createButtonText?: string
  skeletonCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  canCreate: true,
  itemTypeName: 'item',
  itemTypeNamePlural: 'items',
  emptyIcon: 'mdi-bookshelf',
  emptyIconColor: 'primary',
  emptyTitle: 'No Items Yet',
  emptyMessage: 'Create your first item to get started.',
  createButtonText: 'Create Your First Item',
  skeletonCount: 6,
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

const skeletonCount = computed(() => props.skeletonCount)

const masonryColumns = {
  default: 6,
  2560: 7,
  1920: 4,
  1600: 4,
  1280: 3,
  960: 2,
  600: 1,
}

const masonryGutter = {
  default: '24px',
  960: '20px',
  600: '16px',
}

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

.items-grid {
  width: 100%;
  padding-bottom: 1.5rem;
}

.grid-item {
  margin: 0 0 1.5rem;
}

.loading-grid .grid-item {
  width: 100%;
}

.skeleton-card {
  width: 100%;
  border-radius: 16px;
  padding: 0;
  --v-theme-surface: rgba(255, 255, 255, 0.08);
}

.skeleton-card :deep(.v-skeleton-loader__image) {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
</style>


