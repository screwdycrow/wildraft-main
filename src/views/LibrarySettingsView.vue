<template>
  <!-- Loading State -->
  <v-row v-if="libraryStore.isLoading || !libraryStore.currentLibrary">
    <v-col cols="12" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading library settings...</p>
    </v-col>
  </v-row>

  <div v-else-if="libraryStore.currentLibrary">
    <!-- Header -->
    <page-top-bar
      title="Library Settings"
      icon="mdi-cog"
      :description="`Manage ${libraryStore.currentLibrary.name}`"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <v-chip
          :color="getRoleColor(libraryStore.currentLibrary.role)"
          size="small"
        >
          {{ libraryStore.currentLibrary.role }}
        </v-chip>
      </template>
    </page-top-bar>

    <!-- Danger Zone -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-h5 font-weight-bold pa-6 d-flex align-center">
            <v-icon icon="mdi-alert" color="error" class="mr-3" />
            Danger Zone
          </v-card-title>
          <v-card-text class="px-6 pb-2">
            <div v-if="isOwner">
              <p class="text-body-1 mb-4">
                Deleting this library will permanently remove all stat blocks, characters, items, and notes.
                This action cannot be undone.
              </p>
              <v-btn
                color="error"
                variant="outlined"
                prepend-icon="mdi-delete"
                @click="showDeleteDialog = true"
                :loading="isDeleting"
              >
                Delete Library
              </v-btn>
            </div>
            <div v-else>
              <p class="text-body-1 mb-4">
                Remove your access to this library. You will no longer be able to view or edit this library.
              </p>
              <v-btn
                color="warning"
                variant="outlined"
                prepend-icon="mdi-exit-to-app"
                @click="showRemoveAccessDialog = true"
                :loading="isRemovingAccess"
              >
                Remove My Access
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Theme Selection -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-h5 font-weight-bold pa-6 d-flex align-center">
            <v-icon icon="mdi-palette" color="primary" class="mr-3" />
            Theme
          </v-card-title>
          <v-card-text class="px-6 pb-2">
            <p class="text-body-1 mb-4">
              Choose your preferred color theme for the application.
            </p>
            <v-select
              v-model="selectedTheme"
              label="Select Theme"
              variant="outlined"
              :items="themeOptions"
              item-title="title"
              item-value="value"
              prepend-inner-icon="mdi-palette"
              @update:model-value="changeTheme"
            />
            <v-alert type="info" variant="tonal" density="compact" class="mt-4">
              The theme will be applied globally across the entire application.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Members Section (Owner only) -->
    <v-row v-if="isOwner">
      <v-col cols="12">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-h5 font-weight-bold pa-6 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon icon="mdi-account-group" color="primary" class="mr-3" />
              Members
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-account-plus"
              @click="showInviteDialog = true"
            >
              Invite Member
            </v-btn>
          </v-card-title>
          <v-card-text class="px-6 pb-2">
            <v-list class="bg-transparent">
              <v-list-item
                v-for="access in libraryAccess"
                :key="access.id"
                class="mb-2"
              >
                <template #prepend>
                  <v-avatar color="primary" size="40">
                    <v-icon icon="mdi-account" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">
                  {{ access.user.name || access.user.email }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ access.user.email }}
                </v-list-item-subtitle>
                <template #append>
                  <div class="d-flex align-center gap-2">
                    <v-chip
                      :color="getRoleColor(access.role)"
                      size="small"
                    >
                      {{ access.role }}
                    </v-chip>
                    <v-menu v-if="access.role !== 'OWNER' || access.userId === currentUserId" location="bottom">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-dots-vertical"
                          variant="text"
                          size="small"
                        />
                      </template>
                      <v-list class="glass-menu">
                        <v-list-item
                          v-if="access.role !== 'OWNER'"
                          prepend-icon="mdi-pencil"
                          title="Change Role"
                          @click="openChangeRoleDialog(access)"
                        />
                        <v-list-item
                          v-if="access.userId !== currentUserId && access.role !== 'OWNER'"
                          prepend-icon="mdi-account-remove"
                          title="Remove Access"
                          class="text-error"
                          @click="confirmRevokeAccess(access)"
                        />
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-alert
              v-if="libraryAccess.length === 0"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              No members yet. Invite someone to share this library!
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-alert" color="error" size="32" class="mr-3" />
          Delete Library?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to delete <strong>{{ libraryStore.currentLibrary?.name }}</strong>?
          </p>
          <v-alert type="error" variant="tonal" density="compact" icon="mdi-alert">
            This action cannot be undone. All stat blocks, characters, items, and notes in this library will be permanently deleted.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Delete Library
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Access Confirmation Dialog -->
    <v-dialog v-model="showRemoveAccessDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-exit-to-app" color="warning" size="32" class="mr-3" />
          Remove Your Access?
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Are you sure you want to remove your access to <strong>{{ libraryStore.currentLibrary?.name }}</strong>?
          </p>
          <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert">
            You will no longer be able to view or edit this library. You can request access again from the owner.
          </v-alert>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showRemoveAccessDialog = false"
            :disabled="isRemovingAccess"
          >
            Cancel
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="confirmRemoveAccess"
            :loading="isRemovingAccess"
          >
            Remove Access
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Invite Member Dialog -->
    <v-dialog v-model="showInviteDialog" max-width="600">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-account-plus" color="primary" size="32" class="mr-3" />
          Invite Member
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <v-form ref="inviteFormRef" @submit.prevent="handleInvite">
            <v-text-field
              v-model="inviteForm.email"
              label="User Email"
              prepend-inner-icon="mdi-email"
              variant="outlined"
              type="email"
              :rules="emailRules"
              class="mb-4"
              placeholder="user@example.com"
              autofocus
            />
            <v-select
              v-model="inviteForm.role"
              label="Role"
              prepend-inner-icon="mdi-account-key"
              variant="outlined"
              :items="roleOptions"
              class="mb-4"
            />
            <v-alert type="info" variant="tonal" density="compact" icon="mdi-information">
              <strong>OWNER:</strong> Full control, can delete library<br>
              <strong>EDITOR:</strong> Can create and edit content<br>
              <strong>VIEWER:</strong> Can only view content
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showInviteDialog = false"
            :disabled="isInviting"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="handleInvite"
            :loading="isInviting"
          >
            <v-icon icon="mdi-send" class="mr-2" />
            Send Invitation
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Change Role Dialog -->
    <v-dialog v-model="showChangeRoleDialog" max-width="500">
      <v-card class="glass-card" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center pa-6">
          <v-icon icon="mdi-account-key" color="primary" size="32" class="mr-3" />
          Change Role
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <p class="text-body-1 mb-4">
            Change role for <strong>{{ selectedAccess?.user.name || selectedAccess?.user.email }}</strong>
          </p>
          <v-select
            v-model="newRole"
            label="New Role"
            variant="outlined"
            :items="roleOptions"
            class="mb-4"
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showChangeRoleDialog = false"
            :disabled="isChangingRole"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="confirmChangeRole"
            :loading="isChangingRole"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from 'vuetify'
