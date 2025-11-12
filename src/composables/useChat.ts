import { ref, computed } from 'vue'
import type { Message, ChatStorage } from '@/types/chat.types'

const STORAGE_KEY = 'dice-roller-chat'
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function useChat() {
  const messages = ref<Message[]>([])

  // Load messages from localStorage
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: ChatStorage = JSON.parse(stored)
        
        // Clean up messages older than a week
        const oneWeekAgo = Date.now() - ONE_WEEK_MS
        messages.value = data.messages
          .filter(msg => new Date(msg.datetime).getTime() > oneWeekAgo)
          .map(msg => ({
            ...msg,
            datetime: new Date(msg.datetime) // Convert back to Date object
          }))
          .sort((a, b) => b.datetime.getTime() - a.datetime.getTime()) // Newest first
      }
    } catch (error) {
      console.error('Failed to load chat from localStorage:', error)
      messages.value = []
    }
  }

  // Save messages to localStorage
  function saveToLocalStorage() {
    try {
      const oneWeekAgo = Date.now() - ONE_WEEK_MS
      const messagesToSave = messages.value.filter(
        msg => msg.datetime.getTime() > oneWeekAgo
      )

      const data: ChatStorage = {
        messages: messagesToSave,
        lastCleanup: Date.now()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save chat to localStorage:', error)
    }
  }

  // Add a new message
  function addMessage(message: Omit<Message, 'id' | 'datetime'>) {
    const newMessage: Message = {
      ...message,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      datetime: new Date()
    }

    messages.value.unshift(newMessage) // Add to beginning (newest first)
    saveToLocalStorage()
    
    return newMessage
  }

  // Delete a message
  function deleteMessage(messageId: string) {
    const index = messages.value.findIndex(msg => msg.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
      saveToLocalStorage()
    }
  }

  // Clear all messages
  function clearMessages() {
    messages.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  // Get visible messages (filtering private messages)
  function getVisibleMessages(currentUsername: string) {
    return computed(() => 
      messages.value.filter(msg => {
        // Show all messages that are not private
        if (!msg.hideToOthers && !msg.showOnlyToRecipient) {
          return true
        }
        
        // Show private messages to sender
        if (msg.username === currentUsername) {
          return true
        }
        
        // Show messages specifically for this user
        if (msg.showOnlyToRecipient === currentUsername) {
          return true
        }
        
        return false
      })
    )
  }

  // Initialize by loading from storage
  loadFromLocalStorage()

  return {
    messages: computed(() => messages.value),
    addMessage,
    deleteMessage,
    clearMessages,
    getVisibleMessages,
    saveToLocalStorage,
    loadFromLocalStorage
  }
}

