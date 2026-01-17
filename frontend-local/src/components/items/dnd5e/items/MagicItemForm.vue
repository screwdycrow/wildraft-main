<template>
  <item-form-layout
    :title="isEditMode ? 'Edit Magic Item' : 'Create Magic Item'"
    icon="mdi-treasure-chest"
    icon-color="#F39C12"
    :is-loading="isLoading"
    :save-button-text="isEditMode ? 'Save Changes' : 'Create Item'"
    :library-id="libraryId"
    :file-ids="formData.userFileIds"
    @update:file-ids="formData.userFileIds = $event"
    :featured-image-id="formData.featuredImageId"
    @update:featured-image-id="formData.featuredImageId = $event"
    :tag-ids="formData.tagIds"
    @update:tag-ids="formData.tagIds = $event"
    :item-type="itemType"
    :item="item"
    :hide-header="hideHeader"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
    @add-tag="showTagDialog = true"
    @json-import="handleJsonImport"
    ref="layoutRef"
  >
    <template #tabs>
      <v-tabs
        v-model="activeTab"
        direction="vertical"
        color="primary"
        class="magic-item-tabs"
      >
        <v-tab value="basic" prepend-icon="mdi-information">
          <span class="text-caption">Basic Info</span>
        </v-tab>
        <v-tab value="actions" prepend-icon="mdi-sword">
          <span class="text-caption">Actions</span>
        </v-tab>
        <v-tab value="modifiers" prepend-icon="mdi-tune">
          <span class="text-caption">Modifiers</span>
        </v-tab>
        <v-tab value="description" prepend-icon="mdi-text">
          <span class="text-caption">Description</span>
        </v-tab>
      </v-tabs>
    </template>

    <template #content>
      <v-window v-model="activeTab">
        <!-- Basic Info Tab -->
        <v-window-item value="basic">
          <h3 class="text-h6 mb-4">Basic Information</h3>
          <v-text-field
            v-model="formData.name"
            label="Item Name"
            :rules="[(v) => !!v || 'Name is required']"
            variant="outlined"
            required
          />

          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.data.rarity"
                :items="rarityOptions"
                label="Rarity"
                :rules="[(v) => !!v || 'Rarity is required']"
                variant="outlined"
                required
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-combobox
                v-model="formData.data.itemType"
                :items="itemTypeOptions"
                label="Item Type"
                :rules="[(v) => !!v || 'Item type is required']"
                variant="outlined"
                required
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="formData.data.attunement"
            label="Requires Attunement"
            color="purple"
            hide-details
            inset
            class="mb-6"
          />

          <v-divider class="my-6" />

          <h3 class="text-h6 mb-4">Properties</h3>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.data.value"
                label="Value"
                variant="outlined"
                placeholder="e.g., 500 gp"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="formData.data.weight"
                label="Weight"
                type="number"
                variant="outlined"
                suffix="lb"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="formData.data.damage"
                label="Damage"
                variant="outlined"
                placeholder="e.g., 1d8"
              />
            </v-col>
          </v-row>

          <v-combobox
            v-model="formData.data.properties"
            label="Weapon Properties"
            variant="outlined"
            multiple
            chips
            closable-chips
            :items="weaponPropertyOptions"
            placeholder="e.g., Finesse, Light, Thrown"
          />

          <v-divider class="my-6" />

          <h3 class="text-h6 mb-4">Combat Display (Quick Reference)</h3>
          <p class="text-caption text-grey-lighten-1 mb-4">
            These are display values for quick reference. For actual combat, use the Actions tab.
          </p>
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.data.toHit"
                label="To Hit"
                variant="outlined"
                density="compact"
                placeholder="+7"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.data.dc"
                label="Save DC"
                variant="outlined"
                density="compact"
                placeholder="DC 15 DEX"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.data.roll"
                label="Damage Roll"
                variant="outlined"
                density="compact"
                placeholder="2d6+3 fire"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="formData.data.range"
                label="Range"
                variant="outlined"
                density="compact"
                placeholder="60ft"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Actions Tab -->
        <v-window-item value="actions">
          <h3 class="text-h6 mb-4">Item Actions</h3>
          <p class="text-caption text-grey-lighten-1 mb-4">
            Actions granted by this item appear in the character's Combat tab when equipped.
            For weapons, enable "Use character stats" to auto-calculate attack/damage.
          </p>
          
          <div v-if="formActions.length > 0" class="mb-4">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="(action, index) in formActions"
                :key="index"
                class="mb-2"
              >
                <v-expansion-panel-title>
                  <div class="d-flex align-center justify-space-between" style="width: 100%;">
                    <div class="d-flex align-center gap-2">
                      <v-icon 
                        :icon="getActionTypeIcon(action.actionType)" 
                        size="small"
                        :color="getActionTypeColor(action.actionType)"
                      />
                      <strong>{{ action.name || 'New Action' }}</strong>
                      <v-chip
                        v-if="action.useCharacterStats"
                        size="x-small"
                        color="primary"
                        variant="tonal"
                      >
                        Uses Stats
                      </v-chip>
                    </div>
                    <v-btn
                      icon="mdi-delete"
                      color="error"
                      variant="text"
                      size="small"
                      @click.stop="removeAction(index)"
                    />
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="action.name"
                        label="Action Name"
                        variant="outlined"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="action.actionType"
                        :items="actionTypeOptions"
                        label="Action Type"
                        variant="outlined"
                        density="compact"
                        hide-details
                      />
                    </v-col>
                    
                    <v-col cols="12">
                      <v-switch
                        v-model="action.useCharacterStats"
                        label="Use character's stats (auto-calculate toHit/damage)"
                        density="compact"
                        hide-details
                        color="primary"
                        class="mt-2"
                      />
                    </v-col>
                    
                    <!-- Character Stats Mode -->
                    <template v-if="action.useCharacterStats">
                      <v-col cols="6" md="4">
                        <v-select
                          v-model="action.abilityModifier"
                          :items="abilityOptions"
                          label="Ability"
                          variant="outlined"
                          density="compact"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          v-model.number="action.itemBonus"
                          label="Magic Bonus"
                          type="number"
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="+1, +2..."
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-checkbox
                          v-model="action.proficient"
                          label="Proficient"
                          density="compact"
                          hide-details
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          v-model="action.damageDice"
                          label="Damage Dice"
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="1d8"
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          v-model="action.damageType"
                          label="Damage Type"
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="slashing"
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-checkbox
                          v-model="action.addAbilityToDamage"
                          label="Add ability to damage"
                          density="compact"
                          hide-details
                        />
                      </v-col>
                    </template>
                    
                    <!-- Fixed Values Mode -->
                    <template v-else>
                      <v-col cols="6" md="4">
                        <v-text-field
                          v-model="action.toHit"
                          label="To Hit"
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="+5"
                        />
                      </v-col>
                      <v-col cols="6" md="4">
                        <v-text-field
                          v-model="action.dc"
                          label="Save DC"
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="DC 15"
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <v-text-field
                          v-model="action.roll"
                          label="Damage Roll"
                          variant="outlined"
                          density="compact"
                          hide-details
                          placeholder="2d6+3 fire"
                        />
                      </v-col>
                    </template>
                    
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="action.range"
                        label="Range"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="5ft / 60ft"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="action.description"
                        label="Description"
                        variant="outlined"
                        density="compact"
                        rows="2"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          
          <v-btn
            prepend-icon="mdi-plus"
            variant="tonal"
            color="primary"
            @click="addAction"
          >
            Add Action
          </v-btn>
        </v-window-item>

        <!-- Modifiers Tab -->
        <v-window-item value="modifiers">
          <h3 class="text-h6 mb-4">Equipment Modifiers</h3>
          <p class="text-caption text-grey-lighten-1 mb-4">
            These bonuses apply when the item is equipped.
          </p>
          
          <v-expansion-panels variant="accordion" class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-arm-flex" size="small" class="mr-2" />
                Ability Score Modifiers
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.str"
                      label="STR"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.dex"
                      label="DEX"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.con"
                      label="CON"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.int"
                      label="INT"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.wis"
                      label="WIS"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.cha"
                      label="CHA"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-shield" size="small" class="mr-2" />
                Combat Modifiers
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model.number="formModifiers.ac"
                      label="AC Bonus"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model.number="formModifiers.maxHp"
                      label="Max HP"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model.number="formModifiers.speed"
                      label="Speed (ft)"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field
                      v-model.number="formModifiers.initiative"
                      label="Initiative"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-dice-d20" size="small" class="mr-2" />
                Saving Throw Modifiers
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formModifiers.savingThrowBonus"
                      label="All Saves"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.strSavingThrow"
                      label="STR Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.dexSavingThrow"
                      label="DEX Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.conSavingThrow"
                      label="CON Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.intSavingThrow"
                      label="INT Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.wisSavingThrow"
                      label="WIS Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="formModifiers.chaSavingThrow"
                      label="CHA Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon icon="mdi-shield-half-full" size="small" class="mr-2" />
                Resistances & Immunities
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-text-field
                  v-model="formModifiers.resistances"
                  label="Resistances"
                  variant="outlined"
                  density="compact"
                  placeholder="fire, cold, lightning"
                  hint="Comma-separated"
                  persistent-hint
                  class="mb-3"
                />
                <v-text-field
                  v-model="formModifiers.immunities"
                  label="Immunities"
                  variant="outlined"
                  density="compact"
                  placeholder="poison, disease"
                  hint="Comma-separated"
                  persistent-hint
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-window-item>

        <!-- Description Tab -->
        <v-window-item value="description">
          <h3 class="text-h6 mb-2">Description & Lore</h3>
          <p class="text-caption text-grey-lighten-1 mb-4">
            Add detailed lore, history, appearance, or usage information.
          </p>
          <tip-tap-editor
            v-model="formData.description"
            placeholder="Describe the item's appearance, history, and lore..."
            min-height="400px"
            :library-id="libraryId"
            :library-item-id="item?.id || null"
            :user-file-ids="formData.userFileIds"
            :user-files="item?.userFiles || []"
            @update:user-file-ids="formData.userFileIds = $event"
          />
        </v-window-item>
      </v-window>
    </template>

    <template #sidebar>
      <div class="sidebar-section">
        <h3 class="text-subtitle-1 font-weight-bold mb-2 d-flex align-center">
          <v-icon icon="mdi-paperclip" size="small" class="mr-2" />
          Quick Upload
        </h3>
        <p class="text-caption text-grey-lighten-1 mb-3">
          Drop files to attach to this item.
        </p>
        <drag-drop-upload
          compact
          @uploaded="handleFileUploaded"
        />
      </div>
    </template>
  </item-form-layout>

  <!-- Tag Creation Dialog -->
  <tag-creation-dialog
    v-model="showTagDialog"
    :library-id="libraryId"
    @created="handleTagCreated"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, ItemData, ItemType } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'
