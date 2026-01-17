<template>
  <div class="quick-note-component">
    <div class="note-header">
      <v-text-field
        v-model="localTitle"
        variant="plain"
        density="compact"
        placeholder="Note title..."
        hide-details
        class="note-title-input"
        @blur="updateNote"
      />
    </div>
    <div class="note-content">
      <v-textarea
        v-model="localContent"
        variant="plain"
        density="compact"
        placeholder="Note content..."
        auto-grow
        hide-details
        rows="3"
        @blur="updateNote"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

interface Props {
  item: DmScreenItem
}

const emit = defineEmits<{
  update: [item: DmScreenItem]
}>()

const props = defineProps<Props>()

const localTitle = ref(props.item.data.title || '')
const localContent = ref(props.item.data.content || '')

watch(() => props.item.data, (newData) => {
  localTitle.value = newData.title || ''
  localContent.value = newData.content || ''
}, { deep: true })

function updateNote() {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      title: localTitle.value,
      content: localContent.value,
    }
  }
  emit('update', updatedItem)
}
</script>

<style scoped>
.quick-note-component {
  padding: 16px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.note-header {
  margin-bottom: 8px;
}

.note-title-input :deep(.v-field__input) {
  font-weight: 600;
  font-size: 16px;
}

.note-content {
  flex: 1;
}

.note-content :deep(.v-field__input) {
  font-size: 14px;
  line-height: 1.5;
}
</style>

