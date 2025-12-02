<template>
  <v-card 
    class="glass-card quick-action-card" 
    elevation="0" 
    hover
    @click="$emit('click')"
  >
    <v-card-text class="text-center pa-6 d-flex flex-column align-center justify-center" style="min-height: 160px;">
      <div class="icon-wrapper mb-4">
        <v-icon :icon="icon" :size="iconSize" :color="iconColor" class="action-icon" />
      </div>
      <h3 class="text-h6 font-weight-bold mb-2">{{ title }}</h3>
      <p class="text-body-2 text-grey-lighten-1 mb-0" style="opacity: 0.8;">{{ description }}</p>
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  background: rgba(var(--v-theme-surface), 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}

.quick-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.05) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-action-card:hover::before {
  opacity: 1;
}

.quick-action-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  border-color: rgba(var(--v-theme-primary), 0.3);
  background: rgba(var(--v-theme-surface), 0.3) !important;
}

.icon-wrapper {
  position: relative;
  padding: 16px;
  border-radius: 50%;
  background: rgba(var(--v-theme-surface), 0.3);
  transition: all 0.3s ease;
}

.quick-action-card:hover .icon-wrapper {
  background: rgba(var(--v-theme-primary), 0.15);
  transform: scale(1.1);
}

.action-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-action-card:hover .action-icon {
  transform: scale(1.15) rotate(5deg);
}
</style>

