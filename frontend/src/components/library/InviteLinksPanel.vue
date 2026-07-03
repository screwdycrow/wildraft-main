<template>
  <v-card class="glass-card" elevation="0">
    <v-card-title class="text-h5 font-weight-bold pa-6 d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon icon="mdi-link-variant" color="primary" class="mr-3" />
        Invite Links
      </div>
      <v-btn color="primary" prepend-icon="mdi-link-plus" @click="showCreateDialog = true">
        New Invite Link
      </v-btn>
    </v-card-title>

    <v-card-text class="px-6 pb-6">
      <p class="text-body-2 text-medium-emphasis mb-4">
        Create a link, send it over Discord/WhatsApp/anything — whoever opens it can register (or
        log in) and instantly joins this library with the role you picked.
      </p>

      <div v-if="isLoading" class="text-center py-6">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <v-alert
        v-else-if="invitations.length === 0"
        type="info"
        variant="tonal"
        density="compact"
      >
        No invite links yet. Create one to invite your players!
      </v-alert>

      <v-list v-else class="bg-transparent">
        <v-list-item v-for="inv in invitations" :key="inv.id" class="px-0 mb-1">
          <template #prepend>
            <v-icon
              :icon="statusOf(inv) === 'valid' ? 'mdi-link-variant' : 'mdi-link-variant-off'"
              :color="statusOf(inv) === 'valid' ? 'primary' : 'grey'"
              class="mr-3"
            />
          </template>

          <v-list-item-title class="d-flex align-center flex-wrap ga-2">
            <v-chip size="x-small" :color="roleColor(inv.role)" variant="tonal">{{ inv.role }}</v-chip>
            <span v-if="inv.email" class="text-body-2">{{ inv.email }}</span>
            <span v-else class="text-body-2 text-medium-emphasis">anyone with the link</span>
            <v-chip v-if="statusOf(inv) !== 'valid'" size="x-small" color="warning" variant="tonal">
              {{ statusOf(inv) }}
            </v-chip>
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            Used {{ inv.uses }}{{ inv.maxUses ? ` / ${inv.maxUses}` : '' }} times
            <template v-if="inv.expiresAt"> · expires {{ formatDate(inv.expiresAt) }}</template>
            · created {{ formatDate(inv.createdAt) }}
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              v-if="statusOf(inv) === 'valid'"
              icon="mdi-content-copy"
              variant="text"
              size="small"
              title="Copy invite link"
              @click="copyLink(inv)"
            />
            <v-btn
              v-if="!inv.revokedAt"
              icon="mdi-delete-outline"
              variant="text"
              size="small"
              color="error"
              title="Revoke"
              @click="revoke(inv)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <!-- Create dialog -->
    <v-dialog v-model="showCreateDialog" max-width="520">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-link-plus" color="primary" size="32" class="mr-3" />
          New Invite Link
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <v-select
            v-model="createForm.role"
            label="Role"
            prepend-inner-icon="mdi-account-key"
            variant="outlined"
            :items="roleOptions"
            class="mb-3"
          />
          <v-text-field
            v-model="createForm.email"
            label="Restrict to email (optional)"
            prepend-inner-icon="mdi-email-lock"
            variant="outlined"
            type="email"
            clearable
            hint="Leave empty so anyone with the link can join"
            persistent-hint
            class="mb-3"
          />
          <v-text-field
            v-model.number="createForm.maxUses"
            label="Max uses (optional)"
            prepend-inner-icon="mdi-counter"
            variant="outlined"
            type="number"
            min="1"
            clearable
            hint="e.g. 5 for a five-player table. Empty = unlimited"
            persistent-hint
            class="mb-3"
          />
          <v-select
            v-model="createForm.expiry"
            label="Expires"
            prepend-inner-icon="mdi-clock-outline"
            variant="outlined"
            :items="expiryOptions"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn variant="text" :disabled="isCreating" @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="isCreating" @click="create">
            Create & copy link
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { invitationsApi } from '@/api/invitations'
import type { PlayerInvitation, InvitationStatus, AccessRole } from '@/types/library.types'

const props = defineProps<{ libraryId: number }>()

const toast = useToast()
const invitations = ref<PlayerInvitation[]>([])
const isLoading = ref(false)
const isCreating = ref(false)
const showCreateDialog = ref(false)

const createForm = ref({
  role: 'PLAYER' as AccessRole,
  email: '' as string | null,
  maxUses: null as number | null,
  expiry: 'never' as string,
})

const roleOptions = [
  { title: 'Player (sees only what you share)', value: 'PLAYER' },
  { title: 'Viewer (sees the whole library)', value: 'VIEWER' },
  { title: 'Editor (can edit everything)', value: 'EDITOR' },
]

const expiryOptions = [
  { title: 'Never', value: 'never' },
  { title: 'After 24 hours', value: '1d' },
  { title: 'After 7 days', value: '7d' },
  { title: 'After 30 days', value: '30d' },
]

function statusOf(inv: PlayerInvitation): InvitationStatus {
  if (inv.revokedAt) return 'revoked'
  if (inv.expiresAt && new Date(inv.expiresAt) < new Date()) return 'expired'
  if (inv.maxUses !== null && inv.uses >= inv.maxUses) return 'exhausted'
  return 'valid'
}

function roleColor(role: string) {
  switch (role) {
    case 'EDITOR':
      return 'secondary'
    case 'VIEWER':
      return 'info'
    case 'PLAYER':
      return 'success'
    default:
      return 'primary'
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

async function copyLink(inv: PlayerInvitation) {
  try {
    await navigator.clipboard.writeText(invitationsApi.buildInviteUrl(inv.token))
    toast.success('Invite link copied to clipboard!')
  } catch {
    toast.error('Could not copy — copy it manually: ' + invitationsApi.buildInviteUrl(inv.token))
  }
}

async function load() {
  isLoading.value = true
  try {
    const { invitations: list } = await invitationsApi.list(props.libraryId)
    invitations.value = list
  } catch {
    toast.error('Failed to load invite links')
  } finally {
    isLoading.value = false
  }
}

async function create() {
  isCreating.value = true
  try {
    const expiresAt =
      createForm.value.expiry === 'never'
        ? undefined
        : new Date(
            Date.now() +
              { '1d': 1, '7d': 7, '30d': 30 }[createForm.value.expiry]! * 24 * 60 * 60 * 1000
          ).toISOString()

    const { invitation } = await invitationsApi.create(props.libraryId, {
      role: createForm.value.role,
      email: createForm.value.email || undefined,
      maxUses: createForm.value.maxUses || undefined,
      expiresAt,
    })
    invitations.value.unshift(invitation)
    showCreateDialog.value = false
    await copyLink(invitation)
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to create invite link')
  } finally {
    isCreating.value = false
  }
}

async function revoke(inv: PlayerInvitation) {
  try {
    await invitationsApi.revoke(props.libraryId, inv.id)
    inv.revokedAt = new Date().toISOString()
    toast.success('Invite link revoked')
  } catch {
    toast.error('Failed to revoke invite link')
  }
}

onMounted(load)
</script>
