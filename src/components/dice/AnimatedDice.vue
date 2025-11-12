<template>
  <transition name="dice-fade">
    <div v-if="isVisible" class="animated-dice-overlay" @click="hide">
      <div class="dice-container">
        <div
          v-for="(die, index) in visibleDice"
          :key="`${die.id}-${index}`"
          class="die"
          :class="`die-d${die.sides}`"
          :style="getDieStyle(index)"
        >
          <div class="die-face">
            <span class="die-result">{{ die.result }}</span>
          </div>
        </div>
      </div>
      
      <div class="dice-overlay-info">
        <v-chip color="primary" size="large" class="mb-2">
          <v-icon icon="mdi-dice-multiple" start />
          Rolling...
        </v-chip>
        <p class="text-caption">Click anywhere to dismiss</p>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDiceRollerStore } from '@/stores/diceRoller'

interface AnimatedDie {
  id: number
  sides: number
  result: number
}

const diceStore = useDiceRollerStore()
const isVisible = ref(false)
const visibleDice = ref<AnimatedDie[]>([])
let hideTimeout: number | null = null

// Watch for new rolls
watch(() => diceStore.recentRolls, (rolls) => {
  if (rolls.length > 0 && diceStore.enable3dDice) {
    const latestRoll = rolls[0]
    
    // Convert roll to animated dice
    const dice: AnimatedDie[] = latestRoll.results.map((result, index) => ({
      id: Date.now() + index,
      sides: getDiceSides(latestRoll.roll),
      result
    }))
    
    showDice(dice)
  }
}, { deep: true })

function getDiceSides(rollNotation: string): number {
  const match = rollNotation.match(/d(\d+)/)
  return match ? parseInt(match[1]) : 20
}

function showDice(dice: AnimatedDie[]) {
  visibleDice.value = dice
  isVisible.value = true
  
  // Clear existing timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
  
  // Auto-hide after 3 seconds
  hideTimeout = window.setTimeout(() => {
    hide()
  }, 3000)
}

function hide() {
  isVisible.value = false
  
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function getDieStyle(index: number) {
  const totalDice = visibleDice.value.length
  const spacing = Math.min(120, 600 / totalDice) // Adaptive spacing
  const offset = (index - (totalDice - 1) / 2) * spacing
  
  return {
    left: `calc(50% + ${offset}px)`,
    animationDelay: `${index * 0.1}s`
  }
}
</script>

<style scoped>
.animated-dice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dice-container {
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.die {
  position: absolute;
  width: 80px;
  height: 80px;
  transform-style: preserve-3d;
  animation: rollDice 1s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  animation-fill-mode: forwards;
}

.die-face {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #9a66e3 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5),
              inset 0 2px 5px rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.die-result {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.die-d20 .die-face {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.die-d6 .die-face {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.die-d8 .die-face {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.die-d10 .die-face {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.die-d12 .die-face {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.die-d4 .die-face {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.dice-overlay-info {
  position: absolute;
  bottom: 100px;
  text-align: center;
}

@keyframes rollDice {
  0% {
    transform: translate(-50%, -200px) rotateX(0deg) rotateY(0deg) scale(0.5);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, 0) rotateX(720deg) rotateY(720deg) scale(1.2);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, 0) rotateX(0deg) rotateY(0deg) scale(1);
    opacity: 1;
  }
}

/* Fade transition */
.dice-fade-enter-active,
.dice-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dice-fade-enter-from,
.dice-fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .die {
    width: 60px;
    height: 60px;
  }
  
  .die-result {
    font-size: 2rem;
  }
}
</style>

