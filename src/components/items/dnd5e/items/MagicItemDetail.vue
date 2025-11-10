<template>
  <div class="magic-item-detail">
    <!-- Hero Header -->
    <v-card class="glass-card hero-card mb-6" elevation="0">
      <div class="hero-background" :style="heroBackgroundStyle"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-header">
          <v-icon icon="mdi-treasure-chest" class="hero-icon" />
          <div class="hero-title">
            <h1 class="item-name text-truncate">
              {{ item.name }}
            </h1>
            <div class="item-meta">
              <v-chip
                size="small"
                class="mr-2 text-uppercase rarity-chip"
                :color="getRarityColor(itemData.rarity)"
              >
                {{ itemData.rarity || 'Unknown' }}
              </v-chip>
              <span v-if="itemData.itemType" class="meta-pill">
                {{ itemData.itemType }}
              </span>
              <span v-if="itemData.attunement" class="meta-pill attunement">
                Requires Attunement
              </span>
            </div>
          </div>
        </div>
        <div v-if="item.description" class="hero-description">
          <div class="description-surface" v-html="item.description" />
        </div>
      </div>
    </v-card>

    <!-- At-a-Glance Stats -->
    <v-row v-if="highlightStats.length" class="stats-row mb-6">
      <v-col
        v-for="stat in highlightStats"
        :key="stat.label"
        cols="12"
        sm="4"
        md="3"
      >
        <v-card class="glass-card stat-card text-center" elevation="0">
          <v-card-text class="py-6">
            <v-icon :icon="stat.icon" class="mb-3 stat-icon" :color="stat.color" />
            <div class="stat-value">
              {{ stat.value }}
            </div>
            <div class="stat-label text-uppercase">
              {{ stat.label }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="details-grid" dense>
      <v-col cols="12" md="7">
        <v-card
          v-if="itemData.effect || (itemData.activation && itemData.activation.type)"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-sparkles" class="mr-2" color="purple" />
            Magical Effect
          </v-card-title>
          <v-card-text class="rich-text" v-if="itemData.effect">
            <div v-html="itemData.effect" />
          </v-card-text>
          <v-divider v-if="itemData.effect && itemData.activation && itemData.activation.type" class="my-2" />
          <v-card-text
            v-if="itemData.activation && itemData.activation.type"
            class="activation-details"
          >
            <v-icon icon="mdi-play-circle" size="small" class="mr-1" />
            <span>
              Activation:
              <strong>{{ formatActivation(itemData.activation) }}</strong>
            </span>
          </v-card-text>
        </v-card>

        <v-card
          v-if="itemData.additionalEffects && itemData.additionalEffects.length"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-auto-fix" class="mr-2" color="secondary" />
            Additional Effects
          </v-card-title>
          <v-card-text>
            <div
              v-for="(effect, index) in itemData.additionalEffects"
              :key="`additional-effect-${index}`"
              class="additional-effect"
            >
              <div class="effect-header">
                <span class="effect-name">{{ effect.name }}</span>
                <v-chip
                  v-if="effect.type"
                  size="x-small"
                  class="ml-2"
                  color="primary"
                  variant="tonal"
                >
                  {{ effect.type }}
                </v-chip>
              </div>
              <div v-if="effect.description" class="rich-text mt-2" v-html="effect.description" />
            </div>
          </v-card-text>
        </v-card>

        <v-card
          v-if="itemData.properties && itemData.properties.length"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-format-list-bulleted" class="mr-2" />
            Properties
          </v-card-title>
          <v-card-text>
            <v-chip
              v-for="(prop, index) in itemData.properties"
              :key="`property-${index}`"
              class="mr-2 mb-2 property-chip"
              variant="tonal"
              color="primary"
            >
              {{ prop }}
            </v-chip>
          </v-card-text>
        </v-card>

        <v-card
          v-if="itemData.charges || itemData.recharge"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-battery-charging" class="mr-2" color="info" />
            Charges & Recharge
          </v-card-title>
          <v-card-text>
            <div v-if="itemData.charges" class="info-line">
              <v-icon icon="mdi-battery" size="small" class="mr-2" />
              <span>
                Charges:
                <strong>{{ itemData.charges }}</strong>
              </span>
            </div>
            <div v-if="itemData.recharge" class="info-line">
              <v-icon icon="mdi-refresh" size="small" class="mr-2" />
              <span v-html="itemData.recharge" />
            </div>
          </v-card-text>
        </v-card>

        <v-card
          v-if="item.tags && item.tags.length"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-tag-multiple" class="mr-2" />
            Tags
          </v-card-title>
          <v-card-text>
            <v-chip
              v-for="tag in item.tags"
              :key="tag.id"
              :color="tag.color"
              class="mr-2 mb-2 tag-chip"
            >
              <v-icon icon="mdi-tag" size="small" class="mr-1" />
              {{ tag.name }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="glass-card section-card mb-4" elevation="0">
          <v-card-title class="section-title">
            <v-icon icon="mdi-information-outline" class="mr-2" />
            Item Details
          </v-card-title>
          <v-card-text class="details-list">
            <div
              v-for="detail in detailList"
              :key="detail.label"
              class="detail-row"
            >
              <span class="detail-label">{{ detail.label }}</span>
              <span class="detail-value">{{ detail.value }}</span>
            </div>
          </v-card-text>
        </v-card>

        <v-card
          v-if="itemData.bonuses && itemData.bonuses.length"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-plus-circle-multiple" class="mr-2" color="success" />
            Bonuses
          </v-card-title>
          <v-card-text>
            <div
              v-for="(bonus, index) in itemData.bonuses"
              :key="`bonus-${index}`"
              class="info-line"
            >
              <v-icon icon="mdi-plus-circle" size="small" class="mr-2" color="success" />
              <span>{{ formatBonus(bonus) }}</span>
            </div>
          </v-card-text>
        </v-card>

        <v-card
          v-if="item.userFiles && item.userFiles.length"
          class="glass-card section-card mb-4"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-paperclip" class="mr-2" />
            Attached Files
          </v-card-title>
          <v-card-text>
            <file-attachment-manager
              :attached-files="item.userFiles"
              :library-id="item.libraryId"
              :item-id="item.id"
              :can-edit="canEdit"
            />
          </v-card-text>
        </v-card>

        <v-card
          v-else
          class="glass-card section-card"
          elevation="0"
        >
          <v-card-title class="section-title">
            <v-icon icon="mdi-paperclip" class="mr-2" />
            Attachments
          </v-card-title>
          <v-card-text>
            <file-attachment-manager
              :attached-files="item.userFiles"
              :library-id="item.libraryId"
              :item-id="item.id"
              :can-edit="canEdit"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LibraryItem, ItemData } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'
import { useFilesStore } from '@/stores/files'

interface Activation {
  type?: string
  cost?: number
  unit?: string
}

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const filesStore = useFilesStore()

const itemData = computed<ItemData>(() => props.item.data as ItemData)

const featuredImageUrl = ref('')

watch(
  () => props.item.featuredImage,
  async (featuredImage) => {
    if (featuredImage) {
      try {
        featuredImageUrl.value = await filesStore.getDownloadUrl(featuredImage.id)
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

const heroBackgroundStyle = computed(() => {
  if (featuredImageUrl.value) {
    return {
      backgroundImage: `url(${featuredImageUrl.value})`,
    }
  }
  return {
    background:
      'linear-gradient(135deg, rgba(243, 156, 18, 0.35), rgba(230, 126, 34, 0.45))',
  }
})

const highlightStats = computed(() => {
  const stats: Array<{ label: string; value: string; icon: string; color?: string }> = []
  const data = itemData.value

  if (!data) {
    return stats
  }

  if (data.value) {
    stats.push({
      label: 'Value',
      value: String(data.value),
      icon: 'mdi-gold',
      color: 'warning',
    })
  }

  if (data.weight || data.weight === 0) {
    stats.push({
      label: 'Weight',
      value: `${data.weight} lb`,
      icon: 'mdi-weight',
      color: 'info',
    })
  }

  if (data.damage) {
    stats.push({
      label: 'Damage',
      value: String(data.damage),
      icon: 'mdi-sword',
      color: 'error',
    })
  }

  if (data.ac) {
    stats.push({
      label: 'Armor Class',
      value: String(data.ac),
      icon: 'mdi-shield',
      color: 'primary',
    })
  }

  return stats
})

const detailList = computed(() => {
  const details: Array<{ label: string; value: string }> = []
  const data = itemData.value

  if (!data) {
    return details
  }

  if (data.itemType) {
    details.push({
      label: 'Item Type',
      value: data.itemType,
    })
  }

  if (data.rarity) {
    details.push({
      label: 'Rarity',
      value: data.rarity,
    })
  }

  if (data.attunement) {
    details.push({
      label: 'Attunement',
      value: typeof data.attunement === 'string' ? data.attunement : 'Required',
    })
  }

  if (data.category) {
    details.push({
      label: 'Category',
      value: data.category,
    })
  }

  if (data.subtype) {
    details.push({
      label: 'Subtype',
      value: data.subtype,
    })
  }

  if (data.requiresAttunement) {
    details.push({
      label: 'Requires Attunement By',
      value: data.requiresAttunement,
    })
  }

  if (data.source) {
    details.push({
      label: 'Source',
      value: data.source,
    })
  }

  if (data.notes) {
    details.push({
      label: 'Notes',
      value: data.notes,
    })
  }

  return details
})

const formatActivation = (activation: Activation) => {
  const parts: string[] = []

  if (activation.type) {
    parts.push(activation.type)
  }

  if (activation.cost) {
    parts.push(`${activation.cost}`)
  }

  if (activation.unit) {
    parts.push(activation.unit)
  }

  return parts.join(' ')
}

const formatBonus = (bonus: unknown) => {
  if (bonus === null || bonus === undefined) {
    return ''
  }

  if (typeof bonus === 'string') {
    return bonus
  }

  if (typeof bonus === 'number') {
    return bonus >= 0 ? `+${bonus}` : String(bonus)
  }

  if (typeof bonus === 'object') {
    try {
      return JSON.stringify(bonus)
    } catch (error) {
      console.warn('Unable to stringify bonus object', error)
    }
  }

  return String(bonus)
}

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

.hero-card {
  position: relative;
  overflow: hidden;
  min-height: 240px;
  border-radius: 24px;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: saturate(1.1);
  transform: scale(1.05);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.75),
    rgba(20, 20, 20, 0.75)
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.hero-icon {
  font-size: 48px;
  color: #f39c12;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.hero-title {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.02em;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.item-meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rarity-chip {
  font-weight: 600;
  letter-spacing: 0.08em;
}

.meta-pill {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 999px;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
}

.meta-pill.attunement {
  border: 1px solid rgba(186, 104, 200, 0.5);
  background: rgba(186, 104, 200, 0.15);
}

.hero-description {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 16px;
  padding: 20px;
  max-height: 220px;
  overflow-y: auto;
  backdrop-filter: blur(6px);
}

.hero-description::-webkit-scrollbar {
  width: 6px;
}

.hero-description::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
}

.description-surface :deep(*) {
  color: rgba(255, 255, 255, 0.85);
}

.description-surface :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.description-surface :deep(h1),
.description-surface :deep(h2),
.description-surface :deep(h3) {
  font-size: 1rem;
  margin: 0.75rem 0 0.25rem;
}

.description-surface :deep(ul),
.description-surface :deep(ol) {
  padding-left: 1.25rem;
}

.stats-row {
  margin-left: -6px !important;
  margin-right: -6px !important;
}

.stats-row > .v-col {
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.stat-card {
  min-height: 160px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 18px;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.stat-icon {
  font-size: 36px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.section-card {
  border-radius: 18px;
}

.section-title {
  font-weight: 700;
  letter-spacing: 0.08em;
}

.rich-text :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.65;
}

.rich-text :deep(p:last-child) {
  margin-bottom: 0;
}

.rich-text :deep(ul),
.rich-text :deep(ol) {
  padding-left: 1.2rem;
  margin-bottom: 0.75rem;
}

.rich-text :deep(li) {
  margin-bottom: 0.4rem;
}

.additional-effect + .additional-effect {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 16px;
  padding-top: 16px;
}

.effect-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.875rem;
}

.activation-details {
  display: flex;
  align-items: center;
  font-weight: 500;
  gap: 6px;
}

.property-chip {
  font-weight: 600;
  letter-spacing: 0.04em;
}

.tag-chip {
  font-weight: 600;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.95rem;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.detail-value {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.9);
  text-align: right;
}

.info-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.info-line + .info-line {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

@media (max-width: 959px) {
  .hero-content {
    padding: 24px;
  }

  .hero-icon {
    font-size: 36px;
  }

  .item-name {
    font-size: 1.75rem;
  }

  .hero-description {
    max-height: 180px;
  }

  .stat-card {
    min-height: 140px;
  }
}

@media (max-width: 599px) {
  .hero-card {
    border-radius: 18px;
  }

  .hero-header {
    flex-direction: column;
    gap: 12px;
  }

  .hero-icon {
    align-self: flex-start;
  }

  .item-meta {
    gap: 6px;
  }

  .hero-description {
    max-height: 160px;
    padding: 16px;
  }

  .stat-card {
    min-height: 120px;
  }
}
</style>