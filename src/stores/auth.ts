import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginCredentials, RegisterCredentials } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)

  // Actions
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    try {
      const response = await authApi.login(credentials)
      setAuthData(response.user, response.accessToken, response.refreshToken)
      return response
    } finally {
      isLoading.value = false
    }
  }

  async function register(credentials: RegisterCredentials) {
    isLoading.value = true
    try {
      const response = await authApi.register(credentials)
      setAuthData(response.user, response.accessToken, response.refreshToken)
      return response
    } finally {
      isLoading.value = false
    }
  }

  async function getCurrentUser() {
    if (!accessToken.value) return null
    
    isLoading.value = true
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.user
      return response.user
    } catch (error) {
      clearAuthData()
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function refreshToken() {
    if (!refreshTokenValue.value) return false

    try {
      const response = await authApi.refreshToken(refreshTokenValue.value)
      setAuthData(response.user, response.accessToken, response.refreshToken)
      return true
    } catch (error) {
      clearAuthData()
      return false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuthData()
    }
  }

  function setAuthData(userData: User, token: string, refresh: string) {
    user.value = userData
    accessToken.value = token
    refreshTokenValue.value = refresh
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refresh)
  }

  function clearAuthData() {
    user.value = null
    accessToken.value = null
    refreshTokenValue.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  function loginWithGoogle() {
    window.location.href = authApi.getGoogleAuthUrl()
  }

  return {
    user,
    accessToken,
    refreshTokenValue,
    isLoading,
    isAuthenticated,
    login,
    register,
    getCurrentUser,
    refreshToken,
    logout,
    loginWithGoogle,
  }
})






