import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { aiApi, type AiConversation, type AiMessage } from '@/api/ai'
import { useToast } from 'vue-toastification'

export const useAiStore = defineStore('ai', () => {
    const toast = useToast()

    const conversations = ref<AiConversation[]>([])
    const activeConversationId = ref<string | null>(null)
    const messages = ref<AiMessage[]>([])
    const isLoadingConversations = ref(false)
    const isLoadingMessages = ref(false)
    const isSendingMessage = ref(false)

    const activeConversation = computed(() =>
        conversations.value.find(c => c.id === activeConversationId.value) || null
    )

    async function fetchConversations(libraryId: number) {
        isLoadingConversations.value = true
        try {
            conversations.value = await aiApi.getConversations(libraryId)
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
            toast.error('Failed to load AI conversations')
        } finally {
            isLoadingConversations.value = false
        }
    }

    async function selectConversation(id: string) {
        activeConversationId.value = id
        isLoadingMessages.value = true
        try {
            messages.value = await aiApi.getConversationMessages(id)
        } catch (error) {
            console.error('Failed to fetch messages:', error)
            toast.error('Failed to load message history')
        } finally {
            isLoadingMessages.value = false
        }
    }

    async function createNewConversation(libraryId: number, title: string = 'New Conversation') {
        try {
            const newConv = await aiApi.createConversation(libraryId, title)
            conversations.value.unshift(newConv)
            await selectConversation(newConv.id)
            return newConv
        } catch (error) {
            console.error('Failed to create conversation:', error)
            toast.error('Failed to create new conversation')
            return null
        }
    }

    async function sendMessage(content: string, contextItems: any[] = [], libraryId: number) {
        if (!activeConversationId.value) {
            const newConv = await createNewConversation(libraryId, content.substring(0, 30) + (content.length > 30 ? '...' : ''))
            if (!newConv) return
        }

        const currentConvId = activeConversationId.value!
        isSendingMessage.value = true

        // Optimistic UI update for user message
        const tempUserMsg: AiMessage = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content,
            contextItems,
            createdAt: new Date().toISOString()
        }
        messages.value.push(tempUserMsg)

        try {
            const aiMsg = await aiApi.chatInConversation(currentConvId, content, contextItems)
            // Replace temp message with real one if needed, or just append AI response
            // Actually, the API returns the user message storage in the background, 
            // but we only get the assistant response back.
            // Let's just keep the optimistic message and append the AI response.
            messages.value.push(aiMsg)

            // Update conversation updatedAt in list
            const conv = conversations.value.find(c => c.id === currentConvId)
            if (conv) {
                conv.updatedAt = new Date().toISOString()
                // Move to top
                conversations.value = [
                    conv,
                    ...conversations.value.filter(c => c.id !== currentConvId)
                ]
            }
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('AI failed to respond')
            // Remove the optimistic message on error
            messages.value = messages.value.filter(m => m.id !== tempUserMsg.id)
        } finally {
            isSendingMessage.value = false
        }
    }

    function clearActiveConversation() {
        activeConversationId.value = null
        messages.value = []
    }

    return {
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        isSendingMessage,
        fetchConversations,
        selectConversation,
        createNewConversation,
        sendMessage,
        clearActiveConversation
    }
})
