<template>
  <div class="stat-block-detail" :style="backgroundImageStyle">
    <page-top-bar
      :title="item.name"
      icon="mdi-sword-cross"
      icon-color="#E74C3C"
      :description="headerDescriptionSimple"
    >
      <template #actions>
        <div class="d-flex align-center gap-2">
          <v-tooltip location="bottom">
            <template #activator="{ props }">
              <v-icon v-bind="props" icon="mdi-information-outline" size="small" color="primary" />
            </template>
            <div class="stat-info-tooltip">
              <div v-if="statBlockData.ac" class="tooltip-item">
                <v-icon icon="mdi-shield" size="small" class="mr-1" /> 
                <strong>AC:</strong> {{ statBlockData.ac }}
              </div>
              <div v-if="statBlockData.hp" class="tooltip-item">
                <v-icon icon="mdi-heart" size="small" class="mr-1" /> 
                <strong>HP:</strong> {{ statBlockData.hp }}
              </div>
              <div v-if="statBlockData.speed" class="tooltip-item">
                <v-icon icon="mdi-run" size="small" class="mr-1" /> 
                <strong>Speed:</strong> {{ statBlockData.speed }}
              </div>
              <div v-if="statBlockData.senses" class="tooltip-item">
                <v-icon icon="mdi-eye" size="small" class="mr-1" /> 
                <strong>Senses:</strong> {{ statBlockData.senses }}
              </div>
              <div v-if="statBlockData.languages" class="tooltip-item">
                <v-icon icon="mdi-translate" size="small" class="mr-1" /> 
                <strong>Languages:</strong> {{ statBlockData.languages }}
              </div>
            </div>
          </v-tooltip>
        </div>
      </template>
    </page-top-bar>

    <v-row class="detail-row">
      <!-- Left Column -->
      <v-col cols="12" md="9" class="main-column">
        <!-- Core Stats -->
        <v-row class="mb-4 core-stats-row">
          <v-col cols="6" md="3">
            <v-card class="glass-card text-center stat-card" elevation="0">
              <v-card-text class="stat-card-content">
                <v-icon icon="mdi-shield" class="stat-icon" color="primary" />
                <div class="stat-value">{{ statBlockData.ac || '?' }}</div>
                <div class="stat-label">Armor Class</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="glass-card text-center stat-card" elevation="0">
              <v-card-text class="stat-card-content">
                <v-icon icon="mdi-heart" class="stat-icon" color="error" />
                <div class="stat-value">{{ statBlockData.hp || '?' }}</div>
                <div class="stat-label">Hit Points</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="glass-card text-center stat-card" elevation="0">
              <v-card-text class="stat-card-content">
                <v-icon icon="mdi-run-fast" class="stat-icon" color="success" />
                <div class="stat-value">{{ statBlockData.speed || '?' }}</div>
                <div class="stat-label">Speed</div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card class="glass-card text-center stat-card" elevation="0">
              <v-card-text class="stat-card-content">
                <v-icon icon="mdi-crosshairs" class="stat-icon" color="info" />
                <div class="stat-value">{{ initiativeDisplay }}</div>
                <div class="stat-label">Initiative</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Ability Scores & Saving Throws -->
        <ability-scores-display
          :data="statBlockData"
          :proficiency-bonus="statBlockProficiencyBonus"
        />

    


        <!-- Actions -->
        <action-list-display v-model="statBlockData.actions" :editable="canEdit" @update:model-value="updateActions" />

        <!-- Spells -->
        <spell-list-display v-model="statBlockData.spells" :editable="canEdit" @update:model-value="updateSpells" />
        
        <!-- Traits -->
        <trait-list-display v-model="statBlockData.traits" :editable="canEdit" @update:model-value="updateTraits" />
            <!-- Description -->
            <v-card v-if="item.description" class="glass-card mb-4" elevation="0">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-text" class="mr-2" />
            Description
          </v-card-title>
          <v-card-text>{{ item.description }}</v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="3" class="sidebar-column">
        <custom-counters-display
          :counters="statBlockData.customCounters"
          :editable="false"
        />

        <v-card class="glass-card mb-4" elevation="0">
          <v-card-title class="text-subtitle-2 d-flex align-center">
            <v-icon icon="mdi-shield-half-full" size="small" class="mr-2" />
            Resistances
          </v-card-title>
          <v-card-text class="text-body-2">
            <span v-if="resistancesDisplay">{{ resistancesDisplay }}</span>
            <span v-else class="text-grey">None</span>
          </v-card-text>
        </v-card>

        <v-card class="glass-card mb-4" elevation="0">
          <v-card-title class="text-subtitle-2 d-flex align-center">
            <v-icon icon="mdi-shield-off" size="small" class="mr-2" />
            Immunities
          </v-card-title>
          <v-card-text class="text-body-2">
            <span v-if="immunitiesDisplay">{{ immunitiesDisplay }}</span>
            <span v-else class="text-grey">None</span>
          </v-card-text>
        </v-card>

        <v-card v-if="statBlockData.size || statBlockData.type" class="glass-card mb-4" elevation="0">
          <v-card-title class="text-subtitle-2 d-flex align-center">
            <v-icon icon="mdi-id-card" size="small" class="mr-2" />
            Creature Info
          </v-card-title>
          <v-card-text class="text-body-2">
            <div v-if="statBlockData.size"><strong>Size:</strong> {{ statBlockData.size }}</div>
            <div v-if="statBlockData.type"><strong>Type:</strong> {{ statBlockData.type }}</div>
            <div v-if="statBlockData.alignment"><strong>Alignment:</strong> {{ statBlockData.alignment }}</div>
          </v-card-text>
        </v-card>

        <!-- Tags -->
        <v-card v-if="item.tags && item.tags.length > 0" class="glass-card mb-4" elevation="0">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-tag-multiple" class="mr-2" />
            Tags
          </v-card-title>
          <v-card-text>
            <v-chip
              v-for="tag in item.tags"
              :key="tag.id"
              :color="tag.color"
              class="mr-2 mb-2"
            >
              <v-icon icon="mdi-tag" size="small" class="mr-1" />
              {{ tag.name }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- Attached Files -->
        <attached-files-grid
          :file-ids="fileIds"
          :featured-image-id="item.featuredImage?.id"
          :columns="1"
          :read-only="true"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LibraryItem, StatBlockData } from '@/types/item.types'
