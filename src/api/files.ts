import apiClient from './axios'

export interface FileUploadUrlRequest {
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
}

export interface FileUploadUrlResponse {
  uploadUrl: string
  filePath: string
}

export interface FileConfirmRequest {
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
}

export interface UserFile {
  id: number
  userId: number
  fileUrl: string
  fileName: string
  fileType: string
  fileSize: number
  downloadUrl: string
  createdAt: string
  updatedAt: string
}

export interface FilesListResponse {
  files: UserFile[]
  total: number
}

// Get presigned URL for upload
export const getUploadUrl = async (data: FileUploadUrlRequest): Promise<FileUploadUrlResponse> => {
  const response = await apiClient.post('/files/upload-url', data)
  return response.data
}

// Confirm file upload
export const confirmUpload = async (data: FileConfirmRequest): Promise<UserFile> => {
  const response = await apiClient.post('/files/confirm-upload', data)
  return response.data
}

// Direct upload (for small files)
export const uploadFile = async (data: {
  fileName: string
  fileType: string
  fileSize: number
  filePath: string
  fileBuffer: string // base64
}): Promise<UserFile> => {
  const response = await apiClient.post('/files/upload', data)
  return response.data
}

// List user files
export const listFiles = async (params: {
  limit?: number
  offset?: number
}): Promise<FilesListResponse> => {
  const response = await apiClient.get('/files', { params })
  return response.data
}

// Get file details
export const getFile = async (fileId: number): Promise<UserFile> => {
  const response = await apiClient.get(`/files/${fileId}`)
  return response.data
}

// Get download URL
export const getDownloadUrl = async (fileId: number): Promise<{ downloadUrl: string }> => {
  const response = await apiClient.get(`/files/${fileId}/download-url`)
  return response.data
}

// Delete file
export const deleteFile = async (fileId: number): Promise<void> => {
  await apiClient.delete(`/files/${fileId}`)
}

// Upload file to S3 using presigned URL
export const uploadToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })
}

// Helper to generate file path
export const generateFilePath = (userId: number, file: File, folder?: string): string => {
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  if (folder) {
    return `users/${userId}/${folder}/${timestamp}-${sanitizedName}`
  }
  
  return `users/${userId}/uploads/${timestamp}-${sanitizedName}`
}

// Helper to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Helper to get file icon based on type
export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return 'mdi-file-image'
  if (fileType.startsWith('video/')) return 'mdi-file-video'
  if (fileType.startsWith('audio/')) return 'mdi-file-music'
  if (fileType.includes('pdf')) return 'mdi-file-pdf-box'
  if (fileType.includes('word') || fileType.includes('document')) return 'mdi-file-word'
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'mdi-file-excel'
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'mdi-file-powerpoint'
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return 'mdi-folder-zip'
  if (fileType.includes('text')) return 'mdi-file-document'
  
  return 'mdi-file'
}

