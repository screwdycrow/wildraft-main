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
                  <h3 class="text-h6 mb-3">Paste JSON Data</h3>
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
import type { ItemType, CreateLibraryItemPayload, LibraryItem } from '@/types/item.types'
import { useItemComponents, type JsonImportSchema } from '@/composables/useItemComponents'

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
const importDescription = ref(true) // Default to importing description

const hasCurrentItem = computed(() => !!props.currentItem)

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
  importDescription.value = true // Reset to default (import description)
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

  const prompt = generateAIPrompt(schema.value)
  await copyToClipboard(prompt)
}

async function copyBulkPrompt() {
  const prompt = generateBulkAIPrompt()
  await copyToClipboard(prompt)
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

function generateAIPrompt(schema: JsonImportSchema): string {
  const schemaMap = schema.schema as Record<string, string>
  const requiredFields = Object.entries(schemaMap)
    .filter(([, desc]) => desc.includes('(required)'))
    .map(([field]) => field)

  const optionalFields = Object.entries(schemaMap)
    .filter(([, desc]) => !desc.includes('(required)'))
    .map(([field]) => field)

  return `Please generate a JSON object for a ${schema.title} with the following specifications:

REQUIRED FIELDS:
${requiredFields.map(field => `- ${field}: ${schemaMap[field]}`).join('\n')}

OPTIONAL FIELDS:
${optionalFields.map(field => `- ${field}: ${schemaMap[field]}`).join('\n')}

INSTRUCTIONS:
- Generate a complete, valid JSON object
- Use realistic values appropriate for the item type
- Follow the exact field naming and structure shown above
- Include arrays where specified (even if empty)
- Use proper data types (strings, numbers, booleans, arrays, objects)
- Do not include any fields not listed in the specifications above

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
        if (!(field in parsed) || parsed[field] === null || parsed[field] === undefined || parsed[field] === '') {
          parseError.value.push(`Missing required field: "${field}"`)
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
