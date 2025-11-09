<template>
  <div>
    <h4 class="text-subtitle-1 font-weight-bold mb-3">
      <v-icon icon="mdi-arm-flex" size="small" class="mr-2" />
      Ability Scores & Saving Throws
      <span class="text-caption text-grey ml-2">(Proficiency: +{{ proficiencyBonus }})</span>
    </h4>
    
    <div v-for="ability in ABILITIES" :key="ability" class="ability-row mb-3">
      <div class="d-flex align-center gap-3">
        <!-- Ability Score -->
        <v-text-field
          :model-value="getAbilityScore(ability)"
          @update:model-value="updateAbilityScore(ability, $event)"
          :label="ABILITY_LABELS[ability]"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 140px;"
        />
        
        <!-- Modifier (calculated) -->
        <div class="ability-modifier">
          {{ formatModifier(calculateModifier(getAbilityScore(ability))) }}
        </div>
        
        <!-- Saving Throw -->
        <div class="saving-throw-section">
          <v-checkbox
            :model-value="isSavingThrowProficient(ability)"
            @update:model-value="updateSavingThrowProficiency(ability, $event)"
            hide-details
            density="compact"
            class="saving-throw-checkbox"
          >
            <template #label>
              <span class="text-caption">
                Save: {{ formatModifier(calculateSavingThrowBonus(ability)) }}
              </span>
            </template>
          </v-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ABILITY_LABELS, ABILITIES } from '@/constants/dnd5e'
import { calculateModifier, formatModifier } from '@/composables/useDnd5eCalculations'
import type { StatBlockData, CharacterData } from '@/types/item.types'

interface Props {
  data: StatBlockData | CharacterData
  proficiencyBonus: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:data': [data: StatBlockData | CharacterData]
}>()

function getAbilityScore(ability: string): number {
  return props.data[ability as keyof (StatBlockData | CharacterData)] as number || 10
}

function updateAbilityScore(ability: string, value: number) {
  emit('update:data', { [ability]: Number(value) || 10 })
}

function isSavingThrowProficient(ability: string): boolean {
  const key = `${ability}SavingThrow` as keyof (StatBlockData | CharacterData)
  return props.data[key] as boolean || false
}

function updateSavingThrowProficiency(ability: string, proficient: boolean) {
  const key = `${ability}SavingThrow` as keyof (StatBlockData | CharacterData)
  emit('update:data', { [key]: proficient })
}

function calculateSavingThrowBonus(ability: string): number {
  const score = getAbilityScore(ability)
  const modifier = calculateModifier(score)
  const proficient = isSavingThrowProficient(ability)
  
  return modifier + (proficient ? props.proficiencyBonus : 0)
}
</script>

<style scoped>
.ability-row {
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
}

.ability-modifier {
  min-width: 50px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
}

.saving-throw-section {
  flex: 1;
}

.saving-throw-checkbox :deep(.v-label) {
  font-size: 0.875rem;
}
</style>
