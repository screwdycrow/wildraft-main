<template>
  <div class="combat-encounter">
    <!-- Header with Round Counter -->
    <div v-if="activeEncounter" class="combat-header">
      <div class="round-section">
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          size="small"
          @click="previousInitiative"
        />
        
        <div class="round-display">
          <div class="round-label">ROUND</div>
          <div class="round-number">{{ activeEncounter.round }}</div>
        </div>
        
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          @click="nextInitiative"
        />
        
        <v-btn
          icon="mdi-cog"
          variant="text"
          size="small"
          @click="showSettingsMenu = true"
        />
      </div>
    </div>

    <v-divider v-if="activeEncounter" />

    <!-- Settings Menu -->
    <v-menu v-model="showSettingsMenu" :close-on-content-click="false" attach=".combat-header">
      <v-list density="compact">
        <v-list-item @click="resetToFirstInitiative">
          <template v-slot:prepend>
            <v-icon icon="mdi-skip-backward" />
          </template>
          <v-list-item-title>Reset to First Initiative</v-list-item-title>
          <v-list-item-subtitle>Move to first combatant</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item @click="resetRounds">
          <template v-slot:prepend>
            <v-icon icon="mdi-refresh" />
          </template>
          <v-list-item-title>Reset Rounds</v-list-item-title>
          <v-list-item-subtitle>Set round counter to 1</v-list-item-subtitle>
        </v-list-item>
        
        <v-divider class="my-2" />
        
        <v-list-item @click="clearAllCombatants" class="text-error">
          <template v-slot:prepend>
            <v-icon icon="mdi-delete-sweep" color="error" />
          </template>
          <v-list-item-title>Reset All Combat</v-list-item-title>
          <v-list-item-subtitle>Clear all combatants</v-list-item-subtitle>
        </v-list-item>
        
        <v-divider class="my-2" />
        
        <v-list-item @click="showManageDialog = true">
          <template v-slot:prepend>
            <v-icon icon="mdi-swap-horizontal" />
          </template>
          <v-list-item-title>Switch Encounter</v-list-item-title>
        </v-list-item>
        
        <v-list-item @click="handleDeleteEncounter(activeEncounter!.id)" class="text-error">
          <template v-slot:prepend>
            <v-icon icon="mdi-delete" color="error" />
          </template>
          <v-list-item-title>Delete Encounter</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <!-- Active Encounter Display -->
    <div v-if="activeEncounter" class="combatants-container">
      <!-- Combatants List -->
      <div class="combatants-list">
        <div v-if="!activeEncounter.combatants || activeEncounter.combatants.length === 0" class="empty-state">
          <v-icon icon="mdi-account-off" size="48" color="grey" class="mb-2 opacity-50" />
          <p class="text-caption text-grey mb-2">No combatants yet</p>
          <p class="text-caption text-grey">Hover over library items and click</p>
          <p class="text-caption text-grey">
            <v-icon icon="mdi-sword-cross" size="small" color="success" class="mx-1" />
            to add them to combat
          </p>
        </div>
        <div v-else>
          <combatant-wrapper
            v-for="(combatant, index) in sortedCombatants"
            :key="combatant.id"
            :combatant="combatant"
            :class="{ 'active-combatant': index === activeInitiativeIndex, 'not-active-combatant': index !== activeInitiativeIndex }"
            :style="{ opacity: index === activeInitiativeIndex ? 1 : getCombatantOpacity(index) }"
          />
        </div>
      </div>

      <!-- Add Simple Combatant Button -->
      <div class="add-combatant-section">
        <v-btn
          block
          color="purple"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="showAddCombatantDialog = true"
        >
          ADD SIMPLE COMBATANT
        </v-btn>
      </div>
    </div>

    <!-- No Active Encounter -->
    <div v-else class="empty-state pa-4">
      <v-icon icon="mdi-sword-cross" size="48" color="grey" class="mb-2 opacity-50" />
      <p class="text-caption text-grey mb-3">No active encounter</p>
      <v-btn
        color="primary"
        variant="tonal"
        size="small"
        @click="showCreateDialog = true"
      >
        Create Encounter
      </v-btn>
    </div>

    <!-- Create Encounter Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="500" :attach="false">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold pa-6">
          Create Combat Encounter
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <v-text-field
            v-model="newEncounterName"
            label="Encounter Name"
            variant="outlined"
            density="comfortable"
            :rules="[v => !!v || 'Name is required']"
            autofocus
          />
          <v-textarea
            v-model="newEncounterDescription"
            label="Description (Optional)"
            variant="outlined"
            density="comfortable"
            rows="3"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="closeCreateDialog"
            :disabled="isCreating"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleCreateEncounter"
            :loading="isCreating"
            :disabled="!newEncounterName.trim()"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Simple Combatant Form -->
    <combatant-form
      v-model="showAddCombatantDialog"
      @save="handleAddSimpleCombatant"
    />

    <!-- Manage Encounters Dialog -->
    <v-dialog v-model="showManageDialog" max-width="600" :attach="false">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold pa-6">
          Manage Encounters
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <v-list v-if="sortedEncounters.length > 0" class="bg-transparent">
            <v-list-item
              v-for="encounter in sortedEncounters"
              :key="encounter.id"
              class="mb-2 rounded"
              :class="{ 'bg-primary-darken-1': encounter.id === activeEncounter?.id }"
              @click="handleSetActive(encounter.id)"
            >
              <template v-slot:prepend>
                <v-icon
                  :icon="encounter.id === activeEncounter?.id ? 'mdi-check-circle' : 'mdi-sword-cross'"
                  :color="encounter.id === activeEncounter?.id ? 'success' : 'grey'"
                />
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ encounter.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Round {{ encounter.round }} • {{ encounter.combatants.length }} combatants
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click.stop="handleDeleteEncounter(encounter.id)"
                />
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8">
            <v-icon icon="mdi-sword-cross" size="48" color="grey" class="mb-2 opacity-50" />
            <p class="text-caption text-grey">No encounters yet</p>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showManageDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { useLibraryStore } from '@/stores/library'