import { useLibraryStore } from '@/stores/library'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import type { LibraryAccess } from '@/types/library.types'
import type { VForm } from 'vuetify/components'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'

const router = useRouter()
const route = useRoute()
const theme = useTheme()
const libraryStore = useLibraryStore()
const authStore = useAuthStore()
const toast = useToast()

const libraryAccess = ref<LibraryAccess[]>([])
const isLoadingAccess = ref(false)
const isDeleting = ref(false)
const isRemovingAccess = ref(false)
const isInviting = ref(false)
const isChangingRole = ref(false)

const showDeleteDialog = ref(false)
const showRemoveAccessDialog = ref(false)
const showInviteDialog = ref(false)
const showChangeRoleDialog = ref(false)

const inviteFormRef = ref<VForm>()
const selectedAccess = ref<LibraryAccess | null>(null)
const newRole = ref<'OWNER' | 'EDITOR' | 'VIEWER'>('EDITOR')

const inviteForm = ref({
  email: '',
  role: 'EDITOR' as 'OWNER' | 'EDITOR' | 'VIEWER',
})

const roleOptions = [
  { title: 'Owner', value: 'OWNER' },
  { title: 'Editor', value: 'EDITOR' },
  { title: 'Viewer', value: 'VIEWER' },
]

const themeOptions = [
  { title: 'Dark (Default)', value: 'darkTheme' },
  { title: 'Light', value: 'lightTheme' },
  { title: 'Dark Forest', value: 'darkForestTheme' },
  { title: 'Deep Blue', value: 'deepBlueTheme' },
  { title: 'Crimson', value: 'crimsonTheme' },
  { title: 'Papyrus', value: 'papyrusTheme' },
  { title: 'Midnight', value: 'midnightTheme' },
]

const selectedTheme = ref<string>(theme.global.name.value || 'darkTheme')

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

const isOwner = computed(() => libraryStore.currentLibrary?.role === 'OWNER')
const currentUserId = computed(() => authStore.user?.id)

const libraryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  if (!libraryStore.currentLibrary) return []
  return [
    { text: 'Libraries', to: { name: 'Dashboard' } },
    { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
    { text: 'Settings' }
  ]
})

function getRoleColor(role: string) {
  switch (role) {
    case 'OWNER': return 'primary'
    case 'EDITOR': return 'secondary'
    case 'VIEWER': return 'info'
    default: return 'grey'
  }
}

function changeTheme(themeName: string) {
  theme.global.name.value = themeName
  // Save to localStorage for persistence
  localStorage.setItem('vuetify-theme', themeName)
  toast.success(`Theme changed to ${themeOptions.find(t => t.value === themeName)?.title || themeName}`)
}

async function loadLibraryAccess() {
  if (!libraryStore.currentLibrary) return

  isLoadingAccess.value = true
  try {
    libraryAccess.value = await libraryStore.fetchLibraryAccess(libraryStore.currentLibrary.id)
  } catch (error) {
    toast.error('Failed to load library members')
  } finally {
    isLoadingAccess.value = false
  }
}

