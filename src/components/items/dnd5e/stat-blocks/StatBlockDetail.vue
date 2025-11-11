<template>
  <div class="stat-block-detail">
    <page-top-bar
      :title="item.name"
      icon="mdi-sword-cross"
      icon-color="#E74C3C"
      :description="headerDescription"
    >
      <template #actions>
        <div class="stat-info-grid">
          <div class="info-item">
            <v-icon icon="mdi-sword-cross" size="small" color="#E74C3C" class="mr-1" />
            <span class="info-label">CR:</span> {{ statBlockData.cr || '?' }}
          </div>
          <div class="info-item">
            <v-icon icon="mdi-shield" size="small" color="primary" class="mr-1" />
            <span class="info-label">AC:</span> {{ statBlockData.ac || '?' }}
          </div>
          <div class="info-item">
            <v-icon icon="mdi-heart" size="small" color="error" class="mr-1" />
            <span class="info-label">HP:</span> {{ statBlockData.hp || '?' }}
          </div>
          <div class="info-item">
            <v-icon icon="mdi-run" size="small" color="success" class="mr-1" />
            <span class="info-label">Speed:</span> {{ statBlockData.speed || '?' }}
          </div>
          <div v-if="statBlockData.senses" class="info-item">
            <v-icon icon="mdi-eye" size="small" color="info" class="mr-1" />
            <span class="info-label">Senses:</span> {{ statBlockData.senses }}
          </div>
          <div v-if="statBlockData.languages" class="info-item">
            <v-icon icon="mdi-translate" size="small" color="warning" class="mr-1" />
            <span class="info-label">Languages:</span> {{ statBlockData.languages }}
          </div>
        </div>
      </template>
    </page-top-bar>

    <v-row>
      <!-- Left Column -->
      <v-col cols="12" md="9">
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

        <!-- Ability Scores -->
        <v-row class="mb-4">
              <v-col v-for="(score, ability) in abilityScores" :key="ability" cols="4" md="2">
                <div class="ability-box">
                  <div class="ability-name text-overline">{{ ability.toUpperCase() }}</div>
                  <div class="ability-score text-h4 font-weight-bold">
                    {{ score || 10 }}
                  </div>
                  <div class="ability-modifier text-h6">
                    {{ getModifier(score) }}
                  </div>
                </div>
              </v-col>
            </v-row>

    


        <!-- Actions -->
        <action-list-display :actions="statBlockData.actions" />

        <!-- Spells -->
        <spell-list-display :spells="statBlockData.spells" />
        
        <!-- Traits -->
        <trait-list-display :traits="statBlockData.traits" />
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
      <v-col cols="12" md="3">
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
import { computed } from 'vue'
import type { LibraryItem, StatBlockData } from '@/types/item.types'
import PageTopBar from '@/components/common/PageTopBar.vue'
import { useFilesStore } from '@/stores/files'
import TraitListDisplay from '../common/TraitListDisplay.vue'
import ActionListDisplay from '../common/ActionListDisplay.vue'
import SpellListDisplay from '../common/SpellListDisplay.vue'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'
import CustomCountersDisplay from '../common/CustomCountersDisplay.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const filesStore = useFilesStore()

const statBlockData = computed<StatBlockData>(() => props.item.data as StatBlockData)

const headerDescription = computed(() => {
  const parts: string[] = []
  if (statBlockData.value.size) parts.push(statBlockData.value.size)
  if (statBlockData.value.type) parts.push(statBlockData.value.type)
  let text = parts.join(' ')
  if (statBlockData.value.alignment) {
    text += text ? ` • ${statBlockData.value.alignment}` : statBlockData.value.alignment
  }
  return text || 'Stat Block'
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

const abilityScores = computed(() => {
  const data = statBlockData.value
  return {
    str: data.str,
    dex: data.dex,
    con: data.con,
    int: data.int,
    wis: data.wis,
    cha: data.cha,
  }
})

const hasAbilityScores = computed(() => {
  return Object.values(abilityScores.value).some(score => score !== undefined && score !== null)
})

const getModifier = (score: number | undefined): string => {
  if (score === undefined || score === null) return '+0'
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}
</script>

<style scoped>
.stat-block-detail {
  width: 100%;
}

.stat-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.info-label {
  font-weight: 600;
  margin-right: 4px;
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

.abilities-card :deep(.v-card-text) {
  padding: 16px !important;
}

.ability-box {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  transition: background 0.2s;
}

.ability-box:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ability-name {
  font-weight: bold;
  color: rgb(var(--v-theme-primary));
}

.ability-score {
  color: rgb(var(--v-theme-on-surface));
}

.ability-modifier {
  color: rgb(var(--v-theme-primary));
}

.card-title-mobile {
  padding: 16px !important;
  font-size: 1rem !important;
}

.title-text {
  font-weight: 600;
}

@media (max-width: 959px) {
  .stat-info-grid {
    gap: 8px;
    font-size: 0.75rem;
  }

  .stat-card-content {
    padding: 12px 8px !important;
  }

  .stat-value {
    font-size: 1.4rem;
  }

  .ability-box {
    padding: 10px 6px;
  }

  .ability-name {
    font-size: 0.5rem;
  }

  .ability-score {
    font-size: 1.2rem;
  }

  .ability-modifier {
    font-size: 0.85rem;
  }
}
</style>

