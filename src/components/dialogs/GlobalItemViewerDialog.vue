<template>
  <v-dialog
    v-model="dialogsStore.itemViewerOpen"
    width="80vw"
    height="80vh"
    scrollable
    @update:model-value="handleClose"
  >
    <v-card v-if="dialogsStore.itemViewerData" class="item-viewer-dialog">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-eye" />
          <span>{{ dialogsStore.itemViewerData.item.name }}</span>
        </div>
        <div class="d-flex gap-2">
          <v-btn
            icon="mdi-pencil"
            variant="text"
            @click="handleEdit(dialogsStore.itemViewerData.item)"
          >
            <v-icon />
            <v-tooltip activator="parent" location="bottom">
              Edit Item
            </v-tooltip>
          </v-btn>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="dialogsStore.closeItemViewer()"
          />
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0 item-viewer-content">
        <component
          v-if="detailComponent"
          :is="detailComponent"
          :item="dialogsStore.itemViewerData.item"
          :can-edit="true"
          :initial-chapter-id="dialogsStore.itemViewerData.chapterId"
          @edit="handleEdit(dialogsStore.itemViewerData.item)"
          @delete="handleDelete"
        />
        <div v-else class="pa-6">
          <item-card-wrapper
            :item="dialogsStore.itemViewerData.item"
            :disable-click="true"
            @edit="handleEdit"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import type { LibraryItem } from '@/types/item.types'
import { useItemComponents } from '@/composables/useItemComponents'

const dialogsStore = useDialogsStore()
const { getDetailComponent } = useItemComponents()

const detailComponent = computed(() => {
  if (!dialogsStore.itemViewerData?.item) return null
  console.log('[GlobalItemViewerDialog] Opening with chapterId:', dialogsStore.itemViewerData.chapterId)
  return getDetailComponent(dialogsStore.itemViewerData.item.type)
})

function handleClose(value: boolean) {
  if (!value) {
    dialogsStore.closeItemViewer()
  }
}

function handleEdit(item: LibraryItem) {
  // Close viewer and open editor
  const libraryId = dialogsStore.itemViewerData?.libraryId
  dialogsStore.closeItemViewer()
  if (libraryId) {
    dialogsStore.openItemEditor(item, libraryId)
  }
}

function handleDelete() {
  // Close the dialog
  dialogsStore.closeItemViewer()
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.item-viewer-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-viewer-content {
  flex: 1;
  overflow: auto;
}
</style>

