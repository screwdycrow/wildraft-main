# Files API - Examples

This document provides practical examples for using the Files API from the frontend.

## Table of Contents
- [Setup and Configuration](#setup-and-configuration)
- [Method 1: Presigned URL Upload (Recommended)](#method-1-presigned-url-upload-recommended)
- [Method 2: Direct Upload](#method-2-direct-upload)
- [Downloading Files](#downloading-files)
- [Listing and Managing Files](#listing-and-managing-files)
- [React Examples](#react-examples)
- [Vue Examples](#vue-examples)
- [Error Handling](#error-handling)

---

## Setup and Configuration

### Frontend Configuration

Create a configuration file for S3 settings:

```javascript
// config/s3.config.js
export const S3_CONFIG = {
  bucket: process.env.REACT_APP_S3_BUCKET || 'your-bucket-name',
  region: process.env.REACT_APP_S3_REGION || 'us-east-1',
  baseUrl: process.env.REACT_APP_S3_BASE_URL || 
    'https://your-bucket.s3.us-east-1.amazonaws.com'
};

// Helper to generate file path
export function generateFilePath(userId, file) {
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/uploads/${timestamp}-${sanitizedName}`;
}

// Helper to get full S3 URL from path
export function getFileUrl(filePath) {
  return `${S3_CONFIG.baseUrl}/${filePath}`;
}
```

### API Client Setup

```javascript
// api/files.api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export class FilesAPI {
  constructor(authToken) {
    this.authToken = authToken;
  }

  // Request presigned upload URL
  async getUploadUrl(fileName, fileType, fileSize, filePath) {
    const response = await fetch(`${API_BASE_URL}/api/files/upload-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, fileType, fileSize, filePath })
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    return response.json();
  }

  // Confirm file upload
  async confirmUpload(fileName, fileType, fileSize, filePath) {
    const response = await fetch(`${API_BASE_URL}/api/files/confirm-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, fileType, fileSize, filePath })
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm upload: ${response.statusText}`);
    }

    return response.json();
  }

  // Direct upload with base64
  async uploadDirect(fileName, fileType, fileSize, filePath, fileBuffer) {
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileName, fileType, fileSize, filePath, fileBuffer })
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    return response.json();
  }

  // Get download URL
  async getDownloadUrl(fileId) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download-url`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }

    return response.json();
  }

  // List user files
  async listFiles(limit = 50, offset = 0) {
    const response = await fetch(
      `${API_BASE_URL}/api/files?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete file
  async deleteFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }

    return response.json();
  }
}
```

---

## Method 1: Presigned URL Upload (Recommended)

This method is recommended because it:
- Uploads directly to S3 (no backend bottleneck)
- Better for large files
- Reduces server load
- Faster upload speeds

### Vanilla JavaScript

```javascript
import { FilesAPI } from './api/files.api.js';
import { generateFilePath } from './config/s3.config.js';

async function uploadFileWithPresignedUrl(file, userId, authToken) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    // 1. Generate file path
    const filePath = generateFilePath(userId, file);
    
    // 2. Request presigned URL
    console.log('Requesting presigned URL...');
    const { uploadUrl } = await filesAPI.getUploadUrl(
      file.name,
      file.type,
      file.size,
      filePath
    );
    
    // 3. Upload directly to S3
    console.log('Uploading to S3...');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to S3');
    }
    
    // 4. Confirm upload with backend
    console.log('Confirming upload...');
    const fileRecord = await filesAPI.confirmUpload(
      file.name,
      file.type,
      file.size,
      filePath
    );
    
    console.log('Upload successful!', fileRecord);
    return fileRecord;
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Usage
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const userId = 123; // Get from auth context
    const authToken = 'your-jwt-token'; // Get from auth context
    await uploadFileWithPresignedUrl(file, userId, authToken);
  }
});
```

### With Progress Tracking

```javascript
async function uploadWithProgress(file, userId, authToken, onProgress) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    // 1. Generate file path and get upload URL
    const filePath = generateFilePath(userId, file);
    const { uploadUrl } = await filesAPI.getUploadUrl(
      file.name,
      file.type,
      file.size,
      filePath
    );
    
    // 2. Upload with XMLHttpRequest for progress tracking
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
    
    // 3. Confirm upload
    const fileRecord = await filesAPI.confirmUpload(
      file.name,
      file.type,
      file.size,
      filePath
    );
    
    return fileRecord;
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Usage
uploadWithProgress(file, userId, authToken, (progress) => {
  console.log(`Upload progress: ${progress.toFixed(2)}%`);
  // Update progress bar
  document.getElementById('progress-bar').style.width = `${progress}%`;
});
```

---

## Method 2: Direct Upload

Better for small files or when you need server-side processing.

### Vanilla JavaScript

```javascript
import { FilesAPI } from './api/files.api.js';
import { generateFilePath } from './config/s3.config.js';

// Helper to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove data:*/*;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

async function uploadFileDirect(file, userId, authToken) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    // 1. Convert file to base64
    console.log('Converting file to base64...');
    const fileBuffer = await fileToBase64(file);
    
    // 2. Generate file path
    const filePath = generateFilePath(userId, file);
    
    // 3. Upload to backend
    console.log('Uploading file...');
    const fileRecord = await filesAPI.uploadDirect(
      file.name,
      file.type,
      file.size,
      filePath,
      fileBuffer
    );
    
    console.log('Upload successful!', fileRecord);
    return fileRecord;
    
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}
```

---

## Downloading Files

### Get Download URL and Download

```javascript
async function downloadFile(fileId, authToken) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    // Get presigned download URL
    const { downloadUrl, fileName } = await filesAPI.getDownloadUrl(fileId);
    
    // Download the file
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    
    // Trigger download in browser
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}
```

### Display Image from S3

```javascript
import { getFileUrl } from './config/s3.config.js';

// For public files (direct S3 URL)
function displayPublicImage(filePath) {
  const imageUrl = getFileUrl(filePath);
  const img = document.createElement('img');
  img.src = imageUrl;
  document.body.appendChild(img);
}

// For private files (presigned URL)
async function displayPrivateImage(fileId, authToken) {
  const filesAPI = new FilesAPI(authToken);
  const { downloadUrl } = await filesAPI.getDownloadUrl(fileId);
  
  const img = document.createElement('img');
  img.src = downloadUrl;
  document.body.appendChild(img);
}
```

---

## Listing and Managing Files

### List All User Files

```javascript
async function listUserFiles(authToken) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    const { files, total } = await filesAPI.listFiles(50, 0);
    
    console.log(`Found ${total} files`);
    files.forEach(file => {
      console.log(`- ${file.fileName} (${file.fileSize} bytes)`);
    });
    
    return files;
    
  } catch (error) {
    console.error('Failed to list files:', error);
    throw error;
  }
}
```

### Delete File

```javascript
async function deleteFile(fileId, authToken) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    await filesAPI.deleteFile(fileId);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
}
```

---

## React Examples

### File Upload Component with Presigned URL

```jsx
import React, { useState } from 'react';
import { FilesAPI } from '../api/files.api';
import { generateFilePath } from '../config/s3.config';

function FileUpload({ userId, authToken, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const filesAPI = new FilesAPI(authToken);

    try {
      // 1. Generate file path
      const filePath = generateFilePath(userId, file);

      // 2. Get presigned URL
      const { uploadUrl } = await filesAPI.getUploadUrl(
        file.name,
        file.type,
        file.size,
        filePath
      );

      // 3. Upload to S3 with progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      // 4. Confirm upload
      const fileRecord = await filesAPI.confirmUpload(
        file.name,
        file.type,
        file.size,
        filePath
      );

      setProgress(100);
      onUploadComplete(fileRecord);
      
      // Reset
      setFile(null);
      setUploading(false);

    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {file && (
        <div>
          <p>Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
          <button onClick={uploadFile} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <span>{progress.toFixed(0)}%</span>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default FileUpload;
```

### File List Component

```jsx
import React, { useState, useEffect } from 'react';
import { FilesAPI } from '../api/files.api';

function FileList({ authToken }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    const filesAPI = new FilesAPI(authToken);
    
    try {
      setLoading(true);
      const { files } = await filesAPI.listFiles();
      setFiles(files);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    const filesAPI = new FilesAPI(authToken);
    
    try {
      await filesAPI.deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (err) {
      alert(`Failed to delete file: ${err.message}`);
    }
  };

  const handleDownload = async (fileId) => {
    const filesAPI = new FilesAPI(authToken);
    
    try {
      const { downloadUrl, fileName } = await filesAPI.getDownloadUrl(fileId);
      
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Failed to download file: ${err.message}`);
    }
  };

  if (loading) return <div>Loading files...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="file-list">
      <h2>My Files</h2>
      {files.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Uploaded</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.id}>
                <td>{file.fileName}</td>
                <td>{file.fileType}</td>
                <td>{(file.fileSize / 1024).toFixed(2)} KB</td>
                <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDownload(file.id)}>
                    Download
                  </button>
                  <button onClick={() => handleDelete(file.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default FileList;
```

---

## Vue Examples

### File Upload Component (Vue 3 Composition API)

```vue
<template>
  <div class="file-upload">
    <input
      type="file"
      @change="handleFileChange"
      :disabled="uploading"
    />
    
    <div v-if="file">
      <p>Selected: {{ file.name }} ({{ fileSize }} KB)</p>
      <button @click="uploadFile" :disabled="uploading">
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </div>

    <div v-if="uploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }" />
      <span>{{ progress.toFixed(0) }}%</span>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FilesAPI } from '../api/files.api';
import { generateFilePath } from '../config/s3.config';

const props = defineProps(['userId', 'authToken']);
const emit = defineEmits(['upload-complete']);

const file = ref(null);
const uploading = ref(false);
const progress = ref(0);
const error = ref(null);

const fileSize = computed(() => {
  return file.value ? (file.value.size / 1024).toFixed(2) : 0;
});

const handleFileChange = (e) => {
  file.value = e.target.files[0];
  error.value = null;
};

const uploadFile = async () => {
  if (!file.value) return;

  uploading.value = true;
  progress.value = 0;
  error.value = null;

  const filesAPI = new FilesAPI(props.authToken);

  try {
    const filePath = generateFilePath(props.userId, file.value);

    const { uploadUrl } = await filesAPI.getUploadUrl(
      file.value.name,
      file.value.type,
      file.value.size,
      filePath
    );

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          progress.value = (e.loaded / e.total) * 100;
        }
      });

      xhr.addEventListener('load', () => {
        xhr.status === 200 ? resolve() : reject(new Error('Upload failed'));
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.value.type);
      xhr.send(file.value);
    });

    const fileRecord = await filesAPI.confirmUpload(
      file.value.name,
      file.value.type,
      file.value.size,
      filePath
    );

    progress.value = 100;
    emit('upload-complete', fileRecord);
    
    file.value = null;
    uploading.value = false;

  } catch (err) {
    error.value = err.message;
    uploading.value = false;
  }
};
</script>
```

---

## Error Handling

### Comprehensive Error Handling

```javascript
class FileUploadError extends Error {
  constructor(message, code, originalError) {
    super(message);
    this.name = 'FileUploadError';
    this.code = code;
    this.originalError = originalError;
  }
}

