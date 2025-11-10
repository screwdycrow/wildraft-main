<template>
  <item-form-layout
    :title="isEditMode ? 'Edit Magic Item' : 'Create Magic Item'"
    icon="mdi-treasure-chest"
    icon-color="#F39C12"
    :is-loading="isLoading"
    :save-button-text="isEditMode ? 'Save Changes' : 'Create Item'"
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
    <template #content>
      <!-- Basic Information -->
      <h3 class="text-h6 mb-4">Basic Information</h3>
      <v-text-field
        v-model="formData.name"
        label="Item Name"
        :rules="[(v) => !!v || 'Name is required']"
        variant="outlined"
        required
      />

      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="formData.data.rarity"
            :items="rarityOptions"
            label="Rarity"
            :rules="[(v) => !!v || 'Rarity is required']"
            variant="outlined"
            required
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.data.itemType"
            label="Item Type"
            :rules="[(v) => !!v || 'Item type is required']"
            variant="outlined"
            placeholder="e.g., Weapon, Armor, Wondrous Item"
            required
          />
        </v-col>
      </v-row>

      <v-switch
        v-model="formData.data.attunement"
        label="Requires Attunement"
        color="purple"
        hide-details
        inset
        class="mb-6"
      />

      <v-divider class="my-6" />

      <!-- Properties -->
      <h3 class="text-h6 mb-4">Properties</h3>
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="formData.data.value"
            label="Value (optional)"
            variant="outlined"
            placeholder="e.g., 500 gp"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model.number="formData.data.weight"
            label="Weight (optional)"
            type="number"
            variant="outlined"
            suffix="lb"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="formData.data.damage"
            label="Damage (optional)"
            variant="outlined"
            placeholder="e.g., 1d8"
          />
        </v-col>
      </v-row>

      <v-combobox
        v-model="formData.data.properties"
        label="Properties (optional)"
        variant="outlined"
        multiple
        chips
        closable-chips
        placeholder="e.g., Finesse, Light, Thrown"
      />

      <v-divider class="my-6" />

      <!-- Description -->
      <h3 class="text-h6 mb-2">Description</h3>
      <p class="text-caption text-grey-lighten-1 mb-4">
        Add detailed lore, history, appearance, or usage information for this magic item.
      </p>
      <tip-tap-editor
        v-model="formData.description"
        placeholder="Describe the item's appearance, history, and lore..."
        min-height="400px"
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
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, ItemData, ItemType } from '@/types/item.types'
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

const formData = ref<{
  name: string
  description: string
  data: ItemData
  tagIds: number[]
  userFileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    rarity: 'common',
    itemType: '',
    attunement: false,
    value: '',
    weight: undefined,
    damage: '',
    properties: [],
  },
  tagIds: [],
  userFileIds: [],
  featuredImageId: null,
})

const rarityOptions = [
  { title: 'Common', value: 'common' },
  { title: 'Uncommon', value: 'uncommon' },
  { title: 'Rare', value: 'rare' },
  { title: 'Very Rare', value: 'very rare' },
  { title: 'Legendary', value: 'legendary' },
  { title: 'Artifact', value: 'artifact' },
]

const isEditMode = computed(() => !!props.item)

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

function handleJsonImport(importData: CreateLibraryItemPayload) {
  // Fill the form with imported data
  formData.value.name = importData.name
  formData.value.description = importData.description || ''

  // Handle data - could be wrapped in data property or direct
  const itemData = importData.data || importData
  if (typeof itemData === 'object' && itemData !== null) {
    // Fill magic item-specific data
    Object.assign(formData.value.data, {
      rarity: itemData.rarity || 'common',
      itemType: itemData.itemType || '',
      attunement: itemData.attunement || false,
      value: itemData.value || '',
      weight: itemData.weight || undefined,
      damage: itemData.damage || '',
      properties: Array.isArray(itemData.properties) ? itemData.properties : [],
      effect: itemData.effect || '',
    })
  }

  // Handle attachments
  formData.value.tagIds = importData.tagIds || []
  formData.value.userFileIds = importData.userFileIds || []
  formData.value.featuredImageId = importData.featuredImageId || null

  console.log('[MagicItemForm] JSON import applied:', formData.value)
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { ...newItem.data } as ItemData
    formData.value.tagIds = newItem.tags?.map(t => t.id) || []
    
    // Backend sends full userFiles objects, add them to the store and extract IDs for the form
    if (newItem.userFiles && newItem.userFiles.length > 0) {
      filesStore.addFiles(newItem.userFiles)
      formData.value.userFileIds = newItem.userFiles.map(f => f.id)
    } else {
      formData.value.userFileIds = []
    }
    
    // Backend sends full featuredImage object, add to store and extract ID for the form
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

  // Clean up data object - remove undefined/null/empty values except for arrays
  const cleanData: Record<string, any> = {}
  Object.keys(formData.value.data).forEach(key => {
    const value = formData.value.data[key as keyof ItemData]
    if (Array.isArray(value)) {
      // Always include arrays even if empty
      cleanData[key] = value
    } else if (value !== undefined && value !== null && value !== '') {
      cleanData[key] = value
    }
  })

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: cleanData,
    tagIds: formData.value.tagIds,
    userFileIds: formData.value.userFileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'ITEM_DND_5E' as const }),
  }

  console.log('Magic Item Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (success: boolean) => {
    isLoading.value = false
  })
}
</script>

<style scoped>
/* Form-specific styles can go here */
</style>

