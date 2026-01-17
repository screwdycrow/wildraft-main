# Library Items API Documentation

## Overview

Library Items are flexible content objects stored in libraries. Each item has a specific type which is used primarily by the UI. The examples below show recommended fields for each type, but the `data` payload is completely free-form JSON—the backend stores whatever structure you provide.

## Item Types

### 1. STAT_BLOCK_DND_5E
D&D 5th Edition creature/NPC stat blocks.

**Required Fields:**
- `cr` (string): Challenge Rating (e.g., "1/2", "5")
- `hp` (number): Hit Points
- `ac` (number): Armor Class
- `speed` (string): Speed (e.g., "30 ft.")

**Optional Common Fields:**
- Ability Scores: `str`, `dex`, `con`, `int`, `wis`, `cha` (numbers)
- Combat: `maxHp` (number)
- Descriptors: `size`, `type`, `alignment`, `languages`, `senses` (strings)
- Actions: `traits`, `actions`, `legendaryActions` (arrays of action objects)

**Example:**
```json
{
  "type": "STAT_BLOCK_DND_5E",
  "name": "Goblin Warrior",
  "description": "A basic goblin warrior",
  "data": {
    "cr": "1/4",
    "hp": 7,
    "ac": 15,
    "speed": "30 ft.",
    "str": 8,
    "dex": 14,
    "con": 10,
    "int": 10,
    "wis": 8,
    "cha": 8,
    "size": "Small",
    "type": "humanoid",
    "alignment": "neutral evil",
    "languages": "Common, Goblin",
    "senses": "darkvision 60 ft.",
    "actions": [
      {
        "name": "Scimitar",
        "roll": "1d20+4",
        "range": "5 ft.",
        "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6+2) slashing damage."
      }
    ]
  },
  "tagIds": [1, 2]
}
```

### 2. NOTE
Simple text notes with optional formatting.

**Required Fields:**
- `content` (string): Note content

**Optional Fields:**
- `format` (enum): "markdown" | "html" | "plain"
- `isPinned` (boolean): Pin to top
- `category` (string): Note category

**Example:**
```json
{
  "type": "NOTE",
  "name": "Session 5 Notes",
  "description": "Important plot points from session 5",
  "data": {
    "content": "# Session 5\n\n- Party discovered the ancient temple\n- Met the mysterious NPC\n- Found the magical artifact",
    "format": "markdown",
    "isPinned": true,
    "category": "Session Notes"
  },
  "tagIds": [3]
}
```

### 3. ITEM_DND_5E
D&D 5th Edition items and equipment.

**Required Fields:**
- `rarity` (enum): "common" | "uncommon" | "rare" | "very rare" | "legendary" | "artifact"
- `itemType` (string): Type of item (e.g., "weapon", "armor", "potion", "wondrous item")

**Optional Fields:**
- `attunement` (boolean): Requires attunement
- `value` (string): Item value (e.g., "50 gp")
- `weight` (number): Weight in pounds
- `properties` (array of strings): Item properties
- `damage` (string): Damage dice (e.g., "1d8 slashing")
- `armorClass` (string): AC provided
- `effect` (string): Magical effects

**Example:**
```json
{
  "type": "ITEM_DND_5E",
  "name": "Flame Tongue",
  "description": "A magical sword that bursts into flames",
  "data": {
    "rarity": "rare",
    "itemType": "weapon",
    "attunement": true,
    "value": "5000 gp",
    "weight": 3,
    "damage": "1d8 slashing + 2d6 fire",
    "properties": ["versatile", "finesse"],
    "effect": "As a bonus action, you can speak the command word to cause flames to erupt from the blade. These flames shed bright light in a 40-foot radius."
  },
  "tagIds": [4, 5]
}
```

### 4. CHARACTER_DND_5E
D&D 5th Edition player characters or NPCs.

**Required Fields:**
- `level` (number): Character level
- `class` (string): Character class
- `race` (string): Character race

**Optional Fields:**
- Ability Scores: `str`, `dex`, `con`, `int`, `wis`, `cha` (numbers)
- Combat: `hp`, `maxHp`, `ac` (numbers), `speed` (string)
- Character Info: `subclass`, `background`, `playerName` (strings)
- Descriptors: `size`, `type`, `alignment`, `languages`, `senses` (strings)
- Arrays: `equipment`, `spells`, `features` (arrays of objects)

**Example:**
```json
{
  "type": "CHARACTER_DND_5E",
  "name": "Eldrin Brightwood",
  "description": "An elven wizard seeking ancient knowledge",
  "data": {
    "level": 5,
    "class": "Wizard",
    "race": "High Elf",
    "subclass": "School of Evocation",
    "background": "Sage",
    "playerName": "John",
    "str": 8,
    "dex": 14,
    "con": 12,
    "int": 18,
    "wis": 13,
    "cha": 10,
    "hp": 28,
    "maxHp": 28,
    "ac": 12,
    "speed": "30 ft.",
    "equipment": [
      { "name": "Spellbook", "equipped": true },
      { "name": "Component Pouch", "equipped": true },
      { "name": "Staff of the Magi", "equipped": true, "attuned": true }
    ],
    "spells": [
      { "name": "Fireball", "level": 3, "prepared": true },
      { "name": "Magic Missile", "level": 1, "prepared": true }
    ]
  },
  "tagIds": [6, 7]
}
```

