<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <p class="text-caption text-grey-lighten-1">
        Add actions, bonus actions, reactions, or legendary actions.
      </p>
      <v-btn
        prepend-icon="mdi-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="addAction"
      >
        Add Action
      </v-btn>
    </div>

    <!-- Empty State -->
    <v-alert
      v-if="actions.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      No actions added yet. Click "Add Action" to create one.
    </v-alert>

    <!-- Actions List -->
    <v-expansion-panels variant="accordion" multiple>
      <v-expansion-panel
        v-for="(action, index) in actions"
        :key="index"
        class="action-item mb-2"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between" style="width: 100%;">
            <div class="d-flex align-center gap-2">
              <span class="font-weight-medium">
                {{ action.name || `Action ${index + 1}` }}
              </span>
              <v-chip
                v-if="action.actionType"
                size="x-small"
                :color="getActionTypeColor(action.actionType)"
                variant="flat"
              >
                {{ getActionTypeLabel(action.actionType) }}
              </v-chip>
            </div>
            <v-btn
              icon="mdi-delete"
              color="error"
              variant="text"
              size="small"
              @click.stop="removeAction(index)"
            />
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="action.name"
                label="Action Name"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="action.actionType"
                :items="actionTypes"
                label="Type"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="action.roll"
                label="Attack/Damage Roll"
                variant="outlined"
                density="compact"
                placeholder="e.g., +5 to hit, 1d8+3 damage"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="action.range"
                label="Range"
                variant="outlined"
                density="compact"
                placeholder="e.g., 5 ft, 30/120 ft"
              />
            </v-col>
          </v-row>
          
          <v-textarea
            v-model="action.description"
            label="Description"
            variant="outlined"
            rows="4"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import type { Action } from '@/types/item.types'

const actions = defineModel<Action[]>({ default: () => [] })

const actionTypes = [
  { title: 'Action', value: 'action' },
  { title: 'Bonus Action', value: 'bonus' },
  { title: 'Reaction', value: 'reaction' },
  { title: 'Legendary Action', value: 'legendary' },
]

function addAction() {
  actions.value.push({
    name: '',
    actionType: 'action',
    description: '',
  })
}

function removeAction(index: number) {
  actions.value.splice(index, 1)
}

function getActionTypeColor(type: string): string {
  switch (type) {
    case 'action': return 'primary'
    case 'bonus': return 'success'
    case 'reaction': return 'warning'
    case 'legendary': return 'purple'
    default: return 'grey'
  }
}

function getActionTypeLabel(type: string): string {
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
.action-item {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

