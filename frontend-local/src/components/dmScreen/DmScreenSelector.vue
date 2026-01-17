<template>
  <v-select
    :model-value="selectedDmScreenId"
    :items="dmScreenItems"
    item-title="title"
    item-value="id"
    label="Active DM Screen"
    prepend-inner-icon="mdi-monitor-dashboard"
    variant="outlined"
    density="compact"
    hide-details
    @update:model-value="handleChange"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps">
        <template #prepend>
          <v-icon 
            :icon="item.raw.id === selectedDmScreenId ? 'mdi-check-circle' : 'mdi-circle-outline'"
            :color="item.raw.id === selectedDmScreenId ? 'success' : undefined"
          />
        </template>
        <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
        <v-list-item-subtitle v-if="item.raw.subtitle">
          {{ item.raw.subtitle }}
        </v-list-item-subtitle>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <span>{{ item.raw.title }}</span>
    </template>
  </v-select>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DmScreen } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'

const props = defineProps<{
  libraryId: number
}>()

const emit = defineEmits<{
  change: [dmScreen: DmScreen | null]
}>()

const dmScreensStore = useDmScreensStore()

const selectedDmScreenId = computed(() => {
  return dmScreensStore.activeDmScreen?.id || null
})

const dmScreenItems = computed(() => {
  const items = [
    {
      id: null,
      title: 'None',
      subtitle: 'No active DM screen'
    }
  ]

  const screens = dmScreensStore.dmScreens.filter(ds => ds.libraryId === props.libraryId)
  
  screens.forEach(screen => {
    items.push({
      id: screen.id,
      title: screen.name,
      subtitle: `${screen.items?.length || 0} items`
    })
  })

  return items
})

function handleChange(value: string | null) {
  if (!value) {
    dmScreensStore.setActiveDmScreen(null)
    emit('change', null)
    return
  }

  const dmScreen = dmScreensStore.getDmScreenById(value)
  if (dmScreen) {
    dmScreensStore.setActiveDmScreen(dmScreen)
    emit('change', dmScreen)
  }
}
</script>

<style scoped>
/* Additional styles if needed */
</style>

