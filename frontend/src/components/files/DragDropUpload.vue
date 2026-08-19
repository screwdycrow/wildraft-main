<template>
  <div
    ref="dropZone"
    class="upload-zone"
    :class="{ 
      'upload-zone--active': isDragging,
      'upload-zone--compact': compact
    }"
    @click="triggerFileInput"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <v-icon
      :icon="isDragging ? 'mdi-cloud-upload' : 'mdi-upload'"
      :size="compact ? 24 : 48"
      :color="isDragging ? 'primary' : 'grey'"
      :class="compact ? 'mb-1' : 'mb-2'"
    />
    <p :class="compact ? 'text-caption mb-0' : 'text-h6 mb-1'">
      {{ isDragging ? 'Drop files here' : (compact ? 'Drop, paste or click' : 'Drag & drop, paste, or click to upload') }}
    </p>
    <p v-if="!compact" class="text-caption text-medium-emphasis">
      Paste an image straight from the clipboard, or pick a file.
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
    <div v-if="uploading" :class="compact ? 'mt-2' : 'mt-4'" :style="compact ? 'max-width: 200px; width: 100%;' : 'max-width: 400px; width: 100%;'">
      <v-progress-linear
        :model-value="uploadProgress"
        color="primary"
        height="8"
        class="mb-2"
      />
      <p class="text-caption">Uploading {{ currentFileName }}...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'vue-toastification'
import type { UserFile } from '@/api/files'

// Several upload zones can be alive at once (the global file manager, a form's
// inline uploader, ...). A paste is a single global event, so only the most
// recently mounted *visible* zone may claim it - otherwise one paste uploads
// the same image several times.
const pasteTargets: HTMLElement[] = []

interface Props {
  compact?: boolean
  categoryId?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  categoryId: null,
})

const emit = defineEmits<{
  uploaded: [file: UserFile]
  uploadComplete: [files: UserFile[]]
  uploadError: [error: Error]
}>()

const filesStore = useFilesStore()
const toast = useToast()

const fileInput = ref<HTMLInputElement>()
const dropZone = ref<HTMLElement>()
const uploading = ref(false)
const uploadProgress = ref(0)
const currentFileName = ref('')
const isDragging = ref(false)

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

const isVisible = (el: HTMLElement | undefined) =>
  !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)

// Clipboard images arrive without a usable name ("image.png" for every paste),
// so give them a timestamped one to keep the file list readable.
const namePastedFile = (file: File) => {
  const ext = file.name?.includes('.') ? file.name.split('.').pop() : (file.type.split('/')[1] || 'png')
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '')
  return new File([file], `pasted-${stamp}.${ext}`, { type: file.type })
}

const handlePaste = async (event: ClipboardEvent) => {
  if (!isVisible(dropZone.value)) return

  // Only the top-most visible zone handles the paste.
  const visible = pasteTargets.filter(isVisible)
  if (visible[visible.length - 1] !== dropZone.value) return

  // Don't hijack a normal text paste into an input or rich-text editor.
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, [contenteditable="true"]')) return

  const files = Array.from(event.clipboardData?.items || [])
    .filter(item => item.kind === 'file')
    .map(item => item.getAsFile())
    .filter((file): file is File => !!file)
    .map(file => (file.name && file.name !== 'image.png' ? file : namePastedFile(file)))

  if (files.length === 0) return

  event.preventDefault()
  await uploadFiles(files)
}

onMounted(() => {
  if (dropZone.value) pasteTargets.push(dropZone.value)
  window.addEventListener('paste', handlePaste)
})

onBeforeUnmount(() => {
  const index = pasteTargets.indexOf(dropZone.value as HTMLElement)
  if (index !== -1) pasteTargets.splice(index, 1)
  window.removeEventListener('paste', handlePaste)
})

const uploadFiles = async (files: File[]) => {
  if (files.length === 0) return

  uploading.value = true
  uploadProgress.value = 0

  const uploadedFiles: UserFile[] = []

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      currentFileName.value = file.name
      uploadProgress.value = ((i + 1) / files.length) * 100

      try {
        const userFile = await filesStore.uploadFile(file, undefined, undefined, props.categoryId)
        uploadedFiles.push(userFile)
        emit('uploaded', userFile)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        const uploadError = error instanceof Error ? error : new Error('Upload failed')
        emit('uploadError', uploadError)
        // Continue with other files even if one fails
      }
    }

    if (uploadedFiles.length > 0) {
      toast.success(`Successfully uploaded ${uploadedFiles.length} file(s)`)
      emit('uploadComplete', uploadedFiles)
    }
  } catch (error) {
    console.error('Upload failed:', error)
    const uploadError = error instanceof Error ? error : new Error('Failed to upload files')
    toast.error('Failed to upload files')
    emit('uploadError', uploadError)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    currentFileName.value = ''
  }
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

.upload-zone--compact {
  padding: 12px 16px;
  min-height: auto;
}

.upload-zone--compact .text-caption {
  font-size: 11px;
}
</style>

