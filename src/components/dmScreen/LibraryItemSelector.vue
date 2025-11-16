<template>
  <v-dialog
    v-model="isOpen"
    max-width="800"
    scrollable
  >
    <v-card>
      <v-card-title>
        <v-icon icon="mdi-library" class="mr-2" />
        Select Library Item
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="close"
        />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-autocomplete
          v-model="selectedItem"
          :items="filteredItems"
          :search="searchQuery"
          :loading="loading"
          item-title="name"
          item-value="id"
          placeholder="Search for library items..."
          variant="outlined"
          density="comfortable"
          hide-details
          return-object
          @update:search="handleSearch"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item
              v-bind="itemProps"
              :title="item.raw.name"
              :subtitle="item.raw.type"
            >
              <template #prepend>
                <v-avatar size="40" class="mr-2">
                  <v-img
                    v-if="item.raw.featuredImage && item.raw.featuredImage.downloadUrl"
                    :src="item.raw.featuredImage.downloadUrl"
                    cover
                  />
                  <v-icon v-else icon="mdi-file-document" />
                </v-avatar>
              </template>
            </v-list-item>
          </template>
          <template #no-data>
            <v-list-item>
              <v-list-item-title>No items found</v-list-item-title>
            </v-list-item>
          </template>
        </v-autocomplete>

        <!-- Selected Item Preview -->
        <div v-if="selectedItem" class="mt-4">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1">
              Selected Item
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar size="60" class="mr-4">
                  <v-img
                    v-if="selectedItem.featuredImage && selectedItem.featuredImage.downloadUrl"
                    :src="selectedItem.featuredImage.downloadUrl"
                    cover
                  />
                  <v-icon v-else icon="mdi-file-document" size="32" />
                </v-avatar>
                <div>
                  <div class="text-h6">{{ selectedItem.name }}</div>
                  <div class="text-caption text-grey">{{ selectedItem.type }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!selectedItem"
          @click="confirmSelection"
        >
          Add to DM Screen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '@/stores/items'
import { useFilesStore } from '@/stores/files'
import type { LibraryItem } from '@/types/item.types'

interface Props {
  libraryId: number
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [item: LibraryItem]
}>()

const itemsStore = useItemsStore()
const filesStore = useFilesStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const searchQuery = ref('')
const selectedItem = ref<LibraryItem | null>(null)
const loading = ref(false)

// Load items when dialog opens
watch(isOpen, (value) => {
  if (value) {
    loadItems()
    searchQuery.value = ''
    selectedItem.value = null
  }
})

// Filtered items based on search
const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return itemsStore.items.slice(0, 50) // Show first 50 items when no search
  }
  
  const query = searchQuery.value.toLowerCase()
  return itemsStore.items.filter((item) => {
    return (
      item.name.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    )
  }).slice(0, 50)
})

// Load items from store
async function loadItems() {
  if (itemsStore.items.length === 0) {
    loading.value = true
    try {
      await itemsStore.fetchItems(props.libraryId)
    } catch (error) {
      console.error('[LibraryItemSelector] Failed to load items:', error)
    } finally {
      loading.value = false
    }
  }
}

// Handle search
function handleSearch(value: string | null) {
  searchQuery.value = value || ''
}

// Confirm selection
function confirmSelection() {
  if (selectedItem.value) {
    emit('select', selectedItem.value)
    close()
  }
}

// Close dialog
function close() {
  isOpen.value = false
  searchQuery.value = ''
  selectedItem.value = null
}
</script>

<style scoped>
.v-autocomplete {
  width: 100%;
}
</style>

