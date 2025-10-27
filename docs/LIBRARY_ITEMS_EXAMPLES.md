# Library Items API Examples

## Complete cURL Examples

These examples assume:
- Base URL: `http://localhost:3000`
- You have a valid JWT token stored in `$TOKEN`
- Library ID: `1`

### 1. Create a Stat Block (Goblin Warrior)

```bash
curl -X POST http://localhost:3000/api/libraries/1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "STAT_BLOCK_DND_5E",
    "name": "Goblin Warrior",
    "description": "A basic goblin warrior for low-level encounters",
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
      "type": "humanoid (goblinoid)",
      "alignment": "neutral evil",
      "languages": "Common, Goblin",
      "senses": "darkvision 60 ft., passive Perception 9",
      "actions": [
        {
          "name": "Scimitar",
          "roll": "1d20+4",
          "range": "5 ft.",
          "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6+2) slashing damage."
        },
        {
          "name": "Shortbow",
          "roll": "1d20+4",
          "range": "80/320 ft.",
          "description": "Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6+2) piercing damage."
        }
      ],
      "traits": [
        {
          "name": "Nimble Escape",
          "description": "The goblin can take the Disengage or Hide action as a bonus action on each of its turns."
        }
      ]
    },
    "tagIds": [1, 2]
  }'
```

### 2. Create a Note (Session Notes)

```bash
curl -X POST http://localhost:3000/api/libraries/1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "NOTE",
    "name": "Session 5 - The Ancient Temple",
    "description": "Key plot points and events from session 5",
    "data": {
      "content": "# Session 5: The Ancient Temple\n\n## Key Events\n- Party arrived at the Temple of the Forgotten Gods\n- Met the mysterious hermit Zephyr\n- Discovered the first piece of the Sundering Crystal\n\n## Important NPCs\n- **Zephyr**: Hermit living in the temple, knows about the prophecy\n- **Captain Thorne**: Mentioned as being in pursuit\n\n## Next Session\n- Explore the lower levels of the temple\n- Decipher the ancient inscriptions\n- Deal with the guardian creature",
      "format": "markdown",
      "isPinned": true,
      "category": "Session Notes"
    },
    "tagIds": [3]
  }'
```

### 3. Create a Magic Item (Flame Tongue)

```bash
curl -X POST http://localhost:3000/api/libraries/1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ITEM_DND_5E",
    "name": "Flame Tongue",
    "description": "A legendary blade that erupts in flames on command",
    "data": {
      "rarity": "rare",
      "itemType": "weapon (longsword)",
      "attunement": true,
      "value": "5000 gp",
      "weight": 3,
      "damage": "1d8 slashing (1d10 versatile) + 2d6 fire",
      "properties": ["versatile", "finesse"],
      "effect": "You can use a bonus action to speak this magic swords command word, causing flames to erupt from the blade. These flames shed bright light in a 40-foot radius and dim light for an additional 40 feet. While the sword is ablaze, it deals an extra 2d6 fire damage to any target it hits. The flames last until you use a bonus action to speak the command word again or until you drop or sheathe the sword.",
      "customFields": {
        "foundIn": "Temple of the Forgotten Gods, Session 5",
        "currentOwner": "Eldrin Brightwood",
        "history": "Forged by the legendary smith Thalamar during the Dragon Wars"
      }
    },
    "tagIds": [4, 5]
  }'
```

### 4. Create a Character (Player Character)

```bash
curl -X POST http://localhost:3000/api/libraries/1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CHARACTER_DND_5E",
    "name": "Eldrin Brightwood",
    "description": "High Elf Wizard specializing in evocation magic",
    "data": {
      "level": 5,
      "class": "Wizard",
      "race": "High Elf",
      "subclass": "School of Evocation",
      "background": "Sage",
      "playerName": "John Smith",
      "alignment": "Lawful Good",
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
      "size": "Medium",
      "languages": "Common, Elvish, Draconic, Celestial",
      "equipment": [
        {
          "name": "Flame Tongue",
          "type": "weapon",
          "equipped": true,
          "attuned": true
        },
        {
          "name": "Spellbook",
          "type": "gear",
          "equipped": true
        },
        {
          "name": "Component Pouch",
          "type": "gear",
          "equipped": true
        },
        {
          "name": "Robes of the Archmagi",
          "type": "armor",
          "equipped": true,
          "attuned": true
        }
      ],
      "spells": [
        { "name": "Prestidigitation", "level": 0, "school": "Transmutation", "prepared": true },
        { "name": "Fire Bolt", "level": 0, "school": "Evocation", "prepared": true },
        { "name": "Mage Hand", "level": 0, "school": "Conjuration", "prepared": true },
        { "name": "Magic Missile", "level": 1, "school": "Evocation", "prepared": true },
        { "name": "Shield", "level": 1, "school": "Abjuration", "prepared": true },
        { "name": "Fireball", "level": 3, "school": "Evocation", "prepared": true },
        { "name": "Counterspell", "level": 3, "school": "Abjuration", "prepared": true }
      ],
      "features": [
        {
          "name": "Arcane Recovery",
          "description": "Once per day when you finish a short rest, you can recover spell slots with a combined level equal to or less than half your wizard level (rounded up)."
        },
        {
          "name": "Sculpt Spells",
          "description": "When you cast an evocation spell that affects other creatures you can see, you can choose a number of them equal to 1 + the spells level. The chosen creatures automatically succeed on their saving throws."
        },
        {
          "name": "Potent Cantrip",
          "description": "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip, it takes half the cantrips damage."
        }
      ],
      "customFields": {
        "personality": "Curious and methodical, always seeking knowledge",
        "ideals": "Knowledge is the path to power and self-improvement",
        "bonds": "I have an ancient tome that contains secrets of the multiverse",
        "flaws": "I overlook obvious solutions in favor of complicated ones"
      }
    },
    "tagIds": [6, 7]
  }'
```

