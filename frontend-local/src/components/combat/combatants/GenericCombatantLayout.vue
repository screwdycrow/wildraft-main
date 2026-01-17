<template>
  <div class="combatant-item" :class="{ 'is-player': combatant.isPlayer }">
    <!-- Featured Image Background -->
    <div 
      v-if="displayFeaturedImage" 
      class="combatant-background"
      :class="{ 'portal-mode-image': portalMode }"
      :style="{ backgroundImage: `url(${displayFeaturedImage})` }"
    />
    
    <!-- Hover Actions (Top Left) - Hidden in portal mode -->
    <div v-if="!portalMode" class="hover-actions">
      <v-btn
        icon="mdi-pencil"
        size="x-small"
        variant="tonal"
        color="primary"
        @click.stop="openEditDialog"
      >
        <v-icon size="small" />
        <v-tooltip activator="parent" location="bottom">
          Edit Combatant
        </v-tooltip>
      </v-btn>
      <v-btn
        icon="mdi-content-duplicate"
        size="x-small"
        variant="tonal"
        color="info"
        @click.stop="handleDuplicate"
      >
        <v-icon size="small" />
        <v-tooltip activator="parent" location="bottom">
          Duplicate
        </v-tooltip>
      </v-btn>
      <v-btn
        icon="mdi-close"
        size="x-small"
        variant="tonal"
        color="error"
        @click.stop="handleRemove"
      >
        <v-icon size="small" />
        <v-tooltip activator="parent" location="bottom">
          Remove
        </v-tooltip>
      </v-btn>
    </div>
    
    <!-- Main Content Container with Flexbox -->
    <div class="combatant-main">
      <!-- Initiative Badge (Left Side) -->
      <div class="initiative-badge" :class="{ 'clickable': !portalMode }" @click="!portalMode && editInitiative()">
        <span class="initiative-number">{{ combatant.initiative }}</span>
        <v-icon v-if="!portalMode" icon="mdi-pencil" size="x-small" class="edit-icon" />
      </div>
      
      <div class="combatant-content">
      <!-- Row 1: Name -->
      <div class="row-1">
        <div class="name-section" :class="{ 'clickable': !portalMode }" @click="!portalMode && (showDetailsDialog = true)">
          <h3 class="combatant-name">{{ combatant.name }}</h3>
          <div v-if="subtitle" class="combatant-subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <!-- Row 2: AC, HP Chip, and HP Bar -->
      <div class="row-2">
    
        <div v-if="showHp && showHealth" class="stat-chip hp-chip" :class="{ 'clickable': !portalMode }" @click="!portalMode && editHp()">
          <v-icon icon="mdi-heart" size="small" />
          <span>{{ combatant.hp }}/{{ combatant.maxHp }}</span>
        </div>
        
        <div v-if="showHp && showHealth" class="hp-bar-container" :class="{ 'clickable': !portalMode }" @click="!portalMode && editHp()">
          <v-progress-linear
            :model-value="hpPercentage"
            :color="hpColor"
            height="6"
            rounded
          />
        </div>
        <div v-if="showAC" class="stat-chip ac-chip">
          <v-icon icon="mdi-shield" size="small" />
          <span>{{ combatant.ac }}</span>
        </div>
        
      </div>

      <!-- Row 3: Conditions and Counters - Hidden in portal mode -->
      <div v-if="hasRow3Content && !portalMode" class="row-3">
        <!-- Conditions -->
        <div v-if="combatant.conditions && combatant.conditions.length > 0" class="conditions-inline">
          <v-chip
            v-for="condition in combatant.conditions"
            :key="condition"
            size="x-small"
            variant="tonal"
            color="warning"
          >
            {{ condition }}
          </v-chip>
        </div>

        <!-- Custom Counters -->
        <div v-if="combatant.customCounters && combatant.customCounters.length > 0" class="counters-inline clickable" @click="editCounters">
          <div 
            v-for="counter in combatant.customCounters" 
            :key="counter.id"
            class="counter-badge"
          >
            <span class="counter-name">{{ counter.name }}:</span>
            <span class="counter-value">{{ counter.value }}/{{ counter.max }}</span>
          </div>
        </div>
      </div>

      <!-- Actions (if any) -->
      <div v-if="showActions && displayActions && displayActions.length > 0" class="actions-row">
        <action-chip
          v-for="(action, index) in displayActions"
          :key="index"
          :action="action"
          size="x-small"
          class="action-chip-item"
        />
      </div>
      </div>
    </div>

    <!-- Details Dialog -->
    <CombatantDetailsDialog
      v-model="showDetailsDialog"
      :combatant="combatant"
    />

    <!-- HP Editor -->
    <amount-editor
      v-model="showHpEditor"
      :current-amount="combatant.hp"
      :max-amount="combatant.maxHp"
      label="Current HP"
      title="Edit HP"
      icon="mdi-heart"
      icon-color="error"
      :presets="[20, 10, 5, 1, -1, -5, -10, -20]"
      :min-amount="0"
      :show-max="true"
      @update:amount="saveHp"
    />

    <!-- Initiative Editor Dialog -->
    <v-dialog v-model="showInitiativeEditor" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-dice-d20" color="purple" class="mr-2" />
          Edit Initiative
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="localInitiative"
            label="Initiative"
            type="number"
            variant="outlined"
            density="compact"
          />
          <v-btn color="primary" block class="mt-2" @click="rollNewInitiative">
            <v-icon icon="mdi-dice-d20" start />
            Roll Initiative
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showInitiativeEditor = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveInitiative">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Combatant Form -->
    <combatant-form
      v-model="showEditDialog"
      :combatant="combatant"
      @save="handleSaveCombatant"
    />

    <!-- Counters Editor Dialog -->
    <v-dialog v-model="showCountersEditor" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-counter" color="info" class="mr-2" />
          Edit Counters
        </v-card-title>
        <v-card-text>
          <div v-for="(counter, index) in localCounters" :key="counter.id" class="counter-editor mb-3">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center">
                <v-icon 
                  v-if="counter.icon" 
                  :icon="counter.icon" 
                  size="small" 
                  :color="counter.color || 'primary'"
                  class="mr-2"
                />
                <span class="font-weight-bold">{{ counter.name }}</span>
              </div>
              <div class="d-flex align-center gap-2">
                <v-btn
                  icon="mdi-minus"
                  size="x-small"
                  variant="tonal"
                  color="error"
                  :disabled="counter.value <= (counter.min ?? 0)"
                  @click="adjustCounterValue(index, -1)"
                />
                <span class="text-h6 font-weight-bold mx-2">
                  {{ counter.value }}/{{ counter.max ?? '∞' }}
                </span>
                <v-btn
                  icon="mdi-plus"
                  size="x-small"
                  variant="tonal"
                  color="success"
                  :disabled="counter.max !== undefined && counter.value >= counter.max"
                  @click="adjustCounterValue(index, 1)"
                />
              </div>
            </div>
            <v-progress-linear
              v-if="counter.max !== undefined"
              :model-value="getCounterProgress(counter)"
              :color="counter.color || 'primary'"
              height="4"
              rounded
            />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showCountersEditor = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveCounters">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Combatant, CombatCounter } from '@/types/combat.types'
