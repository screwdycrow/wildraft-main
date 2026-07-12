/**
 * API Configuration
 * Centralized configuration for API endpoints and URLs
 */

/** REST API base (includes /api suffix). Set at build time via VITE_API_URL on Railway. */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
} as const

/**
 * Socket.IO server origin (no /api). Must be the backend's public URL on Railway,
 * e.g. https://your-backend.up.railway.app
 */
export function getSocketBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '')
  }
  return 'http://localhost:3000'
}

export const SOCKET_BASE_URL = getSocketBaseUrl()

/** Shared Socket.IO client options (Railway proxies work more reliably with polling first). */
export const SOCKET_IO_OPTIONS = {
  withCredentials: true,
  transports: ['polling', 'websocket'] as ('polling' | 'websocket')[],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 15,
}

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
    const baseUrl = API_CONFIG.baseURL.replace(/\/api\/?$/, '')
    return `${baseUrl}${file.fileUrl.startsWith('/') ? '' : '/'}${file.fileUrl}`
  }

  return ''
}
