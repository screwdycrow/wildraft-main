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
    'CHARACTER': 'CHARACTER_DND_5E',
    'CHARACTER_DND_5E': 'CHARACTER_DND_5E',
    'STAT_BLOCK': 'STAT_BLOCK_DND_5E',
    'STAT_BLOCK_DND_5E': 'STAT_BLOCK_DND_5E',
    'ITEM': 'ITEM_DND_5E',
    'ITEM_DND_5E': 'ITEM_DND_5E',
    'MAGIC_ITEM': 'ITEM_DND_5E',
    'NOTE': 'NOTE'
  }
  
  const mappedType = typeMap[props.item.type.toUpperCase()] || 'NOTE'
  const currentOpenType = dialogsStore.itemEditorData?.itemType || dialogsStore.itemEditorData?.item?.type
  
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
    case 'CHARACTER':
    case 'CHARACTER_DND_5E': 
      return 'mdi-account-circle'
    case 'STAT_BLOCK':
    case 'STAT_BLOCK_DND_5E': 
      return 'mdi-sword-cross'
    case 'ITEM':
    case 'ITEM_DND_5E':
    case 'MAGIC_ITEM': 
      return 'mdi-treasure-chest'
    case 'NOTE': 
      return 'mdi-note-text'
    default: 
      return 'mdi-help-circle'
  }
}

function onPreview() {
  const libraryId = libraryStore.currentLibrary?.id
  if (!libraryId) return
  
  // Use the ItemType mapping
  const typeMap: Record<string, string> = {
    'CHARACTER': 'CHARACTER_DND_5E',
    'CHARACTER_DND_5E': 'CHARACTER_DND_5E',
    'STAT_BLOCK': 'STAT_BLOCK_DND_5E',
    'STAT_BLOCK_DND_5E': 'STAT_BLOCK_DND_5E',
    'ITEM': 'ITEM_DND_5E',
    'ITEM_DND_5E': 'ITEM_DND_5E',
    'MAGIC_ITEM': 'ITEM_DND_5E',
    'NOTE': 'NOTE'
  }
  
  const mappedType = typeMap[props.item.type.toUpperCase()] || 'NOTE'
  
  // Create a transformed version for the editor
  const transformedItem = transformLegacyData({
    ...props.item,
    type: mappedType
  })
  
  dialogsStore.openItemEditorCreate(mappedType, libraryId, [], transformedItem)
}

/**
 * Transforms legacy nested AI data into the flat structure expected by the backend
 */
function transformLegacyData(item: any) {
  const newItem = JSON.parse(JSON.stringify(item))
  const data = newItem.data || {}

  // 1. Flatten "stats" object if it exists (Stat Blocks / Characters)
  if (data.stats && typeof data.stats === 'object') {
    Object.assign(data, data.stats)
    delete data.stats
  }

  // 2. Ensure CR is a string
  if (data.cr !== undefined && typeof data.cr !== 'string') {
    data.cr = String(data.cr)
  }

  // 3. Ensure speed exists for Stat Blocks
  if (newItem.type === 'STAT_BLOCK_DND_5E' && !data.speed) {
    data.speed = '30 ft.' // Default fallback
  }

  // 4. Handle legacy "actionType" in actions (Stat Blocks)
  if (Array.isArray(data.actions)) {
    data.actions = data.actions.map((a: any) => ({
      name: a.name,
      description: a.description || '',
      roll: a.roll || '',
      range: a.range || (a.actionType === 'RANGED' ? '60 ft.' : '5 ft.'),
      ...a
    }))
  }

  // 5. Transform string arrays to object arrays (Equipment / Spells / Features)
  // Backend expects these as objects { name, description? }
  const arrayFields = ['equipment', 'spells', 'features']
  arrayFields.forEach(field => {
    if (Array.isArray(data[field])) {
      data[field] = data[field].map((val: any) => {
        if (typeof val === 'string') {
          const result: any = { name: val, description: '' }
          
          if (field === 'spells') {
            // Try to extract level from name like "Cantrip: Mage Hand" or "1st level: Bless"
            if (val.toLowerCase().includes('cantrip')) result.level = 0
            else if (val.toLowerCase().includes('1st')) result.level = 1
            else if (val.toLowerCase().includes('2nd')) result.level = 2
            else if (val.toLowerCase().includes('3rd')) result.level = 3
            else if (val.toLowerCase().includes('4th')) result.level = 4
            else if (val.toLowerCase().includes('5th')) result.level = 5
            else if (val.toLowerCase().includes('6th')) result.level = 6
            else if (val.toLowerCase().includes('7th')) result.level = 7
            else if (val.toLowerCase().includes('8th')) result.level = 8
            else if (val.toLowerCase().includes('9th')) result.level = 9
            else result.level = 0 // Default to cantrip if unknown
            
            // Clean up name if level prefix was found
            result.name = val.split(':').pop()?.trim() || val
          }
          
          return result
        }
        
        // Ensure spells always have a level property
        if (field === 'spells' && typeof val === 'object' && val.level === undefined) {
          val.level = 0
        }
        
        return val
      })
    }
  })

  return newItem
}

async function onImport() {
  const libraryId = libraryStore.currentLibrary?.id
  if (!libraryId) return

  isImporting.value = true
  try {
    const typeMap: Record<string, string> = {
      'CHARACTER': 'CHARACTER_DND_5E',
      'CHARACTER_DND_5E': 'CHARACTER_DND_5E',
      'STAT_BLOCK': 'STAT_BLOCK_DND_5E',
      'STAT_BLOCK_DND_5E': 'STAT_BLOCK_DND_5E',
      'ITEM': 'ITEM_DND_5E',
      'ITEM_DND_5E': 'ITEM_DND_5E',
      'MAGIC_ITEM': 'ITEM_DND_5E',
      'NOTE': 'NOTE'
    }
    
    const mappedType = typeMap[props.item.type.toUpperCase()] || 'NOTE'
    
    // Transform data to ensure it passes backend validation
    const transformed = transformLegacyData({
      ...props.item,
      type: mappedType
    })
    
    const payload = {
      name: transformed.name,
      description: transformed.description,
      data: transformed.data,
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
