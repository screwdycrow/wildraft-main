<template>
  <div>
    <h1 class="text-h3 font-weight-bold mb-6" style="color: rgb(var(--v-theme-on-surface));">
      User Settings
    </h1>

    <v-card class="glass-card pa-6 mb-6" elevation="0">
      <h2 class="text-h5 mb-4">AI Configuration</h2>
      
      <v-form @submit.prevent="saveSettings">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="apiKeyInput"
              label="OpenAI API Key"
              :type="showApiKey ? 'text' : 'password'"
              :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showApiKey = !showApiKey"
              hint="Required for AI features. Your key is stored securely."
              persistent-hint
              variant="outlined"
              bg-color="surface"
            >
              <template v-slot:details>
                <div class="d-flex align-center mt-1">
                  <v-chip
                    v-if="userSettingsStore.isApiKeyConfigured"
                    color="success"
                    size="x-small"
                    variant="tonal"
                    prepend-icon="mdi-check-circle"
                    class="mr-2"
                  >
                    Key Configured
                  </v-chip>
                  <span class="text-caption text-grey">
                    {{ userSettingsStore.isApiKeyConfigured ? 'Enter new key to update' : 'Enter your OpenAI API key' }}
                  </span>
                </div>
              </template>
            </v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-select
              v-model="settings.model"
              label="Default Model"
              :items="['gpt-5.2', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo']"
              hint="Select the AI model to use."
              persistent-hint
              variant="outlined"
              bg-color="surface"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-slider
              v-model="settings.temperature"
              label="Creativity (Temperature)"
              min="0"
              max="2"
              step="0.1"
              thumb-label
              hint="Higher values make output more random, lower values more deterministic."
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-btn
          color="primary"
          type="submit"
          :loading="userSettingsStore.isLoading"
          class="mt-4"
        >
          Save Settings
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useUserSettingsStore } from '@/stores/userSettings'
import { useToast } from 'vue-toastification'

const userSettingsStore = useUserSettingsStore()
const toast = useToast()

const apiKeyInput = ref('')
const showApiKey = ref(false)
const settings = reactive({
  model: 'gpt-5.2',
  temperature: 0.7,
})

// Load initial values from store
onMounted(() => {
  loadFromStore()
})

// Watch for store changes (e.g. after login/fetch)
// Watch for store changes (e.g. after login/fetch)
watch(() => userSettingsStore.aiSettings, () => {
  loadFromStore()
}, { deep: true })

function loadFromStore() {
  // Only set input if user just typed it (local state in store), otherwise leave blank for security
  if (userSettingsStore.openaiApiKey) {
    apiKeyInput.value = userSettingsStore.openaiApiKey
  }
  
  const storedSettings = userSettingsStore.aiSettings || {}
  if (storedSettings.model) settings.model = storedSettings.model
  if (storedSettings.temperature !== undefined) settings.temperature = storedSettings.temperature
}

async function saveSettings() {
  try {
    await userSettingsStore.updateSettings({
      openaiApiKey: apiKeyInput.value,
      aiSettings: {
        model: settings.model,
        temperature: settings.temperature,
      }
    })
    toast.success('Settings saved successfully')
  } catch (error) {
    toast.error('Failed to save settings')
    console.error(error)
  }
}
</script>

<style scoped>
.glass-card {
  background: rgba(26, 26, 46, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgb(var(--v-theme-on-surface));
}
</style>
