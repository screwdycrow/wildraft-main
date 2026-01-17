# Files API

This document describes the file upload and management endpoints.

## Overview

The Files API provides functionality for uploading, managing, and accessing user files stored in AWS S3. Files are associated with users and can be linked to library items.

## Authentication

All endpoints require authentication via JWT Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## File Path Generation

**Important**: The file path (`filePath`) is generated on the **frontend** based on your application's requirements. The backend stores this path in the database, allowing the frontend to reconstruct the full S3 URL using its configuration.

Example file path structure:
- `users/{userId}/profile/{filename}`
- `libraries/{libraryId}/items/{itemId}/{filename}`
- `uploads/{year}/{month}/{day}/{uuid}-{filename}`

## Upload Methods

### Method 1: Presigned URL Upload (Recommended)

This is the preferred method as it allows direct upload to S3 from the frontend, reducing server load and improving performance.

**Flow:**
1. Frontend generates the desired file path
2. Frontend requests a presigned URL from the backend
3. Frontend uploads the file directly to S3 using the presigned URL
4. Frontend confirms the upload with the backend
5. Backend creates a database record

### Method 2: Direct Upload

Uploads the file through the backend. Suitable for smaller files or when you need server-side processing.

**Flow:**
1. Frontend generates the desired file path
2. Frontend encodes the file as base64
3. Frontend sends the file content to the backend
4. Backend uploads to S3 and creates a database record

---

## Endpoints

### 1. Get Presigned Upload URL

Request a presigned URL for uploading a file directly to S3.

**Endpoint:** `POST /api/files/upload-url`

**Request Body:**
```json
{
  "fileName": "profile-picture.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "filePath": "users/123/profile/profile-picture.jpg"
}
```

**Response:** `200 OK`
```json
{
  "uploadUrl": "https://your-bucket.s3.amazonaws.com/users/123/profile/profile-picture.jpg?X-Amz-Algorithm=...",
  "filePath": "users/123/profile/profile-picture.jpg",
  "expiresIn": 3600
}
```

**Usage:**
```javascript
// 1. Request presigned URL
const response = await fetch('/api/files/upload-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    filePath: `users/${userId}/uploads/${Date.now()}-${file.name}`
  })
});

const { uploadUrl, filePath } = await response.json();

// 2. Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});

// 3. Confirm upload with backend
await fetch('/api/files/confirm-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    filePath: filePath
  })
});
```

---

### 2. Confirm Upload

Confirm that a file has been uploaded to S3 and create a database record.

**Endpoint:** `POST /api/files/confirm-upload`

**Request Body:**
```json
{
  "fileName": "profile-picture.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "filePath": "users/123/profile/profile-picture.jpg"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "userId": 123,
  "fileUrl": "users/123/profile/profile-picture.jpg",
  "fileName": "profile-picture.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "createdAt": "2024-10-29T12:00:00.000Z",
  "updatedAt": "2024-10-29T12:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - File does not exist in S3
- `401 Unauthorized` - Invalid or missing token

---

### 3. Direct Upload

Upload a file directly through the backend (with base64 encoded content).

**Endpoint:** `POST /api/files/upload`

**Request Body:**
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 2048000,
  "filePath": "users/123/documents/document.pdf",
  "fileBuffer": "base64-encoded-file-content..."
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "userId": 123,
  "fileUrl": "users/123/documents/document.pdf",
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 2048000,
  "createdAt": "2024-10-29T12:00:00.000Z",
  "updatedAt": "2024-10-29T12:00:00.000Z"
}
```

**Usage:**
```javascript
// Convert file to base64
const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = error => reject(error);
});

const fileBuffer = await toBase64(file);

await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    filePath: `users/${userId}/uploads/${Date.now()}-${file.name}`,
    fileBuffer: fileBuffer
  })
});
```

---

### 4. List User Files

Get a paginated list of files for the authenticated user.

**Endpoint:** `GET /api/files`

**Query Parameters:**
- `limit` (optional): Number of files to return (1-100, default: 50)
- `offset` (optional): Number of files to skip (default: 0)

