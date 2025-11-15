import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UserFile } from '@/api/files'
import * as filesApi from '@/api/files'
import { useAuthStore } from './auth'

export interface CachedDownloadUrl {
  fileId: number
  downloadUrl: string
  expiresAt: Date
}

export const useFilesStore = defineStore('files', () => {
  const files = ref<UserFile[]>([])
  const cachedDownloadUrls = ref<Record<number, CachedDownloadUrl>>({})
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

  // Get download URL for a file with retry on 401
  const getDownloadUrl = async (fileId: number, retryCount = 0): Promise<string> => {
    const maxRetries = 1
    
    // Check cache first
    if (hasCachedDownloadUrl(fileId)) {
      console.log('[Files Store] Using cached download URL for file', fileId)
      return cachedDownloadUrls.value[fileId].downloadUrl
    }
    
    try {
      const response = await filesApi.getDownloadUrl(fileId)
      cacheDownloadUrl(fileId, response.downloadUrl)
      return response.downloadUrl
    } catch (error: any) {
      // If 401 and haven't retried yet, refresh token and try again
      if (error.response?.status === 401 && retryCount < maxRetries) {
        console.log('[Files Store] Got 401 for file download, refreshing token and retrying...')
        
        const authStore = useAuthStore()
        const refreshed = await authStore.refreshToken()
        
        if (refreshed) {
          // Invalidate cache and retry
          invalidateAllUrls()
          return getDownloadUrl(fileId, retryCount + 1)
        }
      }
      
      throw error
    }
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
  
  const hasCachedDownloadUrl = (fileId: number): boolean => {
    return cachedDownloadUrls.value[fileId] && cachedDownloadUrls.value[fileId].expiresAt > new Date()
  }

  const cacheDownloadUrl = (fileId: number, downloadUrl: string, force: boolean = false) => {
    if (hasCachedDownloadUrl(fileId) && !force) {
      return
    } else {  
      cachedDownloadUrls.value[fileId] = {
        fileId,
        downloadUrl,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8), // 8 hours expiration
      }
    }
  }

  // Add or update files in the store (used when receiving files from item responses)
  const addFiles = (newFiles: UserFile | UserFile[]) => {
    const filesToAdd = Array.isArray(newFiles) ? newFiles : [newFiles]
    
    filesToAdd.forEach(newFile => {
      const existingIndex = files.value.findIndex(f => f.id === newFile.id)
      if (existingIndex !== -1) {
        // Update existing file
        files.value[existingIndex] = newFile
      } else {
        // Add new file
        files.value.push(newFile)
      }
    })
  }
  
  // Invalidate all cached download URLs (call when token refreshes)
  const invalidateAllUrls = () => {
    console.log('[Files Store] Invalidating all cached download URLs due to token refresh')
    cachedDownloadUrls.value = {}
  }
  
  // Watch for token changes and invalidate URLs
  const authStore = useAuthStore()
  watch(() => authStore.accessToken, (newToken, oldToken) => {
    if (newToken && oldToken && newToken !== oldToken) {
      console.log('[Files Store] Token changed, invalidating cached URLs')
      invalidateAllUrls()
    }
  })

  return {
    files,
    cachedDownloadUrls,
    hasCachedDownloadUrl,
    cacheDownloadUrl,
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
    addFiles,
    invalidateAllUrls,
  }
})

