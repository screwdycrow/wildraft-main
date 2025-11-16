<template>
  <div v-if="!isEditing" 
    class="text-node"
    :style="textStyle"
    @dblclick="startEditing"
  >
    {{ item.data.text || 'Double-click to edit' }}
  </div>
  <textarea
    v-else
    ref="textareaRef"
    v-model="localText"
    class="text-editor"
    :style="textStyle"
    @blur="finishEditing"
    @keydown.esc="cancelEditing"
    @keydown.ctrl.enter="finishEditing"
    @click.stop
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

const props = defineProps<{
  item: DmScreenItem
}>()

const emit = defineEmits<{
  'update:text': [text: string]
  'update:fontSize': [size: number]
  'update:fontWeight': [weight: string]
  'update:textColor': [color: string]
  'update:textAlign': [align: string]
}>()

const isEditing = ref(false)
const localText = ref(props.item.data.text || '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Computed text style based on item data
const textStyle = computed(() => {
  const data = props.item.data
  return {
    fontSize: `${data.fontSize || 16}px`,
    fontWeight: data.fontWeight || 'normal',
    color: data.textColor || '#ffffff',
    textAlign: (data.textAlign || 'left') as 'left' | 'center' | 'right',
  }
})

// Watch for external changes to item text
watch(() => props.item.data.text, (newText) => {
  if (!isEditing.value) {
    localText.value = newText || ''
  }
}, { immediate: true })

function startEditing() {
  isEditing.value = true
  localText.value = props.item.data.text || ''
  nextTick(() => {
    textareaRef.value?.focus()
    textareaRef.value?.select()
  })
}

function finishEditing() {
  if (isEditing.value) {
    emit('update:text', localText.value)
    isEditing.value = false
  }
}

function cancelEditing() {
  localText.value = props.item.data.text || ''
  isEditing.value = false
}
</script>

<style scoped>
.text-node {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  cursor: text;
  user-select: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.text-editor {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(99, 102, 241, 0.6);
  border-radius: 4px;
  padding: 8px;
  resize: none;
  outline: none;
  font-family: inherit;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.text-editor:focus {
  border-color: rgba(99, 102, 241, 0.9);
  background: rgba(0, 0, 0, 0.4);
}
</style>

