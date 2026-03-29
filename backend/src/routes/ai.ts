import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import {
    chatCompletionSchema,
    getConversationsSchema,
    createConversationSchema,
    getConversationMessagesSchema,
    chatInConversationSchema
} from '../schemas/ai.schemas';
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
    // Standard prompt-based chat (one-off)
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
                const selectedModel = model || userSettings.model || 'gpt-5.2';
                const selectedTemp = temperature ?? userSettings.temperature ?? 0.7;

                const openai = new OpenAI({
                    apiKey: user.openaiApiKey,
                });

                if (selectedModel === 'gpt-5.2') {
                    const systemMessage = messages.find(m => m.role === 'system');
                    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');

                    const instructions = systemMessage ? systemMessage.content : 'You are a helpful assistant.';
                    const input = lastUserMessage ? lastUserMessage.content : '';

                    const response = await (openai as any).responses.create({
                        model: selectedModel,
                        instructions,
                        input,
                    });

                    return {
                        id: 'resp_' + Date.now(),
                        content: response.output_text,
                        role: 'assistant',
                        model: selectedModel,
                        usage: {
                            prompt_tokens: 0,
                            completion_tokens: 0,
                            total_tokens: 0
                        },
                    };
                } else {
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

    // List conversations
    fastify.get<{ Querystring: { libraryId: number } }>(
        '/conversations',
        {
            schema: getConversationsSchema,
            preHandler: authenticateToken,
        },
        async (request, reply) => {
            if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

            const conversations = await prisma.aiConversation.findMany({
                where: {
                    userId: request.user.userId,
                    libraryId: Number(request.query.libraryId),
                },
                orderBy: { updatedAt: 'desc' },
                select: { id: true, title: true, updatedAt: true },
            });

            return conversations;
        }
    );

    // Create conversation
    fastify.post<{ Body: { libraryId: number; title: string } }>(
        '/conversations',
        {
            schema: createConversationSchema,
            preHandler: authenticateToken,
        },
        async (request, reply) => {
            if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

            const conversation = await prisma.aiConversation.create({
                data: {
                    userId: request.user.userId,
                    libraryId: Number(request.body.libraryId),
                    title: request.body.title || 'New Conversation',
                },
            });

            reply.code(201);
            return conversation;
        }
    );

    // Get messages for a conversation
    fastify.get<{ Params: { id: string } }>(
        '/conversations/:id/messages',
        {
            schema: getConversationMessagesSchema,
            preHandler: authenticateToken,
        },
        async (request, reply) => {
            if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

            const messages = await prisma.aiMessage.findMany({
                where: { conversationId: request.params.id },
                orderBy: { createdAt: 'asc' },
            });

            return messages;
        }
    );

    // Context-aware chat in conversation
    fastify.post<{ Params: { id: string }; Body: { content: string; contextItems?: any[]; model?: string } }>(
        '/conversations/:id/chat',
        {
            schema: chatInConversationSchema,
            preHandler: authenticateToken,
        },
        async (request, reply) => {
            try {
                if (!request.user) return reply.code(401).send({ error: 'Unauthorized' });

                const conversationId = request.params.id;
                const { content, contextItems, model } = request.body;

                // 1. Fetch user settings and API key
                const user = await prisma.user.findUnique({
                    where: { id: request.user.userId },
                    select: { openaiApiKey: true, aiSettings: true },
                });

                if (!user?.openaiApiKey) {
                    return reply.code(402).send({ error: 'OpenAI API Key not configured' });
                }

                const userSettings = user.aiSettings as Record<string, any> || {};
                const selectedModel = model || userSettings.model || 'gpt-5.2';

                // 2. Fetch conversation history
                const history = await prisma.aiMessage.findMany({
                    where: { conversationId },
                    orderBy: { createdAt: 'desc' },
                    take: 10, // Just the last 10 messages for context
                });

                // 3. Format messages for AI
                const basePrompt = `You are a helpful Dungeon Master assistant for the "Wildraft" RPG platform. 
Your primary goal is to assist the DM by providing information from the "Wildraft" library and help with creative tasks.

IMPORT RULES:
If the user asks you to create or suggest a character, item, stat block, or note, you should provide a JSON block with the language tag "json:wildraft-item".
The format MUST be:
\`\`\`json:wildraft-item
{
  "type": "CHARACTER_DND_5E" | "STAT_BLOCK_DND_5E" | "ITEM_DND_5E" | "NOTE",
  "name": "Name of the item",
  "description": "Short summary",
  "data": { ... appropriate fields for the type ... }
}
\`\`\`

SCHEMA DETAILS:
- NOTE: data should contain "content" (string with markdown/HTML allowed).
- STAT_BLOCK_DND_5E: data should be FLAT (no nested "stats" object). Required: "cr" (string, e.g. "1", "1/4"), "hp" (number), "ac" (number), "speed" (string, e.g. "30 ft."). Optional: str, dex, con, int, wis, cha (all numbers), "traits" (array of {name, description}), "actions" (array of {name, description, roll?, range?}), "legendaryActions" (array of {name, description}), "spells" (array of {name, level: number, school?, castingTime?, range?, components?, duration?, description}), "spellSlots" (array of {level: number, max: number, remaining: number}).
- ITEM_DND_5E: data should contain "rarity" (common, uncommon, rare, very rare, legendary, artifact), "itemType" (string, e.g. "Weapon", "Wondrous Item"), "attunement" (boolean), "description" (string), "weight" (number), "value" (string), "actions" (array of actions granted by the item).
- CHARACTER_DND_5E: data should contain "level" (number), "class" (string), "race" (string), "ac" (number). Optional: "subclass", "background", "str", "dex", "con", "int", "wis", "cha", "hp", "maxHp", "speed" (as above). Arrays for "equipment", "spells", and "features" MUST be arrays of objects: { "name": string, "description": string }. Spells MUST also include "level" (number, 0-9). Include "spellSlots" (array of {level: number, max: number, remaining: number}) if they have spellcasting.

COMMAND SHORTCUTS:
Users might use shortcuts to create items. Respond by generating the requested JSON.
- "/create character [name] [level] [class] [subclass?] [race] [background]": Create a D&D 5E character using these specific details.
- "/create monster [details]": Create a D&D 5E stat block.
- "/create item [details]": Create a D&D 5E magic item.

Ensure the JSON is valid and fits the expected schema for that type.
When providing such an item, briefly explain what it is before or after the code block.
IMPORTANT: Spells must NOT be simple strings. They must be objects with name, level, and description.

CRITICAL: When items are provided in the context below, treat them as the absolute truth for the current game state. Use them to answer questions about stats, descriptions, note contents, or any other relevant details.`;

                // 3.1 Consolidate current context items into instructions
                let contextInstructions = basePrompt;
                if (contextItems && contextItems.length > 0) {
                    contextInstructions += '\n\n--- CURRENTLY ATTACHED CONTEXT ITEMS ---\n';
                    contextInstructions += 'The following items are explicitly referenced by the user in this specific message:\n';
                    contextItems.forEach(item => {
                        contextInstructions += `[${item.type}] NAME: ${item.name}\nDATA: ${JSON.stringify(item.data || '')}\n\n`;
                    });
                    contextInstructions += '-------------------------------------------';
                }

                const messages: ChatMessage[] = [
                    { role: 'system', content: contextInstructions },
                ];

                // 3.2 Add history with historical context items injected into the content
                messages.push(...history.reverse().map(m => {
                    let content = m.content;
                    const historicalContext = m.contextItems as any[];

                    if (historicalContext && Array.isArray(historicalContext) && historicalContext.length > 0) {
                        let contextSummary = '\n\n(Context provided in this turn: ';
                        contextSummary += historicalContext.map(c => `[${c.type}] ${c.name}`).join(', ');
                        contextSummary += ')';
                        content += contextSummary;
                    }

                    return { role: m.role as any, content };
                }));

                messages.push({ role: 'user', content });

                // 4. Call OpenAI
                const openai = new OpenAI({ apiKey: user.openaiApiKey });
                let aiResponseContent = '';

                if (selectedModel === 'gpt-5.2') {
                    // GPT-5.2 specialized API often expects consolidated instructions
                    // We need to include the history in the input for this specific model
                    const consolidatedInput = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n') + `\nUSER: ${content}`;

                    const response = await (openai as any).responses.create({
                        model: selectedModel,
                        instructions: contextInstructions,
                        input: consolidatedInput,
                    });
                    aiResponseContent = response.output_text;
                } else {
                    const completion = await openai.chat.completions.create({
                        messages,
                        model: selectedModel,
                    });
                    aiResponseContent = completion.choices[0].message.content || '';
                }

                // 5. Store messages in database
                await prisma.aiMessage.create({
                    data: {
                        role: 'user',
                        content,
                        contextItems: contextItems || ({} as any),
                        conversationId,
                    },
                });

                const aiMessage = await prisma.aiMessage.create({
                    data: {
                        role: 'assistant',
                        content: aiResponseContent,
                        conversationId,
                    },
                });

                // Update conversation's updatedAt
                await prisma.aiConversation.update({
                    where: { id: conversationId },
                    data: { updatedAt: new Date() },
                });

                return aiMessage;

            } catch (error: any) {
                console.error('AI Conversation Chat Error:', error);
                return reply.code(500).send({ error: 'AI Request Failed', message: error.message });
            }
        }
    );
};
