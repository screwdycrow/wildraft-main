<template>
  <div class="item-card-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <component
      :is="cardComponent"
      v-if="cardComponent"
      :item="item"
      v-bind="$attrs"
      @click="$emit('view', item)"
    />
    <generic-item-card
      v-else
      :item="item"
      v-bind="$attrs"
      @click="$emit('view', item)"
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
          @click.stop="showDeleteDialog = true"
        />
      </div>
    </transition>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500" @click.stop>
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete {{ getItemTypeName(item.type) }}?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ item.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            This will permanently remove this {{ getItemTypeName(item.type).toLowerCase() }} and all its data. This action cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LibraryItem, ItemType } from '@/types/item.types'
import GenericItemCard from './common/GenericItemCard.vue'
import CharacterCard from './dnd5e/characters/CharacterCard.vue'
import MagicItemCard from './dnd5e/items/MagicItemCard.vue'
import StatBlockCard from './dnd5e/stat-blocks/StatBlockCard.vue'
import NoteCard from './universal/notes/NoteCard.vue'

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
const showDeleteDialog = ref(false)

// Map item types to their card components
const componentMap: Record<ItemType, any> = {
  'CHARACTER_DND_5E': CharacterCard,
  'ITEM_DND_5E': MagicItemCard,
  'STAT_BLOCK_DND_5E': StatBlockCard,
  'NOTE': NoteCard,
}

const cardComponent = computed(() => {
  return componentMap[props.item.type] || null
})

function getItemTypeName(type: ItemType): string {
  const typeNames: Record<ItemType, string> = {
    'CHARACTER_DND_5E': 'Character',
    'ITEM_DND_5E': 'Item',
    'STAT_BLOCK_DND_5E': 'Stat Block',
    'NOTE': 'Note',
  }
  return typeNames[type] || 'Item'
}

function confirmDelete() {
  showDeleteDialog.value = false
  emit('delete', props.item)
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

