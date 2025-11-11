<template>
  <v-chip
    :size="size"
    :variant="variant"
    :class="chipClass"
    :style="textColor ? { color: textColor } : undefined"
  >
    <v-icon 
      :icon="actionIcon" 
      :size="iconSize" 
      :color="iconColor"
      start
    />
    {{ action.name }}
    <v-tooltip v-if="showTooltip" activator="parent" location="top" max-width="400">
      <div class="action-tooltip">
        <div class="action-tooltip-header">
          <strong>{{ action.name }}</strong>
          <v-chip 
            v-if="action.actionType" 
            :size="size === 'small' ? 'x-small' : 'small'" 
            variant="tonal"
            :color="chipColor"
            class="ml-2"
          >
            {{ getActionTypeLabel(action.actionType) }}
          </v-chip>
        </div>
        <div v-if="action.toHit || action.dc || action.roll" class="action-tooltip-stats">
          <span v-if="action.toHit" class="mr-2">To Hit: {{ action.toHit }}</span>
          <span v-if="action.dc" class="mr-2">DC: {{ action.dc }}</span>
          <span v-if="action.roll">{{ action.roll }}</span>
          <span v-if="action.range" class="ml-2">Range: {{ action.range }}</span>
        </div>
        <div v-if="action.description" class="action-tooltip-description">
          {{ action.description }}
        </div>
      </div>
    </v-tooltip>
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Action } from '@/types/item.types'

interface Props {
  action: Action
  size?: 'x-small' | 'small' | 'default'
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated'
  showTooltip?: boolean
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'x-small',
  variant: 'tonal',
  showTooltip: true,
  textColor: undefined,
})

const actionIcon = computed(() => {
  if (!props.action.actionType) return 'mdi-sword'
  
  const iconMap: Record<string, string> = {
    action: 'mdi-sword',
    bonus: 'mdi-lightning-bolt',
    reaction: 'mdi-shield-alert',
    legendary: 'mdi-star',
    lair: 'mdi-castle',
  }
  
  return iconMap[props.action.actionType.toLowerCase()] || 'mdi-sword'
})

const iconColor = computed(() => {
  if (!props.action.actionType) return 'primary'
  
  const colorMap: Record<string, string> = {
    action: 'primary',
    bonus: 'success',
    reaction: 'warning',
    legendary: 'purple',
    lair: 'info',
  }
  
  return colorMap[props.action.actionType.toLowerCase()] || 'primary'
})

const chipColor = computed(() => {
  // Keep for tooltip chip color
  return iconColor.value
})

const iconSize = computed(() => {
  if (props.size === 'x-small') return 'x-small'
  if (props.size === 'small') return 'small'
  return 'default'
})

const chipClass = computed(() => {
  return props.showTooltip ? 'action-chip' : ''
})

function getActionTypeLabel(type: string): string {
  switch (type) {
    case 'action': return 'Action'
    case 'bonus': return 'Bonus'
    case 'reaction': return 'Reaction'
    case 'legendary': return 'Legendary'
    case 'lair': return 'Lair'
    default: return type
  }
}
</script>

<style scoped>
.action-chip {
  cursor: help;
  transition: all 0.2s ease;
}

.action-chip:hover {
  transform: scale(1.05);
}

/* Apply text color to chip content when textColor prop is provided */
.action-chip :deep(.v-chip__content) {
  color: inherit;
}

.action-tooltip {
  padding: 4px;
  color: rgb(var(--v-theme-on-surface));
}

.action-tooltip-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  color: rgb(var(--v-theme-on-surface));
}

.action-tooltip-stats {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-bottom: 4px;
  color: rgb(var(--v-theme-on-surface));
}

.action-tooltip-description {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 4px;
  color: rgb(var(--v-theme-on-surface));
}
</style>

