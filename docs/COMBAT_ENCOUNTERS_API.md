# Combat Encounters API

The Combat Encounters API allows you to manage D&D combat encounters within your libraries. Each encounter tracks initiative order, combat rounds, combatants with their stats and conditions, and custom counters for various gameplay mechanics.

## Base URL

```
/api/libraries/:libraryId/encounters
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

### 1. Create Combat Encounter

Create a new combat encounter in a library.

**Endpoint:** `POST /api/libraries/:libraryId/encounters`

**Parameters:**
- `libraryId` (path, required): The ID of the library

**Request Body:**

```json
{
  "name": "Goblin Ambush",
  "description": "A surprise attack by goblin raiders on the road",
  "round": 1,
  "initativeCount": 0,
  "counters": [
    {
      "id": "counter-1",
      "name": "Legendary Actions",
      "value": 3,
      "max": 3,
      "color": "#FFD700"
    },
    {
      "id": "counter-2",
      "name": "Spell Slots (3rd Level)",
      "value": 3,
      "max": 3,
      "color": "#4169E1"
    }
  ],
  "combatants": [
    {
      "id": "combatant-1",
      "name": "Goblin Warrior 1",
      "initiative": 15,
      "hp": 7,
      "maxHp": 7,
      "ac": 15,
      "conditions": [],
      "notes": "",
      "isPlayer": false,
      "libraryItemId": 42
    },
    {
      "id": "combatant-2",
      "name": "Goblin Warrior 2",
      "initiative": 12,
      "hp": 7,
      "maxHp": 7,
      "ac": 15,
      "conditions": [],
      "isPlayer": false,
      "libraryItemId": 42
    },
    {
      "id": "combatant-3",
      "name": "Thoren (Fighter)",
      "initiative": 18,
      "hp": 45,
      "maxHp": 52,
      "ac": 18,
      "conditions": ["blessed"],
      "notes": "+1d4 to attack rolls from Bless",
      "isPlayer": true
    }
  ]
}
```

**Field Descriptions:**

- `name` (required): Encounter name
- `description` (optional): Detailed description of the encounter
- `round` (optional, default: 1): Current combat round number
- `initativeCount` (optional, default: 0): Initiative counter for tracking turn order
- `counters` (optional): Array of custom counters for tracking game mechanics
  - `id`: Unique identifier for the counter
  - `name`: Display name
  - `value`: Current value
  - `max`: Maximum value
  - `color`: Hex color code for UI display
- `combatants` (optional): Array of combatants in the encounter
  - `id`: Unique identifier for the combatant
  - `name`: Display name
  - `initiative`: Initiative roll value
  - `hp`: Current hit points
  - `maxHp`: Maximum hit points
  - `ac`: Armor class
  - `conditions`: Array of condition names (e.g., "poisoned", "blessed", "prone")
  - `notes`: Free-form notes about the combatant
  - `isPlayer`: Whether this is a player character
  - `libraryItemId` (optional): Reference to a LibraryItem for stat block data

**Response (201 Created):**

```json
{
  "message": "Combat encounter created successfully",
  "encounter": {
    "id": 1,
    "libraryId": 1,
    "name": "Goblin Ambush",
    "description": "A surprise attack by goblin raiders on the road",
    "round": 1,
    "initativeCount": 0,
    "counters": [...],
    "combatants": [...],
    "portalViews": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Combat Encounters

Retrieve all combat encounters in a library.

**Endpoint:** `GET /api/libraries/:libraryId/encounters`

**Parameters:**
- `libraryId` (path, required): The ID of the library

**Response (200 OK):**

```json
{
  "encounters": [
    {
      "id": 1,
      "libraryId": 1,
      "name": "Goblin Ambush",
      "description": "A surprise attack by goblin raiders",
      "round": 3,
      "initativeCount": 2,
      "counters": [...],
      "combatants": [...],
      "portalViews": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    },
    {
      "id": 2,
      "libraryId": 1,
      "name": "Dragon's Lair",
      "description": "The final confrontation with the ancient red dragon",
      "round": 1,
      "initativeCount": 0,
      "counters": [...],
      "combatants": [...],
      "portalViews": [],
      "createdAt": "2024-01-14T15:20:00.000Z",
      "updatedAt": "2024-01-14T15:20:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Combat Encounter

Retrieve a specific combat encounter by ID.

**Endpoint:** `GET /api/libraries/:libraryId/encounters/:encounterId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `encounterId` (path, required): The ID of the encounter

**Response (200 OK):**

```json
{
  "encounter": {
    "id": 1,
    "libraryId": 1,
    "name": "Goblin Ambush",
    "description": "A surprise attack by goblin raiders on the road",
    "round": 3,
    "initativeCount": 2,
    "counters": [
      {
        "id": "counter-1",
        "name": "Legendary Actions",
        "value": 1,
        "max": 3,
        "color": "#FFD700"
      }
    ],
    "combatants": [
      {
        "id": "combatant-1",
        "name": "Goblin Warrior 1",
        "initiative": 15,
        "hp": 0,
        "maxHp": 7,
        "ac": 15,
        "conditions": ["dead"],
        "notes": "Killed by Thoren's greataxe",
        "isPlayer": false,
        "libraryItemId": 42
      },
      {
        "id": "combatant-3",
        "name": "Thoren (Fighter)",
        "initiative": 18,
        "hp": 38,
        "maxHp": 52,
        "ac": 18,
        "conditions": ["blessed"],
        "notes": "+1d4 to attack rolls",
        "isPlayer": true
      }
    ],
    "portalViews": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: Encounter doesn't exist or doesn't belong to this library

---

### 4. Update Combat Encounter

Update an existing combat encounter. All fields are optional - only include the fields you want to change.

**Endpoint:** `PUT /api/libraries/:libraryId/encounters/:encounterId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `encounterId` (path, required): The ID of the encounter

**Request Body:**

```json
{
  "round": 4,
  "initativeCount": 0,
  "combatants": [
    {
      "id": "combatant-3",
      "name": "Thoren (Fighter)",
      "initiative": 18,
      "hp": 38,
      "maxHp": 52,
      "ac": 18,
      "conditions": ["blessed", "hasted"],
      "notes": "+1d4 to attack rolls, +2 AC, advantage on DEX saves",
      "isPlayer": true
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "message": "Combat encounter updated successfully",
  "encounter": {
    "id": 1,
    "libraryId": 1,
    "name": "Goblin Ambush",
    "description": "A surprise attack by goblin raiders on the road",
    "round": 4,
    "initativeCount": 0,
    "counters": [...],
    "combatants": [...],
    "portalViews": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:40:00.000Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: Encounter doesn't exist or doesn't belong to this library

---

### 5. Delete Combat Encounter

Permanently delete a combat encounter.

**Endpoint:** `DELETE /api/libraries/:libraryId/encounters/:encounterId`

**Parameters:**
- `libraryId` (path, required): The ID of the library
- `encounterId` (path, required): The ID of the encounter

**Response (204 No Content):**

No response body. The encounter has been successfully deleted.

**Error Responses:**

- `404 Not Found`: Encounter doesn't exist or doesn't belong to this library
- `403 Forbidden`: User doesn't have EDITOR or OWNER access

---

## Common Error Responses

### 400 Bad Request

```json
{
  "error": "Name is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "error": "Editor access required"
}
```

### 404 Not Found

```json
{
  "error": "Combat encounter not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create combat encounter",
  "message": "Detailed error message"
}
```

---

## Usage Examples

### Creating a Simple Encounter

```bash
curl -X POST http://localhost:3000/api/libraries/1/encounters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Random Encounter",
    "description": "Bandits on the road"
  }'
```

### Starting Combat with Full Setup

```bash
curl -X POST http://localhost:3000/api/libraries/1/encounters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Boss Battle",
    "description": "The final confrontation",
    "combatants": [
      {
        "id": "boss-1",
        "name": "Dracolich",
        "initiative": 20,
        "hp": 225,
        "maxHp": 225,
        "ac": 19,
        "conditions": [],
        "isPlayer": false,
        "libraryItemId": 99
      },
      {
        "id": "player-1",
        "name": "Gandor the Brave",
        "initiative": 17,
        "hp": 68,
        "maxHp": 68,
        "ac": 20,
        "conditions": [],
        "isPlayer": true
      }
    ],
    "counters": [
      {
        "id": "legendary-1",
        "name": "Legendary Actions",
        "value": 3,
        "max": 3,
        "color": "#8B0000"
      }
    ]
  }'
