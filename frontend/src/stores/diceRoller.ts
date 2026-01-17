import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDice } from '@/composables/useDice'
import { useChat } from '@/composables/useChat'
import { useAuthStore } from '@/stores/auth'
import type { DiceRollResult } from '@/types/dice.types'

export const useDiceRollerStore = defineStore('diceRoller', () => {
  const dice = useDice()
  const chat = useChat()
  const authStore = useAuthStore()
  
  // State
  const rollHistory = ref<DiceRollResult[]>([])
  const isVisible = ref(false)
  const currentUsername = ref('Player')
  const enable3dDice = ref(true) // Enable animated dice by default

  // Watch auth store for username changes
  watch(
    () => authStore.user?.name,
    (name) => {
      if (name) {
        currentUsername.value = name
      }
    },
    { immediate: true }
  )

  // Getters
  const recentRolls = computed(() => rollHistory.value.slice(0, 20)) // Keep last 20 rolls

  /**
   * Roll dice from a text input
   */
  async function rollFromText(text: string) {
    if (!text.trim()) {
      return
    }

    // Parse dice rolls from text
    const diceRolls = dice.getDiceRolls(text)
    
    if (diceRolls.length === 0) {
      console.warn('No valid dice rolls found in text:', text)
      return
    }

    let results

    // If 3D dice are enabled, use 3D dice results
    if (enable3dDice.value) {
      try {
        results = await dice.throw3dDice(diceRolls)
      } catch (error) {
        console.warn('3D dice failed, falling back to random:', error)
        results = dice.rollDices(diceRolls)
      }
    } else {
      // Otherwise use our random number generator
      results = dice.rollDices(diceRolls)
    }
    
    if (results.length === 0) {
      return
    }

    // Add to history
    rollHistory.value.unshift(...results)
    
    // Keep only last 100 rolls
    if (rollHistory.value.length > 100) {
      rollHistory.value = rollHistory.value.slice(0, 100)
    }

    // Add to chat
    for (const result of results) {
      const resultText = formatRollResult(result)
      chat.addMessage({
        username: currentUsername.value,
        message: resultText
      })
    }

    return results
  }

  /**
   * Format a roll result for display
   */
  function formatRollResult(result: DiceRollResult): string {
    const diceResults = result.results.join(' + ')
    const modifierText = result.modifier !== 0 
      ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` 
      : ''
    
    let message = `🎲 **${result.roll}**: `
    
    if (result.results.length > 1) {
      message += `[${diceResults}]${modifierText} = **${result.total}**`
    } else {
      message += `${diceResults}${modifierText} = **${result.total}**`
    }

    // Add context if available
    if (result.text && result.text !== result.roll) {
      message += ` (${result.text})`
    }

    return message
  }

  /**
   * Quick roll with a specific notation (e.g., from a button)
   */
  async function quickRoll(notation: string, context?: string) {
    const text = context ? `${notation} ${context}` : notation
    return rollFromText(text)
  }

  /**
   * Clear roll history
   */
  function clearHistory() {
    rollHistory.value = []
  }

  /**
   * Toggle 3D dice
   */
  function toggle3dDice() {
    enable3dDice.value = !enable3dDice.value
  }

  /**
   * Show the dice roller
   */
  function show() {
    isVisible.value = true
  }

  /**
   * Hide the dice roller
   */
  function hide() {
    isVisible.value = false
  }

  /**
   * Toggle visibility
   */
  function toggle() {
    isVisible.value = !isVisible.value
  }

  /**
   * Set current username (can be linked to auth)
   */
  function setUsername(username: string) {
    currentUsername.value = username
  }

  return {
    // State
    rollHistory,
    isVisible,
    currentUsername,
    enable3dDice,
    
    // Getters
    recentRolls,
    
    // Actions
    rollFromText,
    quickRoll,
    clearHistory,
    toggle3dDice,
    show,
    hide,
    toggle,
    setUsername,
    formatRollResult,
    
    // Expose composables
    chat,
    dice
  }
})

