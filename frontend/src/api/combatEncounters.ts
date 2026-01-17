import apiClient from './axios'
import type {
  CombatEncounter,
  CreateCombatEncounterRequest,
  UpdateCombatEncounterRequest,
} from '@/types/combat.types'

/**
 * Combat Encounters API Service
 * 
 * Manages D&D combat encounters within libraries.
 * Each encounter tracks initiative order, combat rounds, combatants with their stats and conditions,
 * and custom counters for various gameplay mechanics.
 * 
 * Base URL: /api/libraries/:libraryId/encounters
 * 
 * Permissions:
 * - GET requests: Requires any library access (VIEWER, EDITOR, or OWNER)
 * - POST/PUT/DELETE requests: Requires EDITOR or OWNER access
 */

export const combatEncountersApi = {
  /**
   * Get all combat encounters in a library
   * @param libraryId - The ID of the library
   * @returns Promise with array of combat encounters
   */
  async getAll(libraryId: number): Promise<CombatEncounter[]> {
    const response = await apiClient.get(`/libraries/${libraryId}/encounters`)
    return response.data.encounters
  },

  /**
   * Get a single combat encounter by ID
   * @param libraryId - The ID of the library
   * @param encounterId - The ID of the encounter
   * @returns Promise with the combat encounter
   */
  async getById(libraryId: number, encounterId: number): Promise<CombatEncounter> {
    const response = await apiClient.get(`/libraries/${libraryId}/encounters/${encounterId}`)
    return response.data.encounter
  },

  /**
   * Create a new combat encounter
   * @param libraryId - The ID of the library
   * @param data - The encounter data
   * @returns Promise with the created combat encounter
   */
  async create(libraryId: number, data: CreateCombatEncounterRequest): Promise<CombatEncounter> {
    const response = await apiClient.post(`/libraries/${libraryId}/encounters`, data)
    return response.data.encounter
  },

  /**
   * Update an existing combat encounter
   * @param libraryId - The ID of the library
   * @param encounterId - The ID of the encounter
   * @param data - The updated encounter data
   * @returns Promise with the updated combat encounter
   */
  async update(
    libraryId: number,
    encounterId: number,
    data: UpdateCombatEncounterRequest
  ): Promise<CombatEncounter> {
    console.log('[combatAPI] Sending update request:', {
      libraryId,
      encounterId,
      data
    })
    const response = await apiClient.put(`/libraries/${libraryId}/encounters/${encounterId}`, data)
    console.log('[combatAPI] Raw response:', response)
    console.log('[combatAPI] Response data:', response.data)
    console.log('[combatAPI] Encounter from response:', response.data.encounter)
    console.log('[combatAPI] Combatants from response:', response.data.encounter?.combatants)
    return response.data.encounter
  },

  /**
   * Delete a combat encounter
   * @param libraryId - The ID of the library
   * @param encounterId - The ID of the encounter
   * @returns Promise that resolves when the encounter is deleted
   */
  async delete(libraryId: number, encounterId: number): Promise<void> {
    await apiClient.delete(`/libraries/${libraryId}/encounters/${encounterId}`)
  },
}

