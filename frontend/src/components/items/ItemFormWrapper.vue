<template>
  <component
    :is="formComponent"
    v-if="formComponent"
    :item="item"
    :library-id="libraryId"
    :item-type="itemType"
    :initial-tag-ids="initialTagIds"
    v-bind="$attrs"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  />
  <generic-item-form
    v-else
    :item="item"
    :library-id="libraryId"
    :initial-tag-ids="initialTagIds"
    v-bind="$attrs"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, ItemType, CreateLibraryItemPayload, UpdateLibraryItemPayload } from '@/types/item.types'
import GenericItemForm from './common/GenericItemForm.vue'
import CharacterForm from './dnd5e/characters/CharacterForm.vue'
import MagicItemForm from './dnd5e/items/MagicItemForm.vue'
import StatBlockForm from './dnd5e/stat-blocks/StatBlockForm.vue'
import NoteForm from './universal/notes/NoteForm.vue'

interface Props {
  item?: LibraryItem | null
  libraryId: number
  itemType: ItemType // For create mode when item is null
  initialTagIds?: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

// Map item types to their form components
const componentMap: Record<ItemType, any> = {
  'CHARACTER_DND_5E': CharacterForm,
  'ITEM_DND_5E': MagicItemForm,
  'STAT_BLOCK_DND_5E': StatBlockForm,
  'NOTE': NoteForm,
}

const formComponent = computed(() => {
  const type = props.item?.type || props.itemType
  return componentMap[type] || null
})

function handleSubmit(data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void) {
  emit('submit', data, callback)
}
</script>

