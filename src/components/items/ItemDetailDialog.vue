<template>
  <v-dialog
    v-model="isOpen"
    max-width="1200"
    scrollable
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center pa-6">
        <v-icon :icon="getItemIcon" :color="getItemColor" size="32" class="mr-3" />
        {{ item?.name }}
        <v-spacer />
        <v-btn
          v-if="canEdit"
          icon="mdi-pencil"
          variant="text"
          @click="openEditDialog"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <component
          :is="detailComponent"
          v-if="detailComponent && item"
          :item="item"
        />
        <div v-else>
          <v-alert type="info" variant="tonal">
            No detail view available for this item type.
          </v-alert>
          <pre class="mt-4">{{ JSON.stringify(item?.data, null, 2) }}</pre>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          v-if="canDelete"
          color="error"
          variant="outlined"
          prepend-icon="mdi-delete"
          @click="confirmDelete"
        >
          Delete
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Edit Dialog -->
    <item-dialog
      v-model="editDialogOpen"
      :library-id="libraryId"
      :item="item"
      @updated="handleUpdated"
    />

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Item?</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ item?.name }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="handleDelete" :loading="deleting">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import type { LibraryItem } from '@/types/item.types'
import { useToast } from 'vue-toastification'
import ItemDialog from './ItemDialog.vue'

interface Props {
  libraryId: number
  item: LibraryItem | null
  canEdit?: boolean
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
  canDelete: true,
})

const emit = defineEmits<{
  updated: [item: LibraryItem]
  deleted: [itemId: number]
  close: []
}>()

const itemsStore = useItemsStore()
const toast = useToast()

const isOpen = defineModel<boolean>('modelValue', { default: false })
const editDialogOpen = ref(false)
const deleteDialog = ref(false)
const deleting = ref(false)

// You can add specific detail components here if needed
const detailComponent = computed(() => {
  // For now, we'll show a generic view
  // You can create specific detail components later
  return null
})

const getItemIcon = computed(() => {
  if (!props.item) return 'mdi-file'
  
  const iconMap: Record<string, string> = {
    'CHARACTER_DND_5E': 'mdi-account-circle',
    'ITEM_DND_5E': 'mdi-treasure-chest',
    'STAT_BLOCK_DND_5E': 'mdi-sword-cross',
    'NOTE': 'mdi-note-text',
  }
  
  return iconMap[props.item.type] || 'mdi-file'
})

const getItemColor = computed(() => {
  if (!props.item) return 'grey'
  
  const colorMap: Record<string, string> = {
    'CHARACTER_DND_5E': '#3498DB',
    'ITEM_DND_5E': '#F39C12',
    'STAT_BLOCK_DND_5E': '#E74C3C',
    'NOTE': '#95A5A6',
  }
  
  return colorMap[props.item.type] || 'grey'
})

function openEditDialog() {
  editDialogOpen.value = true
}

function handleUpdated(updatedItem: LibraryItem) {
  emit('updated', updatedItem)
  // The item will be updated in the parent through the event
}

function confirmDelete() {
  deleteDialog.value = true
}

async function handleDelete() {
  if (!props.item) return
  
  deleting.value = true
  try {
    await itemsStore.deleteItem(props.libraryId, props.item.id)
    toast.success('Item deleted successfully')
    emit('deleted', props.item.id)
    deleteDialog.value = false
    close()
  } catch (error: any) {
    console.error('Failed to delete item:', error)
    toast.error(error.response?.data?.error || 'Failed to delete item')
  } finally {
    deleting.value = false
  }
}

function close() {
  isOpen.value = false
  emit('close')
}
</script>

