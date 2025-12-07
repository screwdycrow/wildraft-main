<template>
  <v-card
    class="character-card"
    :class="{ 'compact': compact }"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image Background -->
    <div class="card-background" :style="backgroundStyle"></div>
    
    <!-- Content -->
    <div class="card-content">
      <v-card-title class="card-title pb-1" :style="{ color: textColor, opacity: 0.95 }">
        <span class="text-h6 font-weight-bold">{{ item.name }}</span>
      </v-card-title>

      <v-card-subtitle v-if="!compact" class="pb-3" :style="{ color: textColor, opacity: 0.9 }">
        {{ characterData.race }} {{ characterData.class }}
        <span v-if="characterData.subclass">({{ characterData.subclass }})</span>
        (Level {{ characterData.level || 1 }})
      </v-card-subtitle>

      <!-- Stats Row -->
      <div class="stats-row mb-2">
        <div class="stat-item">
          <div class="stat-label" :style="{ color: textColor }">AC</div>
          <v-tooltip v-if="equippedModifiers.ac" location="top">
            <template #activator="{ props: tooltipProps }">
              <div class="stat-value modified-stat" :style="{ color: textColor }" v-bind="tooltipProps">
                {{ effectiveAC }}
              </div>
            </template>
            <span>Base: {{ characterData.ac || 10 }} + Items: {{ equippedModifiers.ac }}</span>
          </v-tooltip>
          <div v-else class="stat-value" :style="{ color: textColor }">
            {{ effectiveAC }}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label" :style="{ color: textColor }">HP</div>
          <v-tooltip v-if="equippedModifiers.maxHp" location="top">
            <template #activator="{ props: tooltipProps }">
              <div class="stat-value modified-stat" :style="{ color: textColor }" v-bind="tooltipProps">
                {{ characterData.hp || effectiveMaxHp }}
                <span v-if="effectiveMaxHp && characterData.hp !== effectiveMaxHp" class="stat-hp-max">
                  /{{ effectiveMaxHp }}
                </span>
              </div>
            </template>
            <span>Base: {{ characterData.maxHp || 0 }} + Items: {{ equippedModifiers.maxHp }}</span>
          </v-tooltip>
          <div v-else class="stat-value" :style="{ color: textColor }">
            {{ characterData.hp || effectiveMaxHp }}
            <span v-if="effectiveMaxHp && characterData.hp !== effectiveMaxHp" class="stat-hp-max">
              /{{ effectiveMaxHp }}
            </span>
          </div>
        </div>
        <div class="stat-item stat-item-speed">
          <div class="stat-label" :style="{ color: textColor }">SPEED</div>
          <v-tooltip v-if="equippedModifiers.speed || speedText.length > 8" location="top">
            <template #activator="{ props: tooltipProps }">
              <div 
                class="stat-value stat-value-speed" 
                :class="{ 'modified-stat': equippedModifiers.speed }"
                :style="{ color: textColor }"
                v-bind="tooltipProps"
              >
                {{ speedText }}
              </div>
            </template>
            <span v-if="equippedModifiers.speed">
              Base: {{ characterData.speed || '30' }}ft + Items: {{ equippedModifiers.speed }}ft
            </span>
            <span v-else>{{ speedText }}</span>
          </v-tooltip>
          <div v-else class="stat-value stat-value-speed" :style="{ color: textColor }">
            {{ speedText }}
          </div>
        </div>
      </div>

      <!-- Ability Scores -->
      <div class="abilities-container mb-3">
        <div v-for="ability in abilities" :key="ability.key" class="ability-item">
          <div class="ability-label" :style="{ color: textColor }">{{ ability.label }}</div>
          <v-tooltip v-if="equippedModifiers[ability.key as keyof typeof equippedModifiers]" location="top">
            <template #activator="{ props: tooltipProps }">
              <div class="ability-value modified-stat" :style="{ color: textColor }" v-bind="tooltipProps">
                {{ getAbilityScore(ability.key) }}
              </div>
            </template>
            <span>
              Base: {{ (characterData as any)[ability.key] || 10 }} + Items: {{ equippedModifiers[ability.key as keyof typeof equippedModifiers] }}
            </span>
          </v-tooltip>
          <div v-else class="ability-value" :style="{ color: textColor }">
            {{ getAbilityScore(ability.key) }}
          </div>
          <div class="ability-modifier" :style="{ color: textColor }">
            {{ getAbilityModifier(ability.key) }}
          </div>
        </div>
      </div>

      <!-- Actions (including equipped item actions) -->
      <div v-if="combinedActions.length > 0" class="features-list">
        <action-chip
          v-for="(action, index) in combinedActions"
          :key="index"
          :action="action"
          size="small"
          text-color="#FFFFFF"
          class="action-chip-opacity"
        />
      </div>

      <!-- Tags (Absolute Positioned) -->
      <div v-if="item.tags && item.tags.length > 0" class="tags-absolute">
        <v-chip
          v-for="tag in item.tags"
          :key="tag.id"
          :color="tag.color"
          size="x-small"
          class="tag-chip"
        >
          {{ tag.name }}
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, CharacterData, ItemModifier, InventoryItem, Action } from '@/types/item.types'
import type { ItemAction } from '@/types/item.DND_5E.types'
import ActionChip from '../common/ActionChip.vue'
import { getFileDownloadUrl } from '@/config/api'

