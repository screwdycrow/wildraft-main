<template>
  <div class="dm-screen-toolbar" :style="toolbarStyle">
    <div class="toolbar-content">
      <div class="toolbar-header">
        <v-icon icon="mdi-monitor-dashboard" size="small" class="mb-1" />
        <div class="toolbar-title">DM Screen</div>
      </div>
      
      <v-divider class="my-3" />
      
      <!-- Add Item Button -->
      <v-btn
        icon
        size="large"
        color="primary"
        variant="flat"
        class="toolbar-btn"
        @click="$emit('add-item')"
      >
        <v-icon>mdi-plus</v-icon>
        <v-tooltip activator="parent" location="right">
          Add Library Item
        </v-tooltip>
      </v-btn>

      <!-- Add Background Image Button -->
      <v-btn
        icon
        size="large"
        color="secondary"
        variant="flat"
        class="toolbar-btn"
        @click="$emit('add-background')"
      >
        <v-icon>mdi-image-plus</v-icon>
        <v-tooltip activator="parent" location="right">
          Add Background Image
        </v-tooltip>
      </v-btn>

      <v-divider class="my-3" />

      <!-- Settings Button -->
      <v-btn
        icon
        size="large"
        :color="showGrid ? 'primary' : 'grey'"
        variant="tonal"
        class="toolbar-btn"
        @click="$emit('open-settings')"
      >
        <v-icon>mdi-cog</v-icon>
        <v-tooltip activator="parent" location="right">
          Settings
        </v-tooltip>
      </v-btn>

      <!-- Lock Background Images Toggle -->
      <v-btn
        icon
        size="large"
        :color="lockBackgroundImages ? 'warning' : 'grey'"
        variant="tonal"
        class="toolbar-btn"
        @click="$emit('toggle-lock-background')"
      >
        <v-icon>{{ lockBackgroundImages ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
        <v-tooltip activator="parent" location="right">
          {{ lockBackgroundImages ? 'Unlock Background Images' : 'Lock Background Images' }}
        </v-tooltip>
      </v-btn>

      <!-- Show Grid Toggle -->
      <v-btn
        icon
        size="large"
        :color="showGrid ? 'primary' : 'grey'"
        variant="tonal"
        class="toolbar-btn"
        @click="$emit('toggle-grid')"
      >
        <v-icon>{{ showGrid ? 'mdi-grid' : 'mdi-grid-off' }}</v-icon>
        <v-tooltip activator="parent" location="right">
          {{ showGrid ? 'Hide Grid' : 'Show Grid' }}
        </v-tooltip>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  sidebarWidth?: number
  lockBackgroundImages?: boolean
  showGrid?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sidebarWidth: 200, // Default sidebar width when not in rail mode
  lockBackgroundImages: false,
  showGrid: true,
})

defineEmits<{
  'add-item': []
  'add-background': []
  'open-settings': []
  'toggle-lock-background': []
  'toggle-grid': []
}>()

const toolbarStyle = computed(() => {
  return {
    left: `${props.sidebarWidth}px`,
  }
})
</script>

<style scoped>
.dm-screen-toolbar {
  position: fixed;
  top: 70px; /* Below app bar */
  left: 200px; /* Default, will be overridden by computed style */
  height: calc(100vh - 70px);
  z-index: 999;
  transition: left 0.3s ease;
}

.toolbar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: rgba(30, 30, 40, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
  width: 64px;
  backdrop-filter: blur(10px);
}

.toolbar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.toolbar-title {
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  line-height: 1.1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.7);
}

.toolbar-btn {
  margin-bottom: 8px;
  border-radius: 8px !important;
}

.toolbar-btn:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}
</style>

