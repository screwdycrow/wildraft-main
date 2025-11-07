<template>
  <div class="character-detail">
    <!-- Header -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h4 font-weight-bold d-flex align-center">
        <v-icon icon="mdi-account-multiple" color="#3498DB" size="48" class="mr-3" />
        {{ item.name }}
        <v-spacer />
        <v-chip color="#3498DB" size="large">
          Level {{ characterData.level || 1 }}
        </v-chip>
      </v-card-title>

      <v-card-subtitle v-if="characterData.class || characterData.race" class="text-h6 mt-2">
        {{ characterData.race }} {{ characterData.class }}
        <span v-if="characterData.subclass">({{ characterData.subclass }})</span>
      </v-card-subtitle>

      <v-card-text>
        <div v-if="characterData.playerName" class="text-body-1 mb-2">
          <v-icon icon="mdi-account" class="mr-2" />
          <strong>Player:</strong> {{ characterData.playerName }}
        </div>
        <div v-if="characterData.background" class="text-body-1">
          <v-icon icon="mdi-book-open-variant" class="mr-2" />
          <strong>Background:</strong> {{ characterData.background }}
        </div>
        <p v-if="item.description" class="text-body-1 mt-4">{{ item.description }}</p>
      </v-card-text>
    </v-card>

    <!-- Core Stats -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-shield" size="64" color="primary" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ characterData.ac || '?' }}</div>
            <div class="text-overline">Armor Class</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-heart" size="64" color="error" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ characterData.hp || '?' }} / {{ characterData.maxHp || '?' }}</div>
            <div class="text-overline">Hit Points</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-run" size="64" color="success" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ characterData.speed || '?' }}</div>
            <div class="text-overline">Speed</div>
          </v-card-text>
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

    <!-- Equipment -->
    <v-card v-if="characterData.equipment && characterData.equipment.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title>
        <v-icon icon="mdi-sword" class="mr-2" />
        Equipment
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(item, index) in characterData.equipment" :key="index">
            {{ item.name || JSON.stringify(item) }}
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Spells -->
    <v-card v-if="characterData.spells && characterData.spells.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title>
        <v-icon icon="mdi-auto-fix" class="mr-2" color="purple" />
        Spells
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(spell, index) in characterData.spells" :key="index">
            {{ spell.name || JSON.stringify(spell) }}
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Features -->
    <v-card v-if="characterData.features && characterData.features.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title>
        <v-icon icon="mdi-star" class="mr-2" color="warning" />
        Features & Traits
      </v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(feature, index) in characterData.features" :key="index">
            {{ feature.name || JSON.stringify(feature) }}
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Tags -->
    <v-card v-if="item.tags && item.tags.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title>
        <v-icon icon="mdi-tag-multiple" class="mr-2" />
        Tags
      </v-card-title>
      <v-card-text>
        <v-chip v-for="tag in item.tags" :key="tag.id" :color="tag.color" class="mr-2 mb-2">
          <v-icon icon="mdi-tag" size="small" class="mr-1" />
          {{ tag.name }}
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- File Attachments -->
    <file-attachment-manager
      :attached-files="item.userFiles"
      :library-id="item.libraryId"
      :item-id="item.id"
      :can-edit="canEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LibraryItem, CharacterData } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const characterData = computed<CharacterData>(() => props.item.data as CharacterData)

const abilityScores = computed(() => ({
  str: characterData.value.str,
  dex: characterData.value.dex,
  con: characterData.value.con,
  int: characterData.value.int,
  wis: characterData.value.wis,
  cha: characterData.value.cha,
}))

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
.character-detail {
  width: 100%;
}
</style>

