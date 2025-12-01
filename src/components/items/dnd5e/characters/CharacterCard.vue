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
          <div class="stat-value" :style="{ color: textColor }">{{ characterData.ac || '10' }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label" :style="{ color: textColor }">HP</div>
          <div class="stat-value" :style="{ color: textColor }">
            {{ characterData.hp || characterData.maxHp || '10' }}
            <span v-if="characterData.maxHp && characterData.hp !== characterData.maxHp" class="stat-hp-max">
              /{{ characterData.maxHp }}
            </span>
          </div>
        </div>
        <div class="stat-item stat-item-speed">
          <div class="stat-label" :style="{ color: textColor }">SPEED</div>
          <v-tooltip v-if="speedText && speedText.length > 8" location="top">
            <template #activator="{ props: tooltipProps }">
              <div 
                class="stat-value stat-value-speed" 
                :style="{ color: textColor }"
                v-bind="tooltipProps"
              >
                {{ speedText }}
              </div>
            </template>
            <span>{{ characterData.speed || '30 ft.' }}</span>
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
          <div class="ability-value" :style="{ color: textColor }">
            {{ getAbilityScore(ability.key) }}
          </div>
          <div class="ability-modifier" :style="{ color: textColor }">
            {{ getAbilityModifier(ability.key) }}
          </div>
        </div>
      </div>

      <!-- Actions (if any) -->
      <div v-if="characterData.actions && characterData.actions.length > 0" class="features-list">
        <action-chip
          v-for="(action, index) in characterData.actions"
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
import type { LibraryItem, CharacterData } from '@/types/item.types'
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
  return (characterData.value as any)[key] || 10
}

function getAbilityModifier(key: string): string {
  const score = getAbilityScore(key)
  const modifier = Math.floor((score - 10) / 2)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

// Truncate speed text for display
const speedText = computed(() => {
  const speed = characterData.value.speed || '30 ft.'
  return speed
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
