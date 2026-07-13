<template>
  <item-form-layout
    :title="isEditMode ? 'Edit Mindmap' : 'Create Mindmap'"
    icon="mdi-sitemap-outline"
    icon-color="#8E44AD"
    :is-loading="isLoading"
    :save-button-text="isEditMode ? 'Save Changes' : 'Create Mindmap'"
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
    ref="layoutRef"
  >
    <template #content>
      <v-text-field
        v-model="formData.name"
        label="Mindmap title"
        :rules="[(v) => !!v || 'Title is required']"
        variant="outlined"
        required
        density="comfortable"
        class="mb-4"
      />

      <v-textarea
        v-model="formData.description"
        label="Short description (optional)"
        placeholder="What is this mind map about?"
        variant="outlined"
        rows="3"
        auto-grow
      />

      <v-alert
        type="info"
        variant="tonal"
        density="comfortable"
        class="mt-4"
        icon="mdi-sitemap-outline"
      >
        {{ isEditMode
          ? 'Open the mindmap to add notes, references and connections on the canvas.'
          : 'After creating, you\'ll land on the canvas where you can add notes, references and connect them.' }}
      </v-alert>
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
  MindmapData,
  ItemType,
} from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'

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

const emptyMindmap = (): MindmapData => ({ nodes: [], edges: [], version: '1' })

const formData = ref<{
  name: string
  description: string
  data: MindmapData
  tagIds: number[]
  userFileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: emptyMindmap(),
  tagIds: props.initialTagIds ? [...props.initialTagIds] : [],
  userFileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      // Edit mode - preserve the existing canvas data untouched
      formData.value.name = newItem.name
      formData.value.description = newItem.description || ''
      const incoming = (newItem.data || {}) as MindmapData
      formData.value.data = {
        ...incoming,
        nodes: incoming.nodes || [],
        edges: incoming.edges || [],
        version: incoming.version || '1',
      }
      formData.value.tagIds = newItem.tags?.map((t) => t.id) || []

      if (newItem.userFiles && newItem.userFiles.length > 0) {
        filesStore.addFiles(newItem.userFiles as any)
        formData.value.userFileIds = newItem.userFiles.map((f) => f.id)
      } else {
        formData.value.userFileIds = []
      }

      if (newItem.featuredImage) {
        filesStore.addFiles(newItem.featuredImage as any)
        formData.value.featuredImageId = newItem.featuredImage.id
      } else {
        formData.value.featuredImageId = null
      }
    } else {
      // Create mode
      formData.value.name = ''
      formData.value.description = ''
      formData.value.data = emptyMindmap()
      formData.value.tagIds = props.initialTagIds ? [...props.initialTagIds] : []
      formData.value.userFileIds = []
      formData.value.featuredImageId = null
    }
  },
  { immediate: true }
)

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

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
    ...(isEditMode.value ? {} : { type: 'MINDMAP' as const }),
  }

  emit('submit', payload, (_success: boolean) => {
    isLoading.value = false
  })
}
</script>
