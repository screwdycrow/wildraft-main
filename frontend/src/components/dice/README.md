# Dice Roller System

A comprehensive dice rolling system with 3D visualization, chat history, and flexible notation parsing.

## Features

- 🎲 **Flexible Dice Notation**: Parse complex dice rolls from natural text
- 🎯 **3D Dice Visualization**: Beautiful 3D dice animations using dice-box-threejs
- 💬 **Chat History**: Track and display dice rolls with timestamps
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Theme Support**: Integrates with the app's theming system
- 💾 **Persistent Storage**: Chat history saved to localStorage (up to 1 week)

## Components

### DiceRoller.vue
Main dice roller component with text input and dropdown chat interface.

**Location**: Integrated into both LibraryLayout and DefaultLayout headers.

**Features**:
- Text input with dice notation parsing
- Quick roll buttons (d20, 2d20, 1d6, etc.)
- Chat history dropdown
- Settings dialog for username and 3D dice toggle

### DiceBox3D.vue
3D dice visualization overlay component.

**Features**:
- Full-screen overlay for dice animations
- Auto-hide after 5 seconds of inactivity
- Manual close button
- Non-intrusive pointer events

## Dice Notation

### Supported Formats

- `d20` - Single d20 roll
- `2d20` - Roll two d20 dice
- `1d6+3` - Roll d6 with +3 modifier
- `3d8-2` - Roll three d8 with -2 modifier
- `+2` - Treated as d20+2 by default

### Multiple Rolls

Parse multiple dice from a single input:

```
"Attack: 2d20 and damage 2d6+3"
```

This will create two separate rolls:
1. `2d20` (Attack)
2. `2d6+3` (Damage)

## Store: diceRoller.ts

Global Pinia store for dice rolling state.

### State

- `rollHistory`: Array of all roll results
- `isVisible`: Dice roller visibility
- `currentUsername`: Current user (from auth)
- `enable3dDice`: Toggle 3D dice animations

### Actions

- `rollFromText(text)`: Parse and roll dice from text input
- `quickRoll(notation, context?)`: Roll with specific notation
- `clearHistory()`: Clear roll history
- `toggle3dDice()`: Toggle 3D animations
- `setUsername(name)`: Set current username

## Composables

### useDice.ts

Core dice rolling logic.

**Key Functions**:
- `getRandomNumber(min, max)`: Cryptographically random number generator
- `parseDiceNotation(notation)`: Parse dice notation string
- `getDiceRolls(text)`: Extract all dice rolls from text
- `rollDices(rolls)`: Roll multiple dice and return results
- `show3dDiceBox(container?)`: Initialize 3D dice visualization
- `throw3dDice(results)`: Animate 3D dice for results

### useChat.ts

Chat message management.

**Key Functions**:
- `addMessage(message)`: Add new message to chat
- `deleteMessage(id)`: Delete a message
- `clearMessages()`: Clear all messages
- `getVisibleMessages(username)`: Filter messages by visibility
- `saveToLocalStorage()`: Persist chat to localStorage
- `loadFromLocalStorage()`: Load chat from localStorage

## Types

### dice.types.ts

```typescript
interface DiceRoll {
  roll: string // e.g., "2d20"
  text: string // Original context
}

interface DiceRollResult extends DiceRoll {
  results: number[] // Individual die results
  total: number // Sum with modifiers
  modifier: number // Applied modifier
  timestamp: number // When rolled
}

interface ParsedDice {
  count: number // Number of dice
  sides: number // Sides per die
  modifier: number // Modifier to add
}
```

### chat.types.ts

```typescript
interface Message {
  id: string
  username: string
  message: string
  datetime: Date
  replyingTo?: string // Reply to message ID
  hideToOthers?: boolean // Private to sender
  showOnlyToRecipient?: string // Private to user
}
```

## Usage Examples

### Basic Roll

```typescript
import { useDiceRollerStore } from '@/stores/diceRoller'

const diceStore = useDiceRollerStore()

// Roll from text
await diceStore.rollFromText('2d20 attack roll')

// Quick roll
await diceStore.quickRoll('1d6+3', 'damage')
```

### Custom Dice Roller

```vue
<script setup>
import { useDice } from '@/composables/useDice'

const dice = useDice()

// Parse notation
const parsed = dice.parseDiceNotation('2d20+5')
// { count: 2, sides: 20, modifier: 5 }

// Extract rolls from text
const rolls = dice.getDiceRolls('Roll 2d20 and 1d6+3')
// [{ roll: '2d20', text: '...' }, { roll: '1d6+3', text: '...' }]

// Roll dice
const results = dice.rollDices(rolls)
// [{ roll: '2d20', results: [15, 8], total: 23, ... }]
```

## Configuration

### 3D Dice Assets

The 3D dice library requires assets. Ensure the following path is configured:

```javascript
{
  assetPath: '/assets/dice-box/',
  startingHeight: 8,
  throwForce: 6,
  spinForce: 5,
  lightIntensity: 0.9,
  theme: 'default'
}
```

### Chat Storage

Chat messages are stored in localStorage with key `dice-roller-chat`.

**Cleanup**: Messages older than 7 days are automatically removed.

## Integration

The dice roller is available globally in:
- LibraryLayout (for library pages)
- DefaultLayout (for dashboard and other pages)

Access the store anywhere:

```typescript
import { useDiceRollerStore } from '@/stores/diceRoller'

const diceStore = useDiceRollerStore()
```

## Future Enhancements

- [ ] Reply to messages
- [ ] Private messages between users
- [ ] Advantage/disadvantage rolls
- [ ] Roll macros
- [ ] Export chat history
- [ ] Roll statistics and analytics
- [ ] Custom dice themes
- [ ] Sound effects

