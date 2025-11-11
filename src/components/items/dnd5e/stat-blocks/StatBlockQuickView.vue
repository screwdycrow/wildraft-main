<template>
  <v-card class="stat-block-quick-view glass-card" elevation="0">
    <!-- Same as StatBlockCard but optimized for quick preview -->
    <v-card-title class="d-flex align-center pb-2">
      <v-icon icon="mdi-sword-cross" color="#E74C3C" class="mr-2" />
      <span class="text-truncate">{{ item.name }}</span>
      <v-spacer />
      <v-chip size="small" color="#E74C3C">
        CR {{ statBlockData.cr || '?' }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle v-if="statBlockData.size || statBlockData.type">
      {{ statBlockData.size }} {{ statBlockData.type }}
      <span v-if="statBlockData.alignment">, {{ statBlockData.alignment }}</span>
    </v-card-subtitle>

    <v-card-text>
      <!-- Stats Row -->
      <div class="d-flex justify-space-around mb-3">
        <div class="text-center">
          <v-icon icon="mdi-shield" size="small" color="primary" />
          <div class="text-caption text-grey">AC</div>
          <div class="font-weight-bold">{{ statBlockData.ac || '?' }}</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <v-icon icon="mdi-heart" size="small" color="error" />
          <div class="text-caption text-grey">HP</div>
          <div class="font-weight-bold">{{ statBlockData.hp || '?' }}</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <v-icon icon="mdi-run" size="small" color="success" />
          <div class="text-caption text-grey">Speed</div>
          <div class="font-weight-bold text-caption">{{ statBlockData.speed || '?' }}</div>
        </div>
      </div>

      <!-- Description -->
      <p v-if="item.description" class="text-body-2 text-grey-lighten-1 mb-3">
        {{ item.description }}
      </p>

      <!-- Quick Actions Count -->
      <div class="d-flex gap-2">
        <v-chip v-if="statBlockData.actions?.length" size="small" variant="tonal">
          {{ statBlockData.actions.length }} Actions
        </v-chip>
        <v-chip v-if="statBlockData.traits?.length" size="small" variant="tonal">
          {{ statBlockData.traits.length }} Traits
        </v-chip>
        <v-chip v-if="statBlockData.legendaryActions?.length" size="small" variant="tonal" color="warning">
          {{ statBlockData.legendaryActions.length }} Legendary
        </v-chip>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        variant="text"
        prepend-icon="mdi-open-in-new"
        @click="$emit('view-full')"
      >
        View Full Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, StatBlockData } from '@/types/item.types'

interface Props {
  item: LibraryItem
}

const props = defineProps<Props>()

defineEmits<{
  'view-full': []
}>()

const statBlockData = computed<StatBlockData>(() => props.item.data as StatBlockData)
</script>

<style scoped>
.stat-block-quick-view {
  max-width: 500px;
}
</style>



