<template>
  <v-dialog
    :model-value="modelValue"
    max-width="900"
    scrollable
    :fullscreen="$vuetify.display.mobile"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="glass-card" elevation="0">
      <v-card-title class="d-flex align-center pa-4">
        <span class="text-h6">{{ item?.name || 'Item' }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <v-card-text class="pa-4">
        <div v-if="isLoading" class="text-center py-10">
          <v-progress-circular indeterminate color="primary" size="48" />
        </div>
        <v-alert v-else-if="error" type="error" variant="tonal">
          {{ error }}
        </v-alert>
        <component v-else-if="item && detailComponent" :is="detailComponent" :item="item" />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemsStore } from '@/stores/items'
import { useItemComponents } from '@/composables/useItemComponents'
import type { LibraryItem } from '@/types/item.types'

const props = defineProps<{
  modelValue: boolean
  libraryId: number
  itemId: number | null
}>()

defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const itemsStore = useItemsStore()
const { getItemComponent } = useItemComponents()

const item = ref<LibraryItem | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const detailComponent = computed(() => {
  if (!item.value) return null
  return getItemComponent(item.value.type, 'detail')
})

watch(
  () => [props.modelValue, props.itemId],
  async ([open]) => {
    if (!open || !props.itemId) return
    isLoading.value = true
    error.value = null
    item.value = null
    try {
      const fetched = await itemsStore.fetchItem(props.libraryId, props.itemId)
      if (!fetched) {
        error.value = 'This item is no longer shared with you.'
      } else {
        item.value = fetched
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || 'Failed to load this item. It may no longer be shared with you.'
    } finally {
      isLoading.value = false
    }
  }
)
</script>