import { useCombat } from '@/composables/useCombat'
import { useToast } from 'vue-toastification'
import CombatantWrapper from './combatants/CombatantWrapper.vue'
import CombatantForm from './CombatantForm.vue'
const combatStore = useCombatEncountersStore()
const libraryStore = useLibraryStore()
const { addCustomCombatant } = useCombat()
const toast = useToast()

const { activeEncounter, sortedEncounters } = storeToRefs(combatStore)

// Dialog state
const showCreateDialog = ref(false)
const showManageDialog = ref(false)
const showSettingsMenu = ref(false)
const showAddCombatantDialog = ref(false)
const newEncounterName = ref('')
const newEncounterDescription = ref('')
const isCreating = ref(false)


const currentLibraryId = computed(() => libraryStore.currentLibrary?.id)

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

function closeCreateDialog() {
  showCreateDialog.value = false
  newEncounterName.value = ''
  newEncounterDescription.value = ''
}

async function handleCreateEncounter() {
  if (!newEncounterName.value.trim() || !currentLibraryId.value) return

  isCreating.value = true
  try {
    await combatStore.createEncounter(currentLibraryId.value, {
      name: newEncounterName.value.trim(),
      description: newEncounterDescription.value.trim() || undefined,
      round: 1,
      initativeCount: 0,
      counters: [],
      combatants: [],
    })
    
    toast.success('Encounter created successfully')
    closeCreateDialog()
  } catch (error: any) {
    toast.error(error.message || 'Failed to create encounter')
  } finally {
    isCreating.value = false
  }
}

function handleSetActive(encounterId: number) {
  combatStore.setActiveEncounter(encounterId)
  showManageDialog.value = false
  toast.success('Active encounter changed')
}