import CombatantDetailsDialog from '../CombatantDetailsDialog.vue'
import CombatantForm from '../CombatantForm.vue'
import AmountEditor from '@/components/common/AmountEditor.vue'
import ActionChip from '@/components/items/dnd5e/common/ActionChip.vue'
import { useCombat } from '@/composables/useCombat'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'vue-toastification'

interface Props {
  combatant: Combatant
  subtitle?: string
  featuredImage?: string
  showHealth?: boolean
  showAC?: boolean
  showActions?: boolean
  portalMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHealth: true,
  showAC: true,
  showActions: true,
  portalMode: false,
})
const { rollInitiativeForCombatant, updateCombatant, removeFromActiveEncounter, duplicateCombatant } = useCombat()
const filesStore = useFilesStore()
const toast = useToast()

const showDetailsDialog = ref(false)
const showHpEditor = ref(false)
const showInitiativeEditor = ref(false)
const showCountersEditor = ref(false)
const showEditDialog = ref(false)

const localInitiative = ref(0)
const localCounters = ref<CombatCounter[]>([])

// Load featured image URL from combatant's featuredImageId
const featuredImageUrl = ref('')
watch(
  () => props.combatant.featuredImageId,
  async (featuredImageId) => {
    if (featuredImageId) {
      try {
        featuredImageUrl.value = await filesStore.getDownloadUrl(featuredImageId)
      } catch (error) {
        console.error('Failed to load combatant featured image:', error)
        featuredImageUrl.value = ''
      }
    } else {
      featuredImageUrl.value = ''
    }
  },
  { immediate: true }
)

// Use loaded URL if available, otherwise fallback to prop
const displayFeaturedImage = computed(() => {
  return featuredImageUrl.value || props.featuredImage || ''
})

const showHp = computed(() => {
  return props.combatant.maxHp !== undefined && props.combatant.maxHp > 0
})

const hpPercentage = computed(() => {
  if (!showHp.value) return 0
  return (props.combatant.hp / props.combatant.maxHp) * 100
})

const hpColor = computed(() => {
  const percentage = hpPercentage.value
  if (percentage > 75) return 'success'
  if (percentage > 50) return 'info'
  if (percentage > 25) return 'warning'
  return 'error'
})

const hasRow3Content = computed(() => {
  return (props.combatant.conditions && props.combatant.conditions.length > 0) ||
         (props.combatant.customCounters && props.combatant.customCounters.length > 0)
})

const displayActions = computed(() => {
  return props.combatant.actions || []
})

function editHp() {
  showHpEditor.value = true
}

async function saveHp(newHp: number) {
  await updateCombatant(props.combatant.id, {
    ...props.combatant,
    hp: Math.max(0, Math.min(props.combatant.maxHp, newHp)),
  })
}

function editInitiative() {
  localInitiative.value = props.combatant.initiative
  showInitiativeEditor.value = true
}

