# Media Management System Documentation

## 🎉 Overview

A comprehensive media management system with drag & drop upload, grid/list view, and file-type specific viewers including zoom, video playback, and PDF viewing capabilities.

## 📁 Architecture

### Core Components

#### 1. **`useMediaAssets` Composable** (`src/composables/useMediaAssets.ts`)
Provides reactive state management for media grids:
- File selection (single/multi)
- View mode (grid/list) toggle
- Sorting (name, date, size, type)
- Filtering by file type
- Search functionality
- File categorization helpers

**Usage:**
```typescript
import { useMediaAssets } from '@/composables/useMediaAssets'

const {
  filteredFiles,
  viewMode,
  sortBy,
  searchQuery,
  isSelected,
  toggleSelect,
  handleDelete,
  isImage,
  isPdf,
  // ... more utilities
} = useMediaAssets(files, {
  selectable: true,
  multiSelect: true,
  deletable: true,
  onDelete: async (file) => { /* ... */ },
  onSelect: (file) => { /* ... */ }
})
```

#### 2. **`MediaCard` Component** (`src/components/files/MediaCard.vue`)
Individual file card with:
- Image thumbnails (auto-loaded)
- File type icons (video, audio, PDF, documents)
- Selection checkbox (optional)
- Delete button (optional)
- Hover animations
- File size display

**Props:**
```typescript
{
  file: UserFile
  selected?: boolean
  selectable?: boolean
  deletable?: boolean
}
```

**Events:**
- `@click` - File clicked
- `@toggle-select` - Selection toggled
- `@delete` - Delete requested

#### 3. **`MediaGrid` Component** (`src/components/files/MediaGrid.vue`)
Responsive grid/list layout:
- Auto-responsive grid (180px min columns)
- List view with detailed info
- Empty state handling
- Mobile optimized

**Props:**
```typescript
{
  files: UserFile[]
  viewMode?: 'grid' | 'list'
  selectable?: boolean
  deletable?: boolean
  selectedFiles?: Set<number>
}
```

#### 4. **`MediaViewer` Modal** (`src/components/files/MediaViewer.vue`)
Fullscreen file viewer with:
- Type-aware viewer switching
- Keyboard navigation (← → arrows)
- Delete from viewer (Delete key)
- Loading states
- Multi-file navigation
- ESC to close

**Props:**
```typescript
{
  file?: UserFile | null
  files?: UserFile[]  // For navigation
  onDelete?: (file: UserFile) => void | Promise<void>
}
```

**Keyboard Shortcuts:**
- `Escape` - Close viewer
- `← Left Arrow` - Previous file
- `→ Right Arrow` - Next file
- `Delete` - Delete current file

### Type-Specific Viewers

#### 5. **`ImageViewer`** (`src/components/files/viewers/ImageViewer.vue`)
Advanced image viewing:
- **Zoom:** Mouse wheel or +/- buttons (0.5x to 5x)
- **Pan:** Click and drag when zoomed
- **Rotate:** 90° increments
- **Fit to screen:** Reset button
- **Download:** Direct download button

**Keyboard Shortcuts:**
- `+` / `=` - Zoom in
- `-` - Zoom out
- `0` - Reset zoom
- `r` - Rotate 90°

#### 6. **`VideoViewer`** (`src/components/files/viewers/VideoViewer.vue`)
HTML5 video player:
- Native video controls
- Skip forward/backward (10s)
- Play/Pause toggle
- Mute toggle
- Fullscreen support
- Duration display

**Keyboard Shortcuts:**
- `Space` - Play/Pause
- `← Left Arrow` - Skip backward 10s
- `→ Right Arrow` - Skip forward 10s
- `m` - Toggle mute
- `f` - Toggle fullscreen

#### 7. **`PdfViewer`** (`src/components/files/viewers/PdfViewer.vue`)
Embedded PDF display:
- Browser native PDF viewer (iframe)
- Download button
- Open in new tab

#### 8. **`GenericViewer`** (`src/components/files/viewers/GenericViewer.vue`)
Fallback for unsupported types:
- File type icon
- File info display
- Download button
- Open in new tab button

### Main File Manager

#### 9. **`FileManager`** (`src/components/files/FileManager.vue`)
Complete file management interface:

**Features:**
- ✅ **Drag & Drop Upload** - Drop files anywhere in the upload zone
- ✅ **Click to Upload** - Traditional file picker
- ✅ **Grid/List Toggle** - Switch views with toolbar buttons
- ✅ **Search & Filter** - Real-time search and type filtering
- ✅ **File Preview** - Click any file to open in MediaViewer
- ✅ **Delete with Confirmation** - Safe file deletion
- ✅ **Progress Tracking** - Upload progress per file
- ✅ **Load More** - Pagination support

**Upload Methods:**
- Files < 1MB: Direct upload (base64 to backend)
- Files > 1MB: Presigned URL (direct to S3)

## 🚀 How to Use

### Opening the File Manager

**From anywhere in the app:**
```vue
<script setup>
import { useFileManager } from '@/composables/useFileManager'
const { openFileManager } = useFileManager()
</script>

<template>
  <v-btn @click="openFileManager">Open Files</v-btn>
</template>
```

**Or from User Menu:**
1. Click your avatar
2. Click "My Files"

### Uploading Files

**Method 1: Drag & Drop**
1. Open File Manager
2. Drag files from your file explorer
3. Drop them in the upload zone

**Method 2: Click to Upload**
1. Open File Manager
2. Click the upload zone
3. Select files from the picker

### Viewing Files

