<template>
  <v-card v-if="spells && spells.length > 0" class="glass-card mb-4" elevation="0">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-auto-fix" class="mr-2" color="purple" />
      Spells
    </v-card-title>
    <v-card-text>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="(spell, index) in spells" :key="index">
          <v-expansion-panel-title>
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center gap-2 flex-wrap">
              <strong>{{ spell.name }}</strong>
              <v-chip size="x-small" :color="getSpellLevelColor(spell.level)">
                {{ getSpellLevelLabel(spell.level) }}
              </v-chip>
              <v-chip v-if="spell.concentration" size="x-small" color="warning" variant="outlined">
                C
              </v-chip>
              <v-chip v-if="spell.ritual" size="x-small" color="purple" variant="outlined">
                R
              </v-chip>
              </div>
              <div v-if="spell.roll" class="d-flex align-center spell-roll-chip">
                <v-chip size="small" color="primary" variant="flat">
                  <v-icon icon="mdi-dice-d20" size="small" class="mr-1" />
                  {{ spell.roll }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="spell-details">
              <div v-if="spell.school" class="mb-1">
                <strong>School:</strong> {{ spell.school }}
              </div>
              <div v-if="spell.castingTime" class="mb-1">
                <strong>Casting Time:</strong> {{ spell.castingTime }}
              </div>
              <div v-if="spell.range" class="mb-1">
                <strong>Range:</strong> {{ spell.range }}
              </div>
              <div v-if="spell.components" class="mb-1">
                <strong>Components:</strong> {{ spell.components }}
              </div>
              <div v-if="spell.duration" class="mb-1">
                <strong>Duration:</strong> {{ spell.duration }}
              </div>
              <div v-if="spell.roll" class="mb-1">
                <strong>Roll:</strong> {{ spell.roll }}
              </div>
              <v-divider class="my-2" />
              <div v-html="spell.description || 'No description'" />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Spell } from '@/types/item.types'

interface Props {
  spells?: Spell[]
}

defineProps<Props>()

function getSpellLevelColor(level: number): string {
  if (level === 0) return 'grey'
  if (level === 1) return 'blue'
  if (level === 2) return 'green'
  if (level === 3) return 'yellow'
  if (level === 4) return 'orange'
  if (level === 5) return 'red'
  if (level === 6) return 'purple'
  if (level === 7) return 'pink'
  if (level === 8) return 'brown'
  if (level === 9) return 'gray'
}

function getSpellLevelLabel(level: number): string {
  if (level === 0) return 'Cantrip'
  if (level === 1) return '1st'
  if (level === 2) return '2nd'
  if (level === 3) return '3rd'
  if (level === 4) return '4th'
  if (level === 5) return '5th'
  if (level === 6) return '6th'
  if (level === 7) return '7th'
  if (level === 8) return '8th'
  if (level === 9) return '9th'
  return `${level}th`
}
</script>

<style scoped>
.spell-details {
  line-height: 1.8;
}

.spell-roll-chip {
  min-width: 0;
}

.spell-roll-chip :deep(.v-chip) {
  white-space: nowrap;
}
</style>

