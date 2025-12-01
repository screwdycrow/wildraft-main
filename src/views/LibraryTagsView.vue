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
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-folder-plus"
          class="mr-2"
          @click="openCreateFolderDialog"
        >
          New Folder
        </v-btn>
        <v-btn
          v-if="canEdit"
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateTagDialog"
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
    <v-row v-else-if="!tagsStore.isLoading && tagsStore.tags.length === 0 && tagsStore.folders.length === 0">
      <v-col cols="12">
        <v-card class="glass-card pa-12 text-center" elevation="0">
          <v-icon icon="mdi-tag-off" size="120" color="primary" class="mb-6 empty-icon float-animation" />
          <h2 class="text-h6 font-weight-medium mb-2" style="color: rgba(var(--v-theme-on-surface), 0.5);">
            No tags yet
          </h2>
          <p class="text-body-2 text-grey-lighten-1 mb-6" style="max-width: 600px; margin: 0 auto; opacity: 0.6;">
            Create tags to organize your library content.
          </p>
          <div class="d-flex justify-center gap-3">
            <v-btn
              v-if="canEdit"
              color="secondary"
              size="large"
              variant="outlined"
              prepend-icon="mdi-folder-plus"
              @click="openCreateFolderDialog"
            >
              Create Folder
            </v-btn>
            <v-btn
              v-if="canEdit"
              color="primary"
              size="x-large"
              prepend-icon="mdi-plus"
              @click="openCreateTagDialog"
            >
              Create Your First Tag
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tags by Folder -->
    <template v-else>
      <!-- General (Uncategorized) Tags - Show First -->
      <div v-if="uncategorizedTags.length > 0" class="mb-6">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon
            variant="text"
            size="small"
            @click="toggleFolderCollapse('general')"
          >
            <v-icon :icon="collapsedFolders.has('general') ? 'mdi-chevron-right' : 'mdi-chevron-down'" />
          </v-btn>
          <v-icon icon="mdi-tag-multiple" color="grey" class="mr-2" />
          <h2 class="text-h5 font-weight-bold" style="color: rgb(var(--v-theme-on-surface));">
            General
          </h2>
          <v-chip size="small" class="ml-2">{{ uncategorizedTags.length }}</v-chip>
        </div>

        <v-expand-transition>
          <div v-show="!collapsedFolders.has('general')">
            <draggable
              v-model="localUncategorizedTags"
              item-key="id"
              handle=".tag-drag-handle"
              :disabled="!canEdit"
              class="v-row"
              @end="() => onTagReorder(null)"
            >
              <template #item="{ element: tag }">
                <v-col cols="12" sm="6" md="4" lg="3">
                  <tag-card
                    :tag="tag"
                    :can-edit="canEdit"
                    :draggable="canEdit"
                    @click="viewTagItems(tag)"
                    @edit="handleEditTag"
                    @delete="handleDeleteTag"
                  />
                </v-col>
              </template>
            </draggable>
          </div>
        </v-expand-transition>
      </div>

      <!-- Folders (Draggable) -->
      <draggable
        v-model="localFolders"
        item-key="id"
        handle=".folder-drag-handle"
        :disabled="!canEdit"
        class="folders-list"
        @end="onFolderReorder"
      >
        <template #item="{ element: folder }">
          <div class="mb-6">
            <div class="d-flex align-center mb-4">
              <v-icon
                v-if="canEdit"
                icon="mdi-drag"
                class="folder-drag-handle mr-2 cursor-grab"
                color="grey"
              />
              <v-btn
                icon
                variant="text"
                size="small"
                @click="toggleFolderCollapse(folder.id)"
              >
                <v-icon :icon="collapsedFolders.has(folder.id) ? 'mdi-chevron-right' : 'mdi-chevron-down'" />
              </v-btn>
              <v-icon icon="mdi-folder" color="primary" class="mr-2" />
              <h2 class="text-h5 font-weight-bold" style="color: rgb(var(--v-theme-on-surface));">
                {{ folder.name }}
              </h2>
              <v-chip size="small" class="ml-2">{{ getTagsInFolder(folder.id).length }}</v-chip>
              <v-spacer />
              <v-menu v-if="canEdit" location="bottom end">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                  />
                </template>
                <v-list class="glass-menu" density="compact">
                  <v-list-item
                    prepend-icon="mdi-pencil"
                    title="Edit Folder"
                    @click="handleEditFolder(folder)"
                  />
                  <v-divider class="my-1" />
                  <v-list-item
                    prepend-icon="mdi-delete"
                    title="Delete Folder"
                    class="text-error"
                    @click="handleDeleteFolder(folder)"
                  />
                </v-list>
              </v-menu>
            </div>

            <v-expand-transition>
              <div v-show="!collapsedFolders.has(folder.id)">
                <draggable
                  :model-value="getTagsInFolder(folder.id)"
                  item-key="id"
                  handle=".tag-drag-handle"
                  :disabled="!canEdit"
                  class="v-row"
                  @end="() => onTagReorder(folder.id)"
                >
                  <template #item="{ element: tag }">
                    <v-col cols="12" sm="6" md="4" lg="3">
                      <tag-card
                        :tag="tag"
                        :can-edit="canEdit"
                        :draggable="canEdit"
                        @click="viewTagItems(tag)"
                        @edit="handleEditTag"
                        @delete="handleDeleteTag"
                      />
                    </v-col>
                  </template>
                </draggable>

                <!-- Add Tag Button (Dashed Card) -->
                <v-col v-if="canEdit" cols="12" sm="6" md="4" lg="3">
                  <v-card
                    class="glass-card add-tag-card"
                    elevation="0"
                    hover
                    style="cursor: pointer; min-height: 120px; border: 2px dashed rgba(255, 255, 255, 0.2);"
                    @click="openCreateTagDialogWithFolder(folder.id)"
                  >
                    <v-card-text class="d-flex flex-column align-center justify-center pa-4" style="height: 100%;">
                      <v-icon icon="mdi-plus" size="32" color="grey-lighten-1" class="mb-2" />
                      <span class="text-body-2 text-grey-lighten-1">Add Tag</span>
                    </v-card-text>
                  </v-card>
                </v-col>

                <v-alert
                  v-if="getTagsInFolder(folder.id).length === 0 && !canEdit"
                  type="info"
                  variant="tonal"
                  class="mx-3"
                >
                  No tags in this folder
                </v-alert>
              </div>
            </v-expand-transition>
          </div>
        </template>
      </draggable>

    </template>

    <!-- Create/Edit Tag Dialog -->
    <tag-form-dialog
      v-model="showTagDialog"
      :tag="editingTag"
      :folders="tagsStore.folders"
      :library-id="libraryId!"
      :initial-folder-id="preselectedFolderId"
      @submit="handleCreateOrUpdateTag"
      @create-folder="handleQuickCreateFolder"
    />

    <!-- Create/Edit Folder Dialog -->
    <tag-folder-form-dialog
      v-model="showFolderDialog"
      :folder="editingFolder"
      @submit="handleCreateOrUpdateFolder"
    />

    <!-- Delete Tag Confirmation Dialog -->
    <v-dialog v-model="showDeleteTagDialog" max-width="500">
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
            @click="showDeleteTagDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDeleteTag"
            :loading="isDeleting"
          >
            Delete Tag
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Folder Confirmation Dialog -->
    <v-dialog v-model="showDeleteFolderDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Folder?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete the folder <strong>{{ deletingFolder?.name }}</strong>?
          </p>
          <v-alert type="info" variant="tonal" density="compact" icon="mdi-information" class="mb-3">
            Tags in this folder will be moved to Uncategorized.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteFolderDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDeleteFolder"
            :loading="isDeleting"
          >
            Delete Folder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useTagsStore } from '@/stores/tags'
