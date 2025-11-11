# Combatant Display System

## Overview

The Combatant Display System provides a flexible, type-specific way to render combatants in the combat tracker. It uses a component registry pattern similar to the item display system, with specialized layouts for different item types and a fallback generic layout.

## Architecture

### Component Hierarchy

```
CombatEncounter.vue
  └─ CombatantWrapper.vue (per combatant)
       └─ [Type-Specific Component] OR GenericCombatantItem.vue
            └─ GenericCombatantLayout.vue
```

## Components

### 1. GenericCombatantLayout.vue

The base layout component that provides the visual structure for all combatants.

**Features:**
- **Featured Image Background**: Semi-transparent background image from `libraryItem.featuredImage`
- **Initiative Badge**: Circular badge displaying initiative value (gradient purple)
- **HP Bar**: Color-coded progress bar (green > 75%, blue > 50%, yellow > 25%, red < 25%)
- **Stats Display**: Compact chips showing HP and AC
- **Conditions**: Small chips for active conditions
- **Actions**: Chips with tooltips showing full action descriptions
  - Icons based on action type (sword, lightning, shield, star)
  - Hover tooltips with attack rolls, DC, range, and description
- **Notes**: Optional notes section
- **Custom Counters**: Display per-combatant counters with icons

**Props:**
```typescript
{
  combatant: Combatant          // Required
  subtitle?: string             // Optional subtitle (e.g., "Medium Dragon • CR 5")
  featuredImage?: string        // Featured image URL
  actions?: Action[]            // Array of actions with tooltips
}
```

**Smart HP Display:**
- Only shows HP bar if `maxHp > 0`
- For items like Notes or Magic Items with no HP, gracefully hides HP section

**Styling:**
- Glass morphism effect
- Player combatants have blue border
- Hover lift effect
- Responsive layout

### 2. Type-Specific Components

#### StatBlockCombatantItem.vue
For `STAT_BLOCK_DND_5E` items.

**Extracted Data:**
- Subtitle: `"Size • Type • CR X"`
- Actions: From `data.actions`
- Featured Image: From `libraryItem.featuredImage`

#### CharacterCombatantItem.vue
For `CHARACTER_DND_5E` items.

**Extracted Data:**
- Subtitle: `"Level X • Class • Race"`
- Actions: From `data.actions`
- Featured Image: From `libraryItem.featuredImage`

#### GenericCombatantItem.vue
For all other item types (Magic Items, Notes, etc.).

