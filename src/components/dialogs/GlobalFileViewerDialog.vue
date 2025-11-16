<template>
  <v-dialog
    v-model="dialogsStore.fileViewerOpen"
    max-width="1200"
    scrollable
    @update:model-value="handleClose"
  >
    <v-card v-if="dialogsStore.fileViewerData">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-file" />
          <span>{{ dialogsStore.fileViewerData.fileName }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogsStore.closeFileViewer()"
        />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <div class="file-viewer-content">
          <!-- Image viewer -->
          <v-img
            v-if="dialogsStore.fileViewerData.fileType.startsWith('image/')"
            :src="dialogsStore.fileViewerData.downloadUrl"
            contain
            max-height="70vh"
          />
          
          <!-- PDF viewer -->
          <iframe
            v-else-if="dialogsStore.fileViewerData.fileType === 'application/pdf'"
            :src="dialogsStore.fileViewerData.downloadUrl"
            width="100%"
            height="70vh"
            style="border: none;"
          />
          
          <!-- Video viewer -->
          <video
            v-else-if="dialogsStore.fileViewerData.fileType.startsWith('video/')"
            :src="dialogsStore.fileViewerData.downloadUrl"
            controls
            style="max-width: 100%; max-height: 70vh;"
          />
          
          <!-- Audio viewer -->
          <audio
            v-else-if="dialogsStore.fileViewerData.fileType.startsWith('audio/')"
            :src="dialogsStore.fileViewerData.downloadUrl"
            controls
            style="width: 100%;"
          />
          
          <!-- Fallback -->
          <div v-else class="pa-6 text-center">
            <v-icon icon="mdi-file" size="64" class="mb-4" />
            <p class="text-body-1 mb-4">{{ dialogsStore.fileViewerData.fileName }}</p>
            <v-btn
              color="primary"
              :href="dialogsStore.fileViewerData.downloadUrl"
              target="_blank"
              prepend-icon="mdi-download"
            >
              Download File
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDialogsStore } from '@/stores/dialogs'

const dialogsStore = useDialogsStore()

function handleClose(value: boolean) {
  if (!value) {
    dialogsStore.closeFileViewer()
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.file-viewer-content {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
}
</style>

