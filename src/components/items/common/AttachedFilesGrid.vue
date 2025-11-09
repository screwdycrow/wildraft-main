<template>
  <div v-if="attachedFiles.length > 0 || !readOnly">
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <h4 class="text-subtitle-2 mb-1">Attached Files</h4>
        <p class="text-caption text-grey-lighten-1">
          {{ attachedFiles.length }} file(s) attached
        </p>
      </div>
      <v-btn
        v-if="!readOnly"
        prepend-icon="mdi-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="$emit('add-files')"
      >
        Add Files
      </v-btn>
    </div>

    <!-- Empty State -->
    <v-alert
      v-if="attachedFiles.length === 0 && !readOnly"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      <v-icon icon="mdi-information" class="mr-2" />
      No files attached yet. Click "Add Files" to attach files to this item.
    </v-alert>

    <!-- Files Grid -->
    <v-row v-if="attachedFiles.length > 0">
      <v-col
        v-for="file in attachedFiles"
        :key="file.id"
        :cols="Math.floor(12 / columns)"
      >
        <media-card
          :file="file"
          :deletable="!readOnly"
          :show-featured-toggle="!readOnly"
          :is-featured="file.id === featuredImageId"
          @click="openFileViewer(file)"
          @delete="$emit('remove-file', file.id)"
          @toggle-featured="toggleFeatured(file)"
        />
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="glass-card">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-alert" color="error" class="mr-2" />
          Remove File?
        </v-card-title>
        <v-card-text>
          Are you sure you want to remove <strong>{{ fileToDelete?.fileName }}</strong> from this item?
          <v-alert type="info" variant="tonal" density="compact" class="mt-3">
            This will only remove the file from this item. The file will remain in your library.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmRemove">
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilesStore } from '@/stores/files'
import { useMediaViewer } from '@/composables/useMediaViewer'
import type { UserFile } from '@/api/files'
import MediaCard from '@/components/files/MediaCard.vue'

interface Props {
  fileIds: number[]
  featuredImageId?: number | null
  columns?: number
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: 6,
  readOnly: false,
})

const emit = defineEmits<{
  'add-files': []
  'remove-file': [fileId: number]
  'set-featured': [fileId: number | null]
}>()

const filesStore = useFilesStore()
const { openViewer } = useMediaViewer()

const deleteDialog = ref(false)
const fileToDelete = ref<UserFile | null>(null)

// Get file objects from IDs and sort to show featured first
const attachedFiles = computed(() => {
  const files = props.fileIds
    .map(id => filesStore.files.find(f => f.id === id))
    .filter((f): f is UserFile => f !== undefined)
  
  // Sort: featured image first, then by filename
  return files.sort((a, b) => {
    if (a.id === props.featuredImageId) return -1
    if (b.id === props.featuredImageId) return 1
    return a.fileName.localeCompare(b.fileName)
  })
})

function openFileViewer(file: UserFile) {
  openViewer(file, attachedFiles.value)
}

function confirmRemove() {
  if (fileToDelete.value) {
    emit('remove-file', fileToDelete.value.id)
    deleteDialog.value = false
    fileToDelete.value = null
  }
}

function toggleFeatured(file: UserFile) {
  // Check if file is an image
  if (!file.fileType.startsWith('image/')) {
    return
  }
  
  // If clicking the already featured image, unfeatured it
  if (file.id === props.featuredImageId) {
    emit('set-featured', null)
  } else {
    emit('set-featured', file.id)
  }
}
</script>

<style scoped>
/* Add any specific styling if needed */
</style>

