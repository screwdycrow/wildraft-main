<template>
  <div class="dm-screen-chat d-flex flex-column h-100">
    <!-- Header: Conversations Toggle / Title -->
    <div class="chat-header pa-3 d-flex align-center border-b">
      <v-btn
        size="small"
        variant="text"
        class="mr-2"
        @click="showConversations = !showConversations"
      >
        <v-icon>mdi-history</v-icon>
        <v-tooltip activator="parent" location="bottom">Conversations</v-tooltip>
      </v-btn>
      <div class="text-subtitle-1 font-weight-bold truncate">
        {{ aiStore.activeConversation ? aiStore.activeConversation.title : 'AI Chat' }}
      </div>
      <v-spacer />
      <v-btn
        size="small"
        variant="tonal"
        color="primary"
        @click="startNewConversation"
      >
        <v-icon>mdi-plus</v-icon>
        <v-tooltip activator="parent" location="bottom">New Chat</v-tooltip>
      </v-btn>
    </div>

    <div class="flex-grow-1 overflow-hidden position-relative">
      <!-- Conversation List Overlay -->
      <v-expand-x-transition>
        <div v-if="showConversations" class="conversations-overlay glass-effect border-r">
          <v-list density="compact" class="bg-transparent">
            <v-list-subheader class="text-overline">Recent Chats</v-list-subheader>
            <v-list-item
              v-for="conv in aiStore.conversations"
              :key="conv.id"
              :active="aiStore.activeConversationId === conv.id"
              active-color="primary"
              @click="selectConversation(conv.id)"
            >
              <v-list-item-title class="text-caption">{{ conv.title || 'Untitled' }}</v-list-item-title>
              <v-list-item-subtitle class="text-tiny">{{ formatDate(conv.updatedAt) }}</v-list-item-subtitle>
            </v-list-item>
            <div v-if="aiStore.isLoadingConversations" class="pa-4 text-center">
              <v-progress-circular indeterminate size="20" width="2" />
            </div>
            <div v-else-if="aiStore.conversations.length === 0" class="pa-4 text-center text-caption text-medium-emphasis">
              No history found
            </div>
          </v-list>
        </div>
      </v-expand-x-transition>

      <!-- Message List -->
      <div ref="messageListRef" class="message-list pa-4 h-100 overflow-y-auto" @scroll="handleScroll">
        <div v-if="aiStore.isLoadingMessages" class="h-100 d-flex align-center justify-center">
          <v-progress-circular indeterminate />
        </div>
        <template v-else>
          <div v-if="aiStore.messages.length === 0 && !aiStore.isSendingMessage" class="empty-chat h-100 d-flex flex-column align-center justify-center text-center pa-4">
            <v-icon size="48" class="mb-4 text-primary opacity-50">mdi-robot-outline</v-icon>
            <div class="text-h6 font-weight-light mb-2">How can I help you?</div>
            <div class="text-body-2 text-medium-emphasis">
              Mention items on your screen with <strong>@</strong> to add them to context.
            </div>
          </div>
          <div v-for="msg in aiStore.messages" :key="msg.id" :class="['message-wrapper', msg.role]">
            <div class="message-bubble pa-3 rounded-lg shadow-sm">
              <div class="message-content" v-html="renderMarkdown(msg.content)" />
              
              <!-- Draft Item Cards -->
              <div v-if="getDraftItems(msg.content).length > 0" class="draft-items-list mt-3">
                <AiDraftItemCard 
                  v-for="(draft, idx) in getDraftItems(msg.content)" 
                  :key="idx" 
                  :item="draft" 
                />
              </div>

              <div v-if="msg.contextItems?.length > 0" class="mt-2 pt-2 border-t opacity-70">
                <div class="text-tiny font-weight-bold mb-1">Context:</div>
                <v-chip-group>
                  <v-chip v-for="item in msg.contextItems" :key="item.id" size="x-small" label color="primary" variant="tonal">
                    {{ item.name }}
                  </v-chip>
                </v-chip-group>
              </div>
            </div>
          </div>
          <div v-if="aiStore.isSendingMessage" class="message-wrapper assistant">
            <div class="message-bubble pa-3 rounded-lg assistant-typing shadow-sm">
              <div class="typing-indicator d-flex gap-1">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Input Area -->
    <div class="chat-input-area pa-3 border-t">
      <div v-if="contextItems.length > 0" class="context-chips px-1 mb-2">
        <v-chip
          v-for="item in contextItems"
          :key="item.id"
          size="x-small"
          closable
          label
          color="primary"
          @click:close="removeContext(item.id)"
        >
          {{ item.name }}
        </v-chip>
      </div>
      
      <v-textarea
        v-model="inputContent"
        placeholder="Type a message or @ to mention..."
        auto-grow
        rows="1"
        max-rows="5"
        density="compact"
        variant="outlined"
        hide-details
        class="chat-input"
        @keydown="handleKeyDown"
        @input="handleInput"
      >
        <template #prepend-inner>
          <v-menu
            v-model="showCommandMenu"
            offset="10"
            :open-on-click="false"
            :open-on-focus="false"
            :open-on-hover="false"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="x-small"
                variant="text"
                color="primary"
                icon="mdi-slash-forward"
              />
            </template>
            <v-list density="compact" class="command-menu">
              <v-list-subheader class="text-overline">Create Commands</v-list-subheader>
              <v-list-item
                v-for="(cmd, idx) in creationCommands"
                :key="cmd.id"
                :active="idx === focusedCommandIndex"
                :class="{ 'focused-item': idx === focusedCommandIndex }"
                @click="openCommandBuilder(cmd.id)"
              >
                <template #prepend><v-icon size="small">{{ cmd.icon }}</v-icon></template>
                <v-list-item-title>{{ cmd.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-tiny">{{ cmd.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
        <template #append-inner>
          <v-btn
            size="x-small"
            variant="text"
            color="primary"
            :loading="aiStore.isSendingMessage"
            :disabled="!inputContent.trim() && contextItems.length === 0"
            @click="onSendMessage"
          >
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </template>
      </v-textarea>

      <!-- Command Builder Overlay -->
      <v-expand-transition>
        <div v-if="activeCommandBuilder" class="command-builder-pane mt-2 pa-3 rounded-lg border">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-caption font-weight-bold d-flex align-center">
              <v-icon size="small" class="mr-1" color="primary">
                {{ activeCommandBuilder === 'character' ? 'mdi-account-plus' : activeCommandBuilder === 'monster' ? 'mdi-ghost' : 'mdi-treasure-chest' }}
              </v-icon>
              Create {{ activeCommandBuilder === 'character' ? 'Character' : activeCommandBuilder === 'monster' ? 'Monster' : 'Item' }}
            </div>
            <v-btn icon="mdi-close" size="x-small" variant="text" @click="activeCommandBuilder = null" />
          </div>

          <!-- Character Form -->
          <div v-if="activeCommandBuilder === 'character'" class="command-form">
            <v-row density="compact">
              <v-col cols="8"><v-text-field ref="nameInput" v-model="commandData.name" label="Character Name" placeholder="e.g. Valerius the Bold" density="compact" hide-details /></v-col>
              <v-col cols="4"><v-text-field v-model="commandData.level" label="Level" type="number" density="compact" hide-details /></v-col>
              <v-col cols="6"><v-text-field v-model="commandData.class" label="Class" placeholder="e.g. Paladin" density="compact" hide-details /></v-col>
              <v-col cols="6"><v-text-field v-model="commandData.subclass" label="Subclass" placeholder="e.g. Oath of Ancients" density="compact" hide-details /></v-col>
              <v-col cols="6"><v-text-field v-model="commandData.race" label="Race" placeholder="e.g. Dragonborn" density="compact" hide-details /></v-col>
              <v-col cols="6"><v-text-field v-model="commandData.background" label="Background" placeholder="e.g. Noble" density="compact" hide-details /></v-col>
            </v-row>
          </div>

          <!-- Monster/Item Form -->
          <div v-else class="command-form">
            <v-textarea
              ref="detailsInput"
              v-model="commandData.details"
              :label="activeCommandBuilder === 'monster' ? 'Monster/NPC Details' : 'Magic Item Details'"
              :placeholder="activeCommandBuilder === 'monster' ? 'Role, CR, Theme (e.g. CR 5 Boss, Undead, Necromantic spikes)' : 'Rarity, Type, Effect (e.g. Rare, Sword, Deals extra cold damage)'"
              density="compact"
              rows="2"
              hide-details
              class="mb-2"
            />
          </div>

          <div class="d-flex align-center gap-2 mt-2 px-1">
            <v-icon size="small" color="primary">mdi-layers-triple</v-icon>
            <span class="text-caption">Variations:</span>
            <v-btn-toggle v-model="commandData.variations" mandatory density="compact" color="primary" variant="tonal">
              <v-btn :value="1" size="x-small">1</v-btn>
              <v-btn :value="2" size="x-small">2</v-btn>
              <v-btn :value="3" size="x-small">3</v-btn>
              <v-btn :value="5" size="x-small">5</v-btn>
            </v-btn-toggle>
          </div>

          <v-btn
            block
            color="primary"
            size="small"
            class="mt-3"
            :disabled="!isCommandFormValid"
            @click="submitCommand"
          >
            Create with AI
          </v-btn>
        </div>
      </v-expand-transition>

      <!-- Mention Dropdown -->
      <v-menu
        v-model="showMentionMenu"
        max-height="300"
        offset="10"
        :close-on-content-click="false"
        :open-on-click="false"
        :open-on-focus="false"
        :open-on-hover="false"
        no-click-animation
        attach=".chat-input-area"
        location="top start"
      >
        <v-list density="compact" min-width="200" class="mention-list shadow-lg rounded-lg">
          <v-list-subheader class="text-overline">Mention Screen Items</v-list-subheader>
          <v-list-item
            v-for="(item, idx) in mentionItems"
            :key="item.id"
            :active="idx === focusedMentionIndex"
            :class="{ 'focused-item': idx === focusedMentionIndex }"
            @click="addMention(item)"
          >
            <template #prepend>
              <v-icon size="small" class="mr-2">{{ getItemIcon(item) }}</v-icon>
            </template>
            <v-list-item-title class="text-caption font-weight-bold">{{ item.name }}</v-list-item-title>
            <v-list-item-subtitle class="text-tiny">{{ item.category }}</v-list-item-subtitle>
          </v-list-item>
          <div v-if="mentionItems.length === 0" class="pa-4 text-center text-caption text-medium-emphasis">
            No items found
          </div>
        </v-list>
      </v-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAiStore } from '@/stores/ai'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useLibraryStore } from '@/stores/library'
