<template>
  <div v-if="inline" class="portal-controls-inline h-100">
    <PortalControlsContent hide-header />
  </div>
  <v-menu v-else location="bottom" :close-on-content-click="false" max-width="400">
    <template #activator="{ props: menuProps }">
      <v-btn
        icon
        v-bind="menuProps"
        class="portal-control-button"
        size="default"
      >
        <v-icon icon="mdi-monitor" size="20" />
        <v-badge
          v-if="hasLoadedPortals && activePortal"
          :color="isConnected ? 'success' : 'error'"
          dot
          location="bottom right"
          offset-x="2"
          offset-y="2"
        />
        <v-tooltip activator="parent" location="bottom">
          {{ activePortal?.name || (hasLoadedPortals ? 'No Active Portal' : 'Portal Controls') }}
        </v-tooltip>
      </v-btn>
    </template>
    <PortalControlsContent />
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePortalViewsStore } from '@/stores/portalViews'
import { usePortalSocket } from '@/composables/usePortalSocket'
import PortalControlsContent from './PortalControlsContent.vue'

defineProps<{
  inline?: boolean
}>()

const portalViewsStore = usePortalViewsStore()
const { isConnected } = usePortalSocket()

const activePortal = computed(() => portalViewsStore.activePortal)
const hasLoadedPortals = computed(() => portalViewsStore.portalViews.length > 0)
</script>

<style scoped>
.portal-control-button {
  background: rgba(var(--v-theme-surface), 0.2) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.portal-control-button:hover {
  background: rgba(var(--v-theme-surface), 0.3) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  opacity: 1;
}
</style>
