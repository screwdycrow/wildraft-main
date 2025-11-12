<template>
  <div class="cards-container">
    <!-- Actions -->
    <div v-if="actions.length > 0" class="cards-section">
      <h3 class="section-title">Actions</h3>
      <div class="cards-grid">
        <v-card
          v-for="(action, index) in actions"
          :key="`action-${index}`"
          class="ability-card"
          elevation="2"
        >
          <v-card-title class="card-title">
            <v-icon :icon="getActionIcon(action)" size="small" class="mr-2" />
            {{ action.name }}
            <v-chip
              v-if="action.actionType"
              size="x-small"
              :color="getActionTypeColor(action.actionType)"
              class="ml-2"
            >
              {{ action.actionType }}
            </v-chip>
            <v-spacer />
            <v-btn
              v-if="action.roll || action.toHit"
              icon="mdi-dice-multiple"
              size="small"
              variant="tonal"
              color="primary"
              @click="rollAction(action)"
            >
              <v-icon />
              <v-tooltip activator="parent" location="top">Roll</v-tooltip>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div v-if="action.toHit || action.dc || action.roll || action.range" class="stats-row">
              <v-chip v-if="action.toHit" size="small" variant="outlined" class="mr-1">
                <v-icon icon="mdi-target" size="x-small" start />
                {{ action.toHit }}
              </v-chip>
              <v-chip v-if="action.dc" size="small" variant="outlined" class="mr-1">
                <v-icon icon="mdi-shield-check" size="x-small" start />
                DC {{ action.dc }}
              </v-chip>
              <v-chip v-if="action.roll" size="small" variant="outlined" class="mr-1">
                <v-icon icon="mdi-dice-6" size="x-small" start />
                {{ action.roll }}
              </v-chip>
              <v-chip v-if="action.range" size="small" variant="outlined">
                <v-icon icon="mdi-arrow-expand-horizontal" size="x-small" start />
                {{ action.range }}
              </v-chip>
            </div>
            <div v-if="action.description" class="description">
              {{ action.description }}
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Spells -->
    <div v-if="spells.length > 0" class="cards-section">
      <h3 class="section-title">Spells</h3>
      <div class="cards-grid">
        <v-card
          v-for="(spell, index) in spells"
          :key="`spell-${index}`"
          class="ability-card spell-card"
          elevation="2"
        >
          <v-card-title class="card-title">
            <v-icon icon="mdi-auto-fix" size="small" class="mr-2" />
            {{ spell.name }}
            <v-chip
              v-if="spell.level !== undefined"
              size="x-small"
              color="purple"
              class="ml-2"
            >
              Level {{ spell.level }}
            </v-chip>
            <v-spacer />
            <v-btn
              v-if="spell.roll || spell.toHit || spell.dc"
              icon="mdi-dice-multiple"
              size="small"
              variant="tonal"
              color="purple"
              @click="rollSpell(spell)"
            >
              <v-icon />
              <v-tooltip activator="parent" location="top">Roll</v-tooltip>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div class="stats-row">
              <v-chip v-if="spell.school" size="small" variant="outlined" class="mr-1">
                {{ spell.school }}
              </v-chip>
              <v-chip v-if="spell.castingTime" size="small" variant="outlined" class="mr-1">
                <v-icon icon="mdi-clock-outline" size="x-small" start />
                {{ spell.castingTime }}
              </v-chip>
              <v-chip v-if="spell.range" size="small" variant="outlined" class="mr-1">
                <v-icon icon="mdi-arrow-expand-horizontal" size="x-small" start />
                {{ spell.range }}
              </v-chip>
              <v-chip v-if="spell.duration" size="small" variant="outlined">
                <v-icon icon="mdi-timer-outline" size="x-small" start />
                {{ spell.duration }}
              </v-chip>
            </div>
            <div v-if="spell.components" class="components mb-2">
              <strong>Components:</strong> {{ spell.components }}
            </div>
            <div v-if="spell.description" class="description">
              {{ spell.description }}
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Traits -->
    <div v-if="traits.length > 0" class="cards-section">
      <h3 class="section-title">Traits</h3>
      <div class="cards-grid">
        <v-card
          v-for="(trait, index) in traits"
          :key="`trait-${index}`"
          class="ability-card trait-card"
          elevation="2"
        >
          <v-card-title class="card-title">
            <v-icon icon="mdi-star" size="small" class="mr-2" />
            {{ trait.name }}
          </v-card-title>
          <v-card-text>
            <div v-if="trait.description" class="description">
              {{ trait.description }}
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="actions.length === 0 && spells.length === 0 && traits.length === 0" class="empty-state">
      <v-icon icon="mdi-file-document-outline" size="64" color="grey" class="mb-4 opacity-50" />
      <p class="text-h6 text-grey">No abilities found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDiceRollerStore } from '@/stores/diceRoller'

const diceStore = useDiceRollerStore()

interface Action {
  name: string
  actionType?: string
  toHit?: string
  dc?: string
  roll?: string
  range?: string
  description?: string
}

interface Spell {
  name: string
  level?: number
  school?: string
  castingTime?: string
  range?: string
  duration?: string
  components?: string
  description?: string
}

interface Trait {
  name: string
  description?: string
}

interface Props {
  actions?: Action[]
  spells?: Spell[]
  traits?: Trait[]
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  spells: () => [],
  traits: () => []
})

function getActionIcon(action: Action): string {
  if (!action.actionType) return 'mdi-sword'

  const iconMap: Record<string, string> = {
    action: 'mdi-sword',
    bonus: 'mdi-lightning-bolt',
    'bonus action': 'mdi-lightning-bolt',
    reaction: 'mdi-shield-alert',
    legendary: 'mdi-star',
    lair: 'mdi-castle',
  }

  return iconMap[action.actionType.toLowerCase()] || 'mdi-sword'
}

function getActionTypeColor(actionType: string): string {
  const colorMap: Record<string, string> = {
    action: 'red',
    bonus: 'orange',
    'bonus action': 'orange',
    reaction: 'blue',
    legendary: 'purple',
    lair: 'brown',
  }

  return colorMap[actionType.toLowerCase()] || 'grey'
}

function rollAction(action: Action) {
  const rollParts: string[] = []
  
  // If there's a toHit, add it as a d20 roll with proper spacing
  if (action.toHit) {
    // Remove spaces from toHit (e.g., "+ 5" or "+5") and ensure proper format
    const modifier = action.toHit.replace(/\s+/g, '')
    rollParts.push(`1d20 ${modifier}`)
  }
  
  // Add damage roll
  if (action.roll) {
    rollParts.push(action.roll)
  }
  
  if (rollParts.length > 0) {
    const rollText = `${action.name}: ${rollParts.join(' ')}`
    diceStore.rollFromText(rollText)
  }
}

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
</script>

<style scoped>
.cards-container {
  padding: 16px;
}

.cards-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.ability-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.ability-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.spell-card {
  border-left: 4px solid #9c27b0;
}

.trait-card {
  border-left: 4px solid #ffc107;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.components {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.description {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  text-align: center;
}
</style>

