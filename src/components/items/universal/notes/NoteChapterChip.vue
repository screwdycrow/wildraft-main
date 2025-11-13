<template>
  <v-chip
    :size="size"
    :variant="variant"
    :class="chipClass"
    :style="textColor ? { color: textColor } : undefined"
  >
    <v-icon 
      icon="mdi-book-open-page-variant" 
      :size="iconSize" 
      color="primary"
      start
    />
    {{ chapter.title }}
    <v-tooltip v-if="showTooltip" activator="parent" location="top" max-width="400">
      <div class="chapter-tooltip">
        <div class="chapter-tooltip-header">
          <strong>{{ chapter.title }}</strong>
        </div>
        <div v-if="chapterContentPreview" class="chapter-tooltip-content">
          <div v-html="chapterContentPreview" />
        </div>
      </div>
    </v-tooltip>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NoteChapter } from '@/types/item.types'

interface Props {
  chapter: NoteChapter
  size?: 'x-small' | 'small' | 'default'
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated'
  showTooltip?: boolean
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  variant: 'tonal',
  showTooltip: true,
  textColor: undefined,
})

const iconSize = computed(() => {
  if (props.size === 'x-small') return 'x-small'
  if (props.size === 'small') return 'small'
  return 'default'
})

const chipClass = computed(() => {
  return props.showTooltip ? 'chapter-chip' : ''
})

// Get first 500 words of chapter content
const chapterContentPreview = computed(() => {
  if (!props.chapter.content) return null
  
  // Strip HTML tags and get plain text
  const plainText = props.chapter.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  
  // Split into words and take first 500
  const words = plainText.split(' ')
  const previewWords = words.slice(0, 500)
  const preview = previewWords.join(' ')
  
  // If we truncated, add ellipsis
  return words.length > 500 ? preview + '...' : preview
})
</script>

<style scoped>
.chapter-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chapter-chip:hover {
  transform: scale(1.05);
  opacity: 1 !important;
}

/* Apply text color to chip content when textColor prop is provided */
.chapter-chip :deep(.v-chip__content) {
  color: inherit;
}

.chapter-tooltip {
  padding: 4px;
  color: rgb(var(--v-theme-on-surface));
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.chapter-tooltip-header {
  margin-bottom: 8px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.875rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.chapter-tooltip-content {
  font-size: 0.75rem;
  opacity: 0.9;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.5;
  max-height: 250px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.chapter-tooltip-content::-webkit-scrollbar {
  width: 4px;
}

.chapter-tooltip-content::-webkit-scrollbar-track {
  background: transparent;
}

.chapter-tooltip-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
}

.chapter-tooltip-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

