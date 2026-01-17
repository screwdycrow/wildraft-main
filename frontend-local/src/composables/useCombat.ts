import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { useLibraryStore } from '@/stores/library'
import { useItemComponents } from '@/composables/useItemComponents'
import type { LibraryItem } from '@/types/item.types'
import type { Combatant, UpdateCombatEncounterRequest } from '@/types/combat.types'

/**
 * useCombat Composable
 * 
 * Provides methods for managing combatants in the active combat encounter.
 * Handles adding/removing combatants, rolling initiative, and updating combatant data.
 */
export function useCombat() {
  const combatStore = useCombatEncountersStore()
  const libraryStore = useLibraryStore()
  const { convertItemToCombatant } = useItemComponents()
  
  const { activeEncounter } = storeToRefs(combatStore)
  const currentLibraryId = computed(() => libraryStore.currentLibrary?.id)

  /**
   * Generate a unique combatant ID
   */
  function generateCombatantId(): string {
    return `combatant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Roll initiative (1d20)
   */
  function rollInitiative(): number {
    return Math.floor(Math.random() * 20) + 1
  }

  /**
   * Add a library item to the active encounter as a combatant
   * Uses type-specific converter functions to create the combatant object
   * @param libraryItem - The library item (character or stat block) to add
   * @param customName - Optional custom name override
   */
  async function addToActiveEncounter(libraryItem: LibraryItem, customName?: string) {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    console.log('[useCombat] Adding to active encounter:', {
      itemName: libraryItem.name,
      itemType: libraryItem.type,
      encounterId: activeEncounter.value.id
    })

    // Generate unique ID
    const combatantId = generateCombatantId()

    // Use the parametric converter function based on item type
    const combatantData = convertItemToCombatant(libraryItem, combatantId, customName)

    console.log('[useCombat] Converted combatant data:', combatantData)

    // Roll initiative and create final combatant (only store libraryItemId and featuredImageId)
    const newCombatant: Combatant = {
      ...combatantData,
      id: combatantId,
      initiative: rollInitiative(),
      libraryItemId: libraryItem.id, // Only store the ID, not the full object
      featuredImageId: libraryItem.featuredImage?.id, // Store featured image ID if available
    } as Combatant

    console.log('[useCombat] Final combatant with initiative:', newCombatant)

    // Add to combatants array
    const updatedCombatants = [...(activeEncounter.value.combatants || []), newCombatant]
    
    // Sort by initiative (highest first)
    updatedCombatants.sort((a, b) => b.initiative - a.initiative)

    console.log('[useCombat] Updated combatants array:', updatedCombatants.length, 'combatants')

    // Update encounter
    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { combatants: updatedCombatants }
    )

    console.log('[useCombat] Encounter updated successfully')

    return newCombatant
  }

  /**
   * Remove a combatant from the active encounter
   * @param combatantId - The ID of the combatant to remove
   */
  async function removeFromActiveEncounter(combatantId: string) {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    const updatedCombatants = activeEncounter.value.combatants.filter(
      c => c.id !== combatantId
    )

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { combatants: updatedCombatants }
    )
  }

  /**
   * Roll initiative for a specific combatant
   * @param combatantId - The ID of the combatant
   */
  async function rollInitiativeForCombatant(combatantId: string) {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    const combatantIndex = activeEncounter.value.combatants.findIndex(
      c => c.id === combatantId
    )

    if (combatantIndex === -1) {
      throw new Error('Combatant not found')
    }

    const newInitiative = rollInitiative()
    const updatedCombatants = [...activeEncounter.value.combatants]
    updatedCombatants[combatantIndex] = {
      ...updatedCombatants[combatantIndex],
      initiative: newInitiative,
    }

    // Re-sort by initiative
    updatedCombatants.sort((a, b) => b.initiative - a.initiative)

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { combatants: updatedCombatants }
    )

    return newInitiative
  }

  /**
   * Update a combatant with partial data
   * @param combatantId - The ID of the combatant
   * @param combatantData - Partial combatant data to update
   */
  async function updateCombatant(combatantId: string, combatantData: Partial<Combatant>) {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    const combatantIndex = activeEncounter.value.combatants.findIndex(
      c => c.id === combatantId
    )

    if (combatantIndex === -1) {
      throw new Error('Combatant not found')
    }

    const updatedCombatants = [...activeEncounter.value.combatants]
    updatedCombatants[combatantIndex] = {
      ...updatedCombatants[combatantIndex],
      ...combatantData,
    }

    // Re-sort if initiative changed
    if (combatantData.initiative !== undefined) {
      updatedCombatants.sort((a, b) => b.initiative - a.initiative)
    }

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { combatants: updatedCombatants }
    )

    return updatedCombatants[combatantIndex]
  }

  /**
   * Create a custom combatant (not from a library item)
   * @param combatantData - Combatant data
   */
  async function addCustomCombatant(combatantData: Partial<Combatant> & { name: string }) {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    const newCombatant: Combatant = {
      id: generateCombatantId(),
      name: combatantData.name,
      initiative: combatantData.initiative ?? rollInitiative(),
      hp: combatantData.hp ?? combatantData.maxHp ?? 10,
      maxHp: combatantData.maxHp ?? 10,
      ac: combatantData.ac ?? 10,
      conditions: combatantData.conditions ?? [],
      notes: combatantData.notes ?? '',
      isPlayer: combatantData.isPlayer ?? false,
      customCounters: combatantData.customCounters ?? [],
    }

    const updatedCombatants = [...(activeEncounter.value.combatants || []), newCombatant]
    updatedCombatants.sort((a, b) => b.initiative - a.initiative)

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { combatants: updatedCombatants }
    )

    return newCombatant
  }

  /**
   * Advance to next round
   */
  async function nextRound() {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { 
        round: activeEncounter.value.round + 1,
        initativeCount: 0,
      }
    )
  }

  /**
   * Reset encounter to round 1
   */
  async function resetEncounter() {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { 
        round: 1,
        initativeCount: 0,
      }
    )
  }

  /**
   * Duplicate a combatant
   * @param combatantId - The ID of the combatant to duplicate
   */
  async function duplicateCombatant(combatantId: string) {
    if (!activeEncounter.value || !currentLibraryId.value) {
      throw new Error('No active encounter or library')
    }

    const combatant = activeEncounter.value.combatants.find(c => c.id === combatantId)
    if (!combatant) {
      throw new Error('Combatant not found')
    }

    const newCombatant: Combatant = {
      ...combatant,
      id: generateCombatantId(),
      name: `${combatant.name} (Copy)`,
      initiative: rollInitiative(),
    }

    const updatedCombatants = [...activeEncounter.value.combatants, newCombatant]
    updatedCombatants.sort((a, b) => b.initiative - a.initiative)

    await combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { combatants: updatedCombatants }
    )

    return newCombatant
  }

  return {
    // State
    activeEncounter,
    currentLibraryId,
    
    // Methods
    addToActiveEncounter,
    removeFromActiveEncounter,
    rollInitiativeForCombatant,
    updateCombatant,
    addCustomCombatant,
    duplicateCombatant,
    nextRound,
    resetEncounter,
    
    // Utilities
    generateCombatantId,
    rollInitiative,
  }
}

