import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginCredentials, RegisterCredentials } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshTokenValue = ref<string | null>(localStorage.getItem('refreshToken'))
  const tokenExpiresAt = ref<number | null>(
    localStorage.getItem('tokenExpiresAt') ? Number(localStorage.getItem('tokenExpiresAt')) : null
  )
  const isLoading = ref(false)
  const refreshTimer = ref<number | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  
  const isTokenExpiringSoon = computed(() => {
    if (!tokenExpiresAt.value) return false
    // Token expires in less than 5 minutes
    return Date.now() > tokenExpiresAt.value - 5 * 60 * 1000
  })
  
  const isTokenExpired = computed(() => {
    if (!tokenExpiresAt.value) return false
    return Date.now() > tokenExpiresAt.value
  })

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
      setTokens(response.accessToken, response.refreshToken)
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
     setTokens(token, refresh)
  } 

  function setTokens(token: string, refresh: string) {
    accessToken.value = token
    refreshTokenValue.value = refresh
    localStorage.setItem('accessToken', token)
    localStorage.setItem('refreshToken', refresh)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = payload.exp * 1000 // Convert to milliseconds
      tokenExpiresAt.value = expiresAt
      localStorage.setItem('tokenExpiresAt', expiresAt.toString())
      console.log('[Auth] Token expires at:', new Date(expiresAt).toLocaleString())
    } catch (error) {
      console.error('[Auth] Failed to decode token:', error)
      // Default to 15 minutes if decode fails
      const expiresAt = Date.now() + 15 * 60 * 1000
      tokenExpiresAt.value = expiresAt
      localStorage.setItem('tokenExpiresAt', expiresAt.toString())
    }
    
    // Start proactive refresh timer
    scheduleTokenRefresh()
  }

  function clearAuthData() {
    user.value = null
    accessToken.value = null
    refreshTokenValue.value = null
    tokenExpiresAt.value = null
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('tokenExpiresAt')
    
    // Clear refresh timer
    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
      refreshTimer.value = null
    }
  }
  
  // Schedule automatic token refresh before expiration
  function scheduleTokenRefresh() {
    // Clear existing timer
    if (refreshTimer.value) {
      clearTimeout(refreshTimer.value)
    }
    
    if (!tokenExpiresAt.value) return
    
    // Refresh 2 minutes before expiration
    const refreshTime = tokenExpiresAt.value - Date.now() - 2 * 60 * 1000
    
    if (refreshTime > 0) {
      console.log('[Auth] Scheduling token refresh in', Math.round(refreshTime / 1000), 'seconds')
      refreshTimer.value = window.setTimeout(async () => {
        console.log('[Auth] Proactively refreshing token...')
        await refreshToken()
      }, refreshTime)
    } else if (isTokenExpired.value) {
      // Token already expired, refresh immediately
      console.log('[Auth] Token expired, refreshing immediately')
      refreshToken()
    }
  }

  function loginWithGoogle() {
    window.location.href = authApi.getGoogleAuthUrl()
  }

  // Initialize token refresh on store creation
  if (accessToken.value && tokenExpiresAt.value) {
    scheduleTokenRefresh()
  }

  return {
    user,
    accessToken,
    refreshTokenValue,
    tokenExpiresAt,
    isLoading,
    isAuthenticated,
    isTokenExpiringSoon,
    isTokenExpired,
    login,
    register,
    getCurrentUser,
    refreshToken,
    logout,
    loginWithGoogle,
    scheduleTokenRefresh,
  }
})







