<template>
  <div class="stat-block-detail">
    <!-- Header Section -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h4 font-weight-bold d-flex align-center">
        <v-icon icon="mdi-sword-cross" color="#E74C3C" size="48" class="mr-3" />
        {{ item.name }}
        <v-spacer />
        <v-chip color="#E74C3C" size="large">
          CR {{ statBlockData.cr || '?' }}
        </v-chip>
      </v-card-title>

      <v-card-subtitle v-if="statBlockData.size || statBlockData.type" class="text-h6 mt-2">
        {{ statBlockData.size }} {{ statBlockData.type }}
        <span v-if="statBlockData.alignment">, {{ statBlockData.alignment }}</span>
      </v-card-subtitle>

      <v-card-text v-if="item.description" class="text-body-1 mt-2">
        {{ item.description }}
      </v-card-text>
    </v-card>

    <!-- Core Stats -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-shield" size="64" color="primary" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ statBlockData.ac || '?' }}</div>
            <div class="text-overline">Armor Class</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-heart" size="64" color="error" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ statBlockData.hp || '?' }}</div>
            <div class="text-overline">Hit Points</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-run" size="64" color="success" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ statBlockData.speed || '?' }}</div>
            <div class="text-overline">Speed</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-crosshairs" size="48" color="info" class="mb-2" />
            <div class="text-h4 font-weight-bold">{{ initiativeDisplay }}</div>
            <div class="text-overline">Initiative</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-subtitle-1 d-flex align-center">
            <v-icon icon="mdi-shield-half-full" size="small" class="mr-2" />
            Resistances
          </v-card-title>
          <v-card-text>{{ resistancesDisplay || 'None' }}</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-subtitle-1 d-flex align-center">
            <v-icon icon="mdi-shield-off" size="small" class="mr-2" />
            Immunities
          </v-card-title>
          <v-card-text>{{ immunitiesDisplay || 'None' }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ability Scores -->
    <v-card v-if="hasAbilityScores" class="glass-card mb-4" elevation="0">
      <v-card-title>Ability Scores</v-card-title>
      <v-card-text>
        <v-row>
          <v-col v-for="(score, ability) in abilityScores" :key="ability" cols="6" sm="4" md="2">
            <div class="text-center">
              <div class="text-caption text-grey">{{ ability.toUpperCase() }}</div>
              <div class="text-h5 font-weight-bold">{{ score }}</div>
              <div class="text-caption">({{ getModifier(score) }})</div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Info Grid -->
    <v-row class="mb-4">
      <v-col v-if="statBlockData.languages" cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-translate" class="mr-2" />
            Languages
          </v-card-title>
          <v-card-text>{{ statBlockData.languages }}</v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="statBlockData.senses" cols="12" md="6">
        <v-card class="glass-card" elevation="0">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-eye" class="mr-2" />
            Senses
          </v-card-title>
          <v-card-text>{{ statBlockData.senses }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Traits -->
    <trait-list-display :traits="statBlockData.traits" />

    <!-- Actions -->
    <action-list-display :actions="statBlockData.actions" />

    <!-- Spells -->
    <spell-list-display :spells="statBlockData.spells" />

    <!-- Tags -->
    <v-card v-if="item.tags && item.tags.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h6">
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
      :columns="4"
      :read-only="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, StatBlockData } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'
import TraitListDisplay from '../common/TraitListDisplay.vue'
import ActionListDisplay from '../common/ActionListDisplay.vue'
import SpellListDisplay from '../common/SpellListDisplay.vue'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const filesStore = useFilesStore()

const statBlockData = computed<StatBlockData>(() => props.item.data as StatBlockData)

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
    // Add files to the store so AttachedFilesGrid can access them
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
  if (!score) return '+0'
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}
</script>

<style scoped>
.stat-block-detail {
  width: 100%;
}
</style>

