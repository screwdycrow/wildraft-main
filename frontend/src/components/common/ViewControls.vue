<template>
  <div class="view-controls d-flex align-center gap-2">
    <!-- View Mode Toggle -->
    <v-btn-toggle
      :model-value="viewMode"
      @update:model-value="$emit('update:viewMode', $event)"
      mandatory
      density="compact"
      variant="outlined"
      divided
      color="primary"
    >
      <v-btn value="grid" size="small">
        <v-icon icon="mdi-view-grid" size="18" />
        <v-tooltip activator="parent" location="bottom">Grid View</v-tooltip>
      </v-btn>
      <v-btn value="table" size="small">
        <v-icon icon="mdi-table" size="18" />
        <v-tooltip activator="parent" location="bottom">Table View</v-tooltip>
      </v-btn>
    </v-btn-toggle>

    <!-- Group By Menu -->
    <v-menu :close-on-content-click="true">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          variant="outlined"
          size="small"
          :color="groupBy !== 'none' ? 'primary' : undefined"
        >
          <v-icon 
            :icon="groupByIcon" 
            size="18" 
            class="mr-1"
          />
          {{ groupByLabel }}
          <v-icon icon="mdi-chevron-down" size="16" class="ml-1" />
        </v-btn>
      </template>
      <v-list density="compact" class="glass-menu">
        <v-list-item
          v-for="option in groupByOptions"
          :key="option.value"
          :active="groupBy === option.value"
          @click="$emit('update:groupBy', option.value)"
        >
          <template #prepend>
            <v-icon :icon="option.icon" size="18" class="mr-2" />
          </template>
          <v-list-item-title>{{ option.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ViewMode, GroupBy } from '@/composables/useViewPreferences'

interface Props {
  viewMode: ViewMode
  groupBy: GroupBy
}

const props = defineProps<Props>()

defineEmits<{
  'update:viewMode': [value: ViewMode]
  'update:groupBy': [value: GroupBy]
}>()

const groupByOptions = [
  { value: 'none' as const, label: 'No Grouping', icon: 'mdi-view-list' },
  { value: 'tag' as const, label: 'Group by Tag', icon: 'mdi-tag-multiple' },
  { value: 'tagFolder' as const, label: 'Group by Tag Folder', icon: 'mdi-folder-multiple' },
]

const groupByIcon = computed(() => {
  const option = groupByOptions.find(o => o.value === props.groupBy)
  return option?.icon || 'mdi-view-list'
})

const groupByLabel = computed(() => {
  const option = groupByOptions.find(o => o.value === props.groupBy)
  return option?.label || 'Group'
})
</script>

<style scoped>
.view-controls {
  flex-shrink: 0;
}

.glass-menu {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(10px);
}
</style>