**Displayed Data:**
- Name, HP (if applicable), AC
- Featured image if available
- Conditions
- No actions (since generic items don't have structured actions)

### 3. CombatantWrapper.vue

Smart wrapper that selects the appropriate component based on item type.

**Logic:**
```typescript
if (!combatant.libraryItem) {
  // Custom combatant (not bound to library item)
  return GenericCombatantItem
}

const component = getCombatantComponent(itemType)
return component || GenericCombatantItem  // Fallback to generic
```

## Component Registry

Added to `useItemComponents.ts`:

### New Component Type

```typescript
export type ComponentType = 
  | 'card' 
  | 'detail' 
  | 'form' 
  | 'quickView' 
  | 'combatantListItem'  // NEW
```

### Registry Mappings

```typescript
STAT_BLOCK_DND_5E: {
  // ... existing components
  combatantListItem: () => import('.../StatBlockCombatantItem.vue'),
}

CHARACTER_DND_5E: {
  // ... existing components
  combatantListItem: () => import('.../CharacterCombatantItem.vue'),
}

ITEM_DND_5E: {
  // ... existing components
  combatantListItem: () => import('.../GenericCombatantItem.vue'),
}

NOTE: {
  // ... existing components
  combatantListItem: () => import('.../GenericCombatantItem.vue'),
}
```

### New Composable Method

```typescript
getCombatantComponent(itemType: ItemType): Component | null
```

Returns the combatant component for a given item type, or `null` if none exists.

## Usage in CombatEncounter.vue

```vue
<template>
  <div class="combatants-list">
    <combatant-wrapper
      v-for="combatant in activeEncounter.combatants"
      :key="combatant.id"
      :combatant="combatant"
    />
  </div>
</template>
```

## Visual Design

### Initiative Badge
- Gradient purple background (`#667eea` → `#764ba2`)
- Circular, 48px diameter
- Bold white number
- Positioned absolutely on left side

### HP Bar
- 8px height, rounded
- Color-coded by health percentage
- Displays `current/max` text overlay

### Featured Image
- Covers entire background
- 15% opacity
- Background size: cover
- Creates depth and visual interest

### Actions Display
- Outlined chips with icons
- Hover reveals detailed tooltip:
  - Action name and type
  - Attack bonus / DC / Damage roll
  - Range
  - Full description text

### Conditions
- Small tonal chips
- Warning color
- Capitalized text

### Layout
- Glass card with backdrop blur
- Semi-transparent background
- White border with low opacity
- Hover effect: lift + border glow
- Player combatants: Blue border accent

## Item Types Without HP

For item types that don't have HP (Notes, Magic Items without combat stats), the layout intelligently hides the HP section:

```typescript
const showHp = computed(() => {
  return props.combatant.maxHp !== undefined && props.combatant.maxHp > 0
})
```

## Extending the System

### Adding a New Item Type Combatant Component

1. **Create Component** (e.g., `SpellCombatantItem.vue`):

```vue
<template>
  <generic-combatant-layout
    :combatant="combatant"
    :subtitle="subtitle"
    :featured-image="featuredImage"
    :actions="actions"
  />
</template>

<script setup lang="ts">
// Extract spell-specific data
</script>
```

2. **Register in useItemComponents.ts**:

```typescript
SPELL_DND_5E: {
  // ... other components
  combatantListItem: () => import('.../SpellCombatantItem.vue'),
}
```

3. **Done!** The system automatically uses your component.

### Customizing GenericCombatantLayout

The layout accepts a default slot for additional custom content:

```vue
<generic-combatant-layout :combatant="combatant">
  <!-- Custom content here -->
  <div class="custom-section">
    Special ability display
  </div>
</generic-combatant-layout>
```

## Action Icon Mapping

```typescript
{
  action: 'mdi-sword',
  bonus: 'mdi-lightning-bolt',
  reaction: 'mdi-shield-alert',
  legendary: 'mdi-star',
  lair: 'mdi-castle',
}
```

## Tooltip Structure

**Action Tooltip Format:**
```
[Action Name] [Type Chip]
────────────────────────
To Hit: +7  DC: 15  2d8+4
Range: 60 ft

Full description text here that can
span multiple lines with proper formatting.
```

## Styling Variables

```scss
// Initiative badge gradient
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// HP colors
success: > 75%
info: 50-75%
warning: 25-50%
error: < 25%

// Glass effect
background: rgba(255, 255, 255, 0.05)
backdrop-filter: blur(10px)
border: 1px solid rgba(255, 255, 255, 0.1)

// Player accent
border-color: rgba(52, 152, 219, 0.4)
```

## Best Practices

1. **Always provide featured images** for visual richness
2. **Structure actions properly** with all tooltip fields
3. **Use semantic action types** for correct icons
4. **Test with various HP percentages** to see color coding
5. **Consider mobile responsiveness** when adding custom content
6. **Keep subtitles concise** (3 parts max with bullets)
7. **Use custom counters** for tracking resources (Legendary Actions, etc.)

## File Structure

```
src/components/combat/
├── CombatEncounter.vue
└── combatants/
    ├── CombatantWrapper.vue          # Smart selector
    ├── GenericCombatantLayout.vue    # Base layout
    ├── GenericCombatantItem.vue      # Fallback
    ├── StatBlockCombatantItem.vue    # Stat blocks
    └── CharacterCombatantItem.vue    # Characters
```

## Integration Points

- **Item Display System**: Shares component registry pattern
- **Combat Store**: Consumes combatant data
- **useCombat Composable**: Provides data management
- **Library Items**: Sources featured images and data
- **Type System**: Uses `Combatant` interface

## Future Enhancements

Potential improvements:

- **Drag-to-reorder** initiative
- **Quick edit buttons** (damage, heal, conditions)
- **Expandable details** for full stat block
- **Context menus** for combatant actions
- **Status animations** (damage flash, healing glow)
- **Turn indicator** for active combatant
- **Concentration tracker** visual
- **Death saving throws** display

