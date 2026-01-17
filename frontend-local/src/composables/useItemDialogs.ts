import { ref } from 'vue'
import type { LibraryItem, ItemType } from '@/types/item.types'

export interface ItemDialogState {
  isOpen: boolean
  mode: 'create' | 'edit' | null
  itemType: ItemType | null
  item: LibraryItem | null
  libraryId: number | null
  initialTagIds?: number[]
}

// Global state for item dialog
const dialogState = ref<ItemDialogState>({
  isOpen: false,
  mode: null,
  itemType: null,
  item: null,
  libraryId: null,
  initialTagIds: undefined,
})

export function useItemDialogs() {
  /**
   * Open a dialog to create a new item
   */
  function openCreateDialog(itemType: ItemType, libraryId: number, initialTagIds?: number[]) {
    dialogState.value = {
      isOpen: true,
      mode: 'create',
      itemType,
      item: null,
      libraryId,
      initialTagIds,
    }
  }

  /**
   * Open a dialog to edit an existing item
   */
  function openEditDialog(item: LibraryItem, libraryId: number) {
    dialogState.value = {
      isOpen: true,
      mode: 'edit',
      itemType: item.type,
      item,
      libraryId,
    }
  }

  /**
   * Close the dialog
   */
  function closeDialog() {
    dialogState.value = {
      isOpen: false,
      mode: null,
      itemType: null,
      item: null,
      libraryId: null,
      initialTagIds: undefined,
    }
  }

  /**
   * Check if dialog is open
   */
  function isDialogOpen(): boolean {
    return dialogState.value.isOpen
  }

  /**
   * Get current dialog state
   */
  function getDialogState(): ItemDialogState {
    return dialogState.value
  }

  return {
    dialogState,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    isDialogOpen,
    getDialogState,
  }
}


