<template>
  <v-dialog v-model="dialogOpen" max-width="480" persistent>
    <v-card class="text-node-settings-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-text-box-edit" class="mr-2" />
        Note Settings
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-text class="settings-body">
        <!-- Presets -->
        <div class="settings-section">
          <div class="section-label">Preset</div>
          <div class="preset-grid">
            <div
              v-for="preset in presets"
              :key="preset.id"
              class="preset-chip"
              :class="{ active: localData.notePreset === preset.id }"
              :style="presetPreviewStyle(preset)"
              @click="applyPreset(preset)"
            >
              <v-icon :icon="preset.icon" size="16" />
              <span class="preset-name">{{ preset.name }}</span>
            </div>
          </div>
        </div>

        <v-divider class="my-3" />

        <!-- Category -->
        <div class="settings-section">
          <div class="section-label">Category</div>
          <div class="category-grid">
            <v-chip
              v-for="cat in categories"
              :key="cat.id"
              :color="cat.color"
              :variant="localData.noteCategory === cat.id ? 'flat' : 'outlined'"
              size="small"
              class="category-chip"
              @click="toggleCategory(cat.id)"
            >
              <v-icon :icon="cat.icon" start size="14" />
              {{ cat.name }}
            </v-chip>
          </div>
        </div>

        <v-divider class="my-3" />

        <!-- Text Styling -->
        <div class="settings-section">
          <div class="section-label">Text</div>
          <div class="settings-row">
            <v-text-field
              v-model="localData.title"
              label="Note Title (Optional)"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-3"
            />
          </div>
          <div class="settings-row">
            <v-slider
              v-model="localData.fontSize"
              label="Size"
              :min="10"
              :max="32"
              :step="1"
              thumb-label
              density="compact"
              hide-details
              class="flex-grow-1"
            />
          </div>
          <div class="settings-row mt-2">
            <v-btn-toggle v-model="localData.fontWeight" mandatory density="compact">
              <v-btn value="normal" size="small">Normal</v-btn>
              <v-btn value="bold" size="small">
                <strong>Bold</strong>
              </v-btn>
            </v-btn-toggle>
            <v-btn-toggle v-model="localData.textAlign" mandatory density="compact" class="ml-2">
              <v-btn value="left" size="small" icon="mdi-format-align-left" />
              <v-btn value="center" size="small" icon="mdi-format-align-center" />
              <v-btn value="right" size="small" icon="mdi-format-align-right" />
            </v-btn-toggle>
          </div>
          <div class="settings-row mt-2">
            <label class="color-label">Text Color</label>
            <input
              v-model="localData.textColor"
              type="color"
              class="color-picker"
            />
          </div>
        </div>

        <v-divider class="my-3" />

        <!-- Background Styling -->
        <div class="settings-section">
          <div class="section-label">Background</div>
          <div class="settings-row">
            <label class="color-label">Color</label>
            <input
              v-model="localData.backgroundColor"
              type="color"
              class="color-picker"
            />
          </div>
          <div class="settings-row mt-2">
            <v-slider
              v-model="localData.backgroundOpacity"
              label="Opacity"
              :min="0"
              :max="1"
              :step="0.05"
              thumb-label
              density="compact"
              hide-details
              class="flex-grow-1"
            />
          </div>
          <div class="settings-row mt-2">
            <v-slider
              v-model="localData.borderRadius"
              label="Corners"
              :min="0"
              :max="24"
              :step="1"
              thumb-label
              density="compact"
              hide-details
              class="flex-grow-1"
            />
          </div>
        </div>

        <v-divider class="my-3" />

        <!-- Options -->
        <div class="settings-section">
          <div class="section-label">Options</div>
          <v-switch
            v-model="localData.useMarkdown"
            label="Render Markdown"
            density="compact"
            hide-details
            color="primary"
          />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'
import { TEXT_NOTE_PRESETS, NOTE_CATEGORIES } from '@/types/dmScreen.types'
import type { TextNotePreset } from '@/types/dmScreen.types'

interface Props {
  modelValue: boolean
  item: DmScreenItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [data: Record<string, any>]
}>()

const dialogOpen = ref(props.modelValue)
const presets = TEXT_NOTE_PRESETS
const categories = NOTE_CATEGORIES

// Local copy of item data for editing
const localData = ref<Record<string, any>>({})

watch(() => props.modelValue, (val) => {
  dialogOpen.value = val
  if (val && props.item) {
    localData.value = { ...props.item.data }
  }
})

watch(dialogOpen, (val) => {
  emit('update:modelValue', val)
})

function presetPreviewStyle(preset: TextNotePreset) {
  return {
    backgroundColor: preset.backgroundColor,
    color: preset.textColor,
    borderRadius: `${preset.borderRadius}px`,
  }
}

function applyPreset(preset: TextNotePreset) {
  localData.value.notePreset = preset.id
  localData.value.backgroundColor = preset.backgroundColor
  localData.value.backgroundOpacity = preset.backgroundOpacity
  localData.value.textColor = preset.textColor
  localData.value.borderRadius = preset.borderRadius
}

function toggleCategory(catId: string) {
  if (localData.value.noteCategory === catId) {
    localData.value.noteCategory = undefined
    localData.value.categoryColor = undefined
  } else {
    localData.value.noteCategory = catId
    const cat = categories.find(c => c.id === catId)
    if (cat) localData.value.categoryColor = cat.color
  }
}

function close() {
  dialogOpen.value = false
}

function save() {
  emit('save', { ...localData.value })
  dialogOpen.value = false
}
</script>

<style scoped>
.text-node-settings-card {
  background: rgba(22, 22, 32, 0.98) !important;
  backdrop-filter: blur(16px);
}

.settings-body {
  max-height: 60vh;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.settings-section {
  margin-bottom: 4px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
  margin-bottom: 6px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.preset-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
  font-weight: 500;
}

.preset-chip:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.preset-chip.active {
  border-color: rgba(99, 102, 241, 0.8);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
}

.preset-name {
  white-space: nowrap;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-chip {
  cursor: pointer;
}

.settings-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-label {
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
  min-width: 70px;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border-radius: 4px;
  border: none;
}
</style>
