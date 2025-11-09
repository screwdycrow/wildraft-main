<template>
  <item-form-layout
    :title="isEditMode ? 'Edit Character' : 'Create Character'"
    icon="mdi-account-circle"
    icon-color="#3498DB"
    :is-loading="isLoading"
    :save-button-text="isEditMode ? 'Save Changes' : 'Create Character'"
    :library-id="libraryId"
    :file-ids="formData.userFileIds"
    @update:file-ids="formData.userFileIds = $event"
    :featured-image-id="formData.featuredImageId"
    @update:featured-image-id="formData.featuredImageId = $event"
    :tag-ids="formData.tagIds"
    @update:tag-ids="formData.tagIds = $event"
    @submit="handleSubmit"
    @cancel="$emit('cancel')"
    @add-tag="showTagDialog = true"
    ref="layoutRef"
  >
    <template #tabs>
      <v-tabs
        v-model="activeTab"
        direction="vertical"
        color="primary"
        class="character-tabs"
      >
        <v-tab value="stats" prepend-icon="mdi-shield-account">
          <span class="text-caption">Stats & Skills</span>
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
        <v-tab value="inventory" prepend-icon="mdi-bag-personal">
          <span class="text-caption">Inventory</span>
        </v-tab>
        <v-tab value="description" prepend-icon="mdi-text">
          <span class="text-caption">Description</span>
        </v-tab>
      </v-tabs>
    </template>

    <template #content>
      <v-window v-model="activeTab">
        <!-- Stats & Skills Tab -->
        <v-window-item value="stats">
          <!-- Character Name -->
          <h3 class="text-h6 mb-4">Character Information</h3>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="formData.name"
            label="Character Name"
            :rules="[(v) => !!v || 'Name is required']"
            variant="outlined"
            required
          />
        </v-col>
      </v-row>

      <!-- Combat Stats: HP, AC, Speed -->
      <v-row>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="formData.data.hp"
            label="Current HP"
            type="number"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="formData.data.maxHp"
            label="Max HP"
            type="number"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="formData.data.ac"
            label="AC"
            type="number"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="formData.data.speed"
            label="Speed"
            variant="outlined"
            density="compact"
            placeholder="30 ft"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="formData.data.level"
            label="Level"
            :rules="[(v) => !!v || 'Level is required']"
            type="number"
            variant="outlined"
            density="compact"
            required
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="formData.data.experience"
            label="Experience"
            type="number"
            variant="outlined"
            density="compact"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="2">
          <v-text-field
            v-model.number="formData.data.initiative"
            label="Initiative"
            type="number"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="formData.data.resistances"
            label="Resistances"
            variant="outlined"
            density="compact"
            placeholder="e.g., fire, cold"
          />
        </v-col>
        <v-col cols="12" md="5">
          <v-text-field
            v-model="formData.data.immunities"
            label="Immunities"
            variant="outlined"
            density="compact"
            placeholder="e.g., poison, disease"
          />
        </v-col>
      </v-row>

      <!-- Race, Class, Subclass, Alignment, Background -->
      <v-row>
        <v-col cols="12" sm="6" md="2.4">
          <v-combobox
            v-model="formData.data.race"
            :items="DND5E_RACES"
            label="Race"
            :rules="[(v) => !!v || 'Race is required']"
            variant="outlined"
            required
          />
        </v-col>
        <v-col cols="12" sm="6" md="2.4">
          <v-combobox
            v-model="formData.data.class"
            :items="DND5E_CLASSES"
            label="Class"
            :rules="[(v) => !!v || 'Class is required']"
            variant="outlined"
            required
          />
        </v-col>
        <v-col cols="12" sm="6" md="2.4">
          <v-combobox
            v-model="formData.data.subclass"
            :items="[]"
            label="Subclass"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2.4">
          <v-combobox
            v-model="formData.data.alignment"
            :items="DND5E_ALIGNMENTS"
            label="Alignment"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" sm="6" md="2.4">
          <v-combobox
            v-model="formData.data.background"
            :items="DND5E_BACKGROUNDS"
            label="Background"
            variant="outlined"
          />
        </v-col>
      </v-row>

      <v-divider class="my-6" />

      <!-- Ability Scores, Saving Throws, and Skills Side by Side -->
      <h3 class="text-h6 mb-4">Stats & Skills</h3>
      
      <v-row>
        <!-- Left Column: Ability Scores & Saving Throws -->
        <v-col cols="12" md="5">
          <ability-scores-editor
            :data="formData.data"
            @update:data="Object.assign(formData.data, $event)"
            :proficiency-bonus="proficiencyBonus"
          />
        </v-col>

        <!-- Right Column: Skills -->
        <v-col cols="12" md="7">
          <h4 class="text-subtitle-1 font-weight-bold mb-3">Skills</h4>
          
          <v-row>
            <v-col
              v-for="skill in DND5E_SKILLS"
              :key="skill.name"
              cols="12"
              md="6"
            >
              <div class="skill-row">
                <div class="skill-proficiency-icons">
                  <v-icon
                    :icon="getSkillProficiency(skill.name) === 'expertise' ? 'mdi-checkbox-multiple-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                    :color="getSkillProficiency(skill.name) === 'expertise' ? 'purple' : 'grey'"
                    size="small"
                    @click="cycleSkillProficiency(skill.name, 'expertise')"
                    style="cursor: pointer;"
                    class="mr-1"
                  />
                  <v-icon
                    :icon="getSkillProficiency(skill.name) === 'proficient' || getSkillProficiency(skill.name) === 'expertise' ? 'mdi-checkbox-marked-circle' : 'mdi-checkbox-blank-circle-outline'"
                    :color="getSkillProficiency(skill.name) === 'proficient' ? 'primary' : getSkillProficiency(skill.name) === 'expertise' ? 'purple' : 'grey'"
                    size="small"
                    @click="cycleSkillProficiency(skill.name, 'proficient')"
                    style="cursor: pointer;"
                  />
                </div>
                <div class="skill-info">
                  <span class="skill-name">{{ skill.name }}</span>
                  <span class="skill-bonus">{{ formatModifier(calculateSkillBonusValue(skill)) }}</span>
                </div>
                <div class="skill-ability text-caption text-grey">
                  ({{ ABILITY_LABELS[skill.ability].substring(0, 3).toUpperCase() }})
                </div>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-divider class="my-6" />

        </v-window-item>

        <!-- Traits Tab -->
        <v-window-item value="traits">
          <h3 class="text-h6 mb-4">Traits & Features</h3>
          <trait-list-editor v-model="formData.data.traits" />
        </v-window-item>

        <!-- Actions Tab -->
        <v-window-item value="actions">
          <h3 class="text-h6 mb-4">Actions</h3>
          <action-list-editor v-model="formData.data.actions" />
        </v-window-item>

        <!-- Spells Tab -->
        <v-window-item value="spells">
          <h3 class="text-h6 mb-4">Spells</h3>
          
          <!-- Spell Slots Configuration -->
          <spell-slots-display
            :spell-slots="formData.data.spellSlots"
            :spells="formData.data.spells"
            @update:slots="formData.data.spellSlots = $event"
          />
          
          <!-- Spell List -->
          <spell-list-editor v-model="formData.data.spells" />
        </v-window-item>

        <!-- Inventory Tab -->
        <v-window-item value="inventory">
          <h3 class="text-h6 mb-4">Inventory & Gold</h3>
          
          <!-- Gold -->
          <v-text-field
            v-model.number="formData.data.gold"
            label="Gold (gp)"
            type="number"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-gold"
            class="mb-4"
            style="max-width: 300px;"
          />

          <!-- Inventory Items -->
          <inventory-item-list :items="formData.data.inventory || []" />
        </v-window-item>

        <!-- Description Tab -->
        <v-window-item value="description">
          <h3 class="text-h6 mb-2">Description & Notes</h3>
          <p class="text-caption text-grey-lighten-1 mb-4">
            Add appearance, personality, backstory, and other roleplay details.
          </p>
          <tip-tap-editor
            v-model="formData.description"
            placeholder="Describe your character..."
            min-height="400px"
          />
        </v-window-item>
      </v-window>
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
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, CharacterData } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import ItemFormLayout from '@/components/items/common/ItemFormLayout.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'
import TraitListEditor from '../common/TraitListEditor.vue'
import ActionListEditor from '../common/ActionListEditor.vue'
import SpellListEditor from '../common/SpellListEditor.vue'
import SpellSlotsDisplay from '../common/SpellSlotsDisplay.vue'
import AbilityScoresEditor from '../common/AbilityScoresEditor.vue'
import InventoryItemList from '../common/InventoryItemList.vue'
import {
  DND5E_RACES,
  DND5E_CLASSES,
  DND5E_ALIGNMENTS,
  DND5E_BACKGROUNDS,
  DND5E_SKILLS,
  ABILITY_LABELS,
} from '@/constants/dnd5e'
import {
  calculateProficiencyBonus,
  calculateSkillBonus,
  formatModifier,
  initializeSkills,
} from '@/composables/useDnd5eCalculations'

