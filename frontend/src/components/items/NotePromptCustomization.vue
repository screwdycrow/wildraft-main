<template>
  <v-card
    variant="outlined"
    class="mb-4 glass-card"
  >
    <v-card-title class="text-subtitle-1">
      <v-icon icon="mdi-cog" size="20" class="mr-2" />
      Note Customization
    </v-card-title>
    <v-card-text>
      <v-row dense>
        <v-col cols="12" md="6">
          <v-select
            v-model="localNoteType"
            :items="noteTypes"
            item-title="label"
            item-value="value"
            label="Note Type"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="localNumChapters"
            label="Number of Chapters"
            type="number"
            min="0"
            max="10"
            variant="outlined"
            density="compact"
            hide-details
            hint="0 = auto-generate (2-4 chapters)"
          />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="localTheme"
            label="Theme/Style (optional)"
            placeholder="e.g., 'Dark fantasy', 'Medieval', 'Steampunk'"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="localAdditionalContext"
            label="Additional Context (optional)"
            placeholder="e.g., 'This is for a level 5 party', 'Include traps and puzzles', 'Focus on roleplay opportunities'"
            variant="outlined"
            density="compact"
            rows="2"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  noteType?: string
  theme?: string
  additionalContext?: string
  numChapters?: number
}

const props = withDefaults(defineProps<Props>(), {
  noteType: 'general',
  theme: '',
  additionalContext: '',
  numChapters: 0
})

const emit = defineEmits<{
  'update:noteType': [value: string]
  'update:theme': [value: string]
  'update:additionalContext': [value: string]
  'update:numChapters': [value: number]
}>()

const noteTypes = [
  { value: 'general', label: 'General Note' },
  { value: 'dungeon', label: 'Dungeon' },
  { value: 'npc', label: 'NPC' },
  { value: 'shop', label: 'Shop/Merchant' },
  { value: 'loot', label: 'Loot/Treasure' },
  { value: 'location', label: 'Location' },
  { value: 'town', label: 'Town/City' },
  { value: 'quest', label: 'Quest' },
  { value: 'session', label: 'Session Notes' }
]

const localNoteType = ref(props.noteType)
const localTheme = ref(props.theme)
const localAdditionalContext = ref(props.additionalContext)
const localNumChapters = ref(props.numChapters)

watch(localNoteType, (value: string) => emit('update:noteType', value))
watch(localTheme, (value: string) => emit('update:theme', value))
watch(localAdditionalContext, (value: string) => emit('update:additionalContext', value))
watch(localNumChapters, (value: number) => emit('update:numChapters', value))

watch(() => props.noteType, (value: string) => { localNoteType.value = value })
watch(() => props.theme, (value: string) => { localTheme.value = value })
watch(() => props.additionalContext, (value: string) => { localAdditionalContext.value = value })
watch(() => props.numChapters, (value: number) => { localNumChapters.value = value })
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>

