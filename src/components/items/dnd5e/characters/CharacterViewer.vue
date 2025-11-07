<template>
  <div class="character-viewer">
    <!-- Character Header -->
    <div class="character-header glass-card pa-4 mb-4">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold">{{ character.name }}</h1>
          <p class="text-subtitle-1 text-grey-lighten-1">
            Level {{ characterData.level }} {{ characterData.race }} {{ characterData.class }}
            <span v-if="characterData.subclass"> ({{ characterData.subclass }})</span>
          </p>
        </div>
        <v-btn
          icon="mdi-pencil"
          variant="text"
          @click="$emit('edit')"
        />
      </div>
    </div>

    <!-- Core Stats -->
    <v-row class="mb-4">
      <!-- Ability Scores -->
      <v-col cols="12" md="6">
        <v-card class="glass-card">
          <v-card-title class="text-h6">Ability Scores</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col v-for="ability in abilities" :key="ability.key" cols="4" sm="2">
                <div class="ability-score text-center">
                  <div class="ability-label text-caption text-grey">{{ ability.label }}</div>
                  <div class="ability-value text-h5 font-weight-bold">
                    {{ characterData[ability.key] || 10 }}
                  </div>
                  <div class="ability-modifier text-body-2">
                    {{ formatModifier(calculateModifier(characterData[ability.key] || 10)) }}
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Combat Stats -->
      <v-col cols="12" md="6">
        <v-card class="glass-card">
          <v-card-title class="text-h6">Combat Stats</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="stat-label text-caption text-grey">Hit Points</div>
                  <div class="d-flex align-center gap-2">
                    <v-text-field
                      v-model.number="currentHp"
                      type="number"
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="max-width: 80px;"
                      @blur="updateHitPoints"
                    />
                    <span class="text-h6">/ {{ characterData.maxHp || characterData.hp }}</span>
                  </div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="stat-label text-caption text-grey">Armor Class</div>
                  <div class="stat-value text-h4">{{ characterData.ac || 10 }}</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="stat-label text-caption text-grey">Initiative</div>
                  <div class="stat-value text-h4">
                    {{ formatModifier(calculateModifier(characterData.dex || 10)) }}
                  </div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="stat-box">
                  <div class="stat-label text-caption text-grey">Speed</div>
                  <div class="stat-value text-h4">{{ characterData.speed || '30 ft.' }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Left Column: Saving Throws -->
      <v-col cols="12" md="3">
        <v-card class="glass-card mb-4">
          <v-card-title class="text-h6">Saving Throws</v-card-title>
          <v-card-text>
            <div v-for="ability in abilities" :key="'save-' + ability.key" class="save-item mb-2">
              <div class="d-flex justify-space-between">
                <span>{{ ability.label }}</span>
                <span class="font-weight-bold">
                  {{ formatModifier(calculateModifier(characterData[ability.key] || 10)) }}
                </span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Middle Column: Senses -->
      <v-col cols="12" md="3">
        <v-card class="glass-card mb-4">
          <v-card-title class="text-h6">Senses</v-card-title>
          <v-card-text>
            <p class="text-body-2">{{ characterData.senses || 'Normal vision' }}</p>
          </v-card-text>
        </v-card>

        <v-card class="glass-card">
          <v-card-title class="text-h6">Languages</v-card-title>
          <v-card-text>
            <p class="text-body-2">{{ characterData.languages || 'Common' }}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column: Skills & Proficiencies -->
      <v-col cols="12" md="6">
        <v-card class="glass-card mb-4">
          <v-card-title class="text-h6">Skills</v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col v-for="skill in characterData.skills || []" :key="skill.name" cols="6">
                <div class="d-flex justify-space-between align-center">
                  <span :class="{ 'font-weight-bold': skill.proficient }">
                    <v-icon
                      v-if="skill.expertise"
                      icon="mdi-star"
                      size="x-small"
                      color="gold"
                      class="mr-1"
                    />
                    <v-icon
                      v-else-if="skill.proficient"
                      icon="mdi-checkbox-marked-circle"
                      size="x-small"
                      color="primary"
                      class="mr-1"
                    />
                    {{ skill.name }}
                  </span>
                  <span class="text-caption">{{ formatModifier(skill.bonus || 0) }}</span>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="glass-card">
          <v-card-title class="text-h6">Proficiencies</v-card-title>
          <v-card-text>
            <v-chip-group column>
              <v-chip
                v-for="prof in characterData.proficiencies || []"
                :key="prof.name"
                size="small"
                variant="outlined"
              >
                {{ prof.name }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bottom Sections -->
    <v-row class="mt-4">
      <!-- Left: Tabbed Content (Actions, Spells, Items) -->
      <v-col cols="12" lg="6">
        <v-card class="glass-card interactive-section">
          <v-tabs v-model="activeTab" bg-color="transparent">
            <v-tab value="actions">Actions</v-tab>
            <v-tab value="spells">Spells</v-tab>
            <v-tab value="items">Items</v-tab>
          </v-tabs>

          <v-card-text style="max-height: 600px; overflow-y: auto;">
            <v-window v-model="activeTab">
              <!-- Actions Tab -->
              <v-window-item value="actions">
                <div v-if="actionsByType.action.length > 0">
                  <h4 class="text-subtitle-1 mb-2">Actions</h4>
                  <action-display
                    v-for="(item, idx) in actionsByType.action"
                    :key="'action-' + idx"
                    :action="item.action"
                  />
                </div>

                <div v-if="actionsByType.bonus.length > 0" class="mt-4">
                  <h4 class="text-subtitle-1 mb-2">Bonus Actions</h4>
                  <action-display
                    v-for="(item, idx) in actionsByType.bonus"
                    :key="'bonus-' + idx"
                    :action="item.action"
                  />
                </div>

                <div v-if="actionsByType.reaction.length > 0" class="mt-4">
                  <h4 class="text-subtitle-1 mb-2">Reactions</h4>
                  <action-display
                    v-for="(item, idx) in actionsByType.reaction"
                    :key="'reaction-' + idx"
                    :action="item.action"
                  />
                </div>

                <div v-if="!characterData.actions || characterData.actions.length === 0">
                  <p class="text-grey text-center py-4">No actions available</p>
                </div>
              </v-window-item>

              <!-- Spells Tab -->
              <v-window-item value="spells">
                <div v-if="characterData.spellSlots && characterData.spellSlots.length > 0" class="mb-4">
                  <h4 class="text-subtitle-1 mb-2">Spell Slots</h4>
                  <v-row dense>
                    <v-col
                      v-for="slot in characterData.spellSlots"
                      :key="'slot-' + slot.level"
                      cols="6"
                      sm="4"
                      md="3"
                    >
                      <div class="spell-slot-box">
                        <div class="text-caption">Level {{ slot.level }}</div>
                        <div class="d-flex align-center gap-1">
                          <v-text-field
                            v-model.number="slot.remaining"
                            type="number"
                            density="compact"
                            variant="outlined"
                            hide-details
                            style="max-width: 50px;"
                            @blur="updateSpellSlots"
                          />
                          <span>/ {{ slot.max }}</span>
                        </div>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <div v-for="(spells, level) in spellsByLevel" :key="'spell-level-' + level" class="mt-4">
                  <h4 class="text-subtitle-1 mb-2">
                    {{ level === 0 ? 'Cantrips' : `Level ${level}` }}
                  </h4>
                  <spell-display
                    v-for="(item, idx) in spells"
                    :key="'spell-' + level + '-' + idx"
                    :spell="item.spell"
                  />
                </div>

                <div v-if="!characterData.spells || characterData.spells.length === 0">
                  <p class="text-grey text-center py-4">No spells known</p>
                </div>
              </v-window-item>

              <!-- Items Tab -->
              <v-window-item value="items">
                <div class="items-list">
                  <div
                    v-for="(item, idx) in characterData.items || []"
                    :key="'item-' + idx"
                    class="item-entry mb-3 pa-3 rounded"
                    style="background: rgba(255, 255, 255, 0.05);"
                  >
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="font-weight-bold">{{ item.title }}</span>
                      <div class="d-flex gap-2">
                        <span v-if="item.uses" class="text-caption">Uses: {{ item.uses }}</span>
                        <span v-if="item.gold" class="text-caption">{{ item.gold }} gp</span>
                      </div>
                    </div>
                    <p v-if="item.description" class="text-caption text-grey-lighten-1">
                      {{ item.description }}
                    </p>
                  </div>
                </div>

                <!-- Add Item Button -->
                <v-btn
                  block
                  variant="outlined"
                  prepend-icon="mdi-plus"
                  class="mt-2"
                  @click="showAddItemDialog = true"
                >
                  Add Item
                </v-btn>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right: Features & Description -->
      <v-col cols="12" lg="6">
        <v-card class="glass-card">
          <v-tabs v-model="descTab" bg-color="transparent">
            <v-tab value="features">Features</v-tab>
            <v-tab value="description">Description</v-tab>
            <v-tab value="notes">Notes</v-tab>
          </v-tabs>

          <v-card-text style="max-height: 600px; overflow-y: auto;">
            <v-window v-model="descTab">
              <!-- Features Tab -->
              <v-window-item value="features">
                <div v-for="(trait, idx) in characterData.traits || []" :key="'trait-' + idx" class="mb-4">
                  <h4 class="text-subtitle-1 font-weight-bold">{{ trait.name }}</h4>
                  <p class="text-body-2 text-grey-lighten-1">{{ trait.description }}</p>
                </div>
                <div v-if="!characterData.traits || characterData.traits.length === 0">
                  <p class="text-grey text-center py-4">No features available</p>
                </div>
              </v-window-item>

              <!-- Description Tab -->
              <v-window-item value="description">
                <div v-html="character.description || '<p class=\'text-grey text-center py-4\'>No description</p>'" />
              </v-window-item>

              <!-- Notes Tab -->
              <v-window-item value="notes">
                <v-textarea
                  v-model="notes"
                  placeholder="Add notes about this character..."
                  variant="outlined"
                  rows="10"
                  @blur="updateNotes"
                />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add Item Dialog -->
    <v-dialog v-model="showAddItemDialog" max-width="500">
      <v-card class="glass-card">
        <v-card-title>Add Item</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newItem.title"
            label="Item Name"
            variant="outlined"
            class="mb-3"
          />
          <v-textarea
            v-model="newItem.description"
            label="Description"
            variant="outlined"
            rows="3"
            class="mb-3"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="newItem.uses"
                label="Uses"
                type="number"
                variant="outlined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="newItem.gold"
                label="Gold Value"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAddItemDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="addItem">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LibraryItem, CharacterData, Action, Spell } from '@/types/item.types'
import ActionDisplay from './ActionDisplay.vue'
import SpellDisplay from './SpellDisplay.vue'

interface Props {
  character: LibraryItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: []
  update: [data: Partial<CharacterData>]
}>()

const characterData = computed(() => props.character.data as CharacterData)

const activeTab = ref('actions')
const descTab = ref('features')
const currentHp = ref(characterData.value.hp || 0)
const notes = ref('')
const showAddItemDialog = ref(false)
const newItem = ref({
  title: '',
  description: '',
  uses: 1,
  gold: '',
})

const abilities = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'WIS' },
  { key: 'cha', label: 'CHA' },
]

