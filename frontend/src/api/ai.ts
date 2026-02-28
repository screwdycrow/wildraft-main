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
}
