<template>
  <div class="note-detail" :style="backgroundImageStyle">
    <v-row no-gutters class="note-detail-row">
      <!-- Sections -->
      <v-col class="note-sidebar" cols="12" md="2">
        <div class="sidebar-content-wrapper">
          <div class="sidebar-nav-section">
            <v-card-text class="pa-0">
              <v-list nav density="compact">
                <v-list-item
                  class="glass-card-item"
                  rounded="lg"
                  :class="{ 'active-item': activeSection === 'main' }"
                  @click="setActiveSection('main')"
                >
                  <v-list-item-title>{{ item.name || 'Main' }}</v-list-item-title>
                </v-list-item>
                <v-divider class="my-2" />
                <v-list-subheader v-if="orderedChapters.length">Chapters</v-list-subheader>
                <v-list-item
                  v-for="chapter in orderedChapters"
                  :key="chapter.id"
                  rounded="lg"
                  :class="{ 'active-item': activeSection === chapter.id }"
                  @click="setActiveSection(chapter.id!)"
                >
                  <v-list-item-title>
                    {{ chapter.title || `Chapter ${chapter.order}` }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </div>
     
          <attached-files-grid
            v-if="fileIds.length"
            class="attached-files-grid"
            :file-ids="fileIds"
            :featured-image-id="item.featuredImage?.id"
            :columns="2"
            :read-only="true"
          />
        </div>
      </v-col>

      <!-- Content -->
      <v-col class="note-content-col" cols="12" md="7">
        <div class="note-content-wrapper">
          <v-card-text class="pa-6">
            <div class="note-body">
              <div class="section-header d-flex align-center mb-4">
                <h1 class="text-h3 font-weight-bold">
                  {{ activeSectionTitle }}
                </h1>
                <v-btn 
                  variant="text" 
                  size="small"
                  class="ml-3"
                  @click="handleEdit"
                > 
                  <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
                  <span>Edit</span>
                </v-btn>
              </div>
              <article
                v-if="activeSection === 'main'"
                v-html="renderedMainContent"
                class="prose"
                ref="contentRef"
              />
              <article
                v-else
                v-html="activeChapterContent"
                class="prose"
                ref="contentRef"
              />
            </div>
          </v-card-text>
        </div>
      </v-col>

      <!-- Content Outline -->
      <v-col class="note-outline-col" cols="12" md="3">
        <div class="outline-wrapper">
          <div class="outline-header">
            <v-icon icon="mdi-format-list-text" size="small" class="mr-2" />
            <span class="text-caption font-weight-medium">Contents</span>
          </div>
          <nav class="outline-nav">
            <ul class="outline-list">
              <li
                v-for="heading in contentOutline"
                :key="heading.id"
                :class="['outline-item', `outline-level-${heading.level}`]"
              >
                <a
                  :href="`#${heading.id}`"
                  @click.prevent="scrollToHeading(heading.id)"
                  class="outline-link"
                >
                  {{ heading.text }}
                </a>
              </li>
            </ul>
            <div v-if="contentOutline.length === 0" class="outline-empty">
              <span class="text-caption text-grey-lighten-1">No headings found</span>
            </div>
          </nav>
        </div>
      </v-col>

    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import type { LibraryItem, NoteData, NoteChapter } from '@/types/item.types'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'
import { useFilesStore } from '@/stores/files'
import { resolveImageUrlsInHtml } from '@/utils/imageResolver'

interface Props {
  item: LibraryItem
  initialChapterId?: string
}

interface Heading {
  id: string
  text: string
  level: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'edit', item: LibraryItem): void
}>()

const filesStore = useFilesStore()

const noteData = computed<NoteData>(() => props.item.data as NoteData)

// Initialize activeSection - if initialChapterId is provided, we'll set it in the watch
const activeSection = ref<'main' | string>(props.initialChapterId || 'main')
const featuredImageUrl = ref<string>('')
const contentRef = ref<HTMLElement | null>(null)
const contentOutline = ref<Heading[]>([])

// Log when component receives initialChapterId
watch(() => props.initialChapterId, (chapterId) => {
  console.log('[NoteDetail] Received initialChapterId prop:', chapterId)
}, { immediate: true })

// Background image style
const backgroundImageStyle = computed(() => {
  if (!featuredImageUrl.value) return {}
  return {
    '--bg-image': `url(${featuredImageUrl.value})`,
  }
})

// Load featured image URL
watch(
  () => props.item.featuredImage?.id,
  async (imageId) => {
    if (imageId) {
      try {
        featuredImageUrl.value = await filesStore.getDownloadUrl(imageId)
      } catch (error) {
        console.error('Failed to load featured image:', error)
        featuredImageUrl.value = ''
      }
    } else {
      featuredImageUrl.value = ''
    }
  },
  { immediate: true }
)

