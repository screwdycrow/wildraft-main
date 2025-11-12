<template>
  <div ref="target" class="lazy-item-card">
    <item-card-wrapper
      v-if="isVisible"
      :item="item"
      :selected="selected"
      :selection-mode="selectionMode"
      @view="$emit('view', $event)"
      @edit="$emit('edit', $event)"
      @delete="$emit('delete', $event)"
      @select="(item, ctrlKey, metaKey) => $emit('select', item, ctrlKey, metaKey)"
      @contextmenu="(event, item) => $emit('contextmenu', event, item)"
    />
    <v-skeleton-loader
      v-else
      class="skeleton-card glass-card"
      type="card"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import type { LibraryItem } from '@/types/item.types'
import ItemCardWrapper from './ItemCardWrapper.vue'

interface Props {
  item: LibraryItem
  selected?: boolean
  selectionMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectionMode: false,
})

const emit = defineEmits<{
  view: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
  select: [item: LibraryItem, ctrlKey: boolean, metaKey: boolean]
  contextmenu: [event: MouseEvent, item: LibraryItem]
}>()

const target = ref<HTMLElement>()
const isVisible = ref(false)

// Use intersection observer to lazy load items
// rootMargin: '200px' means start loading 200px before the item enters viewport
useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      isVisible.value = true
    }
  },
  {
    rootMargin: '200px', // Start loading 200px before visible
    threshold: 0.01, // Trigger as soon as 1% is visible
    immediate: true, // Check immediately on mount (for items already in viewport)
  }
)
</script>

<style scoped>
.lazy-item-card {
  width: 100%;
  min-height: 200px; /* Minimum height to prevent layout shift */
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

