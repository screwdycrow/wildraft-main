<template>
  <v-dialog
    v-model="isOpen"
    max-width="1400"
    scrollable
    persistent
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-folder-multiple" class="mr-2" />
        {{ selectMode ? 'Select Files' : 'File Manager' }}
        <v-spacer />
        
        <!-- Selection Info -->
        <v-chip
          v-if="selectMode && selectedFiles.size > 0"
          color="primary"
          size="small"
          class="mr-2"
        >
          {{ selectedFiles.size }} selected
        </v-chip>
        
        <!-- View Toggle -->
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="compact"
          class="mr-2"
        >
          <v-btn value="grid" icon="mdi-view-grid" size="small" />
          <v-btn value="list" icon="mdi-view-list" size="small" />
        </v-btn-toggle>
        
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 700px;">
        <!-- Drag & Drop Upload Zone -->
        <div
          ref="dropZone"
          class="upload-zone mb-4"
          :class="{ 'upload-zone--active': isDragging }"
          @click="triggerFileInput"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <v-icon
            :icon="isDragging ? 'mdi-cloud-upload' : 'mdi-upload'"
            size="48"
            :color="isDragging ? 'primary' : 'grey'"
            class="mb-2"
          />
          <p class="text-h6 mb-1">
            {{ isDragging ? 'Drop files here' : 'Drag & drop files or click to upload' }}
          </p>
          <p class="text-caption text-medium-emphasis">
            Files under 1MB use direct upload, larger files use presigned URLs
          </p>
          
          <input
            ref="fileInput"
            type="file"
            multiple
            hidden
            @change="handleFileInputChange"
          />

          <!-- Upload Progress -->
          <div v-if="uploading" class="mt-4" style="max-width: 400px; width: 100%;">
            <v-progress-linear
              :model-value="uploadProgress"
              color="primary"
              height="8"
              class="mb-2"
            />
            <p class="text-caption">Uploading {{ currentFileName }}...</p>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="d-flex ga-2 mb-4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search files"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
          <v-select
            v-model="filterType"
            :items="fileTypes"
            label="File Type"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 200px;"
          />
        </div>

        <!-- Media Grid -->
        <media-grid
          :files="filteredFiles"
          :view-mode="viewMode"
          :deletable="!selectMode"
          :selectable="selectMode"
          :selected-files="selectedFiles"
          :show-view-action="!selectMode"
          @file-click="handleFileClick"
          @toggle-select="toggleFileSelection"
          @delete="confirmDelete"
          @view="openFileViewer"
        />

        <!-- Loading State -->
        <div v-if="filesStore.loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Load More -->
        <div v-if="canLoadMore" class="text-center mt-4">
          <v-btn
            @click="loadMore"
            :loading="filesStore.loading"
            variant="outlined"
          >
            Load More
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          {{ selectMode ? 'Cancel' : 'Close' }}
        </v-btn>
        <v-btn
          v-if="selectMode"
          color="primary"
          variant="flat"
          :disabled="selectedFiles.size === 0"
          @click="confirmSelection"
        >
          <v-icon icon="mdi-check" class="mr-2" />
          Select {{ selectedFiles.size > 0 ? `(${selectedFiles.size})` : '' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Media Viewer -->
  <media-viewer
    v-model="viewerOpen"
    :file="selectedFile"
    :files="filteredFiles"
    :on-delete="confirmDelete"
  />

  <!-- Delete Confirmation -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title>Delete File?</v-card-title>
      <v-card-text>
        Are you sure you want to delete <strong>{{ fileToDelete?.fileName }}</strong>?
        This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="deleteFileConfirmed" :loading="deleting">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFilesStore } from '@/stores/files'
import type { UserFile } from '@/api/files'
import { useToast } from 'vue-toastification'
import MediaGrid from './MediaGrid.vue'
import MediaViewer from './MediaViewer.vue'

interface Props {
  selectMode?: boolean
  returnType?: 'id' | 'path'
  multiple?: boolean
  filterType?: string | null // Filter by file type (e.g., 'image')
}

const props = withDefaults(defineProps<Props>(), {
  selectMode: false,
  returnType: 'id',
  multiple: false,
  filterType: null,
})

const emit = defineEmits<{
  select: [value: number | string | number[] | string[]]
}>()

const filesStore = useFilesStore()
const toast = useToast()

const isOpen = defineModel<boolean>('modelValue', { default: false })
const fileInput = ref<HTMLInputElement>()
const dropZone = ref<HTMLElement>()
const uploading = ref(false)
const uploadProgress = ref(0)
const currentFileName = ref('')
const search = ref('')
const filterType = ref<string | null>(null)
const deleteDialog = ref(false)
const fileToDelete = ref<UserFile | null>(null)
const deleting = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const isDragging = ref(false)
const selectedFiles = ref<Set<number>>(new Set())
const viewerOpen = ref(false)
const selectedFile = ref<UserFile | null>(null)

const fileTypes = [
  { title: 'Images', value: 'image' },
  { title: 'Documents', value: 'document' },
  { title: 'Videos', value: 'video' },
  { title: 'Audio', value: 'audio' },
  { title: 'Archives', value: 'archive' },
]

// Load files when dialog opens
watch(isOpen, (value) => {
  if (value) {
    filesStore.fetchFiles()
    // Set filter type if provided
    if (props.filterType) {
      filterType.value = props.filterType
    }
  }
})

// Filtered files
const filteredFiles = computed(() => {
  let result = filesStore.files

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(f => 
      f.fileName.toLowerCase().includes(searchLower)
    )
  }

  if (filterType.value) {
    result = result.filter(f => f.fileType.includes(filterType.value!))
  }

  return result
})

