<template>
  <div class="floating-toolbar-container">
    <div class="floating-toolbar">
      <!-- Main actions -->
      <div class="toolbar-section">
        <v-btn
          icon
          size="large"
          variant="flat"
          color="primary"
          class="toolbar-btn"
          @click="$emit('add-item')"
        >
          <v-icon>mdi-plus-circle</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Library Item
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="large"
          variant="flat"
          color="secondary"
          class="toolbar-btn"
          @click="$emit('add-background')"
        >
          <v-icon>mdi-image-plus</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Background Image
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="large"
          variant="flat"
          color="info"
          class="toolbar-btn"
          @click="$emit('add-text-node')"
        >
          <v-icon>mdi-text-box-plus</v-icon>
          <v-tooltip activator="parent" location="top">
            Add Text
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="large"
          variant="flat"
          color="success"
          class="toolbar-btn"
          @click="$emit('add-shape-node')"
        >
          <v-icon>mdi-shape-plus</v-icon>
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
          size="large"
          variant="flat"
          :color="showGrid ? 'primary' : 'grey'"
          class="toolbar-btn"
          @click="$emit('toggle-grid')"
        >
          <v-icon>{{ showGrid ? 'mdi-grid' : 'mdi-grid-off' }}</v-icon>
          <v-tooltip activator="parent" location="top">
            {{ showGrid ? 'Hide Grid' : 'Show Grid' }}
          </v-tooltip>
        </v-btn>

        <v-btn
          icon
          size="large"
          variant="flat"
          :color="lockBackgroundImages ? 'warning' : 'grey'"
          class="toolbar-btn"
          @click="$emit('toggle-lock-background')"
        >
          <v-icon>{{ lockBackgroundImages ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
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
          size="large"
          variant="flat"
          color="secondary"
          class="toolbar-btn"
          @click="$emit('duplicate-item')"
        >
          <v-icon>mdi-content-duplicate</v-icon>
          <v-tooltip activator="parent" location="top">
            Duplicate
          </v-tooltip>
        </v-btn>

        <!-- Send to back -->
        <v-btn
          icon
          size="large"
          variant="flat"
          color="warning"
          class="toolbar-btn"
          @click="$emit('send-to-back')"
        >
          <v-icon>mdi-arrange-send-backward</v-icon>
          <v-tooltip activator="parent" location="top">
            Send to Back
          </v-tooltip>
        </v-btn>

        <!-- Send to front -->
        <v-btn
          icon
          size="large"
          variant="flat"
          color="warning"
          class="toolbar-btn"
          @click="$emit('send-to-front')"
        >
          <v-icon>mdi-arrange-bring-forward</v-icon>
          <v-tooltip activator="parent" location="top">
            Send to Front
          </v-tooltip>
        </v-btn>

        <!-- Edit Text (only for text nodes) -->
        <v-btn
          v-if="selectedItem.type === 'TextNode'"
          icon
          size="large"
          variant="flat"
          color="info"
          class="toolbar-btn"
          @click="$emit('edit-text')"
        >
          <v-icon>mdi-pencil</v-icon>
          <v-tooltip activator="parent" location="top">
            Edit Text
          </v-tooltip>
        </v-btn>

        <!-- Shape color/border editor (only for shapes) -->
        <v-btn
          v-if="selectedItem.type === 'ShapeNode'"
          icon
          size="large"
          variant="flat"
          color="info"
          class="toolbar-btn"
          @click="$emit('edit-shape-style')"
        >
          <v-icon>mdi-palette</v-icon>
          <v-tooltip activator="parent" location="top">
            Edit Shape Style
          </v-tooltip>
        </v-btn>

        <!-- Delete button -->
        <v-btn
          icon
          size="large"
          variant="flat"
          color="error"
          class="toolbar-btn"
          @click="$emit('delete-selected')"
        >
          <v-icon>mdi-trash-can</v-icon>
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
          size="large"
          variant="flat"
          color="grey"
          class="toolbar-btn"
          @click="$emit('open-settings')"
        >
          <v-icon>mdi-cog</v-icon>
          <v-tooltip activator="parent" location="top">
            Settings
          </v-tooltip>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DmScreenItem } from '@/types/dmScreen.types'

interface Props {
  lockBackgroundImages?: boolean
  showGrid?: boolean
  selectedItem?: DmScreenItem | null
}

withDefaults(defineProps<Props>(), {
  lockBackgroundImages: false,
  showGrid: true,
  selectedItem: null,
})

defineEmits<{
  'add-item': []
  'add-background': []
  'add-text-node': []
  'add-shape-node': []
  'open-settings': []
  'toggle-lock-background': []
  'toggle-grid': []
  'duplicate-item': []
  'send-to-back': []
  'send-to-front': []
  'edit-text': []
  'edit-shape-style': []
  'delete-selected': []
}>()
</script>

<style scoped>
.floating-toolbar-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;
}

.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
              0 2px 8px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  pointer-events: auto;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  height: 32px;
  margin: 0 8px;
  opacity: 0.3;
}

.toolbar-btn {
  border-radius: 12px !important;
}

.toolbar-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>

