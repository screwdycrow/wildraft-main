<template>
  <v-btn
    variant="outlined"
    size="large"
    block
    @click="$emit('click')"
    class="google-btn"
  >
    <v-icon icon="mdi-google" class="mr-2" />
    Continue with Google
  </v-btn>
</template>

<script setup lang="ts">
defineEmits<{
  click: []
}>()
</script>

<style scoped>
.google-btn {
  border: 1px solid rgba(var(--glass-border-rgb), 0.2) !important;
  background: rgba(var(--glass-surface-rgb), 0.05) !important;
  backdrop-filter: blur(10px);
  color: rgb(var(--v-theme-on-surface)) !important;
}

.google-btn:hover {
  background: rgba(var(--glass-surface-rgb), 0.1) !important;
  border-color: rgba(var(--glass-border-rgb), 0.3) !important;
}
</style>







