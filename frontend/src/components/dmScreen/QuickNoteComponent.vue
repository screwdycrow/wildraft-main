<template>
  <div class="quick-note-component" :style="noteStyle">
    <div class="note-header d-flex align-center">
      <v-text-field
        v-model="localTitle"
        variant="plain"
        density="compact"
        placeholder="Note title..."
        hide-details
        class="note-title-input"
        @blur="updateNote"
      />
      <v-menu :close-on-content-click="false" location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-palette" variant="text" size="small" v-bind="props" class="ml-2 hover-opacity" />
        </template>
        <v-card width="280">
          <v-card-text>
            <div class="text-caption mb-2">Background Color</div>
            <v-color-picker v-model="localBgColor" mode="hex" hide-inputs elevation="0" @update:model-value="updateNote" />
            <div class="text-caption mt-4 mb-2">Opacity</div>
            <v-slider v-model="localOpacity" min="0" max="1" step="0.05" thumb-label hide-details @update:model-value="updateNote" />
            <div class="text-caption mt-4 mb-2">Blur Amount</div>
            <v-slider v-model="localBlur" min="0" max="20" step="1" thumb-label hide-details @update:model-value="updateNote" />
          </v-card-text>
        </v-card>
      </v-menu>
    </div>
    <div class="note-content">
      <v-textarea
        v-model="localContent"
        variant="plain"
        density="compact"
        placeholder="Note content..."
        auto-grow
        hide-details
        rows="3"
        @blur="updateNote"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

interface Props {
  item: DmScreenItem
}

const emit = defineEmits<{
  update: [item: DmScreenItem]
}>()

const props = defineProps<Props>()

const localTitle = ref(props.item.data.title || '')
const localContent = ref(props.item.data.content || '')
const localBgColor = ref(props.item.data.backgroundColor || 'transparent')
const localOpacity = ref(props.item.data.backgroundOpacity ?? 0)
const localBlur = ref(props.item.data.blur ?? 0)

watch(() => props.item.data, (newData) => {
  localTitle.value = newData.title || ''
  localContent.value = newData.content || ''
  localBgColor.value = newData.backgroundColor || 'transparent'
  localOpacity.value = newData.backgroundOpacity ?? 0
  localBlur.value = newData.blur ?? 0
}, { deep: true })

function updateNote() {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      title: localTitle.value,
      content: localContent.value,
      backgroundColor: localBgColor.value,
      backgroundOpacity: localOpacity.value,
      blur: localBlur.value
    }
  }
  emit('update', updatedItem)
}

const hexToRgba = (hex: string, alpha: number) => {
  if (hex === 'transparent' || !hex) return 'transparent'
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return 'transparent'
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const noteStyle = computed(() => {
  const bgColor = localBgColor.value
  const opacity = localOpacity.value
  const blur = localBlur.value

  return {
    backgroundColor: hexToRgba(bgColor, opacity),
    backdropFilter: blur > 0 ? `blur(${blur}px)` : 'none',
    WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : 'none',
    borderRadius: '8px',
  }
})
</script>

<style scoped>
.quick-note-component {
  padding: 16px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.note-header {
  margin-bottom: 8px;
}

.note-title-input :deep(.v-field__input) {
  font-weight: 600;
  font-size: 16px;
}

.note-content {
  flex: 1;
}

.note-content :deep(.v-field__input) {
  font-size: 14px;
  line-height: 1.5;
}

.hover-opacity {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.hover-opacity:hover {
  opacity: 1;
}
</style>
