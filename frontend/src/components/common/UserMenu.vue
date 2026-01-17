<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        class="ml-2"
      >
        <v-avatar color="primary" size="40">
          <v-icon v-if="!authStore.user?.picture" icon="mdi-account" />
          <v-img v-else :src="authStore.user.picture" />
        </v-avatar>
      </v-btn>
    </template>
    <v-list class="glass-menu">
      <v-list-item>
        <v-list-item-title class="font-weight-bold">
          {{ authStore.user?.name || authStore.user?.email }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ authStore.user?.email }}
        </v-list-item-subtitle>
      </v-list-item>
      <v-divider class="my-2" />
      <v-list-item
        @click="openFiles"
        prepend-icon="mdi-folder-multiple"
      >
        My Files
      </v-list-item>
      <v-list-item
        :to="{ name: 'Dashboard' }"
        prepend-icon="mdi-view-dashboard"
      >
        All Libraries
      </v-list-item>
      <v-list-item
        :to="{ name: 'Settings' }"
        prepend-icon="mdi-cog"
      >
        Settings
      </v-list-item>
      <v-list-item
        @click="handleLogout"
        prepend-icon="mdi-logout"
      >
        Logout
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useFileManager } from '@/composables/useFileManager'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const { openFileManager } = useFileManager()
const toast = useToast()

function openFiles() {
  openFileManager()
}

async function handleLogout() {
  await authStore.logout()
  toast.info('Logged out successfully')
  router.push({ name: 'Login' })
}
</script>


