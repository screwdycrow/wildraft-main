<template>
  <div 
    id="dice-box" 
    class="dice-box-container"
    :class="{ 'dice-box-visible': isVisible, 'dice-box-hidden': !isVisible }"
  >
    <!-- Roll Results Overlay -->
    <transition name="results-fade">
      <div v-if="showResults && rollResults.length > 0" class="results-overlay">
        <v-card class="results-card glass-card" elevation="8">
          <v-card-title class="d-flex align-center py-2 px-3">
            <v-icon icon="mdi-dice-multiple" color="primary" class="mr-2" size="small" />
            <span class="text-subtitle-1">Roll Results</span>
            <v-spacer />
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="hideResults"
            />
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-3">
            <div v-for="(result, index) in rollResults" :key="index" class="result-group mb-3">
              <div class="result-header">
                <v-icon :icon="getResultIcon(result)" size="small" class="mr-2" :color="getResultColor(result)" />
                <span class="result-label">{{ getResultLabel(result, index) }}</span>
                <span class="roll-notation ml-2">({{ result.roll }})</span>
              </div>
              <div class="result-content">
                <div class="dice-results">
                  <div class="dice-group">
                    <v-chip
                      v-for="(die, dieIndex) in result.results"
                      :key="dieIndex"
                      size="small"
                      :color="getDieColor(die, result.roll)"
                      class="die-chip"
                      :class="{ 'crit-success': isCritSuccess(die, result.roll), 'crit-fail': isCritFail(die, result.roll) }"
                    >
                      {{ die }}
                    </v-chip>
                  </div>
                  <span v-if="result.modifier !== 0" class="modifier">
                    {{ result.modifier > 0 ? '+' : '' }}{{ result.modifier }}
                  </span>
                </div>
                <div class="total-result" :class="{ 'attack-roll': isAttackRoll(result), 'damage-roll': !isAttackRoll(result) }">
                  <v-icon icon="mdi-equal" size="small" class="mr-1" />
                  <span class="total-value">{{ result.total }}</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useDiceRollerStore } from '@/stores/diceRoller'
import type { DiceRollResult } from '@/types/dice.types'

const diceStore = useDiceRollerStore()
const isVisible = ref(false)
const showResults = ref(false)
const rollResults = ref<DiceRollResult[]>([])
let hideTimeout: number | null = null
let resultsTimeout: number | null = null

// Watch for rolling state
watch(() => diceStore.dice.isRolling, (rolling) => {
  if (rolling) {
    isVisible.value = true
    showResults.value = false // Hide previous results when starting new roll
    
    // Clear any existing timeouts
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    if (resultsTimeout) {
      clearTimeout(resultsTimeout)
      resultsTimeout = null
    }
  } else {
    // Show results after rolling completes
    resultsTimeout = window.setTimeout(() => {
      // Get the most recent roll results
      // If multiple dice were rolled together, they'll all be at the front
      if (diceStore.rollHistory.length > 0) {
        // Get all results from the most recent roll batch
        // We'll assume results with the same timestamp are from the same roll
        const latestTimestamp = diceStore.rollHistory[0].timestamp
        const batchResults = diceStore.rollHistory.filter(
          r => r.timestamp === latestTimestamp
        )
        rollResults.value = batchResults
        showResults.value = true
      }
    }, 500)
    
    // Hide after 5 seconds of no rolling
    hideTimeout = window.setTimeout(() => {
      isVisible.value = false
      showResults.value = false
    }, 5000)
  }
})

function hideResults() {
  showResults.value = false
}

function getResultLabel(result: DiceRollResult, index: number): string {
  // Check if it's an attack roll (d20)
  if (result.roll.includes('d20') || result.roll.includes('1d20')) {
    return 'Attack Roll'
  }
  
  // Otherwise it's likely damage or another roll
  if (index === 0 && rollResults.value.length > 1) {
    return 'Attack Roll'
  } else if (index === 1 || !result.roll.includes('d20')) {
    return 'Damage Roll'
  }
  
  return result.roll
}

function getResultIcon(result: DiceRollResult): string {
  if (result.roll.includes('d20') || result.roll.includes('1d20')) {
    return 'mdi-sword-cross'
  }
  return 'mdi-skull-crossbones'
}

function getResultColor(result: DiceRollResult): string {
  if (result.roll.includes('d20') || result.roll.includes('1d20')) {
    return 'primary'
  }
  return 'error'
}

