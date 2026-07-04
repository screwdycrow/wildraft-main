<template>
  <div class="player-dm-screen-view">
    <!-- Loading State -->
    <div v-if="dmScreensStore.isLoading && !dmScreen" class="state-block">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading DM screen...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="state-block">
      <v-icon icon="mdi-lock-outline" size="96" color="warning" class="mb-4" />
      <h2 class="text-h5 font-weight-bold mb-2">Can't open this screen</h2>
      <p class="text-body-1 text-grey-lighten-1 mb-6">
        {{ loadError }}
      </p>
      <v-btn color="primary" variant="tonal" @click="goBack">Back to your dashboard</v-btn>
    </div>

    <!-- DM Screen Content: players with canEdit move their own items and add
         notes/shapes; everything else is view-only -->
    <div v-else-if="dmScreen" class="dm-screen-container">
      <dm-screen-wrapper
        :dm-screen="dmScreen"
        :is-portal-mode="!canEdit"
        :is-player-mode="true"
        :current-user-id="authStore.user?.id"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useDmScreenSocketStore } from '@/stores/dmScreenSocket'
import { useAuthStore } from '@/stores/auth'
import { usePlayerContentStore } from '@/stores/playerContent'
import DmScreenWrapper from '@/components/dmScreen/DmScreenWrapper.vue'

const route = useRoute()
const router = useRouter()
const dmScreensStore = useDmScreensStore()
const dmScreenSocket = useDmScreenSocketStore()
const authStore = useAuthStore()
const playerContent = usePlayerContentStore()

const loadError = ref<string | null>(null)

const canEdit = computed(
  () => playerContent.dmScreens.find((s) => s.id === dmScreenId.value)?.canEdit ?? false
)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const dmScreenId = computed(() => route.params.dmScreenId as string)

const dmScreen = computed(() => dmScreensStore.currentDmScreen)

async function loadDmScreen() {
  if (!libraryId.value || !dmScreenId.value) return
  loadError.value = null
  try {
    await dmScreensStore.fetchDmScreen(libraryId.value, dmScreenId.value, true)
    dmScreenSocket.connect(libraryId.value, dmScreenId.value)
  } catch (err: any) {
    loadError.value =
      err.response?.data?.message || 'This DM screen has not been shared with you.'
  }
}

function goBack() {
  router.push({ name: 'PlayerDashboard', params: { id: libraryId.value } })
}

onMounted(() => {
  dmScreensStore.setPlayerMode(true)
  loadDmScreen()
})
onUnmounted(() => {
  dmScreensStore.setPlayerMode(false)
  dmScreenSocket.disconnect()
})
watch(() => route.params.dmScreenId, loadDmScreen)
</script>

<style scoped>
.player-dm-screen-view {
  width: 100%;
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  text-align: center;
  padding: 48px;
}

.dm-screen-container {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
</style>
