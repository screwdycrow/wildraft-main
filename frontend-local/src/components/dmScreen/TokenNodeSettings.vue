<template>
  <v-card min-width="300" class="node-settings-card">
    <v-card-text class="pa-4">
      <div class="text-h6 mb-4 d-flex align-center">
        <v-icon icon="mdi-circle-outline" size="medium" class="mr-2" />
        <span>Token Settings</span>
      </div>
      
      <div class="settings-section mb-4">
        <!-- Show Label -->
        <div class="setting-item mb-3">
          <div class="d-flex align-center justify-space-between">
            <span class="text-body-2">Show Name</span>
            <v-switch
              v-model="tokenShowLabel"
              density="compact"
              hide-details
              color="primary"
            />
          </div>
        </div>
        
        <!-- Border Width -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2 d-flex justify-space-between align-center">
            <span>Border Width</span>
            <span class="text-caption text-medium-emphasis">{{ tokenBorderWidth }}px</span>
          </div>
          <v-slider
            v-model="tokenBorderWidth"
            :min="0"
            :max="8"
            :step="1"
            thumb-label
            density="compact"
            hide-details
            color="primary"
          />
        </div>
        
        <!-- Border Color -->
        <div class="setting-item mb-3">
          <div class="text-caption mb-2">Border Color</div>
          <div class="d-flex gap-1 flex-wrap mb-2">
            <div
              v-for="color in borderColorPresets"
              :key="color"
              class="color-preset"
              :class="{ active: tokenBorderColor === color }"
              :style="{ backgroundColor: color }"
              @click="tokenBorderColor = color"
            />
          </div>
          <v-text-field
            v-model="tokenBorderColor"
            label="Custom Color"
            density="compact"
            hide-details
            variant="outlined"
          >
            <template #prepend-inner>
              <div 
                class="color-preview" 
                :style="{ backgroundColor: tokenBorderColor }"
              />
            </template>
          </v-text-field>
        </div>
      </div>
      
      <v-btn
        block
        size="default"
        color="primary"
        variant="flat"
        class="mt-2"
        @click="$emit('save')"
      >
        <v-icon icon="mdi-check" size="small" class="mr-2" />
        Apply Changes
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  showLabel?: boolean
  borderWidth?: number
  borderColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: true,
  borderWidth: 0,
  borderColor: '#6366f1',
})

const emit = defineEmits<{
  'save': []
}>()

const tokenShowLabel = ref(props.showLabel)
const tokenBorderWidth = ref(props.borderWidth)
const tokenBorderColor = ref(props.borderColor)

const borderColorPresets = [
  '#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6',
  '#8b5cf6', '#ec4899', '#ffffff', '#000000', 'transparent',
]

defineExpose({
  getValues: () => ({
    tokenShowLabel: tokenShowLabel.value,
    tokenBorderWidth: tokenBorderWidth.value,
    tokenBorderColor: tokenBorderColor.value,
  })
})
</script>

<style scoped>
.node-settings-card {
  background: rgba(30, 30, 40, 0.98) !important;
  backdrop-filter: blur(10px);
}

.settings-section {
  background: rgba(var(--v-theme-surface), 0.3);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.setting-item {
  padding: 8px 0;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.1);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.color-preset {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.color-preset:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.color-preset.active {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary-rgb, 99, 102, 241), 0.3), 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>

