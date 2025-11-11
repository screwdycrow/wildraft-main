<template>
  <div class="item-detail-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <v-icon icon="mdi-alert-circle" size="120" color="error" class="mb-6" />
      <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">Item Not Found</h2>
      <p class="text-body-1 text-grey-lighten-1 mb-6">
        {{ error }}
      </p>
      <v-btn color="primary" prepend-icon="mdi-arrow-left" @click="goBack">
        Go Back
      </v-btn>
    </div>

    <!-- Dynamic Item Detail Component -->
    <component
      v-else-if="item && detailComponent"
      :is="detailComponent"
      :item="item"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useItemComponents } from '@/composables/useItemComponents'
import { useItemDialogs } from '@/composables/useItemDialogs'
import { useToast } from 'vue-toastification'
import type { LibraryItem } from '@/types/item.types'

const route = useRoute()
const router = useRouter()
const itemsStore = useItemsStore()
const { getItemComponent } = useItemComponents()
const { openEditDialog, dialogState } = useItemDialogs()
const toast = useToast()

const isLoading = ref(true)
const error = ref<string | null>(null)
const item = ref<LibraryItem | null>(null)

const detailComponent = computed(() => {
  if (!item.value) return null
  return getItemComponent(item.value.type, 'detail')
})

async function loadItem() {
  try {
    isLoading.value = true
    error.value = null
    
    const libraryId = parseInt(route.params.libraryId as string)
    const itemId = parseInt(route.params.itemId as string)
    
    if (isNaN(libraryId) || isNaN(itemId)) {
      error.value = 'Invalid library or item ID'
      return
    }

    // Fetch the item
    const fetchedItem = await itemsStore.fetchItem(libraryId, itemId)
    
    if (!fetchedItem) {
      error.value = 'Item not found or you do not have permission to view it.'
      return
    }
    
    item.value = fetchedItem
  } catch (err: any) {
    console.error('Error loading item:', err)
    error.value = err.message || 'Failed to load item details'
  } finally {
    isLoading.value = false
  }
}

function handleEdit() {
  if (!item.value) return
  
  // Open the global edit dialog
  openEditDialog(item.value, item.value.libraryId)
  
  // Watch for dialog close and reload item
  const originalDialogState = dialogState.value.isOpen
  const checkInterval = setInterval(() => {
    if (originalDialogState && !dialogState.value.isOpen) {
      // Dialog was closed, reload the item
      clearInterval(checkInterval)
      loadItem()
    }
  }, 100)
  
  // Clear interval after 10 seconds to prevent memory leak
  setTimeout(() => clearInterval(checkInterval), 10000)
}

async function handleDelete() {
  if (!item.value) return
  
  // Confirm deletion
  if (!confirm(`Are you sure you want to delete "${item.value.name}"?`)) {
    return
  }
  
  try {
    await itemsStore.deleteItem(item.value.libraryId, item.value.id)
    toast.success('Item deleted successfully')
    
    // Navigate back to the library
    router.push({
      name: 'Library',
      params: { id: item.value.libraryId }
    })
  } catch (err: any) {
    console.error('Error deleting item:', err)
    toast.error('Failed to delete item')
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadItem()
})
</script>

<style scoped>
.item-detail-view {
  min-height: 400px;
}
</style>






