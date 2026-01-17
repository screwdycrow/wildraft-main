<template>
  <div class="portal-combat-encounter">
    <!-- Header with Round Counter Only -->
    <div v-if="activeEncounter && showEncounter" class="combat-header">
      <div class="round-section">
        <div class="round-display">
          <div class="round-label">ROUND</div>
          <div class="round-number">{{ activeEncounter.round }}</div>
        </div>
      </div>
    </div>

    <v-divider v-if="activeEncounter && showEncounter" class="transparent-divider" />

    <!-- Active Encounter Display -->
    <div v-if="activeEncounter" class="combatants-container">
      <!-- Combatants List -->
      <div class="combatants-list">
        <div v-if="!activeEncounter.combatants || activeEncounter.combatants.length === 0" class="empty-state">
          <v-icon icon="mdi-account-off" size="48" color="grey" class="mb-2 opacity-50" />
          <p class="text-caption text-grey mb-2">No combatants yet</p>
        </div>
        <div v-else>
          <combatant-wrapper
            v-for="(combatant, index) in sortedCombatants"
            :key="combatant.id"
            :combatant="combatant"
            :show-health="showHealth"
            :show-ac="showAC"
            :show-actions="showActions"
            :portal-mode="true"
            :class="{ 'active-combatant': index === activeInitiativeIndex, 'not-active-combatant': index !== activeInitiativeIndex }"
            :style="{ opacity: index === activeInitiativeIndex ? 1 : getCombatantOpacity(index) }"
          />
        </div>
      </div>
    </div>

    <!-- No Active Encounter -->
    <div v-else-if="showEncounter" class="empty-state pa-4">
      <v-icon icon="mdi-sword-cross" size="48" color="grey" class="mb-2 opacity-50" />
      <p class="text-caption text-grey mb-3">No active encounter</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import CombatantWrapper from '@/components/combat/combatants/CombatantWrapper.vue'
import type { LibraryPortalView } from '@/types/portal.types'

interface Props {
  portalView?: LibraryPortalView | null
  showHealth?: boolean
  showAC?: boolean
  showActions?: boolean
  showEncounter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHealth: false,
  showAC: false,
  showActions: false,
  showEncounter: false,
})

const combatStore = useCombatEncountersStore()
const { activeEncounter } = storeToRefs(combatStore)

// Sort combatants by initiative (highest first) and cycle so current is first
const sortedCombatants = computed(() => {
  if (!activeEncounter.value) return []
  const sorted = [...activeEncounter.value.combatants].sort((a, b) => b.initiative - a.initiative)
  
  // Cycle the array so the current combatant is first
  if (sorted.length > 0) {
    const currentIndex = activeEncounter.value.initativeCount % sorted.length
    return [...sorted.slice(currentIndex), ...sorted.slice(0, currentIndex)]
  }
  
  return sorted
})

// Always 0 since we cycle the array
const activeInitiativeIndex = computed(() => 0)

// Calculate opacity for non-active combatants (fades from 0.95 to 0.6)
function getCombatantOpacity(index: number): number {
  if (index === 0) return 1 // Active combatant is always fully visible
  
  const totalCombatants = sortedCombatants.value.length
  if (totalCombatants <= 1) return 1
  
  // Start at 0.95 for index 1, fade to 0.6 for the last item
  const startOpacity = 0.95
  const endOpacity = 0.6
  const fadeRange = totalCombatants - 1 // Number of items that will fade
  
  if (fadeRange <= 0) return startOpacity
  
  // Calculate opacity: linear interpolation from startOpacity to endOpacity
  const progress = (index - 1) / (fadeRange - 1) // Progress from 0 to 1
  return startOpacity - (startOpacity - endOpacity) * progress
}
</script>

<style scoped>
.portal-combat-encounter {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

.combat-header {
  background: transparent;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.round-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.round-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  min-width: 80px;
}

.round-label {
  font-size: 10px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
}

.round-number {
  font-size: 24px;
  font-weight: bold;
  color: white;
  line-height: 1;
}

.transparent-divider {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.combatants-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.combatants-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.combatants-list::-webkit-scrollbar {
  width: 6px;
}

.combatants-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.combatants-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.combatants-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.active-combatant {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  margin-bottom: 12px;
  margin-top: 12px;
  padding: 6px;
  transition: transform 0.2s ease-in-out;
}

.not-active-combatant {
  transform: scale(0.9);
  margin-top: 0px;
  margin-bottom: 0px;
  transition: transform 0.2s ease-in-out, opacity 0.3s ease-in-out;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
}

.opacity-50 {
  opacity: 0.2;
}
</style>

