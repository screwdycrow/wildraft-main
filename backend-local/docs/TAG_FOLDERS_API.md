# Tag Folders API

Tag folders allow you to organize tags within a library. Folders are scoped to libraries, meaning each library can have its own set of folders. Tags can be assigned to folders for better organization and display.

## Overview

- **Base Path**: `/api/libraries/:libraryId/tag-folders`
- **Authentication**: Required (Bearer token)
- **Permissions**: 
  - VIEWER: Can list and view folders
  - EDITOR/OWNER: Can create, update, and delete folders

## Tag Folder Properties

- **id** (number): Unique identifier
- **name** (string): Folder name (must be unique within a library)
- **order** (number): Display order for sorting (defaults to 0)
- **libraryId** (number): ID of the library this folder belongs to
- **createdAt** (datetime): Creation timestamp
- **updatedAt** (datetime): Last update timestamp

## Endpoints

### Create Tag Folder

Create a new tag folder in a library.

```http
POST /api/libraries/:libraryId/tag-folders
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Encounters",
  "order": 1
}
```

**Request Body:**
- `name` (required): Folder name (must be unique within the library)
- `order` (optional): Display order (defaults to 0)

**Response (201):**
```json
{
  "message": "Tag folder created successfully",
  "folder": {
    "id": 1,
    "name": "Encounters",
    "order": 1,
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- `400`: Folder name is required
- `401`: Unauthorized
- `403`: Insufficient permissions (requires EDITOR or OWNER)
- `409`: Folder with this name already exists in the library

---

### List Tag Folders

Get all tag folders in a library with tag counts.

```http
GET /api/libraries/:libraryId/tag-folders
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "folders": [
    {
      "id": 1,
      "name": "Encounters",
      "order": 1,
      "libraryId": 1,
      "tagCount": 5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Bestiary",
      "order": 2,
      "libraryId": 1,
      "tagCount": 12,
      "createdAt": "2025-01-02T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

**Note:** Folders are sorted by `order` (ascending), then by `name` (ascending).

**Errors:**
- `401`: Unauthorized
- `403`: Access denied (no access to library)

---

### Get Single Tag Folder

Get a specific tag folder with its associated tags.

```http
GET /api/libraries/:libraryId/tag-folders/:folderId
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "folder": {
    "id": 1,
    "name": "Encounters",
    "order": 1,
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "tags": [
      {
        "id": 1,
        "name": "Combat",
        "color": "#FF0000",
        "order": 0
      },
      {
        "id": 2,
        "name": "Boss Fight",
        "color": "#E74C3C",
        "order": 1
      }
    ]
  }
}
```

**Note:** Tags within the folder are sorted by `order` (ascending), then by `name` (ascending).

**Errors:**
- `401`: Unauthorized
- `403`: Access denied
- `404`: Tag folder not found

---

### Update Tag Folder

Update a tag folder's name or order.

```http
PUT /api/libraries/:libraryId/tag-folders/:folderId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Combat Encounters",
  "order": 2
}
```

**Request Body:** (all fields optional)
- `name`: New folder name
- `order`: New display order

**Response (200):**
```json
{
  "message": "Tag folder updated successfully",
  "folder": {
    "id": 1,
    "name": "Combat Encounters",
    "order": 2,
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-03T12:00:00.000Z"
  }
}
```

**Errors:**
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Tag folder not found
- `409`: Folder with this name already exists

---

### Delete Tag Folder

Delete a tag folder. Tags in this folder will have their `folderId` set to `null`.

```http
DELETE /api/libraries/:libraryId/tag-folders/:folderId
Authorization: Bearer YOUR_TOKEN
```

**Response (204):** No content

**Errors:**
- `401`: Unauthorized
- `403`: Insufficient permissions
- `404`: Tag folder not found

---

## Tag Folder Rules

1. **Uniqueness**: Folder names must be unique within a library
2. **Scoping**: Folders are scoped to libraries - each library has its own set of folders
3. **Deletion**: When a folder is deleted, tags in that folder are automatically unfolderized (folderId set to null)
4. **Permissions**: You must have at least VIEWER access to a library to see its folders, and EDITOR/OWNER access to manage them
5. **Ordering**: Folders are sorted by `order` field (ascending), then by name (ascending)

---

## Integration with Tags

Tags can be assigned to folders when creating or updating them:

### Creating a Tag with a Folder

```http
POST /api/libraries/:libraryId/tags
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Combat",
  "color": "#FF0000",
  "folderId": 1,
  "order": 0
}
```

### Updating a Tag's Folder

```http
PUT /api/libraries/:libraryId/tags/:tagId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "folderId": 2
}
```

### Removing a Tag from a Folder

```http
PUT /api/libraries/:libraryId/tags/:tagId
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "folderId": null
}
```

---

## Complete cURL Examples

### Set Environment Variables
```bash
export TOKEN="your-jwt-token-here"
export BASE_URL="http://localhost:3000/api"
export LIBRARY_ID="1"
```

### 1. Create a Tag Folder
```bash
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tag-folders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Encounters",
    "order": 1
  }'
```

### 2. Create Multiple Folders
```bash
# Encounters folder
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tag-folders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Encounters", "order": 1}'

# Bestiary folder
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tag-folders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Bestiary", "order": 2}'

# Locations folder
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tag-folders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Locations", "order": 3}'
```

### 3. Get All Tag Folders
```bash
curl -X GET $BASE_URL/libraries/$LIBRARY_ID/tag-folders \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Single Tag Folder with Tags
```bash
curl -X GET $BASE_URL/libraries/$LIBRARY_ID/tag-folders/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Folder Name
```bash
curl -X PUT $BASE_URL/libraries/$LIBRARY_ID/tag-folders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Combat Encounters"
  }'
```

### 6. Update Folder Order
```bash
curl -X PUT $BASE_URL/libraries/$LIBRARY_ID/tag-folders/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order": 5
  }'
```

### 7. Delete Tag Folder
```bash
curl -X DELETE $BASE_URL/libraries/$LIBRARY_ID/tag-folders/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
const API_BASE = 'http://localhost:3000/api';
const token = 'your-jwt-token-here';
const libraryId = 1;

// Create a tag folder
async function createTagFolder(name: string, order?: number) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tag-folders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, order: order ?? 0 })
  });
  
  if (response.status === 201) {
    const result = await response.json();
    console.log('Tag folder created:', result.folder);
    return result.folder;
  } else if (response.status === 409) {
    console.error('Folder already exists');
  } else {
    const error = await response.json();
    console.error('Error:', error);
  }
}

// Get all tag folders
async function getAllTagFolders() {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tag-folders`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log('Tag folders:', result.folders);
  return result.folders;
}

// Get tag folder with tags
async function getTagFolderWithTags(folderId: number) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tag-folders/${folderId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log('Folder:', result.folder);
  console.log('Tags in folder:', result.folder.tags);
  return result.folder;
}

// Update tag folder
async function updateTagFolder(folderId: number, updates: { name?: string; order?: number }) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tag-folders/${folderId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  const result = await response.json();
  console.log('Updated folder:', result.folder);
  return result.folder;
}

// Delete tag folder
async function deleteTagFolder(folderId: number) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tag-folders/${folderId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 204) {
    console.log('Tag folder deleted successfully');
    return true;
  }
  return false;
}

