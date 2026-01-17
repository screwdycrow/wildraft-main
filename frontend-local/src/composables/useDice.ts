import { ref } from 'vue'
import type { DiceRoll, DiceRollResult, ParsedDice } from '@/types/dice.types'
import DiceBox from '@3d-dice/dice-box'

// Dice box instance (will be initialized lazily)
let diceBox: DiceBox | null = null
let diceBoxInitialized = false

export function useDice() {
  const isRolling = ref(false)

  /**
   * Generate a cryptographically random number between min and max (inclusive)
   */
  function getRandomNumber(min: number = 1, max: number = 6): number {
    // Use crypto.getRandomValues for better randomness
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const randomNumber = randomBuffer[0] / (0xffffffff + 1)
    return Math.floor(randomNumber * (max - min + 1)) + min
  }

  /**
   * Parse a dice notation string (e.g., "2d20+3" or "1d6-1")
   */
  function parseDiceNotation(notation: string): ParsedDice | null {
    // Match patterns like: 2d20, 1d6+3, 3d8-2, d20 (assumes 1d20)
    const regex = /^(\d*)d(\d+)\s*([+-]\s*\d+)?$/i
    const match = notation.trim().match(regex)

    if (!match) {
      return null
    }

    const count = match[1] ? parseInt(match[1]) : 1
    const sides = parseInt(match[2])
    const modifierMatch = match[3]?.replace(/\s/g, '') // Remove spaces
    const modifier = modifierMatch ? parseInt(modifierMatch) : 0

    // Validate
    if (count < 1 || count > 100 || sides < 2 || sides > 100) {
      return null
    }

    return { count, sides, modifier }
  }

  /**
   * Extract all dice rolls from a text string
   * Examples:
   * - "2d20 sdsds 2d6" -> ["2d20", "2d6"]
   * - "roll 1d20+2 for attack" -> ["1d20+2"]
   */
  function getDiceRolls(text: string): DiceRoll[] {
    const diceRolls: DiceRoll[] = []
    
    // Match patterns like: 2d20, d6+3, 1d8-1
    const regex = /(\d*d\d+(?:\s*[+-]\s*\d+)?)/gi
    let match

    while ((match = regex.exec(text)) !== null) {
      const roll = match[1].trim()
      
      // Validate that it's a proper dice notation
      if (parseDiceNotation(roll)) {
        diceRolls.push({
          roll: roll.replace(/\s/g, ''), // Remove spaces from roll notation
          text: text.trim()
        })
      }
    }

    // Special case: if there's just "+X" or "-X" at the end, treat as d20+X
    if (diceRolls.length === 0) {
      const modifierRegex = /^([+-]\s*\d+)$/
      const modMatch = text.trim().match(modifierRegex)
      if (modMatch) {
        const roll = `d20${modMatch[1].replace(/\s/g, '')}`
        diceRolls.push({
          roll,
          text: text.trim()
        })
      }
    }

    return diceRolls
  }

  /**
   * Roll a single die
   */
  function rollSingleDie(sides: number): number {
    return getRandomNumber(1, sides)
  }

  /**
   * Roll multiple dice and return results
   */
  function rollDices(rolls: DiceRoll[]): DiceRollResult[] {
    const results: DiceRollResult[] = []

    for (const roll of rolls) {
      const parsed = parseDiceNotation(roll.roll)
      
      if (!parsed) {
        console.warn(`Invalid dice notation: ${roll.roll}`)
        continue
      }

      const diceResults: number[] = []
      for (let i = 0; i < parsed.count; i++) {
        diceResults.push(rollSingleDie(parsed.sides))
      }

      const total = diceResults.reduce((sum, val) => sum + val, 0) + parsed.modifier

      results.push({
        roll: roll.roll,
        text: roll.text,
        results: diceResults,
        total,
        modifier: parsed.modifier,
        timestamp: Date.now()
      })
    }

    return results
  }

  /**
   * Initialize the 3D dice box
   */
  async function show3dDiceBox(container?: string | HTMLElement) {
    console.log('🎲 show3dDiceBox called, diceBoxInitialized:', diceBoxInitialized)
    
    if (diceBoxInitialized && diceBox) {
      console.log('🎲 Dice box already initialized, returning existing instance')
      return diceBox
    }

    try {
      // Determine container selector or element
      let targetContainer: string | HTMLElement = '#dice-box'
      if (container) {
        targetContainer = container
      }

      console.log('🎲 Target container:', targetContainer)

      // If string selector, verify element exists
      if (typeof targetContainer === 'string') {
        const element = document.querySelector(targetContainer)
        console.log('🎲 Container element found:', element)
        if (!element) {
          throw new Error(`DiceBox target DOM node: '${targetContainer}' not found or not available yet.`)
        }
      }

      console.log('🎲 Creating DiceBox instance...')
      
      // Create dice box instance with configuration
      diceBox = new DiceBox(targetContainer, {
        assetPath: '/assets/dice-box/',
        container: targetContainer,
        gravity: 1,
        mass: 1,
        friction: 0.8,
        restitution: 0,
        angularDamping: 0.4,
        linearDamping: 0.5,
        spinForce: 6,
        throwForce: 5,
        startingHeight: 8,
        settleTimeout: 5000,
        offscreen: true,
        delay: 10,
        lightIntensity: 1.2,
        enableShadows: true,
        shadowTransparency: 0.8,
        theme: 'default',
        themeColor: '#9a66e3',
        scale: 4, // Half of 8 = 4
        suspendSimulation: false
      })

      console.log('🎲 DiceBox instance created, initializing...')

      // Initialize the dice box
      await diceBox.init()
      diceBoxInitialized = true

      console.log('✅ 3D Dice Box initialized successfully!')
      return diceBox
    } catch (error) {
      console.error('❌ Failed to initialize 3D dice box:', error)
      console.error('❌ Error details:', error)
      diceBoxInitialized = false
      return null
    }
  }

  /**
   * Throw 3D dice and get the results from the physics simulation
   * Returns the actual roll results from the 3D dice
   */
  async function throw3dDice(diceRolls: DiceRoll[]): Promise<DiceRollResult[]> {
    console.log('🎲 throw3dDice called with rolls:', diceRolls)
    console.log('🎲 diceBoxInitialized:', diceBoxInitialized)
    
    // Check if dice box is initialized
    if (!diceBoxInitialized || !diceBox) {
      console.warn('⚠️ 3D dice box not available, falling back to random rolls')
      return rollDices(diceRolls)
    }

    isRolling.value = true
    console.log('🎲 Setting isRolling to TRUE')

    try {
      // Convert roll notation to dice-box format
      // Format: ['2d20', '1d6+3']
      const notations: string[] = diceRolls.map(roll => roll.roll)

      console.log('🎲 Rolling notations:', notations)

      if (notations.length > 0) {
        // Roll the dice and get results from the 3D simulation
        const results = await diceBox.roll(notations)
        console.log('🎲 3D Dice results:', results)

        // Convert dice-box results to our DiceRollResult format
        const rollResults: DiceRollResult[] = []
        
        for (let i = 0; i < diceRolls.length; i++) {
          const roll = diceRolls[i]
          const parsed = parseDiceNotation(roll.roll)
          if (!parsed) continue

          // Get the dice values for this roll from the results
          const diceValues: number[] = []
          let resultIndex = rollResults.reduce((sum, r) => sum + r.results.length, 0)
          
          for (let j = 0; j < parsed.count; j++) {
            if (results[resultIndex + j]) {
              diceValues.push(results[resultIndex + j].value)
            }
          }

          const total = diceValues.reduce((sum, val) => sum + val, 0) + parsed.modifier

          rollResults.push({
            roll: roll.roll,
            text: roll.text,
            results: diceValues,
            total,
            modifier: parsed.modifier,
            timestamp: Date.now()
          })
        }

        console.log('🎲 Converted roll results:', rollResults)
        return rollResults
      }

      return []
    } catch (error) {
      console.error('❌ Failed to throw 3D dice:', error)
      // Fall back to random rolls on error
      return rollDices(diceRolls)
    } finally {
      isRolling.value = false
      console.log('🎲 Setting isRolling to FALSE')
    }
  }

  /**
   * Hide/clear the 3D dice
   */
  async function hide3dDice() {
    if (diceBox) {
      try {
        await diceBox.clear()
      } catch (error) {
        console.error('Failed to clear dice:', error)
      }
    }
  }

  /**
   * Update dice box theme
   */
  async function updateTheme(themeName: string) {
    if (diceBox) {
      try {
        await diceBox.updateConfig({ theme: themeName })
      } catch (error) {
        console.error('Failed to update theme:', error)
      }
    }
  }

  return {
    isRolling,
    getRandomNumber,
    parseDiceNotation,
    getDiceRolls,
    rollDices,
    rollSingleDie,
    show3dDiceBox,
    throw3dDice,
    hide3dDice,
    updateTheme
  }
}

