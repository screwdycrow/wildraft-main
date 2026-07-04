<template>
  <v-dialog :model-value="modelValue" max-width="560" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="glass-card" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
        <v-icon icon="mdi-share-variant" color="primary" size="32" class="mr-3" />
        Share with players
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Choose which players can see
          <strong>{{ targetName }}</strong>
          <template v-if="mode === 'dmScreen'"> — and whether they can edit it.</template>
          <template v-else-if="mode === 'item'"> — and whether they can edit it.</template>
        </p>

        <div v-if="isLoading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
          <v-alert
            v-if="players.length === 0"
            type="info"
            variant="tonal"
            density="compact"
          >
            No players in this library yet. Create an invite link in Library Settings to bring
            players in.
          </v-alert>

          <v-list v-else class="bg-transparent">
            <v-list-item v-for="player in players" :key="player.userId" class="px-0">
              <template #prepend>
                <v-checkbox-btn v-model="player.shared" color="primary" />
                <v-avatar color="secondary" size="32" class="mr-2">
                  <v-img v-if="player.picture" :src="player.picture" />
                  <v-icon v-else icon="mdi-account" size="18" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ player.name || player.email }}</v-list-item-title>
              <v-list-item-subtitle v-if="player.name">{{ player.email }}</v-list-item-subtitle>
              <template #append>
                <v-btn-toggle
                  v-if="mode === 'item' && player.shared"
                  v-model="player.permission"
                  density="compact"
                  color="primary"
                  mandatory
                  variant="outlined"
                >
                  <v-btn size="small" value="VIEW">View</v-btn>
                  <v-btn size="small" value="EDIT">Edit</v-btn>
                </v-btn-toggle>
                <v-switch
                  v-else-if="mode === 'dmScreen' && player.shared"
                  v-model="player.canEdit"
                  label="Can edit"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </template>
            </v-list-item>
          </v-list>
        </template>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="text" :disabled="isSaving" @click="$emit('update:modelValue', false)">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="flat" :loading="isSaving" @click="save">
          Save shares
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { sharesApi } from '@/api/shares'
import type { ItemPermission } from '@/api/shares'
import { librariesApi } from '@/api/libraries'

export type ShareMode = 'item' | 'dmScreen' | 'portal'

interface PlayerRow {
  userId: number
  email: string
  name: string | null
  picture: string | null
  shared: boolean
  permission: ItemPermission
  canEdit: boolean
}

const props = defineProps<{
  modelValue: boolean
  mode: ShareMode
  libraryId: number
  /** LibraryItem id for mode 'item'; uuid string for dmScreen/portal */
  targetId: number | string
  targetName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const players = ref<PlayerRow[]>([])
const isLoading = ref(false)
const isSaving = ref(false)

async function load() {
  isLoading.value = true
  try {
    // All PLAYER members of the library
    const { access } = await librariesApi.getAccess(props.libraryId)
    const playerMembers = access.filter((a) => a.role === 'PLAYER')

    // Current shares for this target
    let sharedMap = new Map<number, { permission?: ItemPermission; canEdit?: boolean }>()
    if (props.mode === 'item') {
      const { shares } = await sharesApi.getItemShares(props.libraryId, props.targetId as number)
      sharedMap = new Map(shares.map((s) => [s.userId, { permission: s.permission }]))
    } else if (props.mode === 'dmScreen') {
      const { shares } = await sharesApi.getDmScreenShares(props.libraryId, props.targetId as string)
      sharedMap = new Map(shares.map((s) => [s.userId, { canEdit: s.canEdit }]))
    } else {
      const { shares } = await sharesApi.getPortalShares(props.libraryId, props.targetId as string)
      sharedMap = new Map(shares.map((s) => [s.userId, {}]))
    }

    players.value = playerMembers.map((member) => {
      const userId = member.userId ?? member.user.id
      const share = sharedMap.get(userId)
      return {
        userId,
        email: member.user.email,
        name: member.user.name,
        picture: member.user.picture ?? null,
        shared: sharedMap.has(userId),
        permission: share?.permission ?? 'VIEW',
        canEdit: share?.canEdit ?? true,
      }
    })
  } catch {
    toast.error('Failed to load players')
  } finally {
    isLoading.value = false
  }
}

async function save() {
  isSaving.value = true
  try {
    const selected = players.value.filter((p) => p.shared)
    if (props.mode === 'item') {
      await sharesApi.putItemShares(
        props.libraryId,
        props.targetId as number,
        selected.map((p) => ({ userId: p.userId, permission: p.permission }))
      )
    } else if (props.mode === 'dmScreen') {
      await sharesApi.putDmScreenShares(
        props.libraryId,
        props.targetId as string,
        selected.map((p) => ({ userId: p.userId, canEdit: p.canEdit }))
      )
    } else {
      await sharesApi.putPortalShares(
        props.libraryId,
        props.targetId as string,
        selected.map((p) => ({ userId: p.userId }))
      )
    }
    toast.success('Shares updated')
    emit('saved')
    emit('update:modelValue', false)
  } catch {
    toast.error('Failed to update shares')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) load()
  }
)
</script>
