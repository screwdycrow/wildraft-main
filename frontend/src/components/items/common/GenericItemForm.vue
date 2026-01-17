<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-card class="glass-card form-container" elevation="0">
      <v-card-title class="text-h5 font-weight-bold">
        {{ isEditMode ? 'Edit Item' : 'Create Item' }}
      </v-card-title>
      
      <v-card-text class="form-content-scrollable">
        <v-text-field
          v-model="formData.name"
          label="Name"
          :rules="[(v) => !!v || 'Name is required']"
          variant="outlined"
          required
        />
        
        <v-textarea
          v-model="formData.description"
          label="Description"
          variant="outlined"
          rows="3"
        />
        
        <v-textarea
          v-model="formDataJson"
          label="Data (JSON)"
          variant="outlined"
          rows="10"
        />
      </v-card-text>
      
      <v-card-actions class="form-actions-sticky px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" @click="$emit('cancel')" :disabled="isLoading">
          Cancel
        </v-btn>
        <v-btn color="primary" type="submit" :loading="isLoading">
          {{ isEditMode ? 'Save' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload } from '@/types/item.types'

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

const formData = ref({
  name: '',
  description: '',
  data: {} as Record<string, any>,
})

const formDataJson = ref('')

const isEditMode = computed(() => !!props.item)

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { ...newItem.data }
    formDataJson.value = JSON.stringify(newItem.data, null, 2)
  }
}, { immediate: true })

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  try {
    formData.value.data = JSON.parse(formDataJson.value)
  } catch (e) {
    alert('Invalid JSON in data field')
    isLoading.value = false
    return
  }

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description.trim() || undefined,
    data: formData.value.data,
  }

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

.form-content-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 24px;
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
</style>

