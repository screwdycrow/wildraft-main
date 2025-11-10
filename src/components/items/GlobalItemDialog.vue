<template>
  <v-dialog
    v-model="dialogState.isOpen"
    persistent
    scrollable
    fullscreen
    @click:outside="handleCancel"
  >
    <component
      v-if="dialogState.isOpen && formComponent"
      :is="formComponent"
      :item="dialogState.item"
      :library-id="dialogState.libraryId"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
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

