<template>
  <v-dialog
    v-model="isOpen"
    max-width="1400"
    scrollable
    persistent
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <!-- Breadcrumb Navigation -->
        <div class="d-flex align-center mr-4">
          <v-btn
            v-if="currentCategoryId !== null"
            icon
            size="small"
            variant="text"
            @click="navigateBack"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
        <v-icon icon="mdi-folder-multiple" class="mr-2" />
          <span>{{ currentCategoryName || (selectMode ? 'Select Files' : 'File Manager') }}</span>
        </div>
        
        <v-spacer />
        
        <!-- Create Folder Button (only in root view) -->
        <v-btn
          v-if="currentCategoryId === null && canManage"
          icon
          size="small"
          variant="text"
          @click="showCreateFolderDialog = true"
          class="mr-2"
        >
          <v-icon>mdi-folder-plus</v-icon>
          <v-tooltip activator="parent" location="bottom">
            Create Folder
          </v-tooltip>
        </v-btn>
        
        <!-- Selection Info -->
        <v-chip
          v-if="selectMode && selectedFiles.size > 0"
          color="primary"
          size="small"
          class="mr-2"
        >
          {{ selectedFiles.size }} selected
        </v-chip>
        
        <!-- View Toggle -->
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="compact"
          class="mr-2"
        >
          <v-btn value="grid" icon="mdi-view-grid" size="small" />
          <v-btn value="list" icon="mdi-view-list" size="small" />
        </v-btn-toggle>
        
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="close"
        />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 700px;">
        <!-- Filters and Search -->
        <div class="d-flex ga-2 mb-4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search files"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
          <v-select
            v-model="filterType"
            :items="fileTypes"
            label="File Type"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="max-width: 200px;"
          />
        </div>

        <!-- Drag & Drop Upload Zone -->
        <drag-drop-upload
          class="mb-4"
          :category-id="currentCategoryId"
          @uploaded="handleFileUploaded"
          @upload-complete="handleUploadComplete"
          @upload-error="handleUploadError"
        />

        <!-- Folder Cards (only show in root view) -->
        <div v-if="currentCategoryId === null" class="folders-grid mb-4">
          <div
            v-for="category in fileCategoriesStore.categories"
            :key="category.id"
            class="folder-card"
            :class="{ 'folder-card--drag-over': dragOverCategoryId === category.id }"
            @click="navigateToCategory(category)"
            @dragover.prevent="handleFolderDragOver(category.id)"
            @dragleave="handleFolderDragLeave"
            @drop.prevent="(e) => handleFolderDrop(e, category.id)"
          >
            <!-- Folder Menu (Three Dots) -->
            <div v-if="canManage" class="folder-card__menu" @click.stop>
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                    color="white"
                    @click.stop
                  />
                </template>
                <v-list>
                  <v-list-item
                    title="Rename"
                    prepend-icon="mdi-pencil"
                    @click="handleRenameFolder(category)"
                  />
                  <v-list-item
                    title="Delete"
                    prepend-icon="mdi-delete"
                    color="error"
                    @click="handleDeleteFolder(category)"
                  />
                </v-list>
              </v-menu>
            </div>

            <div class="folder-icon">
              <v-icon size="64" color="primary">mdi-folder</v-icon>
            </div>
            <div class="folder-name">{{ category.name }}</div>
            <div class="folder-count">{{ category.fileCount || 0 }} files</div>
          </div>
        </div>

        <!-- Media Grid -->
        <media-grid
          v-if="!filesStore.loading"
          :files="filteredFiles"
          :view-mode="viewMode"
          :deletable="!selectMode"
          :selectable="selectMode"
          :selected-files="selectedFiles"
          :show-view-action="!selectMode"
          :show-move-menu="!selectMode && fileCategoriesStore.categories.length > 0"
          :available-folders="availableFoldersForMove"
          @file-click="handleFileClick"
          @toggle-select="toggleFileSelection"
          @delete="confirmDelete"
          @view="openFileViewer"
          @move-to-folder="handleMoveToFolder"
        />

        <!-- Loading State -->
        <div v-if="filesStore.loading || fileCategoriesStore.loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Empty State -->
        <div v-if="!filesStore.loading && !fileCategoriesStore.loading && filteredFiles.length === 0 && currentCategoryId === null && fileCategoriesStore.categories.length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-folder-outline</v-icon>
          <p class="text-h6 text-grey-lighten-1">No files or folders</p>
          <p class="text-body-2 text-grey-lighten-1">Upload files or create a folder to get started</p>
        </div>

        <!-- Load More -->
        <div v-if="canLoadMore && !filesStore.loading" class="text-center mt-4">
          <v-btn
            @click="loadMore"
            :loading="filesStore.loading"
            variant="outlined"
          >
            Load More
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          {{ selectMode ? 'Cancel' : 'Close' }}
        </v-btn>
        <v-btn
          v-if="selectMode"
          color="primary"
          variant="flat"
          :disabled="selectedFiles.size === 0"
          @click="confirmSelection"
        >
          <v-icon icon="mdi-check" class="mr-2" />
          Select {{ selectedFiles.size > 0 ? `(${selectedFiles.size})` : '' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Media Viewer -->
  <media-viewer
    v-model="viewerOpen"
    :file="selectedFile"
    :files="filteredFiles"
    :on-delete="confirmDelete"
  />

  <!-- Delete Confirmation -->
  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title>Delete File?</v-card-title>
      <v-card-text>
        Are you sure you want to delete <strong>{{ fileToDelete?.fileName }}</strong>?
        This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="deleteFileConfirmed" :loading="deleting">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Create Folder Dialog -->
  <v-dialog v-model="showCreateFolderDialog" max-width="400">
    <v-card>
      <v-card-title>Create Folder</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="newFolderName"
          label="Folder Name"
          variant="outlined"
          density="compact"
          autofocus
          @keyup.enter="createFolder"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showCreateFolderDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="createFolder" :loading="creatingFolder" :disabled="!newFolderName.trim()">
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Rename Folder Dialog -->
  <v-dialog v-model="showRenameFolderDialog" max-width="400">
    <v-card>
      <v-card-title>Rename Folder</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="renameFolderName"
          label="Folder Name"
          variant="outlined"
          density="compact"
          autofocus
          @keyup.enter="renameFolder"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showRenameFolderDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="renameFolder" :loading="renamingFolder" :disabled="!renameFolderName.trim()">
          Rename
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Folder Confirmation -->
  <v-dialog v-model="showDeleteFolderDialog" max-width="400">
    <v-card>
      <v-card-title>Delete Folder?</v-card-title>
      <v-card-text>
        Are you sure you want to delete <strong>{{ folderToDelete?.name }}</strong>?
        <br />
        <span class="text-caption text-medium-emphasis">
          This will move all files in this folder to uncategorized. This action cannot be undone.
        </span>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showDeleteFolderDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="confirmDeleteFolder" :loading="deletingFolder">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFilesStore } from '@/stores/files'
import { useFileCategoriesStore } from '@/stores/fileCategories'
import { useLibraryStore } from '@/stores/library'
import type { UserFile, FileCategory } from '@/api/files'
import { useToast } from 'vue-toastification'
import MediaGrid from './MediaGrid.vue'
import MediaViewer from './MediaViewer.vue'
import DragDropUpload from './DragDropUpload.vue'

interface Props {
  selectMode?: boolean
  returnType?: 'id' | 'path'
  multiple?: boolean
  filterType?: string | null // Filter by file type (e.g., 'image')
}

const props = withDefaults(defineProps<Props>(), {
  selectMode: false,
  returnType: 'id',
  multiple: false,
  filterType: null,
})

const emit = defineEmits<{
  select: [value: number | string | number[] | string[]]
}>()

const route = useRoute()
const filesStore = useFilesStore()
const fileCategoriesStore = useFileCategoriesStore()
const libraryStore = useLibraryStore()
const toast = useToast()

const isOpen = defineModel<boolean>('modelValue', { default: false })
const search = ref('')
const filterType = ref<string | null>(null)
const deleteDialog = ref(false)
const fileToDelete = ref<UserFile | null>(null)
const deleting = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const selectedFiles = ref<Set<number>>(new Set())
const viewerOpen = ref(false)
const selectedFile = ref<UserFile | null>(null)

// Folder navigation
const currentCategoryId = ref<number | null>(null)
const categoryFiles = ref<UserFile[]>([]) // Store files from category response
const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const creatingFolder = ref(false)
const dragOverCategoryId = ref<number | null>(null)

// Folder management
const showRenameFolderDialog = ref(false)
const folderToRename = ref<FileCategory | null>(null)
const renameFolderName = ref('')
const renamingFolder = ref(false)
const showDeleteFolderDialog = ref(false)
const folderToDelete = ref<FileCategory | null>(null)
const deletingFolder = ref(false)

// Get library ID from route or store
const libraryId = computed(() => {
  const id = route.params.id || route.params.libraryId
  if (id) return Number(id)
  return libraryStore.currentLibrary?.id || null
})

// Check if user can manage (create folders)
const canManage = computed(() => {
  return ['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || '')
})

// Current category name for breadcrumb
const currentCategoryName = computed(() => {
  if (currentCategoryId.value === null) return null
  const category = fileCategoriesStore.getCategoryById(currentCategoryId.value)
  return category?.name || null
})

// Available folders for move menu (exclude current folder)
const availableFoldersForMove = computed(() => {
  if (currentCategoryId.value === null) return fileCategoriesStore.categories
  return fileCategoriesStore.categories.filter(c => c.id !== currentCategoryId.value)
})

const fileTypes = [
  { title: 'Images', value: 'image' },
  { title: 'Documents', value: 'document' },
  { title: 'Videos', value: 'video' },
  { title: 'Audio', value: 'audio' },
  { title: 'Archives', value: 'archive' },
]

// Load files and categories when dialog opens
watch(isOpen, async (value) => {
  if (value) {
    // Reset navigation
    currentCategoryId.value = null
    
    // Load categories if we have a library ID
    if (libraryId.value) {
      try {
        await fileCategoriesStore.fetchCategories(libraryId.value)
      } catch (error) {
        console.error('Failed to load categories:', error)
      }
    }
    
    // Load uncategorized files
    try {
      await filesStore.fetchUncategorizedFiles()
    } catch (error) {
      console.error('Failed to load files:', error)
      // Fallback to regular fetch
      await filesStore.fetchFiles()
    }
    
    // Set filter type if provided
    if (props.filterType) {
      filterType.value = props.filterType
    }
  }
})

// Filtered files (already filtered by category if in a folder)
const filteredFiles = computed(() => {
  let result: UserFile[]

  // If in a category, use the category files directly (no API call needed)
  if (currentCategoryId.value !== null) {
    result = categoryFiles.value
  } else {
    // In root view, use store files filtered to uncategorized
    result = filesStore.files.filter(f => f.categoryId === null)
  }

  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(f => 
      f.fileName.toLowerCase().includes(searchLower)
    )
  }

  if (filterType.value) {
    result = result.filter(f => f.fileType.includes(filterType.value!))
  }

  return result
})

const canLoadMore = computed(() => {
  // Don't show "Load More" when viewing a category (all files are already loaded)
  if (currentCategoryId.value !== null) {
    return false
  }
  return filesStore.files.length < filesStore.total
})

// Handle file upload events from DragDropUpload component
const handleFileUploaded = (_file: UserFile) => {
  // File has been uploaded and added to the store
  // The store already adds the file to the list, so no action needed here
}

const handleUploadComplete = async (_files: UserFile[]) => {
  // All files have been uploaded successfully
  // Refresh the file list based on current view
  if (currentCategoryId.value !== null) {
    // Reload files for current category (files are already in store, just refresh category view)
    await loadFilesForCategory(currentCategoryId.value)
  } else {
    // Reload uncategorized files
    await filesStore.fetchUncategorizedFiles()
    }

  // Refresh categories to update file counts
  if (libraryId.value) {
    await fileCategoriesStore.fetchCategories(libraryId.value)
  }
}

const handleUploadError = (error: Error) => {
  // Handle upload error (toast is already shown by DragDropUpload)
  console.error('Upload error:', error)
}

const openFileViewer = (file: UserFile) => {
  selectedFile.value = file
  viewerOpen.value = true
}

const confirmDelete = (file: UserFile) => {
  fileToDelete.value = file
  deleteDialog.value = true
}

const deleteFileConfirmed = async () => {
  if (!fileToDelete.value) return

  deleting.value = true
  try {
    await filesStore.deleteFile(fileToDelete.value.id)
    toast.success('File deleted successfully')
    deleteDialog.value = false
    fileToDelete.value = null
  } catch (error) {
    console.error('Delete failed:', error)
    toast.error('Failed to delete file')
  } finally {
    deleting.value = false
  }
}

const loadMore = () => {
  filesStore.loadMore()
}

// File click handler
const handleFileClick = (file: UserFile) => {
  if (props.selectMode) {
    toggleFileSelection(file)
  } else {
    openFileViewer(file)
  }
}

// Select mode handlers
const toggleFileSelection = (file: UserFile) => {
  if (!props.selectMode) return
  
  if (props.multiple) {
    // Toggle selection for multiple mode
    if (selectedFiles.value.has(file.id)) {
      selectedFiles.value.delete(file.id)
    } else {
      selectedFiles.value.add(file.id)
    }
  } else {
    // Single selection mode
    selectedFiles.value.clear()
    selectedFiles.value.add(file.id)
  }
}

const confirmSelection = () => {
  if (selectedFiles.value.size === 0) return
  
  const selectedFileIds = Array.from(selectedFiles.value)
  const selectedFileObjects = filesStore.files.filter(f => selectedFileIds.includes(f.id))
  
  if (props.returnType === 'path') {
    // Return file paths
    const paths = selectedFileObjects.map(f => f.fileUrl)
    emit('select', props.multiple ? paths : paths[0])
  } else {
    // Return file IDs (default)
    emit('select', props.multiple ? selectedFileIds : selectedFileIds[0])
  }
  
  // Clear selection and close
  selectedFiles.value.clear()
  isOpen.value = false
}

const close = () => {
  selectedFiles.value.clear()
  currentCategoryId.value = null
  isOpen.value = false
}

// Navigation functions
const navigateToCategory = async (category: FileCategory) => {
  currentCategoryId.value = category.id
  await loadFilesForCategory(category.id)
}

const navigateBack = () => {
  currentCategoryId.value = null
  categoryFiles.value = [] // Clear category files
  // No need to refetch - filteredFiles computed property will automatically filter
  // the existing filesStore.files based on currentCategoryId
}

const loadFilesForCategory = async (categoryId: number) => {
  if (!libraryId.value) return
  
  try {
    // Get category with files from API - files are already included in the response
    const categoryWithFiles = await fileCategoriesStore.getCategoryWithFiles(libraryId.value, categoryId)
    
    // Use the files directly from the category response
    if (categoryWithFiles.userFiles && Array.isArray(categoryWithFiles.userFiles)) {
      // Map the userFiles to UserFile format and fetch download URLs
      const filesWithUrls = await Promise.all(
        categoryWithFiles.userFiles.map(async (file: any) => {
          try {
            // Fetch download URL for each file
            const downloadUrl = await filesStore.getDownloadUrl(file.id)
            return {
              id: file.id,
              fileName: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              categoryId: categoryId,
              createdAt: file.createdAt,
              updatedAt: file.updatedAt,
              fileUrl: file.fileUrl || '',
              downloadUrl: downloadUrl,
            } as UserFile
          } catch (error) {
            console.error(`Failed to get download URL for file ${file.id}:`, error)
            // Return file without downloadUrl if fetch fails
            return {
              id: file.id,
              fileName: file.fileName,
              fileType: file.fileType,
              fileSize: file.fileSize,
              categoryId: categoryId,
              createdAt: file.createdAt,
              updatedAt: file.updatedAt,
              fileUrl: file.fileUrl || '',
              downloadUrl: null,
            } as UserFile
          }
        })
      )
      
      categoryFiles.value = filesWithUrls
    } else {
      categoryFiles.value = []
    }
  } catch (error) {
    console.error('Failed to load files for category:', error)
    toast.error('Failed to load folder contents')
    categoryFiles.value = []
  }
}

// Create folder
const createFolder = async () => {
  if (!newFolderName.value.trim() || !libraryId.value) return
  
  creatingFolder.value = true
  try {
    await fileCategoriesStore.createCategory(libraryId.value, newFolderName.value.trim())
    toast.success('Folder created successfully')
    showCreateFolderDialog.value = false
    newFolderName.value = ''
  } catch (error: any) {
    console.error('Failed to create folder:', error)
    toast.error(error.response?.data?.error || 'Failed to create folder')
  } finally {
    creatingFolder.value = false
  }
}

// Rename folder
const handleRenameFolder = (category: FileCategory) => {
  folderToRename.value = category
  renameFolderName.value = category.name
  showRenameFolderDialog.value = true
}

const renameFolder = async () => {
  if (!renameFolderName.value.trim() || !folderToRename.value || !libraryId.value) return
  
  renamingFolder.value = true
  try {
    await fileCategoriesStore.updateCategory(libraryId.value, folderToRename.value.id, renameFolderName.value.trim())
    toast.success('Folder renamed successfully')
    showRenameFolderDialog.value = false
    folderToRename.value = null
    renameFolderName.value = ''
  } catch (error: any) {
    console.error('Failed to rename folder:', error)
    toast.error(error.response?.data?.error || 'Failed to rename folder')
  } finally {
    renamingFolder.value = false
  }
}

// Delete folder
const handleDeleteFolder = (category: FileCategory) => {
  folderToDelete.value = category
  showDeleteFolderDialog.value = true
}

const confirmDeleteFolder = async () => {
  if (!folderToDelete.value || !libraryId.value) return
  
  const categoryIdToDelete = folderToDelete.value.id
  deletingFolder.value = true
  try {
    await fileCategoriesStore.deleteCategory(libraryId.value, categoryIdToDelete)
    toast.success('Folder deleted successfully')
    
    // If we were viewing this folder, navigate back
    if (currentCategoryId.value === categoryIdToDelete) {
      currentCategoryId.value = null
    }
    
    showDeleteFolderDialog.value = false
    folderToDelete.value = null
  } catch (error: any) {
    console.error('Failed to delete folder:', error)
    toast.error(error.response?.data?.error || 'Failed to delete folder')
  } finally {
    deletingFolder.value = false
  }
}

// Handle move to folder from menu
const handleMoveToFolder = async (file: UserFile, categoryId: number | null) => {
  const oldCategoryId = file.categoryId
  
  try {
    // Update file category (this already updates the local file in the store)
    await filesStore.updateFileCategory(file.id, categoryId)
    
    // If we're currently viewing a category, update the categoryFiles array
    if (currentCategoryId.value !== null) {
      if (categoryId === currentCategoryId.value) {
        // File moved to current category - add it to categoryFiles if not already there
        if (!categoryFiles.value.find(f => f.id === file.id)) {
          categoryFiles.value.push({ ...file, categoryId })
        }
      } else if (oldCategoryId === currentCategoryId.value) {
        // File moved away from current category - remove it from categoryFiles
        categoryFiles.value = categoryFiles.value.filter(f => f.id !== file.id)
      }
    }
    
    // Update category file counts locally (mutate the reactive objects)
    if (oldCategoryId !== null) {
      const oldCategoryIndex = fileCategoriesStore.categories.findIndex(c => c.id === oldCategoryId)
      if (oldCategoryIndex !== -1) {
        const oldCategory = fileCategoriesStore.categories[oldCategoryIndex]
        if (oldCategory.fileCount !== undefined) {
          oldCategory.fileCount = Math.max(0, (oldCategory.fileCount || 0) - 1)
        }
      }
    }
    
    if (categoryId !== null) {
      const categoryIndex = fileCategoriesStore.categories.findIndex(c => c.id === categoryId)
      if (categoryIndex !== -1) {
        const targetCategory = fileCategoriesStore.categories[categoryIndex]
        if (targetCategory.fileCount !== undefined) {
          targetCategory.fileCount = (targetCategory.fileCount || 0) + 1
        }
      }
    }
    
    const categoryName = categoryId !== null 
      ? fileCategoriesStore.getCategoryById(categoryId)?.name || 'folder'
      : 'Uncategorized'
    
    toast.success(`"${file.fileName}" moved to "${categoryName}"`)
  } catch (error: any) {
    console.error('Failed to move file to folder:', error)
    toast.error(error.response?.data?.error || 'Failed to move file to folder')
  }
}

// Drag and drop handlers for folders
const handleFolderDragOver = (categoryId: number) => {
  dragOverCategoryId.value = categoryId
}

const handleFolderDragLeave = (event: DragEvent) => {
  // Only clear drag-over if we're actually leaving the element (not just moving to a child)
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  if (!currentTarget.contains(relatedTarget)) {
    dragOverCategoryId.value = null
  }
}

const handleFolderDrop = async (event: DragEvent, categoryId: number) => {
  dragOverCategoryId.value = null
  
  // Get the dragged file ID from the event
  if (!event?.dataTransfer) return
  
  let fileId: number | null = null
  
  try {
    // Try to get data from application/json
    const data = event.dataTransfer.getData('application/json')
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.type === 'user-file' && parsed.fileId) {
        fileId = parsed.fileId
      }
    }
  } catch (e) {
    // Fallback to text/plain
    const textData = event.dataTransfer.getData('text/plain')
    if (textData && textData.startsWith('file:')) {
      fileId = parseInt(textData.replace('file:', ''))
    }
  }
  
  if (!fileId || isNaN(fileId)) return
  
  try {
    // Find the file before updating
    const file = filesStore.files.find(f => f.id === fileId)
    if (!file) return
    
    const oldCategoryId = file.categoryId
    const category = fileCategoriesStore.getCategoryById(categoryId)
    
    // Update file category (this already updates the local file in the store)
    await filesStore.updateFileCategory(fileId, categoryId)
    
    // Update category file counts locally (mutate the reactive objects)
    if (oldCategoryId !== null) {
      const oldCategoryIndex = fileCategoriesStore.categories.findIndex(c => c.id === oldCategoryId)
      if (oldCategoryIndex !== -1) {
        const oldCategory = fileCategoriesStore.categories[oldCategoryIndex]
        if (oldCategory.fileCount !== undefined) {
          oldCategory.fileCount = Math.max(0, (oldCategory.fileCount || 0) - 1)
        }
      }
    }
    
    const categoryIndex = fileCategoriesStore.categories.findIndex(c => c.id === categoryId)
    if (categoryIndex !== -1) {
      const targetCategory = fileCategoriesStore.categories[categoryIndex]
      if (targetCategory.fileCount !== undefined) {
        targetCategory.fileCount = (targetCategory.fileCount || 0) + 1
      }
    }
    
    toast.success(`"${file.fileName}" moved to "${category?.name || 'folder'}"`)
  } catch (error: any) {
    console.error('Failed to move file to folder:', error)
    toast.error(error.response?.data?.error || 'Failed to move file to folder')
  }
}
</script>

<style scoped>
.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(var(--v-theme-surface), 0.5);
  border: 2px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 140px;
  position: relative;
}

.folder-card:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgb(var(--v-theme-primary));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.folder-card--drag-over {
  outline: 3px solid rgba(var(--v-theme-success), 0.8);
  outline-offset: 2px;
  background: rgba(var(--v-theme-success), 0.1);
  border-color: rgb(var(--v-theme-success));
  box-shadow: 
    0 0 0 4px rgba(var(--v-theme-success), 0.2),
    0 0 20px rgba(var(--v-theme-success), 0.4),
    0 0 40px rgba(var(--v-theme-success), 0.2);
  transform: scale(1.05);
  z-index: 100;
}

.folder-icon {
  margin-bottom: 12px;
}

.folder-name {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  margin-bottom: 4px;
  word-break: break-word;
  max-width: 100%;
}

.folder-count {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  text-align: center;
}

.folder-card__menu {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
}

.folder-card:hover .folder-card__menu {
  opacity: 1;
}
</style>

