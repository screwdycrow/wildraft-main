<template>
  <div 
    v-if="!isEditing"
    class="shape-node"
    @dblclick="startEditing"
  >
    <svg class="shape-svg" viewBox="0 0 100 100">
      <!-- Circle -->
      <circle
        v-if="item.data.shape === 'circle'"
        cx="50"
        cy="50"
        r="45"
        :fill="item.data.color || '#6366f1'"
        :fill-opacity="item.data.opacity || 0.8"
        :stroke="item.data.borderColor || '#ffffff'"
        :stroke-width="item.data.borderWidth || 2"
      />
      <!-- Square -->
      <rect
        v-else-if="item.data.shape === 'square'"
        x="5"
        y="5"
        width="90"
        height="90"
        :fill="item.data.color || '#6366f1'"
        :fill-opacity="item.data.opacity || 0.8"
        :stroke="item.data.borderColor || '#ffffff'"
        :stroke-width="item.data.borderWidth || 2"
      />
      <!-- Triangle -->
      <polygon
        v-else-if="item.data.shape === 'triangle'"
        points="50,5 95,95 5,95"
        :fill="item.data.color || '#6366f1'"
        :fill-opacity="item.data.opacity || 0.8"
        :stroke="item.data.borderColor || '#ffffff'"
        :stroke-width="item.data.borderWidth || 2"
      />
    </svg>
    <div v-if="item.data.label" class="shape-label">
      {{ item.data.label }}
    </div>
  </div>

  <!-- Edit Dialog -->
  <v-dialog v-else v-model="isEditing" max-width="400">
      <v-card>
        <v-card-title>Edit Shape</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-select
            v-model="localData.shape"
            label="Shape"
            :items="[
              { title: 'Circle', value: 'circle' },
              { title: 'Square', value: 'square' },
              { title: 'Triangle', value: 'triangle' },
            ]"
            density="compact"
            class="mb-3"
          />
          
          <v-text-field
            v-model="localData.label"
            label="Label"
            density="compact"
            class="mb-3"
          />
          
          <v-text-field
            v-model="localData.color"
            label="Fill Color"
            type="color"
            density="compact"
            class="mb-3"
          />
          
          <v-slider
            v-model="localData.opacity"
            label="Opacity"
            min="0"
            max="1"
            step="0.05"
            thumb-label
            class="mb-3"
          />
          
          <v-text-field
            v-model="localData.borderColor"
            label="Border Color"
            type="color"
            density="compact"
            class="mb-3"
          />
          
          <v-slider
            v-model="localData.borderWidth"
            label="Border Width"
            min="0"
            max="10"
            step="1"
            thumb-label
          />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelEditing">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="finishEditing">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

const props = defineProps<{
  item: DmScreenItem
}>()

const emit = defineEmits<{
  'update:shape': [shape: 'circle' | 'square' | 'triangle']
  'update:color': [color: string]
  'update:opacity': [opacity: number]
  'update:borderColor': [color: string]
  'update:borderWidth': [width: number]
  'update:label': [label: string]
  'update:data': [data: any]
}>()

const isEditing = ref(false)
const localData = ref({
  shape: props.item.data.shape || 'circle',
  color: props.item.data.color || '#6366f1',
  opacity: props.item.data.opacity ?? 0.8,
  borderColor: props.item.data.borderColor || '#ffffff',
  borderWidth: props.item.data.borderWidth || 2,
  label: props.item.data.label || '',
})

// Watch for external changes to item data
watch(() => props.item.data, (newData) => {
  if (!isEditing.value) {
    localData.value = {
      shape: newData.shape || 'circle',
      color: newData.color || '#6366f1',
      opacity: newData.opacity ?? 0.8,
      borderColor: newData.borderColor || '#ffffff',
      borderWidth: newData.borderWidth || 2,
      label: newData.label || '',
    }
  }
}, { immediate: true, deep: true })

function startEditing() {
  localData.value = {
    shape: props.item.data.shape || 'circle',
    color: props.item.data.color || '#6366f1',
    opacity: props.item.data.opacity ?? 0.8,
    borderColor: props.item.data.borderColor || '#ffffff',
    borderWidth: props.item.data.borderWidth || 2,
    label: props.item.data.label || '',
  }
  isEditing.value = true
}

function finishEditing() {
  if (isEditing.value) {
    emit('update:data', localData.value)
    isEditing.value = false
  }
}

function cancelEditing() {
  isEditing.value = false
}
</script>

<style scoped>
.shape-node {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.shape-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.shape-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  pointer-events: none;
  max-width: 80%;
  word-wrap: break-word;
}
</style>