## API Endpoints

### Create Library Item
**POST** `/api/libraries/:libraryId/items`

**Authentication:** Required (Bearer Token)
**Permission:** EDITOR or OWNER access

**Request Body:**
```json
{
  "type": "STAT_BLOCK_DND_5E",
  "name": "Item Name",
  "description": "Optional description",
  "data": { /* type-specific data */ },
  "tagIds": [1, 2, 3],
  "userFileIds": [1, 2, 3],
  "featuredImageId": 1
}
```

**Response (201):**
```json
{
  "message": "Item created successfully",
  "item": {
    "id": 1,
    "libraryId": 1,
    "type": "STAT_BLOCK_DND_5E",
    "name": "Item Name",
    "description": "Optional description",
    "data": { /* type-specific data */ },
    "tags": [
      { "id": 1, "name": "Combat", "color": "#FF0000", "libraryId": 1 }
    ],
    "featuredImage": {
      "id": 1,
      "userId": 1,
      "fileUrl": "users/1/uploads/image.png",
      "fileName": "image.png",
      "fileType": "image/png",
      "fileSize": 12345,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "userFiles": [
      {
        "id": 2,
        "userId": 1,
        "fileUrl": "users/1/uploads/document.pdf",
        "fileName": "document.pdf",
        "fileType": "application/pdf",
        "fileSize": 54321,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Get All Library Items
**GET** `/api/libraries/:libraryId/items`

**Authentication:** Required (Bearer Token)
**Permission:** VIEWER, EDITOR, or OWNER access

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "libraryId": 1,
      "type": "STAT_BLOCK_DND_5E",
      "name": "Goblin Warrior",
      "description": "A basic goblin",
      "data": { /* ... */ },
      "tags": [ /* ... */ ],
      "featuredImage": { /* UserFile object or null */ },
      "userFiles": [ /* Array of UserFile objects */ ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Single Library Item
**GET** `/api/libraries/:libraryId/items/:itemId`

**Authentication:** Required (Bearer Token)
**Permission:** VIEWER, EDITOR, or OWNER access

**Response (200):**
```json
{
  "item": {
    "id": 1,
    "libraryId": 1,
    "type": "STAT_BLOCK_DND_5E",
    "name": "Goblin Warrior",
    "description": "A basic goblin",
    "data": { /* ... */ },
    "tags": [ /* ... */ ],
    "featuredImage": { /* UserFile object or null */ },
    "userFiles": [ /* Array of UserFile objects */ ],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update Library Item
**PUT** `/api/libraries/:libraryId/items/:itemId`

**Authentication:** Required (Bearer Token)
**Permission:** EDITOR or OWNER access

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "data": { /* updated type-specific data */ },
  "tagIds": [1, 2],
  "userFileIds": [1, 2, 3],
  "featuredImageId": 1
}
```

**Note:** To remove the featured image, set `featuredImageId` to `null`.

**Response (200):**
```json
{
  "message": "Item updated successfully",
  "item": { /* updated item */ }
}
```

### Delete Library Item
**DELETE** `/api/libraries/:libraryId/items/:itemId`

**Authentication:** Required (Bearer Token)
**Permission:** EDITOR or OWNER access

**Response:** 204 No Content

## Custom Fields

All item types support custom fields beyond the required ones. This allows you to extend the data structure to fit your specific needs:

```json
{
  "type": "STAT_BLOCK_DND_5E",
  "name": "Goblin Warrior",
  "data": {
    "cr": "1/4",
    "hp": 7,
    "ac": 15,
    "speed": "30 ft.",
    
    // Custom fields
    "customFields": {
      "morale": "low",
      "tactics": "Hit and run",
      "treasure": "10 gp, rusty dagger"
    },
    "encounterNotes": "Often found in groups of 3-6",
    "soundEffect": "https://example.com/goblin-sound.mp3"
  }
}
```

## Validation

All items are validated against type-specific schemas:
- Missing required fields will result in a 400 error
- Invalid field types will result in a 400 error
- Custom fields are always allowed and not validated

## Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid data for item type",
  "details": [
    "cr: must have required property",
    "hp: must be number"
  ]
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "error": "Item not found"
}
```

**500 Server Error:**
```json
{
  "error": "Failed to create item",
  "message": "Database connection error"
}
```

## Tags

Items can be tagged for organization. Tags must exist in the library before being assigned to items. When updating an item with `tagIds`, all existing tags are replaced with the new set.

See the Tags API documentation for managing tags.

## Files

Library items can have associated files (UserFiles) and a featured image:

- **`userFileIds`**: Array of UserFile IDs to associate with the item. Files must be uploaded first using the Files API. When updating, this replaces all existing file associations.
- **`featuredImageId`**: Optional UserFile ID to use as the featured image. Set to `null` to remove the featured image.

**Important:** Files must be uploaded to the user's account before they can be associated with library items. See the Files API documentation for uploading files.

## Best Practices

1. **Use Descriptive Names:** Item names should be clear and searchable
2. **Add Descriptions:** Help other users understand the item's purpose
3. **Leverage Tags:** Use tags for categorization and filtering
4. **Custom Fields:** Use the `customFields` object for structured custom data
5. **Validation:** Always check validation errors when creating/updating items
6. **Permissions:** Ensure users have appropriate access levels for operations

