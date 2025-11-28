<template>
  <v-card
    class="character-card"
    :class="{ 'compact': compact }"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image Background -->
    <div class="card-background" :style="backgroundStyle"></div>
    
    <!-- Content -->
    <div class="card-content">
      <v-card-title class="card-title pb-1" :style="{ color: textColor, opacity: 0.95 }">
        <span class="text-h6 font-weight-bold">{{ item.name }}</span>
      </v-card-title>

      <v-card-subtitle v-if="!compact" class="pb-3" :style="{ color: textColor, opacity: 0.9 }">
        {{ characterData.race }} {{ characterData.class }}
        <span v-if="characterData.subclass">({{ characterData.subclass }})</span>
        (Level {{ characterData.level || 1 }})
      </v-card-subtitle>

      <!-- Actions (if any) -->
      <div v-if="characterData.actions && characterData.actions.length > 0" class="features-list">
        <action-chip
          v-for="(action, index) in characterData.actions"
          :key="index"
          :action="action"
          size="small"
          text-color="#FFFFFF"
          class="action-chip-opacity"
        />
      </div>

      <!-- Tags (Absolute Positioned) -->
      <div v-if="item.tags && item.tags.length > 0" class="tags-absolute">
        <v-chip
          v-for="tag in item.tags"
          :key="tag.id"
          :color="tag.color"
          size="x-small"
          class="tag-chip"
        >
          {{ tag.name }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, CharacterData } from '@/types/item.types'
import ActionChip from '../common/ActionChip.vue'
import { getFileDownloadUrl } from '@/config/api'

interface Props {
  item: LibraryItem
  showActions?: boolean
  textColor?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  textColor: '#FFFFFF', // White by default, can be customized later
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const characterData = computed<CharacterData>(() => props.item.data as CharacterData)

// Get featured image URL directly from the file object
const backgroundStyle = computed(() => {
  if (props.item.featuredImage?.downloadUrl) {
    const imageUrl = getFileDownloadUrl(props.item.featuredImage)
    return {
      backgroundImage: `url(${imageUrl})`,
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.3), rgba(155, 89, 182, 0.3))',
  }
})
</script>

<style scoped>
.character-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-card-background), 0.8) !important;
  border-radius: 16px !important;
  border: none !important;
}

.character-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.character-card:hover .card-background {
  opacity: 0.4;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 16px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.card-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.features-list {
  display: grid;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  padding-right: 2px;
}

.features-list::-webkit-scrollbar {
  width: 1px;
}

.features-list::-webkit-scrollbar-track {
  background: transparent;
}

.features-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.features-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-chip-opacity {
  opacity: 0.9;
  flex-shrink: 0;
}

.tags-absolute {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  z-index: 2;
}

.tag-chip {
  font-size: 0.6rem !important;
  height: 16px !important;
  padding: 0 4px !important;
}

/* Compact Mode */
.character-card.compact .card-content {
  padding: 8px;
}

.character-card.compact .card-title {
  font-size: 0.875rem !important;
  padding-bottom: 4px !important;
  line-height: 1.2 !important;
}

.character-card.compact .card-title .text-h6 {
  font-size: 0.875rem !important;
}

.character-card.compact .features-list {
  max-height: 60px;
  gap: 2px;
}

.character-card.compact .tag-chip {
  font-size: 0.5rem !important;
  height: 12px !important;
  padding: 0 3px !important;
}
</style>
