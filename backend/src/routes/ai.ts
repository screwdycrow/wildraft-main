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
If the user asks you to:
- "/create monster [details]": Create a D&D 5E stat block.
- "/create item [details]": Create a D&D 5E magic item.
- "/create timer [duration] [name?]": Create a timer widget (e.g. "/create timer 5 minutes").
- "/create counter [name?] [initialValue?]": Create a counter widget.
You should provide a JSON block with the language tag "json:wildraft-item".
The format MUST be:
\`\`\`json:wildraft-item
{
  "type": "CHARACTER_DND_5E" | "STAT_BLOCK_DND_5E" | "ITEM_DND_5E" | "NOTE" | "timer" | "counter",
  "name": "Name of the item",
  "description": "Short summary",
  "data": { ... appropriate fields for the type ... }
}
\`\`\`

DETAILED SCHEMAS & MECHANICAL RULES:

1. NOTE:
- data fields: name (required), content (required, string with markdown/HTML), chapters (optional array of {order, title, content}), isPinned (boolean).

2. timer:
- data fields: title (string), timeLeft (number in seconds), totalTime (number in seconds), preset (string: "generic" | "ritual" | "short-rest" | "long-rest" | "encounter" | "spell-effect"), backgroundColor (hex), backgroundOpacity (0-1), blur (0-20).

3. counter:
- data fields: title (string), value (number), step (number), preset (string: "generic" | "health" | "gold" | "xp" | "spell-slots" | "initiative" | "mana"), backgroundColor (hex), backgroundOpacity (0-1), blur (0-20).

4. STAT_BLOCK_DND_5E (Monsters/NPCs):
- data fields: name (required), cr (required string, e.g. "1/2", "5", "20"), hp (required number), ac (required number), speed (required string), initiative (number).
- Stats: str, dex, con, int, wis, cha (all numbers 1-30).
- Saving Throws: strSavingThrow, dexSavingThrow, etc. (booleans).
- Traits: array of {name, description}.
- Actions: array of {name, actionType ("action", "bonus", "reaction", "legendary"), toHit (e.g. "+5"), dc (e.g. "15 DEX"), roll (e.g. "2d6 fire"), range, description}.
- Spells: array of spell objects (see SPELL OBJECT structure below).
- customCounters: array of {name, value, min, max, icon (mdi-*), color, description}.

3. ITEM_DND_5E (Magic Items):
- data fields: name, rarity (common to artifact), itemType (Weapon, Armor, Shield, Wondrous Item, etc.), attunement (boolean), value, weight, properties (array of strings), effect (description).
- Actions: array of actions granted by the item.
  - IMPORTANT: For weapons, use "useCharacterStats": true, "abilityModifier" ("str" or "dex"), "damageDice", "damageType", "range", and "itemBonus" (e.g. 1 for +1 weapon).
  - For items with fixed effects (wands), use "useCharacterStats": false and provide fixed "toHit", "dc", or "roll".
- Modifiers: object for bonuses applied when equipped (e.g. { "ac": 1 } for +1 armor).

4. CHARACTER_DND_5E:
- data fields: name, level (1-20), class, race, subclass, background, alignment, hp, maxHp, ac, speed, initiative.
- Stats & Saving Throws: Same as Stat Block.
- Skills: array of {name, proficient (boolean), expertise (boolean)}.
- WEAPON ATTACKS vs CHARACTER ACTIONS:
  - CRITICAL: Weapon attacks (Longsword, Bow, etc.) MUST be added as INVENTORY ITEMS with actions, NOT in character "actions".
  - Character "actions"[] should ONLY contain special abilities (e.g. Breath Weapon, Second Wind, Wild Shape).
  - Inventory Items: array of {name, description, quantity, weight, equipped (boolean), actions[], modifiers{}}.
  - Weapons in inventory MUST have "actions"[] with "useCharacterStats": true.
  - Armor/Shields should set "ac" to the BASE AC value of the armor.
- Spells: array of spell objects (see structure below).
- spellSlots: array of {level: number, max: number, remaining: number}.
- customCounters: for tracking Ki, Sorcery Points, etc.

SPELL OBJECT STRUCTURE:
Spells must ALWAYS be objects with:
{
  "name": string,
  "level": number (0 for cantrips),
  "school": string,
  "castingTime": string,
  "range": string,
  "components": string,
  "toHit": string (optional, e.g. "+7"),
  "roll": string (optional, e.g. "3d8 fire" - damage dice + type ONLY),
  "dc": string (optional, e.g. "15 WIS"),
  "duration": string,
  "concentration": boolean,
  "ritual": boolean,
  "description": string (required)
}

COMMAND SHORTCUTS:
Respond to create requests (e.g. "/create character...") by generating the appropriate JSON block.

CRITICAL: Spells must NOT be simple strings. Ensure all mechanical fields are populated so the item is playable.
CRITICAL: When items are provided in the context below, treat them as the absolute truth for the current game state.`;

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
