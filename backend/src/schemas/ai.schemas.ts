export const chatCompletionSchema = {
    tags: ['ai'],
    summary: 'AI Chat Completion',
    description: 'Generate a response using the configured AI model (e.g. ChatGPT). Uses the user\'s stored API key.',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        required: ['messages'],
        properties: {
            messages: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['role', 'content'],
                    properties: {
                        role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                        content: { type: 'string' },
                    },
                },
            },
            model: { type: 'string', description: 'Model to use (overrides user settings)' },
            temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
            maxTokens: { type: 'number', minimum: 1 },
        },
    },
    response: {
        200: {
            description: 'AI Response',
            type: 'object',
            properties: {
                id: { type: 'string' },
                content: { type: 'string' },
                role: { type: 'string' },
                model: { type: 'string' },
                usage: {
                    type: 'object',
                    properties: {
                        prompt_tokens: { type: 'number' },
                        completion_tokens: { type: 'number' },
                        total_tokens: { type: 'number' },
                    },
                },
            },
        },
        400: {
            type: 'object',
            properties: { error: { type: 'string' } },
        },
        401: {
            type: 'object',
            properties: { error: { type: 'string' } },
        },
        402: {
            type: 'object',
            properties: { error: { type: 'string' }, details: { type: 'string' } }, // Payment required / Missing API Key
        },
        500: {
            type: 'object',
            properties: { error: { type: 'string' }, message: { type: 'string' } },
        },
    },
};
