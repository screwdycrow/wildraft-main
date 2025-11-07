<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-card class="glass-card mb-4 form-container" elevation="0">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center  form-actions-sticky px-6">
        <v-icon icon="mdi-sword-cross" color="#E74C3C" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Stat Block' : 'Create Stat Block' }}
        <v-spacer />
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('cancel')" />
        <v-btn icon="mdi-check" size="small" variant="text" @click="handleSubmit" :loading="isLoading" />
      </v-card-title>

      <v-row no-gutters class="form-row-content">
        <!-- Vertical Tabs -->
        <v-col cols="2" class="border-e">
          <v-tabs
            v-model="activeTab"
            direction="vertical"
            color="primary"
            class="stat-block-tabs"
          >
            <v-tab value="basic" prepend-icon="mdi-information">
              <span class="text-caption">Basic & Stats</span>
            </v-tab>
            <v-tab value="traits" prepend-icon="mdi-star-circle">
              <span class="text-caption">Traits</span>
            </v-tab>
            <v-tab value="actions" prepend-icon="mdi-sword">
              <span class="text-caption">Actions</span>
            </v-tab>
            <v-tab value="spells" prepend-icon="mdi-auto-fix">
              <span class="text-caption">Spells</span>
            </v-tab>
            <v-tab value="description" prepend-icon="mdi-text">
              <span class="text-caption">Description</span>
            </v-tab>
            <v-tab value="files" prepend-icon="mdi-paperclip">
              <span class="text-caption">Files</span>
            </v-tab>
          </v-tabs>
          
          <v-divider class="my-4" />
          
          <!-- Tags Selector at bottom -->
          <div class="px-4">
            <tag-selector
              v-model="formData.tagIds"
              :library-id="libraryId"
              hint=""
              show-add-button
              @add-tag="showTagDialog = true"
            />
          </div>
        </v-col>

        <!-- Content Area -->
        <v-col cols="10">
          <v-card-text class="pa-6 form-content-scrollable">
            <v-window v-model="activeTab">
              <!-- Basic Info & Stats Tab -->
              <v-window-item value="basic">
                <h3 class="text-h6 mb-4">Basic Information</h3>
                
                <v-row>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="formData.name"
                      label="Creature Name"
                      :rules="[(v) => !!v || 'Name is required']"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="formData.data.cr"
                      label="Challenge Rating"
                      :rules="[(v) => !!v || 'CR is required']"
                      variant="outlined"
                      placeholder="e.g., 1/2, 5, 20"
                      required
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="formData.data.size"
                      :items="sizeOptions"
                      label="Size"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="formData.data.type"
                      label="Creature Type"
                      variant="outlined"
                      placeholder="e.g., humanoid, dragon"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="formData.data.alignment"
                      :items="alignmentOptions"
                      label="Alignment"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <!-- Show More Section -->
                <v-expansion-panels class="mb-4">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      <v-icon icon="mdi-chevron-down" class="mr-2" />
                      Additional Info (Languages & Senses)
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="formData.data.languages"
                            label="Languages"
                            variant="outlined"
                            placeholder="e.g., Common, Elvish"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="formData.data.senses"
                            label="Senses"
                            variant="outlined"
                            placeholder="e.g., darkvision 60 ft."
                            density="comfortable"
                          />
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-divider class="my-6" />

                <!-- Core Stats -->
                <h3 class="text-h6 mb-4">Core Statistics</h3>
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.ac"
                      label="Armor Class"
                      :rules="[(v) => !!v || 'AC is required']"
                      type="number"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.hp"
                      label="Hit Points"
                      :rules="[(v) => !!v || 'HP is required']"
                      type="number"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="formData.data.speed"
                      label="Speed"
                      :rules="[(v) => !!v || 'Speed is required']"
                      variant="outlined"
                      placeholder="e.g., 30 ft."
                      required
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-divider class="my-6" />

                <!-- Ability Scores -->
                <h3 class="text-h6 mb-4">Ability Scores</h3>
                <v-row>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.str"
                      label="STR"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.dex"
                      label="DEX"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.con"
                      label="CON"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.int"
                      label="INT"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.wis"
                      label="WIS"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.cha"
                      label="CHA"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

              </v-window-item>

              <!-- Traits Tab -->
              <v-window-item value="traits">
                <div class="d-flex align-center mb-4">
                  <h3 class="text-h6">Traits</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addTrait"
                  >
                    Add Trait
                  </v-btn>
                </div>

                <p class="text-caption text-grey-lighten-1 mb-4">
                  Passive abilities like Keen Senses, Pack Tactics, or special resistances.
                </p>

                <v-expansion-panels v-if="formData.data.traits && formData.data.traits.length > 0">
                  <v-expansion-panel
                    v-for="(trait, index) in formData.data.traits"
                    :key="'trait-' + index"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center w-100">
                        <v-icon icon="mdi-star-circle" class="mr-2" color="warning" />
                        <span class="font-weight-bold">{{ trait.name || 'Unnamed Trait' }}</span>
                        <v-spacer />
                        <v-btn
                          icon="mdi-delete"
                          size="x-small"
                          variant="text"
                          color="error"
                          @click.stop="removeTrait(index)"
                        />
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-text-field
                        v-model="trait.name"
                        label="Trait Name"
                        variant="outlined"
                        density="comfortable"
                        class="mb-3"
                      />
                      <v-textarea
                        v-model="trait.description"
                        label="Description"
                        variant="outlined"
                        rows="3"
                      />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-alert v-else type="info" variant="tonal">
                  No traits added yet. Click "Add Trait" to create a new passive ability.
                </v-alert>
              </v-window-item>

              <!-- Actions Tab -->
              <v-window-item value="actions">
                <div class="d-flex align-center mb-4">
                  <h3 class="text-h6">Actions</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addAction"
                  >
                    Add Action
                  </v-btn>
                </div>

                <p class="text-caption text-grey-lighten-1 mb-4">
                  Combat actions including attacks, spells, and special abilities.
                </p>

                <!-- Actions by Type -->
                <div v-if="formData.data.actions && formData.data.actions.length > 0">
                  <!-- Regular Actions -->
                  <div v-if="actionsByType.action.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">
                      <v-icon icon="mdi-sword" size="small" class="mr-1" />
                      Actions
                    </h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.action"
                        :key="'action-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Action' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Bonus Actions -->
                  <div v-if="actionsByType.bonus.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">
                      <v-icon icon="mdi-flash" size="small" class="mr-1" />
                      Bonus Actions
                    </h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.bonus"
                        :key="'bonus-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Bonus Action' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Reactions -->
                  <div v-if="actionsByType.reaction.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">
                      <v-icon icon="mdi-shield-alert" size="small" class="mr-1" />
                      Reactions
                    </h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.reaction"
                        :key="'reaction-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Reaction' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Legendary Actions -->
                  <div v-if="actionsByType.legendary.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">
                      <v-icon icon="mdi-crown" size="small" class="mr-1" />
                      Legendary Actions
                    </h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.legendary"
                        :key="'legendary-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Legendary Action' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </div>

                <v-alert v-else type="info" variant="tonal">
                  No actions added yet. Click "Add Action" to create a new combat action.
                </v-alert>
              </v-window-item>

              <!-- Spells Tab -->
              <v-window-item value="spells">
                <h3 class="text-h6 mb-4">Spellcasting</h3>

                <!-- Spell Slots -->
                <v-card class="glass-card mb-4" variant="outlined">
                  <v-card-title class="text-subtitle-1">
                    <v-icon icon="mdi-cards-diamond" class="mr-2" />
                    Spell Slots
                  </v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col
                        v-for="level in 9"
                        :key="'slot-' + level"
                        cols="4"
                        md="2"
                      >
                        <div class="text-center">
                          <div class="text-caption text-grey">Level {{ level }}</div>
                          <v-text-field
                            v-model.number="getOrCreateSpellSlot(level).max"
                            type="number"
                            variant="outlined"
                            density="compact"
                            hide-details
                            placeholder="0"
                          />
                        </div>
                      </v-col>
                    </v-row>
                    <v-alert type="info" variant="tonal" density="compact" class="mt-3">
                      Only set slots for spell levels this creature can cast. Leave others at 0.
                    </v-alert>
                  </v-card-text>
                </v-card>

                <!-- Spells List -->
                <div class="d-flex align-center mb-4">
                  <h4 class="text-subtitle-1">Known Spells</h4>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addSpell"
                  >
                    Add Spell
                  </v-btn>
                </div>

                <p class="text-caption text-grey-lighten-1 mb-4">
                  Add spells that this creature knows or can cast.
                </p>

                <div v-if="spellsByLevel && Object.keys(spellsByLevel).length > 0">
                  <!-- Cantrips -->
                  <div v-if="spellsByLevel[0] && spellsByLevel[0].length > 0" class="mb-4">
                    <h5 class="text-body-1 font-weight-bold mb-2">
                      <v-icon icon="mdi-circle-small" size="small" />
                      Cantrips
                    </h5>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(spell, index) in spellsByLevel[0]"
                        :key="'cantrip-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-medium">{{ spell.spell.name || 'Unnamed Spell' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeSpell(spell.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <spell-form-fields :spell="spell.spell" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Leveled Spells -->
                  <div
                    v-for="level in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                    :key="'level-' + level"
                  >
                    <div v-if="spellsByLevel[level] && spellsByLevel[level].length > 0" class="mb-4">
                      <h5 class="text-body-1 font-weight-bold mb-2">
                        <v-icon icon="mdi-numeric-{{ level }}-circle" size="small" />
                        Level {{ level }}
                      </h5>
                      <v-expansion-panels>
                        <v-expansion-panel
                          v-for="(spell, index) in spellsByLevel[level]"
                          :key="'spell-' + level + '-' + index"
                        >
                          <v-expansion-panel-title>
                            <div class="d-flex align-center w-100">
                              <span class="font-weight-medium">{{ spell.spell.name || 'Unnamed Spell' }}</span>
                              <v-spacer />
                              <v-btn
                                icon="mdi-delete"
                                size="x-small"
                                variant="text"
                                color="error"
                                @click.stop="removeSpell(spell.originalIndex)"
                              />
                            </div>
                          </v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <spell-form-fields :spell="spell.spell" />
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </div>
                  </div>
                </div>

                <v-alert v-else type="info" variant="tonal">
                  No spells added yet. Click "Add Spell" to add spellcasting abilities.
                </v-alert>
              </v-window-item>

              <!-- Description Tab -->
              <v-window-item value="description">
                <h3 class="text-h6 mb-3">Creature Description</h3>
                <p class="text-caption text-grey-lighten-1 mb-4">
                  Add lore, habitat information, combat tactics, or any additional narrative details about this creature.
                </p>
                <tip-tap-editor
                  v-model="formData.description"
                  placeholder="Describe the creature's appearance, behavior, habitat, and tactics..."
                  min-height="500px"
                />
              </v-window-item>

              <!-- Files Tab -->
              <v-window-item value="files">
                <h3 class="text-h6 mb-3">Attached Files</h3>
                <p class="text-caption text-grey-lighten-1 mb-4">
                  Upload creature artwork, token images, or related reference materials.
                </p>
                <file-attachment-selector v-model="formData.fileIds" />
                
                <v-divider class="my-6" />
                
                <featured-image-selector
                  v-model="formData.featuredImageId"
                  :file-ids="formData.fileIds"
                />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-col>
      </v-row>

      <v-divider />

    </v-card>

    <!-- Tag Creation Dialog -->
    <tag-creation-dialog
      v-model="showTagDialog" 
      :library-id="libraryId"
      @created="handleTagCreated"
    />
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, StatBlockData, Action, Trait, Spell, SpellSlot } from '@/types/item.types'
import TagSelector from '@/components/tags/TagSelector.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import FileAttachmentSelector from '@/components/items/common/FileAttachmentSelector.vue'
import FeaturedImageSelector from '@/components/items/common/FeaturedImageSelector.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'
import ActionFormFields from './ActionFormFields.vue'
import SpellFormFields from './SpellFormFields.vue'

interface Props {
  item?: LibraryItem | null
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)
const activeTab = ref('basic')
const showTagDialog = ref(false)

const sizeOptions = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']
const alignmentOptions = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Unaligned',
]

const formData = ref<{
  name: string
  description: string
  data: StatBlockData
  tagIds: number[]
  fileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    cr: '',
    hp: 0,
    ac: 0,
    speed: '',
    str: undefined,
    dex: undefined,
    con: undefined,
    int: undefined,
    wis: undefined,
    cha: undefined,
    size: '',
    type: '',
    alignment: '',
    languages: '',
    senses: '',
    actions: [],
    traits: [],
    spells: [],
    spellSlots: [],
  },
  tagIds: [],
  fileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

// Group actions by type
const actionsByType = computed(() => {
  const grouped: Record<string, Array<{ action: any; originalIndex: number }>> = {
    action: [],
    bonus: [],
    reaction: [],
    legendary: [],
  }

  formData.value.data.actions?.forEach((action, index) => {
    const type = action.actionType || 'action'
    grouped[type].push({ action, originalIndex: index })
  })

  return grouped
})

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { ...newItem.data } as StatBlockData
    formData.value.tagIds = newItem.tags?.map(t => t.id) || []
    formData.value.fileIds = newItem.userFiles?.map(f => f.id) || []
    formData.value.featuredImageId = newItem.featuredImageId || null
    
    // Ensure arrays exist
    if (!formData.value.data.actions) formData.value.data.actions = []
    if (!formData.value.data.traits) formData.value.data.traits = []
    if (!formData.value.data.spells) formData.value.data.spells = []
    if (!formData.value.data.spellSlots) formData.value.data.spellSlots = []
  }
}, { immediate: true })

