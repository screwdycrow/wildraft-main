<template>
  <span
    class="file-attachment-card"
    :class="{
      'file-attachment-card--image': isImage,
      'file-attachment-card--loading': isLoading,
    }"
    contenteditable="false"
  >
    <!-- Image Preview -->
    <span v-if="isImage && fileUrl" class="file-attachment-card__preview">
      <img :src="fileUrl" :alt="fileName" @error="handleImageError" />
    </span>

    <!-- File Icon -->
    <span v-else class="file-attachment-card__icon">
      <v-icon :icon="fileIcon" size="20" />
    </span>

    <!-- File Name -->
    <span class="file-attachment-card__name">{{ fileName }}</span>

    <!-- Delete Button (on hover) -->
    <button
      v-if="deletable"
      class="file-attachment-card__delete"
      @click.stop="$emit('delete', fileId)"
      contenteditable="false"
    >
      <v-icon icon="mdi-close" size="14" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getFileIcon } from '@/api/files'

interface Props {
  fileId: number
  fileName: string
  fileType: string
  fileUrl?: string | null
  deletable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fileUrl: null,
  deletable: false,
})

defineEmits<{
  delete: [fileId: number]
}>()

const isImage = computed(() => props.fileType.startsWith('image/'))
const fileIcon = computed(() => getFileIcon(props.fileType))
const isLoading = ref(false)

function handleImageError() {
  // If image fails to load, show icon instead
  isLoading.value = true
}
</script>

<style scoped>
.file-attachment-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  margin: 0 2px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.2;
  vertical-align: middle;
  position: relative;
  cursor: default;
  user-select: none;
  transition: all 0.2s ease;
}

.file-attachment-card:hover {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-color: rgba(var(--v-theme-primary), 0.5);
}

.file-attachment-card--image {
  padding: 2px;
}

.file-attachment-card__preview {
  display: inline-flex;
  align-items: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.file-attachment-card__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-attachment-card__icon {
  display: inline-flex;
  align-items: center;
  color: rgba(var(--v-theme-on-surface), 0.7);
  flex-shrink: 0;
}

.file-attachment-card__name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.file-attachment-card__delete {
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  margin-left: 4px;
  background: rgba(var(--v-theme-error), 0.8);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.file-attachment-card:hover .file-attachment-card__delete {
  display: inline-flex;
}

.file-attachment-card__delete:hover {
  background: rgb(var(--v-theme-error));
  transform: scale(1.1);
}
</style>

