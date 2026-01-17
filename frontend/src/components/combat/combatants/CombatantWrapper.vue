<template>
  <component 
    :is="combatantComponent" 
    :combatant="combatant"
    :show-health="showHealth"
    :show-ac="showAC"
    :show-actions="showActions"
    :portal-mode="portalMode"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Combatant } from '@/types/combat.types'
import { useItemComponents } from '@/composables/useItemComponents'
import GenericCombatantItem from './GenericCombatantItem.vue'

interface Props {
  combatant: Combatant
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

const { getCombatantComponent } = useItemComponents()

const combatantComponent = computed(() => {
  // If no library item, use generic
  if (!props.combatant.libraryItem) {
    return GenericCombatantItem
  }

  // Try to get type-specific component
  const itemType = props.combatant.libraryItem.type
  const component = getCombatantComponent(itemType)
  
  // If no specific component found, use generic
  return component || GenericCombatantItem
})
</script>