interface Props {
  item?: LibraryItem | null
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

const filesStore = useFilesStore()

const layoutRef = ref<InstanceType<typeof ItemFormLayout>>()
const isLoading = ref(false)
const showTagDialog = ref(false)
const activeTab = ref('stats')


const formData = ref<{
  name: string
  description: string
  data: CharacterData
  tagIds: number[]
  userFileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    level: 1,
    class: '',
    race: '',
    subclass: '',
    background: '',
    alignment: '',
    experience: 0,
    hp: 10,
    maxHp: 10,
    ac: 10,
    speed: '30 ft',
    initiative: 0,
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
    strSavingThrow: false,
    dexSavingThrow: false,
    conSavingThrow: false,
    intSavingThrow: false,
    wisSavingThrow: false,
    chaSavingThrow: false,
    spells: [],
    spellSlots: [],
    proficiencies: [],
    skills: initializeSkills(),
    traits: [],
    actions: [],
    gold: 0,
    inventory: [],
    quickNotes: '',
    resistances: '',
    immunities: '',
  },
  tagIds: [],
  userFileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

const proficiencyBonus = computed(() => 
  calculateProficiencyBonus(formData.value.data.level || 1)
)

function getSkillProficiency(skillName: string): 'none' | 'proficient' | 'expertise' {
  const skill = formData.value.data.skills?.find(s => s.name === skillName)
  if (!skill) return 'none'
  if (skill.expertise) return 'expertise'
  if (skill.proficient) return 'proficient'
  return 'none'
}

function cycleSkillProficiency(skillName: string, clickType: 'proficient' | 'expertise') {
  if (!formData.value.data.skills) {
    formData.value.data.skills = initializeSkills()
  }
  
  let skill = formData.value.data.skills.find(s => s.name === skillName)
  if (!skill) {
    const skillDef = DND5E_SKILLS.find(s => s.name === skillName)
    if (skillDef) {
      skill = {
        name: skillName,
        ability: skillDef.ability,
        proficient: false,
        expertise: false,
      }
      formData.value.data.skills.push(skill)
    }
  }
  
  if (!skill) return
  
  if (clickType === 'expertise') {
    // Cycle: none -> proficient -> expertise -> none
    if (skill.expertise) {
      skill.expertise = false
      skill.proficient = false
    } else if (skill.proficient) {
      skill.expertise = true
    } else {
      skill.proficient = true
    }
  } else {
    // Toggle proficiency
    if (skill.expertise) {
      skill.expertise = false
      skill.proficient = true
    } else {
      skill.proficient = !skill.proficient
    }
  }
}

function calculateSkillBonusValue(skillDef: typeof DND5E_SKILLS[0]): number {
  const abilityScore = formData.value.data[skillDef.ability] || 10
  const skill = formData.value.data.skills?.find(s => s.name === skillDef.name)
  
  return calculateSkillBonus(
    abilityScore,
    skill?.proficient || false,
    skill?.expertise || false,
    proficiencyBonus.value
  )
}

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    console.log('[CharacterForm] Loading item:', newItem)
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    
    // Properly initialize CharacterData with all required arrays
    const itemData = newItem.data as CharacterData
    formData.value.data = {
      level: itemData.level || 1,
      class: itemData.class || '',
      race: itemData.race || '',
      subclass: itemData.subclass || '',
      background: itemData.background || '',
      alignment: itemData.alignment || '',
      experience: itemData.experience || 0,
      hp: itemData.hp || 10,
      maxHp: itemData.maxHp || 10,
      ac: itemData.ac || 10,
      speed: itemData.speed || '30 ft',
      initiative: itemData.initiative ?? 0,
      str: itemData.str || 10,
      dex: itemData.dex || 10,
      con: itemData.con || 10,
      int: itemData.int || 10,
      wis: itemData.wis || 10,
      cha: itemData.cha || 10,
      strSavingThrow: itemData.strSavingThrow || false,
      dexSavingThrow: itemData.dexSavingThrow || false,
      conSavingThrow: itemData.conSavingThrow || false,
      intSavingThrow: itemData.intSavingThrow || false,
      wisSavingThrow: itemData.wisSavingThrow || false,
      chaSavingThrow: itemData.chaSavingThrow || false,
      // Ensure arrays are properly initialized
      skills: itemData.skills || initializeSkills(),
      spells: itemData.spells || [],
      traits: itemData.traits || [],
      actions: itemData.actions || [],
      spellSlots: itemData.spellSlots || [],
      proficiencies: itemData.proficiencies || [],
      gold: itemData.gold || 0,
      inventory: itemData.inventory || [],
      quickNotes: itemData.quickNotes || '',
      resistances: itemData.resistances || '',
      immunities: itemData.immunities || '',
    }
    
