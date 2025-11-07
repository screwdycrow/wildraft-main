<template>
  <v-card
    class="note-card glass-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <v-card-title class="d-flex align-center pb-2">
      <v-icon icon="mdi-note-text" color="#95A5A6" class="mr-2" />
      <span class="text-truncate">{{ item.name }}</span>
      <v-spacer />
      <v-icon
        v-if="noteData.isPinned"
        icon="mdi-pin"
        size="small"
        color="warning"
      />
    </v-card-title>

    <v-card-subtitle v-if="noteData.category" class="text-caption">
      <v-chip size="x-small" variant="tonal">
        {{ noteData.category }}
      </v-chip>
    </v-card-subtitle>

    <v-card-text>
      <!-- Content Preview -->
      <p v-if="item.description" class="text-body-2 text-grey-lighten-1 text-truncate-2 mb-3">
        {{ item.description }}
      </p>

      <!-- Content Snippet -->
      <p class="text-body-2 text-grey-lighten-2 text-truncate-3">
        {{ getContentPreview(noteData.content) }}
      </p>

      <!-- Tags -->
      <div v-if="item.tags && item.tags.length > 0" class="mt-3">
        <v-chip
          v-for="tag in item.tags.slice(0, 3)"
          :key="tag.id"
          :color="tag.color"
          size="x-small"
          class="mr-1"
        >
          {{ tag.name }}
        </v-chip>
        <v-chip
          v-if="item.tags.length > 3"
          size="x-small"
          variant="tonal"
        >
          +{{ item.tags.length - 3 }}
        </v-chip>
      </div>

      <!-- File count -->
      <div v-if="item.userFiles && item.userFiles.length > 0" class="mt-2">
        <v-icon icon="mdi-paperclip" size="small" class="mr-1" />
        <span class="text-caption text-grey">{{ item.userFiles.length }} file(s)</span>
      </div>
    </v-card-text>

    <v-card-actions v-if="showActions">
      <v-spacer />
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click.stop="$emit('edit', item)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="text"
        color="error"
        @click.stop="$emit('delete', item)"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, NoteData } from '@/types/item.types'

interface Props {
  item: LibraryItem
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const noteData = computed<NoteData>(() => props.item.data as NoteData)

const getContentPreview = (content: string): string => {
  if (!content) return 'No content'
  // Strip markdown/HTML and truncate
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim()
  return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '')
}
</script>

<style scoped>
.note-card {
  transition: transform 0.2s ease-in-out;
}

.note-card:hover {
  transform: translateY(-4px);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

