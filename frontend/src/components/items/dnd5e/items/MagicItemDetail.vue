<template>
  <div class="magic-item-detail" :style="backgroundImageStyle">
    <page-top-bar
      :title="item.name"
      icon="mdi-auto-fix"
      icon-color="#9b59b6"
      :description="itemData.itemType || 'Magic Item'"
    >
      <template #actions>
        <v-btn
          icon="mdi-printer"
          variant="text"
          size="small"
          @click="showPrintDialog = true"
        />
      </template>
    </page-top-bar>

    <v-row class="content-row" dense>
      <v-col cols="12" md="8" class="main-column">
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
      <v-col cols="12" md="4" class="sidebar-column">
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

    <!-- Print Dialog -->
    <v-dialog v-model="showPrintDialog" fullscreen>
      <v-card>
        <v-toolbar color="primary">
          <v-toolbar-title>{{ item.name }} - Magic Item Card</v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-printer" @click="printItem" />
          <v-btn icon="mdi-close" @click="showPrintDialog = false" />
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <div id="magic-item-pdf-export" class="pdf-export-container">
            <div class="pdf-card">
              <div v-if="featuredImageUrl" class="pdf-image-wrapper">
                <div class="pdf-image-container">
                  <img :src="featuredImageUrl" class="pdf-image" />
                </div>
              </div>
              <div class="pdf-card-content">
                <div class="pdf-header">
                <div class="pdf-title-row">
                  <h1 class="pdf-name">{{ item.name }}</h1>
                  <div class="pdf-rarity">{{ itemData.rarity || 'Common' }}</div>
                </div>
                <div class="pdf-meta">
                  {{ itemData.itemType }}<span v-if="itemData.category">, {{ itemData.category }}</span>
                  <span v-if="itemData.subtype"> ({{ itemData.subtype }})</span>
                </div>
                <div v-if="itemData.attunement || itemData.requiresAttunement" class="pdf-attunement">
                  Requires Attunement {{ itemData.attunement ? `(${itemData.attunement})` : '' }}
                </div>
              </div>

              <div class="pdf-stats-grid">
                <template v-for="stat in statGrid" :key="stat.label">
                  <div v-if="stat.value !== '—'" class="pdf-stat-item">
                    <div class="pdf-stat-label">{{ stat.label }}</div>
                    <div class="pdf-stat-value">{{ stat.value }}</div>
                  </div>
                </template>
              </div>

              <div v-if="activationText" class="pdf-section">
                <h2 class="pdf-section-title">Activation</h2>
                <div class="pdf-section-content">{{ activationText }}</div>
              </div>

              <div v-if="item.description" class="pdf-section">
                <h2 class="pdf-section-title">Description</h2>
                <div class="pdf-section-content rich-text pdf-clamp" v-html="item.description"></div>
              </div>

              <div v-if="itemData.effect" class="pdf-section">
                <h2 class="pdf-section-title">Effect</h2>
                <div class="pdf-section-content rich-text pdf-clamp" v-html="itemData.effect"></div>
              </div>

              <div v-if="itemData.properties && itemData.properties.length" class="pdf-section">
                <h2 class="pdf-section-title">Properties</h2>
                <div class="pdf-properties">
                  <span v-for="prop in itemData.properties" :key="prop" class="pdf-prop-tag">{{ prop }}</span>
                </div>
              </div>

              <div v-if="itemData.actions && itemData.actions.length" class="pdf-section">
                <h2 class="pdf-section-title">Actions</h2>
                <div v-for="(action, index) in itemData.actions" :key="index" class="pdf-effect-box">
                  <div class="pdf-effect-header">
                    <span class="pdf-effect-name">{{ action.name }}</span>
                    <span v-if="action.actionType" class="pdf-effect-type">{{ action.actionType }}</span>
                  </div>
                  <div class="pdf-action-meta">
                    <span v-if="action.toHit"><strong>To Hit:</strong> {{ action.toHit }}</span>
                    <span v-if="action.roll"><strong>Damage:</strong> {{ action.roll }}</span>
                    <span v-if="action.dc"><strong>DC:</strong> {{ action.dc }}</span>
                    <span v-if="action.range"><strong>Range:</strong> {{ action.range }}</span>
                  </div>
                  <div v-if="action.description" class="pdf-effect-desc rich-text" v-html="action.description"></div>
                </div>
              </div>

              <div v-if="itemData.additionalEffects && itemData.additionalEffects.length" class="pdf-section">
                <h2 class="pdf-section-title">Additional Effects</h2>
                <div v-for="(effect, index) in itemData.additionalEffects" :key="index" class="pdf-effect-box">
                  <div class="pdf-effect-header">
                    <span class="pdf-effect-name">{{ effect.name }}</span>
                    <span v-if="effect.type" class="pdf-effect-type">{{ effect.type }}</span>
                  </div>
                  <div v-if="effect.description" class="pdf-effect-desc rich-text" v-html="effect.description"></div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LibraryItem, ItemData } from '@/types/item.types'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'
import PageTopBar from '@/components/common/PageTopBar.vue'
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
const showPrintDialog = ref(false)

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

