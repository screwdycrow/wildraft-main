<template>
  <generic-combatant-layout
    :combatant="combatant"
    :subtitle="subtitle"
    :actions="actions"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Combatant } from '@/types/combat.types'
import GenericCombatantLayout from './GenericCombatantLayout.vue'

interface Props {
  combatant: Combatant
}

const props = defineProps<Props>()

const characterData = computed(() => props.combatant.libraryItem?.data || {})

const subtitle = computed(() => {
  const data = characterData.value as any
  const parts = []
  
  if (data.level) parts.push(`Level ${data.level}`)
  if (data.class) parts.push(data.class)
  if (data.race) parts.push(data.race)
  
  return parts.join(' • ')
})

const actions = computed(() => {
  const data = characterData.value as any
  return data.actions || []
})
</script>

