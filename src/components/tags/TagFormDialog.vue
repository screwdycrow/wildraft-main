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

          <v-combobox
            v-model="formData.folder"
            label="Folder (optional)"
            prepend-inner-icon="mdi-folder"
            variant="outlined"
            :items="existingFolders"
            clearable
            class="mb-4"
            placeholder="e.g., Encounters, Bestiary"
            hint="Group tags into folders for better organization"
            persistent-hint
          />

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
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { Tag } from '@/types/tag.types'

const props = defineProps<{
  modelValue: boolean
  tag?: Tag | null
  existingFolders?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { name: string; color: string; folder?: string | null }, callback?: (success: boolean) => void]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)

const formData = ref({
  name: '',
  color: '#E74C3C',
  folder: null as string | null,
})

const colorPresets = [
  { name: 'Combat', color: '#E74C3C' },
  { name: 'Monster', color: '#27AE60' },
  { name: 'NPC', color: '#3498DB' },
  { name: 'Magic Item', color: '#9B59B6' },
  { name: 'Location', color: '#F39C12' },
  { name: 'Quest', color: '#1ABC9C' },
  { name: 'Notes', color: '#95A5A6' },
]

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditMode = computed(() => !!props.tag)

const nameRules = [
  (v: string) => !!v || 'Tag name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters',
  (v: string) => v.length <= 50 || 'Name must be less than 50 characters',
]

const isFormValid = computed(() => {
  return formData.value.name.length >= 2 && formData.value.color
})

// Watch for tag prop changes (for edit mode)
watch(() => props.tag, (newTag) => {
  if (newTag) {
    formData.value.name = newTag.name
    formData.value.color = newTag.color
    formData.value.folder = newTag.folder
  } else {
    resetForm()
  }
}, { immediate: true })

// Watch dialog close to reset form and loading state
watch(dialogModel, (isOpen) => {
  if (!isOpen) {
    resetForm()
    isLoading.value = false
  }
})

async function handleSubmit() {
  if (isLoading.value) return // Prevent double-clicks
  
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  // Emit submit event with callback - parent will call callback when done
  emit('submit', {
    name: formData.value.name.trim(),
    color: formData.value.color,
    folder: formData.value.folder?.trim() || null,
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
    folder: null,
  }
  formRef.value?.resetValidation()
}
</script>

<style scoped>
/* Use global glass-dialog class */
</style>

