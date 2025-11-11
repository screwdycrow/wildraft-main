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
            <div class="d-flex align-center justify-space-between w-100">
              <div class="d-flex align-center gap-2 flex-wrap">
              <strong>{{ action.name }}</strong>
              <v-chip
                v-if="action.actionType"
                size="x-small"
                :color="getActionTypeColor(action.actionType)"
              >
                {{ getActionTypeLabel(action.actionType) }}
              </v-chip>
              <v-chip v-if="action.range" size="x-small" variant="outlined">
                {{ action.range }}
              </v-chip>
              <v-chip
                v-if="action.toHit"
                size="x-small"
                color="primary"
                variant="outlined"
              >
                {{ action.toHit }}
              </v-chip>
              <v-chip
                v-if="action.dc"
                size="x-small"
                color="secondary"
                variant="outlined"
              >
                DC {{ action.dc }}
              </v-chip>
              </div>
              <div v-if="action.roll" class="d-flex align-center action-roll-chip">
                <v-chip outlined size="small" color="primary" variant="outlined">
                  <v-icon icon="mdi-dice-d20" size="small" class="mr-1" />
                  {{ action.roll }}
                </v-chip>
              </div>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="action-meta">
              <div v-if="action.toHit" class="mb-1">
                <strong>To Hit / Bonus:</strong> {{ action.toHit }}
              </div>
              <div v-if="action.dc" class="mb-1">
                <strong>Save DC:</strong> {{ action.dc }}
              </div>
              <div v-if="action.roll" class="mb-1">
                <strong>Roll:</strong> {{ action.roll }}
              </div>
            </div>
            <v-divider v-if="(action.toHit || action.dc || action.roll) && action.description" class="my-2" />
            <div v-html="action.description || 'No description'" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  actions: {
    type: Array,
    default: () => [],
  },
})

const actions = props.actions

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
/* Inherit global styles */
.action-roll-chip {
  min-width: 0;
}

.action-roll-chip :deep(.v-chip) {
  white-space: nowrap;
}
</style>


