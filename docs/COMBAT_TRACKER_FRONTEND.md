# Combat Tracker Frontend Implementation

## Overview

The Combat Tracker is a comprehensive system for managing D&D 5E combat encounters within the library. It provides real-time combat management with initiative tracking, HP management, conditions, and custom counters.

## Architecture

### 1. Types (`src/types/combat.types.ts`)

Defines TypeScript interfaces for the combat system:

- **`Combatant`**: Individual combatant with stats, conditions, and optional library item binding
  - `id`: Unique identifier
  - `name`: Display name
  - `initiative`: Initiative roll value
  - `initiativeOrder`: Optional sorting order
  - `hp` / `currentHp`: Current hit points
  - `maxHp`: Maximum hit points
  - `ac`: Armor class
  - `conditions`: Array of condition strings
  - `isPlayer`: Boolean flag for PC vs NPC
  - `libraryItemId`: Optional reference to library item
  - `libraryItem`: Full library item JSON data if bound
  - `customCounters`: Per-combatant counters

- **`CombatCounter`**: Custom counter for tracking mechanics
  - Legendary Actions, Spell Slots, etc.

- **`CombatEncounter`**: Full encounter data
  - `combatants`: Array of combatants
  - `counters`: Global encounter counters
  - `round`: Current round number
  - `initativeCount`: Turn tracking

- **`DND_CONDITIONS`**: Pre-defined D&D 5E conditions

### 2. API Service (`src/api/combatEncounters.ts`)

REST API client for combat encounters:

- `getAll(libraryId)`: Fetch all encounters
- `getById(libraryId, encounterId)`: Fetch single encounter
- `create(libraryId, data)`: Create new encounter
- `update(libraryId, encounterId, data)`: Update encounter
- `delete(libraryId, encounterId)`: Delete encounter

### 3. Store (`src/stores/combatEncounters.ts`)

Pinia store for state management:

**State:**
- `encounters`: Array of all encounters
- `activeEncounterId`: Currently selected encounter ID
- `isLoading`: Loading state
- `error`: Error message

**Getters:**
- `activeEncounter`: The currently active encounter
- `sortedEncounters`: Encounters sorted by update time
- `latestEncounter`: Most recently updated encounter

**Actions:**
- `fetchEncounters()`: Load all encounters
- `createEncounter()`: Create and auto-select new encounter
- `updateEncounter()`: Update encounter data
- `deleteEncounter()`: Delete and auto-select next
- `setActiveEncounter()`: Manually set active encounter
- `clearEncounters()`: Reset on library change

**Auto-Selection Logic:**
- When loading encounters, auto-selects latest if none selected
- When creating encounter, auto-selects the new one
- When deleting active encounter, auto-selects latest remaining

### 4. Composable (`src/composables/useCombat.ts`)

Provides methods for managing combatants in the active encounter:

**Core Methods:**

- **`addToActiveEncounter(libraryItem, customName?)`**
  - Adds a library item (character/stat block) as a combatant
  - Extracts HP and AC from item data
  - Rolls initiative automatically
  - Binds full library item JSON
  - Sorts by initiative (highest first)

- **`removeFromActiveEncounter(combatantId)`**
  - Removes a combatant from the encounter

- **`rollInitiativeForCombatant(combatantId)`**
  - Re-rolls initiative for a specific combatant
  - Re-sorts initiative order

- **`updateCombatant(combatantId, partialData)`**
  - Updates combatant with partial data
  - Re-sorts if initiative changed
  - Can update HP, conditions, notes, etc.

- **`addCustomCombatant(combatantData)`**
  - Creates a custom combatant not bound to library item
  - Useful for quick NPCs or monsters

**Utility Methods:**

- `nextRound()`: Advance to next round
- `resetEncounter()`: Reset to round 1
- `generateCombatantId()`: Generate unique IDs
- `rollInitiative()`: Roll 1d20

**Data Extraction:**

The composable intelligently extracts stats from library items:

```typescript
// For stat blocks
itemData.hp, itemData.ac

// For characters
itemData.stats.hp, itemData.stats.ac
```