const canLoadMore = computed(() => {
  return filesStore.files.length < filesStore.total
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileInputChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  await uploadFiles(files)
  
  // Reset file input
  if (target) target.value = ''
}

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer?.files || [])
  await uploadFiles(files)
}

const uploadFiles = async (files: File[]) => {
  if (files.length === 0) return

  uploading.value = true
  uploadProgress.value = 0

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentFileName.value = file.name
      uploadProgress.value = ((i + 1) / files.length) * 100

      await filesStore.uploadFile(file)
    }

    toast.success(`Successfully uploaded ${files.length} file(s)`)
  } catch (error) {
    console.error('Upload failed:', error)
    toast.error('Failed to upload files')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    currentFileName.value = ''
  }
}

const openFileViewer = (file: UserFile) => {
  selectedFile.value = file
  viewerOpen.value = true
}

const confirmDelete = (file: UserFile) => {
  fileToDelete.value = file
  deleteDialog.value = true
}

const deleteFileConfirmed = async () => {
  if (!fileToDelete.value) return

  deleting.value = true
  try {
    await filesStore.deleteFile(fileToDelete.value.id)
    toast.success('File deleted successfully')
    deleteDialog.value = false
    fileToDelete.value = null
  } catch (error) {
    console.error('Delete failed:', error)
    toast.error('Failed to delete file')
  } finally {
    deleting.value = false
  }
}

const loadMore = () => {
  filesStore.loadMore()
}

// File click handler
const handleFileClick = (file: UserFile) => {
  if (props.selectMode) {
    toggleFileSelection(file)
  } else {
    openFileViewer(file)
  }
}

// Select mode handlers
const toggleFileSelection = (file: UserFile) => {
  if (!props.selectMode) return
  
  if (props.multiple) {
    // Toggle selection for multiple mode
    if (selectedFiles.value.has(file.id)) {
      selectedFiles.value.delete(file.id)
    } else {
      selectedFiles.value.add(file.id)
    }
  } else {
    // Single selection mode
    selectedFiles.value.clear()
    selectedFiles.value.add(file.id)
  }
}

const confirmSelection = () => {
  if (selectedFiles.value.size === 0) return
  
  const selectedFileIds = Array.from(selectedFiles.value)
  const selectedFileObjects = filesStore.files.filter(f => selectedFileIds.includes(f.id))
  
  if (props.returnType === 'path') {
    // Return file paths
    const paths = selectedFileObjects.map(f => f.fileUrl)
    emit('select', props.multiple ? paths : paths[0])
  } else {
    // Return file IDs (default)
    emit('select', props.multiple ? selectedFileIds : selectedFileIds[0])
  }
  
  // Clear selection and close
  selectedFiles.value.clear()
  isOpen.value = false
}

const close = () => {
  selectedFiles.value.clear()
  isOpen.value = false
}
</script>

<style scoped>
.upload-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.3);
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(var(--v-theme-surface), 0.5);
}

.upload-zone:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.upload-zone--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  transform: scale(1.02);
}
</style>

