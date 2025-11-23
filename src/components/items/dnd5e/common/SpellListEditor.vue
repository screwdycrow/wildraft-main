<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <p class="text-caption text-grey-lighten-1">
        Add spells this character or creature can cast.
      </p>
      <v-btn
        prepend-icon="mdi-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="addSpell"
      >
        Add Spell
      </v-btn>
    </div>

    <!-- Empty State -->
    <v-alert
      v-if="spells.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      No spells added yet. Click "Add Spell" to create one.
    </v-alert>

    <!-- Spells List -->
    <v-expansion-panels variant="accordion" multiple>
      <v-expansion-panel
        v-for="(spell, index) in spells"
        :key="index"
        class="spell-item mb-2"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between" style="width: 100%;">
            <div class="d-flex align-center gap-2">
              <span class="font-weight-medium">
                {{ spell.name || `Spell ${index + 1}` }}
              </span>
              <v-chip
                v-if="spell.level !== undefined"
                size="x-small"
                :color="getSpellLevelColor(spell.level)"
                variant="flat"
              >
                {{ getSpellLevelLabel(spell.level) }}
              </v-chip>
              <v-chip
                v-if="spell.concentration"
                size="x-small"
                color="warning"
                variant="outlined"
              >
                C
              </v-chip>
              <v-chip
                v-if="spell.ritual"
                size="x-small"
                color="purple"
                variant="outlined"
              >
                R
              </v-chip>
            </div>
            <div class="d-flex gap-1">
              <v-tooltip location="top">
                <template #activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    icon="mdi-plus-circle"
                    color="primary"
                    variant="text"
                    size="small"
                    @click.stop="convertSpellToAction(index)"
                  />
                </template>
                <span>Add to Actions</span>
              </v-tooltip>
              <v-btn
                icon="mdi-delete"
                color="error"
                variant="text"
                size="small"
                @click.stop="removeSpell(index)"
              />
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="spell.name"
                label="Spell Name"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model.number="spell.level"
                :items="spellLevels"
                label="Level"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-combobox
                v-model="spell.school"
                :items="spellSchools"
                label="School"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="spell.castingTime"
                label="Casting Time"
                variant="outlined"
                density="compact"
                placeholder="1 action"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="spell.range"
                label="Range"
                variant="outlined"
                density="compact"
                placeholder="60 ft"
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="spell.components"
                label="Components"
                variant="outlined"
                density="compact"
                placeholder="V, S, M"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="spell.toHit"
                label="To Hit / Bonus"
                variant="outlined"
                density="compact"
                placeholder="+7"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="spell.dc"
                label="Save DC"
                variant="outlined"
                density="compact"
                placeholder="16 (DEX)"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="spell.duration"
                label="Duration"
                variant="outlined"
                density="compact"
                placeholder="Instantaneous"
              />
            </v-col>
            <v-col cols="12" md="6">
              <div class="d-flex gap-3 align-center" style="height: 100%;">
                <v-checkbox
                  v-model="spell.concentration"
                  label="Concentration"
                  density="compact"
                  hide-details
                />
                <v-checkbox
                  v-model="spell.ritual"
                  label="Ritual"
                  density="compact"
                  hide-details
                />
              </div>
            </v-col>
          </v-row>

          <v-row v-if="includeRoll">
            <v-col cols="12">
              <v-text-field
                v-model="spell.roll"
                label="Attack/Damage Roll"
                variant="outlined"
                density="compact"
                placeholder="e.g., +5 to hit, 3d6 fire damage"
              />
            </v-col>
          </v-row>
          
          <v-textarea
            v-model="spell.description"
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
import type { Spell, Action } from '@/types/item.types'

interface Props {
  includeRoll?: boolean
}

interface Emits {
  (e: 'add-to-actions', action: Action): void
}

const props = withDefaults(defineProps<Props>(), {
  includeRoll: true,
})

const emit = defineEmits<Emits>()

const spells = defineModel<Spell[]>({ default: () => [] })

const spellLevels = [
  { title: 'Cantrip (0)', value: 0 },
  { title: '1st Level', value: 1 },
  { title: '2nd Level', value: 2 },
  { title: '3rd Level', value: 3 },
  { title: '4th Level', value: 4 },
  { title: '5th Level', value: 5 },
  { title: '6th Level', value: 6 },
  { title: '7th Level', value: 7 },
  { title: '8th Level', value: 8 },
  { title: '9th Level', value: 9 },
]

const spellSchools = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation',
]

function addSpell() {
  spells.value.push({
    name: '',
    level: 0,
    toHit: '',
    dc: '',
    description: '',
  })
}

function removeSpell(index: number) {
  spells.value.splice(index, 1)
}

function getSpellLevelColor(level: number): string {
  if (level === 0) return 'grey'
  if (level <= 3) return 'primary'
  if (level <= 6) return 'success'
  return 'purple'
}

function getSpellLevelLabel(level: number): string {
  if (level === 0) return 'Cantrip'
  if (level === 1) return '1st'
  if (level === 2) return '2nd'
  if (level === 3) return '3rd'
  return `${level}th`
}

function convertSpellToAction(index: number): void {
  const spell = spells.value[index]
  if (!spell) return

  // Determine action type based on casting time
  let actionType: 'action' | 'bonus' | 'reaction' | 'legendary' = 'action'
  if (spell.castingTime) {
    const castingTime = spell.castingTime.toLowerCase()
    if (castingTime.includes('bonus')) {
      actionType = 'bonus'
    } else if (castingTime.includes('reaction')) {
      actionType = 'reaction'
    }
  }

  // Build description with spell details
  let description = spell.description || ''
  
  // Add spell level and school info to description if not already present
  const levelLabel = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`
  const schoolInfo = spell.school ? `${levelLabel} ${spell.school}` : levelLabel
  
  // Prepend spell info if description doesn't already mention it
  if (!description.toLowerCase().includes(spell.name.toLowerCase())) {
    description = `${spell.name} (${schoolInfo})${description ? ': ' + description : ''}`
  }
  
  // Add casting time, range, components if available
  const details: string[] = []
  if (spell.castingTime) details.push(`Casting Time: ${spell.castingTime}`)
  if (spell.range) details.push(`Range: ${spell.range}`)
  if (spell.components) details.push(`Components: ${spell.components}`)
  if (spell.duration) details.push(`Duration: ${spell.duration}`)
  if (spell.concentration) details.push('(Concentration)')
  if (spell.ritual) details.push('(Ritual)')
  
  if (details.length > 0) {
    description += `\n\n${details.join(', ')}`
  }

  // Create action from spell
  const action: Action = {
    name: spell.name,
    actionType: actionType,
    description: description.trim(),
    toHit: spell.toHit || undefined,
    dc: spell.dc || undefined,
    roll: spell.roll || undefined,
    range: spell.range || undefined,
  }

  emit('add-to-actions', action)
}
</script>

<style scoped>
.spell-item {
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

