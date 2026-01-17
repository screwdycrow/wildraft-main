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
    :hide-header="hideHeader"
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
            class="note-title-field"
            density="comfortable"
          />

          <tip-tap-editor
            v-model="formData.data.content"
            placeholder="Start writing your note..."
            min-height="500px"
            :library-id="libraryId"
            :library-item-id="item?.id || null"
            :user-file-ids="formData.userFileIds"
            :user-files="item?.userFiles || []"
            @update:user-file-ids="formData.userFileIds = $event"
            class="note-editor"
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
            class="note-title-field"
            placeholder="Chapter title"
          />

          <tip-tap-editor
            v-model="chapter.content"
            placeholder="Start writing this chapter..."
            min-height="500px"
            :library-id="libraryId"
            :library-item-id="item?.id || null"
            :user-file-ids="formData.userFileIds"
            :user-files="item?.userFiles || []"
            @update:user-file-ids="formData.userFileIds = $event"
            class="note-editor"
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
      
      <div class="sidebar-section">
        <h3 class="text-subtitle-1 font-weight-bold mb-2 d-flex align-center">
          <v-icon icon="mdi-paperclip" size="small" class="mr-2" />
          Quick Upload
        </h3>
        <p class="text-caption text-grey-lighten-1 mb-3">
          Drop files to attach to this note.
        </p>
        <drag-drop-upload
          compact
          @uploaded="handleFileUploaded"
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
import DragDropUpload from '@/components/files/DragDropUpload.vue'
import type { UserFile } from '@/api/files'

interface Props {
  item?: LibraryItem | null
  libraryId: number
  itemType: ItemType
  initialTagIds?: number[]
  hideHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideHeader: false,
})

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
  tagIds: props.initialTagIds ? [...props.initialTagIds] : [],
  userFileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

// Watch for initialTagIds changes (for when dialog opens with preselected tags)
watch(() => props.initialTagIds, (newTagIds) => {
  // Only set initialTagIds in create mode (when item is null)
  if (!props.item) {
    if (newTagIds && newTagIds.length > 0) {
      // Update tagIds with initialTagIds
      const sortedNew = [...newTagIds].sort()
      const sortedCurrent = [...formData.value.tagIds].sort()
      if (JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew)) {
        formData.value.tagIds = [...newTagIds]
      }
    } else if (!newTagIds || newTagIds.length === 0) {
      // Clear tagIds if initialTagIds is empty/undefined
      if (formData.value.tagIds.length > 0) {
        formData.value.tagIds = []
      }
    }
  }
}, { immediate: true })

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

function handleJsonImport(importData: CreateLibraryItemPayload, options?: { importDescription?: boolean }) {
  // Only import name, description (if option enabled), and data
  // Do NOT change tags or attachments
  formData.value.name = importData.name
  
  if (options?.importDescription !== false) {
    formData.value.description = importData.description || ''
  }

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

  // Do NOT import tags or attachments - they stay as-is
  // formData.value.tagIds, userFileIds, featuredImageId remain unchanged

  console.log('[NoteForm] JSON import applied:', formData.value)
}

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

function handleFileUploaded(file: UserFile) {
  if (!formData.value.userFileIds.includes(file.id)) {
    formData.value.userFileIds.push(file.id)
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
      // Don't clear tagIds if initialTagIds are provided (for preselected tags)
      if (!props.initialTagIds || props.initialTagIds.length === 0) {
      formData.value.tagIds = []
      }
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
  min-height: 600px;
}

/* Title field styling */
.note-title-field {
  margin-bottom: 32px;
  transition: all 0.2s ease;
}

.note-title-field :deep(.v-field) {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: all 0.2s ease;
}

.note-title-field :deep(.v-field__input) {
  padding: 16px 20px;
  min-height: 64px;
  transition: all 0.2s ease;
}

.note-title-field :deep(.v-field--focused) {
  transform: translateY(-1px);
}

/* Editor wrapper styling */
.note-editor {
  margin-top: 8px;
}

.note-editor :deep(.editor-content) {
  padding: 32px 40px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.note-editor :deep(.editor-content:hover) {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.note-editor :deep(.tiptap-content:focus-within) {
  outline: none;
}

.note-editor :deep(.editor-content:has(.tiptap-content:focus-within)) {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(148, 197, 255, 0.2);
  box-shadow: 0 0 0 3px rgba(148, 197, 255, 0.1);
}

.note-editor :deep(.tiptap-content) {
  font-size: 1.125rem;
  line-height: 1.85;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 400;
  max-width: 800px;
  margin: 0 auto;
}

.note-editor :deep(.tiptap-content p) {
  margin: 0.75em 0;
  padding: 0;
}

.note-editor :deep(.tiptap-content h1) {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.5em 0 0.75em 0;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.95);
}

.note-editor :deep(.tiptap-content h2) {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.25em 0 0.6em 0;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
}

.note-editor :deep(.tiptap-content h3) {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 1em 0 0.5em 0;
  color: rgba(255, 255, 255, 0.93);
}

.note-editor :deep(.tiptap-content ul),
.note-editor :deep(.tiptap-content ol) {
  padding-left: 2em;
  margin: 0.75em 0;
  line-height: 1.85;
}

.note-editor :deep(.tiptap-content li) {
  margin: 0.4em 0;
  padding-left: 0.5em;
}

.note-editor :deep(.tiptap-content blockquote) {
  border-left: 4px solid rgba(148, 197, 255, 0.5);
  padding-left: 1.5em;
  margin: 1.25em 0;
  font-style: italic;
  opacity: 0.9;
  font-size: 1.1em;
  line-height: 1.8;
  background: rgba(255, 255, 255, 0.02);
  padding: 1em 1.5em;
  border-radius: 0 8px 8px 0;
}

.note-editor :deep(.tiptap-content hr) {
  border: none;
  border-top: 2px solid rgba(255, 255, 255, 0.15);
  margin: 2em 0;
}

.note-editor :deep(.tiptap-content .is-empty::before) {
  color: rgba(255, 255, 255, 0.25);
  font-size: 1.125rem;
  font-style: italic;
}

@media (max-width: 1280px) {
  .chapters-scroll {
    max-height: calc(60vh - 120px);
  }
  
  .note-editor :deep(.editor-content) {
    padding: 24px 28px;
  }
  
  .note-editor :deep(.tiptap-content) {
    font-size: 1.05rem;
    max-width: 100%;
  }
}
</style>