import { useItemsStore } from '@/stores/items'
import { formatDistanceToNow } from 'date-fns'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import AiDraftItemCard from './AiDraftItemCard.vue'

const aiStore = useAiStore()
const dmScreensStore = useDmScreensStore()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()

const inputContent = ref('')
const showConversations = ref(false)
const messageListRef = ref<HTMLElement | null>(null)
const contextItems = ref<any[]>([])

// Input Refs
const nameInput = ref<any>(null)
const detailsInput = ref<any>(null)

// Command Builder logic
const showCommandMenu = ref(false)
const focusedCommandIndex = ref(0)
const activeCommandBuilder = ref<'character' | 'monster' | 'item' | null>(null)

const creationCommands = [
  { id: 'character', title: 'Character', icon: 'mdi-account-plus', description: '/create character [name] [lvl] [class]...' },
  { id: 'monster', title: 'Monster / NPC', icon: 'mdi-ghost', description: '/create monster [details]' },
  { id: 'item', title: 'Magic Item', icon: 'mdi-treasure-chest', description: '/create item [details]' }
] as const
const commandData = ref({
  name: '',
  level: '1',
  class: '',
  subclass: '',
  race: '',
  background: '',
  details: '',
  variations: 1 as number
})

const isCommandFormValid = computed(() => {
  if (activeCommandBuilder.value === 'character') {
    return commandData.value.name && commandData.value.class && commandData.value.race
  }
  return commandData.value.details.trim().length > 0
})

