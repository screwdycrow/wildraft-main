<template>
  <v-card class="mx-auto glass-card" max-width="450" elevation="0">
    <v-card-title class="text-h4 text-center py-6">
      <v-icon icon="mdi-account-plus" size="40" color="primary" class="mr-2" />
      Create Account
    </v-card-title>

    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <v-form ref="formRef" @submit.prevent="handleSubmit">
        <v-text-field
          v-model="name"
          label="Name (optional)"
          prepend-inner-icon="mdi-account"
          variant="outlined"
          class="mb-2"
        />

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
          @input="checkPasswordStrength"
          :rules="passwordRules"
          variant="outlined"
          class="mb-2"
        />

        <password-strength-meter :password="password" class="mb-4" />

        <v-text-field
          v-model="confirmPassword"
          label="Confirm Password"
          :type="showConfirmPassword ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-check"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          :rules="confirmPasswordRules"
          variant="outlined"
          class="mb-2"
        />

        <v-checkbox
          v-model="agreeToTerms"
          :rules="[(v) => !!v || 'You must agree to continue']"
          density="compact"
          class="mb-4"
        >
          <template #label>
            <span class="text-body-2">
              I agree to the
              <a href="#" class="text-primary">Terms & Conditions</a>
            </span>
          </template>
        </v-checkbox>

        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          :loading="isLoading"
          class="mb-4"
        >
          Sign Up
        </v-btn>
      </v-form>

      <v-divider class="my-4">
        <span class="text-caption text-medium-emphasis px-2">OR</span>
      </v-divider>

      <google-auth-button @click="handleGoogleLogin" />

      <div class="text-center mt-6">
        <span class="text-body-2">Already have an account?</span>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          :to="{ name: 'Login' }"
          class="ml-1"
        >
          Sign In
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import GoogleAuthButton from './GoogleAuthButton.vue'
import PasswordStrengthMeter from './PasswordStrengthMeter.vue'
import type { VForm } from 'vuetify/components'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const formRef = ref<VForm>()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters',
  (v: string) => /[A-Z]/.test(v) || 'Password must contain an uppercase letter',
  (v: string) => /[a-z]/.test(v) || 'Password must contain a lowercase letter',
  (v: string) => /[0-9]/.test(v) || 'Password must contain a number',
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === password.value || 'Passwords do not match',
]

function checkPasswordStrength() {
  // Trigger password strength calculation
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true
  error.value = null

  try {
    await authStore.register({
      email: email.value,
      password: password.value,
      name: name.value || undefined,
    })

    toast.success('Account created successfully! Welcome!')
    router.push({ name: 'Dashboard' })
  } catch (err: any) {
    const errorMsg = err.response?.data?.error || 'Registration failed. Please try again.'
    error.value = errorMsg
    toast.error(errorMsg)
  } finally {
    isLoading.value = false
  }
}

function handleGoogleLogin() {
  authStore.loginWithGoogle()
}
</script>

<style scoped>
/* Use global glass-card styles from theme */
</style>







