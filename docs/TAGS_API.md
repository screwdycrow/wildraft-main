# Tags API Documentation

## Overview

Tags are used to organize and categorize library items. Each tag belongs to a specific library and can be applied to multiple items. Tags have names and colors for easy visual identification.

## Tag Properties

- **id** (number): Unique identifier
- **name** (string): Tag name (must be unique within a library)
- **color** (string): Hex color code (e.g., "#FF0000")
- **folder** (string | null): Optional folder/category label used for grouping in the UI
- **libraryId** (number): ID of the library this tag belongs to
- **createdAt** (datetime): Creation timestamp
- **updatedAt** (datetime): Last update timestamp

## API Endpoints

### Create Tag
**POST** `/api/libraries/:libraryId/tags`

Create a new tag in a library.

**Authentication:** Required (Bearer Token)
**Permission:** EDITOR or OWNER access

**Request Body:**
```json
{
  "name": "Combat",
  "color": "#FF0000",
  "folder": "Encounters"
}
```

**Response (201):**
```json
{
  "message": "Tag created successfully",
  "tag": {
    "id": 1,
    "name": "Combat",
    "color": "#FF0000",
    "folder": "Encounters",
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**
- **400**: Invalid request (missing name, invalid color format)
- **401**: Unauthorized
- **403**: Insufficient permissions
- **409**: Tag name already exists in this library
- **500**: Server error

---

### Get All Tags
**GET** `/api/libraries/:libraryId/tags`

Get all tags in a library with item counts.

**Authentication:** Required (Bearer Token)
**Permission:** VIEWER, EDITOR, or OWNER access

**Response (200):**
```json
{
  "tags": [
    {
      "id": 1,
      "name": "Combat",
      "color": "#FF0000",
      "folder": "Encounters",
      "libraryId": 1,
      "itemCount": 5,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Monster",
      "color": "#00FF00",
      "folder": "Bestiary",
      "libraryId": 1,
      "itemCount": 3,
      "createdAt": "2025-01-02T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z"
    }
  ]
}
```

---

### Get Single Tag
**GET** `/api/libraries/:libraryId/tags/:tagId`

Get a specific tag with its associated items.

**Authentication:** Required (Bearer Token)
**Permission:** VIEWER, EDITOR, or OWNER access

**Response (200):**
```json
{
  "tag": {
    "id": 1,
    "name": "Combat",
    "color": "#FF0000",
    "folder": "Encounters",
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "libraryItems": [
      {
        "id": 5,
        "name": "Goblin Warrior",
        "type": "STAT_BLOCK_DND_5E",
        "description": "A basic goblin warrior"
      },
      {
        "id": 7,
        "name": "Ancient Red Dragon",
        "type": "STAT_BLOCK_DND_5E",
        "description": "A terrifying dragon"
      }
    ]
  }
}
```

---

### Update Tag
**PUT** `/api/libraries/:libraryId/tags/:tagId`

Update a tag's name or color.

**Authentication:** Required (Bearer Token)
**Permission:** EDITOR or OWNER access

**Request Body:** (all fields optional)
```json
{
  "name": "Combat Encounter",
  "color": "#3498DB",
  "folder": "Encounters"
}
```

**Response (200):**
```json
{
  "message": "Tag updated successfully",
  "tag": {
    "id": 1,
    "name": "Combat Encounter",
    "color": "#3498DB",
    "folder": "Encounters",
    "libraryId": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-03T12:00:00.000Z"
  }
}
```

**Errors:**
- **400**: Invalid request
- **401**: Unauthorized
- **403**: Insufficient permissions
- **404**: Tag not found
- **409**: Tag name already exists
- **500**: Server error

---

### Delete Tag
**DELETE** `/api/libraries/:libraryId/tags/:tagId`

Delete a tag. This removes the tag from all associated items.

**Authentication:** Required (Bearer Token)
**Permission:** EDITOR or OWNER access

**Response:** 204 No Content

**Errors:**
- **401**: Unauthorized
- **403**: Insufficient permissions
- **404**: Tag not found
- **500**: Server error

---

## Complete cURL Examples

### Set Environment Variables
```bash
export TOKEN="your-jwt-token-here"
export BASE_URL="http://localhost:3000/api"
export LIBRARY_ID="1"
```

### 1. Create a Combat Tag
```bash
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Combat",
    "color": "#E74C3C"
  }'
