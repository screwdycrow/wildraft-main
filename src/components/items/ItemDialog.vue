<template>
  <v-dialog
    v-model="isOpen"
    max-width="1400"
    min-height="90vh"
    scrollable
    fullscreen
    persistent
  >
    <item-form-wrapper
      :item="item"  
      :library-id="libraryId"
      :item-type="itemType"
      @submit="handleSubmit"
      @cancel="close"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import type { LibraryItem, ItemType, CreateLibraryItemPayload, UpdateLibraryItemPayload } from '@/types/item.types'
import { useToast } from 'vue-toastification'
import ItemFormWrapper from './ItemFormWrapper.vue'

interface Props {
  libraryId: number
  item?: LibraryItem | null
  itemType?: ItemType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  created: [item: LibraryItem]
  updated: [item: LibraryItem]
  close: []
}>()

const itemsStore = useItemsStore()
const toast = useToast()

const isOpen = defineModel<boolean>('modelValue', { default: false })

const isEditMode = computed(() => !!props.item)

async function handleSubmit(data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void) {
  try {
    if (isEditMode.value && props.item) {
      // Update existing item
      const updated = await itemsStore.updateItem(props.libraryId, props.item.id, data as UpdateLibraryItemPayload)
      toast.success('Item updated successfully')
      emit('updated', updated)
      callback?.(true)
      close()
    } else {
      // Create new item
      const created = await itemsStore.createItem(props.libraryId, data as CreateLibraryItemPayload)
      toast.success('Item created successfully')
      emit('created', created)
      callback?.(true)
      close()
    }
  } catch (error: any) {
    console.error('Failed to save item:', error)
    toast.error(error.response?.data?.error || 'Failed to save item')
    callback?.(false)
  }
}

function close() {
  isOpen.value = false
  emit('close')
}

// Auto-close on successful save is handled by the close() call in handleSubmit
</script>