interface Props {
  item: LibraryItem
  showActions?: boolean
  textColor?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  textColor: '#FFFFFF', // White by default, can be customized later
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const characterData = computed<CharacterData>(() => props.item.data as CharacterData)

// Calculate equipped item modifiers
const equippedModifiers = computed((): ItemModifier => {
  const inventory = characterData.value.inventory || []
  const equippedItems = inventory.filter((item: InventoryItem) => item.equipped && item.modifiers)
  
  const totalModifiers: ItemModifier = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    ac: 0,
    maxHp: 0,
    speed: 0,
    initiative: 0,
    savingThrowBonus: 0,
    strSavingThrow: 0,
    dexSavingThrow: 0,
    conSavingThrow: 0,
    intSavingThrow: 0,
    wisSavingThrow: 0,
    chaSavingThrow: 0,
    skillBonus: 0,
    resistances: '',
    immunities: '',
  }
  
  equippedItems.forEach((item: InventoryItem) => {
    const mods = item.modifiers!
    // Sum up numeric modifiers
    if (mods.str) totalModifiers.str! += mods.str
    if (mods.dex) totalModifiers.dex! += mods.dex
    if (mods.con) totalModifiers.con! += mods.con
    if (mods.int) totalModifiers.int! += mods.int
    if (mods.wis) totalModifiers.wis! += mods.wis
    if (mods.cha) totalModifiers.cha! += mods.cha
    if (mods.ac) totalModifiers.ac! += mods.ac
    if (mods.maxHp) totalModifiers.maxHp! += mods.maxHp
    if (mods.speed) totalModifiers.speed! += mods.speed
    if (mods.initiative) totalModifiers.initiative! += mods.initiative
    if (mods.savingThrowBonus) totalModifiers.savingThrowBonus! += mods.savingThrowBonus
    if (mods.strSavingThrow) totalModifiers.strSavingThrow! += mods.strSavingThrow
    if (mods.dexSavingThrow) totalModifiers.dexSavingThrow! += mods.dexSavingThrow
    if (mods.conSavingThrow) totalModifiers.conSavingThrow! += mods.conSavingThrow
    if (mods.intSavingThrow) totalModifiers.intSavingThrow! += mods.intSavingThrow
    if (mods.wisSavingThrow) totalModifiers.wisSavingThrow! += mods.wisSavingThrow
    if (mods.chaSavingThrow) totalModifiers.chaSavingThrow! += mods.chaSavingThrow
    if (mods.skillBonus) totalModifiers.skillBonus! += mods.skillBonus
    // Concatenate string modifiers
    if (mods.resistances) {
      totalModifiers.resistances = totalModifiers.resistances 
        ? `${totalModifiers.resistances}, ${mods.resistances}` 
        : mods.resistances
    }
    if (mods.immunities) {
      totalModifiers.immunities = totalModifiers.immunities 
        ? `${totalModifiers.immunities}, ${mods.immunities}` 
        : mods.immunities
    }
  })
  
  return totalModifiers
})

