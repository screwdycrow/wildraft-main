# Library Items Guide

Flexible JSON schema system that validates **required fields** while allowing **custom fields** for each item type.

## How It Works

Each LibraryItemType has a base schema with required fields. The backend validates these fields exist, but **allows any additional fields** your frontend needs!

```typescript
// ✅ Required fields are validated
// ✅ Custom fields are allowed
// ✅ Frontend can extend items freely
```

## Item Types & Examples

### STAT_BLOCK (Creature/NPC)

**Required fields:** `cr`, `hp`, `ac`, `speed`

**Base example:**
```json
{
  "cr": "5",
  "hp": 82,
  "ac": 15,
  "speed": "30 ft.",
  "str": 18,
  "dex": 11,
  "con": 16,
  "int": 10,
  "wis": 12,
  "cha": 14,
  "type": "humanoid",
  "size": "Medium",
  "alignment": "neutral evil"
}
```

**With custom fields:**
```json
{
  "cr": "5",
  "hp": 82,
  "ac": 15,
  "speed": "30 ft.",
  
  // ✅ Add your own fields!
  "customNotes": "This is my homebrew creature",
  "imageUrl": "https://example.com/image.png",
  "encounterDifficulty": "medium",
  "lootTable": {
    "common": ["gold", "dagger"],
    "rare": ["magic sword"]
  },
  "myCustomField": "whatever you need!"
}
```

### NOTE

**Required fields:** `content`

**Base example:**
```json
{
  "content": "The party discovered a hidden temple...",
  "format": "markdown"
}
```

**With custom fields:**
```json
{
  "content": "The party discovered a hidden temple...",
  "format": "markdown",
  
  // ✅ Custom fields
  "isPinned": true,
  "category": "Session Notes",
  "relatedCharacters": ["Gandalf", "Aragorn"],
  "mapLocation": { "x": 150, "y": 200 },
  "color": "#ff5733",
  "attachments": ["map.png", "sketch.jpg"]
}
```

### ITEM (Equipment/Treasure)

**Required fields:** `rarity`, `itemType`

**Base example:**
```json
{
  "rarity": "rare",
  "itemType": "weapon",
  "attunement": true,
  "damage": "1d8+2 slashing",
  "value": "5000 gp"
}
```

**With custom fields:**
```json
{
  "rarity": "rare",
  "itemType": "weapon",
  
  // ✅ Custom fields
  "ownedBy": "Conan the Barbarian",
  "locationFound": "Dragon's lair, level 3",
  "identifiedBy": "Wizard NPC",
  "customAbilities": [
    { "name": "Flame Strike", "uses": 3 }
  ],
  "questRelated": true,
  "questId": 42,
  "imageSrc": "items/flaming-sword.png"
}
```

### SESSION (Game Session)

**Required fields:** `sessionNumber`, `date`, `summary`

**Base example:**
```json
{
  "sessionNumber": 15,
  "date": "2024-01-15",
  "summary": "The party defeated the dragon and rescued the prince."
}
```

**With custom fields:**
```json
{
  "sessionNumber": 15,
  "date": "2024-01-15",
  "summary": "The party defeated the dragon...",
  
  // ✅ Custom fields
  "duration": "4 hours",
  "attendance": ["Alice", "Bob", "Charlie"],
  "absences": ["Dave - sick"],
  "xpAwarded": 3000,
  "levelUps": ["Alice reached level 6"],
  "inspirationAwarded": ["Bob for creative solution"],
  "funnyMoments": [
    "Bob rolled nat 1 on stealth check"
  ],
  "plotHooks": [
    "Mysterious letter from King",
    "Strange symbol on dragon's lair"
  ],
  "mood": "epic"
}
```

### CHARACTER

**Required fields:** `level`, `class`, `race`

**Base example:**
```json
{
  "level": 5,
  "class": "Wizard",
  "race": "Elf",
  "hp": 32,
  "maxHp": 32,
  "ac": 14
}
```

**With custom fields:**
```json
{
  "level": 5,
  "class": "Wizard",
  "race": "Elf",
  
  // ✅ Custom fields
  "pronouns": "they/them",
  "personality": "Curious and cautious",
  "backstory": "Raised in the Elvish academy...",
  "goals": ["Find the ancient spellbook", "Avenge mentor"],
  "fears": ["Deep water", "Undead"],
  "bonds": ["Owes debt to party rogue"],
  "appearance": {
    "height": "5'8\"",
    "hairColor": "silver",
    "eyeColor": "violet",
    "distinguishingMarks": "Arcane tattoos on arms"
  },
  "favoriteSpell": "Fireball",
  "petName": "Mr. Whiskers the cat familiar",
  "characterArtUrl": "characters/elven-wizard.png",
  "voiceClaim": "British accent, low pitch"
}
```

