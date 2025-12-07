<template>
  <Teleport to="body">
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon :icon="isEdit ? 'mdi-pencil' : 'mdi-account-plus'" :color="isEdit ? 'primary' : 'purple'" class="mr-2" />
        {{ isEdit ? 'Edit Combatant' : 'Add Simple Combatant' }}
      </v-card-title>

      <v-divider />

      <!-- Tabs -->
      <v-tabs v-model="activeTab" class="px-4">
        <v-tab value="basic">
          <v-icon icon="mdi-account" start size="small" />
          Basic Info
        </v-tab>
        <v-tab value="actions">
          <v-icon icon="mdi-sword-cross" start size="small" />
          Actions
        </v-tab>
        <v-tab value="counters">
          <v-icon icon="mdi-counter" start size="small" />
          Counters
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="pa-4">
        <v-window v-model="activeTab">
          <!-- Basic Info Tab -->
          <v-window-item value="basic">
            <v-text-field
              v-model="formData.name"
              label="Name *"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              :rules="[v => !!v || 'Name is required']"
              autofocus
            />

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formData.initiative"
                  label="Initiative"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="formData.ac"
                  label="AC"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  min="1"
                />
              </v-col>
            </v-row>

            <v-row class="mt-0">
              <v-col cols="6">
                <v-card variant="outlined" class="pa-3 clickable" @click="showHpEditor = true">
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <div class="text-caption text-grey">Max HP</div>
                      <div class="text-h6 font-weight-bold">{{ formData.maxHp }}</div>
                    </div>
                    <v-icon icon="mdi-pencil" size="small" />
                  </div>
                </v-card>
              </v-col>
              <v-col cols="6">
                <v-card variant="outlined" class="pa-3 clickable" @click="showCurrentHpEditor = true">
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <div class="text-caption text-grey">Current HP</div>
                      <div class="text-h6 font-weight-bold">{{ formData.hp }}</div>
                    </div>
                    <v-icon icon="mdi-pencil" size="small" />
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <v-checkbox
              v-model="formData.isPlayer"
              label="Player Character"
              density="comfortable"
              hide-details
              class="mt-3"
            />

            <v-textarea
              v-model="formData.notes"
              label="Notes (Optional)"
              variant="outlined"
              density="comfortable"
              rows="3"
              class="mt-3"
            />
          </v-window-item>

          <!-- Actions Tab -->
          <v-window-item value="actions">
            <action-list-display v-model="formData.actions" editable />
          </v-window-item>

          <!-- Counters Tab -->
          <v-window-item value="counters">
            <custom-counters-display
              v-model:counters="formData.customCounters"
              :editable="true"
            />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save" :disabled="!formData.name.trim()">
          {{ isEdit ? 'Save' : 'Add' }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- HP Editor -->
    <amount-editor
      v-model="showHpEditor"
      :current-amount="formData.maxHp"
      label="Max HP"
      title="Edit Max HP"
      icon="mdi-heart"
      icon-color="error"
      :presets="[20, 10, 5, 1, -1, -5, -10, -20]"
      :min-amount="1"
      @update:amount="formData.maxHp = $event"
    />

    <!-- Current HP Editor -->
    <amount-editor
      v-model="showCurrentHpEditor"
      :current-amount="formData.hp"
      :max-amount="formData.maxHp"
      label="Current HP"
      title="Edit Current HP"
      icon="mdi-heart"
      icon-color="error"
      :presets="[20, 10, 5, 1, -1, -5, -10, -20]"
      :min-amount="0"
      :show-max="true"
      @update:amount="formData.hp = $event"
    />

    </v-dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, Teleport } from 'vue'
import type { Combatant } from '@/types/combat.types'
import AmountEditor from '@/components/common/AmountEditor.vue'
import ActionListDisplay from '@/components/items/dnd5e/common/ActionListDisplay.vue'
import CustomCountersDisplay from '@/components/items/dnd5e/common/CustomCountersDisplay.vue'

interface Props {
  modelValue: boolean
  combatant?: Combatant | null
}

const props = withDefaults(defineProps<Props>(), {
  combatant: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [combatant: Partial<Combatant>]
}>()

const isEdit = computed(() => !!props.combatant)
const activeTab = ref('basic')
const showHpEditor = ref(false)
const showCurrentHpEditor = ref(false)

// Form data
const formData = ref<Partial<Combatant>>({
  name: '',
  initiative: 0,
  hp: 10,
  maxHp: 10,
  ac: 10,
  isPlayer: false,
  actions: [],
  customCounters: [],
  conditions: [],
  notes: '',
})


// Initialize form when dialog opens or combatant changes
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    if (props.combatant) {
      // Edit mode - populate with existing data
      formData.value = {
        name: props.combatant.name,
        initiative: props.combatant.initiative,
        hp: props.combatant.hp,
        maxHp: props.combatant.maxHp,
        ac: props.combatant.ac,
        isPlayer: props.combatant.isPlayer || false,
        actions: [...(props.combatant.actions || [])],
        customCounters: [...(props.combatant.customCounters || [])],
        conditions: [...(props.combatant.conditions || [])],
        notes: props.combatant.notes || '',
      }
    } else {
      // Add mode - reset to defaults
      formData.value = {
        name: '',
        initiative: 0,
        hp: 10,
        maxHp: 10,
        ac: 10,
        isPlayer: false,
        actions: [],
        customCounters: [],
        conditions: [],
        notes: '',
      }
    }
    activeTab.value = 'basic'
  }
}, { immediate: true })


function close() {
  emit('update:modelValue', false)
}

function save() {
  if (!formData.value.name?.trim()) return

  emit('save', {
    ...formData.value,
    id: props.combatant?.id,
  })
  close()
}
</script>

<style scoped>
.clickable {
  cursor: pointer;
  transition: background 0.2s;
}

.clickable:hover {
  background: rgba(0, 0, 0, 0.05);
}

.d-inline-block {
  display: inline-block;
}
</style>

