<template>
  <div class="magic-item-detail" :style="backgroundImageStyle">
    <v-row class="content-row" dense>


      <v-col cols="12" md="8">
        <div class="item-card glass-card">
      

          <div class="item-card__body">
            <header class="item-card__header">
              <div class="item-card__title">
                <h1 class="item-name">{{ item.name }}</h1>
                <p class="item-meta">
                  <span v-if="itemData.itemType">{{ itemData.itemType }}</span>
                  <span v-if="itemData.category"> · {{ itemData.category }}</span>
                  <span v-if="itemData.subtype"> · {{ itemData.subtype }}</span>
                </p>
              </div>
              <v-chip
                size="small"
                class="rarity-chip"
                :color="getRarityColor(itemData.rarity)"
              >
                {{ itemData.rarity || 'Unknown' }}
              </v-chip>
            </header>

            <p
              v-if="itemData.attunement || itemData.requiresAttunement"
              class="item-card__attunement"
            >
              Requires Attunement
              <span v-if="typeof itemData.attunement === 'string'">
                · {{ itemData.attunement }}
              </span>
              <span v-else-if="itemData.requiresAttunement">
                · {{ itemData.requiresAttunement }}
              </span>
            </p>

            <div class="stat-grid">
              <div
                v-for="stat in statGrid"
                :key="stat.label"
                class="stat-grid__cell"
              >
                <span class="stat-grid__label">{{ stat.label }}</span>
                <span class="stat-grid__value">{{ stat.value }}</span>
              </div>
            </div>

            <section
              v-if="activationText"
              class="item-card__section"
            >
              <h2 class="section-heading">Activation</h2>
              <p class="section-text">{{ activationText }}</p>
            </section>

            <section v-if="item.description" class="item-card__section">
              <h2 class="section-heading">Description</h2>
              <div class="rich-text" v-html="item.description" />
            </section>

            <section v-if="itemData.effect" class="item-card__section">
              <h2 class="section-heading">Effect</h2>
              <div class="rich-text" v-html="itemData.effect" />
            </section>

            <section
              v-if="itemData.properties && itemData.properties.length"
              class="item-card__section"
            >
              <h2 class="section-heading">Properties</h2>
              <ul class="pill-list">
                <li v-for="prop in itemData.properties" :key="prop">
                  {{ prop }}
                </li>
              </ul>
            </section>

            <section
              v-if="itemData.additionalEffects && itemData.additionalEffects.length"
              class="item-card__section"
            >
              <h2 class="section-heading">Additional Effects</h2>
              <div
                v-for="(effect, index) in itemData.additionalEffects"
                :key="`additional-effect-${index}`"
                class="item-card__callout"
              >
                <strong>{{ effect.name }}</strong>
                <span v-if="effect.type" class="item-card__callout-badge">
                  {{ effect.type }}
                </span>
                <div
                  v-if="effect.description"
                  class="rich-text mt-2"
                  v-html="effect.description"
                />
              </div>
            </section>

            <section v-if="item.tags && item.tags.length" class="item-card__section">
              <h2 class="section-heading">Tags</h2>
              <ul class="pill-list pill-list--tags">
                <li v-for="tag in item.tags" :key="tag.id">{{ tag.name }}</li>
              </ul>
            </section>
          </div>
        </div>
      </v-col>
      <v-col cols="12" md="4">
        <aside class="attachments-panel glass-card">
          <h3 class="attachments-panel__title">Attachments</h3>
          <attached-files-grid
            :file-ids="fileIds"
            :featured-image-id="item.featuredImage?.id"
            :columns="1"
            :read-only="true"
            class="attachments-panel__grid"
          />
          <file-attachment-manager
            v-if="canEdit"
            :attached-files="item.userFiles"
            :library-id="item.libraryId"
            :item-id="item.id"
            :can-edit="canEdit"
            class="attachments-panel__manager"
          />
          <p
            v-if="fileIds.length === 0 && (!canEdit || !item.userFiles?.length)"
            class="attachments-panel__empty"
          >
            No files attached.
          </p>
        </aside>
      </v-col>  
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LibraryItem, ItemData } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'
import { useFilesStore } from '@/stores/files'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'

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

