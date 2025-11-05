<template>
  <v-dialog
    v-model="isOpen"
    max-width="1200"
    scrollable
    persistent
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-folder-multiple" class="mr-2" />
        File Manager
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 600px;">
        <!-- Upload Section -->
        <v-card class="mb-4" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <h3 class="text-h6 mb-1">Upload Files</h3>
                <p class="text-caption text-medium-emphasis">
                  Files under 1MB use direct upload, larger files use presigned URLs
                </p>
              </div>
              <v-btn
                color="primary"
                prepend-icon="mdi-upload"
                @click="triggerFileInput"
                :loading="uploading"
              >
                Upload Files
              </v-btn>
            </div>
            
            <input
              ref="fileInput"
              type="file"
              multiple
              hidden
              @change="handleFileSelect"
            />

            <!-- Upload Progress -->
            <div v-if="uploading" class="mt-4">
              <v-progress-linear
                :model-value="uploadProgress"
                color="primary"
                height="8"
                class="mb-2"
              />
              <p class="text-caption">Uploading {{ currentFileName }}...</p>
            </div>
          </v-card-text>
        </v-card>

        <!-- Filters and Search -->
        <div class="d-flex gap-2 mb-4">
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

        <!-- Files List -->
        <v-card>
          <v-list v-if="filteredFiles.length > 0">
            <template v-for="(file, index) in filteredFiles" :key="file.id">
              <v-list-item>
                <template #prepend>
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
                    icon="mdi-download"
                    variant="text"
                    size="small"
                    @click="downloadFile(file)"
                  />
                  <v-btn
                    icon="mdi-content-copy"
                    variant="text"
                    size="small"
                    @click="copyFileUrl(file)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDelete(file)"
                  />
                </template>
              </v-list-item>
              <v-divider v-if="index < filteredFiles.length - 1" />
            </template>
          </v-list>

          <v-card-text v-else-if="!filesStore.loading" class="text-center py-8">
            <v-icon icon="mdi-folder-open" size="64" color="grey" class="mb-4" />
            <p class="text-h6 mb-2">No files found</p>
            <p class="text-body-2 text-medium-emphasis">
              Upload your first file to get started
            </p>
          </v-card-text>

          <v-card-text v-if="filesStore.loading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" />
          </v-card-text>
        </v-card>

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
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
import { formatFileSize, getFileIcon } from '@/api/files'
import type { UserFile } from '@/api/files'
import { useToast } from 'vue-toastification'

const filesStore = useFilesStore()
const toast = useToast()

const isOpen = defineModel<boolean>('modelValue', { default: false })
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadProgress = ref(0)
const currentFileName = ref('')
const search = ref('')
const filterType = ref<string | null>(null)
const deleteDialog = ref(false)
const fileToDelete = ref<UserFile | null>(null)
const deleting = ref(false)

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

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  
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
    
    // Reset file input
    if (target) target.value = ''
  }
}

const downloadFile = async (file: UserFile) => {
  try {
    const url = await filesStore.getDownloadUrl(file.id)
    window.open(url, '_blank')
  } catch (error) {
    console.error('Download failed:', error)
    toast.error('Failed to download file')
  }
}

const copyFileUrl = async (file: UserFile) => {
  try {
    const url = await filesStore.getDownloadUrl(file.id)
    await navigator.clipboard.writeText(url)
    toast.success('File URL copied to clipboard')
  } catch (error) {
    console.error('Copy failed:', error)
    toast.error('Failed to copy URL')
  }
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

const close = () => {
  isOpen.value = false
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getFileColor = (fileType: string) => {
  if (fileType.startsWith('image/')) return 'primary'
  if (fileType.startsWith('video/')) return 'secondary'
  if (fileType.startsWith('audio/')) return 'accent'
  if (fileType.includes('pdf')) return 'error'
  if (fileType.includes('word') || fileType.includes('document')) return 'info'
  return 'grey'
}
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>

