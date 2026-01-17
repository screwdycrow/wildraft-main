<template>
  <v-autocomplete
    v-model="selectedTagIds"
    :items="tagItems"
    :loading="tagsStore.isLoading"
    :label="label"
    prepend-inner-icon="mdi-tag-multiple"
    variant="outlined"
    :density="density"
    :hide-details="hideDetails"
    multiple
    chips
    closable-chips
    clearable
    :hint="hint"
    :persistent-hint="!!hint"
    @update:model-value="handleChange"
  >
    <template #chip="{ item, props: chipProps }">
      <v-chip
        v-bind="chipProps"
        :color="getTagColor(item.value)"
        size="small"
      >
        {{ item.title }}
      </v-chip>
    </template>

    <template #item="{ item, props: itemProps }">
      <v-list-item
        v-bind="itemProps"
        :prepend-icon="'mdi-tag'"
      >
        <template #prepend>
          <v-icon :color="getTagColor(item.value)" icon="mdi-tag" />
        </template>
        <v-list-item-title>
          {{ item.title }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="(item.raw as any)?.folder">
          {{ (item.raw as any).folder }}
        </v-list-item-subtitle>
      </v-list-item>
    </template>

    <template #no-data>
      <v-list-item>
        <v-list-item-title class="text-grey">
          No tags available
        </v-list-item-title>
      </v-list-item>
    </template>

    <template v-if="showAddButton" #append-item>
      <v-divider class="mb-2" />
      <v-list-item @click="$emit('add-tag')">
        <template #prepend>
          <v-icon icon="mdi-plus-circle" color="primary" />
        </template>
        <v-list-item-title class="text-primary">
          Create New Tag
        </v-list-item-title>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tags'

const props = withDefaults(defineProps<{
  modelValue: number[]
  libraryId: number
  label?: string
  hint?: string
  showAddButton?: boolean
  density?: 'default' | 'comfortable' | 'compact'
  hideDetails?: boolean
}>(), {
  label: 'Tags',
  density: 'default',
  hideDetails: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
  'add-tag': []
}>()

const tagsStore = useTagsStore()
const selectedTagIds = ref<number[]>([...props.modelValue])

const tagItems = computed(() => {
  return tagsStore.sortedTags.map(tag => ({
    title: tag.name,
    value: tag.id,
    raw: tag,
  }))
})

function getTagColor(tagId: number) {
  const tag = tagsStore.getTagById(tagId)
  return tag?.color || '#95A5A6'
}

function handleChange(newValue: number[]) {
  emit('update:modelValue', newValue)
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  selectedTagIds.value = [...newValue]
}, { deep: true })

// Watch for changes to libraryId to reload tags
watch(() => props.libraryId, async (newLibraryId) => {
  if (newLibraryId) {
    try {
      await tagsStore.fetchTags(newLibraryId)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }
}, { immediate: true })

onMounted(async () => {
  if (props.libraryId && tagsStore.tags.length === 0) {
    try {
      await tagsStore.fetchTags(props.libraryId)
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }
})
</script>

<style scoped>
/* Custom styling if needed */
</style>

