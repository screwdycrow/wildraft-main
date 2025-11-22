<template>
  <v-card class="glass-card" :class="{ 'compact': compact }" elevation="0" hover @click="$emit('click', item)">
    <v-card-title class="d-flex align-center pb-2">
      <v-icon icon="mdi-file" color="grey" class="mr-2" />
      <span class="text-truncate">{{ item.name }}</span>
    </v-card-title>
    
    <v-card-text v-if="!compact">
      <p v-if="item.description" class="text-body-2 text-grey-lighten-1">
        {{ item.description }}
      </p>
      <v-chip size="small" variant="tonal">
        {{ item.type }}
      </v-chip>
    </v-card-text>
    
    <v-card-actions v-if="showActions">
      <v-spacer />
      <v-btn icon="mdi-pencil" size="small" variant="text" @click.stop="$emit('edit', item)" />
      <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click.stop="$emit('delete', item)" />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { LibraryItem } from '@/types/item.types'

interface Props {
  item: LibraryItem
  showActions?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  showActions: true,
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()
</script>

<style scoped>
/* Compact Mode */
.glass-card.compact .v-card-title {
  font-size: 0.875rem !important;
  padding: 8px !important;
  padding-bottom: 4px !important;
}

.glass-card.compact .v-card-title .v-icon {
  font-size: 0.875rem !important;
}
</style>






