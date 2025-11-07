<template>
  <div>
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h4 font-weight-bold">
        {{ item.name }}
      </v-card-title>
      <v-card-subtitle v-if="item.description">
        {{ item.description }}
      </v-card-subtitle>
      <v-card-text>
        <v-chip size="small" variant="tonal">{{ item.type }}</v-chip>
        <pre class="mt-4">{{ JSON.stringify(item.data, null, 2) }}</pre>
      </v-card-text>
    </v-card>

    <file-attachment-manager
      :attached-files="item.userFiles"
      :library-id="item.libraryId"
      :item-id="item.id"
      :can-edit="canEdit"
    />
  </div>
</template>

<script setup lang="ts">
import type { LibraryItem } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

withDefaults(defineProps<Props>(), {
  canEdit: true,
})
</script>

