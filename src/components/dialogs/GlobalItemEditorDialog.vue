<template>
  <v-dialog
    v-model="dialogsStore.itemEditorOpen"
    persistent
    scrollable
    fullscreen
    @click:outside="handleCancel"
    hide-overlay
    @update:model-value="handleClose"
  >
    <div class="global-item-dialog-container">
      <component
        v-if="dialogsStore.itemEditorData && formComponent"
        :is="formComponent"
        :item="dialogsStore.itemEditorData.item"
        :library-id="dialogsStore.itemEditorData.libraryId"
        :item-type="dialogsStore.itemEditorData.itemType"
        :initial-tag-ids="dialogsStore.itemEditorData.initialTagIds"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
      <div v-else-if="dialogsStore.itemEditorData" class="pa-6">
        <v-alert type="warning">
          No editor available for this item type.
        </v-alert>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useItemComponents } from '@/composables/useItemComponents'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import type { CreateLibraryItemPayload, UpdateLibraryItemPayload } from '@/types/item.types'

const dialogsStore = useDialogsStore()
const { getItemComponent } = useItemComponents()
const itemsStore = useItemsStore()
const toast = useToast()

const formComponent = computed(() => {
  if (!dialogsStore.itemEditorData) return null
  const itemType = dialogsStore.itemEditorData.itemType || dialogsStore.itemEditorData.item?.type
  if (!itemType) return null
  return getItemComponent(itemType, 'form')
})

function handleClose(value: boolean) {
  if (!value) {
    dialogsStore.closeItemEditor()
  }
}

function handleCancel() {
  dialogsStore.closeItemEditor()
}

async function handleSubmit(
  payload: CreateLibraryItemPayload | UpdateLibraryItemPayload,
  callback?: (success: boolean) => void
) {
  try {
    if (!dialogsStore.itemEditorData) return
    
    const isEditMode = !!dialogsStore.itemEditorData.item
    
    if (isEditMode && dialogsStore.itemEditorData.item) {
      // Update existing item
      await itemsStore.updateItem(
        dialogsStore.itemEditorData.libraryId,
        dialogsStore.itemEditorData.item.id,
        payload as UpdateLibraryItemPayload
      )
      toast.success('Item updated successfully')
    } else {
      // Create new item
      await itemsStore.createItem(
        dialogsStore.itemEditorData.libraryId,
        payload as CreateLibraryItemPayload
      )
      toast.success('Item created successfully')
    }
    
    callback?.(true)
    dialogsStore.closeItemEditor()
  } catch (error: any) {
    console.error('[GlobalItemEditorDialog] Failed to save item:', error)
    toast.error(error.response?.data?.error || 'Failed to save item')
    callback?.(false)
  }
}
</script>

<style scoped>
.global-item-dialog-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
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

/* Hide form header when inside GlobalItemEditorDialog */
.global-item-dialog-container :deep(.form-actions-sticky:first-child) {
  display: none !important;
}

/* Ensure the form component inside takes full height */
.global-item-dialog-container :deep(> *) {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Override ItemFormLayout height constraints */
.global-item-dialog-container :deep(.form-container) {
  min-height: 100vh !important;
  max-height: 100vh !important;
  height: 100vh !important;
}

.global-item-dialog-container :deep(.form-row-content) {
  min-height: calc(100vh - 120px) !important;
  max-height: calc(100vh - 120px) !important;
  flex: 1;
  display: flex;
}

.global-item-dialog-container :deep(.form-content-scrollable) {
  max-height: none !important;
  height: 100%;
  overflow-y: auto;
}

.global-item-dialog-container :deep(.form-main-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.global-item-dialog-container :deep(.form-main-content .form-content-scrollable) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>

<style>
/* Ensure fullscreen dialog overlay takes full viewport */
.v-dialog--fullscreen {
  height: 100vh !important;
  max-height: 100vh !important;
}

.v-dialog--fullscreen .v-overlay__content {
  height: 100vh !important;
  max-height: 100vh !important;
  margin: 0 !important;
}
</style>
