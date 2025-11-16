# DM Screens API

The DM Screens API allows you to manage DM screens within your libraries. DM screens are used to organize and display content for the Dungeon Master, with flexible items arrays and settings that can contain any JSON objects, providing maximum flexibility for different types of content and configurations.

## Base URL

```
/api/libraries/:libraryId/dm-screens
```

## Authentication

All endpoints require Bearer token authentication. Include your access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Permissions

- **GET** requests: Requires any library access (VIEWER, EDITOR, or OWNER)
- **POST/PUT/DELETE** requests: Requires EDITOR or OWNER access

---

## Endpoints

### 1. Create DM Screen

Create a new DM screen in a library.

**Endpoint:** `POST /api/libraries/:libraryId/dm-screens`

**Parameters:**
- `libraryId` (path, required): The ID of the library

**Request Body:**

```json
{
  "name": "Main DM Screen",
  "items": [
    {
      "id": "item-1",
      "type": "stat-block",
      "libraryItemId": 42,
      "position": { "x": 0, "y": 0 },
      "visible": true,
      "minimized": false
    },
    {
      "id": "item-2",
      "type": "note",
      "content": "DM notes and reminders",
      "position": { "x": 100, "y": 200 },
      "color": "#FFD700",
      "fontSize": 14
    },
    {
      "id": "item-3",
      "type": "image",
      "url": "https://example.com/dm-map.jpg",
      "position": { "x": 300, "y": 300 },
      "scale": 1.0,
      "locked": false
    },
    {
      "id": "item-4",
      "type": "custom-widget",
      "widgetType": "weather",
      "data": {
        "temperature": 72,
        "condition": "sunny",
        "windSpeed": 5
      },
      "position": { "x": 500, "y": 100 }
    }
  ],
  "settings": {
    "layout": "grid",
    "columns": 3,
    "theme": "dark",
    "autoSave": true,
    "showGrid": true,
    "gridSize": 50,
    "customOptions": {
      "enableSnapToGrid": true,
      "defaultZoom": 1.0
    }
  }
}
```

**Field Descriptions:**

- `name` (string, required): The name of the DM screen
- `items` (array, optional): Array of items to display in the DM screen. Each item can be any JSON object - no validation is performed. This allows maximum flexibility for different types of content (images, stat blocks, notes, tokens, custom widgets, etc.). Maximum size: 1MB, maximum depth: 20 levels.
- `settings` (object, optional): JSON object containing settings for the DM screen. Can contain any JSON structure - no validation is performed. This allows flexible configuration options. Maximum size: 1MB, maximum depth: 20 levels.

**Response (201 Created):**

