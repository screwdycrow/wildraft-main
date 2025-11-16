<template>
  <v-dialog
    v-model="dialogsStore.itemEditorOpen"
    width="90vw"
    max-width="1400px"
    height="90vh"
    scrollable
    @update:model-value="handleClose"
  >
    <v-card v-if="dialogsStore.itemEditorData" class="item-editor-dialog">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-pencil" />
          <span>{{ dialogsStore.itemEditorData.item ? `Edit ${dialogsStore.itemEditorData.item.name}` : 'Create New Item' }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="dialogsStore.closeItemEditor()"
        />
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0 item-editor-content">
        <component
          v-if="editorComponent"
          :is="editorComponent"
          :library-id="dialogsStore.itemEditorData.libraryId"
          :item="dialogsStore.itemEditorData.item"
          @saved="handleSaved"
          @cancel="dialogsStore.closeItemEditor()"
        />
        <div v-else class="pa-6">
          <v-alert type="warning">
            No editor available for this item type.
          </v-alert>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useItemComponents } from '@/composables/useItemComponents'

const dialogsStore = useDialogsStore()
const { getEditorComponent } = useItemComponents()

const editorComponent = computed(() => {
  if (!dialogsStore.itemEditorData) return null
  const itemType = dialogsStore.itemEditorData.itemType || dialogsStore.itemEditorData.item?.type
  if (!itemType) return null
  return getEditorComponent(itemType)
})

function handleClose(value: boolean) {
  if (!value) {
    dialogsStore.closeItemEditor()
  }
}

function handleSaved() {
  dialogsStore.closeItemEditor()
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.item-editor-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.item-editor-content {
  flex: 1;
  overflow: auto;
}
</style>

