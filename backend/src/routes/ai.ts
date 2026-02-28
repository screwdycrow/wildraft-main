import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { chatCompletionSchema } from '../schemas/ai.schemas';
import OpenAI from 'openai';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface AIChatBody {
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export const aiRoutes = async (fastify: FastifyInstance) => {
    fastify.post<{ Body: AIChatBody }>(
        '/chat/completions',
        {
            schema: chatCompletionSchema,
            preHandler: authenticateToken,
        },
        async (request, reply) => {
            try {
                if (!request.user) {
                    reply.code(401);
                    return { error: 'Unauthorized' };
                }

                // Fetch user's API settings
                const user = await prisma.user.findUnique({
                    where: { id: request.user.userId },
                    select: {
                        openaiApiKey: true,
                        aiSettings: true,
                    },
                });

                if (!user || !user.openaiApiKey) {
                    reply.code(402);
                    return {
                        error: 'OpenAI API Key not configured',
                        details: 'Please add your OpenAI API Key in User Settings to use AI features.'
                    };
                }

                const { messages, model, temperature, maxTokens } = request.body;

                const userSettings = user.aiSettings as Record<string, any> || {};
                const selectedModel = model || userSettings.model || 'gpt-5.2'; // Default to new model
                const selectedTemp = temperature ?? userSettings.temperature ?? 0.7;

                // Initialize OpenAI client
                const openai = new OpenAI({
                    apiKey: user.openaiApiKey,
                });

                // Check if using new Responses API (e.g. gpt-5.2)
                if (selectedModel === 'gpt-5.2') {
                    // Extract system instruction and user input from messages
                    const systemMessage = messages.find(m => m.role === 'system');
                    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');

                    const instructions = systemMessage ? systemMessage.content : 'You are a helpful assistant.';
                    const input = lastUserMessage ? lastUserMessage.content : '';

                    // Use the new responses.create API
                    // Casting to any because types might not be updated in the package yet
                    const response = await (openai as any).responses.create({
                        model: selectedModel,
                        instructions,
                        input,
                        // temperature might not be supported or is handled differently, omitting for now based on snippet
                    });

                    return {
                        id: 'resp_' + Date.now(),
                        content: response.output_text,
                        role: 'assistant',
                        model: selectedModel,
                        usage: {
                            prompt_tokens: 0, // Not returned in snippet
                            completion_tokens: 0,
                            total_tokens: 0
                        },
                    };
                } else {
                    // Fallback to standard chat completions for older models
                    const completion = await openai.chat.completions.create({
                        messages,
                        model: selectedModel,
                        temperature: selectedTemp,
                        max_tokens: maxTokens,
                    });

                    const choice = completion.choices[0];
                    return {
                        id: completion.id,
                        content: choice.message.content,
                        role: choice.message.role,
                        model: completion.model,
                        usage: completion.usage,
                    };
                }

            } catch (error: any) {
                console.error('AI Chat Error:', error);

                if (error.status === 401) {
                    reply.code(401);
                    return { error: 'Invalid OpenAI API Key', message: 'The API key provided is invalid or expired.' };
                }

                reply.code(500);
                return {
                    error: 'AI Request Failed',
                    message: error.message || 'Unknown error occurred while communicating with AI service',
                };
            }
        }
    );
};
