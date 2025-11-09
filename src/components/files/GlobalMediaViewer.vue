<template>
  <media-viewer
    v-model="isOpen"
    :file="currentFile"
    :files="fileList"
  />
</template>

<script setup lang="ts">
import { useMediaViewer } from '@/composables/useMediaViewer'
import MediaViewer from './MediaViewer.vue'

const { isOpen, currentFile, fileList } = useMediaViewer()
</script>


