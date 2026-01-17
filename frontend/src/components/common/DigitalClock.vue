<template>
  <div class="digital-clock" :class="{ 'compact': compact }">
    <div class="clock-time">{{ formattedTime }}</div>
    <div v-if="!compact" class="clock-date">{{ formattedDate }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const currentTime = ref(new Date())

const formattedTime = computed(() => {
  const hours = currentTime.value.getHours().toString().padStart(2, '0')
  const minutes = currentTime.value.getMinutes().toString().padStart(2, '0')
  const seconds = currentTime.value.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
})

const formattedDate = computed(() => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return currentTime.value.toLocaleDateString('en-US', options)
})

let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  intervalId = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.digital-clock {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: none;
  backdrop-filter: blur(10px);
}

.digital-clock.compact {
  padding: 6px 12px;
  background: rgba(var(--v-theme-surface), 0.2);
  border: none;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.digital-clock.compact:hover {
  opacity: 1;
  background: rgba(var(--v-theme-surface), 0.3);
}

.clock-time {
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 2px;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.digital-clock.compact .clock-time {
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 0;
  text-shadow: none;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.clock-date {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

@media (max-width: 600px) {
  .clock-time {
    font-size: 2rem;
  }
  
  .clock-date {
    font-size: 0.75rem;
  }
  
  .digital-clock.compact .clock-time {
    font-size: 0.75rem;
  }
}
</style>

