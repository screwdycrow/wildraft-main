<template>
  <v-menu location="bottom">
    <template #activator="{ props }">
      <v-btn
        fab
        icon
        v-bind="props"
        color="primary"
      >
        <v-icon icon="mdi-plus" />
      </v-btn>
    </template>
    <v-list class="glass-menu">
      <v-list-item
        prepend-icon="mdi-sword-cross"
        title="Stat Block"
        @click="handleCreate('STAT_BLOCK_DND_5E')"
      />
      <v-list-item
        prepend-icon="mdi-account"
        title="Character"
        @click="handleCreate('CHARACTER_DND_5E')"
      />
      <v-list-item
        prepend-icon="mdi-treasure-chest"
        title="Magic Item"
        @click="handleCreate('ITEM_DND_5E')"
      />
      <v-list-item
        prepend-icon="mdi-note-plus"
        title="Note"
        @click="handleCreate('NOTE')"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useItemDialogs } from '@/composables/useItemDialogs'
import type { ItemType } from '@/types/item.types'

const route = useRoute()
const { openCreateDialog } = useItemDialogs()

function handleCreate(itemType: ItemType) {
  const libraryId = parseInt(route.params.id as string || route.params.libraryId as string)
  
  if (!isNaN(libraryId)) {
    openCreateDialog(itemType, libraryId)
  } else {
    console.error('Cannot create item: library ID not found in route')
  }
}
</script>

<style scoped>
.glass-menu {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>



