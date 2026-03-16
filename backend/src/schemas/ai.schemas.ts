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

export const getConversationsSchema = {
    tags: ['ai'],
    summary: 'Get AI Conversations',
    description: 'Fetch all AI conversations for a specific library.',
    security: [{ bearerAuth: [] }],
    querystring: {
        type: 'object',
        required: ['libraryId'],
        properties: {
            libraryId: { type: 'number' },
        },
    },
    response: {
        200: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string', nullable: true },
                    updatedAt: { type: 'string' },
                },
            },
        },
    },
};

export const createConversationSchema = {
    tags: ['ai'],
    summary: 'Create AI Conversation',
    description: 'Start a new AI conversation for a library.',
    security: [{ bearerAuth: [] }],
    body: {
        type: 'object',
        required: ['libraryId'],
        properties: {
            libraryId: { type: 'number' },
            title: { type: 'string' },
        },
    },
    response: {
        201: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                title: { type: 'string', nullable: true },
            },
        },
    },
};

export const getConversationMessagesSchema = {
    tags: ['ai'],
    summary: 'Get Conversation Messages',
    description: 'Fetch the full message history of an AI conversation.',
    security: [{ bearerAuth: [] }],
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' },
        },
    },
    response: {
        200: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    role: { type: 'string' },
                    content: { type: 'string' },
                    contextItems: { type: 'object', nullable: true },
                    createdAt: { type: 'string' },
                },
            },
        },
    },
};

export const chatInConversationSchema = {
    tags: ['ai'],
    summary: 'Chat in Conversation',
    description: 'Post a new message to an existing AI conversation and get a response.',
    security: [{ bearerAuth: [] }],
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' },
        },
    },
    body: {
        type: 'object',
        required: ['content'],
        properties: {
            content: { type: 'string' },
            contextItems: { type: 'array', items: { type: 'object' } },
            model: { type: 'string' },
        },
    },
    response: {
        200: {
            description: 'AI Response',
            type: 'object',
            properties: {
                id: { type: 'string' },
                role: { type: 'string' },
                content: { type: 'string' },
                contextItems: { type: 'object', nullable: true },
            },
        },
    },
};
