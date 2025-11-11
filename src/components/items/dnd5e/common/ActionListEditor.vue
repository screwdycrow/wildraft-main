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
    <v-expansion-panels v-model="openPanel" variant="accordion">
      <v-expansion-panel
        v-for="(action, index) in actions"
        :key="index"
        :value="index"
        class="action-item mb-2"
      >
        <v-expansion-panel-title class="action-panel-title">
          <div class="d-flex align-center justify-space-between" style="width: 100%;">
            <div class="d-flex align-center gap-2">
              <v-icon 
                :icon="getActionTypeIcon(action.actionType)" 
                size="small"
                :color="getActionTypeColor(action.actionType)"
                class="mr-1"
              />
              <span class="font-weight-bold text-body-1">
                {{ action.name || `Action ${index + 1}` }}
              </span>
              <v-chip
                v-if="action.actionType"
                size="x-small"
                :color="getActionTypeColor(action.actionType)"
                variant="tonal"
              >
                {{ getActionTypeLabel(action.actionType) }}
              </v-chip>
              <span v-if="action.range" class="text-caption text-grey ml-2">
                {{ action.range }}
              </span>
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

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="action.toHit"
                label="To Hit / Bonus"
                variant="outlined"
                density="compact"
                placeholder="+7"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="action.dc"
                label="Save DC"
                variant="outlined"
                density="compact"
                placeholder="15 (DEX)"
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
import { ref } from 'vue'
import type { Action } from '@/types/item.types'

const actions = defineModel<Action[]>({ default: () => [] })
const openPanel = ref<number | undefined>(undefined)

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
    toHit: '',
    dc: '',
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

function getActionTypeIcon(type: string): string {
  switch (type) {
    case 'action': return 'mdi-sword'
    case 'bonus': return 'mdi-lightning-bolt'
    case 'reaction': return 'mdi-shield'
    case 'legendary': return 'mdi-star'
    default: return 'mdi-sword-cross'
  }
}
</script>

<style scoped>
.action-item {
  animation: fadeIn 0.3s ease-in;
}

.action-panel-title {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 8px 12px;
  min-height: 48px;
}

.action-panel-title:hover {
  background: rgba(255, 255, 255, 0.06);
}

.gap-2 {
  gap: 8px;
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

