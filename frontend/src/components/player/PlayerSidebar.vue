<template>
  <div class="player-sidebar">
    <div v-if="playerContent.isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <template v-else>
      <!-- Portals -->
      <v-list density="compact" class="bg-transparent">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon icon="mdi-monitor-eye" size="16" class="mr-1" />
          Portals
        </v-list-subheader>
        <v-list-item
          v-for="portal in playerContent.portalViews"
          :key="portal.id"
          :active="portal.id === playerContent.activePortalViewId && isOnPortal"
          rounded="lg"
          class="mx-2"
          @click="openPortal(portal.id)"
        >
          <template #prepend>
            <v-icon
              :icon="portal.id === playerContent.activePortalViewId ? 'mdi-star' : 'mdi-monitor'"
              :color="portal.id === playerContent.activePortalViewId ? 'amber' : undefined"
              size="20"
            />
          </template>
          <v-list-item-title>{{ portal.name }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="playerContent.portalViews.length === 0" class="mx-2">
          <v-list-item-subtitle class="text-caption">
            No portals shared with you yet
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-divider class="my-1" />

      <!-- DM Screens -->
      <v-list density="compact" class="bg-transparent">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon icon="mdi-monitor-dashboard" size="16" class="mr-1" />
          DM Screens
        </v-list-subheader>
        <v-list-item
          v-for="screen in playerContent.dmScreens"
          :key="screen.id"
          rounded="lg"
          class="mx-2"
          @click="openDmScreen(screen.id)"
        >
          <template #prepend>
            <v-icon :icon="screen.canEdit ? 'mdi-pencil' : 'mdi-eye'" size="20" />
          </template>
          <v-list-item-title>{{ screen.name }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="playerContent.dmScreens.length === 0" class="mx-2">
          <v-list-item-subtitle class="text-caption">
            No DM screens shared with you yet
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <v-divider class="my-1" />

      <!-- Shared items -->
      <v-list density="compact" class="bg-transparent">
        <v-list-subheader class="text-uppercase font-weight-bold">
          <v-icon icon="mdi-treasure-chest" size="16" class="mr-1" />
          Your Content
        </v-list-subheader>
        <v-list-item
          v-for="item in playerContent.items"
          :key="item.id"
          rounded="lg"
          class="mx-2"
          @click="openItem(item)"
        >
          <template #prepend>
            <v-avatar v-if="item.featuredImage?.downloadUrl" size="26" rounded="sm" class="mr-1">
              <v-img :src="item.featuredImage.downloadUrl" cover />
            </v-avatar>
            <v-avatar v-else size="26" rounded="sm" class="mr-1" :style="{ background: item.color }">
              <v-icon :icon="itemIcon(item.type)" size="14" />
            </v-avatar>
          </template>
          <v-list-item-title>{{ item.name }}</v-list-item-title>
          <template #append>
            <v-icon v-if="item.permission === 'EDIT'" icon="mdi-pencil" size="14" class="opacity-50" />
          </template>
        </v-list-item>
        <v-list-item v-if="playerContent.items.length === 0" class="mx-2">
          <v-list-item-subtitle class="text-caption">
            Nothing shared with you yet
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </template>

    <!-- Item viewer dialog -->
    <player-item-dialog v-model="showItemDialog" :library-id="libraryId" :item-id="selectedItemId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerContentStore } from '@/stores/playerContent'
import type { SharedItem } from '@/api/player'
import PlayerItemDialog from '@/components/player/PlayerItemDialog.vue'

const props = defineProps<{ libraryId: number }>()

const route = useRoute()
const router = useRouter()
const playerContent = usePlayerContentStore()

const showItemDialog = ref(false)
const selectedItemId = ref<number | null>(null)

const isOnPortal = computed(() => route.name === 'PlayerPortal')

function openPortal(portalViewId: string) {
  playerContent.setActivePortal(portalViewId)
  router.push({ name: 'PlayerPortal', params: { id: props.libraryId, portalViewId } })
}

function openDmScreen(dmScreenId: string) {
  router.push({ name: 'PlayerDmScreen', params: { id: props.libraryId, dmScreenId } })
}

function openItem(item: SharedItem) {
  selectedItemId.value = item.id
  showItemDialog.value = true
}

function itemIcon(type: string) {
  switch (type) {
    case 'STAT_BLOCK_DND_5E':
      return 'mdi-skull'
    case 'CHARACTER_DND_5E':
      return 'mdi-account'
    case 'ITEM_DND_5E':
      return 'mdi-sword'
    case 'NOTE':
      return 'mdi-note-text'
    default:
      return 'mdi-file'
  }
}
</script>

<style scoped>
.player-sidebar {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 24px;
}
</style>
