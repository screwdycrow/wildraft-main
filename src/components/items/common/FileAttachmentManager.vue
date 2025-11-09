<template>
  <div>
    <!-- Attached Files Grid -->
    <attached-files-grid
      :file-ids="userFileIds"
      :featured-image-id="featuredImageId"
      :columns="columns"
      @add-files="openFileManager"
      @remove-file="removeFile"
      @set-featured="setFeaturedImage"
    />

    <!-- File Manager Dialog -->
    <file-manager
      v-model="fileManagerOpen"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleFilesSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AttachedFilesGrid from './AttachedFilesGrid.vue'
import FileManager from '@/components/files/FileManager.vue'

interface Props {
  featuredImageId?: number | null
  columns?: number
}

withDefaults(defineProps<Props>(), {
  columns: 6,
})

const userFileIds = defineModel<number[]>({ default: () => [] })
const featuredImageId = defineModel<number | null>('featuredImageId', { default: null })

const emit = defineEmits<{
  'update:featuredImageId': [value: number | null]
}>()

const fileManagerOpen = ref(false)

function openFileManager() {
  fileManagerOpen.value = true
}

function handleFilesSelected(fileIds: number | number[]) {
  const idsArray = Array.isArray(fileIds) ? fileIds : [fileIds]
  
  // Add new file IDs, avoiding duplicates
  const existingIds = new Set(userFileIds.value)
  const newIds = idsArray.filter(id => !existingIds.has(id))
  
  userFileIds.value = [...userFileIds.value, ...newIds]
}

function removeFile(fileId: number) {
  userFileIds.value = userFileIds.value.filter(id => id !== fileId)
  
  // If removing the featured image, clear it
  if (featuredImageId.value === fileId) {
    featuredImageId.value = null
  }
}

function setFeaturedImage(fileId: number | null) {
  featuredImageId.value = fileId
  emit('update:featuredImageId', fileId)
}
</script>