const actionsByType = computed(() => {
  const grouped: Record<string, Array<{ action: Action; originalIndex: number }>> = {
    action: [],
    bonus: [],
    reaction: [],
    legendary: [],
  }

  characterData.value.actions?.forEach((action, index) => {
    const type = action.actionType || 'action'
    grouped[type].push({ action, originalIndex: index })
  })

  return grouped
})

const spellsByLevel = computed(() => {
  const grouped: Record<number, Array<{ spell: Spell; originalIndex: number }>> = {}

  characterData.value.spells?.forEach((spell, index) => {
    const level = spell.level || 0
    if (!grouped[level]) {
      grouped[level] = []
    }
    grouped[level].push({ spell, originalIndex: index })
  })

  return grouped
})

function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function updateHitPoints() {
  emit('update', { hp: currentHp.value })
}

function updateSpellSlots() {
  emit('update', { spellSlots: characterData.value.spellSlots })
}

function updateNotes() {
  // Would store notes in a separate field or system
  console.log('Update notes:', notes.value)
}

function addItem() {
  const items = [...(characterData.value.items || []), { ...newItem.value }]
  emit('update', { items })
  
  newItem.value = {
    title: '',
    description: '',
    uses: 1,
    gold: '',
  }
  showAddItemDialog.value = false
}

watch(() => props.character, () => {
  currentHp.value = characterData.value.hp || 0
}, { immediate: true })
</script>

<style scoped>
.character-viewer {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}

.ability-score {
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.ability-label {
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 4px;
}

.ability-modifier {
  color: #3498DB;
  font-weight: 600;
}

.stat-box {
  padding: 12px;
  text-align: center;
}

.stat-label {
  margin-bottom: 4px;
}

.stat-value {
  font-weight: bold;
  color: #3498DB;
}

.save-item {
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
}

.interactive-section {
  min-height: 400px;
}

.spell-slot-box {
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  text-align: center;
}

@media (max-width: 960px) {
  .character-viewer {
    padding: 8px;
  }
}
</style>

