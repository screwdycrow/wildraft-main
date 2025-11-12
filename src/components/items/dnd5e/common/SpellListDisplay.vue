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
            <div class="w-100">
              <div class="d-flex align-center gap-2 flex-wrap mb-1">
                <strong>{{ spell.name }}</strong>
                <v-chip v-if="getSpellLevelLabel(spell.level)" size="x-small" :color="getSpellLevelColor(spell.level)">
                  {{ getSpellLevelLabel(spell.level) }}
                </v-chip>
                <v-chip v-if="spell.concentration" size="x-small" color="warning" variant="tonal">
                  C
                </v-chip>
                <v-chip v-if="spell.castingTime" size="x-small" color="primary" variant="tonal">
                  {{ spell.castingTime }}
                </v-chip>
                <v-btn
                  v-if="spell.roll || spell.toHit || spell.dc"
                  icon="mdi-dice-multiple"
                  size="x-small"
                  variant="tonal"
                  color="purple"
                  @click.stop="rollSpell(spell)"
                >
                  <v-icon size="small" />
                  <v-tooltip activator="parent" location="top">Roll</v-tooltip>
                </v-btn>
              </div>
              <!-- Roll/DC/ToHit/Range as discrete tonal chips below title in header -->
              <div v-if="spell.roll || spell.toHit || spell.dc || spell.range" class="d-flex gap-1 flex-wrap">
                <v-chip
                  v-if="spell.roll"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  <v-icon icon="mdi-dice-d20" size="x-small" class="mr-1" />
                  {{ spell.roll }}
                </v-chip>
                <v-chip
                  v-if="spell.toHit"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  {{ spell.toHit }}
                </v-chip>
                <v-chip
                  v-if="spell.dc"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  DC {{ spell.dc }}
                </v-chip>
                <v-chip
                  v-if="spell.range"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  {{ spell.range }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="spell-details">
              <!-- All other details -->
              <div v-if="spell.school" class="mb-1">
                <strong>School:</strong> {{ spell.school }}
              </div>
              <div v-if="spell.components" class="mb-1">
                <strong>Components:</strong> {{ spell.components }}
              </div>
              <div v-if="spell.duration" class="mb-1">
                <strong>Duration:</strong> {{ spell.duration }}
              </div>
              <div v-if="spell.ritual" class="mb-1">
                <v-chip size="x-small" color="purple" variant="outlined">
                  Ritual
                </v-chip>
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
import { useDiceRollerStore } from '@/stores/diceRoller'

interface Props {
  spells?: Spell[]
}

defineProps<Props>()

const diceStore = useDiceRollerStore()

function rollSpell(spell: Spell) {
  const rollParts: string[] = []
  
  // If there's a toHit, add it as a d20 roll with proper spacing
  if (spell.toHit) {
    // Remove spaces from toHit (e.g., "+ 5" or "+5") and ensure proper format
    const modifier = spell.toHit.replace(/\s+/g, '')
    rollParts.push(`1d20 ${modifier}`)
  }
  
  // Add damage/effect roll
  if (spell.roll) {
    rollParts.push(spell.roll)
  }
  
  if (rollParts.length > 0) {
    const rollText = `${spell.name}: ${rollParts.join(' ')}`
    diceStore.rollFromText(rollText)
  }
}

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

.discrete-chip {
  opacity: 0.85;
  font-size: 0.625rem !important;
  height: 18px !important;
  padding: 0 6px !important;
}
</style>

