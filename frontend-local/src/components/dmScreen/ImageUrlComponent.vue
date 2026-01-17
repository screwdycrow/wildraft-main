<template>
  <div class="image-url-component">
    <div class="image-header">
      <v-text-field
        v-model="localTitle"
        variant="plain"
        density="compact"
        placeholder="Image title..."
        hide-details
        class="image-title-input"
        @blur="updateImage"
      />
    </div>
    <div class="image-url-input">
      <v-text-field
        v-model="localImageUrl"
        variant="outlined"
        density="compact"
        placeholder="https://..."
        prepend-inner-icon="mdi-image"
        hide-details
        @blur="updateImage"
      />
    </div>
    <div v-if="isValidImageUrl" class="image-preview">
      <img :src="localImageUrl" :alt="localTitle || 'Image'" @error="handleImageError" />
    </div>
    <div v-else-if="localImageUrl" class="image-error">
      <v-icon icon="mdi-alert" color="warning" />
      <span class="text-caption">Invalid image URL</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

interface Props {
  item: DmScreenItem
}

const emit = defineEmits<{
  update: [item: DmScreenItem]
}>()

const props = defineProps<Props>()

const localTitle = ref(props.item.data.title || '')
const localImageUrl = ref(props.item.data.imageUrl || '')
const imageError = ref(false)

const isValidImageUrl = computed(() => {
  if (!localImageUrl.value) return false
  if (imageError.value) return false
  try {
    new URL(localImageUrl.value)
    return true
  } catch {
    return false
  }
})

watch(() => props.item.data, (newData) => {
  localTitle.value = newData.title || ''
  localImageUrl.value = newData.imageUrl || ''
  imageError.value = false
}, { deep: true })

function updateImage() {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      title: localTitle.value,
      imageUrl: localImageUrl.value,
    }
  }
  emit('update', updatedItem)
}

function handleImageError() {
  imageError.value = true
}
</script>

<style scoped>
.image-url-component {
  padding: 16px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.image-header {
  margin-bottom: 8px;
}

.image-title-input :deep(.v-field__input) {
  font-weight: 600;
  font-size: 16px;
}

.image-url-input {
  margin-bottom: 12px;
}

.image-preview {
  flex: 1;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.7);
}
</style>

