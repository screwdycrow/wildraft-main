<template>
  <div v-if="inline" class="dice-roller-inline h-100">
    <DiceRollerContent hide-header inline />
  </div>
  <v-menu
    v-else
    v-model="showMenu"
    :close-on-content-click="false"
    location="bottom"
    max-width="450"
    offset="8"
  >
    <template #activator="{ props }">
      <v-btn
        icon
        v-bind="props"
        class="dice-roller-btn"
        size="default"
      >
        <v-icon icon="mdi-dice-multiple" size="24" />
        <v-tooltip activator="parent" location="bottom">
          Dice Roller
        </v-tooltip>
      </v-btn>
    </template>
    <DiceRollerContent />
  </v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DiceRollerContent from './DiceRollerContent.vue'

defineProps<{
  inline?: boolean
}>()

const showMenu = ref(false)
</script>

<style scoped>
.dice-roller-btn {
  background: rgba(var(--v-theme-primary), 0.2) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(var(--v-theme-primary), 0.3) !important;
  transition: all 0.3s ease;
}
.dice-roller-btn:hover {
  background: rgba(var(--v-theme-primary), 0.3) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.4);
}
</style>
