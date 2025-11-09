<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <p class="text-caption text-grey-lighten-1">
        Add racial traits, class features, or special abilities.
      </p>
      <v-btn
        prepend-icon="mdi-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="addTrait"
      >
        Add Trait
      </v-btn>
    </div>

    <!-- Empty State -->
    <v-alert
      v-if="traits.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      No traits added yet. Click "Add Trait" to create one.
    </v-alert>

    <!-- Traits List -->
    <v-expansion-panels variant="accordion" multiple>
      <v-expansion-panel
        v-for="(trait, index) in traits"
        :key="index"
        class="trait-item mb-2"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between" style="width: 100%;">
            <span class="font-weight-medium">
              {{ trait.name || `Trait ${index + 1}` }}
            </span>
            <v-btn
              icon="mdi-delete"
              color="error"
              variant="text"
              size="small"
              @click.stop="removeTrait(index)"
            />
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-text-field
            v-model="trait.name"
            label="Trait Name"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-textarea
            v-model="trait.description"
            label="Description"
            variant="outlined"
            rows="4"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import type { Trait } from '@/types/item.types'

const traits = defineModel<Trait[]>({ default: () => [] })

function addTrait() {
  traits.value.push({
    name: '',
    description: '',
  })
}

function removeTrait(index: number) {
  traits.value.splice(index, 1)
}
</script>

<style scoped>
.trait-item {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

