<template>
  <v-dialog v-model="dialogModel" max-width="600" persistent>
    <v-card class="glass-dialog" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
        <v-icon :icon="isEditMode ? 'mdi-tag-edit' : 'mdi-tag-plus'" color="primary" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Tag' : 'Create New Tag' }}
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="Tag Name"
            prepend-inner-icon="mdi-tag"
            :rules="nameRules"
            variant="outlined"
            class="mb-4"
            placeholder="e.g., Combat, NPC, Magic Item"
            autofocus
          />

          <v-select
            v-model="formData.folderId"
            label="Folder (optional)"
            prepend-inner-icon="mdi-folder"
            variant="outlined"
            :items="folderOptions"
            item-title="name"
            item-value="id"
            clearable
            class="mb-4"
            placeholder="Select a folder"
            hint="Group tags into folders for better organization"
            persistent-hint
          >
            <template #append>
              <v-btn
                icon="mdi-folder-plus"
                size="small"
                variant="text"
                @click="showNewFolderInput = true"
              />
            </template>
          </v-select>

          <!-- New Folder Input -->
          <v-text-field
            v-if="showNewFolderInput"
            v-model="newFolderName"
            label="New Folder Name"
            prepend-inner-icon="mdi-folder-plus"
            variant="outlined"
            class="mb-4"
            placeholder="Enter new folder name"
          >
            <template #append>
              <v-btn
                icon="mdi-check"
                size="small"
                variant="text"
                color="success"
                :disabled="!newFolderName.trim()"
                @click="createNewFolder"
              />
              <v-btn
                icon="mdi-close"
                size="small"
                variant="text"
                @click="showNewFolderInput = false; newFolderName = ''"
              />
            </template>
          </v-text-field>

          <div class="mb-4">
            <label class="text-body-2 text-grey-lighten-1 mb-2 d-block">Tag Color</label>
            <div class="d-flex align-center gap-3">
              <v-text-field
                v-model="formData.color"
                type="color"
                variant="outlined"
                hide-details
                density="compact"
                style="max-width: 80px;"
              />
              <v-chip :color="formData.color" class="px-6">
                {{ formData.name || 'Preview' }}
              </v-chip>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <v-chip
              v-for="preset in colorPresets"
              :key="preset.color"
              :color="preset.color"
              size="small"
              @click="formData.color = preset.color"
              style="cursor: pointer;"
            >
              {{ preset.name }}
            </v-chip>
          </div>

          <!-- Featured Image -->
          <div class="mb-4">
            <label class="text-body-2 text-grey-lighten-1 mb-2 d-block">Featured Image (optional)</label>
            
            <!-- Current Image Preview -->
            <div v-if="featuredImageUrl" class="d-flex align-center gap-3 mb-3">
              <v-avatar
                size="80"
                rounded="lg"
              >
                <v-img :src="featuredImageUrl" cover />
              </v-avatar>
              <div class="d-flex flex-column gap-1">
                <v-btn
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-folder-image"
                  @click="openFileManager"
                >
                  Choose from Library
                </v-btn>
                <v-btn
                  size="small"
                  variant="text"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="removeImage"
                >
                  Remove
                </v-btn>
              </div>
            </div>

            <!-- Upload / Select Options (when no image selected) -->
            <div v-else>
              <div class="d-flex gap-2 mb-3">
                <v-btn
                  size="small"
                  variant="outlined"
                  prepend-icon="mdi-folder-image"
                  @click="openFileManager"
                >
                  Choose from Library
                </v-btn>
              </div>
              
              <drag-drop-upload
                compact
                @uploaded="handleFileUploaded"
              />
            </div>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
          :disabled="isLoading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSubmit"
          :loading="isLoading"
          :disabled="!isFormValid"
        >
          <v-icon icon="mdi-check" class="mr-2" />
          {{ isEditMode ? 'Save Changes' : 'Create Tag' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- File Manager Dialog -->
    <file-manager
      v-model="fileManagerOpen"
      select-mode
      :multiple="false"
      return-type="id"
      @select="handleFileSelected"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { Tag, TagFolder } from '@/types/tag.types'
import type { UserFile } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import DragDropUpload from '@/components/files/DragDropUpload.vue'
import FileManager from '@/components/files/FileManager.vue'

const props = defineProps<{
  modelValue: boolean
  tag?: Tag | null
  folders: TagFolder[]
  libraryId: number
  initialFolderId?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { name: string; color: string; folderId?: number | null; featuredImageId?: number | null }, callback?: (success: boolean) => void]
  'create-folder': [name: string, callback: (folder: TagFolder | null) => void]
}>()

const filesStore = useFilesStore()

const formRef = ref<VForm>()
const isLoading = ref(false)
const showNewFolderInput = ref(false)
const newFolderName = ref('')
const featuredImageUrl = ref<string | null>(null)
const fileManagerOpen = ref(false)

const formData = ref({
  name: '',
  color: '#E74C3C',
  folderId: null as number | null,
  featuredImageId: null as number | null,
})

const colorPresets = [
  { name: 'Combat', color: '#E74C3C' },
  { name: 'Monster', color: '#27AE60' },
  { name: 'NPC', color: '#3498DB' },
  { name: 'Magic Item', color: '#9B59B6' },
  { name: 'Location', color: '#F39C12' },
  { name: 'Quest', color: '#1ABC9C' },
  { name: 'Notes', color: '#95A5A6' },
  { name: 'Spell', color: '#8E44AD' },
  { name: 'Weapon', color: '#C0392B' },
  { name: 'Armor', color: '#34495E' },
  { name: 'Potion', color: '#16A085' },
  { name: 'Treasure', color: '#F1C40F' },
  { name: 'Trap', color: '#E67E22' },
  { name: 'Puzzle', color: '#9B59B6' },
  { name: 'Lore', color: '#5D6D7E' },
  { name: 'Character', color: '#2980B9' },
  { name: 'Organization', color: '#7D3C98' },
  { name: 'Event', color: '#D35400' },
]

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditMode = computed(() => !!props.tag)

const folderOptions = computed(() => {
  return props.folders.map(f => ({ id: f.id, name: f.name }))
})

const nameRules = [
  (v: string) => !!v || 'Tag name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters',
  (v: string) => v.length <= 50 || 'Name must be less than 50 characters',
]

const isFormValid = computed(() => {
  return formData.value.name.length >= 2 && formData.value.color
})

// Watch for tag prop changes (for edit mode)
watch(() => props.tag, async (newTag) => {
  if (newTag) {
    formData.value.name = newTag.name
    formData.value.color = newTag.color
    formData.value.folderId = newTag.folderId
    formData.value.featuredImageId = newTag.featuredImageId || null
    
    // Load featured image URL
    if (newTag.featuredImageId && newTag.featuredImage) {
      await loadFeaturedImageUrl(newTag.featuredImage.id)
    } else {
      featuredImageUrl.value = null
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch dialog open/close to reset form and loading state
watch(dialogModel, (isOpen) => {
  if (isOpen && !props.tag && props.initialFolderId) {
    // When opening for create mode with preselected folder
    formData.value.folderId = props.initialFolderId
  } else if (!isOpen) {
    resetForm()
    isLoading.value = false
    showNewFolderInput.value = false
    newFolderName.value = ''
  }
})

function openFileManager() {
  fileManagerOpen.value = true
}

function handleFileSelected(fileId: number | number[]) {
  const id = Array.isArray(fileId) ? fileId[0] : fileId
  formData.value.featuredImageId = id
  loadFeaturedImageUrl(id)
}

async function loadFeaturedImageUrl(fileId: number) {
  try {
    featuredImageUrl.value = await filesStore.getDownloadUrl(fileId)
  } catch {
    featuredImageUrl.value = null
  }
}

function removeImage() {
  formData.value.featuredImageId = null
  featuredImageUrl.value = null
}

async function handleFileUploaded(file: UserFile) {
  formData.value.featuredImageId = file.id
  await loadFeaturedImageUrl(file.id)
}

function createNewFolder() {
  if (!newFolderName.value.trim()) return
  
  emit('create-folder', newFolderName.value.trim(), (folder) => {
    if (folder) {
      formData.value.folderId = folder.id
    }
    showNewFolderInput.value = false
    newFolderName.value = ''
  })
}

async function handleSubmit() {
  if (isLoading.value) return
  
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  emit('submit', {
    name: formData.value.name.trim(),
    color: formData.value.color,
    folderId: formData.value.folderId,
    featuredImageId: formData.value.featuredImageId,
  }, (success: boolean) => {
    isLoading.value = false
    if (success) {
      dialogModel.value = false
    }
  })
}

function handleCancel() {
  dialogModel.value = false
  resetForm()
}

function resetForm() {
  formData.value = {
    name: '',
    color: '#E74C3C',
    folderId: null,
    featuredImageId: null,
  }
  featuredImageUrl.value = null
  formRef.value?.resetValidation()
}
</script>

<style scoped>
/* Use global glass-dialog class */
</style>
