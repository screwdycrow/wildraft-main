<template>
  <v-card
    class="note-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image Background -->
    <div class="card-background" :style="backgroundStyle"></div>
    
    <!-- Content -->
    <div class="card-content">
      <v-card-title class="card-title d-flex align-center pb-2" :style="{ color: textColor, opacity: 0.85 }">
        <v-icon icon="mdi-note-text" size="small" class="mr-2" :style="{ color: textColor, opacity: 0.85 }" />
        <span class="text-truncate font-weight-bold">{{ item.name }}</span>
        <v-spacer />
        <v-icon
          v-if="noteData.isPinned"
          icon="mdi-pin"
          size="small"
          :style="{ color: textColor, opacity: 0.85 }"
        />
      </v-card-title>

      <!-- Description -->
      <v-card-text class="flex-grow-1">
        <div
          v-if="item.description"
          class="description-wrapper mb-3"
          :style="{ color: textColor, opacity: 0.85 }"
        >
          <div class="description-text" v-html="item.description" />
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
import type { LibraryItem, NoteData } from '@/types/item.types'
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
const noteData = computed<NoteData>(() => props.item.data as NoteData)

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
    background: 'linear-gradient(135deg, rgba(149, 165, 166, 0.3), rgba(127, 140, 141, 0.3))',
  }
})

const getContentPreview = (content: string): string => {
  if (!content) return 'No content'
  // Strip markdown/HTML and truncate
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim()
  return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '')
}
</script>

<style scoped>
.note-card {
  position: relative;
  overflow: hidden;
  min-height: 200px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-card-background)) !important;
  border-radius: 16px !important;
  border: none !important;
}

.note-card:hover {
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
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.note-card:hover .card-background {
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

.description-wrapper {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
  opacity: 0.7;
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
  opacity:0.8;
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

.content-preview {
  line-height: 1.5;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
