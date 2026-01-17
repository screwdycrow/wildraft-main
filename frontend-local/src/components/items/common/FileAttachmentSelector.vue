<template>
  <div class="file-attachment-selector">
    <v-card class="glass-card" elevation="0">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-paperclip" class="mr-2" />
        Attached Files
        <v-chip v-if="selectedFileIds.length > 0" color="primary" size="small" class="ml-2">
          {{ selectedFileIds.length }}
        </v-chip>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-plus"
          size="small"
          @click="showFileManager = true"
        >
          {{ selectedFileIds.length > 0 ? 'Add More' : 'Add Files' }}
        </v-btn>
      </v-card-title>

      <v-card-text v-if="selectedFilesWithDetails.length > 0">
        <v-list density="compact">
          <v-list-item
            v-for="file in selectedFilesWithDetails"
            :key="file.id"
            class="px-0"
          >
            <template #prepend>
              <v-avatar :color="getFileColor(file.fileType)" variant="tonal" size="small">
                <v-icon :icon="getFileIcon(file.fileType)" size="small" />
              </v-avatar>
            </template>

            <v-list-item-title>{{ file.fileName }}</v-list-item-title>
            <v-list-item-subtitle>{{ formatFileSize(file.fileSize) }}</v-list-item-subtitle>

            <template #append>
              <v-btn
                icon="mdi-close"
                variant="text"
                size="x-small"
                color="error"
                @click="removeFile(file.id)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-text v-else class="text-center py-6">
        <v-icon icon="mdi-paperclip" size="48" color="grey" class="mb-2" />
        <p class="text-caption text-grey">No files attached</p>
      </v-card-text>
    </v-card>

    <!-- File Manager Dialog -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFilesStore } from '@/stores/files'
import FileManager from '@/components/files/FileManager.vue'
import { formatFileSize, getFileIcon } from '@/api/files'

interface Props {
  modelValue: number[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const filesStore = useFilesStore()
const showFileManager = ref(false)
const selectedFileIds = ref<number[]>([...props.modelValue])

// Get file details for selected files
const selectedFilesWithDetails = computed(() => {
  return selectedFileIds.value
    .map(id => filesStore.files.find(f => f.id === id))
    .filter(Boolean)
})

const handleFileSelect = (fileIds: number | number[]) => {
  const ids = Array.isArray(fileIds) ? fileIds : [fileIds]
  
  // Merge with existing selections (avoid duplicates)
  const uniqueIds = [...new Set([...selectedFileIds.value, ...ids])]
  selectedFileIds.value = uniqueIds
  emit('update:modelValue', uniqueIds)
}

const removeFile = (fileId: number) => {
  selectedFileIds.value = selectedFileIds.value.filter(id => id !== fileId)
  emit('update:modelValue', selectedFileIds.value)
}

const getFileColor = (fileType: string) => {
  if (fileType.startsWith('image/')) return 'primary'
  if (fileType.startsWith('video/')) return 'secondary'
  if (fileType.startsWith('audio/')) return 'accent'
  if (fileType.includes('pdf')) return 'error'
  return 'grey'
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  selectedFileIds.value = [...newValue]
}, { deep: true })

// Load files when component mounts
filesStore.fetchFiles()
</script>

<style scoped>
.file-attachment-selector {
  width: 100%;
}
</style>

