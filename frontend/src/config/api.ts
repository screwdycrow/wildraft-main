/**
 * API Configuration
 * Centralized configuration for API endpoints and URLs
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
} as const

/**
 * Gets the download URL from a file object
 * The backend should return downloadUrl as a full URL, so we use it directly
 * Falls back to fileUrl if downloadUrl is not available
 */
export function getFileDownloadUrl(file: { downloadUrl?: string; fileUrl?: string }): string {
  // Backend returns downloadUrl as a full URL, so use it directly
  if (file.downloadUrl) {
    return file.downloadUrl
  }
  
  // Fallback to fileUrl if downloadUrl is not available (for backwards compatibility)
  if (file.fileUrl) {
    // If fileUrl is already absolute, return it
    if (file.fileUrl.startsWith('http://') || file.fileUrl.startsWith('https://')) {
      return file.fileUrl
    }
    // Otherwise, construct from API base URL
    const baseUrl = API_CONFIG.baseURL.replace('/api', '')
    return `${baseUrl}${file.fileUrl.startsWith('/') ? '' : '/'}${file.fileUrl}`
  }
  
  return ''
}