function isAttackRoll(result: DiceRollResult): boolean {
  return result.roll.includes('d20') || result.roll.includes('1d20')
}

function isCritSuccess(value: number, rollNotation: string): boolean {
  const match = rollNotation.match(/d(\d+)/)
  const dieSides = match ? parseInt(match[1]) : 20
  return value === dieSides
}

function isCritFail(value: number, rollNotation: string): boolean {
  const match = rollNotation.match(/d(\d+)/)
  const dieSides = match ? parseInt(match[1]) : 20
  return value === 1 && dieSides === 20
}

function getDieColor(value: number, rollNotation: string): string {
  // Highlight critical rolls
  if (isCritSuccess(value, rollNotation)) {
    return 'success' // Natural max (crit success for d20)
  } else if (isCritFail(value, rollNotation)) {
    return 'error' // Natural 1 on d20 (crit fail)
  }
  
  return 'primary'
}

// Initialize on mount
onMounted(async () => {
  console.log('🎲🎲🎲 DiceBox3D component MOUNTED!')
  await nextTick()
  
  const container = document.getElementById('dice-box')
  console.log('🎲 Container element:', container)
  
  if (!container) {
    console.error('❌ Container #dice-box not found!')
    return
  }
  
  // Small delay to ensure DOM is ready
  setTimeout(async () => {
    try {
      console.log('🎲 Attempting to initialize dice box...')
      const result = await diceStore.dice.show3dDiceBox('#dice-box')
      if (result) {
        console.log('✅✅✅ Dice box initialized successfully!')
      } else {
        console.error('❌ Dice box initialization returned null')
      }
    } catch (error) {
      console.error('❌❌❌ Failed to initialize dice box:', error)
    }
  }, 1000)
})

// Cleanup on unmount
onUnmounted(() => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
  if (resultsTimeout) {
    clearTimeout(resultsTimeout)
  }
})

// Debug visibility changes
watch(isVisible, (newVal) => {
  console.log('DiceBox visibility changed:', newVal ? 'VISIBLE' : 'HIDDEN')
})

watch(() => diceStore.dice.isRolling, (rolling) => {
  console.log('Dice rolling state:', rolling ? 'ROLLING' : 'NOT ROLLING')
})
</script>

<style scoped>
.dice-box-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-box-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.dice-box-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: none;
}

/* The dice-box library will create its own canvas inside this container */
:deep(canvas) {
  pointer-events: all;
  width: 100% !important;
  height: 100% !important;
  display: block;
}

/* Results Overlay */
.results-overlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  pointer-events: all;
  min-width: 300px;
  max-width: 500px;
}

.results-card {
  backdrop-filter: blur(20px);
}

.result-group {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.result-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0 !important;
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  opacity: 0.9;
}

.result-label {
  color: rgb(var(--v-theme-on-surface));
}

.result-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.roll-notation {
  font-size: 0.75rem;
  opacity: 0.6;
  font-weight: 400;
  font-family: monospace;
}

.dice-results {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dice-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.die-chip {
  font-weight: 700;
  font-size: 0.95rem;
  min-width: 36px;
  justify-content: center;
  transition: all 0.2s ease;
}

.die-chip.crit-success {
  animation: pulse-success 0.6s ease-in-out;
  box-shadow: 0 0 12px rgba(var(--v-theme-success), 0.6);
}

.die-chip.crit-fail {
  animation: pulse-fail 0.6s ease-in-out;
  box-shadow: 0 0 12px rgba(var(--v-theme-error), 0.6);
}

@keyframes pulse-success {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes pulse-fail {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.modifier {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  margin-left: 4px;
}

.total-result {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid;
  transition: all 0.2s ease;
  min-width: 70px;
  justify-content: center;
}

.total-result.attack-roll {
  background: rgba(var(--v-theme-primary), 0.2);
  border-color: rgb(var(--v-theme-primary));
}

.total-result.attack-roll .total-value {
  color: rgb(var(--v-theme-primary));
}

.total-result.damage-roll {
  background: rgba(var(--v-theme-error), 0.15);
  border-color: rgb(var(--v-theme-error));
}

.total-result.damage-roll .total-value {
  color: rgb(var(--v-theme-error));
}

.total-value {
  font-size: 1.5rem;
  font-weight: 700;
}

/* Results fade transition */
.results-fade-enter-active,
.results-fade-leave-active {
  transition: all 0.3s ease;
}

.results-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.results-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