import DragDropUpload from '@/components/files/DragDropUpload.vue'
import type { UserFile } from '@/api/files'

interface Props {
  item?: LibraryItem | null
  libraryId: number
  itemType: ItemType
  initialTagIds?: number[]
  hideHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hideHeader: false,
})

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

const filesStore = useFilesStore()

const layoutRef = ref<InstanceType<typeof ItemFormLayout>>()
const isLoading = ref(false)
const showTagDialog = ref(false)
const activeTab = ref('basic')

const formData = ref<{
  name: string
  description: string
  data: ItemData
  tagIds: number[]
  userFileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    rarity: 'common',
    itemType: '',
    attunement: false,
    value: '',
    weight: undefined,
    damage: '',
    properties: [],
    modifiers: {},
    actions: [],
  },
  tagIds: props.initialTagIds ? [...props.initialTagIds] : [],
  userFileIds: [],
  featuredImageId: null,
})

const rarityOptions = [
  { title: 'Common', value: 'common' },
  { title: 'Uncommon', value: 'uncommon' },
  { title: 'Rare', value: 'rare' },
  { title: 'Very Rare', value: 'very rare' },
  { title: 'Legendary', value: 'legendary' },
  { title: 'Artifact', value: 'artifact' },
]

const itemTypeOptions = [
  'Weapon',
  'Armor',
  'Shield',
  'Wondrous Item',
  'Ring',
  'Rod',
  'Staff',
  'Wand',
  'Potion',
  'Scroll',
]

