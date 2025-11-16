<template>
  <div class="token-component">
    <div class="token-image-container" :style="tokenStyle">
      <img
        v-if="tokenImageUrl"
        :src="tokenImageUrl"
        :alt="tokenName"
        class="token-image"
      />
      <div v-else class="token-placeholder" :style="{ backgroundColor: borderColor }">
        <v-icon :icon="tokenIcon" size="32" />
      </div>
      <div v-if="showBorder" class="token-border" :style="{ borderColor: borderColor }" />
    </div>
    <div class="token-info">
      <div class="token-name">{{ tokenName }}</div>
      <div v-if="combatantInfo" class="token-combatant-info">
        <v-chip size="x-small" variant="tonal">
          {{ combatantInfo }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'
import { useFilesStore } from '@/stores/files'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { useItemsStore } from '@/stores/items'

interface Props {
  item: DmScreenItem
  libraryId: number
}

const emit = defineEmits<{
  update: [item: DmScreenItem]
}>()

const props = defineProps<Props>()

const filesStore = useFilesStore()
const combatEncountersStore = useCombatEncountersStore()
const itemsStore = useItemsStore()

const tokenImageUrl = ref<string | null>(null)

const tokenName = computed(() => {
  return props.item.data.combatantName || props.item.data.name || 'Token'
})

const tokenIcon = computed(() => {
  return props.item.data.icon || 'mdi-sword-cross'
})

const borderColor = computed(() => {
  return props.item.data.borderColor || '#6366f1'
})

const showBorder = computed(() => {
  return props.item.data.showBorder !== false // Default to true
})

const borderWidth = computed(() => {
  return props.item.data.borderWidth || 3
})

const tokenSize = computed(() => {
  return props.item.data.size || 100
})

const tokenStyle = computed(() => {
  return {
    width: `${tokenSize.value}px`,
    height: `${tokenSize.value}px`,
  }
})

const combatantInfo = computed(() => {
  const encounterId = props.item.data.encounterId
  const combatantId = props.item.data.combatantId
  
  if (!encounterId || !combatantId) return null
  
  const encounter = combatEncountersStore.encounters.find(e => e.id === encounterId)
  if (!encounter) return null
  
  const combatant = encounter.combatants.find(c => c.id === combatantId)
  if (!combatant) return null
  
  return `${combatant.hp}/${combatant.maxHp} HP`
})

// Load token image
const loadTokenImage = async () => {
  // Priority: 1. UserFile ID, 2. Combatant featured image, 3. Library item featured image
  const userFileId = props.item.data.userFileId
  const encounterId = props.item.data.encounterId
  const combatantId = props.item.data.combatantId
  const libraryItemId = props.item.data.libraryItemId
  
  try {
    // Try UserFile first
    if (userFileId) {
      tokenImageUrl.value = await filesStore.getDownloadUrl(userFileId)
      return
    }
    
    // Try combatant featured image
    if (encounterId && combatantId) {
      const encounter = combatEncountersStore.encounters.find(e => e.id === encounterId)
      if (encounter) {
        const combatant = encounter.combatants.find(c => c.id === combatantId)
        if (combatant?.featuredImageId) {
          tokenImageUrl.value = await filesStore.getDownloadUrl(combatant.featuredImageId)
          return
        }
      }
    }
    
    // Try library item featured image
    if (libraryItemId) {
      const item = itemsStore.getItemById(libraryItemId)
      if (item?.featuredImage) {
        tokenImageUrl.value = await filesStore.getDownloadUrl(item.featuredImage.id)
        return
      }
    }
  } catch (error) {
    console.error('[TokenComponent] Failed to load token image:', error)
  }
}

onMounted(() => {
  loadTokenImage()
})

watch(() => [props.item.data.userFileId, props.item.data.encounterId, props.item.data.combatantId], () => {
  loadTokenImage()
})
</script>

<style scoped>
.token-component {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.token-image-container {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.token-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.token-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.token-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 3px solid;
  border-radius: 50%;
  pointer-events: none;
}

.token-info {
  text-align: center;
}

.token-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.token-combatant-info {
  display: flex;
  justify-content: center;
}
</style>

