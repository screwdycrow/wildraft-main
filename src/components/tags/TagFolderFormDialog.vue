<template>
  <v-dialog v-model="dialogModel" max-width="500" persistent>
    <v-card class="glass-dialog" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
        <v-icon :icon="isEditMode ? 'mdi-folder-edit' : 'mdi-folder-plus'" color="primary" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Folder' : 'Create New Folder' }}
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="Folder Name"
            prepend-inner-icon="mdi-folder"
            :rules="nameRules"
            variant="outlined"
            class="mb-4"
            placeholder="e.g., Encounters, Bestiary"
            autofocus
          />
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
          {{ isEditMode ? 'Save Changes' : 'Create Folder' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { TagFolder } from '@/types/tag.types'

const props = defineProps<{
  modelValue: boolean
  folder?: TagFolder | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { name: string }, callback?: (success: boolean) => void]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)

const formData = ref({
  name: '',
})

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditMode = computed(() => !!props.folder)

const nameRules = [
  (v: string) => !!v || 'Folder name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters',
  (v: string) => v.length <= 50 || 'Name must be less than 50 characters',
]

const isFormValid = computed(() => {
  return formData.value.name.length >= 2
})

watch(() => props.folder, (newFolder) => {
  if (newFolder) {
    formData.value.name = newFolder.name
  } else {
    resetForm()
  }
}, { immediate: true })

watch(dialogModel, (isOpen) => {
  if (!isOpen) {
    resetForm()
    isLoading.value = false
  }
})

async function handleSubmit() {
  if (isLoading.value) return
  
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  emit('submit', {
    name: formData.value.name.trim(),
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
  }
  formRef.value?.resetValidation()
}
</script>

