<template>
  <v-card class="mx-auto text-center pa-8 glass-card" max-width="400" elevation="0">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
      class="mb-4"
    />
    <h3 class="text-h6 mb-2">Completing sign in...</h3>
    <p class="text-body-2 text-medium-emphasis">Please wait</p>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

onMounted(async () => {
  const { accessToken, refreshToken } = route.query

  if (!accessToken || !refreshToken) {
    toast.error('Authentication failed')
    router.push({ name: 'Login' })
    return
  }

  try {
    // Set tokens and fetch user
    authStore.accessToken = accessToken as string
    authStore.refreshTokenValue = refreshToken as string
    localStorage.setItem('accessToken', accessToken as string)
    localStorage.setItem('refreshToken', refreshToken as string)

    await authStore.getCurrentUser()
    toast.success('Successfully signed in with Google!')
    router.push({ name: 'Dashboard' })
  } catch (error) {
    toast.error('Failed to complete authentication')
    router.push({ name: 'Login' })
  }
})
</script>

<style scoped>
.glass-card {
  background: rgba(26, 26, 46, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>







