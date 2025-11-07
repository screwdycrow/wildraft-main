<template>
  <div class="magic-item-detail">
    <!-- Header -->
    <v-card class="glass-card mb-4" elevation="0">
      <v-card-title class="text-h4 font-weight-bold d-flex align-center">
        <v-icon icon="mdi-treasure-chest" color="#F39C12" size="48" class="mr-3" />
        {{ item.name }}
        <v-spacer />
        <v-chip :color="getRarityColor(itemData.rarity)" size="large">
          {{ itemData.rarity }}
        </v-chip>
      </v-card-title>

      <v-card-subtitle v-if="itemData.itemType" class="text-h6 mt-2">
        {{ itemData.itemType }}
        <v-chip v-if="itemData.attunement" size="small" color="purple" class="ml-2">
          Requires Attunement
        </v-chip>
      </v-card-subtitle>

      <v-card-text v-if="item.description" class="text-body-1 mt-2">
        {{ item.description }}
      </v-card-text>
    </v-card>

    <!-- Properties -->
    <v-row class="mb-4">
      <v-col v-if="itemData.value" cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-gold" size="64" color="warning" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ itemData.value }}</div>
            <div class="text-overline">Value</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="itemData.weight" cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-weight" size="64" color="info" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ itemData.weight }} lb</div>
            <div class="text-overline">Weight</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="itemData.damage" cols="12" md="4">
        <v-card class="glass-card text-center" elevation="0">
          <v-card-text>
            <v-icon icon="mdi-sword" size="64" color="error" class="mb-2" />
            <div class="text-h3 font-weight-bold">{{ itemData.damage }}</div>
            <div class="text-overline">Damage</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Properties -->
    <v-card v-if="itemData.properties && itemData.properties.length > 0" class="glass-card mb-4" elevation="0">
      <v-card-title>
        <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
        Properties
      </v-card-title>
      <v-card-text>
        <v-chip
          v-for="(prop, index) in itemData.properties"
          :key="index"
          class="mr-2 mb-2"
          variant="outlined"
        >
          {{ prop }}
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Effect -->
    <v-card v-if="itemData.effect" class="glass-card mb-4" elevation="0">
      <v-card-title>
        <v-icon icon="mdi-sparkles" class="mr-2" color="purple" />
        Magical Effect
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">{{ itemData.effect }}</p>
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
import type { LibraryItem, ItemData } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const itemData = computed<ItemData>(() => props.item.data as ItemData)

const getRarityColor = (rarity: string) => {
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
</script>

<style scoped>
.magic-item-detail {
  width: 100%;
}
</style>