// Mention logic
const showMentionMenu = ref(false)
const mentionSearch = ref('')
const focusedMentionIndex = ref(0)

const libraryId = computed(() => libraryStore.currentLibrary?.id)

// Flatten items from active DM screen and library for mentions
const mentionItems = computed(() => {
  const search = mentionSearch.value.toLowerCase()
  const items: any[] = []
  const addedIds = new Set<number>()

  // 1. DM Screen Items (Priority)
  if (dmScreensStore.currentDmScreen?.items) {
    dmScreensStore.currentDmScreen.items.forEach(item => {
      if (contextItems.value.some(c => c.id === item.id)) return
      
      let name = ''
      let category = ''
      let data = null

      if (item.type === 'LibraryItemId' && item.data?.id) {
        const libItem = itemsStore.getItemById(item.data.id)
        if (libItem) {
          name = libItem.name
          category = 'Library Item'
          data = libItem.data
          addedIds.add(libItem.id)
        } else {
          name = 'Library Item #' + item.data.id
          category = 'Library Item'
        }
      } else if (item.type === 'TextNode' || item.type === 'quickNote') {
        name = item.data?.title || (item.type === 'TextNode' ? 'Text Note' : 'Quick Note')
        category = 'Note'
        data = item.data?.text || item.data?.content
      } else {
        return 
      }

      if (name.toLowerCase().includes(search)) {
        items.push({ id: item.id, name, category, data, type: item.type })
      }
    })
  }

  // 2. All Library Items (Searchable)
  itemsStore.items.forEach(libItem => {
    if (addedIds.has(libItem.id)) return
    if (libItem.name.toLowerCase().includes(search)) {
      items.push({
        id: `lib-${libItem.id}`,
        name: libItem.name,
        category: 'Library Item',
        data: libItem.data,
        type: 'LibraryItemId'
      })
    }
  })

  return items.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 15)
})

