import type { UserFile } from '@/types/item.types'
import { getFileDownloadUrl } from '@/config/api'

/**
 * Resolves image URLs in HTML content by replacing data-file-id attributes
 * with actual download URLs from userFiles
 */
export function resolveImageUrlsInHtml(
  html: string,
  userFiles: Array<{ id: number; downloadUrl?: string; fileUrl?: string }>
): string {
  if (!html || !userFiles?.length) return html

  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img[data-file-id]')

  images.forEach(img => {
    const fileId = Number(img.getAttribute('data-file-id'))
    if (fileId) {
      const userFile = userFiles.find(f => f.id === fileId)
      if (userFile) {
        const downloadUrl = getFileDownloadUrl(userFile as UserFile)
        if (downloadUrl) {
          img.setAttribute('src', downloadUrl)
        }
      }
    }
  })

  return doc.body.innerHTML
}

