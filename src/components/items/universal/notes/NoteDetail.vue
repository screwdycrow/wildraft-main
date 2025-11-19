<template>
  <div class="note-detail" :style="backgroundImageStyle">
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-note-text" size="32" class="mr-3" color="#95A5A6" />
        <div>
          <div class="text-h5 font-weight-bold">{{ item.name }}</div>
        </div>
        <v-spacer />
        <v-btn  variant="text" @click="$emit('edit')"> 
          <v-icon size="small" class="mr-1">mdi-pencil</v-icon>
          <span class="btn-text-mobile">Edit</span>
        </v-btn>
      </v-card-title>
    </v-card>

    <v-row no-gutters class="">
      <!-- Sections -->
      <v-col class="glass-card" cols="12" md="2">
        <div class="mb-4">
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
          class=""
          :file-ids="fileIds"
          :featured-image-id="item.featuredImage?.id"
          :columns="2"
          :read-only="true"
        />
      </v-col>

      <!-- Content -->
      <v-col class="glass-card" cols="12" md="10">
        <div>
          <v-card-text class="pa-6">
            <div class="note-body">
              <h1 class="text-h3 font-weight-bold mb-4">
                {{ activeSectionTitle }}
              </h1>
              <article
                v-if="activeSection === 'main'"
                v-html="renderedMainContent"
                class="prose"
              />
              <article
                v-else
                v-html="activeChapterContent"
                class="prose"
              />
            </div>
          </v-card-text>
        </div>
      
      </v-col>

      <!--  -->

    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LibraryItem, NoteData, NoteChapter } from '@/types/item.types'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'
import { useFilesStore } from '@/stores/files'
import { resolveImageUrlsInHtml } from '@/utils/imageResolver'

interface Props {
  item: LibraryItem
  initialChapterId?: string
}

const props = defineProps<Props>()
const emit = defineEmits(['edit'])

const filesStore = useFilesStore()

const noteData = computed<NoteData>(() => props.item.data as NoteData)

// Initialize activeSection - if initialChapterId is provided, we'll set it in the watch
const activeSection = ref<'main' | string>(props.initialChapterId || 'main')
const featuredImageUrl = ref<string>('')

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
  position: relative;
  min-height: 100vh;
}

.note-detail::before {
  content: '';
  position: fixed;
  top: 50px;
  left: 0;
  width: 50vw;
  height: calc(50vw * 4 / 3);
  max-height: calc(100vh - 50px);
  background-image: var(--bg-image);
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
}

.note-detail > * {
  position: relative;
  z-index: 1;
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

.active-item {
  background: rgba(255, 255, 255, 0.08);
  border-left: 3px solid rgba(148, 197, 255, 0.7);
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

.note-body {
  line-height: 1.7;
  font-size: 1rem;
  padding-left: 64px;
  padding-top: 16px;
  padding-bottom: 16px;
  padding-right: 64px;
color: rgb(var(--v-theme-on-surface),0.78);
  
}

.note-body .empty {
  font-style: italic;
  opacity: 0.6;
}

.prose :deep(h1),
.prose :deep(h2),
.prose :deep(h3) {
  margin-top: 1.5rem;
  font-weight: 600;
}

.prose :deep(p) {
  margin: 0 0 1rem 0;
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
}
</style>
