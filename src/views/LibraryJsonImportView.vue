<template>
  <div class="json-import-view">
    <div class="page-header mb-6">
      <div class="d-flex align-center mb-2">
        <v-icon icon="mdi-import" size="32" class="mr-3" color="primary" />
        <div>
        <h1 class="text-h4 font-weight-bold">Mass JSON Import</h1>
        <p class="text-body-1 text-grey-lighten-1 mt-1">
          Import multiple items of the same type using AI-generated JSON
        </p>
        </div>
      </div>

      <v-breadcrumbs :items="breadcrumbItems" class="mt-2" />
    </div>

    <!-- Import Stats -->
    <v-row v-if="importStats.total > 0" class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined" class="glass-card">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h3 class="text-h6 mb-2">Import Results</h3>
                <p class="text-body-2 text-grey-lighten-1">
                  {{ importStats.successful }} of {{ importStats.total }} items imported successfully
                </p>
              </div>
              <div class="text-right">
                <div class="text-h5 font-weight-bold" :class="importStats.successful === importStats.total ? 'text-success' : 'text-warning'">
                  {{ importStats.successful }}/{{ importStats.total }}
                </div>
                <div v-if="importStats.failed > 0" class="text-caption text-error">
                  {{ importStats.failed }} failed
                </div>
              </div>
            </div>

            <v-divider class="my-4" />

            <div v-if="importStats.errors.length > 0" class="error-list">
              <h4 class="text-subtitle-2 mb-2 text-error">Errors:</h4>
              <v-alert
                v-for="(error, index) in importStats.errors.slice(0, 5)"
                :key="index"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-2"
              >
                <strong>{{ error.itemName || `Item ${error.index + 1}` }}:</strong> {{ error.message }}
              </v-alert>
              <p v-if="importStats.errors.length > 5" class="text-caption text-grey-lighten-1">
                ... and {{ importStats.errors.length - 5 }} more errors
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- How It Works -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card variant="outlined" class="glass-card">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-lightbulb-on" color="warning" class="mr-3" />
            How It Works
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <div class="step">
                  <v-icon icon="mdi-numeric-1-circle" color="primary" size="24" class="mb-2" />
                  <h4 class="text-subtitle-1 mb-2">Choose Item Type</h4>
                  <p class="text-body-2 text-grey-lighten-1">
                    Select the type of items you want to import from the cards below.
                  </p>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="step">
                  <v-icon icon="mdi-numeric-2-circle" color="primary" size="24" class="mb-2" />
                  <h4 class="text-subtitle-1 mb-2">Get AI Prompt</h4>
                  <p class="text-body-2 text-grey-lighten-1">
                    Click "Copy AI Prompt" and paste into ChatGPT to generate JSON data.
                  </p>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="step">
                  <v-icon icon="mdi-numeric-3-circle" color="primary" size="24" class="mb-2" />
                  <h4 class="text-subtitle-1 mb-2">Import Items</h4>
                  <p class="text-body-2 text-grey-lighten-1">
                    Click "Import Multiple" and paste the AI-generated JSON array.
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Item Type Import Options -->
    <div class="mb-6">
      <h2 class="text-h5 font-weight-bold mb-4">Choose Item Type to Import</h2>
      <v-row>
        <v-col
          v-for="itemType in availableItemTypes"
          :key="itemType"
          cols="12"
          sm="6"
          lg="4"
          xl="3"
        >
          <v-card
            variant="elevated"
            class="item-type-card glass-card"
            elevation="2"
          >
            <v-card-text class="text-center pa-6">
              <v-icon
                :icon="getItemTypeInfo(itemType).icon"
                :color="getItemTypeInfo(itemType).color"
                size="64"
                class="mb-3"
              />
              <h3 class="text-h6 font-weight-bold mb-2">
                {{ getItemTypeInfo(itemType).label }}
              </h3>
              <p class="text-caption text-grey-lighten-1 mb-4">
                Import multiple {{ getItemTypeInfo(itemType).label.toLowerCase() }}s at once
              </p>

              <div class="d-flex flex-column gap-3">
                <v-btn
                  variant="outlined"
                  :color="copiedPromptType === itemType ? 'success' : getItemTypeInfo(itemType).color"
                  @click="copyItemTypePrompt(itemType)"
                  prepend-icon="mdi-content-copy"
                  block
                >
                  {{ copiedPromptType === itemType ? 'Prompt Copied!' : 'Copy AI Prompt' }}
                </v-btn>

                <v-btn
                  variant="flat"
                  :color="getItemTypeInfo(itemType).color"
                  @click="openTypeImportDialog(itemType)"
                  prepend-icon="mdi-import"
                  block
                  size="large"
                >
                  Import Multiple {{ getItemTypeInfo(itemType).label }}s
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Type-Specific Import Dialog -->
    <library-item-json-import
      v-if="showTypeDialog"
      v-model="showTypeDialog"
      :item-type="showTypeDialog || undefined"
      :is-multiple-mode="true"
      @import="handleTypeImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { CreateLibraryItemPayload } from '@/types/item.types'
import { useItemComponents, type JsonImportSchema } from '@/composables/useItemComponents'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import LibraryItemJsonImport from '@/components/items/LibraryItemJsonImport.vue'

