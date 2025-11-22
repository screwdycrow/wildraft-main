<template>
  <v-card
    class="note-card"
    :class="{ 'compact': compact }"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image Background -->
    <div class="card-background" :style="backgroundStyle"></div>
    
    <!-- Content -->
    <div class="card-content">
      <div class="card-content-inner">
      <v-card-title class="card-title d-flex align-center pb-2" :style="{ color: textColor, opacity: 0.95 }">
        <v-icon icon="mdi-note-text" size="small" class="mr-2" :style="{ color: textColor, opacity: 0.95 }" />
        <span class="text-truncate font-weight-bold">{{ item.name }}</span>
        <v-spacer />
        <v-icon
          v-if="noteData.isPinned"
          icon="mdi-pin"
          size="small"
          :style="{ color: textColor, opacity: 0.95 }"
        />
      </v-card-title>

      <!-- Description or Content Preview -->
      <v-card-text class="flex-grow-1">
        <div
          v-if="displayContent"
          class="description-wrapper mb-3"
          :style="{ color: textColor, opacity: 0.95 }"
        >
          <div class="description-text" v-html="displayContent" />
        </div>
      </v-card-text>
      </div>

      <!-- Chapters List -->
      <div v-if="noteData.chapters && noteData.chapters.length > 0" class="chapters-list">
        <note-chapter-chip
          v-for="(chapter, index) in sortedChapters"
          :key="chapter.id || chapter.order"
          :chapter="chapter"
          :chapter-index="index"
          :item="item"
          :library-id="item.libraryId"
          size="small"
          text-color="#FFFFFF"
          :user-files="item.userFiles || []"
          class="chapter-chip-opacity"
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
import type { LibraryItem, NoteData, NoteChapter } from '@/types/item.types'
import { getFileDownloadUrl } from '@/config/api'
import NoteChapterChip from './NoteChapterChip.vue'
import { resolveImageUrlsInHtml } from '@/utils/imageResolver'

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

const noteData = computed<NoteData>(() => props.item.data as NoteData)

// Display content: use description if available, otherwise first 500 chars of content
const displayContent = computed(() => {
  let content: string | null = null
  
  if (props.item.description) {
    content = props.item.description
  } else if (noteData.value.content) {
    // Strip HTML tags for preview, then take first 500 characters
    const plainText = noteData.value.content.replace(/<[^>]*>/g, '').trim()
    content = plainText.substring(0, 500) + (plainText.length > 500 ? '...' : '')
  }
  
  // Resolve image URLs if we have content and userFiles
  if (content && props.item.userFiles?.length) {
    // For HTML content (description), resolve image URLs
    if (props.item.description && props.item.description.includes('<img')) {
      return resolveImageUrlsInHtml(content, props.item.userFiles)
    }
    // For plain text preview, no need to resolve
  }
  
  return content
})

// Sort chapters by order
const sortedChapters = computed(() => {
  if (!noteData.value.chapters) return []
  return [...noteData.value.chapters].sort((a: NoteChapter, b: NoteChapter) => 
    (a.order || 0) - (b.order || 0)
  )
})

// Get featured image URL directly from the file object
const backgroundStyle = computed(() => {
  if (props.item.featuredImage?.downloadUrl) {
    const imageUrl = getFileDownloadUrl(props.item.featuredImage)
    return {
      backgroundImage: `url(${imageUrl})`,
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(149, 165, 166, 0.3), rgba(127, 140, 141, 0.3))',
  }
})
</script>

<style scoped>
.note-card {
  position: relative;
  overflow: hidden;
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
  opacity: 0.5;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 8px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 200px;
}

.card-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.description-wrapper {
  max-height: 180px;
  overflow-y: auto;
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
  opacity:0.9 ;
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
  font-size: 0.75rem;
}

.content-preview {
  line-height: 1.5;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 100px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  padding: 4px;
}

.chapters-list::-webkit-scrollbar {
  width: 1px;
}

.chapters-list::-webkit-scrollbar-track {
  background: transparent;
}

.chapters-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.chapters-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.chapter-chip-opacity {
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
.note-card.compact .card-content {
  padding: 4px;
  min-height: auto;
}

.note-card.compact .card-title {
  font-size: 0.875rem !important;
  padding-bottom: 4px !important;
}

.note-card.compact .card-title .v-icon {
  font-size: 0.875rem !important;
}

.note-card.compact .description-wrapper {
  max-height: 80px;
  margin-bottom: 4px !important;
}

.note-card.compact .description-text {
  font-size: 0.65rem;
  line-height: 1.4;
}

.note-card.compact .description-text :deep(p) {
  font-size: 0.65rem;
  margin: 0 0 0.25rem;
}

.note-card.compact .description-text :deep(h1),
.note-card.compact .description-text :deep(h2),
.note-card.compact .description-text :deep(h3),
.note-card.compact .description-text :deep(h4),
.note-card.compact .description-text :deep(h5),
.note-card.compact .description-text :deep(h6) {
  font-size: 0.7rem;
  margin: 0.25rem 0 0.125rem;
}

.note-card.compact .chapters-list {
  max-height: 60px;
  padding: 2px;
  gap: 2px;
}

.note-card.compact .tag-chip {
  font-size: 0.5rem !important;
  height: 12px !important;
  padding: 0 3px !important;
}
</style>
