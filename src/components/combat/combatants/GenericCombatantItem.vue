<template>
  <generic-combatant-layout :combatant="combatant" />
</template>

<script setup lang="ts">
import type { Combatant } from '@/types/combat.types'
import GenericCombatantLayout from './GenericCombatantLayout.vue'

interface Props {
  combatant: Combatant
}

defineProps<Props>()
</script>