import { useToast } from 'vue-toastification'
import draggable from 'vuedraggable'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TagFormDialog from '@/components/tags/TagFormDialog.vue'
import TagFolderFormDialog from '@/components/tags/TagFolderFormDialog.vue'
import TagCard from '@/components/tags/TagCard.vue'
import type { Tag, TagFolder } from '@/types/tag.types'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const tagsStore = useTagsStore()
const toast = useToast()

// Tag dialogs
const showTagDialog = ref(false)
const showDeleteTagDialog = ref(false)
const editingTag = ref<Tag | null>(null)
const deletingTag = ref<Tag | null>(null)

// Folder dialogs
const showFolderDialog = ref(false)
const showDeleteFolderDialog = ref(false)
const editingFolder = ref<TagFolder | null>(null)
const deletingFolder = ref<TagFolder | null>(null)

const isDeleting = ref(false)
const collapsedFolders = ref(new Set<number | string>())
const preselectedFolderId = ref<number | null>(null)

// Local copies for drag-and-drop
const localFolders = ref<TagFolder[]>([])
const localUncategorizedTags = ref<Tag[]>([])

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

const uncategorizedTags = computed(() => {
  return tagsStore.tags
    .filter(tag => !tag.folderId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
})

// Sync local state with store
watch(() => tagsStore.sortedFolders, (newFolders) => {
  localFolders.value = [...newFolders]
}, { immediate: true, deep: true })

watch(uncategorizedTags, (newTags) => {
  localUncategorizedTags.value = [...newTags]
}, { immediate: true, deep: true })

function getTagsInFolder(folderId: number): Tag[] {
  return tagsStore.tags
    .filter(tag => tag.folderId === folderId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

function toggleFolderCollapse(folderId: number | string) {
  if (collapsedFolders.value.has(folderId)) {
    collapsedFolders.value.delete(folderId)
  } else {
    collapsedFolders.value.add(folderId)
  }
}

onMounted(async () => {
  if (libraryId.value) {
    try {
      await tagsStore.fetchTags(libraryId.value)
    } catch (error) {
      toast.error('Failed to load tags')
    }
  }
})

// ==================== TAG HANDLERS ====================

function openCreateTagDialog() {
  editingTag.value = null
  preselectedFolderId.value = null
  showTagDialog.value = true
}

function openCreateTagDialogWithFolder(folderId: number) {
  editingTag.value = null
  preselectedFolderId.value = folderId
  showTagDialog.value = true
}

function handleEditTag(tag: Tag) {
  editingTag.value = tag
  showTagDialog.value = true
}

function handleDeleteTag(tag: Tag) {
  deletingTag.value = tag
  showDeleteTagDialog.value = true
}

function viewTagItems(tag: Tag) {
  if (libraryId.value) {
    router.push({
      name: 'TagLibraryItems',
      params: {
        id: libraryId.value,
        tagId: tag.id,
      },
    })
  }
}

async function handleCreateOrUpdateTag(
  data: { name: string; color: string; folderId?: number | null; featuredImageId?: number | null },
  callback?: (success: boolean) => void
) {
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
    preselectedFolderId.value = null
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

async function confirmDeleteTag() {
  if (!deletingTag.value || !libraryId.value) return

  isDeleting.value = true
  try {
    await tagsStore.deleteTag(libraryId.value, deletingTag.value.id)
    toast.success('Tag deleted successfully')
    showDeleteTagDialog.value = false
    deletingTag.value = null
  } catch (error) {
    toast.error('Failed to delete tag')
  } finally {
    isDeleting.value = false
  }
}

async function onTagReorder(folderId: number | null) {
  if (!libraryId.value) return
  
  const tags = folderId !== null 
    ? getTagsInFolder(folderId)
    : localUncategorizedTags.value
  
  const tagIds = tags.map(t => t.id)
  
  try {
    await tagsStore.reorderTagsInFolder(libraryId.value, folderId, tagIds)
  } catch (error) {
    toast.error('Failed to reorder tags')
  }
}

// ==================== FOLDER HANDLERS ====================

function openCreateFolderDialog() {
  editingFolder.value = null
  showFolderDialog.value = true
}

function handleEditFolder(folder: TagFolder) {
  editingFolder.value = folder
  showFolderDialog.value = true
}

function handleDeleteFolder(folder: TagFolder) {
  deletingFolder.value = folder
  showDeleteFolderDialog.value = true
}

async function handleCreateOrUpdateFolder(
  data: { name: string },
  callback?: (success: boolean) => void
) {
  if (!libraryId.value) return

  try {
    if (editingFolder.value) {
      await tagsStore.updateFolder(libraryId.value, editingFolder.value.id, data)
      toast.success('Folder updated successfully!')
    } else {
      await tagsStore.createFolder(libraryId.value, data)
      toast.success('Folder created successfully!')
    }
    showFolderDialog.value = false
    editingFolder.value = null
    callback?.(true)
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('A folder with this name already exists')
    } else {
      toast.error(editingFolder.value ? 'Failed to update folder' : 'Failed to create folder')
    }
    callback?.(false)
  }
}

async function handleQuickCreateFolder(name: string, callback: (folder: TagFolder | null) => void) {
  if (!libraryId.value) {
    callback(null)
    return
  }

  try {
    const folder = await tagsStore.createFolder(libraryId.value, { name })
    toast.success('Folder created!')
    callback(folder)
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('A folder with this name already exists')
    } else {
      toast.error('Failed to create folder')
    }
    callback(null)
  }
}

async function confirmDeleteFolder() {
  if (!deletingFolder.value || !libraryId.value) return

  isDeleting.value = true
  try {
    await tagsStore.deleteFolder(libraryId.value, deletingFolder.value.id)
    toast.success('Folder deleted successfully')
    showDeleteFolderDialog.value = false
    deletingFolder.value = null
  } catch (error) {
    toast.error('Failed to delete folder')
  } finally {
    isDeleting.value = false
  }
}

async function onFolderReorder() {
  if (!libraryId.value) return
  
  const folderIds = localFolders.value.map(f => f.id)
  
  try {
    await tagsStore.reorderFolders(libraryId.value, folderIds)
  } catch (error) {
    toast.error('Failed to reorder folders')
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

.cursor-grab {
  cursor: grab;
}

.cursor-grab:active {
  cursor: grabbing;
}

.folders-list {
  display: flex;
  flex-direction: column;
}
</style>
