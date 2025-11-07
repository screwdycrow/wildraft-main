<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-card class="glass-card mb-4 form-container" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center form-actions-sticky px-6">
        <v-icon icon="mdi-treasure-chest" color="#F39C12" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Magic Item' : 'Create Magic Item' }}
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
            class="magic-item-tabs"
          >
            <v-tab value="basic" prepend-icon="mdi-information">
              <span class="text-caption">Basic Info</span>
            </v-tab>
            <v-tab value="properties" prepend-icon="mdi-tune">
              <span class="text-caption">Properties</span>
            </v-tab>
            <v-tab value="description" prepend-icon="mdi-text">
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
        <v-col cols="10">
          <v-card-text class="pa-6 form-content-scrollable">
            <v-window v-model="activeTab">
          <!-- Basic Info Tab -->
          <v-window-item value="basic">
            <h3 class="text-h6 mb-3">Basic Information</h3>
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
            />
          </v-window-item>

          <!-- Properties Tab -->
          <v-window-item value="properties">
            <h3 class="text-h6 mb-3">Item Properties</h3>
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

            <v-textarea
              v-model="formData.data.effect"
              label="Magical Effect (optional)"
              variant="outlined"
              rows="6"
              placeholder="Describe the magical effects of this item..."
            />
          </v-window-item>

          <!-- Description Tab -->
          <v-window-item value="description">
            <h3 class="text-h6 mb-3">Item Description</h3>
            <p class="text-caption text-grey-lighten-1 mb-4">
              Add detailed lore, history, appearance, or usage information for this magic item.
            </p>
            <tip-tap-editor
              v-model="formData.description"
              placeholder="Describe the item's appearance, history, and lore..."
              min-height="400px"
            />
          </v-window-item>

          <!-- Files Tab -->
          <v-window-item value="files">
            <h3 class="text-h6 mb-3">Attached Files</h3>
            <p class="text-caption text-grey-lighten-1 mb-4">
              Upload item artwork, reference images, or related documents.
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

      <v-divider />
      
      <v-card-actions class="form-actions-sticky px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="$emit('cancel')" :disabled="isLoading">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="flat" type="submit" :loading="isLoading">
          <v-icon icon="mdi-check" class="mr-2" />
          {{ isEditMode ? 'Save Changes' : 'Create Item' }}
        </v-btn>
      </v-card-actions>
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
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, ItemData } from '@/types/item.types'
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
const activeTab = ref('basic')
const showTagDialog = ref(false)

const formData = ref<{
  name: string
  description: string
  data: ItemData
  tagIds: number[]
  fileIds: number[]
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
    effect: '',
  },
  tagIds: [],
  fileIds: [],
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

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { ...newItem.data } as ItemData
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
    fileIds: formData.value.fileIds,
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
.form-container {
  display: flex;
  flex-direction: column;
  min-height: 60vh;
  max-height: 90vh;
}

.form-row-content {
  min-height: 60vh;
  max-height: 90vh;
}

.form-content-scrollable {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  padding-bottom: 60px;
}

.form-actions-sticky {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  padding-bottom: 24px !important;
}

.magic-item-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}

.magic-item-tabs :deep(.v-tab--selected) {
  background: rgba(255, 183, 77, 0.15);
  border-right: 3px solid #FFB74D;
}

.border-e {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}
</style>