async function rollNewInitiative() {
  const newInitiative = await rollInitiativeForCombatant(props.combatant.id)
  localInitiative.value = newInitiative
}

async function saveInitiative() {
  await updateCombatant(props.combatant.id, {
    ...props.combatant,
    initiative: localInitiative.value,
  })
  showInitiativeEditor.value = false
}

function editCounters() {
  localCounters.value = JSON.parse(JSON.stringify(props.combatant.customCounters || []))
  showCountersEditor.value = true
}

function adjustCounterValue(index: number, delta: number) {
  const counter = localCounters.value[index]
  if (!counter) return
  
  const min = counter.min ?? 0
  const max = counter.max ?? Number.MAX_SAFE_INTEGER
  const newValue = counter.value + delta
  
  counter.value = Math.max(min, Math.min(max, newValue))
}

function getCounterProgress(counter: CombatCounter): number {
  if (counter.max === undefined || counter.max === null) return 100
  const min = counter.min ?? 0
  const range = counter.max - min
  if (range <= 0) return 100
  const progress = ((counter.value - min) / range) * 100
  return Math.min(100, Math.max(0, progress))
}

async function saveCounters() {
  await updateCombatant(props.combatant.id, {
    ...props.combatant,
    customCounters: localCounters.value,
  })
  showCountersEditor.value = false
}

function openEditDialog() {
  showEditDialog.value = true
}

async function handleSaveCombatant(combatantData: Partial<Combatant>) {
  try {
    await updateCombatant(props.combatant.id, {
      ...props.combatant,
      ...combatantData,
      // Ensure HP doesn't exceed maxHp
      hp: Math.min(combatantData.hp ?? props.combatant.hp, combatantData.maxHp ?? props.combatant.maxHp),
    })
    
    toast.success('Combatant updated!')
  } catch (error: any) {
    toast.error(error.message || 'Failed to update combatant')
  }
}

async function handleRemove() {
  if (!confirm(`Remove ${props.combatant.name} from combat?`)) return
  
  try {
    await removeFromActiveEncounter(props.combatant.id)
    toast.success('Combatant removed')
  } catch (error: any) {
    toast.error(error.message || 'Failed to remove combatant')
  }
}

async function handleDuplicate() {
  try {
    await duplicateCombatant(props.combatant.id)
    toast.success('Combatant duplicated')
  } catch (error: any) {
    toast.error(error.message || 'Failed to duplicate combatant')
  }
}
</script>

<style scoped>
.combatant-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.combatant-item:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.combatant-item:hover .hover-actions {
  opacity: 1;
}

.combatant-item.is-player {
  border-color: rgba(var(--v-theme-primary), 1);
}

.combatant-background {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: right center;
  background-repeat: no-repeat;
  opacity: 0.5;
  z-index: 0;
  /* Right-aligned 3:2 ratio with fade to left */
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0) 100%);
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0) 100%);
  /* Maintain 3:2 aspect ratio by constraining width */
  max-width: calc(100% * 2 / 4);
}

/* Portal Mode: 1:1 ratio right-aligned with fade to left (same style as normal, just square) */
.combatant-background.portal-mode-image {
  /* 1:1 aspect ratio (square) - width equals height of container */
  aspect-ratio: 1 / 1;
  width: auto;
  height: 100%;
}

.hover-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.combatant-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
}

.combatant-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.initiative-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.initiative-badge:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.initiative-number {
  font-size: 16px;
  font-weight: bold;
  color: white;
}

.edit-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.initiative-badge:hover .edit-icon {
  opacity: 1;
}

/* Row 1: Name */
.row-1 {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.name-section {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  transition: opacity 0.2s;
}

.name-section:hover {
  opacity: 0.8;
}

.combatant-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.combatant-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Row 2: AC, HP, HP Bar */
.row-2 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.stat-chip.clickable {
  cursor: pointer;
}

.stat-chip.clickable:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.ac-chip {
  min-width: 40px;
  justify-content: center;
}

.hp-chip {
  min-width: 60px;
  justify-content: center;
}

.hp-bar-container {
  flex: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.hp-bar-container:hover {
  transform: scaleY(1.3);
}

/* Row 3: Conditions and Counters */
.row-3 {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.conditions-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.counters-inline {
  display: flex;
  gap: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.counters-inline:hover {
  opacity: 0.8;
}

.counter-badge {
  display: flex;
  gap: 2px;
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  white-space: nowrap;
}

.counter-name {
  color: rgba(255, 255, 255, 0.7);
}

.counter-value {
  font-weight: bold;
  color: white;
}

/* Actions Row */
.actions-row {
  display: flex;
  gap: 4px;
  opacity:0.8;
  margin-top: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05);
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;
}

.actions-row::-webkit-scrollbar {
  height: 4px;
}

.actions-row::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.actions-row::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.actions-row::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.action-chip-item {
  flex-shrink: 0;
  opacity: 0.7;
}

.clickable {
  cursor: pointer;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.preset-buttons-small {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.counter-editor {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.counter-editor:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.gap-2 {
  gap: 8px;
}
</style>
