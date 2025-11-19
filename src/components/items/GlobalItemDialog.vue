<template>
  <v-dialog
    v-model="dialogState.isOpen"
    persistent
    scrollable
    fullscreen
    @click:outside="handleCancel"
    hide-overlay
  >
    <div class="global-item-dialog-container">
      <!-- Fixed Close Button -->
      <v-btn
        icon="mdi-close"
        variant="text"
        size="large"
        class="close-button"
        @click="handleCancel"
      >
        <v-icon />
      </v-btn>
      
      <!-- Form Component -->
      <component
        v-if="dialogState.isOpen && formComponent"
        :is="formComponent"
        :item="dialogState.item"
        :library-id="dialogState.libraryId"
        :initial-tag-ids="dialogState.initialTagIds"
        :hide-header="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useItemDialogs } from '@/composables/useItemDialogs'
import { useItemComponents } from '@/composables/useItemComponents'
import { useItemsStore } from '@/stores/items'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import type { CreateLibraryItemPayload, UpdateLibraryItemPayload } from '@/types/item.types'

const { dialogState, closeDialog } = useItemDialogs()
const { getItemComponent } = useItemComponents()
const itemsStore = useItemsStore()
const router = useRouter()
const toast = useToast()

const formComponent = computed(() => {
  if (!dialogState.value.itemType) return null
  return getItemComponent(dialogState.value.itemType, 'form')
})

async function handleSubmit(
  payload: CreateLibraryItemPayload | UpdateLibraryItemPayload,
  callback?: (success: boolean) => void
) {
  try {
    if (!dialogState.value.libraryId) {
      throw new Error('Library ID is required')
    }

    if (dialogState.value.mode === 'create') {
      const newItem = await itemsStore.createItem(
        dialogState.value.libraryId,
        payload as CreateLibraryItemPayload
      )
      toast.success('Item created successfully!')
      
      // Navigate to the new item's detail page
      router.push({
        name: 'ItemDetail',
        params: {
          libraryId: dialogState.value.libraryId,
          itemId: newItem.id,
        },
      })
      
      callback?.(true)
      closeDialog()
    } else if (dialogState.value.mode === 'edit' && dialogState.value.item) {
      await itemsStore.updateItem(
        dialogState.value.libraryId,
        dialogState.value.item.id,
        payload as UpdateLibraryItemPayload
      )
      toast.success('Item updated successfully!')
      callback?.(true)
      closeDialog()
    }
  } catch (error: any) {
    console.error('Error saving item:', error)
    toast.error(error.message || 'Failed to save item')
    callback?.(false)
  }
}

function handleCancel() {
  closeDialog()
}
</script>

<style scoped>
.global-item-dialog-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.close-button {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 1000;
  background: rgba(var(--v-theme-surface), 0.9) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.close-button:hover {
  background: rgba(var(--v-theme-surface), 1) !important;
}

/* Hide form header when inside GlobalItemDialog */
.global-item-dialog-container :deep(.form-actions-sticky:first-child) {
  display: none !important;
}
</style>

