<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="glass-card" elevation="0">
      <v-card-title class="text-h6 font-weight-bold d-flex align-center pa-5">
        <v-icon icon="mdi-account-key" color="primary" class="mr-3" />
        Assign Player Control
      </v-card-title>
      <v-card-text class="px-5 pb-2">
        <p class="text-body-2 text-medium-emphasis mb-3">
          Players with control can move this item on the DM screen (e.g. their own token).
        </p>
        <div v-if="isLoading" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" size="28" />
        </div>
        <v-alert v-else-if="players.length === 0" type="info" variant="tonal" density="compact">
          No players in this library yet.
        </v-alert>
        <v-list v-else class="bg-transparent">
          <v-list-item v-for="player in players" :key="player.userId" class="px-0">
            <template #prepend>
              <v-checkbox-btn v-model="player.selected" color="primary" />
            </template>
            <v-list-item-title>{{ player.name || player.email }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions class="px-5 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { librariesApi } from '@/api/libraries'
import { useDmScreensStore } from '@/stores/dmScreens'
import type { DmScreenItem } from '@/types/dmScreen.types'

const props = defineProps<{
  modelValue: boolean
  libraryId: number
  dmScreenId: string
  item: DmScreenItem | null
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const toast = useToast()
const dmScreensStore = useDmScreensStore()

const players = ref<{ userId: number; email: string; name: string | null; selected: boolean }[]>([])
const isLoading = ref(false)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || !props.item) return
    isLoading.value = true
    try {
      const { access } = await librariesApi.getAccess(props.libraryId)
      const controlled = new Set(((props.item as any).controlledBy as number[]) || [])
      players.value = access
        .filter((a) => a.role === 'PLAYER')
        .map((a) => ({
          userId: a.userId,
          email: a.user.email,
          name: a.user.name,
          selected: controlled.has(a.userId),
        }))
    } catch {
      toast.error('Failed to load players')
    } finally {
      isLoading.value = false
    }
  }
)

function save() {
  if (!props.item) return
  const controlledBy = players.value.filter((p) => p.selected).map((p) => p.userId)
  dmScreensStore.updateItem(props.dmScreenId, props.libraryId, props.item.id, {
    controlledBy,
  } as Partial<DmScreenItem>)
  toast.success(controlledBy.length ? 'Control assigned' : 'Control removed')
  emit('update:modelValue', false)
}
</script>
