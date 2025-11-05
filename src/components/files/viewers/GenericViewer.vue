<template>
  <div class="generic-viewer">
    <div class="generic-viewer__content">
      <v-icon :icon="fileIcon" size="120" color="grey" class="mb-6" />
      
      <h2 class="text-h5 mb-4">{{ fileName }}</h2>
      
      <p class="text-body-1 text-medium-emphasis mb-6">
        {{ fileType }}
      </p>

      <p class="text-body-2 text-medium-emphasis mb-8">
        Preview not available for this file type
      </p>

      <div class="d-flex ga-2">
        <v-btn
          prepend-icon="mdi-download"
          color="primary"
          @click="download"
        >
          Download
        </v-btn>
        <v-btn
          prepend-icon="mdi-open-in-new"
          variant="outlined"
          @click="openInNewTab"
        >
          Open in New Tab
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getFileIcon } from '@/api/files'

interface Props {
  url: string
  fileName: string
  fileType: string
}

const props = defineProps<Props>()

const fileIcon = computed(() => getFileIcon(props.fileType))

const download = () => {
  const link = document.createElement('a')
  link.href = props.url
  link.download = props.fileName
  link.click()
}

const openInNewTab = () => {
  window.open(props.url, '_blank')
}
</script>

<style scoped>
.generic-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
}

.generic-viewer__content {
  text-align: center;
  max-width: 600px;
  padding: 32px;
}
</style>

