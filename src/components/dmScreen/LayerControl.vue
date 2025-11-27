<template>
  <div class="layer-control">
    <div class="layer-control-header">
      <span class="layer-control-title">Layers</span>
      <v-btn
        icon
        size="x-small"
        variant="text"
        color="white"
        @click="handleAddLayer"
      >
        <v-icon size="small">mdi-plus</v-icon>
        <v-tooltip activator="parent" location="top">Add Layer</v-tooltip>
      </v-btn>
    </div>
    
    <div class="layer-list">
      <draggable
        v-model="localLayers"
        item-key="id"
        handle=".layer-drag-handle"
        @end="handleReorder"
        :animation="200"
      >
        <template #item="{ element: layer }">
          <div 
            class="layer-item"
            :class="{ 
              'layer-item--hidden': !layer.visible,
              'layer-item--locked': layer.locked,
              'layer-item--selected': selectedLayerId === layer.id
            }"
            @click="selectLayer(layer.id)"
          >
            <div class="layer-drag-handle">
              <v-icon size="x-small" color="grey">mdi-drag</v-icon>
            </div>
            
            <v-btn
              icon
              size="x-small"
              variant="text"
              :color="layer.visible ? 'white' : 'grey'"
              @click.stop="toggleVisibility(layer)"
            >
              <v-icon size="small">{{ layer.visible ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
            </v-btn>
            
            <span 
              class="layer-name"
              :class="{ 'layer-name--editing': editingLayerId === layer.id }"
            >
              <input
                v-if="editingLayerId === layer.id"
                v-model="editingName"
                class="layer-name-input"
                @blur="finishEditing"
                @keydown.enter="finishEditing"
                @keydown.escape="cancelEditing"
                ref="nameInputRef"
              />
              <span 
                v-else 
                @dblclick="startEditing(layer)"
                class="layer-name-text"
              >
                {{ layer.name }}
              </span>
            </span>
            
            <div class="layer-actions">
              <v-btn
                icon
                size="x-small"
                variant="text"
                :color="layer.locked ? 'warning' : 'grey'"
                @click.stop="toggleLock(layer)"
              >
                <v-icon size="small">{{ layer.locked ? 'mdi-lock' : 'mdi-lock-open-variant' }}</v-icon>
              </v-btn>
              
              <v-btn
                icon
                size="x-small"
                variant="text"
                :color="layer.showOnPortal !== false ? 'primary' : 'grey'"
                @click.stop="toggleShowOnPortal(layer)"
                title="Show on Portal"
              >
                <v-icon size="small">{{ layer.showOnPortal !== false ? 'mdi-projector-screen' : 'mdi-projector-screen-off' }}</v-icon>
              </v-btn>
              
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    color="grey"
                    v-bind="menuProps"
                    @click.stop
                  >
                    <v-icon size="small">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" class="layer-menu">
                  <v-list-item @click="openOpacityDialog(layer)">
                    <template #prepend>
                      <v-icon size="small">mdi-opacity</v-icon>
                    </template>
                    <v-list-item-title>Opacity</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="toggleShowOnPortal(layer)">
                    <template #prepend>
                      <v-icon size="small">{{ layer.showOnPortal !== false ? 'mdi-projector-screen-off' : 'mdi-projector-screen' }}</v-icon>
                    </template>
                    <v-list-item-title>{{ layer.showOnPortal !== false ? 'Hide on Portal' : 'Show on Portal' }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item 
                    v-if="!isDefaultLayer(layer.id)"
                    @click="handleDeleteLayer(layer)"
                    class="text-error"
                  >
                    <template #prepend>
                      <v-icon size="small" color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title>Delete Layer</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </template>
      </draggable>
    </div>
    
    <!-- Opacity Dialog -->
    <v-dialog v-model="showOpacityDialog" max-width="300">
      <v-card class="glass-card">
        <v-card-title>Layer Opacity</v-card-title>
        <v-card-text>
          <v-slider
            v-model="opacityValue"
            min="0"
            max="1"
            step="0.1"
            thumb-label
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showOpacityDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="applyOpacity">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Add Layer Dialog -->
    <v-dialog v-model="showAddDialog" max-width="300">
      <v-card class="glass-card">
        <v-card-title>Add Layer</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newLayerName"
            label="Layer Name"
            autofocus
            @keydown.enter="confirmAddLayer"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmAddLayer">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card class="glass-card">
        <v-card-title>Delete Layer</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ layerToDelete?.name }}"? 
          All items in this layer will be permanently deleted.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDeleteLayer">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useDmScreensStore } from '@/stores/dmScreens'
import type { DmScreenLayer } from '@/types/dmScreen.types'
import { DEFAULT_LAYERS } from '@/types/dmScreen.types'

interface Props {
  dmScreenId: string
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'layer-select': [layerId: string]
}>()

const dmScreensStore = useDmScreensStore()

// Local state for draggable - reversed for UI (top = highest order)
const localLayers = ref<DmScreenLayer[]>([])

// Watch store layers and sync to local (reversed order for display)
watch(
  () => dmScreensStore.getLayers(props.dmScreenId),
  (layers) => {
    // Sort by order descending (highest order at top of list)
    localLayers.value = [...layers].sort((a, b) => b.order - a.order)
  },
  { immediate: true, deep: true }
)

// Selection state
const selectedLayerId = ref<string | null>(null)

// Editing state
const editingLayerId = ref<string | null>(null)
const editingName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

// Dialog state
const showOpacityDialog = ref(false)
const opacityValue = ref(1)
const opacityLayerId = ref<string | null>(null)

const showAddDialog = ref(false)
const newLayerName = ref('')

const showDeleteDialog = ref(false)
const layerToDelete = ref<DmScreenLayer | null>(null)

function isDefaultLayer(layerId: string): boolean {
  return layerId === DEFAULT_LAYERS.BACKGROUND || layerId === DEFAULT_LAYERS.SCREEN
}

function selectLayer(layerId: string) {
  selectedLayerId.value = layerId
  emit('layer-select', layerId)
}

function toggleVisibility(layer: DmScreenLayer) {
  dmScreensStore.updateLayer(props.dmScreenId, props.libraryId, layer.id, {
    visible: !layer.visible
  })
}

function toggleLock(layer: DmScreenLayer) {
  dmScreensStore.updateLayer(props.dmScreenId, props.libraryId, layer.id, {
    locked: !layer.locked
  })
}

function toggleShowOnPortal(layer: DmScreenLayer) {
  dmScreensStore.updateLayer(props.dmScreenId, props.libraryId, layer.id, {
    showOnPortal: layer.showOnPortal === false ? true : false
  })
}

function startEditing(layer: DmScreenLayer) {
  if (isDefaultLayer(layer.id)) return // Don't allow editing default layer names
  editingLayerId.value = layer.id
  editingName.value = layer.name
  nextTick(() => {
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
  })
}

function finishEditing() {
  if (editingLayerId.value && editingName.value.trim()) {
    dmScreensStore.updateLayer(props.dmScreenId, props.libraryId, editingLayerId.value, {
      name: editingName.value.trim()
    })
  }
  editingLayerId.value = null
  editingName.value = ''
}

function cancelEditing() {
  editingLayerId.value = null
  editingName.value = ''
}

function openOpacityDialog(layer: DmScreenLayer) {
  opacityLayerId.value = layer.id
  opacityValue.value = layer.opacity
  showOpacityDialog.value = true
}

function applyOpacity() {
  if (opacityLayerId.value) {
    dmScreensStore.updateLayer(props.dmScreenId, props.libraryId, opacityLayerId.value, {
      opacity: opacityValue.value
    })
  }
  showOpacityDialog.value = false
  opacityLayerId.value = null
}

function handleAddLayer() {
  newLayerName.value = `Layer ${localLayers.value.length + 1}`
  showAddDialog.value = true
}

function confirmAddLayer() {
  if (newLayerName.value.trim()) {
    dmScreensStore.addLayer(props.dmScreenId, props.libraryId, newLayerName.value.trim())
  }
  showAddDialog.value = false
  newLayerName.value = ''
}

function handleDeleteLayer(layer: DmScreenLayer) {
  layerToDelete.value = layer
  showDeleteDialog.value = true
}

function confirmDeleteLayer() {
  if (layerToDelete.value) {
    dmScreensStore.removeLayer(props.dmScreenId, props.libraryId, layerToDelete.value.id)
  }
  showDeleteDialog.value = false
  layerToDelete.value = null
}

function handleReorder() {
  // localLayers is in reverse order (top = highest), so we need to reverse it back
  // and assign new order values
  const newOrder = localLayers.value
    .slice()
    .reverse()
    .map(l => l.id)
  
  dmScreensStore.reorderLayers(props.dmScreenId, props.libraryId, newOrder)
}
</script>

<style scoped>
.layer-control {
  background: rgba(22, 22, 32, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  min-width: 200px;
  max-width: 280px;
}

.layer-control-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.layer-control-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.7);
}

.layer-list {
  max-height: 300px;
  overflow-y: auto;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background 0.15s ease;
}

.layer-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.layer-item--selected {
  background: rgba(99, 102, 241, 0.2);
  border-left: 2px solid #6366f1;
}

.layer-item--hidden {
  opacity: 0.5;
}

.layer-item--locked .layer-name-text {
  color: rgba(255, 255, 255, 0.5);
}

.layer-drag-handle {
  cursor: grab;
  padding: 4px;
  display: flex;
  align-items: center;
}

.layer-drag-handle:active {
  cursor: grabbing;
}

.layer-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.layer-name-text {
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}

.layer-name-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(99, 102, 241, 0.5);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 13px;
  color: white;
  outline: none;
}

.layer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.layer-item:hover .layer-actions {
  opacity: 1;
}

.layer-menu {
  background: rgba(22, 22, 32, 0.98) !important;
}

/* Scrollbar styling */
.layer-list::-webkit-scrollbar {
  width: 6px;
}

.layer-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.layer-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.layer-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.glass-card {
  background: rgba(22, 22, 32, 0.98) !important;
  backdrop-filter: blur(20px);
}
</style>

