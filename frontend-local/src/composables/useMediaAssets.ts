import { ref, computed } from 'vue'
import type { UserFile } from '@/api/files'

export interface MediaAssetOptions {
  selectable?: boolean
  multiSelect?: boolean
  deletable?: boolean
  onDelete?: (file: UserFile) => void | Promise<void>
  onSelect?: (file: UserFile) => void
  onMultiSelect?: (files: UserFile[]) => void
}

export function useMediaAssets(files: UserFile[], options: MediaAssetOptions = {}) {
  const selectedFiles = ref<Set<number>>(new Set())
  const viewMode = ref<'grid' | 'list'>('grid')
  const sortBy = ref<'name' | 'date' | 'size' | 'type'>('date')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const filterType = ref<string | null>(null)
  const searchQuery = ref('')

  // Computed sorted and filtered files
  const filteredFiles = computed(() => {
    let result = [...files]

    // Search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(f => f.fileName.toLowerCase().includes(query))
    }

    // Type filter
    if (filterType.value) {
      result = result.filter(f => f.fileType.includes(filterType.value!))
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortBy.value) {
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName)
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'size':
          comparison = a.fileSize - b.fileSize
          break
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType)
          break
      }

      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return result
  })

  // Selection management
  const isSelected = (fileId: number) => selectedFiles.value.has(fileId)

  const toggleSelect = (file: UserFile) => {
    if (!options.selectable) return

    if (selectedFiles.value.has(file.id)) {
      selectedFiles.value.delete(file.id)
    } else {
      if (!options.multiSelect) {
        selectedFiles.value.clear()
      }
      selectedFiles.value.add(file.id)
    }

    if (options.onSelect && selectedFiles.value.size === 1) {
      options.onSelect(file)
    }

    if (options.onMultiSelect) {
      const selected = files.filter(f => selectedFiles.value.has(f.id))
      options.onMultiSelect(selected)
    }
  }

  const selectAll = () => {
    if (!options.multiSelect) return
    filteredFiles.value.forEach(f => selectedFiles.value.add(f.id))
    
    if (options.onMultiSelect) {
      const selected = files.filter(f => selectedFiles.value.has(f.id))
      options.onMultiSelect(selected)
    }
  }

  const clearSelection = () => {
    selectedFiles.value.clear()
    if (options.onMultiSelect) {
      options.onMultiSelect([])
    }
  }

  const selectedCount = computed(() => selectedFiles.value.size)

  const getSelectedFiles = () => {
    return files.filter(f => selectedFiles.value.has(f.id))
  }

  // Delete handler
  const handleDelete = async (file: UserFile) => {
    if (options.deletable && options.onDelete) {
      await options.onDelete(file)
      selectedFiles.value.delete(file.id)
    }
  }

  // File type helpers
  const isImage = (file: UserFile) => file.fileType.startsWith('image/')
  const isVideo = (file: UserFile) => file.fileType.startsWith('video/')
  const isAudio = (file: UserFile) => file.fileType.startsWith('audio/')
  const isPdf = (file: UserFile) => file.fileType.includes('pdf')
  const isDocument = (file: UserFile) => {
    return file.fileType.includes('word') || 
           file.fileType.includes('document') ||
           file.fileType.includes('text')
  }

  const getFileCategory = (file: UserFile): string => {
    if (isImage(file)) return 'image'
    if (isVideo(file)) return 'video'
    if (isAudio(file)) return 'audio'
    if (isPdf(file)) return 'pdf'
    if (isDocument(file)) return 'document'
    return 'other'
  }

  return {
    // State
    selectedFiles,
    viewMode,
    sortBy,
    sortOrder,
    filterType,
    searchQuery,
    
    // Computed
    filteredFiles,
    selectedCount,
    
    // Selection methods
    isSelected,
    toggleSelect,
    selectAll,
    clearSelection,
    getSelectedFiles,
    
    // File methods
    handleDelete,
    
    // File type helpers
    isImage,
    isVideo,
    isAudio,
    isPdf,
    isDocument,
    getFileCategory,
  }
}



