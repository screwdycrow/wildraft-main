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
    :item-type="itemType"
    :item="item"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
    @add-tag="showTagDialog = true"
    @json-import="handleJsonImport"
    ref="layoutRef"
  >
    <template #tabs>
      <v-tabs
        v-model="activeTab"
        direction="vertical"
        color="primary"
        class="stat-block-tabs"
      >
        <v-tab value="stats" prepend-icon="mdi-shield">
          <span class="text-caption">Stats</span>
        </v-tab>
        <v-tab value="traits" prepend-icon="mdi-star-circle">
          <span class="text-caption">Traits</span>
        </v-tab>
        <v-tab value="actions" prepend-icon="mdi-sword">
          <span class="text-caption">Actions</span>
        </v-tab>
        <v-tab value="spells" prepend-icon="mdi-auto-fix">
          <span class="text-caption">Spells</span>
        </v-tab>
        <v-tab value="description" prepend-icon="mdi-text">
          <span class="text-caption">Description</span>
        </v-tab>
      </v-tabs>
    </template>

    <template #content>
      <v-window v-model="activeTab">
        <!-- Stats Tab -->
        <v-window-item value="stats">
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
      
      <v-row>
        <v-col cols="12" md="3">
          <v-text-field
            v-model.number="formData.data.initiative"
            label="Initiative"
            type="number"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="formData.data.resistances"
            label="Resistances"
            variant="outlined"
            density="compact"
            placeholder="e.g., fire, cold"
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="formData.data.immunities"
            label="Immunities"
            variant="outlined"
            density="compact"
            placeholder="e.g., poison, psychic"
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

      <!-- Ability Scores & Saving Throws -->
      <ability-scores-editor
        :data="formData.data"
        @update:data="Object.assign(formData.data, $event)"
        :proficiency-bonus="proficiencyBonus"
      />

      <v-row class="mt-4">
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

      <h3 class="text-h6 mb-4">Custom Counters</h3>
      <p class="text-caption text-grey-lighten-1 mb-2">
        Track recharge abilities, legendary actions, or other limited resources with custom counters.
      </p>
      <custom-counters-display
        :counters="formData.data.customCounters"
        @update:counters="formData.data.customCounters = $event"
      />
        </v-window-item>

        <!-- Traits Tab -->
        <v-window-item value="traits">
          <h3 class="text-h6 mb-4">Traits & Special Abilities</h3>
          <trait-list-editor v-model="formData.data.traits" />
        </v-window-item>

        <!-- Actions Tab -->
        <v-window-item value="actions">
          <h3 class="text-h6 mb-4">Actions</h3>
          <action-list-editor v-model="formData.data.actions" />
        </v-window-item>

        <!-- Spells Tab -->
        <v-window-item value="spells">
          <h3 class="text-h6 mb-4">Spells & Spellcasting</h3>
          <spell-list-editor v-model="formData.data.spells" />
        </v-window-item>

        <!-- Description Tab -->
        <v-window-item value="description">
          <h3 class="text-h6 mb-2">Description & Lore</h3>
          <p class="text-caption text-grey-lighten-1 mb-4">
            Add appearance, behavior, habitat, and other flavor text.
          </p>
          <tip-tap-editor
            v-model="formData.description"
            placeholder="Describe this creature..."
            min-height="400px"
            :library-id="libraryId"
            :library-item-id="item?.id || null"
            :user-file-ids="formData.userFileIds"
            :user-files="item?.userFiles || []"
            @update:user-file-ids="formData.userFileIds = $event"
          />
        </v-window-item>
      </v-window>
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
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, StatBlockData, ItemType } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'
import TraitListEditor from '../common/TraitListEditor.vue'
import ActionListEditor from '../common/ActionListEditor.vue'
import SpellListEditor from '../common/SpellListEditor.vue'
import AbilityScoresEditor from '../common/AbilityScoresEditor.vue'
import CustomCountersDisplay from '../common/CustomCountersDisplay.vue'
import { DND5E_SIZES, DND5E_ALIGNMENTS } from '@/constants/dnd5e'
import {
  calculateStatBlockProficiencyBonus,
} from '@/composables/useDnd5eCalculations'

