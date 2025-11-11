<template>
  <div>
    <!-- Header -->
    <page-top-bar
      title="Tags"
      icon="mdi-tag-multiple"
      description="Organize your library content with tags"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          Create Tag
        </v-btn>
      </template>
    </page-top-bar>

   

    <!-- Loading State -->
    <v-row v-if="tagsStore.isLoading && tagsStore.tags.length === 0">
      <v-col cols="12" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 text-grey-lighten-1 mt-4">Loading tags...</p>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-else-if="!tagsStore.isLoading && tagsStore.tags.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-tag-off" size="120" color="primary" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h4 font-weight-bold mb-4" style="color: rgb(var(--v-theme-on-surface));">
            No Tags Yet
          </h2>
          <p class="text-body-1 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto;">
            Create tags to organize your library content. Tags help you quickly find and categorize items.
          </p>
          <v-btn
            v-if="canEdit"
            color="primary"
            size="x-large"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            Create Your First Tag
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tags by Folder -->
    <template v-else>
      <div
        v-for="(folderTags, folderName) in tagsStore.tagsByFolder"
        :key="folderName"
        class="mb-6"
      >
        <h2 class="text-h5 font-weight-bold mb-4 d-flex align-center" style="color: rgb(var(--v-theme-on-surface));">
          <v-icon icon="mdi-folder" color="primary" class="mr-2" />
          {{ folderName }}
          <v-chip size="small" class="ml-2">{{ folderTags.length }}</v-chip>
        </h2>
        <v-row>
          <v-col
            v-for="tag in folderTags"
            :key="tag.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card class="glass-card tag-card" elevation="0" hover>
              <v-card-text class="pa-4">
                <div class="d-flex align-items-start justify-space-between mb-3">
                  <v-chip :color="tag.color" size="large" class="font-weight-bold">
                    <v-icon icon="mdi-tag" size="small" class="mr-1" />
                    {{ tag.name }}
                  </v-chip>
                  <v-menu v-if="canEdit" location="bottom">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        variant="text"
                        size="small"
                        @click.stop
                      />
                    </template>
                    <v-list class="glass-menu">
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit"
                        @click="handleEdit(tag)"
                      />
                      <v-divider class="my-2" />
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete"
                        class="text-error"
                        @click="handleDelete(tag)"
                      />
                    </v-list>
                  </v-menu>
                </div>

                <div class="d-flex align-items-center text-grey-lighten-1">
                  <v-icon icon="mdi-file-document" size="small" class="mr-1" />
                  <span class="text-body-2">
                    {{ tag.itemCount || 0 }} {{ tag.itemCount === 1 ? 'item' : 'items' }}
                  </span>
                </div>

                <div v-if="tag.folder" class="mt-2">
                  <v-chip size="x-small" variant="tonal">
                    <v-icon icon="mdi-folder" size="x-small" class="mr-1" />
                    {{ tag.folder }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </template>

    <!-- Create/Edit Tag Dialog -->
    <tag-form-dialog
      v-model="showTagDialog"
      :tag="editingTag"
      :existing-folders="tagsStore.uniqueFolders"
      @submit="handleCreateOrUpdate"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Tag?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete the tag <strong>{{ deletingTag?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            This will remove the tag from all associated items. This action cannot be undone.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Delete Tag
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TagFormDialog from '@/components/tags/TagFormDialog.vue'
import type { Tag } from '@/types/tag.types'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'

const route = useRoute()
const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const toast = useToast()

const showTagDialog = ref(false)
const showDeleteDialog = ref(false)
const editingTag = ref<Tag | null>(null)
const deletingTag = ref<Tag | null>(null)
const isDeleting = ref(false)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'Tags' }
  ]
})

const canEdit = computed(() => 
  ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
)

onMounted(async () => {
  if (libraryId.value) {
    try {
      await tagsStore.fetchTags(libraryId.value)
    } catch (error) {
      toast.error('Failed to load tags')
    }
  }
})

function openCreateDialog() {
  editingTag.value = null
  showTagDialog.value = true
}

function handleEdit(tag: Tag) {
  editingTag.value = tag
  showTagDialog.value = true
}

function handleDelete(tag: Tag) {
  deletingTag.value = tag
  showDeleteDialog.value = true
}

async function handleCreateOrUpdate(data: { name: string; color: string; folder?: string | null }, callback?: (success: boolean) => void) {
  if (!libraryId.value) return

  try {
    if (editingTag.value) {
      await tagsStore.updateTag(libraryId.value, editingTag.value.id, data)
      toast.success('Tag updated successfully!')
    } else {
      await tagsStore.createTag(libraryId.value, data)
      toast.success('Tag created successfully!')
    }
    showTagDialog.value = false
    editingTag.value = null
    callback?.(true)
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('A tag with this name already exists')
    } else {
      toast.error(editingTag.value ? 'Failed to update tag' : 'Failed to create tag')
    }
    callback?.(false)
  }
}

async function confirmDelete() {
  if (!deletingTag.value || !libraryId.value) return

  isDeleting.value = true
  try {
    await tagsStore.deleteTag(libraryId.value, deletingTag.value.id)
    toast.success('Tag deleted successfully')
    showDeleteDialog.value = false
    deletingTag.value = null
  } catch (error) {
    toast.error('Failed to delete tag')
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.tag-card {
  transition: transform 0.2s ease-in-out;
}

.tag-card:hover {
  transform: translateY(-4px);
}

.empty-icon {
  opacity: 0.5;
}
</style>

