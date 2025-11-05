import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserFile } from '@/api/files'
import * as filesApi from '@/api/files'
import { useAuthStore } from './auth'

export const useFilesStore = defineStore('files', () => {
  const files = ref<UserFile[]>([])
  const loading = ref(false)
  const total = ref(0)
  const limit = ref(50)
  const offset = ref(0)

  // Fetch files list
  const fetchFiles = async () => {
    loading.value = true
    try {
      const response = await filesApi.listFiles({
        limit: limit.value,
        offset: offset.value,
      })
      files.value = response.files
      total.value = response.total
    } catch (error) {
      console.error('Failed to fetch files:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Upload file using presigned URL (recommended for files > 1MB)
  const uploadFilePresigned = async (
    file: File,
    folder?: string,
    onProgress?: (progress: number) => void
  ): Promise<UserFile> => {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('User not authenticated')

    const filePath = filesApi.generateFilePath(authStore.user.id, file, folder)

    // Get presigned URL
    const { uploadUrl } = await filesApi.getUploadUrl({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath,
    })

    // Upload to S3
    await filesApi.uploadToS3(uploadUrl, file)

    // Confirm upload and create database record
    const userFile = await filesApi.confirmUpload({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath,
    })

    // Add to local list
    files.value.unshift(userFile)
    total.value++

    return userFile
  }

  // Direct upload (for small files < 1MB)
  const uploadFileDirect = async (
    file: File,
    folder?: string
  ): Promise<UserFile> => {
    const authStore = useAuthStore()
    if (!authStore.user) throw new Error('User not authenticated')

    const filePath = filesApi.generateFilePath(authStore.user.id, file, folder)

    // Read file as base64
    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    // Upload through backend
    const userFile = await filesApi.uploadFile({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath,
      fileBuffer: base64Content,
    })

    // Add to local list
    files.value.unshift(userFile)
    total.value++

    return userFile
  }

  // Smart upload - chooses method based on file size
  const uploadFile = async (
    file: File,
    folder?: string,
    onProgress?: (progress: number) => void
  ): Promise<UserFile> => {
    const ONE_MB = 1024 * 1024

    if (file.size > ONE_MB) {
      return uploadFilePresigned(file, folder, onProgress)
    } else {
      return uploadFileDirect(file, folder)
    }
  }

  // Get download URL for a file
  const getDownloadUrl = async (fileId: number): Promise<string> => {
    const response = await filesApi.getDownloadUrl(fileId)
    return response.downloadUrl
  }

  // Delete file
  const deleteFile = async (fileId: number) => {
    await filesApi.deleteFile(fileId)
    
    // Remove from local list
    const index = files.value.findIndex(f => f.id === fileId)
    if (index !== -1) {
      files.value.splice(index, 1)
      total.value--
    }
  }

  // Load more files (pagination)
  const loadMore = async () => {
    if (files.value.length >= total.value) return

    offset.value += limit.value
    loading.value = true

    try {
      const response = await filesApi.listFiles({
        limit: limit.value,
        offset: offset.value,
      })
      files.value.push(...response.files)
    } catch (error) {
      console.error('Failed to load more files:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Reset pagination
  const reset = () => {
    files.value = []
    offset.value = 0
    total.value = 0
  }

  return {
    files,
    loading,
    total,
    limit,
    offset,
    fetchFiles,
    uploadFile,
    uploadFilePresigned,
    uploadFileDirect,
    getDownloadUrl,
    deleteFile,
    loadMore,
    reset,
  }
})

