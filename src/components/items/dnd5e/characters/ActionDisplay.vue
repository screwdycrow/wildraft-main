<template>
  <v-card class="action-card mb-3" elevation="0" variant="outlined">
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-2 action-header">
        <div class="d-flex align-center gap-2">
          <h4 class="text-subtitle-1 font-weight-bold mb-0">{{ action.name }}</h4>
          <v-chip v-if="action.range" size="small" variant="outlined">
            {{ action.range }}
          </v-chip>
        </div>
        <v-chip v-if="action.roll" size="small" color="primary" variant="flat">
          <v-icon icon="mdi-dice-d20" size="small" class="mr-1" />
          {{ action.roll }}
        </v-chip>
      </div>
      
      <p class="text-body-2 text-grey-lighten-1">
        {{ action.description }}
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Action } from '@/types/item.DND_5E.types'

defineProps<{
  action: Action
}>()
</script>

<style scoped>
.action-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.action-header {
  gap: 12px;
}
</style>

