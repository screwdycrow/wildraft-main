<template>
  <v-dialog v-model="dialogModel" max-width="600" persistent>
    <v-card class="glass-dialog" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
        <v-icon :icon="isEditMode ? 'mdi-pencil' : 'mdi-book-plus'" color="primary" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Library' : 'Create New Library' }}
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="Library Name"
            prepend-inner-icon="mdi-book"
            :rules="nameRules"
            variant="outlined"
            class="mb-4"
            placeholder="e.g., My Campaign, Monster Manual"
            autofocus
          />

          <v-textarea
            v-model="formData.description"
            label="Description (optional)"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            rows="4"
            placeholder="Describe what this library contains..."
            class="mb-2"
          />

          <v-alert
            v-if="!isEditMode"
            type="info"
            variant="tonal"
            density="compact"
            icon="mdi-information"
            class="mt-4"
          >
            You'll be able to add stat blocks, characters, items, and notes to this library after creating it.
          </v-alert>
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
          {{ isEditMode ? 'Save Changes' : 'Create Library' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { Library } from '@/types/library.types'

const props = defineProps<{
  modelValue: boolean
  library?: Library | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [data: { name: string; description?: string }, callback?: (success: boolean) => void]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)

const formData = ref({
  name: '',
  description: '',
})

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const isEditMode = computed(() => !!props.library)

const nameRules = [
  (v: string) => !!v || 'Library name is required',
  (v: string) => v.length >= 3 || 'Name must be at least 3 characters',
  (v: string) => v.length <= 100 || 'Name must be less than 100 characters',
]

const isFormValid = computed(() => {
  return formData.value.name.length >= 3
})

// Watch for library prop changes (for edit mode)
watch(() => props.library, (newLibrary) => {
  if (newLibrary) {
    formData.value.name = newLibrary.name
    formData.value.description = newLibrary.description || ''
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
    description: formData.value.description.trim() || undefined,
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
    description: '',
  }
  formRef.value?.resetValidation()
}
</script>

<style scoped>
/* Use global glass-dialog class */

:deep(.v-text-field .v-field__outline) {
  color: rgba(255, 255, 255, 0.2);
}

:deep(.v-text-field--focused .v-field__outline) {
  color: rgba(220, 20, 60, 0.5);
}
</style>

