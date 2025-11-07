<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-card class="glass-card mb-4 form-container" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center  form-actions-sticky px-6">
        <v-icon icon="mdi-note-text" color="#95A5A6" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Note' : 'Create Note' }}
        <v-spacer />
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('cancel')" />
        <v-btn icon="mdi-check" size="small" variant="text" @click="handleSubmit" :loading="isLoading" />
      </v-card-title>

      <v-row no-gutters class="form-row-content">
        <!-- Vertical Tabs -->
        <v-col cols="2" class="border-e">
          <v-tabs
            v-model="activeTab"
            direction="vertical"
            color="primary"
            class="note-tabs"
          >
            <v-tab value="content" prepend-icon="mdi-text-box">
              <span class="text-caption">Content</span>
            </v-tab>
            <v-tab value="description" prepend-icon="mdi-card-text">
              <span class="text-caption">Description</span>
            </v-tab>
            <v-tab value="files" prepend-icon="mdi-paperclip">
              <span class="text-caption">Files</span>
            </v-tab>
          </v-tabs>
          
          <v-divider class="my-4" />
          
          <!-- Tags Selector at bottom -->
          <div class="px-4">
            <tag-selector
              v-model="formData.tagIds"
              :library-id="libraryId"
              hint=""
              show-add-button
              @add-tag="showTagDialog = true"
            />
          </div>
        </v-col>

        <!-- Content Area -->
        <v-col cols="8"> 
      <v-card-text class="form-content-scrollable">
        <v-window v-model="activeTab">
          <!-- Content Tab -->
          <v-window-item value="content">
            <div class="d-flex justify-space-between align-center mb-3">
              <h3 class="text-h6">Note Content</h3>
              <v-switch
                v-model="formData.data.isPinned"
                label="Pin this note"
                color="warning"
                hide-details
                inset
                density="compact"
              />
            </div>
            
            <v-text-field
              v-model="formData.name"
              label="Title"
              :rules="[(v) => !!v || 'Title is required']"
              variant="outlined"
              required
              density="comfortable"
              class="mb-4"
            />
            
            <tip-tap-editor
              v-model="formData.data.content"
              placeholder="Start writing your note..."
              min-height="400px"
            />
          </v-window-item>

          <!-- Description Tab -->
          <v-window-item value="description">
            <h3 class="text-h6 mb-3">Short Description</h3>
            <p class="text-caption text-grey-lighten-1 mb-4">
              Add a brief summary or description of this note for preview purposes.
            </p>
            <tip-tap-editor
              v-model="formData.description"
              placeholder="Write a brief summary of this note..."
              min-height="300px"
            />
          </v-window-item>

          <!-- Files Tab -->
          <v-window-item value="files">
            <h3 class="text-h6 mb-3">Attached Files</h3>
            <p class="text-caption text-grey-lighten-1 mb-4">
              Upload related files, images, or documents to attach to this note.
            </p>
            <file-attachment-selector v-model="formData.fileIds" />
            
            <v-divider class="my-6" />
            
            <featured-image-selector
              v-model="formData.featuredImageId"
              :file-ids="formData.fileIds"
            />
          </v-window-item>
        </v-window>
      </v-card-text>
      </v-col>
      </v-row>
    </v-card>

    <!-- Tag Creation Dialog -->
    <tag-creation-dialog
      v-model="showTagDialog"
      :library-id="libraryId"
      @created="handleTagCreated"
    />
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, NoteData } from '@/types/item.types'
import TagSelector from '@/components/tags/TagSelector.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import FileAttachmentSelector from '@/components/items/common/FileAttachmentSelector.vue'
import FeaturedImageSelector from '@/components/items/common/FeaturedImageSelector.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'

interface Props {
  item?: LibraryItem | null
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)
const activeTab = ref('content')
const showTagDialog = ref(false)

const formData = ref<{
  name: string
  description: string
  data: NoteData
  tagIds: number[]
  fileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    content: '',
    isPinned: false,
  },
  tagIds: [],
  fileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

function handleTagCreated(tagId: number) {
  // Add the newly created tag to the selection
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { ...newItem.data } as NoteData
    formData.value.tagIds = newItem.tags?.map(t => t.id) || []
    formData.value.fileIds = newItem.userFiles?.map(f => f.id) || []
    formData.value.featuredImageId = newItem.featuredImageId || null
  }
}, { immediate: true })

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  // Validate that content exists
  if (!formData.value.data.content || formData.value.data.content.trim() === '' || formData.value.data.content === '<p></p>') {
    isLoading.value = false
    return
  }

  // Clean up data object - remove undefined values
  const cleanData: Record<string, any> = {
    content: formData.value.data.content,
  }
  
  if (formData.value.data.isPinned) {
    cleanData.isPinned = true
  }

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: cleanData,
    tagIds: formData.value.tagIds,
    fileIds: formData.value.fileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'NOTE' as const }),
  }

  console.log('Note Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (success: boolean) => {
    isLoading.value = false
    if (success) {
      // Form will be closed by parent
    }
  })
}
</script>

<style scoped>
.note-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}

.note-tabs :deep(.v-tab--selected) {
  background: rgba(255, 183, 77, 0.15);
  border-right: 3px solid #FFB74D;
}

.border-e {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.form-container {
  min-height: 60vh;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.form-row-content {
  flex: 1;
}

.form-content-scrollable {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 24px;
}

.form-actions-sticky {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}
</style>

