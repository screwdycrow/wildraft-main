<template>
  <!-- Player picks a shared portal from the dashboard or the sidebar. -->
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <template v-if="playerContent.isLoading">
          <v-progress-circular indeterminate color="primary" size="48" />
          <p class="text-body-1 mt-4">Preparing your table…</p>
        </template>

        <template v-else-if="playerContent.portalViews.length === 0">
          <v-icon icon="mdi-campfire" size="80" color="primary" class="mb-4 float-animation" />
          <h2 class="text-h5 mb-2">The table isn't set yet</h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Your DM hasn't opened a portal for you. When they do, it will appear here — meanwhile,
            check the sidebar for anything they've already shared with you.
          </p>
        </template>

        <template v-else>
          <v-icon icon="mdi-monitor-eye" size="64" color="primary" class="mb-4" />
          <h2 class="text-h5 mb-4">Choose your portal</h2>
          <v-btn
            v-for="portal in playerContent.portalViews"
            :key="portal.id"
            color="primary"
            variant="tonal"
            size="large"
            class="ma-1"
            prepend-icon="mdi-monitor"
            @click="open(portal.id)"
          >
            {{ portal.name }}
          </v-btn>
        </template>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { usePlayerContentStore } from '@/stores/playerContent'

const route = useRoute()
const router = useRouter()
const playerContent = usePlayerContentStore()

function open(portalViewId: string) {
  playerContent.setActivePortal(portalViewId)
  router.push({
    name: 'PlayerPortal',
    params: { id: route.params.id, portalViewId },
  })
}
</script>

<style scoped>
.float-animation {
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
</style>