    console.log('[CharacterForm] Loaded data:', formData.value.data)
    console.log('[CharacterForm] Spells:', formData.value.data.spells)
    console.log('[CharacterForm] Traits:', formData.value.data.traits)
    console.log('[CharacterForm] Actions:', formData.value.data.actions)
    
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

// Debug watch for traits, actions, spells
watch(() => formData.value.data.traits, (newTraits) => {
  console.log('[CharacterForm] Traits changed:', newTraits)
}, { deep: true })

watch(() => formData.value.data.actions, (newActions) => {
  console.log('[CharacterForm] Actions changed:', newActions)
}, { deep: true })

watch(() => formData.value.data.spells, (newSpells) => {
  console.log('[CharacterForm] Spells changed:', newSpells)
}, { deep: true })

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await layoutRef.value!.formRef!.validate()
  if (!valid) return

  isLoading.value = true

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: formData.value.data,
    tagIds: formData.value.tagIds,
    userFileIds: formData.value.userFileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'CHARACTER_DND_5E' as const }),
  }

  console.log('Character Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (_success: boolean) => {
    isLoading.value = false
  })
}
</script>

<style scoped>
.skill-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
}

.skill-proficiency-icons {
  display: flex;
  gap: 4px;
}

.skill-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-name {
  font-size: 0.9rem;
}

.skill-bonus {
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
  min-width: 35px;
  text-align: right;
}

.skill-ability {
  min-width: 45px;
  text-align: right;
}

.character-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}
</style>

