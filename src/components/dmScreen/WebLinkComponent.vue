<template>
  <div class="web-link-component">
    <div class="link-header">
      <v-text-field
        v-model="localTitle"
        variant="plain"
        density="compact"
        placeholder="Link title..."
        hide-details
        class="link-title-input"
        @blur="updateLink"
      />
    </div>
    <div class="link-url">
      <v-text-field
        v-model="localUrl"
        variant="outlined"
        density="compact"
        placeholder="https://..."
        prepend-inner-icon="mdi-link"
        hide-details
        @blur="updateLink"
      />
    </div>
    <div class="link-actions">
      <v-btn
        size="small"
        variant="tonal"
        prepend-icon="mdi-open-in-new"
        @click="openInNewTab"
        :disabled="!isValidUrl"
      >
        Open in New Tab
      </v-btn>
      <v-btn
        size="small"
        variant="tonal"
        prepend-icon="mdi-web"
        @click="openEmbedded"
        :disabled="!isValidUrl"
      >
        Open Embedded
      </v-btn>
    </div>
    <div v-if="isEmbedded && isValidUrl" class="link-embed">
      <iframe
        :src="localUrl"
        frameborder="0"
        class="embedded-frame"
      />
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
const localUrl = ref(props.item.data.url || '')
const isEmbedded = ref(props.item.data.embedded || false)

const isValidUrl = computed(() => {
  try {
    new URL(localUrl.value)
    return true
  } catch {
    return false
  }
})

watch(() => props.item.data, (newData) => {
  localTitle.value = newData.title || ''
  localUrl.value = newData.url || ''
  isEmbedded.value = newData.embedded || false
}, { deep: true })

function updateLink() {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      title: localTitle.value,
      url: localUrl.value,
    }
  }
  emit('update', updatedItem)
}

function openInNewTab() {
  if (isValidUrl.value) {
    window.open(localUrl.value, '_blank')
  }
}

function openEmbedded() {
  isEmbedded.value = true
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      embedded: true,
    }
  }
  emit('update', updatedItem)
}
</script>

<style scoped>
.web-link-component {
  padding: 16px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.link-header {
  margin-bottom: 8px;
}

.link-title-input :deep(.v-field__input) {
  font-weight: 600;
  font-size: 16px;
}

.link-url {
  margin-bottom: 12px;
}

.link-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.link-embed {
  flex: 1;
  min-height: 300px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.embedded-frame {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>