function getItemIcon(item: any) {
  if (item.category === 'Library Item') return 'mdi-bookshelf'
  return 'mdi-note-text'
}

function formatDate(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return date
  }
}

function renderMarkdown(content: string) {
  const rawHtml = marked.parse(content || '')
  return DOMPurify.sanitize(rawHtml as string)
}

/**
 * Parses message content to find json:wildraft-item blocks
 */
function getDraftItems(content: string) {
  if (!content) return []
  const matches = content.matchAll(/```json:wildraft-item\n([\s\S]*?)\n```/g)
  const items: any[] = []
  
  for (const match of matches) {
    try {
      const item = JSON.parse(match[1])
      if (item && item.type && item.name) {
        items.push(item)
      }
    } catch (e) {
      console.error('Failed to parse draft item:', e)
    }
  }
  return items
}

function handleInput(e: any) {
  const textarea = e.target
  const value = textarea.value
  const caretPos = textarea.selectionStart

  // Command detection
  const wordsBefore = value.substring(0, caretPos).split(/[\s\n]/)
  const lastWord = wordsBefore[wordsBefore.length - 1].toLowerCase()
  
  if (lastWord === 'create' || lastWord === '/create' || lastWord === '/') {
    if (!showCommandMenu.value) {
      showCommandMenu.value = true
      focusedCommandIndex.value = 0
    }
  } else {
    showCommandMenu.value = false
  }

  // @ Mention detection
  // Only open if '@' was JUST typed
  if (e.inputType === 'insertText' && e.data === '@') {
    showMentionMenu.value = true
    focusedMentionIndex.value = 0
  }

  // Handle filtering/closing while menu is open
  if (showMentionMenu.value) {
    const lastAtPos = value.lastIndexOf('@', caretPos - 1)
    if (lastAtPos !== -1 && (lastAtPos === 0 || value[lastAtPos - 1] === ' ' || value[lastAtPos - 1] === '\n')) {
      mentionSearch.value = value.substring(lastAtPos + 1, caretPos)
      focusedMentionIndex.value = 0 // Reset focus when search changes
    } else {
      showMentionMenu.value = false
    }
  }
}