import PageTopBar from '@/components/common/PageTopBar.vue'
import { useFilesStore } from '@/stores/files'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import TraitListDisplay from '../common/TraitListDisplay.vue'
import ActionListDisplay from '../common/ActionListDisplay.vue'
import SpellListDisplay from '../common/SpellListDisplay.vue'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'
import CustomCountersDisplay from '../common/CustomCountersDisplay.vue'
import AbilityScoresDisplay from '../common/AbilityScoresDisplay.vue'
import { calculateStatBlockProficiencyBonus } from '@/composables/useDnd5eCalculations'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const filesStore = useFilesStore()
const itemsStore = useItemsStore()
const toast = useToast()

const statBlockData = computed<StatBlockData>(() => props.item.data as StatBlockData)
const featuredImageUrl = ref<string>('')

// Background image style
const backgroundImageStyle = computed(() => {
  if (!featuredImageUrl.value) return {}
  return {
    '--bg-image': `url(${featuredImageUrl.value})`,
  }
})

// Load featured image URL
watch(
  () => props.item.featuredImage?.id,
  async (imageId) => {
    if (imageId) {
      try {
        featuredImageUrl.value = await filesStore.getDownloadUrl(imageId)
      } catch (error) {
        console.error('Failed to load featured image:', error)
        featuredImageUrl.value = ''
      }
    } else {
      featuredImageUrl.value = ''
    }
  },
  { immediate: true }
)

const headerDescriptionSimple = computed(() => {
  const parts: string[] = []
  if (statBlockData.value.cr) parts.push(`CR ${statBlockData.value.cr}`)
  if (statBlockData.value.size) parts.push(statBlockData.value.size)
  return parts.join(' • ') || 'Stat Block'
})

const statBlockProficiencyBonus = computed(() => {
  if (statBlockData.value.cr) {
    return calculateStatBlockProficiencyBonus(statBlockData.value.cr)
  }
  return 0
})

const initiativeValue = computed(() => statBlockData.value.initiative)
const initiativeDisplay = computed(() => {
  const value = initiativeValue.value
  if (value === undefined || value === null || value === '') return '—'
  return value
})

const resistancesDisplay = computed(() => (statBlockData.value.resistances || '').trim())
const immunitiesDisplay = computed(() => (statBlockData.value.immunities || '').trim())

// Add files to store and get IDs
const fileIds = computed(() => {
  if (props.item.userFiles && props.item.userFiles.length > 0) {
    filesStore.addFiles(props.item.userFiles)
    return props.item.userFiles.map(f => f.id)
  }
  return []
})

async function updateActions(actions: any[]) {
  const updatedData = { ...statBlockData.value, actions }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Actions updated!')
  } catch (error: any) {
    console.error('Failed to update actions:', error)
    toast.error('Failed to save actions')
  }
}

async function updateTraits(traits: any[]) {
  const updatedData = { ...statBlockData.value, traits }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Traits updated!')
  } catch (error: any) {
    console.error('Failed to update traits:', error)
    toast.error('Failed to save traits')
  }
}

async function updateSpells(spells: any[]) {
  const updatedData = { ...statBlockData.value, spells }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Spells updated!')
  } catch (error: any) {
    console.error('Failed to update spells:', error)
    toast.error('Failed to save spells')
  }
}

</script>

<style scoped>
.stat-block-detail {
  width: 100%;
  position: relative;
  min-height: auto;
}

.stat-block-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 45vw;
  height: 100%;
  max-height: 800px;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: left center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.28;
  mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
  -webkit-mask-composite: source-in;
}

.stat-block-detail > * {
  position: relative;
  z-index: 1;
}

/* Stat Info Tooltip */
.stat-info-tooltip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.tooltip-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  white-space: nowrap;
}


.core-stats-row {
  margin-bottom: 16px;
}

.stat-card {
  transition: transform 0.2s;
  min-height: 100px;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card-content {
  padding: 16px 12px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 34px !important;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.85;
}


.card-title-mobile {
  padding: 16px !important;
  font-size: 1rem !important;
}

.title-text {
  font-weight: 600;
}

.detail-row {
  max-height: calc(100vh - 80px);
  overflow: hidden;
}

.main-column {
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  padding-right: 16px;
}

.main-column::-webkit-scrollbar {
  width: 6px;
}

.main-column::-webkit-scrollbar-track {
  background: transparent;
}

.main-column::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.main-column::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sidebar-column {
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  padding-right: 8px;
}

.sidebar-column::-webkit-scrollbar {
  width: 6px;
}

.sidebar-column::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-column::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-column::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 959px) {
  .stat-card-content {
    padding: 12px 8px !important;
  }

  .stat-value {
    font-size: 1.4rem;
  }
  
  .detail-row {
    max-height: none;
  }
  
  .main-column,
  .sidebar-column {
    max-height: none;
    overflow-y: visible;
  }
}
</style>