### 5. Component (`src/components/combat/CombatEncounter.vue`)

Sidebar component for combat management:

**Features:**

- **Active Encounter Display:**
  - Shows current encounter name
  - Displays round number and combatant count
  - Quick actions menu (switch, delete)

- **Create Encounter Dialog:**
  - Name and description fields
  - Auto-activates on creation

- **Manage Encounters Dialog:**
  - List all encounters
  - Switch active encounter
  - Delete encounters
  - Visual indicator for active encounter

**State:**
- Auto-loads encounters on mount
- Syncs with global store
- Shows empty state when no encounters

**Integration:**
- Mounted in right sidebar of `LibraryLayout.vue`
- Full height with scrollable content
- Toast notifications for actions

## Usage Examples

### Adding a Stat Block to Combat

```typescript
import { useCombat } from '@/composables/useCombat'

const { addToActiveEncounter } = useCombat()

// Add a goblin stat block
await addToActiveEncounter(goblinStatBlock)
```

### Adding a Character to Combat

```typescript
// Add a player character
await addToActiveEncounter(playerCharacter)
```

### Updating Combatant HP

```typescript
const { updateCombatant } = useCombat()

// Take damage
await updateCombatant('combatant-123', {
  hp: 25, // New HP value
})
```

### Adding Conditions

```typescript
// Add poisoned condition
await updateCombatant('combatant-123', {
  conditions: ['poisoned', 'prone']
})
```

### Rolling Initiative

```typescript
const { rollInitiativeForCombatant } = useCombat()

const newInit = await rollInitiativeForCombatant('combatant-123')
console.log(`Rolled ${newInit}`)
```

### Creating Custom Combatant

```typescript
const { addCustomCombatant } = useCombat()

await addCustomCombatant({
  name: 'Bandit Leader',
  maxHp: 45,
  ac: 15,
  isPlayer: false,
})
```

## Data Flow

1. **Component** calls `useCombat()` composable
2. **Composable** reads `activeEncounter` from store
3. **Composable** modifies combatants array
4. **Composable** calls store's `updateEncounter()`
5. **Store** calls API service
6. **API** updates backend
7. **Store** updates local state
8. **Component** reactively updates UI

## Global State

The combat tracker maintains a **global active encounter** that persists across:
- Navigation within the library
- Component mounting/unmounting
- Route changes

Access the active encounter anywhere in the app:

```typescript
import { useCombat } from '@/composables/useCombat'

const { activeEncounter } = useCombat()

if (activeEncounter.value) {
  // Use active encounter data
}
```

## Library Item Binding

Combatants can be bound to library items in two ways:

1. **By Reference** (`libraryItemId`): Just stores the item ID
2. **With Data** (`libraryItem`): Stores full item JSON

The composable automatically stores the full library item JSON when adding via `addToActiveEncounter()`, allowing you to access stat block data without additional API calls.

## Future Enhancements

Potential additions:

- **Combat Log**: Track all actions during combat
- **Turn Tracker**: Visual indicator of current turn
- **Quick Actions**: Damage/heal buttons
- **Condition Management**: Add/remove conditions UI
- **Counter Management**: Edit global and per-combatant counters
- **Initiative Reordering**: Drag-and-drop initiative order
- **Combatant Details**: Expandable stat block view
- **Portal View Integration**: Display combat to players
- **Import from Compendium**: Quick add monsters
- **Templates**: Save encounter templates

## Best Practices

1. **Always use the composable**: Don't manipulate combatants directly
2. **Update partial data**: Only send changed fields to `updateCombatant()`
3. **Handle errors**: Wrap composable calls in try-catch
4. **Toast feedback**: Show user feedback for all actions
5. **Confirm deletions**: Always confirm destructive actions

## API Compatibility

This implementation follows the backend API specification in:
`docs/COMBAT_ENCOUNTERS_API.md`

Key differences:
- Frontend normalizes `hp`/`currentHp` (backend uses `hp`)
- Frontend adds `initiativeOrder` for UI sorting
- Frontend stores full `libraryItem` JSON for offline access

