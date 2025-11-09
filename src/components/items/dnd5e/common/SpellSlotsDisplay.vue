<template>
  <v-card v-if="relevantSlots.length > 0" class="glass-card mb-4" elevation="0">
    <v-card-title class="d-flex align-center justify-space-between">
      <div>
        <v-icon icon="mdi-fire" class="mr-2" color="purple" />
        Spell Slots
      </div>
      <div class="d-flex gap-2">
        <v-btn
          icon
          color="success"
          variant="tonal"
          size="small"
          @click="longRest"
        >
          <v-icon icon="mdi-sleep" />
        </v-btn>
        <v-btn
          icon
          color="purple"
          variant="tonal"
          size="small"
          @click="showMaxEditor = true"
        >
          <v-icon icon="mdi-cog" />
        </v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col
          v-for="slot in relevantSlots"
          :key="slot.level"
          cols="6"
          sm="4"
        >
          <div class="spell-slot-card clickable" @click="openEditor(slot)">
            <div class="text-caption text-grey">Level {{ slot.level }}</div>
            <div class="text-h6 font-weight-bold">
              {{ slot.remaining }} / {{ slot.max }}
            </div>
            <v-progress-linear
              :model-value="(slot.remaining / slot.max) * 100"
              color="purple"
              height="4"
              rounded
              class="mt-2"
            />
            <v-icon icon="mdi-pencil" size="x-small" class="edit-hint" />
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <!-- Max Slots Configuration Dialog -->
  <v-dialog v-model="showMaxEditor" max-width="500">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-cog" color="purple" class="mr-2" />
        Configure Spell Slot Maximums
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="slot in relevantSlots"
            :key="slot.level"
            cols="6"
          >
            <v-text-field
              v-model.number="slot.max"
              :label="`Level ${slot.level} Max`"
              type="number"
              variant="outlined"
              density="compact"
              min="0"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showMaxEditor = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveMaxSlots">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Spell Slot Editor -->
  <amount-editor
    v-model="showEditor"
    :current-amount="editingSlot?.remaining || 0"
    :max-amount="editingSlot?.max || 0"
    :label="`Level ${editingSlot?.level} Slots`"
    :title="`Edit Level ${editingSlot?.level} Spell Slots`"
    icon="mdi-fire"
    icon-color="purple"
    :presets="[1, -1]"
    :show-max="true"
    @update:amount="updateSlot"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { SpellSlot, Spell } from '@/types/item.types'
import AmountEditor from '@/components/common/AmountEditor.vue'

interface Props {
  spellSlots?: SpellSlot[]
  spells?: Spell[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:slots': [slots: SpellSlot[]]
}>()

const showEditor = ref(false)
const showMaxEditor = ref(false)
const editingSlot = ref<SpellSlot | null>(null)

// Get the highest spell level from character's known spells
const highestSpellLevel = computed(() => {
  if (!props.spells || props.spells.length === 0) return 0
  
  let maxLevel = 0
  props.spells.forEach(spell => {
    if (spell.level > maxLevel) {
      maxLevel = spell.level
    }
  })
  
  return maxLevel
})

// Auto-generate spell slots from level 1 to highest known spell level
const relevantSlots = computed(() => {
  if (highestSpellLevel.value === 0) return []
  
  const slots: SpellSlot[] = []
  
  // Create slots for all levels from 1 to highest spell level
  for (let level = 1; level <= highestSpellLevel.value; level++) {
    // Check if slot already exists
    const existingSlot = props.spellSlots?.find(s => s.level === level)
    
    if (existingSlot) {
      slots.push(existingSlot)
    } else {
      // Auto-generate with default values based on character level
      // You can adjust these defaults based on your game rules
      const defaultMax = getDefaultSlotCount(level)
      slots.push({
        level,
        max: defaultMax,
        remaining: defaultMax,
      })
    }
  }
  
  return slots
})

// Default spell slot counts (you can customize this based on class/level)
function getDefaultSlotCount(spellLevel: number): number {
  // Simple defaults - adjust based on your needs
  const defaults: Record<number, number> = {
    1: 4,
    2: 3,
    3: 3,
    4: 3,
    5: 2,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
  }
  return defaults[spellLevel] || 1
}

// Auto-sync generated slots back to parent if they don't exist
watch(relevantSlots, (newSlots) => {
  if (newSlots.length > 0 && (!props.spellSlots || props.spellSlots.length === 0)) {
    emit('update:slots', newSlots)
  }
}, { immediate: true })

function openEditor(slot: SpellSlot) {
  editingSlot.value = { ...slot }
  showEditor.value = true
}

function updateSlot(newRemaining: number) {
  if (!editingSlot.value) return
  
  // Find and update the slot
  const updatedSlots = relevantSlots.value.map(slot => 
    slot.level === editingSlot.value!.level
      ? { ...slot, remaining: newRemaining }
      : slot
  )
  
  emit('update:slots', updatedSlots)
  showEditor.value = false
}

function saveMaxSlots() {
  emit('update:slots', relevantSlots.value)
  showMaxEditor.value = false
}

function longRest() {
  // Restore all spell slots to max
  const restedSlots = relevantSlots.value.map(slot => ({
    ...slot,
    remaining: slot.max,
  }))
  
  emit('update:slots', restedSlots)
}
</script>

<style scoped>
.spell-slot-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: background 0.2s;
  position: relative;
  cursor: pointer;
}

.spell-slot-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.clickable {
  cursor: pointer;
}

.edit-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.spell-slot-card:hover .edit-hint {
  opacity: 0.6;
}

.gap-2 {
  gap: 8px;
}
</style>

