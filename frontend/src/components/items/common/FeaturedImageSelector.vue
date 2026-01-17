<template>
  <div>
    <h4 class="text-subtitle-2 mb-3">Featured Image</h4>
    <p class="text-caption text-grey-lighten-1 mb-4">
      Select one of the attached files as the featured image for this item.
    </p>
    
    <!-- Show message if no files attached -->
    <v-alert v-if="!fileIds || fileIds.length === 0" type="info" variant="tonal" density="compact">
      <v-icon icon="mdi-information" class="mr-2" />
      Upload files first to select a featured image.
    </v-alert>
    
    <!-- File grid for selection -->
    <v-row v-else>
      <v-col
        v-for="fileId in fileIds"
        :key="fileId"
        cols="6"
        sm="4"
        md="3"
      >
        <v-card
          :class="['featured-image-card', { 'selected': modelValue === fileId }]"
          :color="modelValue === fileId ? 'primary' : undefined"
          :variant="modelValue === fileId ? 'tonal' : 'outlined'"
          hover
        >
          <div class="image-preview" @click="selectImage(fileId)">
            <v-img
              :src="getFileUrl(fileId)"
              :alt="`File ${fileId}`"
              aspect-ratio="1"
              cover
              class="rounded"
            >
              <template #error>
                <div class="d-flex align-center justify-center fill-height bg-grey-darken-3">
                  <v-icon icon="mdi-file" size="48" color="grey" />
                </div>
              </template>
            </v-img>
            
            <!-- Selected indicator -->
            <div v-if="modelValue === fileId" class="selected-overlay">
              <v-icon icon="mdi-check-circle" size="32" color="primary" />
            </div>

            <!-- View button -->
            <div class="view-overlay">
              <v-btn
                icon="mdi-eye"
                size="small"
                color="white"
                variant="elevated"
                @click.stop="viewImage(fileId)"
              />
            </div>
          </div>
          
          <v-card-text class="text-center pa-2">
            <v-chip
              v-if="modelValue === fileId"
              color="primary"
              size="x-small"
              variant="flat"
            >
              <v-icon icon="mdi-star" size="12" class="mr-1" />
              Featured
            </v-chip>
            <span v-else class="text-caption text-grey">
              File #{{ fileId }}
            </span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Clear selection button -->
    <v-btn
      v-if="modelValue && fileIds && fileIds.length > 0"
      variant="text"
      color="error"
      size="small"
      class="mt-2"
      prepend-icon="mdi-close"
      @click="clearSelection"
    >
      Clear Featured Image
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilesStore } from '@/stores/files'
import { useMediaViewer } from '@/composables/useMediaViewer'
import type { UserFile } from '@/api/files'

interface Props {
  modelValue?: number | null
  fileIds: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const filesStore = useFilesStore()
const { openViewer } = useMediaViewer()

// Get file objects from IDs
const attachedFiles = computed(() => {
  return props.fileIds
    .map(id => filesStore.files.find(f => f.id === id))
    .filter((f): f is UserFile => f !== undefined)
})

function getFileUrl(fileId: number): string {
  const file = filesStore.files.find(f => f.id === fileId)
  return file?.fileUrl || ''
}

function viewImage(fileId: number) {
  const file = attachedFiles.value.find(f => f.id === fileId)
  if (file) {
    openViewer(file, attachedFiles.value)
  }
}

function selectImage(fileId: number) {
  emit('update:modelValue', fileId)
}

function clearSelection() {
  emit('update:modelValue', null)
}
</script>

<style scoped>
.featured-image-card {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.featured-image-card:hover {
  transform: translateY(-4px);
}

.featured-image-card.selected {
  border-width: 2px;
}

.image-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
}

.selected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  pointer-events: none;
}

.view-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.image-preview:hover .view-overlay {
  opacity: 1;
}
</style>