```

### 2. Create Multiple Tags
```bash
# Monster tag
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Monster", "color": "#27AE60"}'

# NPC tag
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "NPC", "color": "#3498DB"}'

# Magic Item tag
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Magic Item", "color": "#9B59B6"}'

# Session Notes tag
curl -X POST $BASE_URL/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Session Notes", "color": "#F39C12"}'
```

### 3. Get All Tags
```bash
curl -X GET $BASE_URL/libraries/$LIBRARY_ID/tags \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Single Tag with Items
```bash
curl -X GET $BASE_URL/libraries/$LIBRARY_ID/tags/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Tag Name
```bash
curl -X PUT $BASE_URL/libraries/$LIBRARY_ID/tags/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Combat Encounter"
  }'
```

### 6. Update Tag Color
```bash
curl -X PUT $BASE_URL/libraries/$LIBRARY_ID/tags/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "color": "#FF5733"
  }'
```

### 7. Delete Tag
```bash
curl -X DELETE $BASE_URL/libraries/$LIBRARY_ID/tags/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
const API_BASE = 'http://localhost:3000/api';
const token = 'your-jwt-token-here';
const libraryId = 1;

// Create a tag
async function createTag(name: string, color: string) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tags`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, color })
  });
  
  if (response.status === 201) {
    const result = await response.json();
    console.log('Tag created:', result.tag);
    return result.tag;
  } else if (response.status === 409) {
    console.error('Tag already exists');
  } else {
    const error = await response.json();
    console.error('Error:', error);
  }
}

// Get all tags
async function getAllTags() {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tags`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log('Tags:', result.tags);
  return result.tags;
}

// Get tag with items
async function getTagWithItems(tagId: number) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tags/${tagId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log('Tag:', result.tag);
  console.log('Associated items:', result.tag.libraryItems);
  return result.tag;
}

// Update tag
async function updateTag(tagId: number, updates: { name?: string; color?: string }) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tags/${tagId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  const result = await response.json();
  console.log('Updated tag:', result.tag);
  return result.tag;
}

