<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon :icon="icon" :color="iconColor" class="mr-2" />
        {{ title }}
      </v-card-title>
      
      <v-card-text>
        <!-- Current Amount Display -->
        <div class="text-center mb-4">
          <div class="text-caption text-grey">Current {{ label }}</div>
          <div class="text-h3 font-weight-bold">{{ currentAmount }}</div>
          <div v-if="showMax" class="text-caption text-grey">/ {{ maxAmount }}</div>
        </div>

        <!-- Quick Actions -->
        <div class="d-flex flex-wrap gap-2 mb-4 justify-center">
          <v-btn
            v-for="preset in presets"
            :key="preset"
            size="small"
            :color="preset > 0 ? 'success' : 'error'"
            variant="tonal"
            @click="adjustAmount(preset)"
          >
            {{ preset > 0 ? '+' : '' }}{{ preset }}
          </v-btn>
        </div>

        <v-divider class="my-4" />

        <!-- Manual Input -->
        <v-text-field
          v-model.number="manualAmount"
          :label="`${operationType === 'set' ? 'Set to' : operationType === 'add' ? 'Add' : 'Subtract'}`"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-3"
        />

        <!-- Operation Type -->
        <v-btn-toggle
          v-model="operationType"
          mandatory
          color="primary"
          variant="outlined"
          divided
          class="d-flex mb-3"
        >
          <v-btn value="add" size="small">
            <v-icon icon="mdi-plus" size="small" class="mr-1" />
            Add
          </v-btn>
          <v-btn value="subtract" size="small">
            <v-icon icon="mdi-minus" size="small" class="mr-1" />
            Subtract
          </v-btn>
          <v-btn value="set" size="small">
            <v-icon icon="mdi-equal" size="small" class="mr-1" />
            Set
          </v-btn>
        </v-btn-toggle>

        <!-- Preview -->
        <v-alert
          v-if="manualAmount"
          type="info"
          variant="tonal"
          density="compact"
        >
          <div class="text-caption">
            Preview: {{ currentAmount }} 
            {{ operationType === 'add' ? '+' : operationType === 'subtract' ? '-' : '=' }}
            {{ manualAmount }} 
            = <strong>{{ previewAmount }}</strong>
            <span v-if="showMax && previewAmount > maxAmount" class="text-error ml-2">
              (Exceeds max!)
            </span>
          </div>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">
          Cancel
        </v-btn>
        <v-btn
          v-if="manualAmount"
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
  label?: string
  title?: string
  icon?: string
  iconColor?: string
  presets?: number[]
  showMax?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Amount',
  title: 'Edit Amount',
  icon: 'mdi-pencil',
  iconColor: 'primary',
  presets: () => [10, 5, 1, -1, -5, -10],
  showMax: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:amount': [amount: number]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const operationType = ref<'add' | 'subtract' | 'set'>('add')
const manualAmount = ref<number | null>(null)

const previewAmount = computed(() => {
  if (!manualAmount.value) return props.currentAmount
  
  switch (operationType.value) {
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
  const newAmount = Math.max(0, props.currentAmount + amount)
  if (props.showMax && props.maxAmount) {
    emit('update:amount', Math.min(newAmount, props.maxAmount))
  } else {
    emit('update:amount', newAmount)
  }
}

function applyManual() {
  if (manualAmount.value === null) return
  
  const newAmount = Math.max(0, previewAmount.value)
  if (props.showMax && props.maxAmount) {
    emit('update:amount', Math.min(newAmount, props.maxAmount))
  } else {
    emit('update:amount', newAmount)
  }
  
  manualAmount.value = null
  close()
}

function close() {
  isOpen.value = false
  manualAmount.value = null
  operationType.value = 'add'
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>


