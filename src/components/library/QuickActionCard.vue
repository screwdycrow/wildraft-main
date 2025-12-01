<template>
  <v-card 
    class="glass-card quick-action-card" 
    elevation="0" 
    hover
    @click="$emit('click')"
  >
    <v-card-text class="text-center pa-6">
      <v-icon :icon="icon" :size="iconSize" :color="iconColor" class="mb-3" />
      <h3 class="text-h6 font-weight-bold mb-2">{{ title }}</h3>
      <p class="text-caption text-grey-lighten-1 mb-0">{{ description }}</p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  title: string
  description: string
  iconColor?: string
  iconSize?: number | string
}>(), {
  iconColor: 'primary',
  iconSize: 64,
})

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.quick-action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.quick-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.quick-action-card:hover .v-icon {
  transform: scale(1.1);
  transition: transform 0.3s ease-in-out;
}
</style>

