<template>
  <v-dialog
    :model-value="visible"
    @update:model-value="$emit('close')"
    transition="dialog-bottom-transition"
    :scrim="true"
    max-width="none"
    width="auto"
  >
    <div class="portal-show-on-top-container">
      <!-- TV Remote Control Header -->
      <div class="tv-remote-header">
        <div class="tv-remote-brand">PORTAL VIEW</div>
        <div class="tv-remote-status">
          <v-chip size="x-small" color="success" variant="flat">● LIVE</v-chip>
        </div>
      </div>

      <!-- Main Viewer Area (Fullscreen) -->
      <div class="viewer-fullscreen">
        <portal-view-item
          v-if="item"
          :item="item"
          :index="0"
          :viewer-state="viewerState"
          :fullscreen="true"
        />
        <div v-else class="no-item-display">
          <v-icon icon="mdi-television-off" size="120" color="grey" />
          <p class="text-h6 mt-4">No item to display</p>
        </div>
      </div>

      <!-- TV Remote Control Footer -->
      <div class="tv-remote-footer">
        <div class="tv-remote-buttons">
          <!-- Close Button (Power) -->
          <v-btn
            icon
            size="large"
            color="error"
            variant="flat"
            class="remote-btn power-btn"
            @click="$emit('close')"
          >
            <v-icon size="32">mdi-power</v-icon>
            <v-tooltip activator="parent" location="top">Power Off (Close)</v-tooltip>
          </v-btn>

          <!-- Navigation Buttons -->
          <div class="remote-nav-cluster">
            <v-btn
              icon
              size="small"
              variant="tonal"
              class="remote-btn"
              @click="$emit('close')"
            >
              <v-icon>mdi-arrow-up</v-icon>
            </v-btn>
            <div class="remote-nav-row">
              <v-btn
                icon
                size="small"
                variant="tonal"
                class="remote-btn"
                @click="$emit('close')"
              >
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="flat"
                color="primary"
                class="remote-btn ok-btn"
                @click="$emit('close')"
              >
                <v-icon>mdi-check</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="tonal"
                class="remote-btn"
                @click="$emit('close')"
              >
                <v-icon>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
            <v-btn
              icon
              size="small"
              variant="tonal"
              class="remote-btn"
              @click="$emit('close')"
            >
              <v-icon>mdi-arrow-down</v-icon>
            </v-btn>
          </div>

          <!-- Item Info -->
          <div v-if="item" class="remote-info">
            <div class="text-caption text-grey-lighten-1">{{ item.type }}</div>
            <div class="text-caption text-grey-darken-1">Press POWER to close</div>
          </div>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import PortalViewItem from './PortalViewItem.vue'
import type { PortalViewItem as PortalViewItemType, ViewerState } from '@/types/portal.types'

interface Props {
  visible: boolean
  item: PortalViewItemType | null
  viewerState?: ViewerState | null
}

const props = defineProps<Props>()

defineEmits<{
  close: []
}>()

// Debug: Log when item changes
watch(() => props.item, (newItem) => {
  console.log('[ShowOnTopDialog] Item changed:', newItem)
  console.log('[ShowOnTopDialog] Item type:', newItem?.type)
  console.log('[ShowOnTopDialog] Item object:', newItem?.object)
}, { immediate: true })
</script>

<style scoped>
.portal-show-on-top-container {
  width: auto;
  max-width: 90vw;
  height: 80vh;
  background: #000;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

/* TV Remote Control Styling */
.tv-remote-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tv-remote-brand {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  color: #00ff00;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
}

.tv-remote-status {
  display: flex;
  gap: 8px;
  align-items: center;
}

.viewer-fullscreen {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 0; /* Allow flex shrinking */
}

.tv-remote-footer {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.95) 0%, transparent 100%);
  padding: 24px;
  border-radius: 20px 20px 0 0;
}

.tv-remote-buttons {
  display: flex;
  gap: 32px;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.remote-btn {
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.power-btn {
  animation: pulse-red 2s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
  }
}

.remote-nav-cluster {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.remote-nav-row {
  display: flex;
  gap: 4px;
}

.ok-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(var(--v-theme-primary), 0.6);
}

.remote-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.no-item-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
}
</style>