const route = useRoute()
const itemsStore = useItemsStore()
const toast = useToast()
const { getItemTypeInfo, getItemTypesForTemplate, getUniversalItemTypes, getJsonImportSchema } = useItemComponents()

const libraryId = computed(() => {
  const id = route.params.id || route.params.libraryId
  return id ? Number(id) : null
})

const showTypeDialog = ref<string | null>(null)
const copiedPromptType = ref<string | null>(null)

const availableItemTypes = computed(() => {
  const dndTypes = getItemTypesForTemplate('DND_5E')
  const universalTypes = getUniversalItemTypes()
  return [...dndTypes, ...universalTypes]
})

const breadcrumbItems = computed(() => [
  { title: 'Dashboard', to: { name: 'Dashboard' } },
  { title: currentLibraryName.value || 'Library', to: { name: 'Library', params: { id: libraryId.value } } },
  { title: 'JSON Import' }
])

const currentLibraryName = computed(() => {
  // This would come from a library store in real implementation
  return 'Library'
})

interface ImportError {
  index: number
  itemName?: string
  message: string
}

const importStats = ref({
  total: 0,
  successful: 0,
  failed: 0,
  errors: [] as ImportError[]
})

function openTypeImportDialog(itemType: string) {
  showTypeDialog.value = itemType
}

async function handleTypeImport(data: CreateLibraryItemPayload | CreateLibraryItemPayload[]) {
  if (!libraryId.value) {
    toast.error('Library ID not found')
    return
  }

  const currentType = showTypeDialog.value
  if (!currentType) return

  const items = Array.isArray(data) ? data : [data]

  // Auto-add the type field to each item
  const itemsWithType = items.map(item => ({
    ...item,
    type: currentType
  }))

  importStats.value = {
    total: itemsWithType.length,
    successful: 0,
    failed: 0,
    errors: []
  }

  const results = await Promise.allSettled(
    itemsWithType.map(async (item, index) => {
      try {
        await itemsStore.createItem(libraryId.value!, item)
        importStats.value.successful++
        return { success: true, index }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        importStats.value.errors.push({
          index,
          itemName: item.name,
          message
        })
        importStats.value.failed++
        return { success: false, index, error: message }
      }
    })
  )

  if (importStats.value.successful > 0) {
    toast.success(`Successfully imported ${importStats.value.successful} ${getItemTypeInfo(currentType).label}${importStats.value.successful > 1 ? 's' : ''}`)
  }

  if (importStats.value.failed > 0) {
    toast.error(`Failed to import ${importStats.value.failed} item${importStats.value.failed > 1 ? 's' : ''}`)
  }

  showTypeDialog.value = null

  // Reset stats after showing results for a while
  setTimeout(() => {
    importStats.value = { total: 0, successful: 0, failed: 0, errors: [] }
  }, 10000)
}

async function copyItemTypePrompt(itemType: string) {
  console.log('Copying prompt for item type:', itemType)
  const schema = getJsonImportSchema(itemType)
  console.log('Schema found:', schema)
  if (!schema) {
    console.error('No schema found for item type:', itemType)
    toast.error(`No schema found for ${itemType}`)
    return
  }

  const prompt = generateItemTypePrompt(schema)
  console.log('Generated prompt:', prompt.substring(0, 200) + '...')

  try {
    await navigator.clipboard.writeText(prompt)
    console.log('Successfully copied to clipboard')
    copiedPromptType.value = itemType
    toast.success(`Copied ${schema.title} prompt to clipboard`)
    setTimeout(() => {
      copiedPromptType.value = null
    }, 2000)
  } catch (error) {
    console.error('Failed to copy prompt with clipboard API:', error)
    // Fallback for older browsers or when clipboard API fails
    try {
      const textArea = document.createElement('textarea')
      textArea.value = prompt
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (success) {
        console.log('Fallback copy successful')
        copiedPromptType.value = itemType
        toast.success(`Copied ${schema.title} prompt to clipboard`)
        setTimeout(() => {
          copiedPromptType.value = null
        }, 2000)
      } else {
        console.error('Fallback copy also failed')
        toast.error('Failed to copy to clipboard')
      }
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError)
      toast.error('Failed to copy to clipboard')
    }
  }
}

function generateItemTypePrompt(schema: JsonImportSchema): string {
  const requiredFields = Object.entries(schema.schema)
    .filter(([_, desc]) => desc.includes('(required)'))
    .map(([field]) => field)

  const optionalFields = Object.entries(schema.schema)
    .filter(([_, desc]) => !desc.includes('(required)'))
    .map(([field]) => field)

  return `Please generate a JSON object for a ${schema.title} with the following specifications:

REQUIRED FIELDS:
${requiredFields.map(field => `- ${field}: ${schema.schema[field]}`).join('\n')}

OPTIONAL FIELDS:
${optionalFields.map(field => `- ${field}: ${schema.schema[field]}`).join('\n')}

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
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.page-header {
  padding-top: 24px;
}

.step {
  text-align: center;
  padding: 16px;
}

.step .v-icon {
  display: block;
  margin: 0 auto 8px;
}

.item-type-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.item-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.error-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
