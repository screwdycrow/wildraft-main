    # File Categories API

File categories allow you to organize user files within a library. Categories are scoped to libraries, meaning each library can have its own set of categories.

## Overview

- **Base Path**: `/api/libraries/:libraryId/file-categories`
- **Authentication**: Required (Bearer token)
- **Permissions**: 
  - VIEWER: Can list and view categories
  - EDITOR/OWNER: Can create, update, and delete categories

## Endpoints

### Create File Category

Create a new file category in a library.

```http
POST /api/libraries/:libraryId/file-categories
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Maps"
}
```

**Response (201):**
```json
{
  "message": "File category created successfully",
  "category": {
    "id": 1,
    "name": "Maps",
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Category name is required
- `401`: Unauthorized
- `403`: Insufficient permissions (requires EDITOR or OWNER)
- `409`: Category with this name already exists in the library

---

### List File Categories

Get all file categories in a library with file counts.

```http
GET /api/libraries/:libraryId/file-categories
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Maps",
      "libraryId": 1,
      "fileCount": 5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Tokens",
      "libraryId": 1,
      "fileCount": 12,
      "createdAt": "2025-01-02T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Access denied (no access to library)

---

### Get Single File Category

Get a specific file category with its associated files.

```http
GET /api/libraries/:libraryId/file-categories/:categoryId
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "category": {
    "id": 1,
    "name": "Maps",
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "userFiles": [
      {
        "id": 10,
        "fileName": "dungeon-map.webp",
        "fileType": "image/webp",
        "fileSize": 245678
      }
    ]
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Access denied
- `404`: Category not found

---

### Update File Category

Update a file category's name.

```http
PUT /api/libraries/:libraryId/file-categories/:categoryId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Battle Maps"
}
```

**Response (200):**
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": 1,
    "name": "Battle Maps",
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Category not found
- `409`: Category with this name already exists

---

### Delete File Category

Delete a file category. Files in this category will have their `categoryId` set to `null`.

```http
DELETE /api/libraries/:libraryId/file-categories/:categoryId
Authorization: Bearer YOUR_TOKEN
```

**Response (204):** No content

**Errors:**
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Category not found

---

## File Category Rules

1. **Uniqueness**: Category names must be unique within a library
2. **Scoping**: Categories are scoped to libraries - each library has its own set of categories
3. **Deletion**: When a category is deleted, files in that category are automatically uncategorized (categoryId set to null)
4. **Permissions**: You must have at least VIEWER access to a library to see its categories, and EDITOR/OWNER access to manage them

---

# Updated User Files API

The User Files API has been updated to support file categories.

## Updated Endpoints

### Upload File (Updated)

You can now specify a `categoryId` when uploading a file.

```http
POST /api/files/upload
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "fileName": "dungeon-map.webp",
  "fileType": "image/webp",
  "fileSize": 245678,
  "filePath": "users/1/files/dungeon-map.webp",
  "fileBuffer": "base64encodeddata...",
  "categoryId": 1  // Optional: ID of the file category
}
```

**Response (201):**
```json
{
  "id": 10,
  "userId": 1,
  "fileUrl": "users/1/files/dungeon-map.webp",
  "fileName": "dungeon-map.webp",
  "fileType": "image/webp",
  "fileSize": 245678,
  "categoryId": 1,  // or null if not categorized
  "downloadUrl": "https://s3...",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### Confirm Upload (Updated)

You can specify a `categoryId` when confirming an upload.

```http
POST /api/files/confirm-upload
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "fileName": "dungeon-map.webp",
  "fileType": "image/webp",
  "fileSize": 245678,
  "filePath": "users/1/files/dungeon-map.webp",
  "categoryId": 1  // Optional
}
```

---

### Update File (New)

Update a file's category. This is a new endpoint.

```http
PUT /api/files/:fileId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "categoryId": 2  // Optional: Set to null to remove from category
}
```

**Response (200):**
```json
{
  "message": "File updated successfully",
  "file": {
    "id": 10,
    "userId": 1,
    "fileUrl": "users/1/files/dungeon-map.webp",
    "fileName": "dungeon-map.webp",
    "fileType": "image/webp",
    "fileSize": 245678,
    "categoryId": 2,
    "downloadUrl": "https://s3...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T12:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Invalid category (category doesn't exist or you don't have access to its library)
- `401`: Unauthorized
- `403`: Forbidden (you don't own this file)
- `404`: File not found

---

### List Files (Updated)

The list files endpoint now includes `categoryId` in the response.

```http
GET /api/files?limit=50&offset=0
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "files": [
    {
      "id": 10,
      "userId": 1,
      "fileUrl": "users/1/files/dungeon-map.webp",
      "fileName": "dungeon-map.webp",
      "fileType": "image/webp",
      "fileSize": 245678,
      "categoryId": 1,  // or null if uncategorized
      "downloadUrl": "https://s3...",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### Get File (Updated)

The get file endpoint now includes `categoryId` in the response.

```http
GET /api/files/:fileId
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "id": 10,
  "userId": 1,
  "fileUrl": "users/1/files/dungeon-map.webp",
  "fileName": "dungeon-map.webp",
  "fileType": "image/webp",
  "fileSize": 245678,
  "categoryId": 1,  // or null if uncategorized
  "downloadUrl": "https://s3...",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

## Category Validation

When setting a `categoryId` on a file:

1. **Category must exist**: The category ID must be valid
2. **Library access required**: You must have at least VIEWER access to the library that owns the category
3. **File ownership**: You can only set categories on files you own
4. **Null values**: Setting `categoryId` to `null` removes the file from any category

---

## Frontend Integration Examples

### Creating a Category and Assigning Files

```typescript
// 1. Create a category
const createCategory = async (libraryId: number, name: string) => {
  const response = await fetch(`/api/libraries/${libraryId}/file-categories`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  return response.json();
};

// 2. Upload a file with category
const uploadFile = async (file: File, categoryId?: number) => {
  // ... upload logic ...
  const response = await fetch('/api/files/confirm-upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: `users/${userId}/files/${file.name}`,
      categoryId, // Optional
    }),
  });
  return response.json();
};

// 3. Update file category
const updateFileCategory = async (fileId: number, categoryId: number | null) => {
  const response = await fetch(`/api/files/${fileId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ categoryId }),
  });
  return response.json();
};
```

### Listing Files by Category

```typescript
// Get all categories for a library
const getCategories = async (libraryId: number) => {
  const response = await fetch(`/api/libraries/${libraryId}/file-categories`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { categories } = await response.json();
  return categories;
};

// Get all files
const getFiles = async () => {
  const response = await fetch('/api/files', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { files } = await response.json();
  return files;
};

// Group files by category
const groupFilesByCategory = (files: File[], categories: Category[]) => {
  const grouped: Record<number | 'uncategorized', File[]> = {
    uncategorized: [],
  };
  
  categories.forEach(cat => {
    grouped[cat.id] = [];
  });
  
  files.forEach(file => {
    if (file.categoryId) {
      grouped[file.categoryId].push(file);
    } else {
      grouped.uncategorized.push(file);
    }
  });
  
  return grouped;
};
```

---

## Summary

- **File Categories** are library-scoped organizational tools for user files
- **Categories** can be created, listed, updated, and deleted by EDITOR/OWNER users
- **Files** can be assigned to categories during upload or via the update endpoint
- **Category validation** ensures you can only assign files to categories in libraries you have access to
- **Deleting a category** automatically uncategorizes all files in that category


