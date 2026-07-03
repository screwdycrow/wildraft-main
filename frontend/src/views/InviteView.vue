<template>
  <v-app>
    <v-main class="invite-bg">
      <v-container class="fill-height" fluid>
        <v-row justify="center" align="center">
          <v-col cols="12" sm="8" md="5" lg="4">
            <v-card class="pa-4" elevation="12" rounded="xl">
              <!-- Loading -->
              <template v-if="isLoading">
                <v-card-text class="text-center py-12">
                  <v-progress-circular indeterminate color="primary" size="48" />
                  <p class="text-body-1 mt-4">Reading your invitation…</p>
                </v-card-text>
              </template>

              <!-- Invalid / not found -->
              <template v-else-if="loadError || !invitation">
                <v-card-text class="text-center py-10">
                  <v-icon icon="mdi-email-remove-outline" size="64" color="error" class="mb-4" />
                  <h2 class="text-h5 mb-2">Invitation not found</h2>
                  <p class="text-body-2 text-medium-emphasis">
                    This invite link doesn't exist. Double-check the link your DM sent you.
                  </p>
                </v-card-text>
              </template>

              <!-- Not claimable -->
              <template v-else-if="invitation.status !== 'valid'">
                <v-card-text class="text-center py-10">
                  <v-icon :icon="statusIcon" size="64" color="warning" class="mb-4" />
                  <h2 class="text-h5 mb-2">{{ statusTitle }}</h2>
                  <p class="text-body-2 text-medium-emphasis">{{ statusMessage }}</p>
                </v-card-text>
              </template>

              <!-- Valid invitation -->
              <template v-else>
                <v-card-text class="text-center pt-8">
                  <v-icon icon="mdi-sword-cross" size="64" color="primary" class="mb-4" />
                  <h2 class="text-h5 mb-1">You've been invited!</h2>
                  <p class="text-body-1 mb-1">
                    Join
                    <strong>{{ invitation.library.name }}</strong>
                  </p>
                  <v-chip size="small" color="primary" variant="tonal" class="mb-4">
                    as {{ roleLabel }}
                  </v-chip>
                  <p v-if="invitation.email" class="text-caption text-medium-emphasis">
                    This invite is reserved for {{ invitation.email }}
                  </p>
                </v-card-text>

                <v-card-actions class="flex-column pb-6 px-6">
                  <template v-if="authStore.isAuthenticated">
                    <v-btn
                      color="primary"
                      variant="flat"
                      size="large"
                      block
                      :loading="isClaiming"
                      @click="claim"
                    >
                      Accept invitation
                    </v-btn>
                    <p class="text-caption text-medium-emphasis mt-3">
                      Signed in as {{ authStore.user?.email }}
                    </p>
                    <v-alert v-if="claimError" type="error" variant="tonal" density="compact" class="mt-3 w-100">
                      {{ claimError }}
                    </v-alert>
                  </template>
                  <template v-else>
                    <v-btn
                      color="primary"
                      variant="flat"
                      size="large"
                      block
                      :to="{ name: 'Register', query: { redirect: route.fullPath } }"
                    >
                      Create account & join
                    </v-btn>
                    <v-btn
                      variant="text"
                      size="large"
                      block
                      class="mt-2"
                      :to="{ name: 'Login', query: { redirect: route.fullPath } }"
                    >
                      I already have an account
                    </v-btn>
                  </template>
                </v-card-actions>
              </template>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { invitationsApi } from '@/api/invitations'
import type { PublicInvitation } from '@/types/library.types'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const invitation = ref<PublicInvitation | null>(null)
const isLoading = ref(true)
const loadError = ref(false)
const isClaiming = ref(false)
const claimError = ref<string | null>(null)

const token = computed(() => route.params.token as string)

const roleLabel = computed(() => {
  switch (invitation.value?.role) {
    case 'PLAYER':
      return 'a Player'
    case 'VIEWER':
      return 'a Viewer'
    case 'EDITOR':
      return 'an Editor'
    case 'OWNER':
      return 'an Owner'
    default:
      return 'a member'
  }
})

const statusIcon = computed(() => {
  switch (invitation.value?.status) {
    case 'expired':
      return 'mdi-clock-alert-outline'
    case 'revoked':
      return 'mdi-cancel'
    case 'exhausted':
      return 'mdi-account-group'
    default:
      return 'mdi-help-circle-outline'
  }
})

const statusTitle = computed(() => {
  switch (invitation.value?.status) {
    case 'expired':
      return 'This invitation has expired'
    case 'revoked':
      return 'This invitation was revoked'
    case 'exhausted':
      return 'This invitation is full'
    default:
      return 'Invitation unavailable'
  }
})

const statusMessage = computed(() => {
  switch (invitation.value?.status) {
    case 'expired':
      return 'Ask your DM to send you a fresh invite link.'
    case 'revoked':
      return 'The DM cancelled this link. Ask them for a new one.'
    case 'exhausted':
      return 'All the seats on this invite have been taken. Ask your DM for a new link.'
    default:
      return ''
  }
})

async function claim() {
  isClaiming.value = true
  claimError.value = null
  try {
    const result = await invitationsApi.claim(token.value)
    toast.success(
      result.alreadyMember
        ? `You already had access to ${invitation.value!.library.name}!`
        : `Welcome to ${invitation.value!.library.name}!`
    )
    if (result.role === 'PLAYER') {
      router.push({ name: 'PlayerDashboard', params: { id: result.libraryId } })
    } else {
      router.push({ name: 'Library', params: { id: result.libraryId } })
    }
  } catch (err: any) {
    claimError.value =
      err.response?.data?.message || err.response?.data?.error || 'Failed to accept the invitation'
  } finally {
    isClaiming.value = false
  }
}

onMounted(async () => {
  try {
    invitation.value = await invitationsApi.getByToken(token.value)
  } catch {
    loadError.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.invite-bg {
  background: radial-gradient(ellipse at top, rgba(var(--v-theme-primary), 0.15), transparent 60%),
    rgb(var(--v-theme-background));
  min-height: 100vh;
}
</style>
