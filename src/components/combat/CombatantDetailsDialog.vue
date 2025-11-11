<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1400"
    scrollable
  >
    <v-card class="glass-card" elevation="0">
      <!-- Header -->
      <v-card-title class="dialog-header">
        <div class="d-flex align-items-center justify-space-between w-100">
          <div class="d-flex align-items-center">
            <v-icon icon="mdi-cards" size="large" class="mr-3" />
            <div>
              <h2 class="text-h5">{{ combatant.name }}</h2>
              <p v-if="subtitle" class="text-caption text-grey mb-0">{{ subtitle }}</p>
            </div>
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </v-card-title>

      <v-divider />

      <!-- Content -->
      <v-card-text class="dialog-content">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          <v-progress-circular indeterminate size="64" color="primary" />
          <p class="text-h6 text-grey mt-4">Loading abilities...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4" />
          <p class="text-h6 text-error">{{ error }}</p>
        </div>

        <!-- Dynamic Detail Component -->
        <component
          v-else-if="detailComponent"
          :is="detailComponent"
          :combatant="combatant"
          :library-item="libraryItem"
          :item="libraryItem"
        />
        
        <!-- Fallback: No component found -->
        <div v-else class="empty-state">
          <v-icon icon="mdi-file-document-outline" size="64" color="grey" class="mb-4 opacity-50" />
          <p class="text-h6 text-grey">No detail view available</p>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { useItemsStore } from '@/stores/items'
import { useItemComponents } from '@/composables/useItemComponents'
import type { Combatant } from '@/types/combat.types'
import type { LibraryItem } from '@/types/item.types'

interface Props {
  modelValue: boolean
  combatant: Combatant
}

const props = defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const { getCombatantDetailComponent } = useItemComponents()

const libraryItem = ref<LibraryItem | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Get the appropriate detail component
const detailComponent = computed(() => {
  if (!libraryItem.value) return null
  return getCombatantDetailComponent(libraryItem.value.type)
})

// Fetch library item when dialog opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.combatant.libraryItemId && libraryStore.currentLibrary) {
    isLoading.value = true
    error.value = null
    
    try {
      libraryItem.value = await itemsStore.fetchItem(
        libraryStore.currentLibrary.id,
        props.combatant.libraryItemId
      )
    } catch (err: any) {
      console.error('Failed to fetch library item:', err)
      error.value = err.message || 'Failed to load item details'
      libraryItem.value = null
    } finally {
      isLoading.value = false
    }
  }
}, { immediate: true })

const subtitle = computed(() => {
  if (!libraryItem.value) return ''
  const data = libraryItem.value.data as any
  
  if (libraryItem.value.type === 'STAT_BLOCK_DND_5E') {
    return `${data.size || ''} ${data.type || ''} • CR ${data.cr || '?'}`.trim()
  }
  
  if (libraryItem.value.type === 'CHARACTER_DND_5E') {
    return `Level ${data.level || '?'} ${data.class || ''} • ${data.race || ''}`.trim()
  }
  
  return libraryItem.value.type
})
</script>

<style scoped>
.dialog-header {
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
}

.dialog-tabs {
  background: rgba(255, 255, 255, 0.02);
}

.dialog-content {
  min-height: 400px;
  max-height: 70vh;
  overflow-y: auto;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  text-align: center;
  min-height: 400px;
}
</style>

