<template>
  <div class="counter-widget" :style="widgetStyle">
    <div class="widget-header d-flex align-center">
      <v-icon :icon="currentPresetIcon" size="small" class="mr-2" :color="currentPresetColor" />
      <v-text-field
        v-model="localTitle"
        variant="plain"
        density="compact"
        placeholder="Counter name..."
        hide-details
        class="widget-title-input"
        @blur="updateWidget"
      />
      <v-menu :close-on-content-click="false" location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props" class="ml-1 hover-opacity" />
        </template>
        <v-card width="280">
          <v-card-text>
            <div class="text-caption mb-2">Preset Type</div>
            <v-select
              v-model="localPreset"
              :items="counterPresets"
              item-title="name"
              item-value="id"
              density="compact"
              variant="outlined"
              hide-details
              class="mb-4"
              @update:model-value="applyPreset"
            />

            <div class="text-caption mb-2">Appearance</div>
            <div class="text-caption text-grey-darken-1 mb-1">Background Color</div>
            <v-color-picker v-model="localBgColor" mode="hex" hide-inputs elevation="0" @update:model-value="updateWidget" />
            <div class="text-caption mt-4 mb-2">Opacity</div>
            <v-slider v-model="localOpacity" min="0" max="1" step="0.05" thumb-label hide-details @update:model-value="updateWidget" />
            <div class="text-caption mt-4 mb-2">Blur Amount</div>
            <v-slider v-model="localBlur" min="0" max="20" step="1" thumb-label hide-details @update:model-value="updateWidget" />
          </v-card-text>
        </v-card>
      </v-menu>
    </div>
    
    <div class="counter-content d-flex flex-column align-center justify-center py-2">
      <div class="counter-display d-flex align-center justify-center">
        <v-btn
          icon="mdi-minus"
          variant="tonal"
          size="small"
          :color="currentPresetColor"
          class="mr-2"
          @click="decrement"
        />
        
        <div class="counter-value-input-wrapper">
          <input
            v-model.number="localValue"
            type="number"
            class="counter-value-input"
            @blur="updateWidget"
            @keydown.enter="$event.target.blur()"
          />
        </div>
        
        <v-btn
          icon="mdi-plus"
          variant="tonal"
          size="small"
          :color="currentPresetColor"
          class="ml-2"
          @click="increment"
        />
      </div>
      
      <div class="counter-controls mt-2 d-flex gap-2">
        <v-btn
          size="x-small"
          variant="text"
          prepend-icon="mdi-refresh"
          @click="reset"
        >
          Reset
        </v-btn>
        <v-btn
          size="x-small"
          variant="text"
          :prepend-icon="localStep === 1 ? 'mdi-numeric-1-box' : (localStep === 5 ? 'mdi-numeric-5-box' : 'mdi-numeric-10-box')"
          @click="toggleStep"
        >
          Step: {{ localStep }}
        </v-btn>
      </div>
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

const counterPresets = [
  { id: 'generic', name: 'Generic', icon: 'mdi-counter', color: '#6366f1' },
  { id: 'health', name: 'Health / HP', icon: 'mdi-heart', color: '#ef4444' },
  { id: 'gold', name: 'Gold / GP', icon: 'mdi-gold', color: '#fbbf24' },
  { id: 'xp', name: 'Experience / XP', icon: 'mdi-star', color: '#a855f7' },
  { id: 'spell-slots', name: 'Spell Slots', icon: 'mdi-crystal-ball', color: '#3b82f6' },
  { id: 'initiative', name: 'Initiative', icon: 'mdi-sword-cross', color: '#f97316' },
  { id: 'mana', name: 'Mana / Energy', icon: 'mdi-lightning-bolt', color: '#06b6d4' },
]

const localTitle = ref(props.item.data.title || 'Counter')
const localValue = ref(props.item.data.value ?? 0)
const localStep = ref(props.item.data.step || 1)
const localPreset = ref(props.item.data.preset || 'generic')
const localBgColor = ref(props.item.data.backgroundColor || '#1e1e2e')
const localOpacity = ref(props.item.data.backgroundOpacity ?? 0.8)
const localBlur = ref(props.item.data.blur ?? 10)

const currentPreset = computed(() => counterPresets.find(p => p.id === localPreset.value) || counterPresets[0])
const currentPresetIcon = computed(() => currentPreset.value.icon)
const currentPresetColor = computed(() => currentPreset.value.color)

watch(() => props.item.data, (newData) => {
  localTitle.value = newData.title || 'Counter'
  localValue.value = newData.value ?? 0
  localStep.value = newData.step || 1
  localPreset.value = newData.preset || 'generic'
  localBgColor.value = newData.backgroundColor || '#1e1e2e'
  localOpacity.value = newData.backgroundOpacity ?? 0.8
  localBlur.value = newData.blur ?? 10
}, { deep: true })

function applyPreset(presetId: string) {
  const preset = counterPresets.find(p => p.id === presetId)
  if (preset) {
    localTitle.value = preset.name
    updateWidget()
  }
}

function increment() {
  localValue.value += localStep.value
  updateWidget()
}

function decrement() {
  localValue.value -= localStep.value
  updateWidget()
}

function reset() {
  localValue.value = 0
  updateWidget()
}

function toggleStep() {
  if (localStep.value === 1) localStep.value = 5
  else if (localStep.value === 5) localStep.value = 10
  else localStep.value = 1
  updateWidget()
}

function updateWidget() {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      title: localTitle.value,
      value: localValue.value,
      step: localStep.value,
      preset: localPreset.value,
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

const widgetStyle = computed(() => {
  const bgColor = localBgColor.value
  const opacity = localOpacity.value
  const blur = localBlur.value

  return {
    backgroundColor: hexToRgba(bgColor, opacity),
    backdropFilter: blur > 0 ? `blur(${blur}px)` : 'none',
    WebkitBackdropFilter: blur > 0 ? `blur(${blur}px)` : 'none',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  }
})
</script>

<style scoped>
.counter-widget {
  padding: 12px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  color: white;
}

.widget-header {
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 4px;
}

.widget-title-input :deep(.v-field__input) {
  font-weight: 600;
  font-size: 14px;
  padding-top: 4px;
  padding-bottom: 4px;
  color: rgba(255, 255, 255, 0.9);
}

.counter-value-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.counter-value-input {
  background: transparent;
  border: none;
  color: white;
  font-size: 3.5rem;
  font-weight: 900;
  font-family: 'Outfit', 'Inter', sans-serif;
  text-align: center;
  width: 120px;
  outline: none;
  appearance: none;
  -moz-appearance: textfield;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.counter-value-input::-webkit-outer-spin-button,
.counter-value-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.counter-value-input:focus {
  text-shadow: 0 0 25px rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.hover-opacity {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.hover-opacity:hover {
  opacity: 1;
}

.gap-2 {
  gap: 8px;
}
</style>
