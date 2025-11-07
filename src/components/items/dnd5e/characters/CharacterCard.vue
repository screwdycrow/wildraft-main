<template>
  <v-card
    class="character-card glass-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <v-card-title class="d-flex align-center pb-2">
      <v-icon icon="mdi-account-multiple" color="#3498DB" class="mr-2" />
      <span class="text-truncate">{{ item.name }}</span>
      <v-spacer />
      <v-chip size="small" color="#3498DB">
        Lvl {{ characterData.level || 1 }}
      </v-chip>
    </v-card-title>

    <v-card-subtitle v-if="characterData.class || characterData.race">
      {{ characterData.race }} {{ characterData.class }}
      <span v-if="characterData.subclass">({{ characterData.subclass }})</span>
    </v-card-subtitle>

    <v-card-text>
      <!-- Stats Row -->
      <div class="d-flex justify-space-around mb-3">
        <div class="text-center">
          <v-icon icon="mdi-shield" size="small" color="primary" />
          <div class="text-caption text-grey">AC</div>
          <div class="font-weight-bold">{{ characterData.ac || '?' }}</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <v-icon icon="mdi-heart" size="small" color="error" />
          <div class="text-caption text-grey">HP</div>
          <div class="font-weight-bold">{{ characterData.hp || '?' }}/{{ characterData.maxHp || '?' }}</div>
        </div>
        <v-divider vertical />
        <div class="text-center">
          <v-icon icon="mdi-run" size="small" color="success" />
          <div class="text-caption text-grey">Speed</div>
          <div class="font-weight-bold text-caption">{{ characterData.speed || '?' }}</div>
        </div>
      </div>

      <!-- Player Name -->
      <p v-if="characterData.playerName" class="text-caption text-grey-lighten-1 mb-2">
        <v-icon icon="mdi-account" size="small" class="mr-1" />
        Player: {{ characterData.playerName }}
      </p>

      <!-- Description -->
      <p v-if="item.description" class="text-body-2 text-grey-lighten-1 text-truncate-2 mb-3">
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
import type { LibraryItem, CharacterData } from '@/types/item.types'

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

const characterData = computed<CharacterData>(() => props.item.data as CharacterData)
</script>

<style scoped>
.character-card {
  transition: transform 0.2s ease-in-out;
}

.character-card:hover {
  transform: translateY(-4px);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