const orderedChapters = computed<NoteChapter[]>(() => {
  return (noteData.value.chapters || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((chapter, index) => ({
      ...chapter,
      id: chapter.id || `chapter-${chapter.order ?? index + 1}`,
      order: chapter.order ?? index + 1,
    }))
})

// Watch for initial chapter ID and set active section
watch([() => props.initialChapterId, orderedChapters], ([chapterId, chapters]) => {
  if (chapterId && chapters.length > 0) {
    console.log('[NoteDetail] Setting active section for chapterId:', chapterId)
    console.log('[NoteDetail] Available chapters:', chapters.map(ch => ({ id: ch.id, order: ch.order, title: ch.title })))
    
    // Check if the chapter exists in ordered chapters
    // Try to match by ID first, then by order if ID doesn't match
    const chapter = chapters.find(ch => ch.id === chapterId) || 
                    chapters.find((ch, idx) => {
                      const generatedId = `chapter-${ch.order ?? idx + 1}`
                      return generatedId === chapterId
                    })
    
    console.log('[NoteDetail] Found chapter:', chapter)
    
    if (chapter && chapter.id) {
      console.log('[NoteDetail] Setting activeSection to:', chapter.id)
      activeSection.value = chapter.id
    } else {
      console.warn('[NoteDetail] Chapter not found for ID:', chapterId)
    }
  }
}, { immediate: true })

const activeChapter = computed(() =>
  orderedChapters.value.find(chapter => chapter.id === activeSection.value)
)

const activeSectionTitle = computed(() => {
  if (activeSection.value === 'main') return props.item.name
  return activeChapter.value?.title || `Chapter ${activeChapter.value?.order}`
})


const renderedMainContent = computed(() => {
  if (!noteData.value.content) {
    return '<p class="empty">Nothing here yet.</p>'
  }
  // Resolve image URLs from userFiles
  if (props.item.userFiles?.length) {
    return resolveImageUrlsInHtml(noteData.value.content, props.item.userFiles)
  }
  return noteData.value.content
})

const activeChapterContent = computed(() => {
  if (!activeChapter.value?.content) {
    return '<p class="empty">This chapter has no content yet.</p>'
  }
  // Resolve image URLs from userFiles
  if (props.item.userFiles?.length) {
    return resolveImageUrlsInHtml(activeChapter.value.content, props.item.userFiles)
  }
  return activeChapter.value.content
})

// Extract headings from content for outline
function extractHeadings(html: string): Heading[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings: Heading[] = []
  
  // Find all h1, h2, h3 elements
  const headingElements = doc.querySelectorAll('h1, h2, h3')
  
  headingElements.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1))
    const text = heading.textContent?.trim() || ''
    
    if (text) {
      // Generate ID if not present
      let id = heading.id
      if (!id) {
        id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        heading.id = id
      }
      
      headings.push({ id, text, level })
    }
  })
  
  return headings
}

// Update outline when content changes
watch([renderedMainContent, activeChapterContent, activeSection], async () => {
  await nextTick()
  const html = activeSection.value === 'main' 
    ? renderedMainContent.value 
    : activeChapterContent.value
  
  // Extract headings from HTML string
  contentOutline.value = extractHeadings(html)
  
  // Add IDs to headings in the DOM after render
  await nextTick()
  if (contentRef.value) {
    const headings = contentRef.value.querySelectorAll('h1, h2, h3')
    headings.forEach((heading, index) => {
      if (!heading.id) {
        const text = heading.textContent?.trim() || ''
        const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        heading.id = id
        // Update outline with correct ID
        if (contentOutline.value[index]) {
          contentOutline.value[index].id = id
        }
      }
    })
  }
}, { immediate: true })

