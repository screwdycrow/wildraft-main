<template>
  <div class="action-list">
    <div class="section-header">
      <v-icon icon="mdi-sword" size="small" color="error" />
      <span>Actions</span>
      <v-spacer />
      <v-btn
        v-if="editable"
        icon
        size="x-small"
        variant="text"
        color="primary"
        @click="addAction"
      >
        <v-icon icon="mdi-plus" size="small" />
        <v-tooltip activator="parent" location="top">Add Action</v-tooltip>
      </v-btn>
    </div>

    <!-- Empty State -->
    <div v-if="!modelValue || modelValue.length === 0" class="empty-state">
      <span v-if="editable">No actions yet. Click + to add one.</span>
      <span v-else>No actions</span>
    </div>
    
    <!-- Actions List -->
    <div v-else class="action-items">
      <div
        v-for="(action, index) in modelValue"
        :key="index"
        class="action-item"
        :class="{ expanded: expandedIndex === index }"
        @click="toggleExpand(index)"
      >
        <!-- Row 1: Name, Type, Range -->
        <div class="action-header">
          <div class="action-main">
            <span class="action-name">{{ action.name || 'Unnamed Action' }}</span>
            <span v-if="action.actionType" class="action-type" :style="{ color: getActionTypeColor(action.actionType) }">
              {{ getActionTypeLabel(action.actionType) }}
            </span>
          </div>
          <div class="action-meta">
            <span v-if="action.range" class="meta-text">{{ action.range }}</span>
            <v-btn
              v-if="editable"
              icon
              size="x-small"
              variant="text"
              color="error"
              class="delete-btn"
              @click.stop="removeAction(index)"
            >
              <v-icon icon="mdi-close" size="14" />
            </v-btn>
          </div>
        </div>
        
        <!-- Row 2: Roll Info (toHit, DC, damage) -->
        <div v-if="action.roll || action.toHit || action.dc" class="action-rolls">
          <span v-if="action.toHit" class="roll-badge hit">{{ action.toHit }} to hit</span>
          <span v-if="action.dc" class="roll-badge dc">DC {{ action.dc }}</span>
          <span v-if="action.roll" class="roll-badge damage">{{ action.roll }}</span>
          <v-btn
            icon
            size="x-small"
            variant="text"
            color="primary"
            class="roll-btn"
            @click.stop="rollAction(action)"
          >
            <v-icon icon="mdi-dice-multiple" size="small" />
          </v-btn>
        </div>
        
        <!-- Expanded Details -->
        <div v-if="expandedIndex === index" class="action-details" @click.stop>
          <div v-if="action.description" class="action-description" v-html="action.description" />
          <div v-if="editable" class="action-btns">
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-pencil"
              @click.stop="editAction(index)"
            >
              Edit
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="600" scrollable>
      <v-card class="glass-card">
        <v-card-title class="text-subtitle-1">
          {{ editingIndex !== null ? 'Edit Action' : 'Add Action' }}
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="editingAction.name"
                label="Action Name"
                variant="outlined"
                density="compact"
                autofocus
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="editingAction.actionType"
                :items="actionTypes"
                label="Type"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="editingAction.toHit"
                label="To Hit"
                variant="outlined"
                density="compact"
                placeholder="+7"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="editingAction.dc"
                label="Save DC"
                variant="outlined"
                density="compact"
                placeholder="15 DEX"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="editingAction.range"
                label="Range"
                variant="outlined"
                density="compact"
                placeholder="5 ft"
              />
            </v-col>
          </v-row>
          
          <v-text-field
            v-model="editingAction.roll"
            label="Damage/Effect Roll"
            variant="outlined"
            density="compact"
            placeholder="1d8+3 slashing"
            class="mb-3"
          />
          
          <v-textarea
            v-model="editingAction.description"
            label="Description"
            variant="outlined"
            rows="4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveAction">
            {{ editingIndex !== null ? 'Save' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Action } from '@/types/item.types'
import { useDiceRollerStore } from '@/stores/diceRoller'

interface Props {
  editable?: boolean
}

withDefaults(defineProps<Props>(), {
  editable: false,
})

const modelValue = defineModel<Action[]>({ default: () => [] })

const diceStore = useDiceRollerStore()
const expandedIndex = ref<number | null>(null)
const showDialog = ref(false)
const editingIndex = ref<number | null>(null)
const editingAction = ref<Action>({
  name: '',
  actionType: 'action',
  description: '',
})

const actionTypes = [
  { title: 'Action', value: 'action' },
  { title: 'Bonus Action', value: 'bonus' },
  { title: 'Reaction', value: 'reaction' },
  { title: 'Legendary Action', value: 'legendary' },
]

function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

function addAction() {
  editingIndex.value = null
  editingAction.value = {
    name: '',
    actionType: 'action',
    description: '',
  }
  showDialog.value = true
}

function editAction(index: number) {
  editingIndex.value = index
  editingAction.value = { ...modelValue.value[index] }
  showDialog.value = true
}

function saveAction() {
  if (!editingAction.value.name?.trim()) return

  if (editingIndex.value !== null) {
    modelValue.value[editingIndex.value] = { ...editingAction.value }
  } else {
    modelValue.value.push({ ...editingAction.value })
  }
  closeDialog()
}

function removeAction(index: number) {
  modelValue.value.splice(index, 1)
  if (expandedIndex.value === index) {
    expandedIndex.value = null
  }
}

function closeDialog() {
  showDialog.value = false
  editingIndex.value = null
}

function rollAction(action: Action) {
  const rollParts: string[] = []
  
  if (action.toHit) {
    const modifier = action.toHit.replace(/\s+/g, '')
    rollParts.push(`1d20 ${modifier}`)
  }
  
  if (action.roll) {
    rollParts.push(action.roll)
  }
  
  if (rollParts.length > 0) {
    const rollText = `${action.name}: ${rollParts.join(' ')}`
    diceStore.rollFromText(rollText)
  }
}

function getActionTypeColor(type: string): string {
  switch (type) {
    case 'action': return '#2196f3'
    case 'bonus': return '#4caf50'
    case 'reaction': return '#ff9800'
    case 'legendary': return '#9c27b0'
    default: return '#9e9e9e'
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
.action-list {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
  font-size: 0.8rem;
  opacity: 0.5;
}

.action-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-item {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.action-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.action-item.expanded {
  background: rgba(255, 255, 255, 0.04);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.action-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.action-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-type {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.9;
}

.action-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.meta-text {
  font-size: 0.7rem;
  opacity: 0.6;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
}

.action-item:hover .delete-btn {
  opacity: 0.7;
}

.delete-btn:hover {
  opacity: 1 !important;
}

.action-rolls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.roll-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
}

.roll-badge.hit {
  color: #4caf50;
}

.roll-badge.dc {
  color: #ff9800;
}

.roll-badge.damage {
  color: rgb(var(--v-theme-primary));
}

.roll-btn {
  margin-left: auto;
  opacity: 0.7;
}

.roll-btn:hover {
  opacity: 1;
}

.action-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.action-description {
  font-size: 0.85rem;
  line-height: 1.6;
  opacity: 0.85;
}

.action-description :deep(p) {
  margin: 0 0 8px 0;
}

.action-description :deep(p:last-child) {
  margin-bottom: 0;
}

.action-btns {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}
</style>
