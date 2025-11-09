<template>
  <div class="note-detail">
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
import { computed, ref } from 'vue'
import type { LibraryItem, NoteData, NoteChapter } from '@/types/item.types'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'
import { useFilesStore } from '@/stores/files'

interface Props {
  item: LibraryItem
}

const props = defineProps<Props>()
const emit = defineEmits(['edit'])

const filesStore = useFilesStore()

const noteData = computed<NoteData>(() => props.item.data as NoteData)
const activeSection = ref<'main' | string>('main')

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
  return noteData.value.content
})

const activeChapterContent = computed(() => {
  if (!activeChapter.value?.content) {
    return '<p class="empty">This chapter has no content yet.</p>'
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
