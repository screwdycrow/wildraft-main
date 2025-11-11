<template>
  <div class="stat-block-detail">
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
        <!-- Ability Scores -->
      
        <v-card class="glass-card mb-4" elevation="0">
          <v-card-title class="text-subtitle-1">
            <v-icon icon="mdi-arm-flex" size="small" class="mr-2" />
            Ability Scores
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="(score, ability) in abilityScores" :key="ability" cols="4" md="2">
                <div class="ability-box">
                  <div class="ability-name text-overline">{{ ability.toUpperCase() }}</div>
                  <div class="ability-score text-h4 font-weight-bold">
                    {{ score || 10 }}
                  </div>
                  <div class="ability-modifier text-h6">
                    {{ getModifier(score) }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <SpellsActionsTraitsCards
          :actions="actions"
          :spells="spells"
          :traits="traits"
        />
      </v-window-item>

      <!-- Full Details Tab -->
      <v-window-item value="full">
        <stat-block-detail :item="libraryItem" :can-edit="false" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Combatant } from '@/types/combat.types'
import type { LibraryItem } from '@/types/item.types'
import SpellsActionsTraitsCards from '../SpellsActionsTraitsCards.vue'
import StatBlockDetail from '@/components/items/dnd5e/stat-blocks/StatBlockDetail.vue'

interface Props {
  combatant: Combatant
  libraryItem: LibraryItem
}

const props = defineProps<Props>()

const activeTab = ref('combat')
const statBlockData = computed(() => props.libraryItem.data as any)

const cr = computed(() => statBlockData.value?.cr)

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

const abilityScores = computed(() => {
  const data = statBlockData.value
  return {
    str: data.str,
    dex: data.dex,
    con: data.con,
    int: data.int,
    wis: data.wis,
    cha: data.cha,
  }
})

const getModifier = (score: number | undefined): string => {
  if (score === undefined || score === null) return '+0'
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

const actions = computed(() => statBlockData.value?.actions || [])
const spells = computed(() => statBlockData.value?.spells || [])
const traits = computed(() => statBlockData.value?.traits || statBlockData.value?.features || [])
</script>

<style scoped>
.stat-block-detail {
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
</style>