function scrollToHeading(id: string) {
  const element = contentRef.value?.querySelector(`#${id}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const fileIds = computed(() => {
  if (!props.item.userFiles?.length) return []
  filesStore.addFiles(props.item.userFiles)
  return props.item.userFiles.map(file => file.id)
})

function setActiveSection(sectionId: 'main' | string) {
  activeSection.value = sectionId
  if (
    sectionId !== 'main' &&
    !orderedChapters.value.some(chapter => chapter.id === sectionId)
  ) {
    activeSection.value = 'main'
  }
}

function handleEdit() {
  emit('edit', props.item)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.note-detail {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: visible;
}

.note-sidebar {
  background: transparent;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: calc(100vh - 40px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 16px;
}

/* Sidebar content wrapper */
.sidebar-content-wrapper {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  gap: 16px;
  height: 100%;
  flex: 1;
}

/* Scrollbar styling for sidebar */
.note-sidebar::-webkit-scrollbar {
  width: 6px;
}

.note-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.note-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.note-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Firefox scrollbar */
.note-sidebar {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

/* Sidebar nav section */
.sidebar-nav-section {
  flex: 0 0 auto;
}

/* Attachment grid styling */
.attached-files-grid {
  padding: 12px 0;
  margin-top: auto;
  flex: 0 0 auto;
}

/* Fix attachment grid to be 2x2 */
.attached-files-grid :deep(.v-row) {
  margin: 0 !important;
  gap: 8px !important;
  display: grid !important;
  grid-template-columns: repeat(2, 1fr) !important;
}

.attached-files-grid :deep(.v-col) {
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 auto !important;
}

.attached-files-grid :deep(.v-card),
.attached-files-grid :deep(.media-card) {
  margin: 0 !important;
  width: 100% !important;
}

/* Note content wrapper */
.note-content-col {
  display: flex;
  flex-direction: column;
}

.note-content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.note-content-wrapper .v-card-text {
  width: 100%;
}


.note-detail::before {
  content: '';
  position: fixed;
  top: 50px;
  left: 0;
  width: 50vw;
  height: calc(50vw * 4 / 3);
  max-height: 600px;
  max-width: 100vw;
  background-image: var(--bg-image);
  filter: blur(2px);
  background-size: cover;
  background-position: left center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
  mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%);
  -webkit-mask-composite: source-in;
  clip-path: inset(0);
}

.note-detail > * {
  position: relative;
  z-index: 1;
}

.note-detail-row {
  flex: 1;
  display: flex;
  align-items: flex-start;
}

.detail-grid {
  gap: 16px;
}

.nav-column .section-nav {
  height: 100%;
}

.section-nav :deep(.v-list-item) {
  cursor: pointer;
  transition: background 0.2s ease;
}

/* Make all list items transparent */
:deep(.v-list),
:deep(.v-list-item),
:deep(.glass-card-item),
:deep(.v-list-subheader) {
  background: transparent !important;
}

:deep(.v-list-item:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}

.active-item {
  background: rgba(255, 255, 255, 0.08) !important;
  border-left: 3px solid rgba(148, 197, 255, 0.7);
}

.active-item:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

.content-card {
  min-height: 420px;
}

.content-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.section-header {
  gap: 8px;
}

.section-header h1 {
  margin: 0;
  flex: 1;
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  font-family: 'Crimson Text', 'Georgia', 'Times New Roman', serif;
}

.note-body {
  line-height: 1.9;
  font-size: 1.125rem;
  padding-left: 48px;
  padding-top: 32px;
  padding-bottom: 48px;
  padding-right: 48px;
  color: rgba(255, 255, 255, 0.88);
  letter-spacing: 0.01em;
  font-weight: 400;
  max-width: 100%;
  margin: 0;
  transition: all 0.3s ease;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-family: 'Crimson Text', 'Georgia', 'Times New Roman', serif;
}

.note-body .empty {
  font-style: italic;
  opacity: 0.6;
}

.prose :deep(h1) {
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.75em 0 0.75em 0;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.95);
  font-family: 'Crimson Text', 'Georgia', 'Times New Roman', serif;
  scroll-margin-top: 20px;
}

.prose :deep(h2) {
  font-size: 2.125rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.5em 0 0.6em 0;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
  font-family: 'Crimson Text', 'Georgia', 'Times New Roman', serif;
  scroll-margin-top: 20px;
}

.prose :deep(h3) {
  font-size: 1.625rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 1.25em 0 0.5em 0;
  color: rgba(255, 255, 255, 0.93);
  font-family: 'Crimson Text', 'Georgia', 'Times New Roman', serif;
  scroll-margin-top: 20px;
}

.prose :deep(p) {
  margin: 0.85em 0;
  padding: 0;
  line-height: 1.9;
}

.prose :deep(ul),
.prose :deep(ol) {
  padding-left: 2em;
  margin: 1em 0;
  line-height: 1.9;
}

.prose :deep(li) {
  margin: 0.5em 0;
  padding-left: 0.5em;
}

.prose :deep(blockquote) {
  border-left: 4px solid rgba(148, 197, 255, 0.5);
  padding-left: 1.5em;
  margin: 1.5em 0;
  font-style: italic;
  opacity: 0.9;
  font-size: 1.1em;
  line-height: 1.85;
  background: rgba(255, 255, 255, 0.02);
  padding: 1.25em 1.75em;
  border-radius: 0 8px 8px 0;
}

.prose :deep(hr) {
  border: none;
  border-top: 2px solid rgba(255, 255, 255, 0.15);
  margin: 2.5em 0;
}

.prose :deep(a) {
  color: rgba(148, 197, 255, 0.9);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}

.prose :deep(a:hover) {
  color: rgba(148, 197, 255, 1);
}

/* Table Styles - Make sure tables are visible! */
.prose :deep(table),
.prose :deep(.editor-table) {
  border-collapse: collapse;
  margin: 1.5em 0;
  table-layout: fixed;
  width: 100%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: table !important;
  visibility: visible !important;
}

.prose :deep(table td),
.prose :deep(table th),
.prose :deep(.editor-table td),
.prose :deep(.editor-table th) {
  min-width: 1em;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding: 12px 16px !important;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  transition: background-color 0.2s ease;
  color: rgb(var(--v-theme-on-surface)) !important;
  display: table-cell !important;
  visibility: visible !important;
}

.prose :deep(table th),
.prose :deep(.editor-table th) {
  font-weight: 600 !important;
  text-align: left;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.2), rgba(var(--v-theme-primary), 0.1)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.4) !important;
}

.prose :deep(table td:hover),
.prose :deep(.editor-table td:hover) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

.prose :deep(table .selectedCell),
.prose :deep(.editor-table .selectedCell) {
  background-color: rgba(var(--v-theme-primary), 0.15) !important;
}

.prose :deep(table .selectedCell:after),
.prose :deep(.editor-table .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  border: 2px solid rgb(var(--v-theme-primary));
  pointer-events: none;
  border-radius: 2px;
}

.prose :deep(table .column-resize-handle),
.prose :deep(.editor-table .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: rgb(var(--v-theme-primary));
  cursor: col-resize;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.prose :deep(table:hover .column-resize-handle),
.prose :deep(.editor-table:hover .column-resize-handle) {
  opacity: 1;
}

.prose :deep(table tr:first-child th:first-child),
.prose :deep(.editor-table tr:first-child th:first-child) {
  border-top-left-radius: 8px;
}

.prose :deep(table tr:first-child th:last-child),
.prose :deep(.editor-table tr:first-child th:last-child) {
  border-top-right-radius: 8px;
}

.prose :deep(table tr:last-child td:first-child),
.prose :deep(.editor-table tr:last-child td:first-child) {
  border-bottom-left-radius: 8px;
}

.prose :deep(table tr:last-child td:last-child),
.prose :deep(.editor-table tr:last-child td:last-child) {
  border-bottom-right-radius: 8px;
}

/* Ensure table wrapper is visible */
.prose :deep(.tableWrapper) {
  margin: 1.5em 0;
  overflow-x: auto;
}

.prose :deep(.tableWrapper table) {
  margin: 0;
}

.detail-line {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.detail-label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.sidebar-column .glass-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Content Outline */
.note-outline-col {
  display: flex;
  flex-direction: column;
}

.outline-wrapper {
  position: sticky;
  top: 20px;
  align-self: flex-start;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 16px;
  padding-left: 24px;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.outline-wrapper:hover {
  opacity: 1;
}

/* Scrollbar styling for outline */
.outline-wrapper::-webkit-scrollbar {
  width: 4px;
}

.outline-wrapper::-webkit-scrollbar-track {
  background: transparent;
}

.outline-wrapper::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.outline-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.outline-wrapper {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.outline-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.7rem;
}

.outline-nav {
  flex: 1;
}

.outline-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.outline-item {
  margin-bottom: 4px;
}

.outline-level-1 {
  margin-left: 0;
  font-weight: 600;
}

.outline-level-2 {
  margin-left: 12px;
  font-weight: 500;
}

.outline-level-3 {
  margin-left: 24px;
  font-weight: 400;
  font-size: 0.9em;
}

.outline-link {
  display: block;
  padding: 4px 8px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-link:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.06);
  padding-left: 10px;
}

.outline-empty {
  padding: 8px;
  text-align: center;
  opacity: 0.5;
}

@media (max-width: 959px) {
  .nav-column {
    order: 2;
    margin-top: 16px;
  }

  .content-column {
    order: 1;
  }

  .sidebar-column {
    order: 3;
  }
  
  .note-body {
    padding-left: 24px;
    padding-right: 24px;
    padding-top: 24px;
    font-size: 1.05rem;
    line-height: 1.85;
  }
  
  .section-header h1 {
    font-size: 2rem;
  }
  
  .prose :deep(h1) {
    font-size: 2.25rem;
  }
  
  .prose :deep(h2) {
    font-size: 1.875rem;
  }
  
  .prose :deep(h3) {
    font-size: 1.5rem;
  }
  
  .note-outline-col {
    display: none;
  }
  
  .note-content-col {
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}
</style>
