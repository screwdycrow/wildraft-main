import apiClient from './axios'

export interface GenerateJsonRequest {
    systemPrompt: string
    userPrompt: string
    model?: string
    temperature?: number
}

export interface ChatCompletionResponse {
    id: string
    content: string
    role: string
    model: string
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

export interface AiConversation {
    id: string
    title: string | null
    updatedAt: string
}

export interface AiMessage {
    id: string
    role: 'system' | 'user' | 'assistant'
    content: string
    contextItems: any | null
    createdAt: string
}

export const aiApi = {
    async generateJson(params: GenerateJsonRequest): Promise<ChatCompletionResponse> {
        const response = await apiClient.post<ChatCompletionResponse>('/ai/chat/completions', {
            messages: [
                { role: 'system', content: params.systemPrompt },
                { role: 'user', content: params.userPrompt }
            ],
            model: params.model,
            temperature: params.temperature,
        })
        return response.data
    },

    async getConversations(libraryId: number): Promise<AiConversation[]> {
        const response = await apiClient.get<AiConversation[]>('/ai/conversations', {
            params: { libraryId }
        })
        return response.data
    },

    async createConversation(libraryId: number, title: string): Promise<AiConversation> {
        const response = await apiClient.post<AiConversation>('/ai/conversations', {
            libraryId,
            title
        })
        return response.data
    },

    async getConversationMessages(id: string): Promise<AiMessage[]> {
        const response = await apiClient.get<AiMessage[]>(`/ai/conversations/${id}/messages`)
        return response.data
    },

    async chatInConversation(id: string, content: string, contextItems?: any[], model?: string): Promise<AiMessage> {
        const response = await apiClient.post<AiMessage>(`/ai/conversations/${id}/chat`, {
            content,
            contextItems,
            model
        })
        return response.data
    }
}
