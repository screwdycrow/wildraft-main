<template>
  <item-form-layout
    :title="isEditMode ? 'Edit Note' : 'Create Note'"
    icon="mdi-note-text"
    icon-color="#95A5A6"
    :is-loading="isLoading"
    :save-button-text="isEditMode ? 'Save Changes' : 'Create Note'"
    :library-id="libraryId"
    :file-ids="formData.userFileIds"
    @update:file-ids="formData.userFileIds = $event"
    :featured-image-id="formData.featuredImageId"
    @update:featured-image-id="formData.featuredImageId = $event"
    :tag-ids="formData.tagIds"
    @update:tag-ids="formData.tagIds = $event"
    :item-type="itemType"
    :item="item"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
    @add-tag="showTagDialog = true"
    @json-import="handleJsonImport"
    ref="layoutRef"
  >
    <template #tabs>
      <div class="note-tabs-container">
        <div class="chapters-scroll">
          <v-list density="compact" nav class="chapter-list">
            <v-list-item
              rounded="lg"
              class="chapter-item"
              :class="{ 'chapter-active': activeTab === 'main' }"
              @click="activeTab = 'main'"
            >
              <v-list-item-title>
                {{ formData.name.trim() || 'Main' }}
              </v-list-item-title>
            </v-list-item>
            <template
              v-for="(chapter, index) in formData.data.chapters || []"
              :key="resolveChapterId(chapter, index)"
            >
              <v-list-item
                rounded="lg"
                class="chapter-item"
                :class="{
                  'chapter-active': activeTab === resolveChapterId(chapter, index),
                  'chapter-drag-over': dragOverIndex === index
                }"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragover.prevent="onDragOver(index)"
                @dragleave="onDragLeave(index)"
                @drop="onDrop(index)"
                @dragend="onDragEnd"
                @click="activeTab = resolveChapterId(chapter, index)"
              >
           
                <v-list-item-title>
                  <v-icon icon="mdi-drag" size="16" class="drag-handle mr-2" />
                  {{ chapter.title || `Chapter ${index + 1}` }}
                </v-list-item-title>
                <template #append>
                  <v-btn
                    icon="mdi-close"
                    size="x-small"
                    variant="text"
                    class="remove-chapter-btn"
                    @click.stop="removeChapter(index)"
                  />
                </template>
              </v-list-item>
            </template>
          </v-list>
          <div
            v-if="(formData.data.chapters?.length || 0) > 0"
            class="chapter-drop-zone"
            :class="{ 'chapter-drop-zone--active': dropZoneActive }"
            @dragover.prevent="onDragOverEnd"
            @dragleave="onDragLeaveEnd"
            @drop="onDropEnd"
          >
            Drop here to move to end
          </div>
        </div>
        <div class="add-chapter-wrapper">
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-plus"
            class="add-chapter-btn"
            @click="addChapter"
          >
            Add chapter
          </v-btn>
        </div>
      </div>
    </template>

    <template #content>
      <v-window v-model="activeTab" class="note-window">
        <!-- Main Tab -->
        <v-window-item value="main">
  

          <v-text-field
            v-model="formData.name"
            label="Title"
            :rules="[(v) => !!v || 'Title is required']"
            variant="outlined"
            required
            class=""
          />

          <tip-tap-editor
            v-model="formData.data.content"
            placeholder="Start writing your note..."
            min-height="400px"
          />
        </v-window-item>

        <!-- Chapter Tabs -->
        <v-window-item
          v-for="(chapter, index) in formData.data.chapters || []"
          :key="resolveChapterId(chapter, index)"
          :value="resolveChapterId(chapter, index)"
        >
  
          <v-text-field
            v-model="chapter.title"
            variant="outlined"
            density="comfortable"
            class=""
            placeholder="Chapter title"
          />

          <tip-tap-editor
            v-model="chapter.content"
            placeholder="Start writing this chapter..."
            min-height="400px"
          />
        </v-window-item>
      </v-window>
    </template>

    <template #sidebar>
      <div class="sidebar-section">
        <h3 class="text-subtitle-1 font-weight-bold mb-2 d-flex align-center">
          <v-icon icon="mdi-text-short" size="small" class="mr-2" />
          Short Description
        </h3>
        <p class="text-caption text-grey-lighten-1 mb-3">
          Add a snippet shown on cards and previews.
        </p>
        <v-textarea
          v-model="formData.description"
          placeholder="Write a brief summary..."
          variant="underlined"
          rows="4"
        />
      </div>
    </template>
  </item-form-layout>

  <!-- Tag Creation Dialog -->
  <tag-creation-dialog
    v-model="showTagDialog"
    :library-id="libraryId"
    @created="handleTagCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type {
  LibraryItem,
  CreateLibraryItemPayload,
  UpdateLibraryItemPayload,
  NoteData,
  NoteChapter,
  ItemType,
} from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'

