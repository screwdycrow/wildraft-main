<template>
  <v-card
    class="magic-item-card glass-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <v-card-title class="d-flex align-center pb-2">
      <v-icon icon="mdi-treasure-chest" color="#F39C12" class="mr-2" />
      <span class="text-truncate">{{ item.name }}</span>
      <v-spacer />
      <v-chip size="small" :color="getRarityColor(itemData.rarity)">
        {{ itemData.rarity }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle v-if="itemData.itemType">
      {{ itemData.itemType }}
      <span v-if="itemData.attunement"> (Requires Attunement)</span>
    </v-card-subtitle>

    <v-card-text>
      <!-- Properties -->
      <div v-if="itemData.value || itemData.weight" class="d-flex gap-3 mb-3">
        <div v-if="itemData.value" class="text-caption">
          <v-icon icon="mdi-gold" size="small" class="mr-1" />
          {{ itemData.value }}
        </div>
        <div v-if="itemData.weight" class="text-caption">
          <v-icon icon="mdi-weight" size="small" class="mr-1" />
          {{ itemData.weight }} lb
        </div>
      </div>

      <!-- Damage -->
      <div v-if="itemData.damage" class="mb-2">
        <v-chip size="small" variant="tonal" color="error">
          <v-icon icon="mdi-sword" size="small" class="mr-1" />
          {{ itemData.damage }}
        </v-chip>
      </div>

      <!-- Description -->
      <p v-if="item.description" class="text-body-2 text-grey-lighten-1 text-truncate-2 mb-3">
        {{ item.description }}
      </p>

      <!-- Properties -->
      <div v-if="itemData.properties && itemData.properties.length > 0" class="mb-2">
        <v-chip
          v-for="(prop, index) in itemData.properties.slice(0, 3)"
          :key="index"
          size="x-small"
          variant="outlined"
          class="mr-1"
        >
          {{ prop }}
        </v-chip>
        <v-chip
          v-if="itemData.properties.length > 3"
          size="x-small"
          variant="tonal"
        >
          +{{ itemData.properties.length - 3 }}
        </v-chip>
      </div>

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

    <v-card-actions v-if="showActions">
      <v-spacer />
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        @click.stop="$emit('edit', item)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="text"
        color="error"
        @click.stop="$emit('delete', item)"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, ItemData } from '@/types/item.types'

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

const itemData = computed<ItemData>(() => props.item.data as ItemData)

const getRarityColor = (rarity: string) => {
  const colors: Record<string, string> = {
    common: 'grey',
    uncommon: 'green',
    rare: 'blue',
    'very rare': 'purple',
    legendary: 'orange',
    artifact: 'red',
  }
  return colors[rarity] || 'grey'
}
</script>

<style scoped>
.magic-item-card {
  transition: transform 0.2s ease-in-out;
}

.magic-item-card:hover {
  transform: translateY(-4px);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

