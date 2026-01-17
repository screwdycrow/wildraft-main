<template>
  <div v-if="displayCounters.length > 0" class="counters-section">
    <div class="counters-header">
      <div class="section-header">
        <v-icon icon="mdi-counter" size="small" color="purple" />
        <span>Counters</span>
      </div>
      <v-btn
        v-if="editable"
        icon
        size="x-small"
        variant="text"
        color="purple"
        class="settings-btn"
        @click="openManager"
      >
        <v-icon icon="mdi-cog" size="small" />
      </v-btn>
    </div>
    
    <div class="counters-grid">
      <div
        v-for="counter in displayCounters"
        :key="counter.id || counter.name"
        class="counter-item"
        :class="{ clickable: editable }"
        @click="editable && openValueEditor(counter)"
      >
        <div class="counter-name">{{ counter.name }}</div>
        <div class="counter-value-row">
          <span class="counter-value">{{ counter.value }}</span>
          <span v-if="counter.max !== undefined" class="counter-max">/ {{ counter.max }}</span>
        </div>
        <v-progress-linear
          v-if="counter.max !== undefined"
          :model-value="getProgress(counter)"
          :color="counter.color || 'purple'"
          height="3"
          rounded
          class="counter-bar"
        />
      </div>
    </div>
  </div>

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
  <v-dialog v-model="showManager" max-width="500">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-cog" color="purple" class="mr-2" size="small" />
        Manage Counters
      </v-card-title>
      <v-card-text>
        <div class="manager-list">
          <div
            v-for="(counter, index) in managerCounters"
            :key="counter.id"
            class="manager-item"
          >
            <v-row dense align="center">
              <v-col cols="5">
                <v-text-field
                  v-model="counter.name"
                  label="Name"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="2">
                <v-text-field
                  v-model.number="counter.value"
                  label="Value"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="2">
                <v-text-field
                  v-model.number="counter.max"
                  label="Max"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="∞"
                />
              </v-col>
              <v-col cols="2">
                <v-text-field
                  v-model="counter.color"
                  label="Color"
                  variant="outlined"
                  density="compact"
                  hide-details
                  placeholder="purple"
                />
              </v-col>
              <v-col cols="1" class="text-center">
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  color="error"
                  variant="text"
                  @click="removeCounter(counter.id)"
                />
              </v-col>
            </v-row>
          </div>
        </div>
        
        <v-btn
          color="purple"
          variant="tonal"
          size="small"
          prepend-icon="mdi-plus"
          class="mt-3"
          @click="addCounter"
        >
          Add Counter
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" size="small" @click="closeManager">Cancel</v-btn>
        <v-btn color="primary" variant="flat" size="small" @click="saveManager" :disabled="!canSaveManager">
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
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  counters: () => [],
  editable: true,
})

const emit = defineEmits<{
  'update:counters': [counters: CustomCounter[]]
}>()

const displayCounters = ref<CustomCounter[]>([])
const showValueEditor = ref(false)
const showManager = ref(false)
const editingCounter = ref<CustomCounter | null>(null)
const managerCounters = ref<CustomCounter[]>([])

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
    if (adjustedValue < lowerBound) adjustedValue = lowerBound
    if (adjustedValue > upperBound) adjustedValue = upperBound
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

defineExpose({
  openManagerForCreate,
  openManager,
})
</script>

<style scoped>
.counters-section {
  margin-bottom: 16px;
}

.counters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

.settings-btn {
  opacity: 0.5;
  transition: opacity 0.15s;
}

.settings-btn:hover {
  opacity: 1;
}

.counters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.counter-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  transition: background 0.15s ease, transform 0.15s ease;
}

.counter-item.clickable {
  cursor: pointer;
}

.counter-item.clickable:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
}

.counter-name {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.6;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.counter-value-row {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.counter-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.counter-max {
  font-size: 0.875rem;
  opacity: 0.5;
}

.counter-bar {
  margin-top: 8px;
}

.manager-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.manager-item {
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
}
</style>