async function confirmDelete() {
  if (!libraryStore.currentLibrary) return

  isDeleting.value = true
  try {
    await libraryStore.deleteLibrary(libraryStore.currentLibrary.id)
    toast.success('Library deleted successfully')
    router.push({ name: 'Dashboard' })
  } catch (error) {
    toast.error('Failed to delete library')
  } finally {
    isDeleting.value = false
    showDeleteDialog.value = false
  }
}

async function confirmRemoveAccess() {
  if (!libraryStore.currentLibrary || !currentUserId.value) return

  // Find current user's access
  const userAccess = libraryAccess.value.find(acc => acc.userId === currentUserId.value)
  if (!userAccess) {
    toast.error('Could not find your access record')
    return
  }

  isRemovingAccess.value = true
  try {
    await libraryStore.removeOwnAccess(libraryStore.currentLibrary.id, userAccess.id)
    toast.success('Access removed successfully')
    router.push({ name: 'Dashboard' })
  } catch (error) {
    toast.error('Failed to remove access')
  } finally {
    isRemovingAccess.value = false
    showRemoveAccessDialog.value = false
  }
}

async function handleInvite() {
  if (!libraryStore.currentLibrary) return

  const { valid } = await inviteFormRef.value!.validate()
  if (!valid) return

  isInviting.value = true
  try {
    // Try to find user by email first
    let userId: number
    try {
      const { usersApi } = await import('@/api/users')
      const userResponse = await usersApi.findByEmail(inviteForm.value.email)
      userId = userResponse.user.id
    } catch (error: any) {
      // If user lookup fails, try to grant access with email directly
      // Some APIs might accept email in the grantAccess call
      // For now, show error if user not found
      if (error.response?.status === 404) {
        toast.error('User not found. Please check the email address.')
        return
      }
      throw error
    }

    await libraryStore.grantLibraryAccess(libraryStore.currentLibrary.id, userId, inviteForm.value.role)
    toast.success('Member invited successfully')
    showInviteDialog.value = false
    inviteForm.value = { email: '', role: 'EDITOR' }
    await loadLibraryAccess()
  } catch (error: any) {
    if (error.response?.status === 404) {
      toast.error('User not found. Please check the email address.')
    } else if (error.response?.status === 409) {
      toast.error('User already has access to this library')
    } else {
      toast.error('Failed to invite member')
    }
  } finally {
    isInviting.value = false
  }
}

function openChangeRoleDialog(access: LibraryAccess) {
  selectedAccess.value = access
  newRole.value = access.role
  showChangeRoleDialog.value = true
}

async function confirmChangeRole() {
  if (!libraryStore.currentLibrary || !selectedAccess.value) return

  isChangingRole.value = true
  try {
    await libraryStore.updateLibraryAccess(
      libraryStore.currentLibrary.id,
      selectedAccess.value.id,
      newRole.value
    )
    toast.success('Role updated successfully')
    showChangeRoleDialog.value = false
    selectedAccess.value = null
    await loadLibraryAccess()
  } catch (error) {
    toast.error('Failed to update role')
  } finally {
    isChangingRole.value = false
  }
}

async function confirmRevokeAccess(access: LibraryAccess) {
  if (!libraryStore.currentLibrary) return

  if (!confirm(`Are you sure you want to remove access for ${access.user.name || access.user.email}?`)) {
    return
  }

  try {
    await libraryStore.revokeLibraryAccess(libraryStore.currentLibrary.id, access.id)
    toast.success('Access revoked successfully')
    await loadLibraryAccess()
  } catch (error) {
    toast.error('Failed to revoke access')
  }
}

// Ensure library is loaded when component mounts or route changes
watch([() => libraryId.value, () => libraryStore.currentLibrary], async ([newId, currentLib]) => {
  if (newId && (!currentLib || currentLib.id !== newId)) {
    try {
      await libraryStore.fetchLibrary(newId)
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
  if (libraryStore.currentLibrary && isOwner.value) {
    await loadLibraryAccess()
  }
}, { immediate: true })

onMounted(async () => {
  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('vuetify-theme')
  if (savedTheme && themeOptions.some(t => t.value === savedTheme)) {
    theme.global.name.value = savedTheme
    selectedTheme.value = savedTheme
  } else {
    selectedTheme.value = theme.global.name.value || 'darkTheme'
  }

  // Ensure library is loaded
  if (libraryId.value && (!libraryStore.currentLibrary || libraryStore.currentLibrary.id !== libraryId.value)) {
    try {
      await libraryStore.fetchLibrary(libraryId.value)
    } catch (error) {
      toast.error('Failed to load library')
      router.push({ name: 'Dashboard' })
    }
  }
  
  // Load access list if owner
  if (libraryStore.currentLibrary && isOwner.value) {
    await loadLibraryAccess()
  }
})
</script>

<style scoped>
/* Use global glass-card class */
</style>

