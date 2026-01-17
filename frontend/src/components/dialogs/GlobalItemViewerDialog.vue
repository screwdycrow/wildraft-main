<template>
  <v-dialog
    v-model="dialogsStore.itemViewerOpen"
    width="80vw"
    height="80vh"
    scrollable
    @update:model-value="handleClose"
  >
  <v-btn
      class="close-button"
            icon="mdi-close"
            variant="text"
            @click="dialogsStore.closeItemViewer()"
          />
    <v-card v-if="dialogsStore.itemViewerData" class="item-viewer-dialog">

      <v-card-text class="pa-0 item-viewer-content">
        <component
          v-if="detailComponent"
          :is="detailComponent"
          :item="dialogsStore.itemViewerData.item"
          :can-edit="true"
          :initial-chapter-id="dialogsStore.itemViewerData.chapterId"
          @edit="handleEdit"
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

function handleEdit(item?: LibraryItem) {
  // Close viewer and open editor
  const libraryId = dialogsStore.itemViewerData?.libraryId
  const itemToEdit = item || dialogsStore.itemViewerData?.item
  dialogsStore.closeItemViewer()
  if (libraryId && itemToEdit) {
    dialogsStore.openItemEditor(itemToEdit, libraryId)
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
  background-color: rgba(var(--v-theme-card-background), 0.9)!important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-viewer-content {
  flex: 1;
  overflow: auto;
}
.close-button {
  position: fixed;
  top: -20px;
  right: -10px;
  z-index: 1000;
  background: rgba(var(--v-theme-surface), 0.9) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>