interface Props {
  item?: LibraryItem | null
  libraryId: number
  itemType: ItemType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

const filesStore = useFilesStore()

const layoutRef = ref<InstanceType<typeof ItemFormLayout>>()
const isLoading = ref(false)
const showTagDialog = ref(false)
const activeTab = ref<'main' | string>('main')

const formData = ref<{
  name: string
  description: string
  data: NoteData
  tagIds: number[]
  userFileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    content: '',
    isPinned: false,
    chapters: [],
  },
  tagIds: [],
  userFileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const dropZoneActive = ref(false)

const activeChapterIndex = computed(() => {
  if (activeTab.value === 'main') return -1
  const chapters = formData.value.data.chapters || []
  return chapters.findIndex((chapter) => chapter.id === activeTab.value)
})

function generateChapterId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `chapter-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function resolveChapterId(chapter: NoteChapter, index: number): string {
  return chapter.id || `chapter-${index + 1}`
}

watch(
  () => formData.value.data.chapters?.length ?? 0,
  (length) => {
    if (length === 0) {
      activeTab.value = 'main'
    } else if (activeChapterIndex.value === -1 && activeTab.value !== 'main') {
      activeTab.value = 'main'
    }
  }
)

function addChapter() {
  if (!formData.value.data.chapters) {
    formData.value.data.chapters = []
  }
  const nextOrder = formData.value.data.chapters.length + 1
  const newChapter = {
    id: generateChapterId(),
    order: nextOrder,
    title: `Chapter ${nextOrder}`,
    content: '',
  }

  formData.value.data.chapters.push(newChapter)
  activeTab.value = newChapter.id!
}

function handleJsonImport(importData: CreateLibraryItemPayload) {
  // Fill the form with imported data
  formData.value.name = importData.name
  formData.value.description = importData.description || ''

  // Handle data - could be wrapped in data property or direct
  const itemData = importData.data || importData
  if (typeof itemData === 'object' && itemData !== null) {
    // Fill note-specific data
    const incomingChapters = (itemData.chapters || [])
      .slice()
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((chapter: any, index: number) => ({
        id: chapter.id || generateChapterId(),
        order: index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        content: chapter.content || '',
      }))

    formData.value.data = {
      content: itemData.content || '',
      isPinned: itemData.isPinned ?? false,
      chapters: incomingChapters,
    }
  }

  // Handle attachments
  formData.value.tagIds = importData.tagIds || []
  formData.value.userFileIds = importData.userFileIds || []
  formData.value.featuredImageId = importData.featuredImageId || null

  console.log('[NoteForm] JSON import applied:', formData.value)
}

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

function normalizeChapterOrders() {
  if (!formData.value.data.chapters) return
  formData.value.data.chapters.forEach((chapter, index) => {
    chapter.order = index + 1
  })
}

function removeChapter(index: number) {
  const chapters = formData.value.data.chapters || []
  if (index < 0 || index >= chapters.length) return

  const removedChapter = chapters[index]
  chapters.splice(index, 1)
  normalizeChapterOrders()

  if (activeTab.value === removedChapter.id) {
    activeTab.value = 'main'
  }
}

function moveChapter(from: number, to: number) {
  const chapters = formData.value.data.chapters || []
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= chapters.length ||
    to > chapters.length
  ) {
    return
  }

  const [moved] = chapters.splice(from, 1)
  const targetIndex = Math.min(to, chapters.length)
  chapters.splice(targetIndex, 0, moved)
  normalizeChapterOrders()
}

function onDragStart(index: number) {
  draggingIndex.value = index
  dragOverIndex.value = index
}

function onDragOver(index: number) {
  if (draggingIndex.value === null || draggingIndex.value === index) return
  dragOverIndex.value = index
}

function onDragLeave(index: number) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

function onDrop(index: number) {
  if (draggingIndex.value === null) return
  moveChapter(draggingIndex.value, index)
  onDragEnd()
}

function onDragOverEnd() {
  if (draggingIndex.value !== null) {
    dropZoneActive.value = true
  }
}

function onDragLeaveEnd() {
  dropZoneActive.value = false
}

function onDropEnd() {
  if (draggingIndex.value === null) return
  const chapters = formData.value.data.chapters || []
  moveChapter(draggingIndex.value, chapters.length)
  onDragEnd()
}

function onDragEnd() {
  draggingIndex.value = null
  dragOverIndex.value = null
  dropZoneActive.value = false
}

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      formData.value.name = newItem.name
      formData.value.description = newItem.description || ''
      const incomingData = (newItem.data || {}) as NoteData
      const incomingChapters = (incomingData.chapters || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((chapter, index) => ({
          id: chapter.id || generateChapterId(),
          order: index + 1,
          title: chapter.title || `Chapter ${index + 1}`,
          content: chapter.content || '',
        }))

      formData.value.data = {
        ...incomingData,
        content: incomingData.content || '',
        isPinned: incomingData.isPinned ?? false,
        chapters: incomingChapters,
      }
      formData.value.tagIds = newItem.tags?.map((t) => t.id) || []

      if (newItem.userFiles && newItem.userFiles.length > 0) {
        filesStore.addFiles(newItem.userFiles)
        formData.value.userFileIds = newItem.userFiles.map((f) => f.id)
      } else {
        formData.value.userFileIds = []
      }

      if (newItem.featuredImage) {
        filesStore.addFiles(newItem.featuredImage)
        formData.value.featuredImageId = newItem.featuredImage.id
      } else {
        formData.value.featuredImageId = null
      }

      activeTab.value = 'main'
    } else {
      formData.value.name = ''
      formData.value.description = ''
      formData.value.data = {
        content: '',
        isPinned: false,
        chapters: [],
      }
      formData.value.tagIds = []
      formData.value.userFileIds = []
      formData.value.featuredImageId = null
      activeTab.value = 'main'
    }

    draggingIndex.value = null
    dragOverIndex.value = null
    dropZoneActive.value = false
  },
  { immediate: true }
)

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await layoutRef.value!.formRef!.validate()
  if (!valid) return

  isLoading.value = true

  normalizeChapterOrders()

  const cleanChapters = formData.value.data.chapters?.map((chapter) => ({
    order: chapter.order,
    title: chapter.title,
    content: chapter.content,
  }))

  const cleanData: NoteData = {
    ...formData.value.data,
    chapters: cleanChapters && cleanChapters.length > 0 ? cleanChapters : undefined,
  }

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: cleanData,
    tagIds: formData.value.tagIds,
    userFileIds: formData.value.userFileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'NOTE' as const }),
  }

  console.log('Note Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (_success: boolean) => {
    isLoading.value = false
  })
}
</script>

<style scoped>
.note-tabs-container {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  height: 100%;
  background-color: transparent;
}

.chapters-scroll {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 260px);
  overflow-y: auto;
  padding-right: 2px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background-color: transparent;
}

.chapter-item {
  transition: background 0.2s ease, border-color 0.2s ease;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
}

.chapter-item :deep(.v-list-item__prepend) {
  margin-right: 6px;
}

.chapter-item :deep(.v-list-item--density-compact) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.chapter-item :deep(.v-list-item-title) {
  font-size: 0.85rem;
}

.chapter-active {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.16);
}

.chapter-drag-over {
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
}

.drag-handle {
  opacity: 0.35;
  cursor: grab;
}

.chapter-item:hover .drag-handle {
  opacity: 0.7;
}

.remove-chapter-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chapter-item:hover .remove-chapter-btn {
  opacity: 0.8;
}

.chapter-drop-zone {
  margin-top: 6px;
  padding: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
  background: transparent;
}

.chapter-drop-zone--active,
.chapter-drop-zone:hover {
  border-color: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
}

.add-chapter-wrapper {
  padding-top: 8px;
}

.add-chapter-btn {
  text-transform: none;
  opacity: 0.7;
  letter-spacing: 0;
}

.add-chapter-btn:hover {
  opacity: 1;
}

.sidebar-section {
  margin-bottom: 24px;
}

.note-window {
  min-height: 540px;
}

@media (max-width: 1280px) {
  .chapters-scroll {
    max-height: calc(60vh - 120px);
  }
}
</style>

