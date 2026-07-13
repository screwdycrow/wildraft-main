<template>
  <v-card
    class="mindmap-card"
    :class="{ 'compact': compact }"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image / Gradient Background -->
    <div class="card-background" :style="backgroundStyle"></div>

    <div class="card-content">
      <div class="card-content-inner">
        <v-card-title class="card-title d-flex align-center pb-2" :style="{ color: textColor, opacity: 0.95 }">
          <v-icon icon="mdi-sitemap-outline" size="small" class="mr-2" :style="{ color: textColor, opacity: 0.95 }" />
          <span class="text-truncate font-weight-bold">{{ item.name }}</span>
        </v-card-title>

        <v-card-text class="flex-grow-1">
          <div
            v-if="item.description"
            class="description-text mb-3"
            :style="{ color: textColor, opacity: 0.9 }"
          >
            {{ item.description }}
          </div>

          <div class="stats-row" :style="{ color: textColor }">
            <span class="stat-chip">
              <v-icon icon="mdi-card-text-outline" size="12" class="mr-1" />
              {{ nodeCount }} {{ nodeCount === 1 ? 'node' : 'nodes' }}
            </span>
            <span class="stat-chip">
              <v-icon icon="mdi-vector-line" size="12" class="mr-1" />
              {{ edgeCount }} {{ edgeCount === 1 ? 'link' : 'links' }}
            </span>
          </div>
        </v-card-text>
      </div>

      <!-- Tags -->
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
import type { LibraryItem, MindmapData } from '@/types/item.types'
import { getFileDownloadUrl } from '@/config/api'

interface Props {
  item: LibraryItem
  showActions?: boolean
  textColor?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  textColor: '#FFFFFF',
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const mindmapData = computed<MindmapData>(() => (props.item.data || {}) as MindmapData)
const nodeCount = computed(() => mindmapData.value.nodes?.length || 0)
const edgeCount = computed(() => mindmapData.value.edges?.length || 0)

const backgroundStyle = computed(() => {
  if (props.item.featuredImage?.downloadUrl) {
    const imageUrl = getFileDownloadUrl(props.item.featuredImage)
    return { backgroundImage: `url(${imageUrl})` }
  }
  return {
    background: 'linear-gradient(135deg, rgba(142, 68, 173, 0.35), rgba(93, 45, 120, 0.35))',
  }
})
</script>

<style scoped>
.mindmap-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-card-background)) !important;
  border-radius: 16px !important;
  border: none !important;
}

.mindmap-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.mindmap-card:hover .card-background {
  opacity: 0.5;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 8px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.card-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.description-text {
  font-size: 0.75rem;
  line-height: 1.6;
  font-weight: 400;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stats-row {
  display: flex;
  gap: 10px;
  opacity: 0.9;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
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

.mindmap-card.compact .card-content {
  padding: 4px;
  min-height: auto;
}

.mindmap-card.compact .card-title {
  font-size: 0.875rem !important;
  padding-bottom: 4px !important;
}
</style>