// Background image style
const backgroundImageStyle = computed(() => {
  if (!featuredImageUrl.value) return {}
  return {
    '--bg-image': `url(${featuredImageUrl.value})`,
  }
})

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

const statGrid = computed(() => {
  const data: Record<string, any> = itemData.value || {}
  return [
    { label: 'Bonus', value: asDisplay(data.bonus) },
    { label: 'Charges', value: asDisplay(data.charges) },
    { label: 'Save / DC', value: asDisplay(data.saveDc || data.dc || data.save?.dc) },
    { label: 'Damage', value: asDisplay(data.damage) },
    { label: 'Weight', value: asDisplay(data.weight, 'lb') },
    { label: 'Worth', value: asDisplay(data.value) },
  ]
})

const activationText = computed(() =>
  itemData.value?.activation ? formatActivation(itemData.value.activation) : ''
)

const fileIds = computed(() => {
  if (props.item.userFiles && props.item.userFiles.length > 0) {
    filesStore.addFiles(props.item.userFiles)
    return props.item.userFiles.map((file) => file.id)
  }
  return []
})

function asDisplay(value: unknown, suffix?: string) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'number') {
    return suffix ? `${value} ${suffix}` : String(value)
  }

  if (typeof value === 'string') {
    return suffix ? `${value} ${suffix}` : value
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—'
  }

  return String(value)
}

function formatActivation(activation: Activation) {
  const parts: string[] = []
  if (!activation) return ''

  if (activation.type) {
    parts.push(activation.type)
  }

  if (activation.cost) {
    parts.push(String(activation.cost))
  }

  if (activation.unit) {
    parts.push(activation.unit)
  }

  return parts.join(' ')
}

function getRarityColor(rarity: string) {
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
  position: relative;
  min-height: 100vh;
}

.magic-item-detail::before {
  content: '';
  position: fixed;
  top: 50px;
  left: 0;
  width: 50vw;
  height: calc(50vw * 4 / 3);
  max-height: calc(100vh - 50px);
  background-image: var(--bg-image);
  background-size: cover;
  background-position: left center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.3;
  mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%);
  -webkit-mask-composite: source-in;
}

.magic-item-detail > * {
  position: relative;
  z-index: 1;
}

.content-row {
  margin-top: 8px;
}

.glass-card {
  background: rgba(25, 26, 33, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
}

.item-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.item-card__image :deep(img) {
  object-fit: cover;
}

.item-card__body {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: rgba(255, 255, 255, 0.9);
}

.item-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.item-card__title {
  flex: 1;
}

.item-name {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  margin: 0;
}

.item-meta {
  margin: 6px 0 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.04em;
}

.rarity-chip {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.item-card__attunement {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.stat-grid__cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.stat-grid__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.stat-grid__value {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.item-card__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-heading {
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.section-text {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

.rich-text :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
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

.pill-list {
  list-style: none;
  padding: 0;
  margin: -4px;
  display: flex;
  flex-wrap: wrap;
}

.pill-list li {
  margin: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.08);
}

.pill-list--tags li {
  border-color: rgba(82, 75, 229, 0.35);
  background: rgba(82, 75, 229, 0.18);
  color: #a7a3ff;
}

.item-card__callout {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card__callout-badge {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.6);
}

.attachments-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.attachments-panel__title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px;
}

.attachments-panel__grid {
  border-radius: 12px;
  overflow: hidden;
}

.attachments-panel__manager {
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
}

.attachments-panel__empty {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  margin: 0;
}

@media (max-width: 959px) {
  .item-card__body {
    padding: 20px;
  }

  .item-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .attachments-panel {
    margin-top: 16px;
  }
}
</style>
