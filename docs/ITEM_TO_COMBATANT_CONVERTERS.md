# Item-to-Combatant Converter System

## Overview

The Item-to-Combatant Converter System provides a flexible, type-specific way to convert `LibraryItem` objects into `Combatant` objects for the combat tracker. Each item type can define its own conversion logic, with a smart generic fallback for unknown types.

## Architecture

### Flow Diagram

```
LibraryItem (any type)
    ↓
useItemComponents.convertItemToCombatant()
    ↓
getItemToCombatantConverter(itemType)
    ↓
[Type-Specific Converter] OR [Generic Fallback]
    ↓
Combatant object
    ↓
useCombat.addToActiveEncounter()
    ↓
Combat Tracker
```

## Converter Function Type

```typescript
export type ItemToCombatantConverter = (
  libraryItem: LibraryItem,
  combatantId: string,
  customName?: string
) => Omit<Combatant, 'id'> & { id?: string }
```

**Parameters:**
- `libraryItem`: The source library item
- `combatantId`: Unique ID for the combatant
- `customName`: Optional name override

**Returns:**
- Combatant data (without initiative, which is rolled separately)

## Built-in Converters

### 1. STAT_BLOCK_DND_5E Converter

Converts D&D 5E stat blocks (monsters, NPCs) into combatants.

**Data Extraction:**
```typescript
{
  name: customName || libraryItem.name,
  hp: data.hp,
  maxHp: data.hp,
  ac: data.ac,
  isPlayer: false,
  customCounters: data.customCounters || []
}
```

**Features:**
- Parses HP/AC from stat block data
- Automatically marks as non-player
- Preserves custom counters (Legendary Actions, etc.)
- Handles both number and string HP values

### 2. CHARACTER_DND_5E Converter

Converts D&D 5E characters into combatants.

**Data Extraction (Multiple Paths):**
```typescript
hp: data.hp || data.maxHp || data.stats?.hp || data.stats?.maxHp
maxHp: data.maxHp || data.hp || data.stats?.maxHp || data.stats?.hp
ac: data.ac || data.stats?.ac
```

**Features:**
- Tries multiple paths for HP/AC (handles various character sheet formats)
- Automatically marks as player
- Preserves custom counters (Ki Points, Sorcery Points, etc.)
- Flexible data structure support

### 3. ITEM_DND_5E Converter

Converts magic items into combatants (for tracking animated items, etc.).

**Data Extraction:**
```typescript
{
  name: customName || libraryItem.name,
  hp: 0,
  maxHp: 0,  // No HP for items
  ac: 0,
  isPlayer: false
}
```