// Example usage
(async () => {
  // Create folders
  await createTagFolder('Encounters', 1);
  await createTagFolder('Bestiary', 2);
  
  // Get all folders
  const folders = await getAllTagFolders();
  
  // Update first folder
  if (folders.length > 0) {
    await updateTagFolder(folders[0].id, { name: 'Combat Encounters' });
  }
})();
```

---

## Python Examples

```python
import requests

API_BASE = 'http://localhost:3000/api'
token = 'your-jwt-token-here'
library_id = 1

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Create a tag folder
def create_tag_folder(name, order=0):
    response = requests.post(
        f'{API_BASE}/libraries/{library_id}/tag-folders',
        headers=headers,
        json={'name': name, 'order': order}
    )
    
    if response.status_code == 201:
        folder = response.json()['folder']
        print(f'Tag folder created: {folder["name"]} (order: {folder["order"]})')
        return folder
    elif response.status_code == 409:
        print('Folder already exists')
    else:
        print('Error:', response.json())

# Get all tag folders
def get_all_tag_folders():
    response = requests.get(
        f'{API_BASE}/libraries/{library_id}/tag-folders',
        headers=headers
    )
    
    if response.status_code == 200:
        folders = response.json()['folders']
        print(f'Found {len(folders)} folders:')
        for folder in folders:
            print(f'  - {folder["name"]} (order: {folder["order"]}) - {folder["tagCount"]} tags')
        return folders

