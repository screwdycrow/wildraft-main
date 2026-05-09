<template>
  <div class="timer-widget" :style="widgetStyle">
    <div class="widget-header d-flex align-center">
      <v-icon :icon="currentPresetIcon" size="small" class="mr-2" :color="currentPresetColor" />
      <v-text-field
        v-model="localTitle"
        variant="plain"
        density="compact"
        placeholder="Timer name..."
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
              :items="timerPresets"
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
    
    <div class="timer-content d-flex flex-column align-center justify-center py-2">
      <div class="timer-display" :class="{ 'timer-running': isRunning, 'timer-finished': isFinished }" :style="{ color: isRunning ? currentPresetColor : (isFinished ? '#ff5252' : 'white') }">
        {{ formattedTime }}
      </div>
      
      <div class="timer-controls mt-2 d-flex gap-2">
        <v-btn
          v-if="!isRunning"
          icon="mdi-play"
          variant="tonal"
          size="small"
          :color="currentPresetColor"
          @click="startTimer"
        />
        <v-btn
          v-else
          icon="mdi-pause"
          variant="tonal"
          size="small"
          color="warning"
          @click="pauseTimer"
        />
        
        <v-btn
          icon="mdi-refresh"
          variant="tonal"
          size="small"
          @click="resetTimer"
        />
        
        <v-menu location="bottom center" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              icon="mdi-timer-cog"
              variant="tonal"
              size="small"
              v-bind="props"
            />
          </template>
          <v-list density="compact" width="200" class="pa-2">
            <v-list-subheader>Set Duration</v-list-subheader>
            <div class="d-flex flex-wrap gap-1 mb-2">
              <v-btn size="x-small" variant="outlined" @click="setDuration(60)">1m</v-btn>
              <v-btn size="x-small" variant="outlined" @click="setDuration(300)">5m</v-btn>
              <v-btn size="x-small" variant="outlined" @click="setDuration(600)">10m</v-btn>
              <v-btn size="x-small" variant="outlined" @click="setDuration(1800)">30m</v-btn>
              <v-btn size="x-small" variant="outlined" @click="setDuration(3600)">1h</v-btn>
            </div>
            <v-divider class="mb-2" />
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model.number="customMinutes"
                type="number"
                label="Mins"
                density="compact"
                variant="outlined"
                hide-details
              />
              <v-btn size="small" color="primary" @click="setDuration(customMinutes * 60)">Set</v-btn>
            </div>
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'

interface Props {
  item: DmScreenItem
}

const emit = defineEmits<{
  update: [item: DmScreenItem]
}>()

const props = defineProps<Props>()

const timerPresets = [
  { id: 'generic', name: 'Generic Timer', icon: 'mdi-timer-outline', color: '#6366f1' },
  { id: 'ritual', name: 'Ritual Cast', icon: 'mdi-auto-fix', color: '#a855f7' },
  { id: 'short-rest', name: 'Short Rest', icon: 'mdi-bed-outline', color: '#3b82f6' },
  { id: 'long-rest', name: 'Long Rest', icon: 'mdi-weather-night', color: '#1e3a8a' },
  { id: 'encounter', name: 'Encounter', icon: 'mdi-sword', color: '#ef4444' },
  { id: 'spell-effect', name: 'Spell Effect', icon: 'mdi-sparkles', color: '#06b6d4' },
]

const localTitle = ref(props.item.data.title || 'Timer')
const timeLeft = ref(props.item.data.timeLeft ?? 300)
const totalTime = ref(props.item.data.totalTime ?? 300)
const localPreset = ref(props.item.data.preset || 'generic')
const isRunning = ref(false)
const localBgColor = ref(props.item.data.backgroundColor || '#1e1e2e')
const localOpacity = ref(props.item.data.backgroundOpacity ?? 0.8)
const localBlur = ref(props.item.data.blur ?? 10)

const customMinutes = ref(Math.floor(totalTime.value / 60))
let timerInterval: any = null

const currentPreset = computed(() => timerPresets.find(p => p.id === localPreset.value) || timerPresets[0])
const currentPresetIcon = computed(() => currentPreset.value.icon)
const currentPresetColor = computed(() => currentPreset.value.color)

const isFinished = computed(() => timeLeft.value <= 0)

const formattedTime = computed(() => {
  const absTime = Math.abs(timeLeft.value)
  const minutes = Math.floor(absTime / 60)
  const seconds = Math.floor(absTime % 60)
  const prefix = timeLeft.value < 0 ? '-' : ''
  return `${prefix}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Request notification permission on mount
if (typeof window !== 'undefined' && 'Notification' in window) {
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

function sendNotification() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('Timer Finished!', {
      body: `"${localTitle.value}" has reached 0:00.`,
      icon: '/favicon.ico' // Or a specific icon
    })
  }
}

watch(() => props.item.data, (newData) => {
  localTitle.value = newData.title || 'Timer'
  if (!isRunning.value) {
    timeLeft.value = newData.timeLeft ?? 300
  }
  totalTime.value = newData.totalTime ?? 300
  localPreset.value = newData.preset || 'generic'
  localBgColor.value = newData.backgroundColor || '#1e1e2e'
  localOpacity.value = newData.backgroundOpacity ?? 0.8
  localBlur.value = newData.blur ?? 10
}, { deep: true })

function applyPreset(presetId: string) {
  const preset = timerPresets.find(p => p.id === presetId)
  if (preset) {
    localTitle.value = preset.name
    updateWidget()
  }
}

function startTimer() {
  if (isRunning.value) return
  isRunning.value = true
  
  timerInterval = setInterval(() => {
    timeLeft.value -= 1
    
    // Check if finished
    if (timeLeft.value === 0) {
      sendNotification()
    }

    if (timeLeft.value % 10 === 0 || timeLeft.value <= 0) {
      updateWidget()
    }
  }, 1000)
}

function pauseTimer() {
  if (!isRunning.value) return
  isRunning.value = false
  clearInterval(timerInterval)
  updateWidget()
}

function resetTimer() {
  pauseTimer()
  timeLeft.value = totalTime.value
  updateWidget()
}

function setDuration(seconds: number) {
  pauseTimer()
  totalTime.value = seconds
  timeLeft.value = seconds
  customMinutes.value = Math.floor(seconds / 60)
  updateWidget()
}

function updateWidget() {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      title: localTitle.value,
      timeLeft: timeLeft.value,
      totalTime: totalTime.value,
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

onBeforeUnmount(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.timer-widget {
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

.timer-display {
  font-size: 3.5rem;
  font-weight: 900;
  font-family: 'Outfit', 'monospace';
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
  line-height: 1;
  transition: all 0.3s ease;
  margin: 10px 0;
}

.timer-running {
  text-shadow: 0 0 25px currentColor;
}

.timer-finished {
  color: #ff5252 !important;
  text-shadow: 0 0 25px rgba(255, 82, 82, 0.6);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

.hover-opacity {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.hover-opacity:hover {
  opacity: 1;
}

.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
</style>