const weaponPropertyOptions = [
  'Finesse',
  'Light',
  'Heavy',
  'Two-Handed',
  'Versatile',
  'Thrown',
  'Ammunition',
  'Loading',
  'Reach',
  'Special',
]

const isEditMode = computed(() => !!props.item)

// Computed property to ensure modifiers is always defined
const formModifiers = computed(() => {
  if (!formData.value.data.modifiers) {
    formData.value.data.modifiers = {}
  }
  return formData.value.data.modifiers
})

// Computed property to ensure actions is always an array
const formActions = computed(() => {
  if (!formData.value.data.actions) {
    formData.value.data.actions = []
  }
  return formData.value.data.actions
})

const actionTypeOptions = [
  { title: 'Action', value: 'action' },
  { title: 'Bonus Action', value: 'bonus' },
  { title: 'Reaction', value: 'reaction' },
  { title: 'Legendary Action', value: 'legendary' },
]

const abilityOptions = [
  { title: 'Strength', value: 'str' },
  { title: 'Dexterity', value: 'dex' },
  { title: 'Constitution', value: 'con' },
  { title: 'Intelligence', value: 'int' },
  { title: 'Wisdom', value: 'wis' },
  { title: 'Charisma', value: 'cha' },
]

function addAction() {
  if (!formData.value.data.actions) {
    formData.value.data.actions = []
  }
  formData.value.data.actions.push({
    name: '',
    actionType: 'action',
    description: '',
    useCharacterStats: true,
    abilityModifier: 'str',
    proficient: true,
    addAbilityToDamage: true,
  })
}