# Get tag folder with tags
def get_tag_folder_with_tags(folder_id):
    response = requests.get(
        f'{API_BASE}/libraries/{library_id}/tag-folders/{folder_id}',
        headers=headers
    )
    
    if response.status_code == 200:
        folder = response.json()['folder']
        print(f'Folder: {folder["name"]}')
        print(f'Tags in folder:')
        for tag in folder['tags']:
            print(f'  - {tag["name"]} ({tag["color"]})')
        return folder

# Update tag folder
def update_tag_folder(folder_id, name=None, order=None):
    data = {}
    if name:
        data['name'] = name
    if order is not None:
        data['order'] = order
    
    response = requests.put(
        f'{API_BASE}/libraries/{library_id}/tag-folders/{folder_id}',
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        folder = response.json()['folder']
        print(f'Folder updated: {folder["name"]} (order: {folder["order"]})')
        return folder

# Delete tag folder
def delete_tag_folder(folder_id):
    response = requests.delete(
        f'{API_BASE}/libraries/{library_id}/tag-folders/{folder_id}',
        headers=headers
    )
    
    if response.status_code == 204:
        print('Tag folder deleted successfully')
        return True
    return False

# Example usage
if __name__ == '__main__':
    # Create some folders
    encounters_folder = create_tag_folder('Encounters', 1)
    bestiary_folder = create_tag_folder('Bestiary', 2)
    
    # Get all folders
    all_folders = get_all_tag_folders()
    
    # Update a folder
    if all_folders:
        update_tag_folder(all_folders[0]['id'], order=5)
    
    # Get folder with tags
    if encounters_folder:
        get_tag_folder_with_tags(encounters_folder['id'])
```

---

## Frontend Integration Examples

### Creating Folders and Organizing Tags

```typescript
// 1. Create folders
const createFolders = async (libraryId: number) => {
  const folders = [
    { name: 'Encounters', order: 1 },
    { name: 'Bestiary', order: 2 },
    { name: 'Locations', order: 3 },
  ];
  
  const createdFolders = [];
  for (const folder of folders) {
    const response = await fetch(`/api/libraries/${libraryId}/tag-folders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folder),
    });
    if (response.ok) {
      const result = await response.json();
      createdFolders.push(result.folder);
    }
  }
  return createdFolders;
};

// 2. Create tags and assign to folders
const createTagInFolder = async (libraryId: number, tag: {
  name: string;
  color: string;
  folderId?: number;
  order?: number;
}) => {
  const response = await fetch(`/api/libraries/${libraryId}/tags`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tag),
  });
  return response.json();
};

// 3. Get folders with tags organized
const getOrganizedTags = async (libraryId: number) => {
  // Get all folders
  const foldersResponse = await fetch(`/api/libraries/${libraryId}/tag-folders`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { folders } = await foldersResponse.json();
  
  // Get all tags
  const tagsResponse = await fetch(`/api/libraries/${libraryId}/tags`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const { tags } = await tagsResponse.json();
  
  // Organize tags by folder
  const organized: Record<number | 'uncategorized', typeof tags> = {
    uncategorized: [],
  };
  
  folders.forEach((folder: any) => {
    organized[folder.id] = [];
  });
  
  tags.forEach((tag: any) => {
    if (tag.folderId) {
      organized[tag.folderId].push(tag);
    } else {
      organized.uncategorized.push(tag);
    }
  });
  
  return { folders, organized };
};
```

---

## Best Practices

1. **Plan Folder Structure**: Create folders before creating tags for better organization
2. **Use Order Field**: Set meaningful order values to control display order
3. **Consistent Naming**: Use clear, consistent names for folders
4. **Limit Folders**: Don't create too many folders - aim for 5-10 meaningful categories
5. **Review Regularly**: Periodically review and reorganize folders as your library grows

---

## Summary

- **Tag Folders** are library-scoped organizational tools for tags
- **Folders** can be created, listed, updated, and deleted by EDITOR/OWNER users
- **Tags** can be assigned to folders via the `folderId` field
- **Folder validation** ensures you can only assign tags to folders in libraries you have access to
- **Deleting a folder** automatically unfolderizes all tags in that folder
- **Ordering** is controlled by the `order` field for both folders and tags