### 5. Create a Complex Stat Block (Ancient Red Dragon)

```bash
curl -X POST http://localhost:3000/api/libraries/1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "STAT_BLOCK_DND_5E",
    "name": "Ancient Red Dragon",
    "description": "A massive and terrifying ancient red dragon",
    "data": {
      "cr": "24",
      "hp": 546,
      "ac": 22,
      "speed": "40 ft., climb 40 ft., fly 80 ft.",
      "str": 30,
      "dex": 10,
      "con": 29,
      "int": 18,
      "wis": 15,
      "cha": 23,
      "size": "Gargantuan",
      "type": "dragon",
      "alignment": "chaotic evil",
      "languages": "Common, Draconic",
      "senses": "blindsight 60 ft., darkvision 120 ft., passive Perception 26",
      "traits": [
        {
          "name": "Legendary Resistance (3/Day)",
          "description": "If the dragon fails a saving throw, it can choose to succeed instead."
        },
        {
          "name": "Fire Aura",
          "description": "At the start of each of the dragons turns, each creature within 10 feet of it takes 16 (3d10) fire damage."
        }
      ],
      "actions": [
        {
          "name": "Multiattack",
          "description": "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
        },
        {
          "name": "Bite",
          "roll": "1d20+17",
          "range": "15 ft.",
          "description": "Melee Weapon Attack: +17 to hit, reach 15 ft., one target. Hit: 21 (2d10+10) piercing damage plus 14 (4d6) fire damage."
        },
        {
          "name": "Claw",
          "roll": "1d20+17",
          "range": "10 ft.",
          "description": "Melee Weapon Attack: +17 to hit, reach 10 ft., one target. Hit: 17 (2d6+10) slashing damage."
        },
        {
          "name": "Tail",
          "roll": "1d20+17",
          "range": "20 ft.",
          "description": "Melee Weapon Attack: +17 to hit, reach 20 ft., one target. Hit: 19 (2d8+10) bludgeoning damage."
        },
        {
          "name": "Frightful Presence",
          "description": "Each creature of the dragons choice within 120 feet of it must succeed on a DC 21 Wisdom saving throw or become frightened for 1 minute."
        },
        {
          "name": "Fire Breath (Recharge 5-6)",
          "description": "The dragon exhales fire in a 90-foot cone. Each creature in that area must make a DC 24 Dexterity saving throw, taking 91 (26d6) fire damage on a failed save, or half as much on a successful one."
        }
      ],
      "legendaryActions": [
        {
          "name": "Detect",
          "description": "The dragon makes a Wisdom (Perception) check."
        },
        {
          "name": "Tail Attack",
          "description": "The dragon makes a tail attack."
        },
        {
          "name": "Wing Attack (Costs 2 Actions)",
          "description": "The dragon beats its wings. Each creature within 15 feet must succeed on a DC 25 Dexterity saving throw or take 17 (2d6+10) bludgeoning damage and be knocked prone."
        }
      ]
    },
    "tagIds": [8, 9]
  }'
```

### 6. Get All Items in a Library

```bash
curl -X GET http://localhost:3000/api/libraries/1/items \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Get a Single Item

```bash
curl -X GET http://localhost:3000/api/libraries/1/items/5 \
  -H "Authorization: Bearer $TOKEN"
```

### 8. Update an Item (Change HP and AC)

```bash
curl -X PUT http://localhost:3000/api/libraries/1/items/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Goblin Warrior (Elite)",
    "data": {
      "cr": "1/2",
      "hp": 15,
      "ac": 16,
      "speed": "30 ft.",
      "str": 10,
      "dex": 16,
      "con": 12
    }
  }'
```

### 9. Update Item Tags

```bash
curl -X PUT http://localhost:3000/api/libraries/1/items/5 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tagIds": [1, 2, 4, 5]
  }'
```

### 10. Delete an Item

```bash
curl -X DELETE http://localhost:3000/api/libraries/1/items/5 \
  -H "Authorization: Bearer $TOKEN"
