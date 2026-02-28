<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="1200px"
    persistent
  >
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center">
        <v-icon :icon="icon" :color="iconColor" size="28" class="mr-3" />
        {{ title }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-card-text class="pa-0">
        <v-container fluid>
          <!-- Single Item Import Mode -->
          <template v-if="!isMultipleMode && schema">
            <v-row>
              <v-col cols="12" md="4">
                <div class="guidelines-section">
                  <h3 class="text-h6 mb-3">JSON Structure Guidelines</h3>
                  <p class="text-body-2 text-grey-lighten-1 mb-4">
                    {{ schema!.description }}
                  </p>

                  <div class="schema-fields">
                    <h4 class="text-subtitle-2 mb-2">Required Fields:</h4>
                    <v-chip
                      v-for="(_, key) in requiredFields"
                      :key="key"
                      size="small"
                      color="primary"
                      variant="outlined"
                      class="mr-1 mb-1"
                    >
                      {{ key }}
                    </v-chip>
                  </div>

                  <v-divider class="my-4" />

                  <div class="schema-details">
                    <h4 class="text-subtitle-2 mb-3">Field Details:</h4>
                    <div class="field-list">
                      <div
                        v-for="(description, field) in schema!.schema"
                        :key="field"
                        class="field-item"
                      >
                        <code class="field-name">{{ field }}</code>
                        <span class="field-desc">{{ description }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="8">
                  <div class="import-section">
                    <h3 class="text-h6 mb-3">AI Generation</h3>
                    <v-textarea
                      v-model="aiInstructions"
                      label="Instructions for AI"
                      placeholder="E.g., A level 5 elf wizard specializing in fire magic..."
                      rows="3"
                      variant="outlined"
                      class="mb-2"
                      hide-details="auto"
                    />
                    <v-btn
                      block
                      color="secondary"
                      variant="tonal"
                      prepend-icon="mdi-robot"
                      class="mb-4"
                      :loading="isGenerating"
                      @click="generateWithAI"
                    >
                      Generate with AI
                    </v-btn>

                    <v-divider class="mb-4" />

                    <h3 class="text-h6 mb-3">Paste JSON Data</h3>
                  
                  <!-- Note Customization -->
                  <v-expand-transition>
                    <note-prompt-customization
                      v-if="isNoteType && !isMultipleMode"
                      v-model:note-type="noteCustomization.noteType"
                      v-model:theme="noteCustomization.theme"
                      v-model:additional-context="noteCustomization.additionalContext"
                      v-model:num-chapters="noteCustomization.numChapters"
                    />
                  </v-expand-transition>

                  <v-textarea
                    v-model="jsonInput"
                    :placeholder="`Paste your ${schema!.title.toLowerCase()} JSON here...`"
                    rows="15"
                    variant="outlined"
                    class="json-textarea"
                    :error-messages="parseError"
                  />

                  <v-alert
                    v-if="parseSuccess"
                    type="success"
                    variant="tonal"
                    class="mb-4"
                  >
                    <v-icon icon="mdi-check-circle" class="mr-2" />
                    JSON parsed successfully! Click "Import" to fill the form.
                  </v-alert>

                  <div class="d-flex gap-3 flex-wrap">
                    <v-btn
                      variant="text"
                      @click="copyPrompt"
                      prepend-icon="mdi-content-copy"
                      :color="promptCopied ? 'success' : 'primary'"
                    >
                      {{ promptCopied ? 'Copied!' : 'Copy Prompt' }}
                    </v-btn>
                    <v-btn
                      variant="text"
                      @click="loadExample"
                      prepend-icon="mdi-code-json"
                    >
                      {{ hasCurrentItem ? 'Show Current JSON' : 'Load Example' }}
                    </v-btn>
                    <v-btn
                      variant="text"
                      @click="validateJson"
                      prepend-icon="mdi-check"
                      :loading="isValidating"
                    >
                      Validate
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
          </template>

          <!-- Multiple Items Import Mode -->
          <template v-else>
            <!-- Type-Specific Multiple Import -->
            <template v-if="props.itemType && schema">
              <v-row>
                <v-col cols="12" md="4">
                  <div class="guidelines-section">
                    <h3 class="text-h6 mb-3">{{ schema!.title }} Import</h3>
                    <p class="text-body-2 text-grey-lighten-1 mb-4">
                      Import multiple {{ schema!.title.toLowerCase() }} items. The "type" field will be added automatically.
                    </p>

                    <div class="schema-fields">
                      <h4 class="text-subtitle-2 mb-2">Required Fields per Item:</h4>
                    <v-chip
                      v-for="(_, key) in requiredFields"
                        :key="key"
                        size="small"
                        color="primary"
                        variant="outlined"
                        class="mr-1 mb-1"
                      >
                        {{ key }}
                      </v-chip>
                    </div>

                    <v-divider class="my-4" />

                    <div class="schema-details">
                      <h4 class="text-subtitle-2 mb-3">Field Details:</h4>
                      <div class="field-list">
                        <div
                        v-for="(description, field) in schema!.schema"
                          :key="field"
                          class="field-item"
                        >
                          <code class="field-name">{{ field }}</code>
                          <span class="field-desc">{{ description }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-col>

                <v-col cols="12" md="8">
                  <div class="import-section">
                    <h3 class="text-h6 mb-3">Paste {{ schema!.title }} JSON Array</h3>
                    <p class="text-caption text-grey-lighten-1 mb-3">
                      Provide an array of {{ schema!.title.toLowerCase() }} objects (without "type" field - it will be added automatically)
                    </p>
                    <v-textarea
                      v-model="jsonInput"
                      :placeholder="`Paste your ${schema!.title.toLowerCase()} JSON array here...`"
                      rows="15"
                      variant="outlined"
                      class="json-textarea"
                      :error-messages="parseError"
                    />

                    <v-alert
                      v-if="bulkItems.length > 0"
                      type="info"
                      variant="tonal"
                      class="mb-4"
                    >
                      <v-icon icon="mdi-information" class="mr-2" />
                      Found {{ bulkItems.length }} {{ schema!.title.toLowerCase() }}{{ bulkItems.length > 1 ? 's' : '' }} to import.
                    </v-alert>

                    <div class="d-flex gap-3 flex-wrap">
                      <v-btn
                        variant="text"
                        @click="copyPrompt"
                        prepend-icon="mdi-content-copy"
                        :color="promptCopied ? 'success' : 'primary'"
                      >
                        {{ promptCopied ? 'Copied!' : 'Copy Prompt' }}
                      </v-btn>
                      <v-btn
                        variant="text"
                        @click="loadExample"
                        prepend-icon="mdi-code-json"
                      >
                        Load Example
                      </v-btn>
                      <v-btn
                        variant="text"
                        @click="validateJson"
                        prepend-icon="mdi-check"
                        :loading="isValidating"
                      >
                        Validate
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </template>

            <!-- General Bulk Import -->
            <template v-else>
              <v-row>
                <v-col cols="12">
                  <div class="bulk-import-section">
                    <h3 class="text-h6 mb-3">Bulk JSON Import</h3>
                    <p class="text-body-2 text-grey-lighten-1 mb-4">
                      Import multiple items at once. Provide an array of item objects in JSON format.
                    </p>

                    <div class="item-types-grid mb-4">
                      <v-chip
                        v-for="itemType in availableItemTypes"
                        :key="itemType"
                        :color="getItemTypeInfo(itemType).color"
                        variant="outlined"
                        class="mr-2 mb-2"
                      >
                        <v-icon :icon="getItemTypeInfo(itemType).icon" size="16" class="mr-1" />
                        {{ getItemTypeInfo(itemType).label }}
                      </v-chip>
                    </div>

                    <v-textarea
                      v-model="jsonInput"
                      placeholder='Paste your JSON array here... e.g., [{"type": "CHARACTER_DND_5E", "name": "Hero", ...}, {"type": "NOTE", "name": "Session Notes", ...}]'
                      rows="20"
                      variant="outlined"
                      class="json-textarea"
                      :error-messages="parseError"
                    />

                    <v-alert
                      v-if="bulkItems.length > 0"
                      type="info"
                      variant="tonal"
                      class="mb-4"
                    >
                      <v-icon icon="mdi-information" class="mr-2" />
                      Found {{ bulkItems.length }} item{{ bulkItems.length > 1 ? 's' : '' }} to import.
                    </v-alert>

                    <div class="d-flex gap-3 flex-wrap">
                      <v-btn
                        variant="text"
                        @click="copyBulkPrompt"
                        prepend-icon="mdi-content-copy"
                        :color="promptCopied ? 'success' : 'primary'"
                      >
                        {{ promptCopied ? 'Copied!' : 'Copy Bulk Prompt' }}
                      </v-btn>
                      <v-btn
                        variant="text"
                        @click="loadBulkExample"
                        prepend-icon="mdi-code-json"
                      >
                        Load Example
                      </v-btn>
                      <v-btn
                        variant="text"
                        @click="validateJson"
                        prepend-icon="mdi-check"
                        :loading="isValidating"
                      >
                        Validate
                      </v-btn>
                      <v-btn
                        variant="tonal"
                        color="secondary"
                        @click="generateBulkWithAI"
                        prepend-icon="mdi-robot"
                        :loading="isGenerating"
                      >
                        Generate with AI
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </template>
          </template>
        </v-container>
      </v-card-text>

      <v-divider v-if="!isMultipleMode" />

      <!-- Import Options (only for single item import) -->
      <v-card-text v-if="!isMultipleMode" class="py-3 px-6">
        <v-checkbox
          v-model="importDescription"
          label="Import description"
          density="compact"
          hide-details
          color="primary"
        />
      </v-card-text>

      <v-card-actions class="px-6 py-4">
        <v-spacer />
        <v-btn variant="text" @click="close">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="importData"
          :disabled="!canImport"
          :loading="isImporting"
        >
          <v-icon icon="mdi-import" class="mr-2" />
          {{ isMultipleMode ? 'Import Items' : 'Import' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { aiApi } from '@/api/ai'
import { useUserSettingsStore } from '@/stores/userSettings'
import type { ItemType, CreateLibraryItemPayload, LibraryItem } from '@/types/item.types'
import { useItemComponents, type JsonImportSchema } from '@/composables/useItemComponents'
import NotePromptCustomization from './NotePromptCustomization.vue'

interface Props {
  modelValue: boolean
  itemType?: ItemType // For single item import
  isMultipleMode?: boolean // For bulk import
  currentItem?: LibraryItem | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'import', data: CreateLibraryItemPayload | CreateLibraryItemPayload[], options?: { importDescription?: boolean }): void
}

const props = withDefaults(defineProps<Props>(), {
  isMultipleMode: false,
  currentItem: null,
})

const emit = defineEmits<Emits>()

const { getJsonImportSchema, getItemTypeInfo, getItemTypesForTemplate, getUniversalItemTypes } = useItemComponents()

const jsonInput = ref('')
const isValidating = ref(false)
const isImporting = ref(false)
const parseError = ref<string[]>([])
const parseSuccess = ref(false)
const promptCopied = ref(false)
const isGenerating = ref(false)
const importDescription = ref(true) // Default to importing description
const aiInstructions = ref('')

// Note customization
const noteCustomization = ref({
  noteType: 'general',
  theme: '',
  additionalContext: '',
  numChapters: 0
})

const userSettingsStore = useUserSettingsStore()

const hasCurrentItem = computed(() => !!props.currentItem)
const isNoteType = computed(() => props.itemType === 'NOTE')

const schema = computed(() => {
  if (!props.itemType) return null
  return getJsonImportSchema(props.itemType)
})

const requiredFields = computed(() => {
  if (!schema.value) return {}
  const schemaEntries = Object.entries(schema.value.schema as Record<string, string>)
  return Object.fromEntries(schemaEntries.filter(([, desc]) => desc.includes('(required)')))
})

const availableItemTypes = computed(() => {
  const dndTypes = getItemTypesForTemplate('DND_5E')
  const universalTypes = getUniversalItemTypes()
  return [...dndTypes, ...universalTypes]
})

const bulkItems = computed(() => {
  if (!props.isMultipleMode || !jsonInput.value.trim()) return []

  try {
    const parsed = JSON.parse(jsonInput.value)
    if (Array.isArray(parsed)) {
      const isTypeSpecific = props.itemType && schema.value
      return parsed.filter(item => {
        if (!item || typeof item !== 'object' || !item.name) {
          return false
        }
        if (isTypeSpecific) {
          return true
        }
        return !!item.type && typeof item.type === 'string'
      })
    }
  } catch {
    // Invalid JSON
  }
  return []
})

const canImport = computed(() => {
  if (props.isMultipleMode) {
    return bulkItems.value.length > 0 && parseError.value.length === 0
  } else {
    return parseSuccess.value && parseError.value.length === 0
  }
})

const title = computed(() => {
  if (props.isMultipleMode) {
    return 'Bulk JSON Import'
  }
  return schema.value ? `Import ${schema.value.title}` : 'JSON Import'
})

const icon = computed(() => {
  if (props.isMultipleMode) {
    return 'mdi-import'
  }
  return props.itemType ? getItemTypeInfo(props.itemType).icon : 'mdi-code-json'
})

const iconColor = computed(() => {
  if (props.isMultipleMode) {
    return 'primary'
  }
  return props.itemType ? getItemTypeInfo(props.itemType).color : 'primary'
})

function close() {
  emit('update:modelValue', false)
  resetState()
}

function resetState() {
  jsonInput.value = ''
  parseError.value = []
  parseSuccess.value = false
  isValidating.value = false
  isValidating.value = false
  importDescription.value = true // Reset to default (import description)
  aiInstructions.value = ''
  // Reset note customization
  noteCustomization.value = {
    noteType: 'general',
    theme: '',
    additionalContext: '',
    numChapters: 0
  }
}

function loadExample() {
  if (props.currentItem) {
    jsonInput.value = formatCurrentItemJson(props.currentItem)
    parseError.value = []
    parseSuccess.value = false
    validateJson()
  } else if (schema.value) {
    jsonInput.value = schema.value.example
    validateJson()
  }
}

function loadBulkExample() {
  const examples = availableItemTypes.value
    .slice(0, 2)
    .map(itemType => {
      const schema = getJsonImportSchema(itemType)
      if (schema) {
        try {
          const exampleData = JSON.parse(schema.example)
          return { ...exampleData, type: itemType }
        } catch {
          return null
        }
      }
      return null
    })
    .filter(Boolean)

  jsonInput.value = JSON.stringify(examples, null, 2)
  validateJson()
}

async function copyPrompt() {
  if (!schema.value) return

  const customParams = props.itemType === 'NOTE' ? {
    noteType: noteCustomization.value.noteType,
    theme: noteCustomization.value.theme,
    additionalContext: noteCustomization.value.additionalContext,
    numChapters: noteCustomization.value.numChapters
  } : undefined

  const prompt = generateAIPrompt(schema.value, customParams)
  await copyToClipboard(prompt)
}

async function copyBulkPrompt() {
  const prompt = generateBulkAIPrompt()
  await copyToClipboard(prompt)
}

async function generateWithAI() {
  if (!schema.value) return
  
  const customParams = props.itemType === 'NOTE' ? {
    noteType: noteCustomization.value.noteType,
    theme: noteCustomization.value.theme,
    additionalContext: noteCustomization.value.additionalContext || aiInstructions.value, // Fallback to generic instructions for notes if context is empty
    numChapters: noteCustomization.value.numChapters
  } : undefined

  let prompt = generateAIPrompt(schema.value, customParams)
  
  if (aiInstructions.value && props.itemType !== 'NOTE') {
    prompt += `\n\nUSER INSTRUCTIONS:\n${aiInstructions.value}\n\nPlease incorporate these instructions into the generated content while maintaining the required JSON structure.`
  }
  
  isGenerating.value = true
  parseError.value = []
  
  // Relaxed check: Trust if model is selected
  if (!userSettingsStore.aiSettings?.model) {
    parseError.value = ['Please select an AI model in User Settings to use this feature.']
    isGenerating.value = false
    return
  }

  try {
    const response = await aiApi.generateJson({
      systemPrompt: 'You are a JSON generator for a D&D application. Output ONLY valid JSON.',
      userPrompt: prompt,
      model: userSettingsStore.aiSettings?.model,
      temperature: userSettingsStore.aiSettings?.temperature,
    })
    
    // Extract JSON from response (sometimes models wrap in markdown blocks)
    let content = response.content
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      content = jsonMatch[1]
    }
    
    jsonInput.value = content
    validateJson()
    
  } catch (error) {
    console.error('AI Generation failed:', error)
    parseError.value = ['AI generation failed. Please check your API key and try again.']
  } finally {
    isGenerating.value = false
  }
}

async function generateBulkWithAI() {
  const prompt = generateBulkAIPrompt()
  
  isGenerating.value = true
  parseError.value = []
  
  // Relaxed check: Trust if model is selected
  if (!userSettingsStore.aiSettings?.model) {
    parseError.value = ['Please select an AI model in User Settings to use this feature.']
    isGenerating.value = false
    return
  }

  try {
    const response = await aiApi.generateJson({
      systemPrompt: 'You are a JSON generator for a D&D application. Output ONLY valid JSON array.',
      userPrompt: prompt,
      model: userSettingsStore.aiSettings?.model,
      temperature: userSettingsStore.aiSettings?.temperature,
    })
    
    let content = response.content
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      content = jsonMatch[1]
    }
    
    jsonInput.value = content
    validateJson()
    
  } catch (error) {
    console.error('AI Generation failed:', error)
    parseError.value = ['AI generation failed. Please check your API key and try again.']
  } finally {
    isGenerating.value = false
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    promptCopied.value = true
    setTimeout(() => {
      promptCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy prompt:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    promptCopied.value = true
    setTimeout(() => {
      promptCopied.value = false
    }, 2000)
  }
}

function generateAIPrompt(schema: JsonImportSchema, customParams?: Record<string, any>): string {
  const schemaMap = schema.schema as Record<string, string>
  const requiredFields = Object.entries(schemaMap)
    .filter(([, desc]) => desc.includes('(required)'))
    .map(([field]) => field)

  const optionalFields = Object.entries(schemaMap)
    .filter(([, desc]) => !desc.includes('(required)'))
    .map(([field]) => field)

  // Special handling for NOTE type with customization
  if (schema.title === 'Note' && customParams) {
    return generateNotePrompt(schema, customParams)
  }

  // Enhanced prompts for stat blocks and characters
  const isStatBlock = schema.title.includes('Stat Block')
  const isCharacter = schema.title.includes('Character')
  
  let instructions = `- Generate a complete, valid JSON object
- Use realistic values appropriate for the item type
- Follow the exact field naming and structure shown above
- Include arrays where specified (even if empty)
- Use proper data types (strings, numbers, booleans, arrays, objects)
- Do not include any fields not listed in the specifications above`

  if (isStatBlock || isCharacter) {
    instructions += `

CRITICAL FOR ACTIONS AND SPELLS:
- For actions with attack rolls: Include "toHit" with the attack bonus (e.g., "+5", "+3"). Calculate from ability modifier + proficiency bonus.
- For actions/spells with damage: Include "roll" with damage dice and type (e.g., "1d6 fire", "2d8+3 slashing"). Do NOT include to-hit bonuses here.
- For actions/spells requiring saving throws: Include "dc" with ability (e.g., "15 DEX", "18 CON"). Calculate from 8 + ability modifier + proficiency bonus.
- Always include detailed "description" fields with full mechanical text, including hit/miss effects, range, area of effect, and flavor text.
- For spells: Include all spell details (school, casting time, range, components, duration, concentration, ritual) as specified.
- Make descriptions playable and complete - include all information a player/DM needs to use the action or spell.`
  }

  return `Please generate a JSON object for a ${schema.title} with the following specifications:

REQUIRED FIELDS:
${requiredFields.map(field => `- ${field}: ${schemaMap[field]}`).join('\n')}

OPTIONAL FIELDS:
${optionalFields.map(field => `- ${field}: ${schemaMap[field]}`).join('\n')}

INSTRUCTIONS:
${instructions}

EXAMPLE OUTPUT FORMAT:
${schema.example}

Please provide only the JSON object, no additional text or explanations.`
}

function generateNotePrompt(schema: JsonImportSchema, customParams: Record<string, any>): string {
  const noteType = customParams.noteType || 'general'
  const theme = customParams.theme || ''
  const additionalContext = customParams.additionalContext || ''
  const numChapters = customParams.numChapters || 0

  const noteTypeTemplates: Record<string, string> = {
    dungeon: `Generate a detailed dungeon note with:
- Main content: Overview of the dungeon, its history, purpose, and general layout
- Chapters should include: Entrance/Overview, Key Rooms/Areas, Traps and Hazards, Encounters, Treasure/Loot, Boss/Climax
- Include specific room descriptions, trap mechanics, monster placements, and treasure locations
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it playable and detailed enough for a DM to run the dungeon`,
    
    npc: `Generate a detailed NPC note with:
- Main content: Overview of the NPC, their role in the story, and general personality
- Chapters should include: Background/History, Personality & Traits, Goals & Motivations, Relationships, Secrets/Information, Plot Hooks
- Include specific dialogue examples, mannerisms, and how they interact with the party
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it detailed enough for a DM to roleplay the NPC convincingly`,
    
    shop: `Generate a detailed shop/merchant note with:
- Main content: Overview of the shop, its location, owner, and general atmosphere
- Chapters should include: Shop Description, Inventory/Items for Sale, Prices, Special Services, Owner Details, Plot Hooks
- Include specific items with prices, rarity, and descriptions
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it playable with ready-to-use items and prices`,
    
    loot: `Generate a detailed loot/treasure note with:
- Main content: Overview of the treasure hoard, its location, and how it was obtained
- Chapters should include: Treasure Overview, Magic Items, Gold & Gems, Mundane Items, Distribution Notes, Plot Significance
- Include specific items with descriptions, values, and any magical properties
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it detailed with specific items ready to give to players`,
    
    location: `Generate a detailed location note with:
- Main content: Overview of the location, its history, and significance
- Chapters should include: Description, History, Notable Features, Inhabitants, Points of Interest, Plot Hooks
- Include specific details about the environment, atmosphere, and what makes it unique
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it immersive and detailed enough for a DM to describe the location`,
    
    town: `Generate a detailed town/city note with:
- Main content: Overview of the town, its location, size, population, and general atmosphere
- Chapters should include: Town Overview & History, Districts/Neighborhoods, Key Locations (shops, inns, temples, etc.), Notable NPCs, Government & Law, Economy & Trade, Culture & Customs, Plot Hooks & Events
- Include specific locations with descriptions, NPCs with brief backgrounds, services available, prices, and notable features
- Describe the town's layout, architecture, and what makes it unique or memorable
- Include information about local laws, customs, festivals, and how the town interacts with adventurers
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it detailed and playable enough for a DM to run the town as a living, breathing location`,
    
    quest: `Generate a detailed quest note with:
- Main content: Overview of the quest, its objectives, and importance
- Chapters should include: Quest Overview, Objectives, Rewards, NPCs Involved, Locations, Complications
- Include specific objectives, rewards, and how the quest progresses
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it playable with clear objectives and progression`,
    
    session: `Generate a detailed session notes with:
- Main content: Overview of the session, what happened, and key events
- Chapters should include: Session Summary, Key Events, NPCs Met, Locations Visited, Combat Encounters, Loot Gained, Plot Developments
- Include specific details about what happened, decisions made, and consequences
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it a comprehensive record of the session`,
    
    general: `Generate a detailed note with:
- Main content: Overview of the topic
- Chapters: Organize content into logical sections
- Use HTML formatting: <p> for paragraphs, <ul>/<ol> for lists, <strong> for emphasis
- Make it detailed and useful`
  }

  const template = noteTypeTemplates[noteType] || noteTypeTemplates.general
  const chaptersInstruction = numChapters > 0 
    ? `\n- Generate exactly ${numChapters} chapter${numChapters > 1 ? 's' : ''} with meaningful titles and content`
    : '\n- Include 2-4 chapters to organize the content logically'

  return `Please generate a JSON object for a ${schema.title} (${noteType} type) with the following specifications:

REQUIRED FIELDS:
- name: string (required) - Note title
- content: string (required) - Main note content (use HTML: <p> for paragraphs, <ul>/<ol> for lists, <strong>/<em> for emphasis)

OPTIONAL FIELDS:
- chapters: array (optional) - Additional chapters for organizing content
  - chapters[].order: number (optional) - Chapter order (auto-assigned if not provided)
  - chapters[].title: string (required) - Chapter title
  - chapters[].content: string (required) - Chapter content (use HTML formatting)
- isPinned: boolean (optional) - Whether the note is pinned (default: false)

INSTRUCTIONS:
${template}${chaptersInstruction}${theme ? `\n- Theme/Style: ${theme}` : ''}${additionalContext ? `\n- Additional Context: ${additionalContext}` : ''}
- Use HTML formatting for rich text content
- Make content detailed, playable, and useful for D&D gameplay
- Follow the exact field naming and structure shown above

EXAMPLE OUTPUT FORMAT:
${schema.example}

Please provide only the JSON object, no additional text or explanations.`
}

function formatCurrentItemJson(item: LibraryItem): string {
  const clone: Record<string, any> = item.data
    ? JSON.parse(JSON.stringify(item.data))
    : {}

  clone.name = item.name

  if (item.description) {
    clone.description = item.description
  }

  if (item.tags?.length) {
    clone.tagIds = item.tags.map(tag => tag.id)
  }

  if (item.userFiles?.length) {
    clone.userFileIds = item.userFiles.map(file => file.id)
  }

  if (item.featuredImage) {
    clone.featuredImageId = item.featuredImage.id
  }

  return JSON.stringify(clone, null, 2)
}

function generateBulkAIPrompt(): string {
  const itemTypeSchemas = availableItemTypes.value
    .map(itemType => {
      const schema = getJsonImportSchema(itemType)
      if (!schema) return null

      const requiredFields = Object.entries(schema.schema)
        .filter(([_, desc]) => desc.includes('(required)'))
        .map(([field]) => field)

      return `${itemType.replace(/_/g, ' ')} (${itemType}):
Required: ${requiredFields.join(', ')}
Example: ${schema.example.split('\n')[1]?.trim() || 'See individual schema'}`
    })
    .filter(Boolean)
    .join('\n\n')

  return `Please generate a JSON array of multiple library items with the following specifications:

SUPPORTED ITEM TYPES:
${itemTypeSchemas}

INSTRUCTIONS:
- Generate an array of 2-5 different items
- Each item must have a "type" field matching one of the supported types above
- Use realistic and varied content for each item
- Include a mix of different item types in your response
- Follow the schema requirements for each item type
- Use proper data types (strings, numbers, booleans, arrays, objects)

EXAMPLE OUTPUT FORMAT:
[
  {
    "type": "CHARACTER_DND_5E",
    "name": "Example Character",
    "level": 3,
    "class": "Fighter",
    "race": "Human"
  },
  {
    "type": "NOTE",
    "name": "Campaign Notes",
    "content": "Session summary and notes"
  }
]

Please provide only the JSON array, no additional text or explanations.`
}

function validateJson() {
  parseError.value = []
  parseSuccess.value = false
  isValidating.value = true

  try {
    if (!jsonInput.value.trim()) {
      parseError.value.push('JSON input is empty')
      isValidating.value = false
      return
    }

    const parsed = JSON.parse(jsonInput.value)

    if (props.isMultipleMode) {
      // Validate array of items
      if (!Array.isArray(parsed)) {
        parseError.value.push('Expected an array of items')
        isValidating.value = false
        return
      }

      if (parsed.length === 0) {
        parseError.value.push('Array is empty')
        isValidating.value = false
        return
      }

      // Check if we're in type-specific mode (itemType is provided)
      const isTypeSpecific = props.itemType && schema.value

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        if (!item || typeof item !== 'object') {
          parseError.value.push(`Item ${i + 1}: Must be an object`)
          continue
        }
        if (!item.name || typeof item.name !== 'string') {
          parseError.value.push(`Item ${i + 1}: Missing required 'name' field`)
        }

        // In type-specific mode, we don't require the type field since it will be added automatically
        if (!isTypeSpecific) {
          if (!item.type || typeof item.type !== 'string') {
            parseError.value.push(`Item ${i + 1}: Missing required 'type' field`)
          } else if (!availableItemTypes.value.includes(item.type)) {
            parseError.value.push(`Item ${i + 1}: Invalid item type '${item.type}'`)
          }
        } else {
          // In type-specific mode, move any "type" field to the data object
          if (item.type && item.type !== props.itemType) {
            // Move the type field to data (e.g., creature type for monsters)
            if (!item.data) item.data = {}
            item.data.type = item.type
            delete item.type
          }
        }
      }
    } else {
      // Validate single item
      if (!parsed || typeof parsed !== 'object') {
        parseError.value.push('Expected an object')
        isValidating.value = false
        return
      }

      if (!parsed.name || typeof parsed.name !== 'string') {
        parseError.value.push('Missing required "name" field')
      }

      // Check required fields for this item type
      for (const [field] of Object.entries(requiredFields.value)) {
        // Handle nested array fields like "spells[].name" or "actions[].name"
        if (field.includes('[]')) {
          const [arrayField, nestedField] = field.split('[]')
          const arrayFieldName = arrayField.replace(/\[$/, '')
          
          // Check if the array exists and is actually an array
          if (parsed[arrayFieldName]) {
            if (!Array.isArray(parsed[arrayFieldName])) {
              parseError.value.push(`Field "${arrayFieldName}" must be an array`)
              continue
            }
            
            // Validate each item in the array
            const arrayItems = parsed[arrayFieldName]
            for (let i = 0; i < arrayItems.length; i++) {
              const item = arrayItems[i]
              if (!item || typeof item !== 'object') {
                parseError.value.push(`${arrayFieldName}[${i}]: Must be an object`)
                continue
              }
              
              // Check if the nested field exists in this array item
              const fieldName = nestedField.replace(/^\./, '') // Remove leading dot
              if (!(fieldName in item) || item[fieldName] === null || item[fieldName] === undefined || item[fieldName] === '') {
                parseError.value.push(`Missing required field: "${field}" in ${arrayFieldName}[${i}]`)
              }
            }
          }
          // If array field is optional and doesn't exist, that's fine - skip validation
        } else {
          // Regular top-level field validation
          if (!(field in parsed) || parsed[field] === null || parsed[field] === undefined || parsed[field] === '') {
            parseError.value.push(`Missing required field: "${field}"`)
          }
        }
      }
    }

    if (parseError.value.length === 0) {
      parseSuccess.value = true
    }
  } catch (error) {
    parseError.value.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  isValidating.value = false
}

async function importData() {
  if (!canImport.value) return

  isImporting.value = true

  try {
    const parsed = JSON.parse(jsonInput.value)

    if (props.isMultipleMode) {
      // Check if we're in type-specific mode
      const isTypeSpecific = props.itemType && schema.value

      // Process bulk import - convert each item to CreateLibraryItemPayload format
      const itemsToImport: CreateLibraryItemPayload[] = bulkItems.value.map(item => ({
        type: isTypeSpecific ? props.itemType! : item.type,
        name: item.name,
        description: item.description || undefined,
        data: isTypeSpecific ? item : (item.data || {}),
        tagIds: item.tagIds || [],
        userFileIds: item.userFileIds || [],
        featuredImageId: item.featuredImageId || undefined,
      }))

      emit('import', itemsToImport)
    } else {
      // Process single item import
      const importData: CreateLibraryItemPayload = {
        type: props.itemType!,
        name: parsed.name,
        description: importDescription.value ? (parsed.description || undefined) : undefined,
        data: parsed.data || parsed, // Handle both formats (with data wrapper or direct)
        // Do NOT import tags or attachments - they stay as-is
        tagIds: [],
        userFileIds: [],
        featuredImageId: undefined,
      }

      emit('import', importData, { importDescription: importDescription.value })
    }

    close()
  } catch (error) {
    parseError.value.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  isImporting.value = false
}

watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    resetState()
  }
})
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.guidelines-section {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

.schema-fields {
  margin-bottom: 16px;
}

.field-list {
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
}

.field-name {
  display: block;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 4px;
}

.field-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}

.import-section, .bulk-import-section {
  padding: 16px;
}

.json-textarea :deep(.v-textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
}

.item-types-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
