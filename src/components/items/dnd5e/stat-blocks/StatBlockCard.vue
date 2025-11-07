<template>
  <v-card
    class="stat-block-card glass-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
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
      <p v-if="item.description" class="text-body-2 text-grey-lighten-1 text-truncate-2">
        {{ item.description }}
      </p>

      <!-- Tags -->
      <div v-if="item.tags && item.tags.length > 0" class="mt-3">
        <v-chip
          v-for="tag in item.tags.slice(0, 3)"
          :key="tag.id"
          :color="tag.color"
          size="x-small"
          class="mr-1"
        >
          {{ tag.name }}
        </v-chip>
        <v-chip
          v-if="item.tags.length > 3"
          size="x-small"
          variant="tonal"
        >
          +{{ item.tags.length - 3 }}
        </v-chip>
      </div>

      <!-- File count -->
      <div v-if="item.userFiles && item.userFiles.length > 0" class="mt-2">
        <v-icon icon="mdi-paperclip" size="small" class="mr-1" />
        <span class="text-caption text-grey">{{ item.userFiles.length }} file(s)</span>
      </div>
    </v-card-text>


  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, StatBlockData } from '@/types/item.types'

interface Props {
  item: LibraryItem
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const statBlockData = computed<StatBlockData>(() => props.item.data as StatBlockData)
</script>

<style scoped>
.stat-block-card {
  transition: transform 0.2s ease-in-out;
}

.stat-block-card:hover {
  transform: translateY(-4px);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

