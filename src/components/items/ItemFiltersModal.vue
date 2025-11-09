<template>
  <v-dialog v-model="isOpen" max-width="800" scrollable>
    <v-card class="glass-card">
      <v-card-title class="d-flex align-items-center pa-6">
        <v-icon icon="mdi-filter-variant" class="mr-3" />
        <span class="text-h5 font-weight-bold">Advanced Filters</span>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-row>
          <!-- Dynamic Filters from Definitions -->
          <v-col
            v-for="filter in filterDefinitions"
            :key="filter.key"
            cols="12"
            :md="filter.type === 'range' ? 12 : 6"
          >
            <!-- Select Filter -->
            <v-select
              v-if="filter.type === 'select'"
              v-model="localFilters[filter.key]"
              :items="getFilterOptions(filter)"
              :label="filter.label"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />

            <!-- Boolean Filter -->
            <v-checkbox
              v-else-if="filter.type === 'boolean'"
              v-model="localFilters[filter.key]"
              :label="filter.label"
              density="comfortable"
              hide-details
            />

            <!-- Range Filter -->
            <div v-else-if="filter.type === 'range'">
              <label class="text-caption text-grey-lighten-1 mb-2 d-block">
                {{ filter.label }}
              </label>
              <v-range-slider
                v-model="localFilters[filter.key]"
                :min="filter.min || 0"
                :max="filter.max || 100"
                :step="1"
                thumb-label
                hide-details
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-6">
        <v-btn
          variant="text"
          @click="clearAll"
        >
          Clear All
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="apply"
        >
          Apply Filters
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemComponents, type FilterDefinition } from '@/composables/useItemComponents'
import type { LibraryItem, ItemType } from '@/types/item.types'

interface Props {
  modelValue: boolean
  itemType: ItemType
  items: LibraryItem[]
  filters: Record<string, any>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:filters': [filters: Record<string, any>]
}>()

const { getFilterDefinitions } = useItemComponents()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localFilters = ref<Record<string, any>>({})

// Get filter definitions for this item type
const filterDefinitions = computed(() => getFilterDefinitions(props.itemType))

// Get unique options from items for dynamic filters
function getFilterOptions(filter: FilterDefinition) {
  // If static options are provided, use them
  if (filter.options) {
    return filter.options
  }

  // Otherwise, extract unique values from items
  const uniqueValues = new Set<any>()
  props.items.forEach(item => {
    const value = (item.data as any)?.[filter.dataPath]
    if (value !== undefined && value !== null && value !== '') {
      uniqueValues.add(value)
    }
  })

  return Array.from(uniqueValues)
    .sort()
    .map(value => ({
      title: String(value),
      value: value
    }))
}

// Initialize local filters when dialog opens
watch(isOpen, (open) => {
  if (open) {
    localFilters.value = { ...props.filters }
  }
})

function close() {
  isOpen.value = false
}

function clearAll() {
  localFilters.value = {}
}

function apply() {
  emit('update:filters', { ...localFilters.value })
  close()
}
</script>

<style scoped>
.glass-card {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(20px);
}
</style>


