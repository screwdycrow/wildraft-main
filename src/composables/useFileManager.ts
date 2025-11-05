import { ref } from 'vue'

// Global state for file manager
const isFileManagerOpen = ref(false)

export function useFileManager() {
  const openFileManager = () => {
    isFileManagerOpen.value = true
  }

  const closeFileManager = () => {
    isFileManagerOpen.value = false
  }

  return {
    isFileManagerOpen,
    openFileManager,
    closeFileManager,
  }
}

