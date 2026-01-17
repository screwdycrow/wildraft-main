<template>
  <div class="inventory-list">
    <div class="section-header">
      <v-icon icon="mdi-bag-personal" size="small" />
      <span>Inventory</span>
      <div class="header-actions">
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="primary"
          @click="showLibraryDialog = true"
        >
          <v-icon icon="mdi-library-plus" size="small" />
          <v-tooltip activator="parent" location="top">Add from Library</v-tooltip>
        </v-btn>
        <v-btn
          icon
          size="x-small"
          variant="text"
          color="primary"
          @click="addItem"
        >
          <v-icon icon="mdi-plus" size="small" />
          <v-tooltip activator="parent" location="top">Add Custom Item</v-tooltip>
        </v-btn>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="empty-state">
      No items yet
    </div>

    <!-- Items List -->
    <div v-else class="inventory-items">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="inventory-item"
        :class="{ expanded: expandedIndex === index, equipped: item.equipped }"
        @click="toggleExpand(index)"
      >
        <div class="inventory-header">
          <div class="inventory-main">
            <div class="equipped-indicator" @click.stop="toggleEquipped(index)">
              <v-icon
                :icon="item.equipped ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                :color="item.equipped ? 'success' : 'grey'"
                size="16"
              />
            </div>
            <span class="item-name">{{ item.name }}</span>
            <span v-if="item.quantity && item.quantity > 1" class="item-qty">×{{ item.quantity }}</span>
            <span v-if="item.weight" class="item-weight">{{ item.weight }} lb</span>
          </div>
          <v-btn
            icon
            size="x-small"
            variant="text"
            color="error"
            class="delete-btn"
            @click.stop="removeItem(index)"
          >
            <v-icon icon="mdi-close" size="14" />
          </v-btn>
        </div>
        
        <!-- Expanded Details -->
        <div v-if="expandedIndex === index" class="inventory-details" @click.stop>
          <div v-if="item.description" class="item-description" v-html="item.description" />
          
          <!-- Combat Properties -->
          <div v-if="item.toHit || item.dc || item.roll || item.range" class="item-combat mb-2">
            <div class="modifiers-label">Combat:</div>
            <div class="modifiers-list">
              <span v-if="item.toHit" class="modifier-badge hit">{{ item.toHit }} to hit</span>
              <span v-if="item.dc" class="modifier-badge dc">{{ item.dc }}</span>
              <span v-if="item.roll" class="modifier-badge damage">{{ item.roll }}</span>
              <span v-if="item.range" class="modifier-badge range">{{ item.range }}</span>
            </div>
          </div>
          
          <!-- Actions -->
          <div v-if="item.actions && item.actions.length > 0" class="item-granted-actions mb-2">
            <div class="modifiers-label">Actions:</div>
            <div v-for="(action, actionIdx) in item.actions" :key="actionIdx" class="action-entry">
              <div class="action-header">
                <span class="action-name">{{ action.name }}</span>
                <span class="action-type-badge">{{ action.actionType }}</span>
              </div>
              <div v-if="action.toHit || action.dc || action.roll" class="action-combat">
                <span v-if="action.toHit" class="modifier-badge hit">{{ action.toHit }}</span>
                <span v-if="action.dc" class="modifier-badge dc">{{ action.dc }}</span>
                <span v-if="action.roll" class="modifier-badge damage">{{ action.roll }}</span>
                <span v-if="action.range" class="modifier-badge range">{{ action.range }}</span>
              </div>
              <div v-if="action.description" class="action-desc" v-html="action.description" />
            </div>
          </div>
          
          <!-- Modifiers -->
          <div v-if="item.modifiers && hasModifiers(item.modifiers)" class="item-modifiers">
            <div class="modifiers-label">Modifiers when equipped:</div>
            <div class="modifiers-list">
              <span v-if="item.modifiers.ac" class="modifier-badge">AC +{{ item.modifiers.ac }}</span>
              <span v-if="item.modifiers.maxHp" class="modifier-badge">Max HP +{{ item.modifiers.maxHp }}</span>
              <span v-if="item.modifiers.speed" class="modifier-badge">Speed +{{ item.modifiers.speed }}ft</span>
              <span v-if="item.modifiers.str" class="modifier-badge">STR {{ formatModifier(item.modifiers.str) }}</span>
              <span v-if="item.modifiers.dex" class="modifier-badge">DEX {{ formatModifier(item.modifiers.dex) }}</span>
              <span v-if="item.modifiers.con" class="modifier-badge">CON {{ formatModifier(item.modifiers.con) }}</span>
              <span v-if="item.modifiers.int" class="modifier-badge">INT {{ formatModifier(item.modifiers.int) }}</span>
              <span v-if="item.modifiers.wis" class="modifier-badge">WIS {{ formatModifier(item.modifiers.wis) }}</span>
              <span v-if="item.modifiers.cha" class="modifier-badge">CHA {{ formatModifier(item.modifiers.cha) }}</span>
              <span v-if="item.modifiers.resistances" class="modifier-badge">Resist: {{ item.modifiers.resistances }}</span>
              <span v-if="item.modifiers.immunities" class="modifier-badge">Immune: {{ item.modifiers.immunities }}</span>
            </div>
          </div>
          <div class="item-actions-btns">
            <v-btn
              size="x-small"
              variant="text"
              color="primary"
              prepend-icon="mdi-pencil"
              @click.stop="editItem(index)"
            >
              Edit
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="650" scrollable>
      <v-card class="glass-card">
        <v-card-title class="d-flex align-center justify-space-between pa-3">
          <span class="text-subtitle-1">{{ editingIndex !== null ? 'Edit' : 'Add' }} Item</span>
          <v-btn icon="mdi-close" size="small" variant="text" @click="closeDialog" />
        </v-card-title>
        
        <v-tabs v-model="editingTab" density="compact" class="px-3">
          <v-tab value="basic">Basic</v-tab>
          <v-tab value="actions">Actions</v-tab>
          <v-tab value="modifiers">Modifiers</v-tab>
        </v-tabs>
        
        <v-card-text style="max-height: 60vh; overflow-y: auto;">
          <v-window v-model="editingTab">
            <!-- Basic Tab -->
            <v-window-item value="basic">
              <v-text-field
                v-model="editingItem.name"
                label="Name"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-3"
                autofocus
              />
              <div class="mb-3">
                <div class="text-caption text-grey mb-1">Description</div>
                <tip-tap-editor
                  v-model="editingDescription"
                  placeholder="Item description..."
                  min-height="100px"
                />
              </div>
              <v-row dense>
                <v-col cols="4">
                  <v-text-field
                    v-model.number="editingItem.quantity"
                    label="Qty"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model.number="editingItem.weight"
                    label="Weight"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    suffix="lb"
                  />
                </v-col>
                <v-col cols="4">
                  <v-checkbox
                    v-model="editingItem.equipped"
                    label="Equipped"
                    density="compact"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <div class="text-subtitle-2 mb-3">Quick Combat Display</div>
              <v-row dense>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model="editingItem.toHit"
                    label="To Hit"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="+5"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model="editingItem.dc"
                    label="DC"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="DC 15"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model="editingItem.roll"
                    label="Roll"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="2d6+3"
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field
                    v-model="editingItem.range"
                    label="Range"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="60ft"
                  />
                </v-col>
              </v-row>
            </v-window-item>
            
            <!-- Actions Tab -->
            <v-window-item value="actions">
              <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                Actions here will appear in Combat when the item is equipped. Use "character stats" for weapons that scale with the wielder.
              </v-alert>

              <!-- Actions Section -->
          <div v-if="editingActions.length > 0" class="mb-3">
            <v-card
              v-for="(action, index) in editingActions"
              :key="index"
              variant="outlined"
              class="mb-2 pa-2"
            >
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold">{{ action.name || 'New Action' }}</span>
                <v-btn
                  icon="mdi-delete"
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="removeEditingAction(index)"
                />
              </div>
              <v-row dense>
                <v-col cols="8">
                  <v-text-field
                    v-model="action.name"
                    label="Name"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                <v-col cols="4">
                  <v-select
                    v-model="action.actionType"
                    :items="actionTypeOptions"
                    label="Type"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </v-col>
                
                <!-- Toggle: Use Character Stats vs Custom -->
                <v-col cols="12">
                  <v-switch
                    v-model="action.useCharacterStats"
                    label="Use character stats for attack/damage"
                    density="compact"
                    hide-details
                    color="primary"
                    class="mt-1"
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
                      label="Item Bonus"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                      placeholder="+1"
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
                      label="Add ability to dmg"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                </template>
                
                <!-- Custom Values Mode -->
                <template v-else>
                  <v-col cols="3">
                    <v-text-field
                      v-model="action.toHit"
                      label="Hit"
                      variant="outlined"
                      density="compact"
                      hide-details
                      placeholder="+5"
                    />
                  </v-col>
                  <v-col cols="3">
                    <v-text-field
                      v-model="action.dc"
                      label="DC"
                      variant="outlined"
                      density="compact"
                      hide-details
                      placeholder="15"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="action.roll"
                      label="Damage Roll"
                      variant="outlined"
                      density="compact"
                      hide-details
                      placeholder="1d8+3 slashing"
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
            </v-card>
          </div>
              <v-btn
                prepend-icon="mdi-plus"
                variant="tonal"
                color="primary"
                size="small"
                @click="addEditingAction"
              >
                Add Action
              </v-btn>
            </v-window-item>
            
            <!-- Modifiers Tab -->
            <v-window-item value="modifiers">
              <p class="text-caption text-grey-lighten-1 mb-4">
                These bonuses apply when the item is equipped.
              </p>
          
          <v-expansion-panels variant="accordion" class="mb-3">
            <v-expansion-panel>
              <v-expansion-panel-title>Ability Score Modifiers</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.str"
                      label="STR"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.dex"
                      label="DEX"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.con"
                      label="CON"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.int"
                      label="INT"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.wis"
                      label="WIS"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.cha"
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
              <v-expansion-panel-title>Combat Modifiers</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.ac"
                      label="AC Bonus"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.maxHp"
                      label="Max HP Bonus"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.speed"
                      label="Speed Bonus (ft)"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.initiative"
                      label="Initiative Bonus"
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
              <v-expansion-panel-title>Saving Throw Modifiers</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row dense>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.savingThrowBonus"
                      label="All Saves Bonus"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.strSavingThrow"
                      label="STR Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.dexSavingThrow"
                      label="DEX Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.conSavingThrow"
                      label="CON Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.intSavingThrow"
                      label="INT Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.wisSavingThrow"
                      label="WIS Save"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="4">
                    <v-text-field
                      v-model.number="editingModifiers.chaSavingThrow"
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
              <v-expansion-panel-title>Resistances & Immunities</v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-text-field
                  v-model="editingModifiers.resistances"
                  label="Additional Resistances"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., fire, cold"
                  hint="Comma-separated list"
                  hide-details
                  class="mb-3"
                />
                <v-text-field
                  v-model="editingModifiers.immunities"
                  label="Additional Immunities"
                  variant="outlined"
                  density="compact"
                  placeholder="e.g., poison, disease"
                  hint="Comma-separated list"
                  hide-details
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" size="small" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" size="small" @click="saveItem">
            {{ editingIndex !== null ? 'Save' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Library Item Selection Dialog -->
    <v-dialog v-model="showLibraryDialog" max-width="800" scrollable>
      <v-card class="glass-card">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Add Item from Library</span>
          <v-btn icon="mdi-close" size="small" variant="text" @click="showLibraryDialog = false" />
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="librarySearchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search magic items..."
            variant="outlined"
            density="compact"
            hide-details
            class="mb-4"
            clearable
          />
          <div v-if="filteredLibraryItems.length === 0" class="text-center text-grey py-8">
            No magic items found
          </div>
          <div v-else class="library-items-list">
            <div
              v-for="libraryItem in filteredLibraryItems"
              :key="libraryItem.id"
              class="library-item-card"
              @click="addFromLibrary(libraryItem)"
            >
              <div class="library-item-header">
                <div class="library-item-name">{{ libraryItem.name }}</div>
                <v-chip
                  v-if="libraryItem.data?.rarity"
                  size="x-small"
                  :color="getRarityColor(libraryItem.data.rarity)"
                >
                  {{ libraryItem.data.rarity }}
                </v-chip>
              </div>
              <div v-if="libraryItem.data?.itemType" class="library-item-type">
                {{ libraryItem.data.itemType }}
              </div>
              <div v-if="libraryItem.description" class="library-item-desc text-caption">
                {{ truncateText(libraryItem.description, 100) }}
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { InventoryItem, ItemAction, ItemModifier } from '@/types/item.DND_5E.types'
import type { LibraryItem } from '@/types/item.types'
import { useItemsStore } from '@/stores/items'
import TipTapEditor from '@/components/common/TipTapEditor.vue'

interface Props {
  items: InventoryItem[]
  libraryId?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: []
}>()

const itemsStore = useItemsStore()
const showDialog = ref(false)
const showLibraryDialog = ref(false)
const editingIndex = ref<number | null>(null)
const expandedIndex = ref<number | null>(null)
const librarySearchQuery = ref('')
const editingTab = ref('basic')
const editingItem = ref<InventoryItem>({
  name: '',
  quantity: 1,
  weight: 0,
  equipped: false,
  modifiers: {},
})

// Computed property to ensure modifiers is always defined
const editingModifiers = computed(() => {
  if (!editingItem.value.modifiers) {
    editingItem.value.modifiers = {}
  }
  return editingItem.value.modifiers
})

// Computed property for description with getter/setter
const editingDescription = computed({
  get: () => editingItem.value.description || '',
  set: (value: string) => {
    editingItem.value.description = value || undefined
  }
})

// Computed property for actions with getter/setter
const editingActions = computed(() => {
  if (!editingItem.value.actions) {
    editingItem.value.actions = []
  }
  return editingItem.value.actions
})

const actionTypeOptions = [
  { title: 'Action', value: 'action' },
  { title: 'Bonus', value: 'bonus' },
  { title: 'Reaction', value: 'reaction' },
  { title: 'Legendary', value: 'legendary' },
]

const abilityOptions = [
  { title: 'Strength', value: 'str' },
  { title: 'Dexterity', value: 'dex' },
  { title: 'Constitution', value: 'con' },
  { title: 'Intelligence', value: 'int' },
  { title: 'Wisdom', value: 'wis' },
  { title: 'Charisma', value: 'cha' },
]

function addEditingAction() {
  if (!editingItem.value.actions) {
    editingItem.value.actions = []
  }
  editingItem.value.actions.push({
    name: '',
    actionType: 'action',
    description: '',
    useCharacterStats: true, // Default to using character stats
    abilityModifier: 'str',
    proficient: true,
    addAbilityToDamage: true,
  })
}

function removeEditingAction(index: number) {
  editingItem.value.actions?.splice(index, 1)
}

function hasModifiers(modifiers: ItemModifier): boolean {
  return Object.values(modifiers).some(
    value => value !== undefined && value !== null && value !== '' && value !== 0
  )
}

// Get magic items from library
const libraryItems = computed(() => {
  if (!props.libraryId) return []
  return itemsStore.items.filter((item: LibraryItem) => 
    item.type === 'ITEM_DND_5E' && item.libraryId === props.libraryId
  )
})

const filteredLibraryItems = computed(() => {
  let items = [...libraryItems.value]
  
  if (librarySearchQuery.value) {
    const query = librarySearchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.data?.itemType?.toLowerCase().includes(query)
    )
  }
  
  return items.sort((a, b) => a.name.localeCompare(b.name))
})

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    common: 'grey',
    uncommon: 'green',
    rare: 'blue',
    'very rare': 'purple',
    legendary: 'orange',
    artifact: 'red',
  }
  return colors[rarity] || 'grey'
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function toggleExpand(index: number) {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

function addItem() {
  editingIndex.value = null
  editingItem.value = {
    name: '',
    quantity: 1,
    weight: 0,
    equipped: false,
    modifiers: {},
    actions: [],
  }
  editingTab.value = 'basic'
  showDialog.value = true
}

function addFromLibrary(libraryItem: LibraryItem) {
  const itemData = libraryItem.data as any
  const newItem: InventoryItem = {
    name: libraryItem.name,
    description: libraryItem.description || undefined,
    quantity: 1,
    weight: itemData?.weight || 0,
    equipped: false,
    libraryItemId: libraryItem.id,
    modifiers: itemData?.modifiers || undefined,
    // Combat properties from library item
    toHit: itemData?.toHit || undefined,
    dc: itemData?.dc || undefined,
    roll: itemData?.roll || itemData?.damage || undefined,
    range: itemData?.range || undefined,
    // Actions from library item
    actions: itemData?.actions ? itemData.actions.map((a: ItemAction) => ({ ...a })) : undefined,
  }
  props.items.push(newItem)
  emit('update')
  showLibraryDialog.value = false
  librarySearchQuery.value = ''
}

function editItem(index: number) {
  editingIndex.value = index
  const item = props.items[index]
  editingItem.value = { 
    ...item,
    modifiers: item.modifiers ? { ...item.modifiers } : {},
    actions: item.actions ? item.actions.map((a: ItemAction) => ({ ...a })) : [],
  }
  editingTab.value = 'basic'
  showDialog.value = true
}

function saveItem() {
  if (!editingItem.value.name.trim()) return

  // Clean up modifiers - remove if empty
  const itemToSave = { ...editingItem.value }
  if (itemToSave.modifiers) {
    const hasAnyModifiers = Object.values(itemToSave.modifiers).some(
      value => value !== undefined && value !== null && value !== '' && value !== 0
    )
    if (!hasAnyModifiers) {
      delete itemToSave.modifiers
    }
  }

  // Clean up actions - remove empty ones and delete if none remain
  if (itemToSave.actions) {
    itemToSave.actions = itemToSave.actions.filter((a: ItemAction) => a.name?.trim())
    if (itemToSave.actions.length === 0) {
      delete itemToSave.actions
    }
  }

  // Clean up empty combat properties
  if (!itemToSave.toHit?.trim()) delete itemToSave.toHit
  if (!itemToSave.dc?.trim()) delete itemToSave.dc
  if (!itemToSave.roll?.trim()) delete itemToSave.roll
  if (!itemToSave.range?.trim()) delete itemToSave.range

  if (editingIndex.value !== null) {
    Object.assign(props.items[editingIndex.value], itemToSave)
  } else {
    props.items.push(itemToSave)
  }

  emit('update')
  closeDialog()
}

function removeItem(index: number) {
  props.items.splice(index, 1)
  emit('update')
}

function toggleEquipped(index: number) {
  props.items[index].equipped = !props.items[index].equipped
  emit('update')
}

function closeDialog() {
  showDialog.value = false
  editingIndex.value = null
}
</script>

<style scoped>
.inventory-list {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-actions {
  display: flex;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
  font-size: 0.8rem;
  opacity: 0.5;
}

.inventory-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inventory-item {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.inventory-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.inventory-item.expanded {
  background: rgba(255, 255, 255, 0.04);
}

.inventory-item.equipped {
  border-left: 3px solid rgb(var(--v-theme-success));
}

.inventory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.inventory-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.equipped-indicator {
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
  flex-shrink: 0;
}

.equipped-indicator:hover {
  background: rgba(255, 255, 255, 0.1);
}

.item-name {
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.item-qty {
  font-size: 0.7rem;
  opacity: 0.6;
  white-space: nowrap;
}

.item-weight {
  font-size: 0.7rem;
  opacity: 0.5;
  white-space: nowrap;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.inventory-item:hover .delete-btn {
  opacity: 0.7;
}

.delete-btn:hover {
  opacity: 1 !important;
}

.inventory-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  max-height: 200px;
  overflow-y: auto;
}

.inventory-details::-webkit-scrollbar {
  width: 4px;
}

.inventory-details::-webkit-scrollbar-track {
  background: transparent;
}

.inventory-details::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.inventory-details::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.item-description {
  font-size: 0.85rem;
  line-height: 1.6;
  opacity: 0.85;
  margin-bottom: 12px;
}

.item-modifiers {
  margin-bottom: 12px;
}

.modifiers-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.5;
  margin-bottom: 6px;
}

.modifiers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.modifier-badge {
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.item-actions-btns {
  display: flex;
  gap: 8px;
}

.item-combat {
  margin-bottom: 8px;
}

.item-granted-actions {
  margin-bottom: 8px;
}

.action-entry {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

.action-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.action-name {
  font-weight: 600;
  font-size: 0.8rem;
}

.action-type-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-combat {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 0.75rem;
  opacity: 0.8;
  line-height: 1.4;
}

.modifier-badge.hit {
  background: rgba(var(--v-theme-success), 0.2);
  color: rgb(var(--v-theme-success));
}

.modifier-badge.dc {
  background: rgba(var(--v-theme-warning), 0.2);
  color: rgb(var(--v-theme-warning));
}

.modifier-badge.damage {
  background: rgba(var(--v-theme-error), 0.2);
  color: rgb(var(--v-theme-error));
}

.modifier-badge.range {
  background: rgba(var(--v-theme-info), 0.2);
  color: rgb(var(--v-theme-info));
}

/* Library Dialog */
.library-items-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.library-item-card {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.library-item-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.library-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.library-item-name {
  font-weight: 500;
  font-size: 0.9rem;
  flex: 1;
}

.library-item-type {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-bottom: 4px;
}

.library-item-desc {
  opacity: 0.7;
  line-height: 1.4;
}
</style>