function removeAction(index: number) {
  formData.value.data.actions?.splice(index, 1)
}

function getActionTypeIcon(type: string): string {
  switch (type) {
    case 'action': return 'mdi-sword'
    case 'bonus': return 'mdi-lightning-bolt'
    case 'reaction': return 'mdi-shield'
    case 'legendary': return 'mdi-star'
    default: return 'mdi-sword-cross'
  }
}

function getActionTypeColor(type: string): string {
  switch (type) {
    case 'action': return 'primary'
    case 'bonus': return 'success'
    case 'reaction': return 'warning'
    case 'legendary': return 'purple'
    default: return 'grey'
  }
}

// Watch for initialTagIds changes (for when dialog opens with preselected tags)
watch(() => props.initialTagIds, (newTagIds) => {
  if (!props.item) {
    if (newTagIds && newTagIds.length > 0) {
      const sortedNew = [...newTagIds].sort()
      const sortedCurrent = [...formData.value.tagIds].sort()
      if (JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew)) {
        formData.value.tagIds = [...newTagIds]
      }
    } else if (!newTagIds || newTagIds.length === 0) {
      if (formData.value.tagIds.length > 0) {
        formData.value.tagIds = []
      }
    }
  }
}, { immediate: true })

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

function handleFileUploaded(file: UserFile) {
  if (!formData.value.userFileIds.includes(file.id)) {
    formData.value.userFileIds.push(file.id)
  }
}

function handleJsonImport(importData: CreateLibraryItemPayload, options?: { importDescription?: boolean }) {
  formData.value.name = importData.name
  
  if (options?.importDescription !== false) {
    formData.value.description = importData.description || ''
  }

  const itemData = importData.data || importData
  if (typeof itemData === 'object' && itemData !== null) {
    Object.assign(formData.value.data, {
      rarity: itemData.rarity || 'common',
      itemType: itemData.itemType || '',
      attunement: itemData.attunement || false,
      value: itemData.value || '',
      weight: itemData.weight || undefined,
      damage: itemData.damage || '',
      properties: Array.isArray(itemData.properties) ? itemData.properties : [],
      effect: itemData.effect || '',
      modifiers: itemData.modifiers || {},
      actions: itemData.actions || [],
      toHit: itemData.toHit || '',
      dc: itemData.dc || '',
      roll: itemData.roll || '',
      range: itemData.range || '',
    })
  }

  console.log('[MagicItemForm] JSON import applied:', formData.value)
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { 
      ...newItem.data,
      modifiers: (newItem.data as ItemData)?.modifiers || {},
      actions: (newItem.data as ItemData)?.actions || [],
    } as ItemData
    formData.value.tagIds = newItem.tags?.map(t => t.id) || []
    
    if (newItem.userFiles && newItem.userFiles.length > 0) {
      filesStore.addFiles(newItem.userFiles)
      formData.value.userFileIds = newItem.userFiles.map(f => f.id)
    } else {
      formData.value.userFileIds = []
    }
    
    if (newItem.featuredImage) {
      filesStore.addFiles(newItem.featuredImage)
      formData.value.featuredImageId = newItem.featuredImage.id
    } else {
      formData.value.featuredImageId = null
    }
  }
}, { immediate: true })

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await layoutRef.value!.formRef!.validate()
  if (!valid) return

  isLoading.value = true

  // Clean up data object
  const cleanData: Record<string, any> = {}
  Object.keys(formData.value.data).forEach(key => {
    const value = formData.value.data[key as keyof ItemData]
    if (Array.isArray(value)) {
      cleanData[key] = value
    } else if (value !== undefined && value !== null && value !== '') {
      cleanData[key] = value
    }
  })

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: cleanData,
    tagIds: formData.value.tagIds,
    userFileIds: formData.value.userFileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'ITEM_DND_5E' as const }),
  }

  console.log('Magic Item Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (success: boolean) => {
    isLoading.value = false
  })
}
</script>

<style scoped>
.magic-item-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}

.sidebar-section {
  margin-bottom: 24px;
}

.gap-2 {
  gap: 8px;
}
</style>
