<template>
  <item-form-layout
    :title="isEditMode ? 'Edit Stat Block' : 'Create Stat Block'"
    icon="mdi-sword-cross"
    icon-color="#E74C3C"
    :is-loading="isLoading"
    :save-button-text="isEditMode ? 'Save Changes' : 'Create Stat Block'"
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
      <!-- Basic Information -->
      <h3 class="text-h6 mb-4">Basic Information</h3>
      <v-row>
        <v-col cols="12" md="8">
          <v-text-field
            v-model="formData.name"
            label="Creature Name"
            :rules="[(v) => !!v || 'Name is required']"
            variant="outlined"
            required
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-combobox
            v-model="formData.data.cr"
            :items="CR_OPTIONS"
            label="Challenge Rating"
            :rules="[(v) => !!v || 'CR is required']"
            variant="outlined"
            required
          />
        </v-col>
      </v-row>

      <!-- Type, Size, Alignment -->
      <v-row>
        <v-col cols="12" md="4">
          <v-combobox
            v-model="formData.data.size"
            :items="DND5E_SIZES"
            label="Size"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="formData.data.type"
            label="Type"
            variant="outlined"
            placeholder="e.g., humanoid, beast, dragon"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-combobox
            v-model="formData.data.alignment"
            :items="DND5E_ALIGNMENTS"
            label="Alignment"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- Combat Stats -->
      <h3 class="text-h6 mb-4">Combat Stats</h3>
      <v-row>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="formData.data.hp"
            label="Hit Points"
            type="number"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="formData.data.ac"
            label="Armor Class"
            type="number"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="formData.data.speed"
            label="Speed"
            variant="outlined"
            placeholder="e.g., 30 ft"
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="formData.data.senses"
            label="Senses"
            variant="outlined"
            placeholder="e.g., darkvision 60 ft"
          />
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- Ability Scores -->
      <h3 class="text-h6 mb-4">Ability Scores</h3>
      <v-row>
        <v-col v-for="ability in ABILITIES" :key="ability" cols="6" md="2">
          <v-text-field
            v-model.number="formData.data[ability]"
            :label="ABILITY_LABELS[ability]"
            type="number"
            variant="outlined"
            density="compact"
          >
            <template #append>
              <span class="text-caption">
                {{ formatModifier(calculateModifier(formData.data[ability] || 10)) }}
              </span>
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="formData.data.languages"
            label="Languages"
            variant="outlined"
            placeholder="e.g., Common, Draconic"
          />
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- Traits, Actions, Spells - Placeholder -->
      <v-alert type="info" variant="tonal" density="compact">
        <v-icon icon="mdi-information" class="mr-2" />
        Traits, actions, and spells can be managed in the stat block viewer after creation.
      </v-alert>

      <v-divider class="my-6" />

      <!-- Description -->
      <h3 class="text-h6 mb-2">Description & Lore</h3>
      <p class="text-caption text-grey-lighten-1 mb-4">
        Add appearance, behavior, habitat, and other flavor text.
      </p>
      <tip-tap-editor
        v-model="formData.description"
        placeholder="Describe this creature..."
        min-height="300px"
        :library-id="libraryId"
        :library-item-id="item?.id || null"
        :user-file-ids="formData.userFileIds"
        :user-files="item?.userFiles || []"
        @update:user-file-ids="formData.userFileIds = $event"
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
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, StatBlockData } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'
import { DND5E_SIZES, DND5E_ALIGNMENTS, ABILITY_LABELS, ABILITIES } from '@/constants/dnd5e'
import { calculateModifier, formatModifier } from '@/composables/useDnd5eCalculations'

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

// CR Options
const CR_OPTIONS = [
  '0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '30',
]

const formData = ref<{
  name: string
  description: string
  data: StatBlockData
  tagIds: number[]
  userFileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    cr: '1',
    hp: 10,
    ac: 10,
    speed: '30 ft',
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    size: 'Medium',
    type: 'humanoid',
    alignment: 'Unaligned',
    senses: '',
    languages: '',
    traits: [],
    actions: [],
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
    formData.value.data = { ...newItem.data } as StatBlockData
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
    ...(isEditMode.value ? {} : { type: 'STAT_BLOCK_DND_5E' as const }),
  }

  console.log('Stat Block Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (_success: boolean) => {
    isLoading.value = false
  })
}
</script>

<style scoped>
/* Form-specific styles can go here */
</style>