**Grid View:**
- Click grid icon in toolbar
- Click any file card to open in fullscreen viewer
- Hover to see delete button

**List View:**
- Click list icon in toolbar
- Shows detailed file information
- Click file row to open in viewer

### Managing Files

**Search:**
- Type in search box to filter by filename

**Filter by Type:**
- Use dropdown to filter (Images, Documents, Videos, etc.)

**Delete:**
- Method 1: Click delete button on card/row
- Method 2: Open file in viewer, press Delete key or click delete button
- Confirm deletion in dialog

### Viewing Different File Types

**Images:**
- Scroll to zoom
- Drag to pan (when zoomed)
- Use zoom controls at bottom
- Click rotate to rotate 90°

**Videos:**
- Use HTML5 video controls
- Skip buttons for 10s jumps
- Fullscreen available
- Volume control

**PDFs:**
- Scroll to navigate pages
- Use browser's native PDF controls
- Download or open in new tab

**Other Files:**
- View file information
- Download directly
- Open in new tab

## 🎨 Styling

### Custom CSS Classes

**MediaCard Animations:**
```css
.media-card:hover {
  transform: translateY(-4px);
}
```

**Upload Zone States:**
```css
.upload-zone--active {
  border-color: primary;
  background: rgba(primary, 0.1);
  transform: scale(1.02);
}
```

### Responsive Design
- Grid: 180px minimum column width
- Mobile: 140px minimum column width
- Auto-adjusts to screen size

## 🔌 Integration

### Required Stores
```typescript
import { useFilesStore } from '@/stores/files'

const filesStore = useFilesStore()

// Available methods:
await filesStore.fetchFiles()
await filesStore.uploadFile(file)
await filesStore.deleteFile(fileId)
await filesStore.getDownloadUrl(fileId)
filesStore.loadMore()
```

### Required API
```typescript
import * as filesApi from '@/api/files'

// Endpoints:
filesApi.getUploadUrl(data)      // Get presigned URL
filesApi.uploadToS3(url, file)   // Upload to S3
filesApi.confirmUpload(data)     // Confirm upload
filesApi.uploadFile(data)        // Direct upload
filesApi.listFiles(params)       // List user files
filesApi.getFile(id)             // Get file details
filesApi.getDownloadUrl(id)      // Get download URL
filesApi.deleteFile(id)          // Delete file
```

## 📊 File Types Support

| Type | Viewer | Features |
|------|--------|----------|
| **Images** | ImageViewer | Zoom, Pan, Rotate, Fit to screen |
| **Videos** | VideoViewer | Play, Pause, Skip, Fullscreen, Volume |
| **Audio** | GenericViewer | Download, Open |
| **PDFs** | PdfViewer | Embedded viewer, Download, Open |
| **Documents** | GenericViewer | Download, Open |
| **Others** | GenericViewer | Download, Open |

## 🎯 Best Practices

1. **Always handle loading states** - Files can take time to load URLs
2. **Use thumbnails for images** - MediaCard auto-loads them
3. **Provide delete confirmation** - FileManager includes this
4. **Show upload progress** - Built into FileManager
5. **Handle errors gracefully** - Toast notifications included

## 🐛 Troubleshooting

**Images not loading?**
- Check `getDownloadUrl()` returns valid URLs
- Ensure CORS is configured on S3
- Check file permissions

**Upload failing?**
- Files < 1MB use direct upload (needs fileBuffer)
- Files > 1MB use presigned URL (needs valid S3 config)
- Check backend file upload endpoint

**Viewer not opening?**
- Ensure v-model is properly bound
- Check that file prop is passed
- Verify file has valid ID

## 🔄 Update Guide

### Adding New File Type Support

1. **Add type check in `useMediaAssets.ts`:**
```typescript
const isNewType = (file: UserFile) => file.fileType.includes('newtype')
```

2. **Add icon in `getFileIcon()` in `files.ts`:**
```typescript
if (fileType.includes('newtype')) return 'mdi-new-icon'
```

3. **Create viewer in `src/components/files/viewers/`:**
```vue
<template>
  <div class="new-type-viewer">
    <!-- Your viewer implementation -->
  </div>
</template>
```

4. **Add to MediaViewer.vue:**
```vue
<new-type-viewer
  v-else-if="isNewType && currentFile"
  :url="fileUrl"
  :file-name="currentFile.fileName"
/>
```

## 📝 Component Hierarchy

```
FileManager (Modal)
├── Upload Zone (Drag & Drop)
├── Search & Filters
└── MediaGrid
    ├── MediaCard (x N files)
    │   ├── Thumbnail/Icon
    │   ├── Checkbox (optional)
    │   └── Delete Button (optional)
    └── MediaViewer (Modal)
        ├── ImageViewer
        ├── VideoViewer
        ├── PdfViewer
        └── GenericViewer
```

## ✅ Features Checklist

- [x] Drag & drop upload
- [x] Multi-file upload
- [x] Upload progress tracking
- [x] Grid view
- [x] List view
- [x] Search functionality
- [x] Type filtering
- [x] Image viewer with zoom/pan/rotate
- [x] Video player with controls
- [x] PDF embedded viewer
- [x] Keyboard navigation
- [x] Delete confirmation
- [x] Responsive design
- [x] Loading states
- [x] Error handling
- [x] Pagination (load more)

## 🎊 That's It!

You now have a fully functional, production-ready media management system with:
- Beautiful UI
- Drag & drop
- Multiple view modes
- Type-specific viewers
- Keyboard shortcuts
- Responsive design
- Error handling

Enjoy! 🚀



