<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="action.name"
        label="Action Name"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-select
        v-model="action.actionType"
        :items="actionTypes"
        label="Action Type"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="action.roll"
        label="Attack Roll (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., +5 to hit, 1d20+5"
        hint="Attack bonus or dice formula"
        persistent-hint
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="action.range"
        label="Range (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., 5 ft., 60 ft."
        hint="Reach or range of the action"
        persistent-hint
      />
    </v-col>
    <v-col cols="12">
      <v-textarea
        v-model="action.description"
        label="Description"
        variant="outlined"
        rows="4"
        placeholder="Describe the action's effects, damage, and any special conditions..."
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { Action } from '@/types/item.types'

interface Props {
  action: Action
}

defineProps<Props>()

const actionTypes = [
  { title: 'Action', value: 'action' },
  { title: 'Bonus Action', value: 'bonus' },
  { title: 'Reaction', value: 'reaction' },
  { title: 'Legendary Action', value: 'legendary' },
]
</script>

