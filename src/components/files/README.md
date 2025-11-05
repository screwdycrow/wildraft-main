# File Manager Component

A global file manager for uploading, managing, and downloading files stored in AWS S3 (or S3-compatible storage like Contabo).

## Features

- ✅ **Global Access**: Open from anywhere using `useFileManager()` composable
- ✅ **Smart Upload**: Automatically chooses best method based on file size
  - Files < 1MB: Direct upload through backend
  - Files > 1MB: Presigned URL for direct S3 upload
- ✅ **File Management**: Upload, download, copy URL, and delete files
- ✅ **Search & Filter**: Find files quickly by name or type
- ✅ **Pagination**: Load more files as needed
- ✅ **Multiple Upload**: Upload multiple files at once
- ✅ **Progress Tracking**: Visual feedback during uploads
- ✅ **Type Icons**: Visual file type indicators

## Usage

### Opening the File Manager

#### From User Menu
Click on your avatar → "My Files"

#### From Code (Anywhere)
```vue
<script setup>
import { useFileManager } from '@/composables/useFileManager'

const { openFileManager } = useFileManager()

// Call this function to open the file manager
function handleOpenFiles() {
  openFileManager()
}
</script>

<template>
  <v-btn @click="openFileManager">
    Open File Manager
  </v-btn>
</template>
```

### Programmatic File Upload

```typescript
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()

// Upload a file
async function uploadFile(file: File) {
  try {
    const uploadedFile = await filesStore.uploadFile(file, 'my-folder')
    console.log('File uploaded:', uploadedFile)
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
```

### Custom File Paths

Files are organized using paths. You can specify custom folders:

```typescript
// Upload to user's uploads folder (default)
await filesStore.uploadFile(file)

// Upload to a specific folder
await filesStore.uploadFile(file, 'avatars')
await filesStore.uploadFile(file, 'documents')
await filesStore.uploadFile(file, 'images')

// Path will be: users/{userId}/{folder}/{timestamp}-{filename}
```

### Getting Download URLs

```typescript
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()

async function downloadFile(fileId: number) {
  const url = await filesStore.getDownloadUrl(fileId)
  window.open(url, '_blank')
}
```

### Deleting Files

```typescript
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()

async function deleteFile(fileId: number) {
  await filesStore.deleteFile(fileId)
}
```

## File Organization

### Recommended Path Patterns

```javascript
// User uploads
users/{userId}/uploads/{timestamp}-{filename}

// User avatars
users/{userId}/avatars/{timestamp}-{filename}

// Library items
libraries/{libraryId}/items/{itemId}/{filename}

// By type
images/{userId}/{timestamp}-{filename}
documents/{userId}/{timestamp}-{filename}
```

## API Reference

### useFileManager()

Composable for controlling the file manager modal.

```typescript
const {
  isFileManagerOpen,  // Reactive boolean
  openFileManager,    // Function to open
  closeFileManager    // Function to close
} = useFileManager()
```

### useFilesStore()

Pinia store for file operations.

```typescript
const filesStore = useFilesStore()

// Properties
filesStore.files        // Array of UserFile objects
filesStore.loading      // Boolean loading state
filesStore.total        // Total number of files

// Methods
filesStore.fetchFiles()                      // Load files list
filesStore.uploadFile(file, folder?)         // Smart upload
filesStore.uploadFilePresigned(file, folder) // Presigned URL upload
filesStore.uploadFileDirect(file, folder)    // Direct upload
filesStore.getDownloadUrl(fileId)            // Get download URL
filesStore.deleteFile(fileId)                // Delete file
filesStore.loadMore()                        // Load more files
filesStore.reset()                           // Reset state
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

### Backend Configuration

The backend needs these environment variables:

```env
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=wildraft
AWS_ENDPOINT=https://eu2.contabostorage.com/
```

## File Size Limits

- **Direct Upload**: Recommended for files < 1MB
- **Presigned URL**: Recommended for files > 1MB
- **Maximum**: Limited by S3 (5TB per object)

The store automatically chooses the best method based on file size.

## Supported File Types

All file types are supported. Visual icons are provided for:
- Images (jpg, png, gif, etc.)
- Videos (mp4, avi, etc.)
- Audio (mp3, wav, etc.)
- Documents (pdf, doc, docx)
- Spreadsheets (xls, xlsx)
- Archives (zip, rar, 7z)
- Text files

## Security

- All endpoints require JWT authentication
- Users can only access their own files
- Presigned URLs expire after 1 hour
- File paths are generated on the frontend for flexibility

## Troubleshooting

### Upload Fails
- Check backend is running
- Verify S3 credentials are correct
- Check CORS configuration on S3
- Ensure file size is within limits

### Download Fails
- Presigned URLs expire after 1 hour
- Request a new URL if expired
- Check S3 bucket permissions

### Files Not Showing
- Click refresh or reload the file manager
- Check network tab for errors
- Verify authentication token is valid

## Examples

### Upload and Link to Library Item

```typescript
import { useFilesStore } from '@/stores/files'

async function uploadAndLink(file: File, libraryId: number, itemId: number) {
  const filesStore = useFilesStore()
  
  // Upload file with custom path
  const uploadedFile = await filesStore.uploadFile(
    file,
    `libraries/${libraryId}/items/${itemId}`
  )
  
  // Now link the file to your library item through your API
  // ...
  
  return uploadedFile
}
```

### Bulk Upload

```typescript
async function uploadMultiple(files: File[]) {
  const filesStore = useFilesStore()
  
  const results = await Promise.all(
    files.map(file => filesStore.uploadFile(file))
  )
  
  console.log(`Uploaded ${results.length} files`)
  return results
}
```

### Copy File URL to Clipboard

```typescript
async function copyUrl(fileId: number) {
  const filesStore = useFilesStore()
  const url = await filesStore.getDownloadUrl(fileId)
  await navigator.clipboard.writeText(url)
}
```

## Future Enhancements

- [ ] Drag and drop upload
- [ ] Image preview thumbnails
- [ ] File preview modal
- [ ] Bulk delete
- [ ] Folder organization
- [ ] File sharing between users
- [ ] Progress bars for large uploads
- [ ] Pause/resume uploads

