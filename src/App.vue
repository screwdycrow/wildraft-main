<template>
  <router-view />
  
  <!-- Global File Manager -->
  <file-manager v-model="isFileManagerOpen" />
  
  <!-- Global Media Viewer -->
  <global-media-viewer />
</template>

<script setup lang="ts">
import FileManager from '@/components/files/FileManager.vue'
import GlobalMediaViewer from '@/components/files/GlobalMediaViewer.vue'
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

/* Custom Toast Notifications - Discrete & Bottom Center */
.custom-toast-container {
  width: auto !important;
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 24px !important;
}

.custom-toast {
  background: rgba(30, 30, 35, 0.95) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  padding: 12px 16px !important;
  font-size: 0.875rem !important;
  min-height: auto !important;
  margin-bottom: 8px !important;
}

/* Success toast */
.custom-toast.Vue-Toastification__toast--success {
  border-left: 3px solid #4caf50 !important;
}

/* Error toast */
.custom-toast.Vue-Toastification__toast--error {
  border-left: 3px solid #ef5350 !important;
}

/* Warning toast */
.custom-toast.Vue-Toastification__toast--warning {
  border-left: 3px solid #ff9800 !important;
}

/* Info toast */
.custom-toast.Vue-Toastification__toast--info {
  border-left: 3px solid #2196f3 !important;
}

/* Toast icon styling */
.custom-toast .Vue-Toastification__icon {
  width: 20px !important;
  margin-right: 12px !important;
}

/* Toast body text */
.custom-toast .Vue-Toastification__toast-body {
  padding: 0 !important;
  font-weight: 500 !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

/* Fade transition - smoother */
.Vue-Toastification__fade-enter-active,
.Vue-Toastification__fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease !important;
}

.Vue-Toastification__fade-enter-from {
  opacity: 0 !important;
  transform: translateY(20px) !important;
}

.Vue-Toastification__fade-leave-to {
  opacity: 0 !important;
  transform: translateY(-10px) !important;
}
</style>
