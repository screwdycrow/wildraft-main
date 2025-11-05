<template>
  <router-view />
  
  <!-- Global File Manager -->
  <file-manager v-model="isFileManagerOpen" />
</template>

<script setup lang="ts">
import FileManager from '@/components/files/FileManager.vue'
import { useFileManager } from '@/composables/useFileManager'

// Main app component - routing handled by vue-router
const { isFileManagerOpen } = useFileManager()
</script>

<style>
@import './assets/styles/glassmorphism.css';

/* Custom card hover effects */
.v-card {
  transition: all 0.3s ease-in-out;
}

/* Button styles */
.v-btn {
  text-transform: none;
  letter-spacing: 0.5px;
}

/* Make text fields blend with the glassmorphism theme */
:deep(.v-field) {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(10px);
}

:deep(.v-field--focused) {
  background: rgba(255, 255, 255, 0.08) !important;
}
</style>
