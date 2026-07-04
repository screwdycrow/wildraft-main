<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="glass-card" elevation="0">
      <v-card-title class="text-h6 font-weight-bold d-flex align-center pa-5">
        <v-icon icon="mdi-content-copy" color="primary" class="mr-3" />
        Copy Player Items Here
      </v-card-title>
      <v-card-text class="px-5 pb-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Copies the player-controlled items (tokens, handouts…) from another screen onto
          <strong>{{ targetName }}</strong>.
        </p>
        <v-select
          v-model="sourceId"
          label="Copy from"
          variant="outlined"
          :items="sourceOptions"
          item-title="name"
          item-value="id"
          class="mb-3"
        />
        <v-select
          v-model="playerId"
          label="Player"
          variant="outlined"
          :items="playerOptions"
          item-title="label"
          item-value="id"
          clearable
          placeholder="All players"
          persistent-placeholder
        />
      </v-card-text>
      <v-card-actions class="px-5 pb-5">
        <v-spacer />
        <v-btn variant="text" :disabled="isCopying" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="isCopying" :disabled="!sourceId" @click="copy">
          Copy items
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { dmScreensApi } from '@/api/dmScreens'
import { librariesApi } from '@/api/libraries'
import { useDmScreensStore } from '@/stores/dmScreens'

const props = defineProps<{
  modelValue: boolean
  libraryId: number
  targetId: string
  targetName: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const toast = useToast()
const dmScreensStore = useDmScreensStore()

const sourceId = ref<string | null>(null)
const playerId = ref<number | null>(null)
const isCopying = ref(false)
const playerOptions = ref<{ id: number; label: string }[]>([])

const sourceOptions = computed(() =>
  dmScreensStore.dmScreens.filter((s) => s.id !== props.targetId)
)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    sourceId.value = null
    playerId.value = null
    try {
      const { access } = await librariesApi.getAccess(props.libraryId)
      playerOptions.value = access
        .filter((a) => a.role === 'PLAYER')
        .map((a) => ({ id: a.userId, label: a.user.name || a.user.email }))
    } catch {
      playerOptions.value = []
    }
  }
)

async function copy() {
  if (!sourceId.value) return
  isCopying.value = true
  try {
    const result = await dmScreensApi.copyPlayerItems(props.libraryId, props.targetId, {
      sourceDmScreenId: sourceId.value,
      userId: playerId.value ?? undefined,
    })
    toast.success(
      result.copiedCount
        ? `Copied ${result.copiedCount} item${result.copiedCount > 1 ? 's' : ''}`
        : 'No player-controlled items found on that screen'
    )
    await dmScreensStore.fetchDmScreen(props.libraryId, props.targetId, true)
    emit('update:modelValue', false)
  } catch {
    toast.error('Failed to copy player items')
  } finally {
    isCopying.value = false
  }
}
</script>