// Delete tag
async function deleteTag(tagId: number) {
  const response = await fetch(`${API_BASE}/libraries/${libraryId}/tags/${tagId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 204) {
    console.log('Tag deleted successfully');
    return true;
  }
  return false;
}

// Example usage
(async () => {
  // Create tags
  await createTag('Combat', '#E74C3C');
  await createTag('Monster', '#27AE60');
  
  // Get all tags
  const tags = await getAllTags();
  
  // Update first tag
  if (tags.length > 0) {
    await updateTag(tags[0].id, { name: 'Combat Encounter' });
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

# Create a tag
def create_tag(name, color):
    response = requests.post(
        f'{API_BASE}/libraries/{library_id}/tags',
        headers=headers,
        json={'name': name, 'color': color}
    )
    
    if response.status_code == 201:
        tag = response.json()['tag']
        print(f'Tag created: {tag["name"]} ({tag["color"]})')
        return tag
    elif response.status_code == 409:
        print('Tag already exists')
    else:
        print('Error:', response.json())

# Get all tags
def get_all_tags():
    response = requests.get(
        f'{API_BASE}/libraries/{library_id}/tags',
        headers=headers
    )
    
    if response.status_code == 200:
        tags = response.json()['tags']
        print(f'Found {len(tags)} tags:')
        for tag in tags:
            print(f'  - {tag["name"]} ({tag["color"]}) - {tag["itemCount"]} items')
        return tags

# Get tag with items
def get_tag_with_items(tag_id):
    response = requests.get(
        f'{API_BASE}/libraries/{library_id}/tags/{tag_id}',
        headers=headers
    )
    
    if response.status_code == 200:
        tag = response.json()['tag']
        print(f'Tag: {tag["name"]}')
        print(f'Items using this tag:')
        for item in tag['libraryItems']:
            print(f'  - {item["name"]} ({item["type"]})')
        return tag

# Update tag
def update_tag(tag_id, name=None, color=None):
    data = {}
    if name:
        data['name'] = name
    if color:
        data['color'] = color
    
    response = requests.put(
        f'{API_BASE}/libraries/{library_id}/tags/{tag_id}',
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        tag = response.json()['tag']
        print(f'Tag updated: {tag["name"]} ({tag["color"]})')
        return tag

# Delete tag
def delete_tag(tag_id):
    response = requests.delete(
        f'{API_BASE}/libraries/{library_id}/tags/{tag_id}',
        headers=headers
    )
    
    if response.status_code == 204:
        print('Tag deleted successfully')
        return True
    return False

# Example usage
if __name__ == '__main__':
    # Create some tags
    combat_tag = create_tag('Combat', '#E74C3C')
    monster_tag = create_tag('Monster', '#27AE60')
    
    # Get all tags
    all_tags = get_all_tags()
    
    # Update a tag
    if all_tags:
        update_tag(all_tags[0]['id'], color='#FF5733')
    
    # Get tag with items
    if combat_tag:
        get_tag_with_items(combat_tag['id'])
```

---

## Common Tag Color Schemes

### D&D 5E Theme
```json
[
  { "name": "Combat", "color": "#E74C3C" },
  { "name": "Monster", "color": "#27AE60" },
  { "name": "NPC", "color": "#3498DB" },
  { "name": "Magic Item", "color": "#9B59B6" },
  { "name": "Location", "color": "#F39C12" },
  { "name": "Quest", "color": "#1ABC9C" },
  { "name": "Session Notes", "color": "#95A5A6" }
]
```

### Material Design Colors
```json
[
  { "name": "Important", "color": "#F44336" },
  { "name": "Warning", "color": "#FF9800" },
  { "name": "Success", "color": "#4CAF50" },
  { "name": "Info", "color": "#2196F3" },
  { "name": "Purple", "color": "#9C27B0" }
]
```

---

## Best Practices

1. **Consistent Naming:** Use clear, consistent names for tags across your library
2. **Color Coding:** Choose distinct colors for different tag categories
3. **Tag Organization:** Create tags before creating items for easier organization
4. **Limit Tags:** Don't create too many tags - aim for 10-20 meaningful categories
5. **Descriptive Names:** Use descriptive names that make sense to all collaborators
6. **Review Regularly:** Periodically review and merge similar tags

---

## Integration with Library Items

Tags are automatically managed when working with library items:

```javascript
// Create an item with tags
await fetch(`${API_BASE}/libraries/1/items`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'STAT_BLOCK_DND_5E',
    name: 'Goblin Warrior',
    data: { /* ... */ },
    tagIds: [1, 2, 3]  // Reference tag IDs
  })
});

// Update item tags
await fetch(`${API_BASE}/libraries/1/items/5`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tagIds: [2, 4]  // Replaces all existing tags
  })
});
```

---

## Error Handling

```typescript
async function safeCreateTag(name: string, color: string) {
  try {
    const response = await fetch(`${API_BASE}/libraries/${libraryId}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, color })
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          console.error('Invalid tag data:', error.error);
          break;
        case 401:
          console.error('Not authenticated');
          break;
        case 403:
          console.error('Insufficient permissions');
          break;
        case 409:
          console.error('Tag already exists:', error.error);
          break;
        default:
          console.error('Server error:', error);
      }
      
      return null;
    }
    
    const result = await response.json();
    return result.tag;
    
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

