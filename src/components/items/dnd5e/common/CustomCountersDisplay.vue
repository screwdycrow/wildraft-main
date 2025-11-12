<template>
  <v-card
    v-if="displayCounters.length > 0"
    class="glass-card mb-4 custom-counters-wrapper"
    elevation="0"
  >
    <v-card-text>
      <v-btn
        v-if="editable"
        icon
        size="small"
        color="purple"
        variant="tonal"
        class="settings-cog"
        @click="openManager"
      >
        <v-icon icon="mdi-cog" />
      </v-btn>
      <v-row class="custom-counter-grid" dense>
        <v-col
          v-for="counter in displayCounters"
          :key="counter.id || counter.name"
          cols="6"
          md="4"
          lg="3"
        >
          <div
            class="counter-card"
            :class="{ clickable: editable }"
            @click="editable && openValueEditor(counter)"
          >
            <div class="counter-header">
              <span class="text-caption text-grey">{{ counter.name }}</span>
            </div>
            <div class="counter-bottom">
              <div class="counter-value text-h6 font-weight-bold">
                {{ counter.value }}
                <span v-if="counter.max !== undefined" class="text-caption text-grey">
                  / {{ counter.max }}
                </span>
              </div>
              <v-progress-linear
                v-if="counter.max !== undefined"
                :model-value="getProgress(counter)"
                :color="counter.color || 'purple'"
                height="4"
                rounded
                class="counter-progress"
              />
            </div>
            <div class="text-caption text-grey mt-1" v-if="counter.description">
              {{ counter.description }}
            </div>
            <v-icon
              v-if="editable"
              icon="mdi-pencil"
              size="x-small"
              class="edit-hint"
            />
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <!-- Value Editor -->
  <amount-editor
    v-model="showValueEditor"
    :current-amount="editingCounter?.value ?? 0"
    :max-amount="editingCounter?.max"
    :min-amount="editingCounter?.min ?? Number.MIN_SAFE_INTEGER"
    :label="editingCounter?.name || 'Counter'"
    :title="`Edit ${editingCounter?.name || 'Counter'}`"
    icon="mdi-counter"
    icon-color="purple"
    :presets="[5, 1, -1, -5]"
    :show-max="editingCounter?.max !== undefined"
    @update:amount="applyCounterValue"
  />

  <!-- Manager Dialog -->
  <v-dialog v-model="showManager" max-width="720">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-cog" color="purple" class="mr-2" />
        Manage Custom Counters
      </v-card-title>
      <v-card-text>
        <div class="text-caption text-grey mb-4">
          Define counters that track custom resources such as hit dice, charges, or class features.
        </div>
        <v-alert
          v-if="managerCounters.length === 0"
          color="primary"
          variant="tonal"
          icon="mdi-information"
          class="mb-4"
        >
          No counters defined yet. Use the button below to add your first counter.
        </v-alert>

        <v-row dense>
          <v-col
            v-for="(counter, index) in managerCounters"
            :key="counter.id"
            cols="12"
          >
            <v-card class="mb-3" variant="outlined">
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-3">
                  <div class="text-subtitle-2">Counter {{ index + 1 }}</div>
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    color="error"
                    variant="text"
                    @click="removeCounter(counter.id)"
                  />
                </div>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="counter.name"
                      label="Name"
                      variant="outlined"
                      density="compact"
                      :rules="[requiredRule]"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.number="counter.value"
                      label="Current"
                      type="number"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.number="counter.min"
                      label="Min"
                      type="number"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.number="counter.max"
                      label="Max"
                      type="number"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model="counter.icon"
                      label="Icon (mdi-*)"
                      variant="outlined"
                      density="compact"
                      placeholder="mdi-sword"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="counter.color"
                      label="Color"
                      variant="outlined"
                      density="compact"
                      placeholder="#8E44AD or 'purple'"
                    />
                  </v-col>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="counter.description"
                      label="Description"
                      variant="outlined"
                      density="compact"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <div class="d-flex justify-center">
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            @click="addCounter"
          >
            Add Counter
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeManager">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="saveManager" :disabled="!canSaveManager">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CustomCounter } from '@/types/item.types'
import AmountEditor from '@/components/common/AmountEditor.vue'

interface Props {
  counters?: CustomCounter[]
  title?: string
  icon?: string
  iconColor?: string
  editable?: boolean
  hideTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  counters: () => [],
  title: 'Custom Counters',
  icon: 'mdi-counter',
  iconColor: 'purple',
  editable: true,
  hideTitle: false,
})

const emit = defineEmits<{
  'update:counters': [counters: CustomCounter[]]
}>()

