<template>
  <v-dialog v-model="isOpen" max-width="500">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon :icon="icon" :color="iconColor" size="24" class="mr-2" />
        <span class="text-h6">{{ label }}</span>
      </v-card-title>
      
      <v-card-text class="pa-4">
        <!-- Progress Bar Section -->
        <div class="progress-section mb-4">
          <div v-if="showMax && maxAmount" class="progress-bar-container">
            <div 
              class="progress-bar-fill" 
              :style="{ width: progressPercentage + '%' }"
            />
          </div>
          
          <!-- Controls on the right -->
          <div class="controls-container">
            <v-btn
              icon
              size="small"
              color="error"
              variant="flat"
              class="control-btn"
              @click="adjustAmount(-1)"
            >
              <v-icon icon="mdi-minus" size="small" />
            </v-btn>
            
            <div class="value-display">
              {{ currentAmount }}{{ showMax && maxAmount ? `/${maxAmount}` : '' }}
            </div>
            
            <v-btn
              icon
              size="small"
              color="success"
              variant="flat"
              class="control-btn"
              @click="adjustAmount(1)"
            >
              <v-icon icon="mdi-plus" size="small" />
            </v-btn>
          </div>
        </div>

        <!-- Quick Presets -->
        <div v-if="presets && presets.length > 0" class="presets-section mb-4">
          <div class="text-caption text-grey mb-2">Quick Adjust</div>
          <div class="d-flex flex-wrap gap-2">
            <v-btn
              v-for="preset in presets"
              :key="preset"
              size="x-small"
              :color="preset > 0 ? 'success' : 'error'"
              variant="tonal"
              @click="adjustAmount(preset)"
            >
              {{ preset > 0 ? '+' : '' }}{{ preset }}
            </v-btn>
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- Manual Input -->
        <div class="manual-input-section">
          <div class="text-caption text-grey mb-2">Manual Input</div>
          <v-text-field
            v-model="manualAmountString"
            :label="`Enter value (use + to add, - to subtract, or number to set). Supports calculations: +5 +3 or -10 -10 -10`"
            type="text"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-2"
            @input="parseManualInput"
          />
          
          <div v-if="detectedOperation" class="text-caption mb-2">
            <v-icon 
              :icon="detectedOperation === 'add' ? 'mdi-plus' : detectedOperation === 'subtract' ? 'mdi-minus' : 'mdi-equal'" 
              size="x-small"
              class="mr-1"
            />
            Operation: <strong>{{ detectedOperation === 'add' ? 'Add' : detectedOperation === 'subtract' ? 'Subtract' : 'Set' }}</strong>
          </div>

          <!-- Preview -->
          <v-alert
            v-if="manualAmount !== null && manualAmount !== 0"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
          >
            <div class="text-caption">
              <div v-if="manualAmountString.trim().split(/\s+/).filter(t => t.trim() && !isNaN(parseFloat(t))).length > 1" class="mb-1">
                Calculation: {{ calculationBreakdown }} = {{ calculatedSum }}
              </div>
              Preview: {{ currentAmount }} 
              {{ detectedOperation === 'add' ? '+' : detectedOperation === 'subtract' ? '-' : '=' }}
              {{ manualAmount }} 
              = <strong>{{ previewAmount }}</strong>
              <span v-if="showMax && maxAmount && previewAmount > maxAmount" class="text-error ml-2">
                (Exceeds max!)
              </span>
              <span v-if="previewAmount < minAmountComputed" class="text-error ml-2">
                (Below min!)
              </span>
            </div>
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="close">
          Cancel
        </v-btn>
        <v-btn
          v-if="manualAmount !== null && manualAmount !== 0"
          color="primary"
          variant="flat"
          @click="applyManual"
        >
          Apply
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue: boolean
  currentAmount: number
  maxAmount?: number
  minAmount?: number
  label?: string
  title?: string
  icon?: string
  iconColor?: string
  presets?: number[]
  showMax?: boolean
  autoCloseOnAdjust?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Amount',
  title: 'Edit Amount',
  icon: 'mdi-pencil',
  iconColor: 'primary',
  presets: () => [10, 5, 1, -1, -5, -10],
  showMax: false,
  minAmount: 0,
  autoCloseOnAdjust: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:amount': [amount: number]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const manualAmountString = ref<string>('')
