<template>
  <v-menu location="bottom" :close-on-content-click="false" max-width="300">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="text"
        size="small"
        class="dm-screen-control-button"
      >
        <v-icon icon="mdi-monitor-dashboard" size="small" class="mr-1" />
        <span class="dm-screen-name">{{ activeDmScreen?.name || 'No Active DM Screen' }}</span>
        <v-icon icon="mdi-menu-down" size="small" class="ml-1" />
      </v-btn>
    </template>

    <v-card class="dm-screen-control-card">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-3">
        <v-icon icon="mdi-monitor-dashboard" size="small" class="mr-2" />
        <span class="text-subtitle-2">DM Screen</span>
      </v-card-title>

      <v-divider />

      <!-- Active DM Screen Selection -->
      <v-card-text class="pa-3">
        <v-select
          :model-value="activeDmScreen?.id"
          :items="dmScreenOptions"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          placeholder="Select a DM screen..."
          prepend-inner-icon="mdi-monitor-dashboard"
          @update:model-value="handleDmScreenChange"
        >
          <template #append>
            <v-btn
              v-if="activeDmScreen"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click.stop="clearActiveDmScreen"
            />
          </template>
        </v-select>

        <template v-if="activeDmScreen">
          <v-divider class="my-3" />

          <!-- DM Screen Info -->
          <div class="mb-3">
            <div class="d-flex align-center gap-2 mb-2">
              <span class="text-caption text-medium-emphasis">Items:</span>
              <v-chip size="x-small" variant="tonal">
                {{ activeDmScreen.items?.length || 0 }}
              </v-chip>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- Actions -->
          <div class="d-flex gap-2">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-eye"
              block
              @click="openDmScreen"
            >
              Open
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-cog"
              @click="openDmScreenSettings"
            >
              <v-icon />
              <v-tooltip activator="parent" location="top">Settings</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDmScreensStore } from '@/stores/dmScreens'
import type { DmScreen } from '@/types/dmScreen.types'

const router = useRouter()
const dmScreensStore = useDmScreensStore()

const activeDmScreen = computed(() => dmScreensStore.activeDmScreen)

const dmScreenOptions = computed(() => {
  return dmScreensStore.dmScreens.map(ds => ({
    id: ds.id,
    name: ds.name,
    libraryId: ds.libraryId,
  }))
})

const handleDmScreenChange = async (dmScreenId: string) => {
  const dmScreen = dmScreensStore.dmScreens.find(ds => ds.id === dmScreenId)
  if (!dmScreen) return
  
  dmScreensStore.setActiveDmScreen(dmScreen)
}

const clearActiveDmScreen = () => {
  dmScreensStore.setActiveDmScreen(null)
}

const openDmScreen = () => {
  if (activeDmScreen.value) {
    router.push({
      name: 'DmScreen',
      params: {
        id: activeDmScreen.value.libraryId,
        dmScreenId: activeDmScreen.value.id,
      },
    })
  }
}

const openDmScreenSettings = () => {
  if (activeDmScreen.value) {
    router.push({
      name: 'LibraryDmScreens',
      params: {
        id: activeDmScreen.value.libraryId,
      },
    })
  }
}
</script>

<style scoped>
.dm-screen-control-button {
  text-transform: none;
  font-size: 0.875rem;
}

.dm-screen-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dm-screen-control-card {
  backdrop-filter: blur(20px);
}
</style>