function openCommandBuilder(type: 'character' | 'monster' | 'item') {
  activeCommandBuilder.value = type
  showCommandMenu.value = false
  
  // Reset form
  commandData.value = {
    name: '',
    level: '1',
    class: '',
    subclass: '',
    race: '',
    background: '',
    details: '',
    variations: 1
  }
  
  // Remove trigger from input
  const triggers = ['create', '/create', '/']
  const inputLower = inputContent.value.toLowerCase()
  triggers.forEach(trigger => {
    if (inputLower.endsWith(trigger)) {
      inputContent.value = inputContent.value.substring(0, inputLower.lastIndexOf(trigger)).trim()
    }
  })

  // Autofocus first field
  nextTick(() => {
    if (type === 'character' && nameInput.value) {
      nameInput.value.focus()
    } else if (detailsInput.value) {
      detailsInput.value.focus()
    }
  })
}

async function submitCommand() {
  let content = ''
  const { variations } = commandData.value
  
  if (activeCommandBuilder.value === 'character') {
    const { name, level, class: cls, subclass, race, background } = commandData.value
    content = `/create character ${name} ${level} ${cls} ${subclass || ''} ${race} ${background || ''}`.replace(/\s+/g, ' ').trim()
  } else {
    content = `/create ${activeCommandBuilder.value} ${commandData.value.details}`
  }

  // Add variations request
  if (variations > 1) {
    content += `. Generate exactly ${variations} different unique variations of this item/character.`
  }

  activeCommandBuilder.value = null
  await aiStore.sendMessage(content, [], libraryId.value || 0)
  scrollToBottom()
}

function addMention(item: any) {
  const lastAtPos = inputContent.value.lastIndexOf('@')
  if (lastAtPos !== -1) {
    inputContent.value = inputContent.value.substring(0, lastAtPos)
  }
  
  if (!contextItems.value.some(c => c.id === item.id)) {
    contextItems.value.push(item)
  }
  showMentionMenu.value = false
}

function removeContext(id: string) {
  contextItems.value = contextItems.value.filter(c => c.id !== id)
}

async function onSendMessage() {
  if (!libraryId.value || (!inputContent.value.trim() && contextItems.value.length === 0)) return
  
  const content = inputContent.value.trim()
  const items = contextItems.value.map(c => ({
    id: c.id,
    name: c.name,
    type: c.category,
    data: c.data
  }))

  inputContent.value = ''
  contextItems.value = []
  
  await aiStore.sendMessage(content, items, libraryId.value)
  scrollToBottom()
}

function handleEnter(e: KeyboardEvent) {
  if (showMentionMenu.value && mentionItems.value.length > 0) {
    e.preventDefault()
    addMention(mentionItems.value[focusedMentionIndex.value])
    return
  }

  if (!e.shiftKey) {
    onSendMessage()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  // 1. Handle command menu navigation
  if (showCommandMenu.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusedCommandIndex.value = (focusedCommandIndex.value + 1) % creationCommands.length
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusedCommandIndex.value = (focusedCommandIndex.value - 1 + creationCommands.length) % creationCommands.length
    } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault()
      openCommandBuilder(creationCommands[focusedCommandIndex.value].id)
    } else if (e.key === 'Escape') {
      showCommandMenu.value = false
    }
    return
  }

  // 2. Handle mention menu navigation
  if (showMentionMenu.value) {
    handleEnter(e)
  }
}

