<template>
  <generic-combatant-layout
    :combatant="combatant"
    :subtitle="subtitle"
    :actions="actions"
    :show-health="showHealth"
    :show-ac="showAC"
    :show-actions="showActions"
    :portal-mode="portalMode"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Combatant } from '@/types/combat.types'
import GenericCombatantLayout from './GenericCombatantLayout.vue'

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

const statBlockData = computed(() => props.combatant.libraryItem?.data || {})

const subtitle = computed(() => {
  const data = statBlockData.value as any
  const parts = []
  
  if (data.size) parts.push(data.size)
  if (data.type) parts.push(data.type)
  if (data.cr) parts.push(`CR ${data.cr}`)
  
  return parts.join(' • ')
})

const actions = computed(() => {
  const data = statBlockData.value as any
  return data.actions || []
})
</script>

