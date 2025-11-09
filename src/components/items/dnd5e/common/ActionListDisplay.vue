<template>
  <v-card v-if="actions && actions.length > 0" class="glass-card mb-4" elevation="0">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-sword" class="mr-2" color="error" />
      Actions
    </v-card-title>
    <v-card-text>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="(action, index) in actions" :key="index">
          <v-expansion-panel-title>
            <div class="d-flex align-center gap-2">
              <strong>{{ action.name }}</strong>
              <v-chip
                v-if="action.actionType"
                size="x-small"
                :color="getActionTypeColor(action.actionType)"
              >
                {{ getActionTypeLabel(action.actionType) }}
              </v-chip>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-if="action.roll" class="mb-2">
              <v-icon icon="mdi-dice-d20" size="small" class="mr-1" />
              <strong>Roll:</strong> {{ action.roll }}
            </div>
            <div v-if="action.range" class="mb-2">
              <v-icon icon="mdi-target" size="small" class="mr-1" />
              <strong>Range:</strong> {{ action.range }}
            </div>
            <div v-html="action.description || 'No description'" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Action } from '@/types/item.types'

interface Props {
  actions?: Action[]
}

defineProps<Props>()

function getActionTypeColor(type: string): string {
  switch (type) {
    case 'action': return 'primary'
    case 'bonus': return 'success'
    case 'reaction': return 'warning'
    case 'legendary': return 'purple'
    default: return 'grey'
  }
}

function getActionTypeLabel(type: string): string {
  switch (type) {
    case 'action': return 'Action'
    case 'bonus': return 'Bonus'
    case 'reaction': return 'Reaction'
    case 'legendary': return 'Legendary'
    default: return type
  }
}
</script>

<style scoped>
/* Inherit global styles */
</style>