async function selectConversation(id: string) {
  await aiStore.selectConversation(id)
  showConversations.value = false
  scrollToBottom()
}

function startNewConversation() {
  aiStore.clearActiveConversation()
  showConversations.value = false
}

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

function handleScroll() {
  // Can implement load-more history here later
}

watch(() => aiStore.messages.length, scrollToBottom)

onMounted(() => {
  if (libraryId.value) {
    aiStore.fetchConversations(libraryId.value)
  }
})

// Scroll on initial load
watch(() => aiStore.isLoadingMessages, (loading) => {
  if (!loading) scrollToBottom()
})
</script>

<style scoped>
.dm-screen-chat {
  background: rgba(var(--v-theme-surface), 0.1);
  backdrop-filter: blur(16px);
  max-width: 100%;
  font-size: 0.85rem;
}

.chat-header {
  background: rgba(var(--v-theme-surface), 0.2);
  backdrop-filter: blur(8px);
  padding: 8px 12px !important;
}

.message-list {
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.2) transparent;
  padding: 12px !important;
}

.message-wrapper {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
}

.message-wrapper.user {
  align-items: flex-end;
}

.message-wrapper.assistant {
  align-items: flex-start;
}

.message-bubble {
  max-width: 95%;
  word-break: break-word;
  position: relative;
  transition: all 0.2s ease;
}

.user .message-bubble {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), rgb(var(--v-theme-accent)));
  color: white;
  border-bottom-right-radius: 4px !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1) !important;
  padding: 8px 12px !important;
}

.assistant .message-bubble {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
  border-bottom-left-radius: 4px !important;
  padding: 8px 12px !important;
}

.message-content :deep(p) {
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(ul), .message-content :deep(ol) {
  margin-bottom: 0.5rem;
  padding-left: 1rem;
}

.message-content :deep(li) {
  margin-bottom: 0.15rem;
}

.message-content :deep(h1), .message-content :deep(h2), .message-content :deep(h3) {
  font-size: 1rem;
  margin-bottom: 0.4rem;
  font-weight: bold;
}

.message-content :deep(pre) {
  background: rgba(0,0,0,0.3);
  padding: 0.5rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0;
  border: 1px solid rgba(255,255,255,0.05);
}

.message-content :deep(code) {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  padding: 0.05rem 0.2rem;
  border-radius: 3px;
  font-size: 0.8rem;
}

.conversations-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  overflow-y: auto;
}

.glass-effect {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(24px);
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-tiny {
  font-size: 0.65rem;
}

.assistant-typing {
  opacity: 0.8;
  background: rgba(var(--v-theme-primary), 0.05) !important;
  padding: 4px 12px !important;
}

.typing-indicator span {
  animation: blink 1s infinite;
  font-weight: bold;
  font-size: 1rem;
  color: rgb(var(--v-theme-primary));
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0% { opacity: 0.2; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-3px); }
  100% { opacity: 0.2; transform: translateY(0); }
}

.chat-input :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.2) !important;
  border-radius: 12px;
  font-size: 0.85rem;
}

.chat-input :deep(.v-field__outline) {
  opacity: 0.2;
}

.mention-list {
  background: rgba(var(--v-theme-surface), 0.98) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.command-menu {
  background: rgba(var(--v-theme-surface), 0.98) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  border-radius: 8px !important;
}

.command-builder-pane {
  background: rgba(var(--v-theme-primary), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.2) !important;
  backdrop-filter: blur(8px);
}

.command-form :deep(.v-field) {
  background: rgba(var(--v-theme-surface), 0.5) !important;
  border-radius: 8px !important;
}

.command-form :deep(.v-label) {
  font-size: 0.75rem;
}

.focused-item {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
