# Portal Views API

The Portal Views API allows you to manage player-facing portal views within your libraries. Portal views are used to display content to players with configurable display options for encounters, health, AC, actions, and more. Items can be an array of any JSON objects, providing maximum flexibility for different types of content.

## Base URL

```
/api/libraries/:libraryId/portal-views
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

### 1. Create Portal View

Create a new portal view in a library.

**Endpoint:** `POST /api/libraries/:libraryId/portal-views`

**Parameters:**
- `libraryId` (path, required): The ID of the library

**Request Body:**

```json
{
  "name": "Player View - Main Battle",
  "showEncounter": true,
  "showHealth": true,
  "showAC": true,
  "showActions": false,
  "autoResetImageState": false,
  "combatEncounterId": 1,
  "currentItem": 0,
  "items": [
    {
      "id": "item-1",
      "type": "image",
      "url": "https://example.com/map.jpg",
      "position": { "x": 0, "y": 0 },
      "scale": 1.0,
      "visible": true
    },
    {
      "id": "item-2",
      "type": "stat-block",
      "libraryItemId": 42,
      "visible": true,
      "position": { "x": 100, "y": 100 }
    },
    {
      "id": "item-3",
      "type": "note",
      "content": "Player notes and reminders",
      "position": { "x": 200, "y": 200 },
      "color": "#FFD700"
    }
  ]
}
```

**Field Descriptions:**

- `name` (string, required): The name of the portal view
- `showEncounter` (boolean, optional, default: false): Whether to show combat encounter information
- `showHealth` (boolean, optional, default: false): Whether to show health information
- `showAC` (boolean, optional, default: false): Whether to show armor class information
- `showActions` (boolean, optional, default: false): Whether to show action information
- `autoResetImageState` (boolean, optional, default: false): Whether to automatically reset image state
- `combatEncounterId` (integer, optional, nullable): Optional combat encounter ID to link to this portal view. Must exist in the same library.
- `currentItem` (integer, optional, nullable): Current item index being displayed
- `items` (array, optional): Array of items to display. Each item can be any JSON object - no validation is performed. This allows maximum flexibility for different types of content (images, stat blocks, notes, tokens, etc.)

**Response (201 Created):**

```json
{
  "message": "Portal view created successfully",
  "portalView": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "libraryId": 1,
    "name": "Player View - Main Battle",
    "showEncounter": true,
    "showHealth": true,
    "showAC": true,
    "showActions": false,
    "autoResetImageState": false,
    "combatEncounterId": 1,
    "currentItem": 0,
    "items": [
      {
        "id": "item-1",
        "type": "image",
        "url": "https://example.com/map.jpg",
        "position": { "x": 0, "y": 0 },
        "scale": 1.0
      }
    ],
    "combatEncounter": {
      "id": 1,
      "name": "Goblin Ambush",
      "round": 1
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request body or combat encounter not found in library
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have EDITOR or OWNER access
- `500 Internal Server Error`: Server error

---

### 2. Get All Portal Views

Retrieve all portal views in a library.

**Endpoint:** `GET /api/libraries/:libraryId/portal-views`

**Parameters:**
- `libraryId` (path, required): The ID of the library

**Response (200 OK):**

```json
{
  "portalViews": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "libraryId": 1,
      "name": "Player View - Main Battle",
      "showEncounter": true,
      "showHealth": true,
      "showAC": true,
      "showActions": false,
      "autoResetImageState": false,
      "combatEncounterId": 1,
      "currentItem": 0,
      "items": [
        {
          "id": "item-1",
          "type": "image",
          "url": "https://example.com/map.jpg"
        }
      ],
      "combatEncounter": {
        "id": 1,
        "name": "Goblin Ambush"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "libraryId": 1,
      "name": "Player View - Exploration",
      "showEncounter": false,
      "showHealth": false,
      "showAC": false,
      "showActions": false,
      "autoResetImageState": true,
      "combatEncounterId": null,
      "currentItem": null,
      "items": null,
      "combatEncounter": null,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

---

### 3. Get Single Portal View

Retrieve a specific portal view by ID.

**Endpoint:** `GET /api/libraries/:libraryId/portal-views/:portalViewId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `portalViewId` (path, required): The UUID of the portal view

**Response (200 OK):**

```json
{
  "portalView": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "libraryId": 1,
    "name": "Player View - Main Battle",
    "showEncounter": true,
    "showHealth": true,
    "showAC": true,
    "showActions": false,
    "autoResetImageState": false,
    "combatEncounterId": 1,
    "currentItem": 0,
    "items": [
      {
        "id": "item-1",
        "type": "image",
        "url": "https://example.com/map.jpg",
        "position": { "x": 0, "y": 0 },
        "scale": 1.0
      },
      {
        "id": "item-2",
        "type": "stat-block",
        "libraryItemId": 42,
        "visible": true
      }
    ],
    "combatEncounter": {
      "id": 1,
      "name": "Goblin Ambush",
      "round": 1,
      "initativeCount": 0
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Portal view not found
- `500 Internal Server Error`: Server error

---

### 4. Update Portal View

Update an existing portal view. All fields are optional.

**Endpoint:** `PUT /api/libraries/:libraryId/portal-views/:portalViewId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `portalViewId` (path, required): The UUID of the portal view

**Request Body:**

```json
{
  "name": "Player View - Updated",
  "showEncounter": false,
  "showHealth": false,
  "showAC": false,
  "showActions": true,
  "autoResetImageState": true,
  "combatEncounterId": null,
  "currentItem": 1,
  "items": [
    {
      "id": "item-1",
      "type": "image",
      "url": "https://example.com/updated-map.jpg",
      "position": { "x": 50, "y": 50 },
      "scale": 1.5
    }
  ]
}
```

**Field Descriptions:**

All fields are optional. Only include the fields you want to update.

- `name` (string, optional): The name of the portal view
- `showEncounter` (boolean, optional): Whether to show combat encounter information
- `showHealth` (boolean, optional): Whether to show health information
- `showAC` (boolean, optional): Whether to show armor class information
- `showActions` (boolean, optional): Whether to show action information
- `autoResetImageState` (boolean, optional): Whether to automatically reset image state
- `combatEncounterId` (integer, optional, nullable): Combat encounter ID to link. Set to `null` to unlink.
- `currentItem` (integer, optional, nullable): Current item index being displayed
- `items` (array, optional): Array of items. Accepts any JSON structure - no validation. Each item can be any JSON object.

**Response (200 OK):**

```json
{
  "message": "Portal view updated successfully",
  "portalView": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "libraryId": 1,
    "name": "Player View - Updated",
    "showEncounter": false,
    "showHealth": false,
    "showAC": false,
    "showActions": true,
    "autoResetImageState": true,
    "combatEncounterId": null,
    "currentItem": 1,
    "items": [
      {
        "id": "item-1",
        "type": "image",
        "url": "https://example.com/updated-map.jpg",
        "position": { "x": 50, "y": 50 },
        "scale": 1.5
      }
    ],
    "combatEncounter": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid request body or combat encounter not found in library
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have EDITOR or OWNER access
- `404 Not Found`: Portal view not found
- `500 Internal Server Error`: Server error

---

### 5. Delete Portal View

Delete a portal view permanently.

**Endpoint:** `DELETE /api/libraries/:libraryId/portal-views/:portalViewId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `portalViewId` (path, required): The UUID of the portal view

**Response (204 No Content):**

No response body.

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User does not have EDITOR or OWNER access
- `404 Not Found`: Portal view not found
- `500 Internal Server Error`: Server error

---

## Items Array

The `items` field is a flexible JSON array that can contain any type of content. Each item can be any JSON object - no validation is performed. This allows you to store:

- **Images**: Maps, tokens, handouts
- **Stat Blocks**: References to library items
- **Notes**: Player-facing notes and reminders
- **Custom Content**: Any other JSON structure you need

### Example Item Structures

**Image Item:**
```json
{
  "id": "item-1",
  "type": "image",
  "url": "https://example.com/map.jpg",
  "position": { "x": 0, "y": 0 },
  "scale": 1.0,
  "rotation": 0,
  "visible": true,
  "locked": false
}
```

**Stat Block Item:**
```json
{
  "id": "item-2",
  "type": "stat-block",
  "libraryItemId": 42,
  "position": { "x": 100, "y": 100 },
  "visible": true,
  "minimized": false
}
```

**Note Item:**
```json
{
  "id": "item-3",
  "type": "note",
  "content": "Player notes and reminders",
  "position": { "x": 200, "y": 200 },
  "color": "#FFD700",
  "fontSize": 14
}
```

**Token Item:**
```json
{
  "id": "item-4",
  "type": "token",
  "imageUrl": "https://example.com/token.png",
  "position": { "x": 300, "y": 300 },
  "size": { "width": 50, "height": 50 },
  "name": "Goblin Warrior",
  "hp": 7,
  "maxHp": 7
}
```

**Custom Item:**
```json
{
  "id": "item-5",
  "type": "custom-widget",
  "widgetType": "weather",
  "data": {
    "temperature": 72,
    "condition": "sunny",
    "windSpeed": 5
  },
  "position": { "x": 400, "y": 400 }
}
```

The flexibility of the items array allows you to extend portal views with any type of content without requiring schema changes.

---

## Use Cases

### Player-Facing Display

Portal views are designed to be displayed to players, showing only the information the DM wants to reveal:

- **Combat Views**: Show encounter information, health, AC, and actions
- **Exploration Views**: Show maps, notes, and exploration content
- **Social Views**: Show NPCs, locations, and social encounter information

### Dynamic Content Management

The flexible items array allows you to:

- Add/remove items dynamically
- Update item positions and properties
- Store any type of content without schema changes
- Support custom widgets and extensions

### Combat Integration

Portal views can be linked to combat encounters to:

- Display encounter information to players
- Show combatant health and status
- Track initiative and turn order
- Display relevant stat blocks and actions

---

## Best Practices

1. **Naming**: Use descriptive names for portal views (e.g., "Player View - Main Battle", "Player View - Exploration")

2. **Items Structure**: While items can be any JSON, consider using a consistent structure:
   - Include an `id` field for each item
   - Include a `type` field to identify the item type
   - Include a `position` field for spatial items

3. **Display Flags**: Use the display flags (`showEncounter`, `showHealth`, etc.) to control what information is visible to players

4. **Combat Linking**: Link portal views to combat encounters when displaying combat information to players

5. **Item Management**: Update the `currentItem` field to track which item is currently being displayed

---

## Examples

### Creating a Combat Portal View

```bash
curl -X POST http://localhost:3000/api/libraries/1/portal-views \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Player View - Goblin Ambush",
    "showEncounter": true,
    "showHealth": true,
    "showAC": true,
    "showActions": false,
    "combatEncounterId": 1,
    "items": [
      {
        "id": "map-1",
        "type": "image",
        "url": "https://example.com/battle-map.jpg",
        "position": { "x": 0, "y": 0 },
        "scale": 1.0
      }
    ]
  }'
```

### Updating Items Array

```bash
curl -X PUT http://localhost:3000/api/libraries/1/portal-views/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "map-1",
        "type": "image",
        "url": "https://example.com/battle-map.jpg",
        "position": { "x": 0, "y": 0 }
      },
      {
        "id": "token-1",
        "type": "token",
        "imageUrl": "https://example.com/goblin.png",
        "position": { "x": 100, "y": 100 },
        "name": "Goblin Warrior"
      }
    ]
  }'
```

### Getting All Portal Views

```bash
curl -X GET http://localhost:3000/api/libraries/1/portal-views \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Related Endpoints

- [Combat Encounters API](./COMBAT_ENCOUNTERS_API.md) - Manage combat encounters that can be linked to portal views
- [Library Items API](./LIBRARY_ITEMS_API.md) - Manage stat blocks and other content that can be referenced in portal views
- [Files API](./FILES_API.md) - Upload images and files that can be used in portal view items