**Response:** `200 OK`
```json
{
  "files": [
    {
      "id": 1,
      "userId": 123,
      "fileUrl": "users/123/profile/profile-picture.jpg",
      "fileName": "profile-picture.jpg",
      "fileType": "image/jpeg",
      "fileSize": 1024000,
      "createdAt": "2024-10-29T12:00:00.000Z",
      "updatedAt": "2024-10-29T12:00:00.000Z"
    },
    {
      "id": 2,
      "userId": 123,
      "fileUrl": "users/123/documents/document.pdf",
      "fileName": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 2048000,
      "createdAt": "2024-10-29T11:00:00.000Z",
      "updatedAt": "2024-10-29T11:00:00.000Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### 5. Get File Details

Get details about a specific file.

**Endpoint:** `GET /api/files/:fileId`

**Response:** `200 OK`
```json
{
  "id": 1,
  "userId": 123,
  "fileUrl": "users/123/profile/profile-picture.jpg",
  "fileName": "profile-picture.jpg",
  "fileType": "image/jpeg",
  "fileSize": 1024000,
  "createdAt": "2024-10-29T12:00:00.000Z",
  "updatedAt": "2024-10-29T12:00:00.000Z"
}
```

**Error Responses:**
- `403 Forbidden` - User doesn't own the file
- `404 Not Found` - File doesn't exist

---

### 6. Get Download URL

Get a presigned URL for downloading a file from S3.

**Endpoint:** `GET /api/files/:fileId/download-url`

**Response:** `200 OK`
```json
{
  "downloadUrl": "https://your-bucket.s3.amazonaws.com/users/123/profile/profile-picture.jpg?X-Amz-Algorithm=...",
  "fileName": "profile-picture.jpg",
  "expiresIn": 3600
}
```

**Usage:**
```javascript
const response = await fetch(`/api/files/${fileId}/download-url`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { downloadUrl, fileName } = await response.json();

// Download the file
const fileResponse = await fetch(downloadUrl);
const blob = await fileResponse.blob();

// Trigger download in browser
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
```

**Error Responses:**
- `403 Forbidden` - User doesn't own the file
- `404 Not Found` - File doesn't exist

---

### 7. Delete File

Delete a file from both S3 and the database.

**Endpoint:** `DELETE /api/files/:fileId`

**Response:** `200 OK`
```json
{
  "message": "File deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden` - User doesn't own the file
- `404 Not Found` - File doesn't exist

---

## File Path Patterns

Here are some recommended patterns for organizing files:

### User Profile Files
```
users/{userId}/profile/{filename}
users/{userId}/avatar/{filename}
```

### Library Item Files
```
libraries/{libraryId}/items/{itemId}/{filename}
libraries/{libraryId}/items/{itemId}/images/{filename}
libraries/{libraryId}/items/{itemId}/attachments/{filename}
```

### Campaign Files
```
libraries/{libraryId}/campaigns/{campaignId}/{filename}
libraries/{libraryId}/campaigns/{campaignId}/maps/{filename}
```

### Date-based Organization
```
uploads/{year}/{month}/{day}/{uuid}-{filename}
uploads/2024/10/29/550e8400-e29b-41d4-a716-446655440000-character-sheet.pdf
```

### Type-based Organization
```
images/{userId}/{timestamp}-{filename}
documents/{userId}/{timestamp}-{filename}
audio/{userId}/{timestamp}-{filename}
```

---

## Security Considerations

1. **File Size Limits**: Consider implementing file size limits on the frontend
2. **File Type Validation**: Validate file types on both frontend and backend
3. **Path Sanitization**: Ensure file paths don't contain malicious content
4. **Access Control**: Users can only access their own files
5. **Presigned URL Expiration**: URLs expire after 1 hour by default
6. **S3 Bucket Permissions**: Configure appropriate bucket policies

---

## Linking Files to Library Items

Files can be linked to library items through the `LibraryItem` → `UserFile` relation in the database. This is handled separately through the Library Items API.

See [LIBRARY_ITEMS_API.md](./LIBRARY_ITEMS_API.md) for more information on managing library items and their file associations.

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Frontend Configuration

The frontend should maintain its own S3 configuration for reconstructing URLs:

```javascript
// Frontend config
const S3_CONFIG = {
  bucket: 'your-bucket-name',
  region: 'us-east-1',
  baseUrl: 'https://your-bucket.s3.us-east-1.amazonaws.com'
};

// Reconstruct full URL from stored path
function getFileUrl(filePath) {
  return `${S3_CONFIG.baseUrl}/${filePath}`;
}

// Example usage
const fileUrl = getFileUrl('users/123/profile/avatar.jpg');
// Returns: https://your-bucket.s3.us-east-1.amazonaws.com/users/123/profile/avatar.jpg
```

For public files, you can use the direct S3 URL. For private files, always use the `/download-url` endpoint to get a presigned URL.

