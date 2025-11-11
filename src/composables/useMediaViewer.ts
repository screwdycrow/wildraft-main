import { ref } from 'vue'
import type { UserFile } from '@/api/files'

const isOpen = ref(false)
const currentFile = ref<UserFile | null>(null)
const fileList = ref<UserFile[]>([])

export function useMediaViewer() {
  const openViewer = (file: UserFile, files: UserFile[] = []) => {
    currentFile.value = file
    fileList.value = files.length > 0 ? files : [file]
    isOpen.value = true
  }

  const closeViewer = () => {
    isOpen.value = false
    currentFile.value = null
    fileList.value = []
  }

  return {
    isOpen,
    currentFile,
    fileList,
    openViewer,
    closeViewer,
  }
}