### CAMPAIGN

**Required fields:** `setting`, `startDate`, `status`

**Base example:**
```json
{
  "setting": "Forgotten Realms",
  "startDate": "2024-01-01",
  "status": "active"
}
```

**With custom fields:**
```json
{
  "setting": "Forgotten Realms",
  "startDate": "2024-01-01",
  "status": "active",
  
  // ✅ Custom fields
  "theme": "Political intrigue and dragons",
  "endGoal": "Defeat the Shadow King",
  "currentArc": "Investigation in Waterdeep",
  "sessionFrequency": "Weekly on Fridays",
  "househRules": [
    "Flanking gives advantage",
    "Critical fails on skill checks"
  ],
  "bannedContent": ["pvp", "romance"],
  "safetyTools": ["X-card", "Lines and veils"],
  "campaignLogo": "campaigns/shadow-king.png",
  "playlist": "https://spotify.com/playlist/abc123",
  "worldMapUrl": "maps/faerun.jpg",
  "inspirations": ["Game of Thrones", "Lord of the Rings"]
}
```

## API Usage

### Create Item

```bash
POST /api/libraries/:libraryId/items
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "type": "STAT_BLOCK",
  "name": "Ancient Red Dragon",
  "description": "A fearsome ancient dragon",
  "data": {
    // Required fields
    "cr": "24",
    "hp": 546,
    "ac": 22,
    "speed": "40 ft., fly 80 ft.",
    
    // Add whatever custom fields you want!
    "lairLocation": "Volcano Peak",
    "personalityTraits": "Arrogant and cruel",
    "voiceDescription": "Deep and rumbling",
    "favoriteHoard": "Magical artifacts",
    "weaknesses": ["Cold iron weapons"]
  },
  "tagIds": [1, 5, 8]
}
```

### Response

```json
{
  "message": "Item created successfully",
  "item": {
    "id": 1,
    "libraryId": 3,
    "type": "STAT_BLOCK",
    "name": "Ancient Red Dragon",
    "description": "A fearsome ancient dragon",
    "data": {
      "cr": "24",
      "hp": 546,
      "ac": 22,
      "speed": "40 ft., fly 80 ft.",
      "lairLocation": "Volcano Peak",
      "personalityTraits": "Arrogant and cruel",
      // ... all your custom fields preserved!
    },
    "tags": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

## Validation Errors

If you forget required fields:

```bash
POST /api/libraries/1/items
{
  "type": "STAT_BLOCK",
  "name": "Dragon",
  "data": {
    "hp": 100
    // Missing: cr, ac, speed
  }
}
```

**Response:**
```json
{
  "error": "Invalid data for item type",
  "details": [
    "data: must have required property 'cr'",
    "data: must have required property 'ac'",
    "data: must have required property 'speed'"
  ]
}
```

## Frontend Integration

```typescript
// TypeScript example
interface StatBlockData {
  // Required fields (validated by backend)
  cr: string;
  hp: number;
  ac: number;
  speed: string;
  
  // Your custom fields (whatever you need!)
  [key: string]: any;
}

// Create with custom fields
const statBlock: StatBlockData = {
  cr: "5",
  hp: 82,
  ac: 15,
  speed: "30 ft.",
  
  // Add your app-specific fields
  favorited: true,
  userId: 123,
  imageUrl: "/creatures/goblin.png",
  lastUsedInSession: 15,
  customNotes: "Talks with a funny accent",
  myAppSpecificData: { foo: "bar" }
};

await fetch('/api/libraries/1/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'STAT_BLOCK',
    name: 'Goblin Boss',
    data: statBlock // All fields preserved!
  })
});
```

## Benefits

✅ **Backend validates core structure** - Ensures data integrity  
✅ **Frontend adds custom fields** - No backend changes needed  
✅ **Type-safe on both ends** - TypeScript support  
✅ **Flexible and extensible** - Grow with your app  
✅ **No migration headaches** - Add fields anytime  

## Best Practices

1. **Use `customFields` object** for truly dynamic data:
```json
{
  "cr": "5",
  "hp": 100,
  "ac": 15,
  "speed": "30 ft.",
  "customFields": {
    "whatever": "you want",
    "can": "go here"
  }
}
```

2. **Add `version` field** for schema evolution:
```json
{
  "version": "1.0",
  "cr": "5",
  ...
}
```

3. **Document your custom fields** in your frontend codebase

4. **Consider namespacing** app-specific fields:
```json
{
  "cr": "5",
  "myApp:userId": 123,
  "myApp:imageUrl": "/image.png"
}
```

## Need to Change Required Fields?

Update `src/lib/item-schemas.ts` and the backend will start validating the new requirements. Existing data is preserved!

For complete API docs, visit http://localhost:3000/docs