// Trait management
const addTrait = () => {
  formData.value.data.traits!.push({ name: '', description: '' })
}

const removeTrait = (index: number) => {
  formData.value.data.traits!.splice(index, 1)
}

// Action management
const addAction = () => {
  formData.value.data.actions!.push({ 
    name: '', 
    actionType: 'action',
    description: '', 
    roll: '', 
    range: '' 
  })
}

const removeAction = (index: number) => {
  formData.value.data.actions!.splice(index, 1)
}

// Spell management
const addSpell = () => {
  formData.value.data.spells!.push({
    name: '',
    level: 0,
    description: '',
    school: '',
    castingTime: '',
    range: '',
    components: '',
    duration: '',
    concentration: false,
    ritual: false,
  })
}

const removeSpell = (index: number) => {
  formData.value.data.spells!.splice(index, 1)
}

// Get or create spell slot for a level
const getOrCreateSpellSlot = (level: number): SpellSlot => {
  let slot = formData.value.data.spellSlots!.find(s => s.level === level)
  if (!slot) {
    slot = { level, max: 0, remaining: 0 }
    formData.value.data.spellSlots!.push(slot)
  }
  return slot
}

// Group spells by level
const spellsByLevel = computed(() => {
  const grouped: Record<number, Array<{ spell: Spell; originalIndex: number }>> = {}
  
  formData.value.data.spells?.forEach((spell, index) => {
    const level = spell.level || 0
    if (!grouped[level]) {
      grouped[level] = []
    }
    grouped[level].push({ spell, originalIndex: index })
  })
  
  return grouped
})

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  // Clean up data object - remove undefined/null/empty values except for arrays
  const cleanData: Record<string, any> = {}
  Object.keys(formData.value.data).forEach(key => {
    const value = formData.value.data[key as keyof StatBlockData]
    if (Array.isArray(value)) {
      // Always include arrays even if empty
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
    fileIds: formData.value.fileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'STAT_BLOCK_DND_5E' as const }),
  }

  console.log('Stat Block Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (success: boolean) => {
    isLoading.value = false
    if (success) {
      // Form will be closed by parent
    }
  })
}
</script>

<style scoped>
.stat-block-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}

.stat-block-tabs :deep(.v-tab--selected) {
  background: rgba(220, 20, 60, 0.15);
  border-right: 3px solid #DC143C;
}

.border-e {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.form-container {
  display: flex;
  flex-direction: column;
}

.form-row-content {
  flex: 1;
}

.form-content-scrollable {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 24px;
}

.form-actions-sticky {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}
</style>
