<template>
  <v-row>
    <v-col cols="12" md="8">
      <v-text-field
        v-model="spell.name"
        label="Spell Name"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-select
        v-model.number="spell.level"
        :items="spellLevels"
        label="Spell Level"
        variant="outlined"
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="spell.school"
        label="School (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., Evocation, Abjuration"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="spell.castingTime"
        label="Casting Time (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., 1 action, 1 bonus action"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="spell.range"
        label="Range (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., Touch, 60 feet"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="spell.components"
        label="Components (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., V, S, M (a pinch of dust)"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="spell.toHit"
        label="To Hit / Bonus (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="+7"
      />
    </v-col>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="spell.dc"
        label="Save DC (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="15 (DEX)"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-text-field
        v-model="spell.duration"
        label="Duration (optional)"
        variant="outlined"
        density="comfortable"
        placeholder="e.g., Instantaneous, 1 hour"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-checkbox
        v-model="spell.concentration"
        label="Requires Concentration"
        color="purple"
        hide-details
        density="comfortable"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-checkbox
        v-model="spell.ritual"
        label="Can be Cast as Ritual"
        color="blue"
        hide-details
        density="comfortable"
      />
    </v-col>
    <v-col cols="12">
      <v-textarea
        v-model="spell.description"
        label="Spell Description"
        variant="outlined"
        rows="4"
        placeholder="Describe the spell's effects..."
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { Spell } from '@/types/item.types'

interface Props {
  spell: Spell
}

defineProps<Props>()

const spellLevels = [
  { title: 'Cantrip', value: 0 },
  { title: 'Level 1', value: 1 },
  { title: 'Level 2', value: 2 },
  { title: 'Level 3', value: 3 },
  { title: 'Level 4', value: 4 },
  { title: 'Level 5', value: 5 },
  { title: 'Level 6', value: 6 },
  { title: 'Level 7', value: 7 },
  { title: 'Level 8', value: 8 },
  { title: 'Level 9', value: 9 },
]
</script>

