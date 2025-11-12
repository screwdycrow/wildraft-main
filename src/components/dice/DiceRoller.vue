<template>
  <div class="dice-roller">
    <!-- Dice Roller Button/Input -->
    <v-menu
      v-model="showMenu"
      :close-on-content-click="false"
      location="bottom"
      max-width="450"
      offset="8"
    >
      <template #activator="{ props }">
        <v-text-field
          v-model="inputText"
          v-bind="props"
          placeholder="Roll dice (e.g., 2d20 1d6+3)"
          prepend-inner-icon="mdi-dice-multiple"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="dice-input"
          @keydown.enter="handleRoll"
          @focus="showMenu = true"
        >
          <template #append-inner>
            <v-btn
              icon="mdi-send"
              size="x-small"
              variant="text"
              color="primary"
              :loading="isRolling"
              @click="handleRoll"
            />
          </template>
        </v-text-field>
      </template>

      <!-- Dropdown Chat -->
      <v-card class="dice-chat-card glass-card" elevation="8">
        <v-card-title class="d-flex align-center py-2 px-3">
          <v-icon icon="mdi-dice-6" color="primary" class="mr-2" size="small" />
          <span class="text-subtitle-1">Dice Rolls</span>
          <v-spacer />
          <v-btn
            icon="mdi-cog"
            size="x-small"
            variant="text"
            @click="showSettings = true"
          />
          <v-btn
            icon="mdi-delete-sweep"
            size="x-small"
            variant="text"
            @click="handleClearChat"
          >
            <v-icon />
            <v-tooltip activator="parent" location="bottom">Clear Chat</v-tooltip>
          </v-btn>
        </v-card-title>

        <v-divider />

        <!-- Quick Roll Buttons -->
        <div class="quick-rolls pa-2">
          <v-chip
            v-for="quickRoll in quickRolls"
            :key="quickRoll"
            size="small"
            variant="tonal"
            color="primary"
            class="mr-1 mb-1"
            @click="rollQuick(quickRoll)"
          >
            {{ quickRoll }}
          </v-chip>
        </div>

        <v-divider />

        <!-- Chat Messages -->
        <v-card-text class="chat-messages pa-0">
          <v-list
            v-if="visibleMessages.length > 0"
            density="compact"
            class="pa-0"
          >
            <v-list-item
              v-for="message in visibleMessages"
              :key="message.id"
              class="chat-message"
            >
              <div class="message-content">
                <div class="message-header">
                  <span class="username">{{ message.username }}</span>
                  <span class="timestamp">{{ formatTime(message.datetime) }}</span>
                </div>
                <div class="message-text" v-html="formatMessage(message.message)" />
              </div>
            </v-list-item>
          </v-list>

          <div v-else class="empty-state pa-4 text-center">
            <v-icon icon="mdi-dice-multiple-outline" size="48" color="grey" />
            <p class="text-caption text-grey mt-2">No dice rolls yet</p>
            <p class="text-caption text-grey">Try rolling: 2d20, 1d6+3, or d20</p>
          </div>
        </v-card-text>

        <!-- Input Area -->
        <v-divider />
        <div class="chat-input pa-2">
          <v-text-field
            v-model="inputText"
            placeholder="Type dice notation (e.g., 2d20 1d6+3)"
            variant="outlined"
            density="compact"
            hide-details
            @keydown.enter="handleRoll"
          >
            <template #prepend-inner>
              <v-icon icon="mdi-dice-multiple" size="small" />
            </template>
            <template #append-inner>
              <v-btn
                icon="mdi-send"
                size="x-small"
                variant="text"
                color="primary"
                :loading="isRolling"
                @click="handleRoll"
              />
            </template>
          </v-text-field>
        </div>
      </v-card>
    </v-menu>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-cog" color="primary" class="mr-2" />
          Dice Roller Settings
        </v-card-title>

        <v-card-text>
          <v-switch
            v-model="diceStore.enable3dDice"
            label="Enable 3D Dice Animation"
            color="primary"
            hide-details
            class="mb-4"
          />

          <v-text-field
            v-model="diceStore.currentUsername"
            label="Username"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showSettings = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDiceRollerStore } from '@/stores/diceRoller'
import { useToast } from 'vue-toastification'

const diceStore = useDiceRollerStore()
const toast = useToast()

const inputText = ref('')
const showMenu = ref(false)
const showSettings = ref(false)
const isRolling = ref(false)

const quickRolls = ['d20', '2d20', '1d6', '2d6', '1d8', '1d10', '1d12', '1d4']

// Get visible messages from chat
const visibleMessages = computed(() => {
  return diceStore.chat.getVisibleMessages(diceStore.currentUsername).value
})

/**
 * Handle roll from input
 */
async function handleRoll() {
  if (!inputText.value.trim()) {
    return
  }

  isRolling.value = true

  try {
    const results = await diceStore.rollFromText(inputText.value)
    
    if (results && results.length > 0) {
      // Show menu to display results
      showMenu.value = true
      // Clear input after successful roll
      inputText.value = ''
    } else {
      toast.warning('No valid dice rolls found. Try: 2d20, 1d6+3, or d20')
    }
  } catch (error) {
    console.error('Failed to roll dice:', error)
    toast.error('Failed to roll dice')
  } finally {
    isRolling.value = false
  }
}

/**
 * Quick roll from chip
 */
async function rollQuick(notation: string) {
  isRolling.value = true

  try {
    await diceStore.quickRoll(notation)
    showMenu.value = true
  } catch (error) {
    console.error('Failed to roll dice:', error)
    toast.error('Failed to roll dice')
  } finally {
    isRolling.value = false
  }
}

/**
 * Clear chat history
 */
function handleClearChat() {
  diceStore.chat.clearMessages()
  diceStore.clearHistory()
  toast.success('Chat cleared')
}

/**
 * Format message with markdown-like syntax
 */
function formatMessage(message: string): string {
  // Bold text between **
  let formatted = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Dice emoji
  formatted = formatted.replace(/🎲/g, '<span class="dice-emoji">🎲</span>')
  return formatted
}

/**
 * Format timestamp
 */
function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<style scoped>
.dice-roller {
  min-width: 250px;
  max-width: 300px;
}

.dice-input {
  max-width: 300px;
}

.dice-chat-card {
  overflow: hidden;
}

.quick-rolls {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 80px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.chat-messages {
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.chat-message {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 12px !important;
}

.message-content {
  width: 100%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-weight: 600;
  font-size: 0.8rem;
  color: rgb(var(--v-theme-primary));
}

.timestamp {
  font-size: 0.7rem;
  opacity: 0.6;
}

.message-text {
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-text :deep(strong) {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.dice-emoji {
  font-size: 1.1em;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chat-input {
  background: rgba(var(--v-theme-surface), 0.5);
}

/* Theme the input */
:deep(.v-field) {
  font-size: 0.9rem;
}

:deep(.v-field__input) {
  min-height: 36px;
}
</style>

