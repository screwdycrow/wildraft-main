import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userSettingsApi, type UserSettings } from '@/api/userSettings'
import { useAuthStore } from './auth'

export const useUserSettingsStore = defineStore('userSettings', () => {
    const authStore = useAuthStore()

    const openaiApiKey = ref<string>('') // Local input value
    const isApiKeyConfigured = ref(false) // Server state
    const aiSettings = ref<Record<string, any>>({})
    const isLoading = ref(false)

    const hasApiKey = computed(() => isApiKeyConfigured.value || !!openaiApiKey.value)

    function setSettings(settings: UserSettings & { hasOpenaiApiKey?: boolean }) {
        if (settings.openaiApiKey !== undefined) {
            openaiApiKey.value = settings.openaiApiKey
        }
        if (settings.hasOpenaiApiKey !== undefined) {
            isApiKeyConfigured.value = settings.hasOpenaiApiKey
        }
        if (settings.aiSettings !== undefined) {
            aiSettings.value = settings.aiSettings || {}
        }
    }

    async function updateSettings(settings: UserSettings) {
        isLoading.value = true
        try {
            const { user } = await userSettingsApi.updateSettings(settings)
            // Update local state
            setSettings({
                openaiApiKey: settings.openaiApiKey,
                aiSettings: user.aiSettings,
                hasOpenaiApiKey: !!settings.openaiApiKey // Optimistic update
            })
            // Update auth store user object too to keep them in sync
            if (authStore.user) {
                authStore.user.aiSettings = user.aiSettings
                authStore.user.hasOpenaiApiKey = !!settings.openaiApiKey
            }
            return user
        } finally {
            isLoading.value = false
        }
    }

    return {
        openaiApiKey,
        isApiKeyConfigured,
        aiSettings,
        isLoading,
        hasApiKey,
        setSettings,
        updateSettings,
    }
})