```

### Advancing Combat Round

```bash
curl -X PUT http://localhost:3000/api/libraries/1/encounters/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "round": 2,
    "initativeCount": 0
  }'
```

### Updating Combatant HP and Conditions

```bash
curl -X PUT http://localhost:3000/api/libraries/1/encounters/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "combatants": [
      {
        "id": "boss-1",
        "name": "Dracolich",
        "initiative": 20,
        "hp": 187,
        "maxHp": 225,
        "ac": 19,
        "conditions": ["frightened"],
        "notes": "Turned by cleric",
        "isPlayer": false,
        "libraryItemId": 99
      }
    ]
  }'
```

---

## Data Structure Details

### Combatant Object

Each combatant in the `combatants` array should follow this structure:

```typescript
{
  id: string;              // Unique identifier (e.g., "combatant-1", "player-uuid")
  name: string;            // Display name
  initiative: number;      // Initiative roll value
  hp: number;              // Current hit points
  maxHp: number;           // Maximum hit points
  ac: number;              // Armor class
  conditions: string[];    // Array of condition names
  notes?: string;          // Optional notes
  isPlayer: boolean;       // true for PCs, false for NPCs/monsters
  libraryItemId?: number;  // Optional reference to LibraryItem for stat block
}
```

### Counter Object

Each counter in the `counters` array should follow this structure:

```typescript
{
  id: string;      // Unique identifier (e.g., "counter-1")
  name: string;    // Display name (e.g., "Legendary Actions", "Lair Actions")
  value: number;   // Current value
  max: number;     // Maximum value
  color?: string;  // Optional hex color for UI (e.g., "#FFD700")
}
```

### Common D&D 5E Conditions

When setting conditions on combatants, use standard D&D 5E condition names:

- `blinded`
- `charmed`
- `deafened`
- `frightened`
- `grappled`
- `incapacitated`
- `invisible`
- `paralyzed`
- `petrified`
- `poisoned`
- `prone`
- `restrained`
- `stunned`
- `unconscious`
- `dead`

You can also use custom conditions or spell effects (e.g., `blessed`, `hasted`, `concentrating`).

---

## Best Practices

1. **Unique IDs**: Always use unique IDs for combatants and counters. UUIDs or sequential IDs work well.

2. **Initiative Order**: Store combatants in initiative order (highest to lowest) for easier UI rendering.

3. **Linking to Stat Blocks**: Use `libraryItemId` to reference LibraryItems of type `STAT_BLOCK_DND_5E` for monster stat blocks.

4. **Conditions Array**: Keep the conditions array up-to-date as combatants gain or lose conditions.

5. **Notes Field**: Use the notes field for temporary effects, concentration tracking, or tactical information.

6. **Counters**: Create counters for:
   - Legendary Actions
   - Lair Actions  
   - Spell Slots by level
   - Resource tracking (ki points, sorcery points, etc.)
   - Environment effects (turns until trap resets, etc.)

7. **Round Tracking**: Update the `round` field when advancing to the next round.

8. **Dead Combatants**: When a combatant dies, set their HP to 0 and add "dead" to their conditions array rather than removing them from the combatants array (for record-keeping).

---

## Integration with Other APIs

### LibraryItems

Combat encounters can reference LibraryItems (stat blocks) via the `libraryItemId` field on combatants:

```javascript
// First, get the stat block
GET /api/libraries/1/items/42

// Then reference it in your encounter
POST /api/libraries/1/encounters
{
  "name": "Goblin Patrol",
  "combatants": [
    {
      "id": "goblin-1",
      "libraryItemId": 42,  // References the stat block
      "name": "Goblin Scout",
      "initiative": 14,
      ...
    }
  ]
}
```

### Portal Views

Combat encounters can be displayed in Portal Views for player-facing combat tracking. The `portalViews` array shows which portal views are currently displaying this encounter.

---

## Changelog

**Version 1.0.0** (Initial Release)
- Create, read, update, and delete combat encounters
- Support for combatants with initiative, HP, AC, and conditions
- Custom counters for tracking game mechanics
- Round and initiative tracking
- Integration with LibraryItems for stat blocks
- Portal View support


