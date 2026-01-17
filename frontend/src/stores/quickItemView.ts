import { defineStore } from 'pinia'
import type { LibraryItem } from '@/types/item.types'

interface QuickItemViewState {
  isOpen: boolean
  item: LibraryItem | null
}

export const useQuickItemViewStore = defineStore('quickItemView', {
  state: (): QuickItemViewState => ({
    isOpen: false,
    item: null,
  }),
  actions: {
    open(item: LibraryItem) {
      this.item = item
      this.isOpen = true
    },
    close() {
      this.isOpen = false
      this.item = null
    },
    setOpen(value: boolean) {
      if (!value) {
        this.close()
      } else if (this.item) {
        this.isOpen = true
      }
    },
  },
})