```

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
const API_BASE = 'http://localhost:3000/api';
const token = 'your-jwt-token-here';

// Create a stat block
async function createStatBlock() {
  const response = await fetch(`${API_BASE}/libraries/1/items`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'STAT_BLOCK_DND_5E',
      name: 'Goblin Warrior',
      description: 'A basic goblin warrior',
      data: {
        cr: '1/4',
        hp: 7,
        ac: 15,
        speed: '30 ft.',
        str: 8,
        dex: 14,
        con: 10,
        int: 10,
        wis: 8,
        cha: 8
      },
      tagIds: [1, 2]
    })
  });
  
  const result = await response.json();
  console.log('Created item:', result.item);
}

// Get all items
async function getAllItems() {
  const response = await fetch(`${API_BASE}/libraries/1/items`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  console.log('Items:', result.items);
}

// Update an item
async function updateItem(itemId: number) {
  const response = await fetch(`${API_BASE}/libraries/1/items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Updated Name',
      data: {
        cr: '1/2',
        hp: 15,
        ac: 16,
        speed: '30 ft.'
      }
    })
  });
  
  const result = await response.json();
  console.log('Updated item:', result.item);
}

// Delete an item
async function deleteItem(itemId: number) {
  const response = await fetch(`${API_BASE}/libraries/1/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 204) {
    console.log('Item deleted successfully');
  }
}
```

## Python Examples

```python
import requests
import json

API_BASE = 'http://localhost:3000/api'
token = 'your-jwt-token-here'

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Create a stat block
def create_stat_block():
    data = {
        'type': 'STAT_BLOCK_DND_5E',
        'name': 'Goblin Warrior',
        'description': 'A basic goblin warrior',
        'data': {
            'cr': '1/4',
            'hp': 7,
            'ac': 15,
            'speed': '30 ft.',
            'str': 8,
            'dex': 14,
            'con': 10,
            'int': 10,
            'wis': 8,
            'cha': 8
        },
        'tagIds': [1, 2]
    }
    
    response = requests.post(
        f'{API_BASE}/libraries/1/items',
        headers=headers,
        json=data
    )
    
    if response.status_code == 201:
        print('Created item:', response.json()['item'])
    else:
        print('Error:', response.json())

# Get all items
def get_all_items():
    response = requests.get(
        f'{API_BASE}/libraries/1/items',
        headers=headers
    )
    
    if response.status_code == 200:
        items = response.json()['items']
        print(f'Found {len(items)} items')
        for item in items:
            print(f"- {item['name']} ({item['type']})")

# Update an item
def update_item(item_id):
    data = {
        'name': 'Updated Name',
        'data': {
            'cr': '1/2',
            'hp': 15,
            'ac': 16,
            'speed': '30 ft.'
        }
    }
    
    response = requests.put(
        f'{API_BASE}/libraries/1/items/{item_id}',
        headers=headers,
        json=data
    )
    
    if response.status_code == 200:
        print('Updated item:', response.json()['item'])

# Delete an item
def delete_item(item_id):
    response = requests.delete(
        f'{API_BASE}/libraries/1/items/{item_id}',
        headers=headers
    )
    
    if response.status_code == 204:
        print('Item deleted successfully')

if __name__ == '__main__':
    create_stat_block()
    get_all_items()
```

## Testing with Postman

1. **Create a Collection:** "Library Items API"
2. **Set Collection Variables:**
   - `baseUrl`: `http://localhost:3000/api`
   - `token`: Your JWT token
   - `libraryId`: Your library ID

3. **Add Requests:**
   - POST Create Item
   - GET All Items
   - GET Single Item
   - PUT Update Item
   - DELETE Delete Item

4. **Set Headers:**
   - Authorization: `Bearer {{token}}`
   - Content-Type: `application/json`

5. **Use Pre-request Scripts for Auth:**
```javascript
// Auto-refresh token if needed
const token = pm.collectionVariables.get('token');
if (!token) {
    // Login and get token
    pm.sendRequest({
        url: pm.variables.get('baseUrl') + '/auth/login',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                email: 'user@example.com',
                password: 'password'
            })
        }
    }, (err, res) => {
        if (!err) {
            const accessToken = res.json().accessToken;
            pm.collectionVariables.set('token', accessToken);
        }
    });
}
```

## Error Handling Examples

```typescript
async function createItemWithErrorHandling() {
  try {
    const response = await fetch(`${API_BASE}/libraries/1/items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'STAT_BLOCK_DND_5E',
        name: 'Goblin',
        data: {
          cr: '1/4',
          hp: 7
          // Missing required fields: ac, speed
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      switch (response.status) {
        case 400:
          console.error('Validation error:', error.details);
          break;
        case 401:
          console.error('Not authenticated. Please login.');
          break;
        case 403:
          console.error('Insufficient permissions.');
          break;
        case 404:
          console.error('Library not found.');
          break;
        case 500:
          console.error('Server error:', error.message);
          break;
      }
      
      return;
    }
    
    const result = await response.json();
    console.log('Success:', result.item);
    
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

