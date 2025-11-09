<template>
  <div>
    <v-expansion-panels v-model="panel" variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <div class="d-flex gap-4 align-center">
            <span class="font-weight-bold">Combat Stats</span>
            <v-chip size="small" color="error" variant="flat">
              <v-icon icon="mdi-heart" size="small" class="mr-1" />
              {{ stats.hp || 0 }} HP
            </v-chip>
            <v-chip size="small" color="primary" variant="flat">
              <v-icon icon="mdi-shield" size="small" class="mr-1" />
              {{ stats.ac || 10 }} AC
            </v-chip>
            <v-chip size="small" color="success" variant="flat">
              <v-icon icon="mdi-run-fast" size="small" class="mr-1" />
              {{ stats.speed || '30 ft' }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col v-if="includeMaxHp" cols="12" md="3">
              <v-text-field
                :model-value="stats.hp"
                @update:model-value="updateStat('hp', $event)"
                label="Current HP"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col v-if="includeMaxHp" cols="12" md="3">
              <v-text-field
                :model-value="stats.maxHp"
                @update:model-value="updateStat('maxHp', $event)"
                label="Max HP"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col v-if="!includeMaxHp" cols="12" md="4">
              <v-text-field
                :model-value="stats.hp"
                @update:model-value="updateStat('hp', $event)"
                label="Hit Points"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" :md="includeMaxHp ? 3 : 4">
              <v-text-field
                :model-value="stats.ac"
                @update:model-value="updateStat('ac', $event)"
                label="Armor Class"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" :md="includeMaxHp ? 3 : 4">
              <v-text-field
                :model-value="stats.speed"
                @update:model-value="updateStat('speed', $event)"
                label="Speed"
                variant="outlined"
                density="compact"
                placeholder="30 ft"
              />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface CombatStats {
  hp?: number
  maxHp?: number
  ac?: number
  speed?: string
}

interface Props {
  stats: CombatStats
  includeMaxHp?: boolean
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  includeMaxHp: false,
  defaultExpanded: false,
})

const emit = defineEmits<{
  'update:stats': [stats: CombatStats]
}>()

const panel = ref(props.defaultExpanded ? 0 : undefined)

function updateStat(key: keyof CombatStats, value: any) {
  emit('update:stats', { ...props.stats, [key]: value })
}
</script>

