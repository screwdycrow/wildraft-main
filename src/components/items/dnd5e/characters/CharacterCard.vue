<template>
  <v-card
    class="character-card"
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

      <v-card-subtitle class="pb-3" :style="{ color: textColor, opacity: 0.9 }">
        {{ characterData.race }} {{ characterData.class }}
        <span v-if="characterData.subclass">({{ characterData.subclass }})</span>
        (CR: {{ characterData.level || 1 }})
      </v-card-subtitle>

      <!-- Stats Row -->
      <div class="stats-row mb-2" :style="{ opacity: 0.95 }">
        <div class="stat-item">
          <div class="stat-label" :style="{ color: textColor }">AC</div>
          <div class="stat-value" :style="{ color: textColor }">{{ characterData.ac || '10' }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label" :style="{ color: textColor }">HP</div>
          <div class="stat-value" :style="{ color: textColor }">{{ characterData.maxHp || '10' }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label" :style="{ color: textColor }">SPEED</div>
          <div class="stat-value" :style="{ color: textColor }">{{ characterData.speed || '30 ft.' }}</div>
        </div>
      </div>

      <!-- Ability Scores -->
      <div class="abilities-row mb-3" :style="{ opacity: 0.95 }">
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

      <!-- Actions/Features (if any) -->
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
</script>

<style scoped>
.character-card {
  position: relative;
  overflow: hidden;
  min-height: 300px;
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
  opacity: 0.5;
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
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-label {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.2;
  opacity: 0.9;
}

.abilities-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.ability-item {
  text-align: center;
  padding: 4px;
}

.ability-label {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.ability-value {
  font-size: 1.1rem;
  font-weight: bold;
  line-height: 1;
  opacity: 0.9;
}

.ability-modifier {
  font-size: 0.7rem;
  opacity: 0.9;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  max-height: 100px;
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
</style>