const displayCounters = ref<CustomCounter[]>([])
const showValueEditor = ref(false)
const showManager = ref(false)
const editingCounter = ref<CustomCounter | null>(null)
const managerCounters = ref<CustomCounter[]>([])

const requiredRule = (v: string) => (!!v && v.trim() !== '') || 'Required'

watch(
  () => props.counters,
  (counters) => {
    displayCounters.value = normalizeCounters(counters || [])
  },
  { immediate: true, deep: true }
)

const canSaveManager = computed(() => managerCounters.value.every(counter => counter.name?.trim()))

function normalizeCounters(counters: CustomCounter[]): CustomCounter[] {
  return counters.map(counter => ({
    id: counter.id || generateId(),
    name: counter.name,
    value: isFiniteNumber(counter.value) ? Number(counter.value) : 0,
    min: isFiniteNumber(counter.min) ? Number(counter.min) : undefined,
    max: isFiniteNumber(counter.max) ? Number(counter.max) : undefined,
    icon: counter.icon,
    color: counter.color,
    description: counter.description,
  }))
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `counter-${Math.random().toString(36).slice(2, 10)}`
}

function getProgress(counter: CustomCounter): number {
  if (counter.max === undefined || counter.max === null) return 100
  const min = counter.min ?? 0
  const range = counter.max - min
  if (range <= 0) return 100
  const progress = ((counter.value - min) / range) * 100
  return Math.min(100, Math.max(0, progress))
}

function openValueEditor(counter: CustomCounter) {
  editingCounter.value = { ...counter }
  showValueEditor.value = true
}

function applyCounterValue(newValue: number) {
  if (!editingCounter.value) return
  const counters = displayCounters.value.map(counter => {
    if ((counter.id && counter.id === editingCounter.value?.id) || counter.name === editingCounter.value?.name) {
      const min = counter.min ?? Number.MIN_SAFE_INTEGER
      const max = counter.max ?? Number.MAX_SAFE_INTEGER
      const clamped = Math.min(max, Math.max(min, newValue))
      return { ...counter, value: clamped }
    }
    return counter
  })
  emitUpdate(counters)
  showValueEditor.value = false
}

function openManager() {
  managerCounters.value = deepClone(displayCounters.value)
  showManager.value = true
}

function openManagerForCreate() {
  openManager()
  if (managerCounters.value.length === 0) {
    managerCounters.value.push(createDefaultCounter())
  }
}

function addCounter() {
  managerCounters.value.push(createDefaultCounter())
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function createDefaultCounter(): CustomCounter {
  return {
    id: generateId(),
    name: 'New Counter',
    value: 0,
    min: 0,
    max: undefined,
    icon: 'mdi-counter',
    color: 'purple',
  }
}

function removeCounter(id?: string) {
  managerCounters.value = managerCounters.value.filter(counter => counter.id !== id)
}

function closeManager() {
  showManager.value = false
}

function saveManager() {
  const sanitized = managerCounters.value.map(counter => {
    const min = toNumberOrUndefined(counter.min)
    const max = toNumberOrUndefined(counter.max)
    let adjustedValue = toNumberOrUndefined(counter.value) ?? 0
    const lowerBound = min ?? Number.NEGATIVE_INFINITY
    const upperBound = max ?? Number.POSITIVE_INFINITY
    if (adjustedValue < lowerBound) {
      adjustedValue = lowerBound
    }
    if (adjustedValue > upperBound) {
      adjustedValue = upperBound
    }
    return {
      ...counter,
      min,
      max,
      value: adjustedValue,
      id: counter.id || generateId(),
    }
  })
  emitUpdate(sanitized)
  showManager.value = false
}

function emitUpdate(counters: CustomCounter[]) {
  displayCounters.value = normalizeCounters(counters)
  emit('update:counters', displayCounters.value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === '' || value === undefined) return undefined
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : undefined
}
</script>

<style scoped>
.custom-counter-grid {
  margin-top: 4px;
}

.custom-counter-grid .v-col {
  display: flex;
}

.custom-counter-grid .v-col > * {
  width: 100%;
}

.counter-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  transition: background 0.2s, transform 0.2s;
  min-height: 110px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.counter-card.clickable {
  cursor: pointer;
}

.counter-card.clickable:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
}

.counter-header {
  min-height: 20px;
}

.counter-bottom {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.counter-value {
  margin: 0;
}

.counter-progress {
  margin: 0;
}

.edit-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.counter-card:hover .edit-hint {
  opacity: 0.6;
}

.gap-2 {
  gap: 8px;
}

.custom-counters-wrapper {
  position: relative;
}

.custom-counters-wrapper .settings-cog {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.custom-counters-wrapper:hover .settings-cog {
  opacity: 1;
}
</style>