function printItem() {
  const printContent = document.getElementById('magic-item-pdf-export')
  if (!printContent) return
  
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${props.item.name} - Magic Item Card</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; color: #000; padding: 10mm; }
          
          .pdf-export-container { width: 100%; max-width: 100mm; margin: 0 auto; height: 140mm; overflow: hidden; }
          .pdf-card { 
            border: 2px solid #333; 
            padding: 20px; 
            border-radius: 12px; 
            position: relative; 
            height: 100%; 
            display: flex;
            flex-direction: column;
            background: #fff;
          }
          .pdf-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: #9b59b6; z-index: 2; border-radius: 12px 12px 0 0; }
          
          .pdf-image-wrapper { display: flex; justify-content: center; margin-bottom: 12px; z-index: 2; }
          .pdf-image-container { width: 40mm; height: 40mm; overflow: hidden; border-radius: 8px; border: 1px solid #eee; }
          .pdf-image { width: 100%; height: 100%; object-fit: cover; }
          
          .pdf-card-content { position: relative; z-index: 2; display: flex; flex-direction: column; height: 100%; }
          
          .pdf-header { margin-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 8px; }
          .pdf-title-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
          .pdf-name { font-size: 20px; font-weight: bold; color: #1a1a1a; }
          .pdf-rarity { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; }
          .pdf-meta { font-size: 12px; font-style: italic; color: #444; margin-bottom: 4px; }
          .pdf-attunement { font-size: 11px; font-weight: bold; color: #d35400; text-transform: uppercase; }
          
          .pdf-stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(30mm, 1fr)); 
            gap: 8px; 
            margin-bottom: 12px; 
            background: rgba(0,0,0,0.04); 
            padding: 8px; 
            border-radius: 6px; 
          }
          .pdf-stat-item { text-align: center; border-right: 1px solid rgba(0,0,0,0.1); }
          .pdf-stat-item:last-child { border-right: none; }
          .pdf-stat-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #7f8c8d; }
          .pdf-stat-value { font-size: 13px; font-weight: bold; color: #2c3e50; }
          
          .pdf-section { margin-bottom: 10px; flex-shrink: 1; overflow: hidden; }
          .pdf-section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.1); margin-bottom: 5px; color: #555; }
          .pdf-section-content { font-size: 11px; line-height: 1.4; color: #222; }
          
          .pdf-clamp { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
          
          .pdf-properties { display: flex; flex-wrap: wrap; gap: 4px; }
          .pdf-prop-tag { font-size: 9px; font-weight: bold; background: rgba(0,0,0,0.05); padding: 2px 6px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.1); }
          
          .pdf-effect-box { margin-bottom: 6px; padding: 8px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); border-radius: 5px; }
          .pdf-effect-header { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .pdf-effect-name { font-weight: bold; font-size: 11px; color: #2980b9; }
          .pdf-effect-type { font-size: 9px; font-style: italic; color: #7f8c8d; }
          .pdf-effect-desc { font-size: 10px; line-height: 1.3; }
          .pdf-action-meta { font-size: 9px; margin-bottom: 3px; color: #444; display: flex; gap: 8px; }
          .pdf-action-meta strong { color: #2c3e50; }
          
          .rich-text p { margin-bottom: 5px; }
          .rich-text ul, .rich-text ol { padding-left: 15px; margin-bottom: 5px; }
          
          @media print {
            body { padding: 0; }
            .pdf-card { break-inside: avoid; border: 1px solid #000; }
          }
          
          @media print {
            body { padding: 0; }
            .pdf-card { border: 1px solid #000; break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}
</script>

<style scoped>
.magic-item-detail {
  width: 100%;
  position: relative;
  min-height: auto;
}

.magic-item-detail::before {
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

.magic-item-detail > * {
  position: relative;
  z-index: 1;
}

.content-row {
  margin-top: 8px;
  max-height: calc(100vh - 60px);
  overflow: hidden;
}

.main-column {
  max-height: calc(100vh - 60px);
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
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}

.main-column::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

.sidebar-column {
  max-height: calc(100vh - 60px);
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
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}

.sidebar-column::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

.glass-card {
  background: rgba(var(--glass-surface-rgb), 0.8);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
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
  color: rgba(var(--v-theme-on-surface), 0.9);
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
  color: rgba(var(--v-theme-on-surface), 0.75);
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
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.stat-grid__cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.stat-grid__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.stat-grid__value {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.95);
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
  color: rgba(var(--v-theme-on-surface), 0.75);
  margin: 0;
}

.section-text {
  margin: 0;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.rich-text :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-surface), 0.88);
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
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.85);
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.pill-list--tags li {
  border-color: rgba(82, 75, 229, 0.35);
  background: rgba(82, 75, 229, 0.18);
  color: #a7a3ff;
}

.item-card__callout {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card__callout-badge {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.7);
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
  color: rgba(var(--v-theme-on-surface), 0.75);
  margin: 0 0 12px;
}

.attachments-panel__grid {
  border-radius: 12px;
  overflow: hidden;
}

.attachments-panel__manager {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 12px;
  padding: 12px;
}

.attachments-panel__empty {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
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
  
  .content-row {
    max-height: none;
  }
  
  .main-column,
  .sidebar-column {
    max-height: none;
    overflow-y: visible;
  }
}
</style>
