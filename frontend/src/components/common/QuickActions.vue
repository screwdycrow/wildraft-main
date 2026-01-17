<template>
  <v-menu location="bottom" offset="8">
    <template #activator="{ props }">
      <v-btn
        icon
        v-bind="props"
        color="primary"
        class="quick-action-btn"
        size="default"
      >
        <v-icon icon="mdi-plus" size="24" />
        <v-tooltip activator="parent" location="bottom">
          Quick Actions
        </v-tooltip>
      </v-btn>
    </template>
    <v-list class="glass-menu quick-actions-menu" density="compact">
      <v-list-subheader class="text-uppercase text-caption font-weight-bold">
        Create New
      </v-list-subheader>
      <v-list-item
        prepend-icon="mdi-sword-cross"
        title="Stat Block"
        class="quick-action-item"
        @click="handleCreate('STAT_BLOCK_DND_5E')"
      />
      <v-list-item
        prepend-icon="mdi-account"
        title="Character"
        class="quick-action-item"
        @click="handleCreate('CHARACTER_DND_5E')"
      />
      <v-list-item
        prepend-icon="mdi-treasure-chest"
        title="Magic Item"
        class="quick-action-item"
        @click="handleCreate('ITEM_DND_5E')"
      />
      <v-list-item
        prepend-icon="mdi-note-plus"
        title="Note"
        class="quick-action-item"
        @click="handleCreate('NOTE')"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useDialogsStore } from '@/stores/dialogs'
import type { ItemType } from '@/types/item.types'

interface Props {
  initialTagIds?: number[]
}

const props = defineProps<Props>()

const route = useRoute()
const dialogsStore = useDialogsStore()

function handleCreate(itemType: ItemType) {
  const libraryId = parseInt(route.params.id as string || route.params.libraryId as string)
  
  if (!isNaN(libraryId)) {
    dialogsStore.openItemEditorCreate(itemType, libraryId, props.initialTagIds)
  } else {
    console.error('Cannot create item: library ID not found in route')
  }
}
</script>

<style scoped>
.quick-action-btn {
  background: rgba(var(--v-theme-primary), 0.2) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-theme-primary), 0.3) !important;
  transition: all 0.3s ease;
}

.quick-action-btn:hover {
  background: rgba(var(--v-theme-primary), 0.3) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
}

.glass-menu {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 180px;
}

.quick-actions-menu :deep(.v-list-subheader) {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  padding: 8px 16px 4px;
  opacity: 0.8;
}

.quick-action-item {
  transition: all 0.2s ease;
  border-radius: 4px;
  margin: 2px 4px;
}

.quick-action-item:hover {
  background: rgba(var(--v-theme-primary), 0.15) !important;
  transform: translateX(4px);
}

.quick-action-item :deep(.v-list-item__prepend) {
  opacity: 0.8;
}

.quick-action-item:hover :deep(.v-list-item__prepend) {
  opacity: 1;
}
</style>




