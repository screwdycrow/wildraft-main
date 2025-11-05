<template>
  <router-view />
</template>

<script setup lang="ts">
// Main app component - routing handled by vue-router
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