async function uploadFileWithErrorHandling(file, userId, authToken) {
  const filesAPI = new FilesAPI(authToken);
  
  try {
    // Validate file
    if (!file) {
      throw new FileUploadError(
        'No file selected',
        'NO_FILE',
        null
      );
    }

    // Validate file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new FileUploadError(
        `File size exceeds limit (${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
        'FILE_TOO_LARGE',
        null
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new FileUploadError(
        'File type not allowed',
        'INVALID_FILE_TYPE',
        null
      );
    }

    // Generate file path
    const filePath = generateFilePath(userId, file);

    // Get upload URL
    let uploadUrl;
    try {
      const response = await filesAPI.getUploadUrl(
        file.name,
        file.type,
        file.size,
        filePath
      );
      uploadUrl = response.uploadUrl;
    } catch (error) {
      throw new FileUploadError(
        'Failed to get upload URL',
        'GET_URL_FAILED',
        error
      );
    }

    // Upload to S3
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed: ${response.statusText}`);
      }
    } catch (error) {
      throw new FileUploadError(
        'Failed to upload to S3',
        'S3_UPLOAD_FAILED',
        error
      );
    }

    // Confirm upload
    try {
      const fileRecord = await filesAPI.confirmUpload(
        file.name,
        file.type,
        file.size,
        filePath
      );
      return fileRecord;
    } catch (error) {
      throw new FileUploadError(
        'Failed to confirm upload',
        'CONFIRM_FAILED',
        error
      );
    }

  } catch (error) {
    // Log error
    console.error('Upload error:', error);

    // Show user-friendly message
    if (error instanceof FileUploadError) {
      switch (error.code) {
        case 'NO_FILE':
          alert('Please select a file to upload');
          break;
        case 'FILE_TOO_LARGE':
          alert(error.message);
          break;
        case 'INVALID_FILE_TYPE':
          alert('Please select a valid file type (JPEG, PNG, GIF, or PDF)');
          break;
        case 'GET_URL_FAILED':
          alert('Failed to prepare upload. Please try again.');
          break;
        case 'S3_UPLOAD_FAILED':
          alert('Upload failed. Please check your connection and try again.');
          break;
        case 'CONFIRM_FAILED':
          alert('Upload completed but verification failed. Please contact support.');
          break;
        default:
          alert('An unexpected error occurred. Please try again.');
      }
    } else {
      alert('An unexpected error occurred. Please try again.');
    }

    throw error;
  }
}
```

---

## Best Practices

1. **Always validate files on the frontend** before uploading
2. **Use presigned URLs** for better performance and scalability
3. **Implement progress tracking** for better UX
4. **Handle errors gracefully** with user-friendly messages
5. **Clean up object URLs** after use to prevent memory leaks
6. **Sanitize file names** before generating paths
7. **Set appropriate file size limits**
8. **Validate file types** based on your requirements
9. **Use HTTPS** in production
10. **Implement retry logic** for failed uploads

---

## Next Steps

- Link files to library items using the Library Items API
- Implement image preview before upload
- Add drag-and-drop upload interface
- Implement bulk upload functionality
- Add file compression before upload
- Implement thumbnail generation for images