const manualAmount = ref<number | null>(null)
const minAmountComputed = computed(() => props.minAmount ?? 0)

// Progress bar percentage
const progressPercentage = computed(() => {
  if (!props.showMax || !props.maxAmount || props.maxAmount === 0) return 0
  return Math.min(100, Math.max(0, (props.currentAmount / props.maxAmount) * 100))
})

// Detect operation from input string
const detectedOperation = computed<'add' | 'subtract' | 'set' | null>(() => {
  if (manualAmount.value === null) return null
  
  const str = manualAmountString.value.trim()
  if (!str) return null
  
  // Check first token for sign
  const firstToken = str.split(/\s+/)[0]
  if (firstToken.startsWith('+')) return 'add'
  if (firstToken.startsWith('-')) return 'subtract'
  return 'set'
})

// Parse manual input string with calculation support
function parseManualInput() {
  const str = manualAmountString.value.trim()
  
  if (!str) {
    manualAmount.value = null
    return
  }
  
  // Split by spaces and parse each number
  const tokens = str.split(/\s+/).filter(t => t.trim())
  let sum = 0
  let hasValidNumber = false
  
  for (const token of tokens) {
    const num = parseFloat(token)
    if (!isNaN(num)) {
      sum += num
      hasValidNumber = true
    }
  }
  
  if (!hasValidNumber) {
    manualAmount.value = null
    return
  }
  
  // Store the absolute value, operation is determined by first token's sign
  manualAmount.value = Math.abs(sum)
}

// Get calculation breakdown for display
const calculationBreakdown = computed(() => {
  if (!manualAmountString.value.trim()) return ''
  
  const tokens = manualAmountString.value.trim().split(/\s+/).filter(t => t.trim())
  const numbers = tokens
    .map(t => parseFloat(t))
    .filter(n => !isNaN(n))
  
  if (numbers.length === 0) return ''
  if (numbers.length === 1) return numbers[0].toString()
  
  // Show calculation with proper signs
  return numbers.map(n => n >= 0 ? `+${n}` : n.toString()).join(' ')
})

// Get the actual calculated sum (with sign)
const calculatedSum = computed(() => {
  if (!manualAmountString.value.trim()) return 0
  
  const tokens = manualAmountString.value.trim().split(/\s+/).filter(t => t.trim())
  const numbers = tokens
    .map(t => parseFloat(t))
    .filter(n => !isNaN(n))
  
  return numbers.reduce((sum, n) => sum + n, 0)
})

const previewAmount = computed(() => {
  if (manualAmount.value === null) return props.currentAmount
  
  switch (detectedOperation.value) {
    case 'add':
      return props.currentAmount + manualAmount.value
    case 'subtract':
      return props.currentAmount - manualAmount.value
    case 'set':
      return manualAmount.value
    default:
      return props.currentAmount
  }
})

function adjustAmount(amount: number) {
  const minAmount = minAmountComputed.value
  let newAmount = Math.max(minAmount, props.currentAmount + amount)
  if (props.showMax && typeof props.maxAmount === 'number') {
    newAmount = Math.min(newAmount, props.maxAmount)
  }
  emit('update:amount', newAmount)
  
  // Auto-close if enabled
  if (props.autoCloseOnAdjust) {
    close()
  }
}

function applyManual() {
  if (manualAmount.value === null) return
  
  const minAmount = minAmountComputed.value
  let newAmount = Math.max(minAmount, previewAmount.value)
  if (props.showMax && typeof props.maxAmount === 'number') {
    newAmount = Math.min(newAmount, props.maxAmount)
  }
  emit('update:amount', newAmount)
  
  manualAmountString.value = ''
  manualAmount.value = null
  close()
}

function close() {
  isOpen.value = false
  manualAmountString.value = ''
  manualAmount.value = null
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-bar-container {
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-primary-lighten-1)));
  border-radius: 12px;
  transition: width 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.controls-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.control-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
}

.value-display {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  min-width: 60px;
  text-align: center;
  white-space: nowrap;
}

.presets-section {
  padding: 8px 0;
}

.manual-input-section {
  padding: 8px 0;
}
</style>


