<template>
  <v-card class="mx-auto glass-card" max-width="450" elevation="0">
    <v-card-title class="text-h4 text-center py-6">
      <v-icon icon="mdi-shield-account" size="40" color="primary" class="mr-2" />
      Sign In
    </v-card-title>

    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          prepend-inner-icon="mdi-email"
          :rules="emailRules"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          :rules="passwordRules"
          variant="outlined"
          class="mb-2"
        />

        <v-checkbox
          v-model="rememberMe"
          label="Remember me"
          density="compact"
          hide-details
          class="mb-4"
        />

        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          :loading="isLoading"
          class="mb-4"
        >
          Sign In
        </v-btn>
      </v-form>

      <v-divider class="my-4">
        <span class="text-caption text-medium-emphasis px-2">OR</span>
      </v-divider>

      <google-auth-button @click="handleGoogleLogin" />

      <div class="text-center mt-6">
        <span class="text-body-2">Don't have an account?</span>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          :to="{ name: 'Register' }"
          class="ml-1"
        >
          Sign Up
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import GoogleAuthButton from './GoogleAuthButton.vue'
import type { VForm } from 'vuetify/components'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const formRef = ref<VForm>()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
]

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true
  error.value = null

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    toast.success('Welcome back!')
    const redirect = route.query.redirect as string
    router.push(redirect || { name: 'Dashboard' })
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Login failed. Please try again.'
    toast.error(error.value)
  } finally {
    isLoading.value = false
  }
}

function handleGoogleLogin() {
  authStore.loginWithGoogle()
}
</script>

<style scoped>
.glass-card {
  background: rgba(26, 26, 46, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>





