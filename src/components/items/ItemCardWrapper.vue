<template>
  <div class="item-card-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <component
      :is="cardComponent"
      :item="item"
      v-bind="$attrs"
      @click="handleCardClick"
    />
    
    <!-- Hover Actions -->
    <transition name="fade">
      <div v-if="showActions" class="card-actions">
        <v-btn
          icon="mdi-pencil"
          size="small"
          color="primary"
          variant="flat"
          @click.stop="$emit('edit', item)"
        />
        <v-btn
          icon="mdi-eye"
          size="small"
          color="info"
          variant="flat"
          @click.stop="$emit('view', item)"
        />
        <v-btn
          icon="mdi-delete"
          size="small"
          color="error"
          variant="flat"
          @click.stop="$emit('delete', item)"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LibraryItem } from '@/types/item.types'
import { useItemComponents } from '@/composables/useItemComponents'
import { useQuickItemViewStore } from '@/stores/quickItemView'

interface Props {
  item: LibraryItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [item: LibraryItem]
  view: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const showActions = ref(false)

const { getItemComponent } = useItemComponents()
const quickItemViewStore = useQuickItemViewStore()

const cardComponent = computed(() => {
  return getItemComponent(props.item.type, 'card')
})

function handleCardClick() {
  quickItemViewStore.open(props.item)
}
</script>

<style scoped>
.item-card-wrapper {
  position: relative;
  cursor: pointer;
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