// Helper functions
function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

// Effective ability scores (base + equipment)
const effectiveAbilityScores = computed(() => ({
  str: (characterData.value.str || 10) + (equippedModifiers.value.str || 0),
  dex: (characterData.value.dex || 10) + (equippedModifiers.value.dex || 0),
  con: (characterData.value.con || 10) + (equippedModifiers.value.con || 0),
  int: (characterData.value.int || 10) + (equippedModifiers.value.int || 0),
  wis: (characterData.value.wis || 10) + (equippedModifiers.value.wis || 0),
  cha: (characterData.value.cha || 10) + (equippedModifiers.value.cha || 0),
}))

// Effective stats
const effectiveAC = computed(() => (characterData.value.ac || 10) + (equippedModifiers.value.ac || 0))
const effectiveMaxHp = computed(() => (characterData.value.maxHp || 0) + (equippedModifiers.value.maxHp || 0))
const effectiveSpeed = computed(() => {
  const baseSpeed = parseInt(String(characterData.value.speed || '30'), 10) || 30
  return baseSpeed + (equippedModifiers.value.speed || 0)
})

// Proficiency bonus
const proficiencyBonus = computed(() => {
  const level = characterData.value.level || 1
  return Math.floor((level - 1) / 4) + 2
})

// Ability modifiers (using effective scores)
const abilityModifiers = computed(() => ({
  str: calculateModifier(effectiveAbilityScores.value.str),
  dex: calculateModifier(effectiveAbilityScores.value.dex),
  con: calculateModifier(effectiveAbilityScores.value.con),
  int: calculateModifier(effectiveAbilityScores.value.int),
  wis: calculateModifier(effectiveAbilityScores.value.wis),
  cha: calculateModifier(effectiveAbilityScores.value.cha),
}))

// Combined actions (character actions + equipped item actions)
const combinedActions = computed(() => {
  const characterActions = characterData.value.actions || []
  const inventory = characterData.value.inventory || []
  
  // Get actions from equipped items
  const itemActions: Action[] = []
  inventory.forEach((item: InventoryItem) => {
    if (item.equipped && item.actions && item.actions.length > 0) {
      item.actions.forEach((action: ItemAction) => {
        // Calculate actual values if using character stats
        let calculatedToHit = action.toHit
        let calculatedRoll = action.roll
        
        if (action.useCharacterStats && action.abilityModifier) {
          const abilityMod = abilityModifiers.value[action.abilityModifier] || 0
          const profBonus = action.proficient !== false ? proficiencyBonus.value : 0
          const itemBonus = action.itemBonus || 0
          
          // Calculate to-hit: proficiency + ability modifier + item bonus
          const totalToHit = profBonus + abilityMod + itemBonus
          calculatedToHit = formatModifier(totalToHit)
          
          // Calculate damage roll if using character stats
          if (action.damageDice) {
            const damageAbilityMod = action.addAbilityToDamage !== false ? abilityMod : 0
            const totalDamageBonus = damageAbilityMod + itemBonus
            const bonusStr = totalDamageBonus !== 0 ? (totalDamageBonus > 0 ? `+${totalDamageBonus}` : `${totalDamageBonus}`) : ''
            calculatedRoll = `${action.damageDice}${bonusStr}${action.damageType ? ` ${action.damageType}` : ''}`
          }
        }
        
        // Create the action with calculated values and source item name
        itemActions.push({
          ...action,
          name: `${action.name} (${item.name})`,
          toHit: calculatedToHit,
          roll: calculatedRoll,
        })
      })
    }
  })
  
  return [...characterActions, ...itemActions]
})

const abilities = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
]

