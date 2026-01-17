<template>
  <v-chip
    :size="size"
    :variant="variant"
    :class="chipClass"
    :style="textColor ? { color: textColor } : undefined"
    @click="handleClick"
  >
    <v-icon 
      icon="mdi-book-open-page-variant" 
      :size="iconSize" 
      color="primary"
      start
    />
    {{ chapter.title }}
    <v-tooltip 
      v-if="showTooltip" 
      activator="parent" 
      location="top" 
      max-width="400"
      :open-delay="300"
      :close-delay="300"
    >
      <div class="chapter-tooltip" @mouseenter="onTooltipEnter" @mouseleave="onTooltipLeave">
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
import { computed, ref } from 'vue'
import type { NoteChapter, LibraryItem } from '@/types/item.types'
import { resolveImageUrlsInHtml } from '@/utils/imageResolver'
import { useDialogsStore } from '@/stores/dialogs'

interface Props {
  chapter: NoteChapter
  chapterIndex?: number
  size?: 'x-small' | 'small' | 'default'
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated'
  showTooltip?: boolean
  textColor?: string
  userFiles?: Array<{ id: number; downloadUrl?: string; fileUrl?: string }>
  item?: LibraryItem
  libraryId?: number
}

const emit = defineEmits<{
  click: [chapter: NoteChapter]
}>()

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  variant: 'tonal',
  showTooltip: true,
  textColor: undefined,
  userFiles: () => [],
})

const dialogsStore = useDialogsStore()

const iconSize = computed(() => {
  if (props.size === 'x-small') return 'x-small'
  if (props.size === 'small') return 'small'
  return 'default'
})

const chipClass = computed(() => {
  return props.showTooltip ? 'chapter-chip' : ''
})

// Truncate HTML content to first 500 words while preserving HTML structure
function truncateHtmlContent(html: string, maxWords: number = 500): string {
  if (!html) return ''
  
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body
  
  // Count words and truncate
  let wordCount = 0
  let truncated = false
  
  function truncateNode(node: Node): boolean {
    if (truncated) return true
    
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text
      const text = textNode.textContent || ''
      const words = text.trim().split(/\s+/).filter(w => w.length > 0)
      
      if (wordCount + words.length > maxWords) {
        // Truncate this text node
        const remainingWords = maxWords - wordCount
        const truncatedWords = words.slice(0, remainingWords)
        // Create a new text node with truncated content
        const newTextNode = doc.createTextNode(truncatedWords.join(' ') + '...')
        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(newTextNode, textNode)
        }
        truncated = true
        return true
      }
      
      wordCount += words.length
      return false
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      // Create a copy of child nodes array to avoid modification during iteration
      const children = Array.from(element.childNodes)
      
      for (const child of children) {
        if (truncateNode(child)) {
          // Remove remaining siblings
          let nextSibling = child.nextSibling
          while (nextSibling) {
            const toRemove = nextSibling
            nextSibling = nextSibling.nextSibling
            element.removeChild(toRemove)
          }
          return true
        }
      }
    }
    
    return false
  }
  
  truncateNode(body)
  return body.innerHTML
}

// Get first 500 words of chapter content with HTML formatting preserved
const chapterContentPreview = computed(() => {
  if (!props.chapter.content) return null
  
  // Truncate HTML content to 500 words
  let truncated = truncateHtmlContent(props.chapter.content, 500)
  
  // Resolve image URLs if userFiles are provided
  if (props.userFiles?.length) {
    truncated = resolveImageUrlsInHtml(truncated, props.userFiles)
  }
  
  return truncated
})

// Keep tooltip open when hovering over it
const tooltipHovered = ref(false)

function onTooltipEnter() {
  tooltipHovered.value = true
}

function onTooltipLeave() {
  tooltipHovered.value = false
}

// Generate chapter ID the same way NoteDetail does
function getChapterId(chapter: NoteChapter, index: number): string {
  return chapter.id || `chapter-${chapter.order ?? index + 1}`
}

function handleClick(event: Event) {
  // Stop event propagation to prevent triggering parent card click
  event.stopPropagation()
  
  // If item and libraryId are provided, open the global item viewer dialog
  if (props.item && props.libraryId) {
    // Use provided index or calculate it
    const index = props.chapterIndex !== undefined 
      ? props.chapterIndex 
      : 0
    
    // Generate ID the same way NoteDetail does
    const chapterId = getChapterId(props.chapter, index)
    console.log('[NoteChapterChip] Opening dialog with chapterId:', chapterId, 'chapter:', props.chapter, 'index:', index)
    dialogsStore.openItemViewer(props.item, props.libraryId, chapterId)
  } else {
    // Otherwise, emit click event for parent to handle
    emit('click', props.chapter)
  }
}
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
  padding: 8px;
  color: rgb(var(--v-theme-on-surface));
  max-height: 300px;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
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
  padding-right: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  pointer-events: auto;
}

/* Preserve HTML formatting */
.chapter-tooltip-content :deep(p) {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
}

.chapter-tooltip-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* Headings - bold and slightly larger */
.chapter-tooltip-content :deep(h1),
.chapter-tooltip-content :deep(h2),
.chapter-tooltip-content :deep(h3),
.chapter-tooltip-content :deep(h4),
.chapter-tooltip-content :deep(h5),
.chapter-tooltip-content :deep(h6) {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0.75rem 0 0.5rem;
  line-height: 1.4;
}

.chapter-tooltip-content :deep(h1:first-child),
.chapter-tooltip-content :deep(h2:first-child),
.chapter-tooltip-content :deep(h3:first-child) {
  margin-top: 0;
}

/* Lists */
.chapter-tooltip-content :deep(ul),
.chapter-tooltip-content :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.5rem 0;
  list-style-position: outside;
}

.chapter-tooltip-content :deep(li) {
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.5;
}

/* Bold and italic */
.chapter-tooltip-content :deep(strong),
.chapter-tooltip-content :deep(b) {
  font-weight: 700;
}

.chapter-tooltip-content :deep(em),
.chapter-tooltip-content :deep(i) {
  font-style: italic;
}

/* Images */
.chapter-tooltip-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 0.5rem 0;
  border-radius: 4px;
}

/* Links */
.chapter-tooltip-content :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

/* Blockquotes */
.chapter-tooltip-content :deep(blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  font-style: italic;
  opacity: 0.9;
}

/* Code */
.chapter-tooltip-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.7rem;
}

.chapter-tooltip-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.chapter-tooltip-content :deep(pre code) {
  background: none;
  padding: 0;
}

.chapter-tooltip-content::-webkit-scrollbar {
  width: 6px;
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

/* Ensure tooltip overlay can be hovered */
:deep(.v-overlay__content) {
  pointer-events: auto !important;
}

/* Add a small gap bridge to help with hover */
:deep(.v-tooltip) {
  pointer-events: none;
}

:deep(.v-tooltip .v-overlay__content) {
  pointer-events: auto;
  margin-top: 4px; /* Small gap to help bridge hover */
}
</style>


