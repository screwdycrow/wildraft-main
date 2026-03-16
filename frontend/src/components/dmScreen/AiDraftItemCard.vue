<template>
  <v-card class="ai-draft-item-card mb-3" variant="outlined">
    <v-card-item>
      <template #prepend>
        <v-avatar color="primary" variant="tonal" size="32">
          <v-icon :icon="getItemIcon()" size="18" />
        </v-avatar>
      </template>
      <v-card-title class="text-subtitle-2 font-weight-bold">
        {{ item.name }}
      </v-card-title>
      <v-card-subtitle class="text-tiny">
        AI Suggestion: {{ item.type }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text v-if="item.description" class="text-caption pt-0 pb-2 preserve-ws">
      {{ item.description }}
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-2">
      <v-spacer />
      <v-btn
        size="x-small"
        variant="text"
        prepend-icon="mdi-eye-outline"
        @click="onPreview"
      >
        Preview / Edit
      </v-btn>
      <v-btn
        v-if="isMergeable"
        size="x-small"
        variant="tonal"
        color="secondary"
        prepend-icon="mdi-merge"
        @click="onMerge"
      >
        Add to Current
      </v-btn>
      <v-btn
        size="x-small"
        variant="tonal"
        color="primary"
        prepend-icon="mdi-plus"
        :loading="isImporting"
        @click="onImport"
      >
        Import
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useItemsStore } from '@/stores/items'
import { useLibraryStore } from '@/stores/library'
import { useToast } from 'vue-toastification'

const props = defineProps<{
  item: {
    type: string
    name: string
    description?: string
    data: any
  }
}>()

const dialogsStore = useDialogsStore()
const itemsStore = useItemsStore()
const libraryStore = useLibraryStore()
const toast = useToast()

const isImporting = ref(false)

const isMergeable = computed(() => {
  if (!dialogsStore.itemEditorOpen || !dialogsStore.itemEditorData) return false
  
  const typeMap: Record<string, string> = {
    'CHARACTER': 'CHARACTER',
    'STAT_BLOCK': 'STAT_BLOCK',
    'ITEM': 'MAGIC_ITEM',
    'NOTE': 'NOTE'
  }
  
  const mappedType = typeMap[props.item.type.toUpperCase()] || 'NOTE'
  const currentOpenType = dialogsStore.itemEditorData.itemType || dialogsStore.itemEditorData.item?.type
  
  console.log('[AiDraftItemCard] isMergeable check:', {
    mappedType,
    currentOpenType,
    itemEditorOpen: dialogsStore.itemEditorOpen,
    propsType: props.item.type
  })
  
  return mappedType === 'NOTE' && currentOpenType === 'NOTE'
})

function onMerge() {
  dialogsStore.itemEditorMergeData = props.item.data
  toast.info('Adding chapters to current note...')
}

function getItemIcon() {
  switch (props.item.type.toUpperCase()) {
    case 'CHARACTER': return 'mdi-account-circle'
    case 'STAT_BLOCK': return 'mdi-sword-cross'
    case 'ITEM': return 'mdi-treasure-chest'
    case 'NOTE': return 'mdi-note-text'
    default: return 'mdi-help-circle'
  }
}

function onPreview() {
  const libraryId = libraryStore.currentLibrary?.id
  if (!libraryId) return
  
  // Use the ItemType mapping
  const typeMap: Record<string, string> = {
    'CHARACTER': 'CHARACTER',
    'STAT_BLOCK': 'STAT_BLOCK',
    'ITEM': 'MAGIC_ITEM',
    'NOTE': 'NOTE'
  }
  
  const mappedType = typeMap[props.item.type.toUpperCase()] || 'NOTE'
  
  dialogsStore.openItemEditorCreate(mappedType, libraryId, [], props.item)
}

async function onImport() {
  const libraryId = libraryStore.currentLibrary?.id
  if (!libraryId) return

  isImporting.value = true
  try {
    const typeMap: Record<string, string> = {
      'CHARACTER': 'CHARACTER',
      'STAT_BLOCK': 'STAT_BLOCK',
      'ITEM': 'MAGIC_ITEM',
      'NOTE': 'NOTE'
    }
    
    const mappedType = typeMap[props.item.type.toUpperCase()] || 'NOTE'
    
    const payload = {
      name: props.item.name,
      description: props.item.description,
      data: props.item.data,
      type: mappedType as any
    }

    await itemsStore.createItem(libraryId, payload)
    toast.success(`${props.item.name} imported to library`)
  } catch (error) {
    console.error('Import failed:', error)
    toast.error('Failed to import item')
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.ai-draft-item-card {
  background: rgba(var(--v-theme-surface), 0.5);
  border-color: rgba(var(--v-theme-primary), 0.2) !important;
  max-width: 100%;
}

.text-tiny {
  font-size: 0.7rem;
}

.preserve-ws {
  white-space: pre-wrap;
}
</style>