async function handleDeleteEncounter(encounterId: number) {
  if (!currentLibraryId.value) return

  if (!confirm('Are you sure you want to delete this encounter? This action cannot be undone.')) {
    return
  }

  try {
    await combatStore.deleteEncounter(currentLibraryId.value, encounterId)
    toast.success('Encounter deleted successfully')
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete encounter')
  }
}

// Initiative and Round Management
// These use debounced backend updates - UI updates immediately, backend sync is debounced
function nextInitiative() {
  if (!activeEncounter.value || !currentLibraryId.value) return
  
  const newCount = activeEncounter.value.initativeCount + 1
  const maxCount = sortedCombatants.value.length
  
  // If we've gone through all combatants, increment round
  if (newCount >= maxCount && maxCount > 0) {
    combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      {
        round: activeEncounter.value.round + 1,
        initativeCount: 0,
      },
      true // debounceBackend = true
    )
  } else {
    combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { initativeCount: newCount },
      true // debounceBackend = true
    )
  }
}

function previousInitiative() {
  if (!activeEncounter.value || !currentLibraryId.value) return
  
  const newCount = activeEncounter.value.initativeCount - 1
  
  // If we go below 0, go to previous round
  if (newCount < 0 && activeEncounter.value.round > 1) {
    combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      {
        round: activeEncounter.value.round - 1,
        initativeCount: Math.max(0, sortedCombatants.value.length - 1),
      },
      true // debounceBackend = true
    )
  } else if (newCount >= 0) {
    combatStore.updateEncounter(
      currentLibraryId.value,
      activeEncounter.value.id,
      { initativeCount: newCount },
      true // debounceBackend = true
    )
  }
}

function resetToFirstInitiative() {
  if (!activeEncounter.value || !currentLibraryId.value) return
  
  combatStore.updateEncounter(
    currentLibraryId.value,
    activeEncounter.value.id,
    { initativeCount: 0 },
    true // debounceBackend = true
  )
  showSettingsMenu.value = false
  toast.success('Reset to first initiative')
}

function resetRounds() {
  if (!activeEncounter.value || !currentLibraryId.value) return
  
  combatStore.updateEncounter(
    currentLibraryId.value,
    activeEncounter.value.id,
    {
      round: 1,
      initativeCount: 0,
    },
    true // debounceBackend = true
  )
  showSettingsMenu.value = false
  toast.success('Rounds reset to 1')
}

async function clearAllCombatants() {
  if (!activeEncounter.value || !currentLibraryId.value) return
  
  if (!confirm('Are you sure you want to remove all combatants? This action cannot be undone.')) {
    return
  }
  
  await combatStore.updateEncounter(
    currentLibraryId.value,
    activeEncounter.value.id,
    {
      combatants: [],
      round: 1,
      initativeCount: 0,
    }
  )
  showSettingsMenu.value = false
  toast.success('All combatants cleared')
}

// Add Simple Combatant
async function handleAddSimpleCombatant(combatantData: any) {
  try {
    await addCustomCombatant({
      name: combatantData.name,
      maxHp: combatantData.maxHp || 10,
      hp: combatantData.hp || combatantData.maxHp || 10,
      ac: combatantData.ac || 10,
      isPlayer: combatantData.isPlayer || false,
      initiative: combatantData.initiative || 0,
      actions: combatantData.actions || [],
      customCounters: combatantData.customCounters || [],
      conditions: combatantData.conditions || [],
      notes: combatantData.notes || '',
    })
    
    toast.success('Combatant added!')
  } catch (error: any) {
    toast.error(error.message || 'Failed to add combatant')
  }
}
</script>

<style scoped>
.combat-encounter {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.combat-header {
  background: rgba(0, 0, 0, 0.3);
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
  border: 1px solid !important;
  background: var(--ace) !important;
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

.add-combatant-section {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
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
