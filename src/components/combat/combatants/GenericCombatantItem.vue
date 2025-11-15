<template>
  <generic-combatant-layout 
    :combatant="combatant"
    :show-health="showHealth"
    :show-ac="showAC"
    :show-actions="showActions"
    :portal-mode="portalMode"
  />
</template>

<script setup lang="ts">
import type { Combatant } from '@/types/combat.types'
import GenericCombatantLayout from './GenericCombatantLayout.vue'

interface Props {
  combatant: Combatant
  showHealth?: boolean
  showAC?: boolean
  showActions?: boolean
  portalMode?: boolean
}

withDefaults(defineProps<Props>(), {
  showHealth: true,
  showAC: true,
  showActions: true,
  portalMode: false,
})
</script>

