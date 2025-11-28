<template>
  <div class="layer-panel">
    <!-- Toggle Button -->
    <button
      class="layer-toggle-button"
      :class="{ 'layer-toggle-button--active': isOpen }"
      @click="isOpen = !isOpen"
    >
      <v-icon :icon="isOpen ? 'mdi-close' : 'mdi-layers'" size="small" />
      <span class="toggle-label">Layers</span>
      <span class="layer-count-badge">{{ localLayers.length }}</span>
    </button>

    <!-- Layer Drawer -->
    <transition name="layer-drawer">
      <div v-show="isOpen" class="layer-drawer">
        <div class="drawer-header">
          <h3 class="drawer-title">
            <v-icon icon="mdi-layers" size="small" class="mr-2" />
            Layers
          </h3>
          <div class="header-actions">
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
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="isOpen = false"
            />
          </div>
        </div>

        <!-- Layer List -->
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
                
                <!-- Portal indicator dot -->
                <div 
                  class="layer-portal-indicator"
                  :class="{ 'layer-portal-indicator--active': layer.showOnPortal !== false }"
                  :title="layer.showOnPortal !== false ? 'Showing on portal' : 'Hidden from portal'"
                />
                
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :color="layer.visible ? 'white' : 'grey'"
                  @click.stop="toggleVisibility(layer)"
                >
                  <v-icon size="small">{{ layer.visible ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
                </v-btn>
                
                <span class="layer-name">
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

        <!-- Tips -->
        <div class="drawer-tips">
          <v-icon icon="mdi-information-outline" size="x-small" class="mr-1" />
          <span>Drag to reorder, double-click to rename</span>
        </div>
      </div>
    </transition>
    
    <!-- Dialogs -->
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
import { ref, watch, nextTick } from 'vue'
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

// Open state
const isOpen = ref(false)

// Local state for draggable
const localLayers = ref<DmScreenLayer[]>([])

watch(
  () => dmScreensStore.getLayers(props.dmScreenId),
  (layers) => {
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
  if (isDefaultLayer(layer.id)) return
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
  const newOrder = localLayers.value
    .slice()
    .reverse()
    .map(l => l.id)
  
  dmScreensStore.reorderLayers(props.dmScreenId, props.libraryId, newOrder)
}
</script>

<style scoped>
.layer-panel {
  position: relative;
}

.layer-toggle-button {
  width: auto;
  height: 36px;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.7);
}

.layer-toggle-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 1);
}

.layer-toggle-button--active {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  color: #a5b4fc;
}

.toggle-label {
  font-size: 11px;
  font-weight: 500;
}

.layer-count-badge {
  background: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  min-width: 18px;
  text-align: center;
}

.layer-drawer {
  position: absolute;
  right: 0;
  bottom: 44px;
  width: 320px;
  max-height: 400px;
  background: rgba(22, 22, 32, 0.98);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5),
              0 -2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  display: flex;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.layer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.02);
}

.layer-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.layer-item--selected {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
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

.layer-portal-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.layer-portal-indicator--active {
  background: #6366f1;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.6);
}

.layer-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.layer-name-text {
  display: block;
  font-size: 12px;
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
  font-size: 12px;
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

.drawer-tips {
  padding: 8px 12px;
  background: rgba(99, 102, 241, 0.1);
  border-top: 1px solid rgba(99, 102, 241, 0.2);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
}

/* Drawer transition */
.layer-drawer-enter-active,
.layer-drawer-leave-active {
  transition: all 0.3s ease;
}

.layer-drawer-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.layer-drawer-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.layer-drawer-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.layer-drawer-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* Scrollbar styling */
.layer-list::-webkit-scrollbar {
  width: 6px;
}

.layer-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.layer-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.layer-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.layer-menu {
  background: rgba(22, 22, 32, 0.98) !important;
}

.glass-card {
  background: rgba(22, 22, 32, 0.98) !important;
  backdrop-filter: blur(20px);
}
</style>
