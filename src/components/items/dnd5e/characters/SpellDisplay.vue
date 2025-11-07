<template>
  <v-card class="spell-card mb-3" elevation="0" variant="outlined">
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-2">
        <div>
          <h4 class="text-subtitle-1 font-weight-bold">{{ spell.name }}</h4>
          <div class="d-flex gap-1 mt-1">
            <v-chip v-if="spell.school" size="x-small" variant="outlined">
              {{ spell.school }}
            </v-chip>
            <v-chip v-if="spell.concentration" size="x-small" color="warning" variant="flat">
              <v-icon icon="mdi-brain" size="x-small" class="mr-1" />
              Concentration
            </v-chip>
            <v-chip v-if="spell.ritual" size="x-small" color="purple" variant="flat">
              Ritual
            </v-chip>
          </div>
        </div>
      </div>
      
      <div class="spell-details mb-2">
        <div v-if="spell.castingTime" class="detail-item">
          <v-icon icon="mdi-clock-outline" size="x-small" class="mr-1" />
          <span class="text-caption">{{ spell.castingTime }}</span>
        </div>
        <div v-if="spell.range" class="detail-item">
          <v-icon icon="mdi-arrow-expand-horizontal" size="x-small" class="mr-1" />
          <span class="text-caption">{{ spell.range }}</span>
        </div>
        <div v-if="spell.components" class="detail-item">
          <v-icon icon="mdi-layers-triple" size="x-small" class="mr-1" />
          <span class="text-caption">{{ spell.components }}</span>
        </div>
        <div v-if="spell.duration" class="detail-item">
          <v-icon icon="mdi-timer-outline" size="x-small" class="mr-1" />
          <span class="text-caption">{{ spell.duration }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Spell } from '@/types/item.DND_5E.types'

defineProps<{
  spell: Spell
}>()
</script>

<style scoped>
.spell-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.spell-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  color: #9E9E9E;
}
</style>

