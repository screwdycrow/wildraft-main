<template>
  <div v-if="password" class="password-strength">
    <div class="d-flex align-center mb-2">
      <v-progress-linear
        :model-value="strengthPercentage"
        :color="strengthColor"
        height="8"
        rounded
        class="flex-grow-1"
      />
      <span class="text-caption ml-3" :style="{ color: strengthColor }">
        {{ strengthText }}
      </span>
    </div>

    <v-list density="compact" class="bg-transparent">
      <v-list-item
        v-for="requirement in requirements"
        :key="requirement.text"
        density="compact"
        class="px-0"
      >
        <template #prepend>
          <v-icon
            :icon="requirement.met ? 'mdi-check-circle' : 'mdi-circle-outline'"
            :color="requirement.met ? 'success' : 'grey'"
            size="small"
          />
        </template>
        <v-list-item-title class="text-caption">
          {{ requirement.text }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  password: string
}>()

const requirements = computed(() => [
  { text: 'At least 8 characters', met: props.password.length >= 8 },
  { text: 'Contains uppercase letter', met: /[A-Z]/.test(props.password) },
  { text: 'Contains lowercase letter', met: /[a-z]/.test(props.password) },
  { text: 'Contains number', met: /[0-9]/.test(props.password) },
])

const metCount = computed(() => requirements.value.filter((r) => r.met).length)

const strengthPercentage = computed(() => (metCount.value / requirements.value.length) * 100)

const strengthColor = computed(() => {
  if (metCount.value <= 1) return '#EF4444'
  if (metCount.value === 2) return '#FB923C'
  if (metCount.value === 3) return '#FACC15'
  return '#10B981'
})

const strengthText = computed(() => {
  if (metCount.value <= 1) return 'Weak'
  if (metCount.value === 2) return 'Fair'
  if (metCount.value === 3) return 'Good'
  return 'Strong'
})
</script>






