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
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
    @add-tag="showTagDialog = true"
    ref="layoutRef"
  >
    <template #content>
      <!-- Title and Pin -->
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6">Note Details</h3>
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
        class="mb-4"
      />
      
      <v-divider class="my-6" />

      <!-- Main Content -->
      <h3 class="text-h6 mb-2">Content</h3>
      <p class="text-caption text-grey-lighten-1 mb-4">
        Write the main content of your note.
      </p>
      <tip-tap-editor
        v-model="formData.data.content"
        placeholder="Start writing your note..."
        min-height="400px"
        :library-id="libraryId"
        :library-item-id="item?.id || null"
        :user-file-ids="formData.userFileIds"
        :user-files="item?.userFiles || []"
        @update:user-file-ids="formData.userFileIds = $event"
      />

      <v-divider class="my-6" />

      <!-- Description/Summary -->
      <h3 class="text-h6 mb-2">Description (Optional)</h3>
      <p class="text-caption text-grey-lighten-1 mb-4">
        Add a brief summary or description for preview purposes.
      </p>
      <v-textarea
        v-model="formData.description"
        placeholder="Write a brief summary..."
        variant="outlined"
        rows="4"
      />
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
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, NoteData } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
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

const filesStore = useFilesStore()

const layoutRef = ref<InstanceType<typeof ItemFormLayout>>()
const isLoading = ref(false)
const showTagDialog = ref(false)

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
  },
  tagIds: [],
  userFileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

function handleTagCreated(tagId: number) {
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
    
    if (newItem.userFiles && newItem.userFiles.length > 0) {
      filesStore.addFiles(newItem.userFiles)
      formData.value.userFileIds = newItem.userFiles.map(f => f.id)
    } else {
      formData.value.userFileIds = []
    }
    
    if (newItem.featuredImage) {
      filesStore.addFiles(newItem.featuredImage)
      formData.value.featuredImageId = newItem.featuredImage.id
    } else {
      formData.value.featuredImageId = null
    }
  }
}, { immediate: true })

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await layoutRef.value!.formRef!.validate()
  if (!valid) return

  isLoading.value = true

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: formData.value.data,
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
/* Form-specific styles can go here */
</style>


