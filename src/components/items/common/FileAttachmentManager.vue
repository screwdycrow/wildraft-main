<template>
  <div class="file-attachment-manager">
    <!-- Attached Files Section -->
    <v-card v-if="attachedFiles && attachedFiles.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-paperclip" class="mr-2" />
        Attached Files ({{ attachedFiles.length }})
        <v-spacer />
        <v-btn
          v-if="canEdit"
          icon="mdi-plus"
          size="small"
          variant="text"
          @click="openFileSelector"
        />
      </v-card-title>
      
      <v-card-text>
        <media-grid
          :files="attachedFiles"
          :view-mode="viewMode"
          :deletable="canEdit"
          @file-click="openViewer"
          @delete="handleDetach"
        />
      </v-card-text>
    </v-card>

    <!-- Empty State + Add Button -->
    <v-card v-else class="glass-card mb-4" elevation="0">
      <v-card-text class="text-center py-8">
        <v-icon icon="mdi-paperclip" size="64" color="grey" class="mb-4" />
        <p class="text-body-1 text-grey">No files attached</p>
        <v-btn
          v-if="canEdit"
          color="primary"
          variant="outlined"
          prepend-icon="mdi-plus"
          class="mt-4"
          @click="openFileSelector"
        >
          Add Files
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- File Manager (Select Mode) -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleFileSelect"
    />

    <!-- Media Viewer -->
    <media-viewer
      v-model="viewerOpen"
      :file="selectedFile"
      :files="attachedFiles"
      hide-delete
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { UserFile } from '@/api/files'
import MediaGrid from '@/components/files/MediaGrid.vue'
import MediaViewer from '@/components/files/MediaViewer.vue'
import FileManager from '@/components/files/FileManager.vue'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'

interface Props {
  attachedFiles?: UserFile[]
  libraryId: number
  itemId: number
  canEdit?: boolean
  viewMode?: 'grid' | 'list'
}

const props = withDefaults(defineProps<Props>(), {
  attachedFiles: () => [],
  canEdit: true,
  viewMode: 'grid',
})

const emit = defineEmits<{
  'update:attachedFiles': [files: UserFile[]]
}>()

const itemsStore = useItemsStore()
const toast = useToast()

const showFileManager = ref(false)
const viewerOpen = ref(false)
const selectedFile = ref<UserFile | null>(null)

const openFileSelector = () => {
  showFileManager.value = true
}

const openViewer = (file: UserFile) => {
  selectedFile.value = file
  viewerOpen.value = true
}

const handleFileSelect = async (fileIds: number | number[]) => {
  const ids = Array.isArray(fileIds) ? fileIds : [fileIds]
  
  try {
    // Attach each file
    for (const fileId of ids) {
      await itemsStore.attachFile(props.libraryId, props.itemId, fileId)
    }
    toast.success(`Attached ${ids.length} file(s) successfully`)
  } catch (error) {
    console.error('Failed to attach files:', error)
    toast.error('Failed to attach files')
  }
}

const handleDetach = async (file: UserFile) => {
  try {
    await itemsStore.detachFile(props.libraryId, props.itemId, file.id)
    toast.success('File detached successfully')
  } catch (error) {
    console.error('Failed to detach file:', error)
    toast.error('Failed to detach file')
  }
}
</script>

<style scoped>
.file-attachment-manager {
  width: 100%;
}
</style>