**Features:**
- Sets HP to 0 (items don't have HP by default)
- Used for tracking non-combat items in initiative
- Can be used for animated objects if HP is added manually

### 4. NOTE Converter

Converts notes into combatants (for tracking environmental effects, timers, etc.).

**Data Extraction:**
```typescript
{
  name: customName || libraryItem.name,
  hp: 0,
  maxHp: 0,  // No HP for notes
  ac: 0,
  isPlayer: false
}
```

**Features:**
- Sets HP to 0
- Useful for initiative-based environmental effects
- Can represent traps, hazards, lair actions, etc.

### 5. Generic Fallback Converter

Handles all unknown item types with intelligent data extraction.

**Data Extraction Logic:**
```typescript
// Try direct properties
data.hp → hp and maxHp
data.maxHp → maxHp
data.ac → ac

// Try nested stats object
data.stats.hp → hp and maxHp
data.stats.maxHp → maxHp
data.stats.ac → ac

// Preserve
data.customCounters → customCounters
```

**Features:**
- Smart property detection
- Handles both flat and nested data structures
- Gracefully handles missing properties (defaults: hp=0, maxHp=0, ac=10)
- Type-safe parsing (handles strings and numbers)
- Preserves custom counters if present

## Usage

### In useCombat Composable

The converter is automatically used when adding items to combat:

```typescript
import { useCombat } from '@/composables/useCombat'

const { addToActiveEncounter } = useCombat()

// Add a stat block
await addToActiveEncounter(goblinStatBlock)

// Add with custom name
await addToActiveEncounter(goblinStatBlock, "Goblin Chief")

// Add a character
await addToActiveEncounter(playerCharacter)

// Add any item type (uses appropriate converter)
await addToActiveEncounter(anyLibraryItem)
```

### Direct Converter Access

You can also use converters directly:

```typescript
import { useItemComponents } from '@/composables/useItemComponents'

const { 
  convertItemToCombatant,
  getItemToCombatantConverter 
} = useItemComponents()

// Convert directly
const combatantData = convertItemToCombatant(
  libraryItem,
  'combatant-123',
  'Custom Name'
)

// Get converter function
const converter = getItemToCombatantConverter('STAT_BLOCK_DND_5E')
const data = converter(libraryItem, 'combatant-123')
```

## Adding Custom Converters

### Example: Custom Spell Converter

```typescript
// In useItemComponents.ts

const itemToCombatantConverters: Partial<Record<ItemType, ItemToCombatantConverter>> = {
  // ... existing converters
  
  SPELL_DND_5E: (libraryItem, combatantId, customName) => {
    const data = libraryItem.data as any
    
    return {
      id: combatantId,
      name: customName || libraryItem.name,
      initiative: 0,
      hp: 0, // Spells don't have HP
      maxHp: 0,
      ac: 0,
      conditions: [],
      notes: `Duration: ${data.duration || 'Instantaneous'}`,
      isPlayer: false,
      libraryItemId: libraryItem.id,
      libraryItem: libraryItem,
      customCounters: data.concentration ? [{
        id: 'concentration',
        name: 'Concentration',
        value: 1,
        max: 1,
        color: '#9B59B6'
      }] : []
    }
  },
}
```

### Example: Custom Vehicle Converter

```typescript
VEHICLE: (libraryItem, combatantId, customName) => {
  const data = libraryItem.data as any
  
  return {
    id: combatantId,
    name: customName || libraryItem.name,
    initiative: 0,
    hp: data.hullPoints || 0,
    maxHp: data.hullPoints || 0,
    ac: data.armorClass || 15,
    conditions: [],
    notes: `Speed: ${data.speed || '0 ft'}`,
    isPlayer: false,
    libraryItemId: libraryItem.id,
    libraryItem: libraryItem,
    customCounters: [
      {
        id: 'crew',
        name: 'Crew',
        value: data.currentCrew || 0,
        max: data.crewCapacity || 0,
        icon: 'mdi-account-group'
      }
    ]
  }
}
```

## Converter Best Practices

### 1. Type Safety

Always handle both string and number types:

```typescript
// BAD
hp: data.hp

// GOOD
hp: typeof data.hp === 'number' ? data.hp : parseInt(data.hp) || 0
```

### 2. Multiple Paths

Try multiple common paths for critical properties:

```typescript
const hp = data.hp || data.hitPoints || data.health || 10
```

### 3. Sensible Defaults

Provide sensible defaults for missing data:

```typescript
{
  hp: data.hp || 0,      // 0 for non-combat entities
  maxHp: data.maxHp || 0,
  ac: data.ac || 10,     // 10 is default AC
  conditions: [],        // Always start with no conditions
  notes: '',             // Empty notes
}
```

### 4. Preserve Library Item Reference

Always include the full library item:

```typescript
{
  libraryItemId: libraryItem.id,
  libraryItem: libraryItem,  // Full reference for display
}
```

### 5. Extract Custom Counters

Preserve item-specific counters:

```typescript
customCounters: data.customCounters || []
```

### 6. Set isPlayer Correctly

```typescript
isPlayer: itemType === 'CHARACTER_DND_5E'  // True for players
isPlayer: false  // False for monsters, NPCs, objects
```

## Data Structure Examples

### Stat Block Data

```typescript
{
  name: "Goblin",
  cr: "1/4",
  hp: 7,
  ac: 15,
  customCounters: [],
  actions: [...],
  traits: [...]
}
```

### Character Data (Flat)

```typescript
{
  name: "Thoren",
  level: 5,
  class: "Fighter",
  hp: 45,
  maxHp: 52,
  ac: 18,
  customCounters: [...]
}
```

### Character Data (Nested)

```typescript
{
  name: "Elara",
  level: 5,
  class: "Druid",
  stats: {
    hp: 38,
    maxHp: 38,
    ac: 14
  },
  customCounters: [...]
}
```

## Integration Points

### With useCombat

The `addToActiveEncounter()` method uses the converter system:

```typescript
// Inside useCombat.ts
const combatantData = convertItemToCombatant(libraryItem, combatantId, customName)

const newCombatant: Combatant = {
  ...combatantData,
  id: combatantId,
  initiative: rollInitiative(), // Added after conversion
} as Combatant
```

### With Combat Display

The converted combatant flows into the display system:

```typescript
CombatEncounter → CombatantWrapper → [Type-Specific Component]
                                          ↓
                                   GenericCombatantLayout
```

## Error Handling

### Missing Data

Converters gracefully handle missing data:

```typescript
// If data.hp is undefined
hp: typeof data.hp === 'number' ? data.hp : parseInt(data.hp) || 0
// Result: 0 (safe default)
```

### Invalid Types

Type checking prevents errors:

```typescript
// Handles "45" or 45
hp: typeof data.hp === 'number' ? data.hp : parseInt(data.hp) || 10
```

### Nested Paths

Safe navigation with optional chaining:

```typescript
hp: data.hp || data.stats?.hp || 10
```

## Testing Converters

### Manual Test

```typescript
const { convertItemToCombatant } = useItemComponents()

const testItem: LibraryItem = {
  id: 1,
  name: "Test Goblin",
  type: "STAT_BLOCK_DND_5E",
  data: {
    hp: 7,
    ac: 15,
    cr: "1/4"
  }
}

const combatant = convertItemToCombatant(testItem, 'test-123')
console.log(combatant)
// Expected: { name: "Test Goblin", hp: 7, maxHp: 7, ac: 15, ... }
```

### Edge Cases to Test

1. **Missing HP/AC**: Should use defaults
2. **String HP/AC**: Should parse correctly
3. **Nested data**: Should extract from nested structures
4. **Custom counters**: Should be preserved
5. **Custom name**: Should override item name
6. **Unknown item type**: Should use generic converter

## Performance Considerations

### Converter Execution

Converters are called:
- Once per item when adding to combat
- Not called during combat updates
- Lightweight (pure functions)

### Caching

The library item is stored in the combatant:

```typescript
libraryItem: libraryItem  // Full item cached
```

This avoids re-fetching or re-converting.

## Future Enhancements

Potential improvements:

- **Validation**: Validate converter output
- **Middleware**: Pre/post-processing hooks
- **Async Converters**: Support async data fetching
- **Converter Chaining**: Compose multiple converters
- **Hot Reload**: Update converters without restart
- **Converter Registry UI**: Visual converter management
- **Import/Export**: Share custom converters

## Summary

The Item-to-Combatant Converter System provides:

✅ **Type-specific conversion** with smart defaults  
✅ **Generic fallback** for unknown types  
✅ **Flexible data extraction** from various structures  
✅ **Easy extension** for new item types  
✅ **Type-safe** with proper error handling  
✅ **Integrated** with combat system  
✅ **Performant** pure functions  

This system ensures that any library item can be added to combat with appropriate stats and behavior based on its type.

