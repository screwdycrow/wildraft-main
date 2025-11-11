<template>
  <div class="character-detail">
    <!-- Tabs -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="combat">
        <v-icon icon="mdi-sword-cross" start />
        Combat
      </v-tab>
   
      <v-tab value="full">
        <v-icon icon="mdi-book-open-variant" start />
        Full Details
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Combat Tab -->
      <v-window-item value="combat">
        <!-- Ability Scores & Saving Throws -->
        <v-card class="glass-card mb-4" elevation="0">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-arm-flex" size="small" class="mr-2" />
            Ability Scores & Saving Throws
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="ability in ABILITIES" :key="ability" cols="4" md="2">
                <div class="ability-box">
                  <div class="ability-name text-overline">{{ ABILITY_LABELS[ability] }}</div>
                  <div class="ability-score text-h4 font-weight-bold">
                    {{ characterData[ability] || 10 }}
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
      <!-- Abilities Tab -->
        <SpellsActionsTraitsCards
          :actions="actions"
          :spells="spells"
          :traits="traits"
        />
      </v-window-item>

      <!-- Full Details Tab -->
      <v-window-item value="full">
        <character-detail :item="libraryItem" :can-edit="false" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Combatant } from '@/types/combat.types'
import type { LibraryItem } from '@/types/item.types'
import type { CharacterData } from '@/types/item.DND_5E.types'
import { ABILITIES, ABILITY_LABELS } from '@/constants/dnd5e'
import {
  calculateModifier,
  calculateProficiencyBonus,
  formatModifier,
} from '@/composables/useDnd5eCalculations'
import SpellsActionsTraitsCards from '../SpellsActionsTraitsCards.vue'
import CharacterDetail from '@/components/items/dnd5e/characters/CharacterDetail.vue'

interface Props {
  combatant: Combatant
  libraryItem: LibraryItem
}

const props = defineProps<Props>()

const activeTab = ref('combat')
const characterData = computed(() => props.libraryItem.data as CharacterData)

const level = computed(() => characterData.value?.level)

const hpPercentage = computed(() => {
  if (!props.combatant.maxHp) return 0
  return (props.combatant.hp / props.combatant.maxHp) * 100
})

const hpColor = computed(() => {
  const percentage = hpPercentage.value
  if (percentage > 75) return 'success'
  if (percentage > 50) return 'info'
  if (percentage > 25) return 'warning'
  return 'error'
})

// Calculations
const proficiencyBonus = computed(() =>
  calculateProficiencyBonus(characterData.value.level || 1)
)

const abilityModifiers = computed(() => ({
  str: calculateModifier(characterData.value.str || 10),
  dex: calculateModifier(characterData.value.dex || 10),
  con: calculateModifier(characterData.value.con || 10),
  int: calculateModifier(characterData.value.int || 10),
  wis: calculateModifier(characterData.value.wis || 10),
  cha: calculateModifier(characterData.value.cha || 10),
}))

const savingThrowBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  ABILITIES.forEach(ability => {
    const score = characterData.value[ability] || 10
    const modifier = calculateModifier(score)
    const isProficient = isSavingThrowProficient(ability)
    bonuses[ability] = modifier + (isProficient ? proficiencyBonus.value : 0)
  })
  return bonuses
})

function isSavingThrowProficient(ability: string): boolean {
  const key = `${ability}SavingThrow` as keyof CharacterData
  return characterData.value[key] as boolean || false
}

const actions = computed(() => characterData.value?.actions || [])
const spells = computed(() => characterData.value?.spells || [])
const traits = computed(() => characterData.value?.traits || characterData.value?.features || [])
</script>

<style scoped>
.character-detail {
  padding: 16px 0;
}

.ability-box {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: background 0.2s;
}

.ability-box:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ability-name {
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
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
</style>
