<template>
  <v-card v-if="traits && traits.length > 0" class="glass-card mb-4" elevation="0">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-star-circle" class="mr-2" color="warning" />
      Traits & Features
    </v-card-title>
    <v-card-text>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel v-for="(trait, index) in traits" :key="index">
          <v-expansion-panel-title>
            <strong>{{ trait.name }}</strong>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div v-html="trait.description || 'No description'" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Trait } from '@/types/item.types'

interface Props {
  traits?: Trait[]
}

defineProps<Props>()
</script>

<style scoped>
/* Inherit global styles */
</style>


