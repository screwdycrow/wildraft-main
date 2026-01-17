<template>
  <div class="floating-toolbar-container">
    <div class="floating-toolbar">
      <!-- Main actions -->
      <div class="toolbar-section">
        <v-btn
          icon
          size="small"
          variant="text"
          color="primary"
          class="toolbar-btn"
          @click="$emit('add-item')"
        >
          <v-icon size="20">mdi-plus-circle</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Library Item
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          color="secondary"
          class="toolbar-btn"
          @click="$emit('add-background')"
        >
          <v-icon size="20">mdi-image-plus</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Background Image
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          color="accent"
          class="toolbar-btn"
          @click="$emit('add-file')"
        >
          <v-icon size="20">mdi-file-plus</v-icon>
          <v-tooltip activator="parent" location="top">
            Add File
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          color="info"
          class="toolbar-btn"
          @click="$emit('add-text-node')"
        >
          <v-icon size="20">mdi-text-box-plus</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Text
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          color="success"
          class="toolbar-btn"
          @click="$emit('add-shape-node')"
        >
          <v-icon size="20">mdi-shape-plus</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Shape
          </v-tooltip>
        </v-btn>
      </div>

      <v-divider vertical class="toolbar-divider" />

      <!-- View controls -->
      <div class="toolbar-section">
        <v-btn
          icon
          size="small"
          variant="text"
          :color="showGrid ? 'primary' : 'grey'"
          class="toolbar-btn"
          @click="$emit('toggle-grid')"
        >
          <v-icon size="20">{{ showGrid ? 'mdi-grid' : 'mdi-grid-off' }}</v-icon>
          <v-tooltip activator="parent" location="top">
            {{ showGrid ? 'Hide Grid' : 'Show Grid' }}
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="small"
          variant="text"
          :color="lockBackgroundImages ? 'warning' : 'grey'"
          class="toolbar-btn"
          @click="$emit('toggle-lock-background')"
        >
          <v-icon size="20">{{ lockBackgroundImages ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
          <v-tooltip activator="parent" location="top">
            {{ lockBackgroundImages ? 'Unlock Backgrounds' : 'Lock Backgrounds' }}
          </v-tooltip>
        </v-btn>
      </div>

      <v-divider vertical class="toolbar-divider" />

      <!-- Selected item actions -->
      <div v-if="selectedItem" class="toolbar-section">
        <!-- Duplicate button (all items) -->
        <v-btn
          icon
          size="small"
          variant="text"
          color="secondary"
          class="toolbar-btn"
          @click="$emit('duplicate-item')"
        >
          <v-icon size="20">mdi-content-duplicate</v-icon>
          <v-tooltip activator="parent" location="top">
            Duplicate
          </v-tooltip>
        </v-btn>

        <!-- Send to back -->
        <v-btn
          icon
          size="small"
          variant="text"
          color="warning"
          class="toolbar-btn"
          @click="$emit('send-to-back')"
        >
          <v-icon size="20">mdi-arrange-send-backward</v-icon>
          <v-tooltip activator="parent" location="top">
            Send to Back
          </v-tooltip>
        </v-btn>

        <!-- Send to front -->
        <v-btn
          icon
          size="small"
          variant="text"
          color="warning"
          class="toolbar-btn"
          @click="$emit('send-to-front')"
        >
          <v-icon size="20">mdi-arrange-bring-forward</v-icon>
          <v-tooltip activator="parent" location="top">
            Send to Front
          </v-tooltip>
        </v-btn>

        <!-- Move to Layer -->
        <v-menu v-if="layers && layers.length > 1">
          <template #activator="{ props: menuProps }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="purple"
              class="toolbar-btn"
              v-bind="menuProps"
            >
              <v-icon size="20">mdi-layers-outline</v-icon>
              <v-tooltip activator="parent" location="top">
                Move to Layer
              </v-tooltip>
            </v-btn>
          </template>
          <v-list density="compact" class="layer-menu">
            <v-list-item
              v-for="layer in layers"
              :key="layer.id"
              :disabled="isCurrentLayer(layer.id)"
              @click="handleMoveToLayer(layer.id)"
            >
              <template #prepend>
                <v-icon size="small" :color="isCurrentLayer(layer.id) ? 'primary' : undefined">
                  {{ isCurrentLayer(layer.id) ? 'mdi-check' : 'mdi-layers' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ layer.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Rotate Left -->
        <v-btn
          icon
          size="small"
          variant="text"
          color="info"
          class="toolbar-btn"
          @click="$emit('rotate-left')"
        >
          <v-icon size="20">mdi-rotate-left</v-icon>
          <v-tooltip activator="parent" location="top">
            Rotate Left (-90°)
          </v-tooltip>
        </v-btn>

        <!-- Rotate Right -->
        <v-btn
          icon
          size="small"
          variant="text"
          color="info"
          class="toolbar-btn"
          @click="$emit('rotate-right')"
        >
          <v-icon size="20">mdi-rotate-right</v-icon>
          <v-tooltip activator="parent" location="top">
            Rotate Right (+90°)
          </v-tooltip>
        </v-btn>

        <!-- Edit Text (only for text nodes) -->
        <v-btn
          v-if="selectedItem.type === 'TextNode'"
          icon
          size="small"
          variant="text"
          color="info"
          class="toolbar-btn"
          @click="$emit('edit-text')"
        >
          <v-icon size="20">mdi-pencil</v-icon>
          <v-tooltip activator="parent" location="top">
            Edit Text
          </v-tooltip>
        </v-btn>

        <!-- Shape color/border editor (only for shapes) -->
        <v-btn
          v-if="selectedItem.type === 'ShapeNode'"
          icon
          size="small"
          variant="text"
          color="info"
          class="toolbar-btn"
          @click="$emit('edit-shape-style')"
        >
          <v-icon size="20">mdi-palette</v-icon>
          <v-tooltip activator="parent" location="top">
            Edit Shape Style
          </v-tooltip>
        </v-btn>

        <!-- Delete button -->
        <v-btn
          icon
          size="small"
          variant="text"
          color="error"
          class="toolbar-btn"
          @click="$emit('delete-selected')"
        >
          <v-icon size="20">mdi-trash-can</v-icon>
          <v-tooltip activator="parent" location="top">
            Delete
          </v-tooltip>
        </v-btn>
      </div>

      <v-divider v-if="selectedItem" vertical class="toolbar-divider" />

      <!-- Settings -->
      <div class="toolbar-section">
        <v-btn
          icon
          size="small"
          variant="text"
          color="grey"
          class="toolbar-btn"
          @click="$emit('open-settings')"
        >
          <v-icon size="20">mdi-cog</v-icon>
          <v-tooltip activator="parent" location="top">
            Settings
          </v-tooltip>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DmScreenItem, DmScreenLayer } from '@/types/dmScreen.types'
import { DEFAULT_LAYERS } from '@/types/dmScreen.types'

interface Props {
  lockBackgroundImages?: boolean
  showGrid?: boolean
  selectedItem?: DmScreenItem | null
  layers?: DmScreenLayer[]
}

const props = withDefaults(defineProps<Props>(), {
  lockBackgroundImages: false,
  showGrid: true,
  selectedItem: null,
  layers: () => [],
})

const emit = defineEmits<{
  'add-item': []
  'add-background': []
  'add-file': []
  'add-text-node': []
  'add-shape-node': []
  'open-settings': []
  'toggle-lock-background': []
  'toggle-grid': []
  'duplicate-item': []
  'send-to-back': []
  'send-to-front': []
  'rotate-left': []
  'rotate-right': []
  'edit-text': []
  'edit-shape-style': []
  'delete-selected': []
  'move-to-layer': [layerId: string]
}>()

// Check if the selected item is in the given layer
function isCurrentLayer(layerId: string): boolean {
  if (!props.selectedItem) return false
  const itemLayer = props.selectedItem.layer || DEFAULT_LAYERS.SCREEN
  return itemLayer === layerId
}

// Handle move to layer click
function handleMoveToLayer(layerId: string) {
  console.log('[FloatingToolbar] Move to layer clicked:', layerId, 'item:', props.selectedItem?.id)
  if (!isCurrentLayer(layerId)) {
    emit('move-to-layer', layerId)
  }
}
</script>

<style scoped>
.floating-toolbar-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
}

.floating-toolbar:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 3px;
}

.toolbar-divider {
  height: 24px;
  margin: 0 6px;
  opacity: 0.25;
}

.toolbar-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 10px !important;
  opacity: 0.85;
  transition: all 0.15s ease;
}

.toolbar-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12) !important;
  transform: scale(1.08);
}

.toolbar-btn :deep(.v-icon) {
  font-size: 20px;
}

.layer-menu {
  background: rgba(22, 22, 32, 0.98) !important;
  backdrop-filter: blur(12px);
  min-width: 150px;
}
</style>

