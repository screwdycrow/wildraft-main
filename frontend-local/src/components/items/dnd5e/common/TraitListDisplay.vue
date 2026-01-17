<template>
  <div class="trait-list">
    <div class="section-header">
      <v-icon icon="mdi-star-circle" size="small" color="warning" />
      <span>Traits & Features</span>
      <v-spacer />
      <v-btn
        v-if="editable"
        icon
        size="x-small"
        variant="text"
        color="primary"
        @click="addTrait"
      >
        <v-icon icon="mdi-plus" size="small" />
        <v-tooltip activator="parent" location="top">Add Trait</v-tooltip>
      </v-btn>
    </div>

    <!-- Empty State -->
    <div v-if="!modelValue || modelValue.length === 0" class="empty-state">
      <span v-if="editable">No traits yet. Click + to add one.</span>
      <span v-else>No traits</span>
    </div>
    
    <!-- Traits List -->
    <div v-else class="trait-items">
      <div
        v-for="(trait, index) in modelValue"
        :key="index"
        class="trait-item"
        :class="{ expanded: expandedIndex === index }"
        @click="toggleExpand(index)"
      >
        <div class="trait-header">
          <span class="trait-name">{{ trait.name || 'Unnamed Trait' }}</span>
          <div class="trait-actions-inline">
            <v-icon
              :icon="expandedIndex === index ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              size="small"
              class="expand-icon"
            />
            <v-btn
              v-if="editable"
              icon
              size="x-small"
              variant="text"
              color="error"
              class="delete-btn"
              @click.stop="removeTrait(index)"
            >
              <v-icon icon="mdi-close" size="14" />
            </v-btn>
          </div>
        </div>
        
        <div v-if="expandedIndex === index" class="trait-details" @click.stop>
          <div v-if="trait.description" class="trait-description" v-html="trait.description" />
          <div v-if="editable" class="trait-actions">
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-pencil"
              @click.stop="editTrait(index)"
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
          {{ editingIndex !== null ? 'Edit Trait' : 'Add Trait' }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingTrait.name"
            label="Trait Name"
            variant="outlined"
            density="compact"
            class="mb-3"
            autofocus
          />
          <v-textarea
            v-model="editingTrait.description"
            label="Description"
            variant="outlined"
            rows="6"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveTrait">
            {{ editingIndex !== null ? 'Save' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Trait } from '@/types/item.types'

interface Props {
  editable?: boolean
}

withDefaults(defineProps<Props>(), {
  editable: false,
})

const modelValue = defineModel<Trait[]>({ default: () => [] })

const expandedIndex = ref<number | null>(null)
const showDialog = ref(false)
const editingIndex = ref<number | null>(null)
const editingTrait = ref<Trait>({
  name: '',
  description: '',
})

function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

function addTrait() {
  editingIndex.value = null
  editingTrait.value = {
    name: '',
    description: '',
  }
  showDialog.value = true
}

function editTrait(index: number) {
  editingIndex.value = index
  editingTrait.value = { ...modelValue.value[index] }
  showDialog.value = true
}

function saveTrait() {
  if (!editingTrait.value.name?.trim()) return

  if (editingIndex.value !== null) {
    modelValue.value[editingIndex.value] = { ...editingTrait.value }
  } else {
    modelValue.value.push({ ...editingTrait.value })
  }
  closeDialog()
}

function removeTrait(index: number) {
  modelValue.value.splice(index, 1)
  if (expandedIndex.value === index) {
    expandedIndex.value = null
  }
}

function closeDialog() {
  showDialog.value = false
  editingIndex.value = null
}
</script>

<style scoped>
.trait-list {
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

.trait-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.trait-item {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.trait-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.trait-item.expanded {
  background: rgba(255, 255, 255, 0.04);
}

.trait-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.trait-name {
  font-weight: 500;
  flex: 1;
}

.trait-actions-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.expand-icon {
  opacity: 0.4;
  transition: opacity 0.15s;
}

.trait-item:hover .expand-icon {
  opacity: 0.7;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
}

.trait-item:hover .delete-btn {
  opacity: 0.7;
}

.delete-btn:hover {
  opacity: 1 !important;
}

.trait-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.trait-description {
  font-size: 0.85rem;
  line-height: 1.6;
  opacity: 0.85;
}

.trait-description :deep(p) {
  margin: 0 0 8px 0;
}

.trait-description :deep(p:last-child) {
  margin-bottom: 0;
}

.trait-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}
</style>