```json
{
  "message": "DM screen created successfully",
  "dmScreen": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "libraryId": 1,
    "name": "Main DM Screen",
    "items": [
      {
        "id": "item-1",
        "type": "stat-block",
        "libraryItemId": 42,
        "position": { "x": 0, "y": 0 }
      }
    ],
    "settings": {
      "layout": "grid",
      "columns": 3,
      "theme": "dark"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request (missing name, invalid JSON format, payload too large, or structure too deep)
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have EDITOR or OWNER access
- `500 Internal Server Error`: Server error

---

### 2. Get All DM Screens

Get all DM screens in a library, ordered by creation date (newest first).

**Endpoint:** `GET /api/libraries/:libraryId/dm-screens`

**Parameters:**
- `libraryId` (path, required): The ID of the library

**Response (200 OK):**

```json
{
  "dmScreens": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "libraryId": 1,
      "name": "Main DM Screen",
      "items": [
        {
          "id": "item-1",
          "type": "stat-block",
          "libraryItemId": 42
        }
      ],
      "settings": {
        "layout": "grid",
        "columns": 3
      },
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "libraryId": 1,
      "name": "Secondary DM Screen",
      "items": null,
      "settings": null,
      "createdAt": "2025-01-14T08:20:00.000Z",
      "updatedAt": "2025-01-14T08:20:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

### 3. Get Single DM Screen

Get a single DM screen by ID.

**Endpoint:** `GET /api/libraries/:libraryId/dm-screens/:dmScreenId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `dmScreenId` (path, required): The UUID of the DM screen

**Response (200 OK):**

```json
{
  "dmScreen": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "libraryId": 1,
    "name": "Main DM Screen",
    "items": [
      {
        "id": "item-1",
        "type": "stat-block",
        "libraryItemId": 42,
        "position": { "x": 0, "y": 0 },
        "visible": true
      },
      {
        "id": "item-2",
        "type": "note",
        "content": "DM notes",
        "position": { "x": 100, "y": 200 }
      }
    ],
    "settings": {
      "layout": "grid",
      "columns": 3,
      "theme": "dark",
      "autoSave": true
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: DM screen not found
- `500 Internal Server Error`: Server error

---

### 4. Update DM Screen

Update an existing DM screen. All fields are optional - only provided fields will be updated.

**Endpoint:** `PUT /api/libraries/:libraryId/dm-screens/:dmScreenId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `dmScreenId` (path, required): The UUID of the DM screen

**Request Body:**

```json
{
  "name": "Updated DM Screen Name",
  "items": [
    {
      "id": "item-1",
      "type": "stat-block",
      "libraryItemId": 42,
      "position": { "x": 50, "y": 50 }
    }
  ],
  "settings": {
    "layout": "freeform",
    "columns": 4,
    "theme": "light"
  }
}
```

**Field Descriptions:**

- `name` (string, optional): The name of the DM screen
- `items` (array, optional): Array of items. Accepts any JSON structure - no validation. Each item can be any JSON object. Maximum size: 1MB, maximum depth: 20 levels.
- `settings` (object, optional): JSON object containing settings. Accepts any JSON structure - no validation. Maximum size: 1MB, maximum depth: 20 levels.

**Response (200 OK):**

```json
{
  "message": "DM screen updated successfully",
  "dmScreen": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "libraryId": 1,
    "name": "Updated DM Screen Name",
    "items": [
      {
        "id": "item-1",
        "type": "stat-block",
        "libraryItemId": 42,
        "position": { "x": 50, "y": 50 }
      }
    ],
    "settings": {
      "layout": "freeform",
      "columns": 4,
      "theme": "light"
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:45:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request (invalid JSON format, payload too large, or structure too deep)
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have EDITOR or OWNER access
- `404 Not Found`: DM screen not found
- `500 Internal Server Error`: Server error

---

### 5. Delete DM Screen

Delete a DM screen permanently.

**Endpoint:** `DELETE /api/libraries/:libraryId/dm-screens/:dmScreenId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `dmScreenId` (path, required): The UUID of the DM screen

**Response (204 No Content):**

No response body.

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have EDITOR or OWNER access
- `404 Not Found`: DM screen not found
- `500 Internal Server Error`: Server error

---

## Items Array

The `items` field is a flexible JSON array that can contain any type of content. Each item can be any JSON object - no validation is performed. This allows you to store:

- **Stat Blocks**: References to library items
- **Notes**: DM notes and reminders
- **Images**: Maps, handouts, reference images
- **Custom Widgets**: Weather, timers, custom tools
- **Any other content**: Maximum flexibility for your needs

### Example Item Structures

**Stat Block Item:**
```json
{
  "id": "item-1",
  "type": "stat-block",
  "libraryItemId": 42,
  "position": { "x": 0, "y": 0 },
  "visible": true,
  "minimized": false,
  "scale": 1.0
}
```

**Note Item:**
```json
{
  "id": "item-2",
  "type": "note",
  "content": "DM notes and reminders",
  "position": { "x": 100, "y": 200 },
  "color": "#FFD700",
  "fontSize": 14,
  "isPinned": true
}
```

**Image Item:**
```json
{
  "id": "item-3",
  "type": "image",
  "url": "https://example.com/dm-map.jpg",
  "position": { "x": 300, "y": 300 },
  "scale": 1.0,
  "rotation": 0,
  "visible": true,
  "locked": false
}
```

**Custom Widget Item:**
```json
{
  "id": "item-4",
  "type": "custom-widget",
  "widgetType": "weather",
  "data": {
    "temperature": 72,
    "condition": "sunny",
    "windSpeed": 5,
    "humidity": 60
  },
  "position": { "x": 500, "y": 100 },
  "size": { "width": 200, "height": 150 }
}
```

The flexibility of the items array allows you to extend DM screens with any type of content without requiring schema changes.

---

## Settings Object

The `settings` field is a flexible JSON object that can contain any configuration options for the DM screen. Common settings might include:

- **Layout**: Grid, freeform, list, etc.
- **Display**: Theme, columns, grid size, etc.
- **Behavior**: Auto-save, snap to grid, etc.
- **Custom Options**: Any other configuration your frontend needs

### Example Settings Structures

**Grid Layout Settings:**
```json
{
  "layout": "grid",
  "columns": 3,
  "rows": 4,
  "gridSize": 50,
  "showGrid": true,
  "snapToGrid": true
}
```

**Theme Settings:**
```json
{
  "theme": "dark",
  "backgroundColor": "#1a1a1a",
  "textColor": "#ffffff",
  "accentColor": "#4a9eff"
}
```

**Behavior Settings:**
```json
{
  "autoSave": true,
  "autoSaveInterval": 30000,
  "enableUndo": true,
  "maxUndoHistory": 50
}
```

**Custom Settings:**
```json
{
  "customOptions": {
    "enableSnapToGrid": true,
    "defaultZoom": 1.0,
    "minZoom": 0.5,
    "maxZoom": 3.0,
    "enableKeyboardShortcuts": true
  }
}
```

The flexibility of the settings object allows you to configure DM screens with any options without requiring schema changes.

---

## Validation and Limits

### JSON Validation

Both `items` and `settings` fields are validated for:

- **Size Limit**: Maximum 1MB per field (when stringified)
- **Depth Limit**: Maximum 20 levels of nesting
- **Structure**: `items` must be an array (if provided), `settings` must be an object (if provided)

### Error Messages

If validation fails, you'll receive a `400 Bad Request` response with an error message:

```json
{
  "error": "JSON payload too large: 1.5MB exceeds maximum of 1MB"
}
```

or

```json
{
  "error": "Items field must be an array or null"
}
```

---

## Use Cases

### Organizing DM Resources

DM screens are perfect for organizing all your DM resources in one place:

- Quick access to stat blocks for NPCs and monsters
- Session notes and reminders
- Reference images and maps
- Custom tools and widgets

### Customizable Layouts

With flexible settings, you can configure DM screens to match your workflow:

- Grid layouts for organized content
- Freeform layouts for creative arrangements
- Custom themes for visual preferences
- Auto-save for peace of mind

### Extensible Content

The flexible items array allows you to add any type of content:

- Standard content types (stat blocks, notes, images)
- Custom widgets and tools
- Future content types without schema changes

---

## Best Practices

1. **Keep Items Organized**: Use consistent item structures within your application for easier frontend handling
2. **Reasonable Sizes**: While the limit is 1MB, keep items arrays reasonable for better performance
3. **Settings Consistency**: Use consistent settings structures across your application
4. **Error Handling**: Always handle validation errors gracefully in your frontend
5. **Backup Important Data**: Consider backing up important DM screen configurations

---

## Related APIs

- [Library Items API](./LIBRARY_ITEMS_API.md) - For managing stat blocks, notes, and other library items
- [Portal Views API](./PORTAL_VIEWS_API.md) - For managing player-facing portal views
- [Combat Encounters API](./COMBAT_ENCOUNTERS_API.md) - For managing combat encounters

