<template>
  <div class="media-grid">
    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="media-grid__container">
      <media-card
        v-for="file in files"
        :key="file.id"
        :file="file"
        :selected="isSelected(file.id)"
        :selectable="selectable"
        :deletable="deletable"
        :show-view-action="showViewAction"
        @click="$emit('file-click', file)"
        @toggle-select="$emit('toggle-select', file)"
        @delete="$emit('delete', file)"
        @view="$emit('view', file)"
      />
    </div>

    <!-- List View -->
    <v-list v-else>
      <template v-for="(file, index) in files" :key="file.id">
        <v-list-item @click="$emit('file-click', file)">
          <template #prepend>
            <v-checkbox-btn
              v-if="selectable"
              :model-value="isSelected(file.id)"
              @click.stop="$emit('toggle-select', file)"
            />
            <v-avatar :color="getFileColor(file.fileType)" variant="tonal">
              <v-icon :icon="getFileIcon(file.fileType)" />
            </v-avatar>
          </template>

          <v-list-item-title>{{ file.fileName }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ formatFileSize(file.fileSize) }} • 
            {{ formatDate(file.createdAt) }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              v-if="showViewAction"
              icon="mdi-eye"
              variant="text"
              size="small"
              color="primary"
              @click.stop="$emit('view', file)"
            />
            <v-btn
              v-if="deletable"
              icon="mdi-delete"
              variant="text"
              size="small"
              color="error"
              @click.stop="$emit('delete', file)"
            />
          </template>
        </v-list-item>
        <v-divider v-if="index < files.length - 1" />
      </template>
    </v-list>

    <!-- Empty State -->
    <div v-if="files.length === 0" class="media-grid__empty">
      <v-icon icon="mdi-folder-open" size="64" color="grey" class="mb-4" />
      <p class="text-h6 mb-2">No files found</p>
      <p class="text-body-2 text-medium-emphasis">
        <slot name="empty-message">
          Upload your first file to get started
        </slot>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserFile } from '@/api/files'
import { formatFileSize, getFileIcon } from '@/api/files'
import MediaCard from './MediaCard.vue'

interface Props {
  files: UserFile[]
  viewMode?: 'grid' | 'list'
  selectable?: boolean
  deletable?: boolean
  selectedFiles?: Set<number>
  showViewAction?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'grid',
  selectable: false,
  deletable: false,
  selectedFiles: () => new Set(),
  showViewAction: false,
})

defineEmits<{
  'file-click': [file: UserFile]
  'toggle-select': [file: UserFile]
  delete: [file: UserFile]
  view: [file: UserFile]
}>()

const isSelected = (fileId: number) => props.selectedFiles.has(fileId)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getFileColor = (fileType: string) => {
  if (fileType.startsWith('image/')) return 'primary'
  if (fileType.startsWith('video/')) return 'secondary'
  if (fileType.startsWith('audio/')) return 'accent'
  if (fileType.includes('pdf')) return 'error'
  return 'grey'
}
</script>

<style scoped>
.media-grid__container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.media-grid__empty {
  text-align: center;
  padding: 64px 16px;
}

@media (max-width: 600px) {
  .media-grid__container {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
}
</style>