// Get featured image URL directly from the file object
const backgroundStyle = computed(() => {
  if (props.item.featuredImage?.downloadUrl) {
    const imageUrl = getFileDownloadUrl(props.item.featuredImage)
    return {
      backgroundImage: `url(${imageUrl})`,
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.3), rgba(155, 89, 182, 0.3))',
  }
})

function getAbilityScore(key: string): number {
  // Use effective ability scores (includes equipment modifiers)
  return (effectiveAbilityScores.value as any)[key] || 10
}

function getAbilityModifier(key: string): string {
  // Use effective ability scores (includes equipment modifiers)
  const modifier = (abilityModifiers.value as any)[key] || 0
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// Truncate speed text for display
const speedText = computed(() => {
  return `${effectiveSpeed.value} ft.`
})
</script>

<style scoped>
.character-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-card-background), 0.8) !important;
  border-radius: 16px !important;
  border: none !important;
}

.character-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.character-card:hover .card-background {
  opacity: 0.4;
}

.card-content {
  position: relative;
  z-index: 1;
  padding: 16px;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.card-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.stats-row {
  display: flex;
  justify-content: space-around;
  gap: 6px;
  padding: 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item {
  text-align: center;
  flex: 1;
  min-width: 0;
}

.stat-item-speed {
  flex: 1.2;
}

.stat-label {
  font-size: clamp(0.55rem, 1.2vw, 0.65rem);
  font-weight: 500;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  font-weight: 600;
  line-height: 1.2;
  opacity: 0.85;
  white-space: nowrap;
}

.stat-value-speed {
  font-size: clamp(0.7rem, 1.8vw, 0.95rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.stat-hp-max {
  font-size: 0.7em;
  opacity: 0.7;
  font-weight: 400;
}

.modified-stat {
  position: relative;
  text-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
}

.modified-stat::after {
  content: '⭐';
  position: absolute;
  top: -6px;
  right: -8px;
  font-size: 0.6em;
  opacity: 0.9;
}

.abilities-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.ability-item {
  text-align: center;
  padding: 3px;
}

.ability-label {
  font-size: clamp(0.5rem, 1vw, 0.6rem);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.ability-value {
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 600;
  line-height: 1;
  opacity: 0.85;
}

.ability-modifier {
  font-size: clamp(0.55rem, 1.2vw, 0.65rem);
  opacity: 0.75;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  padding-right: 2px;
}

.features-list::-webkit-scrollbar {
  width: 1px;
}

.features-list::-webkit-scrollbar-track {
  background: transparent;
}

.features-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.features-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-chip-opacity {
  opacity: 0.9;
  flex-shrink: 0;
}

.tags-absolute {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  z-index: 2;
}

.tag-chip {
  font-size: 0.6rem !important;
  height: 16px !important;
  padding: 0 4px !important;
}

/* Compact Mode */
.character-card.compact .card-content {
  padding: 8px;
}

.character-card.compact .card-title {
  font-size: 0.875rem !important;
  padding-bottom: 4px !important;
  line-height: 1.2 !important;
}

.character-card.compact .card-title .text-h6 {
  font-size: 0.875rem !important;
}

.character-card.compact .stats-row {
  padding: 4px 0;
  margin-bottom: 4px;
  gap: 4px;
}

.character-card.compact .stat-label {
  font-size: 0.5rem;
}

.character-card.compact .stat-value {
  font-size: 0.85rem;
}

.character-card.compact .stat-value-speed {
  font-size: 0.65rem;
}

.character-card.compact .abilities-container {
  padding: 4px;
  gap: 4px;
  margin-bottom: 4px;
}

.character-card.compact .ability-label {
  font-size: 0.45rem;
}

.character-card.compact .ability-value {
  font-size: 0.75rem;
}

.character-card.compact .ability-modifier {
  font-size: 0.5rem;
}

.character-card.compact .features-list {
  max-height: 60px;
  gap: 2px;
}

.character-card.compact .tag-chip {
  font-size: 0.5rem !important;
  height: 12px !important;
  padding: 0 3px !important;
}
</style>
