<template>
  <v-card
    class="media-card"
    :class="{ 'media-card--selected': selected }"
    @click="$emit('click', file)"
    hover
  >
    <!-- Thumbnail/Preview -->
    <div class="media-card__preview">
      <!-- Image Preview -->
      <v-img
        v-if="isImage"
        :src="thumbnailUrl"
        :aspect-ratio="1"
        cover
        class="media-card__image"
      >
        <template #placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </template>
      </v-img>

      <!-- Video Icon -->
      <div v-else-if="isVideo" class="media-card__icon-container">
        <v-icon icon="mdi-video" size="64" color="secondary" />
      </div>

      <!-- Audio Icon -->
      <div v-else-if="isAudio" class="media-card__icon-container">
        <v-icon icon="mdi-music" size="64" color="accent" />
      </div>

      <!-- PDF Icon -->
      <div v-else-if="isPdf" class="media-card__icon-container">
        <v-icon icon="mdi-file-pdf-box" size="64" color="error" />
      </div>

      <!-- Generic File Icon -->
      <div v-else class="media-card__icon-container">
        <v-icon :icon="fileIcon" size="64" color="grey" />
      </div>

      <!-- Selection Checkbox -->
      <div v-if="selectable" class="media-card__checkbox">
        <v-checkbox-btn
          :model-value="selected"
          color="primary"
          @click.stop="$emit('toggle-select', file)"
        />
      </div>

      <!-- Delete Button -->
      <div v-if="deletable && !hideDelete" class="media-card__delete">
        <v-btn
          icon="mdi-delete"
          size="small"
          color="error"
          variant="tonal"
          @click.stop="$emit('delete', file)"
        />
      </div>
    </div>

    <!-- File Info -->
    <v-card-text 
      v-if="!hideTitle"
      class="pa-2"
      :class="{ 'media-card__title--transparent': transparentTitle }"
    >
      <v-tooltip :text="file.fileName" location="top">
        <template #activator="{ props }">
          <div v-bind="props" class="text-body-2 text-truncate font-weight-medium">
            {{ file.fileName }}
          </div>
        </template>
      </v-tooltip>
      <div class="text-caption text-medium-emphasis">
        {{ formatFileSize(file.fileSize) }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { UserFile } from '@/api/files'
import { formatFileSize, getFileIcon } from '@/api/files'
import { useFilesStore } from '@/stores/files'

interface Props {
  file: UserFile
  selected?: boolean
  selectable?: boolean
  deletable?: boolean
  hideTitle?: boolean
  hideDelete?: boolean
  transparentTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideTitle: false,
  hideDelete: false,
  transparentTitle: false
})

defineEmits<{
  click: [file: UserFile]
  'toggle-select': [file: UserFile]
  delete: [file: UserFile]
}>()

const filesStore = useFilesStore()

const isImage = computed(() => props.file.fileType.startsWith('image/'))
const isVideo = computed(() => props.file.fileType.startsWith('video/'))
const isAudio = computed(() => props.file.fileType.startsWith('audio/'))
const isPdf = computed(() => props.file.fileType.includes('pdf'))

const fileIcon = computed(() => getFileIcon(props.file.fileType))

// Load thumbnail URL for images
const thumbnailUrl = ref('')
watch(() => props.file, async (file: UserFile) => {
  if (isImage.value) {
    try {
      thumbnailUrl.value = await filesStore.getDownloadUrl(file.id)
    } catch (error) {
      console.error('Failed to load thumbnail:', error)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.media-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.media-card:hover {
  transform: translateY(-4px);
}

.media-card--selected {
  outline: 3px solid rgb(var(--v-theme-primary));
}

.media-card__preview {
  position: relative;
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.media-card__icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.5), rgba(var(--v-theme-surface-variant), 0.5));
}

.media-card__image {
  width: 100%;
  height: 100%;
}

.media-card__checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.media-card__delete {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.2s;
}

.media-card:hover .media-card__delete {
  opacity: 1;
}

.media-card__title--transparent {
  background: transparent !important;
}
</style>

