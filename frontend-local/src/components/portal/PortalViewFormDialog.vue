<template>
  <v-dialog v-model="dialogModel" max-width="800" persistent scrollable>
    <v-card class="glass-dialog" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
        <v-icon :icon="isEditMode ? 'mdi-view-dashboard-edit' : 'mdi-view-dashboard-plus'" color="primary" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Portal View' : 'Create New Portal View' }}
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="formData.name"
            label="Portal View Name"
            prepend-inner-icon="mdi-view-dashboard-variant"
            :rules="nameRules"
            variant="outlined"
            class="mb-4"
            placeholder="e.g., Player View - Main Battle"
            autofocus
          />

          <v-divider class="my-4" />

          <div class="mb-4">
            <label class="text-body-1 font-weight-medium mb-3 d-block">Display Options</label>
            <div class="d-flex flex-column gap-2">
              <v-checkbox
                v-model="formData.showEncounter"
                label="Show Encounter Information"
                hide-details
                density="compact"
              />
              <v-checkbox
                v-model="formData.showHealth"
                label="Show Health Information"
                hide-details
                density="compact"
              />
              <v-checkbox
                v-model="formData.showAC"
                label="Show Armor Class (AC)"
                hide-details
                density="compact"
              />
              <v-checkbox
                v-model="formData.showActions"
                label="Show Actions"
                hide-details
                density="compact"
              />
              <v-checkbox
                v-model="formData.autoResetImageState"
                label="Auto Reset Image State"
                hide-details
                density="compact"
              />
            </div>
          </div>

          <v-divider class="my-4" />

          <v-select
            v-model="formData.combatEncounterId"
            :items="combatEncounters"
            item-title="name"
            item-value="id"
            label="Combat Encounter (optional)"
            prepend-inner-icon="mdi-sword-cross"
            variant="outlined"
            clearable
            class="mb-4"
            hint="Link this portal view to a combat encounter"
            persistent-hint
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon icon="mdi-sword-cross" size="small" class="mr-2" />
                </template>
                <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                <v-list-item-subtitle>Round {{ item.raw.round || 0 }}</v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>

          <v-text-field
            v-model.number="formData.currentItem"
            label="Current Item Index (optional)"
            prepend-inner-icon="mdi-numeric"
            type="number"
            variant="outlined"
            class="mb-4"
            hint="Index of the currently displayed item"
            persistent-hint
            :min="0"
          />

          <!-- Items array will be managed in a separate component/view -->
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            Items can be added and managed after creating the portal view.
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleCancel"
          :disabled="isLoading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="handleSubmit"
          :loading="isLoading"
          :disabled="!isFormValid"
        >
          <v-icon icon="mdi-check" class="mr-2" />
          {{ isEditMode ? 'Save Changes' : 'Create Portal View' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { LibraryPortalView } from '@/types/portal.types'
import { useCombatEncountersStore } from '@/stores/combatEncounters'

const props = defineProps<{
  modelValue: boolean
  portalView?: LibraryPortalView | null
  libraryId: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [
    data: {
      name: string
      showEncounter?: boolean
      showHealth?: boolean
      showAC?: boolean
      showActions?: boolean
      autoResetImageState?: boolean
      combatEncounterId?: number | null
      currentItem?: number | null
      items?: any[]
    },
    callback?: (success: boolean) => void
  ]
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)
const combatEncountersStore = useCombatEncountersStore()

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEditMode = computed(() => !!props.portalView)

const formData = ref({
  name: '',
  showEncounter: false,
  showHealth: false,
  showAC: false,
  showActions: false,
  autoResetImageState: false,
  combatEncounterId: null as number | null,
  currentItem: null as number | null,
})

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => (v && v.length >= 3) || 'Name must be at least 3 characters',
]

const isFormValid = computed(() => {
  return formData.value.name.length >= 3
})

const combatEncounters = computed(() => {
  return combatEncountersStore.encounters.map(encounter => ({
    id: encounter.id,
    name: encounter.name,
    round: encounter.round,
  }))
})

// Watch for portalView changes (edit mode)
watch(() => props.portalView, (newPortalView) => {
  if (newPortalView) {
    formData.value = {
      name: newPortalView.name,
      showEncounter: newPortalView.showEncounter,
      showHealth: newPortalView.showHealth,
      showAC: newPortalView.showAC,
      showActions: newPortalView.showActions,
      autoResetImageState: newPortalView.autoResetImageState,
      combatEncounterId: newPortalView.combatEncounterId,
      currentItem: newPortalView.currentItem,
    }
  } else {
    // Reset form for create mode
    formData.value = {
      name: '',
      showEncounter: false,
      showHealth: false,
      showAC: false,
      showActions: false,
      autoResetImageState: false,
      combatEncounterId: null,
      currentItem: null,
    }
  }
}, { immediate: true })

// Watch for dialog open to fetch encounters
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.libraryId) {
    try {
      await combatEncountersStore.fetchEncounters(props.libraryId)
    } catch (error) {
      console.error('Failed to load combat encounters:', error)
    }
  }
})

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true
  try {
    emit('submit', {
      name: formData.value.name,
      showEncounter: formData.value.showEncounter,
      showHealth: formData.value.showHealth,
      showAC: formData.value.showAC,
      showActions: formData.value.showActions,
      autoResetImageState: formData.value.autoResetImageState,
      combatEncounterId: formData.value.combatEncounterId,
      currentItem: formData.value.currentItem ?? undefined,
      items: props.portalView?.items || [],
    }, (success) => {
      isLoading.value = false
      if (success) {
        dialogModel.value = false
      }
    })
  } catch (error) {
    isLoading.value = false
  }
}

function handleCancel() {
  dialogModel.value = false
}
</script>

<style scoped>
.glass-dialog {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>

