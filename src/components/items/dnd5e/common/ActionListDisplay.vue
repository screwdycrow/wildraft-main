<template>
  <v-card v-if="actions && actions.length > 0" class="glass-card mb-4" elevation="0">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-sword" class="mr-2" color="error" />
      Actions
    </v-card-title>
    <v-card-text>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="(action, index) in actions" :key="index">
          <v-expansion-panel-title>
            <div class="w-100">
              <div class="d-flex align-center gap-2 flex-wrap mb-1">
                <strong>{{ action.name }}</strong>
                <v-chip
                  v-if="action.actionType"
                  size="x-small"
                  :color="getActionTypeColor(action.actionType)"
                >
                  {{ getActionTypeLabel(action.actionType) }}
                </v-chip>
                <v-btn
                  v-if="action.roll || action.toHit"
                  icon="mdi-dice-multiple"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  @click.stop="rollAction(action)"
                >
                  <v-icon size="small" />
                  <v-tooltip activator="parent" location="top">Roll</v-tooltip>
                </v-btn>
              </div>
              <!-- Roll/DC/ToHit/Range as discrete tonal chips below title in header -->
              <div v-if="action.roll || action.toHit || action.dc || action.range" class="d-flex gap-1 flex-wrap">
                <v-chip
                  v-if="action.roll"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  <v-icon icon="mdi-dice-d20" size="x-small" class="mr-1" />
                  {{ action.roll }}
                </v-chip>
                <v-chip
                  v-if="action.toHit"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  {{ action.toHit }}
                </v-chip>
                <v-chip
                  v-if="action.dc"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  DC {{ action.dc }}
                </v-chip>
                <v-chip
                  v-if="action.range"
                  size="x-small"
                  color="info"
                  variant="tonal"
                  class="discrete-chip"
                >
                  {{ action.range }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="action-details">
              <!-- All other details -->
              <v-divider v-if="(action.roll || action.toHit || action.dc) && action.description" class="my-2" />
              <div v-html="action.description || 'No description'" />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { useDiceRollerStore } from '@/stores/diceRoller'

const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
})

const actions = props.actions
const diceStore = useDiceRollerStore()

const rollAction = (action) => {
  const rollParts = []
  
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

const getActionTypeColor = (type) => {
  switch (type) {
    case 'action': return 'primary'
    case 'bonus': return 'success'
    case 'reaction': return 'warning'
    case 'legendary': return 'purple'
    default: return 'grey'
  }
}

const getActionTypeLabel = (type) => {
  switch (type) {
    case 'action': return 'Action'
    case 'bonus': return 'Bonus'
    case 'reaction': return 'Reaction'
    case 'legendary': return 'Legendary'
    default: return type
  }
}
</script>

<style scoped>
.action-details {
  line-height: 1.8;
}

.discrete-chip {
  opacity: 0.85;
  font-size: 0.625rem !important;
  height: 18px !important;
  padding: 0 6px !important;
}
</style>


