export interface DiceRoll {
  roll: string // e.g., "2d20", "1d6+3"
  text: string // The original text context
}

export interface DiceRollResult extends DiceRoll {
  results: number[] // Individual die results
  total: number // Sum of all dice plus modifiers
  modifier: number // The modifier applied (e.g., +2)
  timestamp: number // When the roll was made
}

export interface ParsedDice {
  count: number // Number of dice
  sides: number // Number of sides per die
  modifier: number // Modifier to add/subtract
}

