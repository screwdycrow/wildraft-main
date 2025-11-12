<template>
  <v-card
    class="magic-item-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image Background -->
    <div class="card-background" :style="backgroundStyle"></div>
    
    <!-- Content -->
    <div class="card-content">
      <v-card-title class="card-title d-flex align-center pb-2" :style="{ color: textColor, opacity: 0.95 }">
        <v-icon icon="mdi-treasure-chest" size="small" class="mr-2" :style="{ color: textColor, opacity: 0.95 }" />
        <span class="text-truncate font-weight-bold">{{ item.name }}</span>
      </v-card-title>

      <v-card-subtitle class="pb-3" :style="{ color: textColor, opacity: 0.9 }">
        <v-chip size="small" :color="getRarityColor(itemData.rarity)" class="mr-2">
          {{ itemData.rarity }}
        </v-chip>
        {{ itemData.itemType }}
        <span v-if="itemData.attunement" class="text-caption"> (Requires Attunement)</span>
      </v-card-subtitle>

      <v-card-text class="flex-grow-1">
        <!-- Properties Row -->
        <div v-if="itemData.value || itemData.weight || itemData.damage" class="properties-row mb-3" :style="{ opacity: 0.95 }">
          <div v-if="itemData.damage" class="property-item">
            <v-icon icon="mdi-sword" size="small" :style="{ color: textColor }" />
            <span :style="{ color: textColor }">{{ itemData.damage }}</span>
          </div>
          <div v-if="itemData.value" class="property-item">
            <v-icon icon="mdi-gold" size="small" :style="{ color: textColor }" />
            <span :style="{ color: textColor }">{{ itemData.value }}</span>
          </div>
          <div v-if="itemData.weight" class="property-item">
            <v-icon icon="mdi-weight" size="small" :style="{ color: textColor }" />
            <span :style="{ color: textColor }">{{ itemData.weight }} lb</span>
          </div>
        </div>

        <!-- Description or Effect -->
        <div
          v-if="item.description || itemData.effect"
          class="description-wrapper mb-3"
          :style="{ color: textColor, opacity: 0.95 }"
        >
          <div v-if="item.description" class="description-text" v-html="item.description" />
          <div v-else-if="itemData.effect" class="description-text" v-html="itemData.effect" />
        </div>

        <!-- Properties -->
        <div v-if="itemData.properties && itemData.properties.length > 0" class="properties-chips" :style="{ opacity: 0.95 }">
          <v-chip
            v-for="(prop, index) in itemData.properties.slice(0, 4)"
            :key="index"
            size="x-small"
            variant="tonal"
            class="mr-1 mb-1"
            :style="{ color: textColor }"
          >
            {{ prop }}
          </v-chip>
          <v-chip
            v-if="itemData.properties.length > 4"
            size="x-small"
            variant="tonal"
            :style="{ color: textColor }"
          >
            +{{ itemData.properties.length - 4 }}
          </v-chip>
        </div>
      </v-card-text>

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
import { computed, ref, watch } from 'vue'
import type { LibraryItem, ItemData } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'

interface Props {
  item: LibraryItem
  showActions?: boolean
  textColor?: string
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

const filesStore = useFilesStore()
const itemData = computed<ItemData>(() => props.item.data as ItemData)

// Load featured image URL
const featuredImageUrl = ref('')
watch(() => props.item.featuredImage, async (featuredImage) => {
  if (featuredImage) {
    try {
      featuredImageUrl.value = await filesStore.getDownloadUrl(featuredImage.id)
    } catch (error) {
      console.error('Failed to load featured image:', error)
    }
  } else {
    featuredImageUrl.value = ''
  }
}, { immediate: true })

const backgroundStyle = computed(() => {
  if (featuredImageUrl.value) {
    return {
      backgroundImage: `url(${featuredImageUrl.value})`,
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.3), rgba(230, 126, 34, 0.3))',
  }
})

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
  position: relative;
  overflow: hidden;
  min-height: 250px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-card-background), 0.8) !important;
  border-radius: 16px !important;
  border: none !important;
}

.magic-item-card:hover {
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
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.magic-item-card:hover .card-background {
  opacity: 0.4;
}

.card-content {
  position: relative;
  z-index: 1;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.card-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.properties-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.9;
}

.description-wrapper {
  max-height: 120px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  opacity: 0.9;
}

.description-wrapper::-webkit-scrollbar {
  width: 2px;
}

.description-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.description-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
}

.description-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.description-text {
  font-size: 0.75rem;
  line-height: 1.6;
  opacity:0.95;
  font-weight: 400;
}

.description-text :deep(p) {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
}

.description-text :deep(h1),
.description-text :deep(h2),
.description-text :deep(h3),
.description-text :deep(h4),
.description-text :deep(h5),
.description-text :deep(h6) {
  font-size: 0.8rem;
  margin: 0.5rem 0 0.25rem;
  font-weight: 600;
}

.description-text :deep(ul),
.description-text :deep(ol) {
  padding-left: 1.1rem;
  margin: 0 0 0.5rem;
}

.description-text :deep(li) {
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
}

.properties-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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
</style>
