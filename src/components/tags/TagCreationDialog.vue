<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-tag-plus" class="mr-2" />
        Create New Tag
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="tagName"
            label="Tag Name"
            :rules="[(v) => !!v || 'Tag name is required']"
            variant="outlined"
            autofocus
            required
            class="mb-4"
          />

          <v-text-field
            v-model="tagFolder"
            label="Folder (optional)"
            variant="outlined"
            placeholder="e.g., NPCs, Locations, Items"
            hint="Organize tags into folders"
            persistent-hint
            class="mb-4"
          />

          <v-card elevation="0" class="mb-4">
            <v-card-subtitle class="px-0">Tag Color</v-card-subtitle>
            <div class="color-picker">
              <v-btn
                v-for="color in colorOptions"
                :key="color"
                :color="color"
                :variant="selectedColor === color ? 'flat' : 'outlined'"
                size="large"
                icon
                class="ma-1"
                @click="selectedColor = color"
              >
                <v-icon v-if="selectedColor === color" icon="mdi-check" />
              </v-btn>
            </div>
          </v-card>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close" :disabled="isLoading">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="isLoading"
          @click="handleSubmit"
        >
          <v-icon icon="mdi-check" class="mr-2" />
          Create Tag
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTagsStore } from '@/stores/tags'
import type { VForm } from 'vuetify/components'
import { useToast } from 'vue-toastification'

interface Props {
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  created: [tagId: number]
}>()

const tagsStore = useTagsStore()
const toast = useToast()

const isOpen = defineModel<boolean>('modelValue', { default: false })
const formRef = ref<VForm>()
const isLoading = ref(false)
const tagName = ref('')
const tagFolder = ref('')
const selectedColor = ref('#3498DB')

const colorOptions = [
  '#E74C3C', // Red
  '#E67E22', // Orange
  '#F39C12', // Yellow
  '#2ECC71', // Green
  '#3498DB', // Blue
  '#9B59B6', // Purple
  '#1ABC9C', // Teal
  '#34495E', // Dark Gray
  '#95A5A6', // Gray
  '#16A085', // Dark Teal
  '#27AE60', // Dark Green
  '#2980B9', // Dark Blue
]

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  try {
    const newTag = await tagsStore.createTag(props.libraryId, {
      name: tagName.value.trim(),
      color: selectedColor.value,
      folder: tagFolder.value.trim() || undefined,
    })

    toast.success(`Tag "${newTag.name}" created successfully`)
    emit('created', newTag.id)
    close()
  } catch (error: any) {
    console.error('Failed to create tag:', error)
    toast.error(error.response?.data?.error || 'Failed to create tag')
  } finally {
    isLoading.value = false
  }
}

function close() {
  isOpen.value = false
  tagName.value = ''
  tagFolder.value = ''
  selectedColor.value = '#3498DB'
}
</script>

<style scoped>
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>