interface Props {
  item?: LibraryItem | null
  libraryId: number
  itemType: ItemType
  initialTagIds?: number[]
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
const activeTab = ref('stats')

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
    initiative: 0,
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    strSavingThrow: false,
    dexSavingThrow: false,
    conSavingThrow: false,
    intSavingThrow: false,
    wisSavingThrow: false,
    chaSavingThrow: false,
    size: 'Medium',
    type: 'humanoid',
    alignment: 'Unaligned',
    senses: '',
    languages: '',
    immunities: '',
    resistances: '',
    traits: [],
    actions: [],
    spells: [],
    customCounters: [],
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

const proficiencyBonus = computed(() => 
  calculateStatBlockProficiencyBonus(formData.value.data.cr || '1')
)

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
    // Fill stat block-specific data
    Object.assign(formData.value.data, {
      cr: itemData.cr || '1',
      hp: itemData.hp || 10,
      ac: itemData.ac || 10,
      speed: itemData.speed || '30 ft',
      initiative: itemData.initiative ?? 0,
      str: itemData.str || 10,
      dex: itemData.dex || 10,
      con: itemData.con || 10,
      int: itemData.int || 10,
      wis: itemData.wis || 10,
      cha: itemData.cha || 10,
      strSavingThrow: itemData.strSavingThrow || false,
      dexSavingThrow: itemData.dexSavingThrow || false,
      conSavingThrow: itemData.conSavingThrow || false,
      intSavingThrow: itemData.intSavingThrow || false,
      wisSavingThrow: itemData.wisSavingThrow || false,
      chaSavingThrow: itemData.chaSavingThrow || false,
      size: itemData.size || 'Medium',
      type: itemData.type || 'humanoid',
      alignment: itemData.alignment || 'Unaligned',
      senses: itemData.senses || '',
      languages: itemData.languages || '',
      immunities: itemData.immunities || '',
      resistances: itemData.resistances || '',
      traits: itemData.traits || [],
      actions: itemData.actions || [],
      spells: itemData.spells || [],
      customCounters: itemData.customCounters || [],
      customCounters: itemData.customCounters || [],
    })
  }

  // Handle attachments
  formData.value.tagIds = importData.tagIds || []
  formData.value.userFileIds = importData.userFileIds || []
  formData.value.featuredImageId = importData.featuredImageId || null

  console.log('[StatBlockForm] JSON import applied:', formData.value)
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    console.log('[StatBlockForm] Loading item:', newItem)
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    
    // Properly initialize StatBlockData with all required arrays
    const itemData = newItem.data as StatBlockData
    formData.value.data = {
      cr: itemData.cr || '1',
      hp: itemData.hp || 10,
      ac: itemData.ac || 10,
      speed: itemData.speed || '30 ft',
      initiative: itemData.initiative ?? 0,
      str: itemData.str || 10,
      dex: itemData.dex || 10,
      con: itemData.con || 10,
      int: itemData.int || 10,
      wis: itemData.wis || 10,
      cha: itemData.cha || 10,
      strSavingThrow: itemData.strSavingThrow || false,
      dexSavingThrow: itemData.dexSavingThrow || false,
      conSavingThrow: itemData.conSavingThrow || false,
      intSavingThrow: itemData.intSavingThrow || false,
      wisSavingThrow: itemData.wisSavingThrow || false,
      chaSavingThrow: itemData.chaSavingThrow || false,
      size: itemData.size || 'Medium',
      type: itemData.type || 'humanoid',
      alignment: itemData.alignment || 'Unaligned',
      senses: itemData.senses || '',
      languages: itemData.languages || '',
      immunities: itemData.immunities || '',
      resistances: itemData.resistances || '',
      // Ensure arrays are properly initialized
      traits: itemData.traits || [],
      actions: itemData.actions || [],
      spells: itemData.spells || [],
    }
    
    console.log('[StatBlockForm] Loaded data:', formData.value.data)
    console.log('[StatBlockForm] Traits:', formData.value.data.traits)
    console.log('[StatBlockForm] Actions:', formData.value.data.actions)
    console.log('[StatBlockForm] Spells:', formData.value.data.spells)
    
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

// Debug watch for traits, actions, spells
watch(() => formData.value.data.traits, (newTraits) => {
  console.log('[StatBlockForm] Traits changed:', newTraits)
}, { deep: true })

watch(() => formData.value.data.actions, (newActions) => {
  console.log('[StatBlockForm] Actions changed:', newActions)
}, { deep: true })

watch(() => formData.value.data.spells, (newSpells) => {
  console.log('[StatBlockForm] Spells changed:', newSpells)
}, { deep: true })

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
.stat-block-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}
</style>

