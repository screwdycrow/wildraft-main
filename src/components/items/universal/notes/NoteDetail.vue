<template>
  <div class="note-detail">
    <!-- Header Section -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h4 font-weight-bold d-flex align-center">
        <v-icon icon="mdi-note-text" color="#95A5A6" size="48" class="mr-3" />
        {{ item.name }}
        <v-spacer />
        <v-icon
          v-if="noteData.isPinned"
          icon="mdi-pin"
          size="large"
          color="warning"
        />
      </v-card-title>

      <v-card-subtitle v-if="noteData.category" class="text-h6 mt-2">
        <v-chip color="primary" variant="tonal">
          <v-icon icon="mdi-folder" size="small" class="mr-1" />
          {{ noteData.category }}
        </v-chip>
      </v-card-subtitle>

      <v-card-text v-if="item.description" class="text-body-1 mt-2">
        {{ item.description }}
      </v-card-text>
    </v-card>

    <!-- Note Content -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-text" class="mr-2" />
        Content
        <v-spacer />
        <v-chip size="small" variant="tonal">
          {{ noteData.format || 'plain' }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <!-- Render based on format -->
        <div v-if="noteData.format === 'markdown'" v-html="renderedContent" class="note-content markdown-content" />
        <div v-else-if="noteData.format === 'html'" v-html="noteData.content" class="note-content html-content" />
        <pre v-else class="note-content plain-content">{{ noteData.content }}</pre>
      </v-card-text>
    </v-card>

    <!-- Tags -->
    <v-card v-if="item.tags && item.tags.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h6">
        <v-icon icon="mdi-tag-multiple" class="mr-2" />
        Tags
      </v-card-title>
      <v-card-text>
        <v-chip
          v-for="tag in item.tags"
          :key="tag.id"
          :color="tag.color"
          class="mr-2 mb-2"
        >
          <v-icon icon="mdi-tag" size="small" class="mr-1" />
          {{ tag.name }}
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- File Attachments -->
    <file-attachment-manager
      :attached-files="item.userFiles"
      :library-id="item.libraryId"
      :item-id="item.id"
      :can-edit="canEdit"
    />

    <!-- Metadata -->
    <v-card class="glass-card" elevation="0">
      <v-card-title class="text-h6">
        <v-icon icon="mdi-information" class="mr-2" />
        Metadata
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-caption text-grey">Created</div>
            <div>{{ formatDate(item.createdAt) }}</div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="text-caption text-grey">Last Updated</div>
            <div>{{ formatDate(item.updatedAt) }}</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, NoteData } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const noteData = computed<NoteData>(() => props.item.data as NoteData)

// Simple markdown renderer (you can use a library like marked.js for production)
const renderedContent = computed(() => {
  if (noteData.value.format !== 'markdown') return noteData.value.content
  
  // Basic markdown conversion (very simplified)
  let html = noteData.value.content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n$/gim, '<br />')
  
  return html
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.note-detail {
  width: 100%;
}

.note-content {
  padding: 16px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.3);
}

.plain-content {
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-content,
.html-content {
  line-height: 1.8;
}

.markdown-content h1,
.html-content h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.markdown-content h2,
.html-content h2 {
  font-size: 1.5em;
  margin-bottom: 0.5em;
}

.markdown-content h3,
.html-content h3 {
  font-size: 1.25em;
  margin-bottom: 0.5em;
}
</style>

