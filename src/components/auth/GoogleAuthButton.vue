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
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.google-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}
</style>






