<template>
  <v-card class="glass-card mb-4 abilities-card" elevation="0">
    <v-card-title class="d-flex align-center card-title-mobile">
      <v-icon icon="mdi-arm-flex" size="small" class="mr-2" />
      <span class="title-text">Ability Scores & Saving Throws</span>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col v-for="ability in ABILITIES" :key="ability" cols="4" md="2">
          <div class="ability-box">
            <div class="ability-name text-overline">{{ ABILITY_LABELS[ability] }}</div>
            <div class="ability-score text-h4 font-weight-bold">
              {{ getAbilityScore(ability) }}
            </div>
            <div class="ability-modifier text-h6">
              {{ formatModifier(abilityModifiers[ability]) }}
            </div>
            <v-divider class="my-2" />
            <div class="saving-throw">
              <v-icon
                :icon="isSavingThrowProficient(ability) ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                :color="isSavingThrowProficient(ability) ? 'success' : 'grey'"
                size="small"
              />
              <span class="text-caption ml-1">
                Save: {{ formatModifier(savingThrowBonuses[ability]) }}
              </span>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ABILITIES, ABILITY_LABELS } from '@/constants/dnd5e'
import {
  calculateModifier,
  calculateProficiencyBonus,
  formatModifier,
} from '@/composables/useDnd5eCalculations'
import type { CharacterData, StatBlockData } from '@/types/item.types'

interface Props {
  data: CharacterData | StatBlockData
  proficiencyBonus?: number
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  proficiencyBonus: undefined,
  level: undefined,
})

// Calculate proficiency bonus if not provided
const computedProficiencyBonus = computed(() => {
  if (props.proficiencyBonus !== undefined) return props.proficiencyBonus
  if (props.level !== undefined) return calculateProficiencyBonus(props.level)
  return 0
})

// Get ability score
function getAbilityScore(ability: string): number {
  const score = (props.data as any)[ability]
  return score !== undefined && score !== null ? score : 10
}

// Calculate ability modifiers
const abilityModifiers = computed(() => ({
  str: calculateModifier(getAbilityScore('str')),
  dex: calculateModifier(getAbilityScore('dex')),
  con: calculateModifier(getAbilityScore('con')),
  int: calculateModifier(getAbilityScore('int')),
  wis: calculateModifier(getAbilityScore('wis')),
  cha: calculateModifier(getAbilityScore('cha')),
}))

// Check if saving throw is proficient
function isSavingThrowProficient(ability: string): boolean {
  // For characters, check the specific saving throw flag
  if ('level' in props.data) {
    const key = `${ability}SavingThrow` as keyof CharacterData
    return (props.data as CharacterData)[key] as boolean || false
  }
  // For stat blocks, assume no proficiency unless specified
  return false
}

// Calculate saving throw bonuses
const savingThrowBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  ABILITIES.forEach(ability => {
    const modifier = abilityModifiers.value[ability]
    const isProficient = isSavingThrowProficient(ability)
    bonuses[ability] = modifier + (isProficient ? computedProficiencyBonus.value : 0)
  })
  return bonuses
})
</script>

<style scoped>
.abilities-card :deep(.v-card-text) {
  padding: 12px !important;
}

.ability-box {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: background 0.2s;
}

.ability-box:hover {
  background: rgba(255, 255, 255, 0.05);
}

.ability-name {
  color: rgb(var(--v-theme-primary));
  font-weight: bold;
}

.ability-score {
  color: rgb(var(--v-theme-on-surface));
}

.ability-modifier {
  color: rgb(var(--v-theme-primary));
}

.saving-throw {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title-mobile {
  padding: 12px 16px !important;
  font-size: 0.875rem !important;
}

.title-text {
  font-size: 0.875rem !important;
  font-weight: 600;
}

@media (min-width: 960px) {
  .abilities-card :deep(.v-card-text) {
    padding: 16px !important;
  }

  .card-title-mobile {
    padding: 16px !important;
    font-size: 1rem !important;
  }

  .title-text {
    font-size: 1rem !important;
  }
}

@media (max-width: 959px) {
  .ability-box {
    padding: 6px 4px;
    border-radius: 6px;
  }

  .ability-name {
    font-size: 0.5rem;
    margin-bottom: 2px;
  }

  .ability-score {
    font-size: 1rem;
  }

  .ability-modifier {
    font-size: 0.75rem;
  }

  .saving-throw {
    font-size: 0.5rem;
  }

  .saving-throw .v-icon {
    font-size: 14px !important;
  }

  .saving-throw .text-caption {
    font-size: 0.5rem !important;
  }
}

@media (max-width: 599px) {
  .ability-box {
    padding: 4px 2px;
  }

  .ability-name {
    font-size: 0.4375rem;
  }

  .ability-score {
    font-size: 0.875rem;
  }

  .ability-modifier {
    font-size: 0.625rem;
  }

  .saving-throw {
    font-size: 0.4375rem;
  }

  .saving-throw .v-icon {
    font-size: 12px !important;
  }
}
</style>

