<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h2 class="text-h5 font-weight-bold d-flex align-center">
        <v-icon icon="mdi-tag-multiple" color="primary" class="mr-2" />
        Tags
      </h2>
      <v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-arrow-right"
        :to="{ name: 'LibraryTags', params: { id: libraryId } }"
      >
        View All
      </v-btn>
    </div>

    <!-- Loading State -->
    <div v-if="tagsStore.isLoading" class="text-center py-8">
      <v-progress-circular indeterminate size="32" />
    </div>

    <!-- Empty State -->
    <v-alert
      v-else-if="tagsStore.tags.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      No tags yet. <router-link :to="{ name: 'LibraryTags', params: { id: libraryId } }">Create your first tag</router-link>
    </v-alert>

    <!-- Tags Grid -->
    <div v-else class="tags-grid">
      <!-- General Tags -->
      <template v-if="generalTags.length > 0">
        <tag-card
          v-for="tag in generalTags.slice(0, 8)"
          :key="tag.id"
          :tag="tag"
          :can-edit="canEdit"
          @click="viewTagItems(tag)"
        />
      </template>

      <!-- Folder Tags -->
      <template v-for="folder in tagsStore.sortedFolders.slice(0, 3)" :key="folder.id">
        <tag-card
          v-for="tag in getTagsInFolder(folder.id).slice(0, 4)"
          :key="tag.id"
          :tag="tag"
          :can-edit="canEdit"
          @click="viewTagItems(tag)"
        />
      </template>
    </div>

    <div v-if="hasMoreTags" class="text-center mt-4">
      <v-btn
        variant="outlined"
        prepend-icon="mdi-tag-multiple"
        :to="{ name: 'LibraryTags', params: { id: libraryId } }"
      >
        View All Tags ({{ tagsStore.tags.length }})
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTagsStore } from '@/stores/tags'
import TagCard from '@/components/tags/TagCard.vue'
import type { Tag } from '@/types/tag.types'

const props = defineProps<{
  libraryId: number
  canEdit?: boolean
}>()

const router = useRouter()
const tagsStore = useTagsStore()

const generalTags = computed(() => {
  return tagsStore.tags
    .filter(tag => !tag.folderId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
})

function getTagsInFolder(folderId: number): Tag[] {
  return tagsStore.tags
    .filter(tag => tag.folderId === folderId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

const hasMoreTags = computed(() => {
  const displayedCount = Math.min(generalTags.value.length, 8) + 
    tagsStore.sortedFolders.slice(0, 3).reduce((sum, folder) => 
      sum + Math.min(getTagsInFolder(folder.id).length, 4), 0
    )
  return tagsStore.tags.length > displayedCount
})

function viewTagItems(tag: Tag) {
  router.push({
    name: 'TagLibraryItems',
    params: {
      id: props.libraryId,
      tagId: tag.id,
    },
  })
}
</script>

<style scoped>
.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

@media (max-width: 600px) {
  .tags-grid {
    grid-template-columns: 1fr;
  }
}
</style>

