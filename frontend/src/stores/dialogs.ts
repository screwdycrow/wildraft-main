import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LibraryItem } from '@/types/item.types'
import type { UserFile } from '@/api/files'

/**
 * Global dialog store for managing app-wide dialogs
 * This allows any component to trigger dialogs (item viewer, editor, etc.)
 */
export const useDialogsStore = defineStore('dialogs', () => {
  // Item Viewer Dialog
  const itemViewerOpen = ref(false)
  const itemViewerData = ref<{ item: LibraryItem; libraryId: number; chapterId?: string } | null>(null)

  function openItemViewer(item: LibraryItem, libraryId: number, chapterId?: string) {
    itemViewerData.value = { item, libraryId, chapterId }
    itemViewerOpen.value = true
  }

  function closeItemViewer() {
    itemViewerOpen.value = false
    // Delay clearing data to allow transition
    setTimeout(() => {
      itemViewerData.value = null
    }, 300)
  }

  // File Viewer Dialog
  const fileViewerOpen = ref(false)
  const fileViewerData = ref<UserFile | null>(null)

  function openFileViewer(file: UserFile) {
    fileViewerData.value = file
    fileViewerOpen.value = true
  }

  function closeFileViewer() {
    fileViewerOpen.value = false
    setTimeout(() => {
      fileViewerData.value = null
    }, 300)
  }

  // Item Editor Dialog
  const itemEditorOpen = ref(false)
  const itemEditorData = ref<{ item: LibraryItem | null; libraryId: number; itemType?: string; initialTagIds?: number[]; initialData?: any } | null>(null)

  function openItemEditor(item: LibraryItem, libraryId: number) {
    itemEditorData.value = { item, libraryId }
    itemEditorOpen.value = true
  }

  function openItemEditorCreate(itemType: string, libraryId: number, initialTagIds?: number[], initialData?: any) {
    itemEditorData.value = { item: null, libraryId, itemType, initialTagIds, initialData }
    itemEditorOpen.value = true
  }

  const itemEditorMergeData = ref<any>(null)

  function closeItemEditor() {
    itemEditorOpen.value = false
    setTimeout(() => {
      itemEditorData.value = null
      itemEditorMergeData.value = null
    }, 300)
  }

  // Item Presentation Dialog
  const itemPresentationOpen = ref(false)
  const itemPresentationData = ref<{ item: LibraryItem } | null>(null)

  function openItemPresentation(item: LibraryItem) {
    itemPresentationData.value = { item }
    itemPresentationOpen.value = true
  }

  function closeItemPresentation() {
    itemPresentationOpen.value = false
    setTimeout(() => {
      itemPresentationData.value = null
    }, 300)
  }

  return {
    itemViewerOpen,
    itemViewerData,
    openItemViewer,
    closeItemViewer,

    fileViewerOpen,
    fileViewerData,
    openFileViewer,
    closeFileViewer,

    itemEditorOpen,
    itemEditorData,
    itemEditorMergeData,
    openItemEditor,
    openItemEditorCreate,
    closeItemEditor,

    itemPresentationOpen,
    itemPresentationData,
    openItemPresentation,
    closeItemPresentation,
  }
})

