<template>
  <div ref="wrapperRef" class="mindmap-canvas-wrapper">
    <VueFlow
      :id="flowId"
      :nodes="initialNodes"
      :edges="initialEdges"
      :node-types="nodeTypes"
      :min-zoom="0.2"
      :max-zoom="4"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :fit-view-on-init="true"
      :nodes-draggable="!readonly"
      :nodes-connectable="!readonly"
      :elements-selectable="true"
      :zoom-on-double-click="false"
      class="mindmap-flow"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
    >
      <Background pattern-color="rgba(255,255,255,0.12)" :gap="22" />
      <Controls />
      <MiniMap pannable zoomable />

      <Panel position="top-left" class="mindmap-toolbar" :class="{ shifted: !!selectedNode }">
        <div class="toolbar-group">
          <template v-if="!readonly">
            <v-menu location="bottom start">
              <template #activator="{ props: menuProps }">
                <v-btn size="small" variant="flat" color="deep-purple" prepend-icon="mdi-plus" append-icon="mdi-menu-down" v-bind="menuProps">
                  Note
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  v-for="cat in categories"
                  :key="cat.id"
                  :title="cat.label"
                  @click="addNoteNode(cat.id)"
                >
                  <template #prepend>
                    <v-icon :icon="cat.icon" :color="cat.color" size="18" class="mr-1" />
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-btn size="small" variant="tonal" prepend-icon="mdi-link-variant-plus" @click="openAddReference">
              Reference
            </v-btn>
            <v-divider vertical class="mx-1" />
          </template>

          <v-btn size="small" variant="text" icon="mdi-fit-to-page-outline" title="Fit view" @click="fitAll" />
          <span v-if="saveState" class="save-state">
            <v-icon size="12" class="mr-1" :class="{ 'mdi-spin': saveState === 'saving' }">
              {{ saveState === 'saving' ? 'mdi-loading' : 'mdi-check' }}
            </v-icon>
            {{ saveState === 'saving' ? 'Saving…' : 'Saved' }}
          </span>
        </div>

        <div class="toolbar-group">
          <v-btn v-if="!readonly" size="small" variant="text" prepend-icon="mdi-cog-outline" @click="$emit('edit', item)">
            Details
          </v-btn>
          <v-btn v-if="!readonly" size="small" variant="text" color="error" icon="mdi-delete-outline" title="Delete mindmap" @click="$emit('delete', item)" />
        </div>
      </Panel>

      <Panel v-if="isEmpty" position="top-center" class="empty-hint">
        <v-icon size="18" class="mr-2">mdi-sitemap-outline</v-icon>
        {{ readonly ? 'This mindmap is empty.' : 'Add a note or reference to start mapping your ideas.' }}
      </Panel>
    </VueFlow>

    <!-- Node settings sidebar -->
    <transition name="mm-sidebar">
      <aside v-if="selectedNode" class="mindmap-sidebar" @mousedown.stop @wheel.stop>
        <div class="sidebar-header">
          <v-icon :icon="sidebarIcon" :color="sidebarColor" size="18" class="mr-2" />
          <span class="sidebar-title">{{ sidebarTitle }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="clearSelection" />
        </div>

        <!-- NOTE settings -->
        <div v-if="selectedNode.type === 'note'" class="sidebar-body">
          <template v-if="!readonly">
            <div class="field-label">Type</div>
            <div class="category-grid">
              <button
                v-for="cat in categories"
                :key="cat.id"
                class="category-btn"
                :class="{ active: currentCategory === cat.id }"
                :style="currentCategory === cat.id ? { borderColor: cat.color, background: cat.color + '26' } : {}"
                @click="setCategory(cat.id)"
              >
                <v-icon :icon="cat.icon" :color="cat.color" size="16" />
                <span>{{ cat.label }}</span>
              </button>
            </div>

            <div class="field-label">Title</div>
            <v-text-field
              v-model="noteTitle"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Node title…"
            />

            <div class="field-label">Content</div>
            <tip-tap-editor
              :key="selectedNode.id"
              v-model="noteHtml"
              :library-id="libraryId ?? undefined"
              :library-item-id="item.id"
              min-height="200px"
              placeholder="Write your idea…"
              class="sidebar-editor"
            />

            <div class="field-label">Color</div>
            <div class="swatch-row">
              <button
                v-for="c in swatches"
                :key="c"
                class="swatch"
                :class="{ active: effectiveColor.toLowerCase() === c.toLowerCase() }"
                :style="{ background: c }"
                @click="setColor(c)"
              />
              <button class="swatch reset" title="Use type color" @click="resetColor">
                <v-icon size="14" color="white">mdi-restore</v-icon>
              </button>
            </div>

            <v-btn block variant="tonal" color="error" prepend-icon="mdi-delete-outline" class="mt-4" @click="deleteSelected">
              Delete node
            </v-btn>
          </template>

          <!-- Read-only preview -->
          <template v-else>
            <div v-if="noteTitle" class="ro-title">{{ noteTitle }}</div>
            <div v-if="noteHtml" class="rich-content" v-html="noteHtml" />
            <div v-else class="ro-empty">Empty note</div>
          </template>
        </div>

        <!-- REFERENCE settings -->
        <div v-else-if="selectedNode.type === 'reference'" class="sidebar-body">
          <div class="ref-card">
            <v-avatar size="52" :color="refTypeInfo.color">
              <v-img v-if="refImageUrl" :src="refImageUrl" cover />
              <v-icon v-else :icon="refTypeInfo.icon" color="white" size="26" />
            </v-avatar>
            <div class="ref-card-text">
              <div class="ref-card-name">{{ refTarget?.name || 'Missing item' }}</div>
              <div class="ref-card-type" :style="{ color: refTypeInfo.color }">{{ refTypeInfo.label }}</div>
            </div>
          </div>

          <v-btn
            v-if="refTarget"
            block
            variant="tonal"
            color="primary"
            prepend-icon="mdi-open-in-new"
            class="mt-3"
            @click="openSelectedRef"
          >
            Open item
          </v-btn>
          <v-btn
            v-if="!readonly"
            block
            variant="tonal"
            prepend-icon="mdi-swap-horizontal"
            class="mt-2"
            @click="startReplaceReference"
          >
            Replace item
          </v-btn>
          <v-btn
            v-if="!readonly"
            block
            variant="tonal"
            color="error"
            prepend-icon="mdi-delete-outline"
            class="mt-2"
            @click="deleteSelected"
          >
            Delete node
          </v-btn>
        </div>
      </aside>
    </transition>

    <library-item-selector
      v-if="libraryId != null"
      v-model="showSelector"
      :library-id="libraryId"
      confirm-label="Add to Mindmap"
      @select="onSelectItem"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, provide, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { VueFlow, useVueFlow, Panel, type Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useItemsStore } from '@/stores/items'
import { useLibraryStore } from '@/stores/library'
import { useItemComponents } from '@/composables/useItemComponents'
import { getFileDownloadUrl } from '@/config/api'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import LibraryItemSelector from '@/components/dmScreen/LibraryItemSelector.vue'
import MindmapNoteNode from './MindmapNoteNode.vue'
import MindmapReferenceNode from './MindmapReferenceNode.vue'
import { MINDMAP_NOTE_CATEGORIES, DEFAULT_MINDMAP_CATEGORY, getMindmapCategory } from './mindmapCategories'
import type { LibraryItem, MindmapData, MindmapNode, ItemType } from '@/types/item.types'

const props = defineProps<{ item: LibraryItem }>()
defineEmits<{ edit: [item: LibraryItem]; delete: [item: LibraryItem] }>()

const router = useRouter()
const itemsStore = useItemsStore()
const libraryStore = useLibraryStore()
const { getItemTypeInfo } = useItemComponents()

const libraryId = computed(() => props.item.libraryId)
const readonly = computed(() => !['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || ''))

const flowId = `mindmap-${props.item.id}`
const wrapperRef = ref<HTMLElement | null>(null)
const categories = MINDMAP_NOTE_CATEGORIES
const swatches = ['#8E44AD', '#3498DB', '#27AE60', '#F39C12', '#E67E22', '#E74C3C', '#16A085', '#95A5A6']

const nodeTypes: any = {
  note: markRaw(MindmapNoteNode),
  reference: markRaw(MindmapReferenceNode),
}

// Seed initial state from the item's data (once).
const seed = (props.item.data || {}) as MindmapData
const initialNodes = ref(
  (seed.nodes || []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position || { x: 0, y: 0 },
    data: { ...n.data },
    ...(n.width && n.height
      ? { style: { width: `${n.width}px`, height: `${n.height}px` } }
      : {}),
  }))
)
const initialEdges = ref(
  (seed.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: (e as any).sourceHandle,
    targetHandle: (e as any).targetHandle,
    label: e.label,
    animated: true,
  }))
)

const {
  onConnect: registerConnect,
  addEdges,
  addNodes,
  removeNodes,
  updateNodeData,
  findNode,
  screenToFlowCoordinate,
  fitView,
  getNodes,
  getEdges,
} = useVueFlow(flowId)

const isEmpty = ref((seed.nodes || []).length === 0)
const showSelector = ref(false)
const saveState = ref<'' | 'saving' | 'saved'>('')
const selectedNodeId = ref<string | null>(null)
const replaceMode = ref(false)

const selectedNode = computed(() => (selectedNodeId.value ? findNode(selectedNodeId.value) || null : null))

function genId(prefix: string) {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${rand}`
}

function centerFlowPos() {
  const el = wrapperRef.value
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  const jitter = () => (Math.random() - 0.5) * 80
  return screenToFlowCoordinate({
    x: rect.left + rect.width / 2 + jitter(),
    y: rect.top + rect.height / 2 + jitter(),
  })
}

// ---- Autosave ----
let saveTimer: ReturnType<typeof setTimeout> | null = null

function serialize(): MindmapData {
  const nodes: MindmapNode[] = getNodes.value.map((n: any) => {
    const width = n.dimensions?.width || n.width
    const height = n.dimensions?.height || n.height
    return {
      id: n.id,
      type: n.type,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      ...(width && height ? { width: Math.round(width), height: Math.round(height) } : {}),
      data: { ...n.data },
    }
  })
  const edges = getEdges.value.map((e: any) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    label: e.label,
  }))
  return { nodes, edges, version: '1' }
}

function requestSave() {
  if (readonly.value) return
  isEmpty.value = getNodes.value.length === 0
  saveState.value = 'saving'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(persist, 800)
}

async function persist() {
  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, { data: serialize() as any })
    saveState.value = 'saved'
    setTimeout(() => { if (saveState.value === 'saved') saveState.value = '' }, 1500)
  } catch (e) {
    console.error('[Mindmap] autosave failed', e)
    saveState.value = ''
  }
}

provide('mindmapReadonly', readonly.value)
provide('mindmapLibraryId', props.item.libraryId)
provide('mindmapRequestSave', requestSave)

// ---- Vue Flow events ----
registerConnect((connection: Connection) => {
  addEdges([{ ...connection, id: genId('edge'), animated: true }])
  requestSave()
})

function onNodesChange(changes: any[]) {
  const meaningful = changes.some((c) => {
    if (c.type === 'position') return c.dragging === false
    return ['remove', 'dimensions', 'add'].includes(c.type)
  })
  if (meaningful) requestSave()
}

function onEdgesChange(changes: any[]) {
  const meaningful = changes.some((c) => ['remove', 'add'].includes(c.type))
  if (meaningful) requestSave()
}

function onNodeClick({ node }: any) {
  selectedNodeId.value = node.id
}

function onPaneClick() {
  selectedNodeId.value = null
}

function clearSelection() {
  selectedNodeId.value = null
}

// ---- Note node editing (via sidebar) ----
function patchSelected(patch: Record<string, any>) {
  if (!selectedNodeId.value) return
  updateNodeData(selectedNodeId.value, patch)
  requestSave()
}

const currentCategory = computed(() => selectedNode.value?.data?.category || DEFAULT_MINDMAP_CATEGORY)
const effectiveColor = computed(
  () => selectedNode.value?.data?.color || getMindmapCategory(selectedNode.value?.data?.category).color
)

const noteTitle = computed({
  get: () => selectedNode.value?.data?.title || '',
  set: (v: string) => patchSelected({ title: v }),
})
const noteHtml = computed({
  get: () => selectedNode.value?.data?.html || '',
  set: (v: string) => patchSelected({ html: v }),
})

function setCategory(id: string) {
  patchSelected({ category: id })
}
function setColor(c: string) {
  patchSelected({ color: c })
}
function resetColor() {
  patchSelected({ color: undefined })
}

// ---- Reference node ----
const refTarget = computed(() =>
  selectedNode.value?.type === 'reference'
    ? itemsStore.items.find((i) => i.id === selectedNode.value?.data?.libraryItemId) || null
    : null
)
const refTypeInfo = computed(() =>
  refTarget.value
    ? getItemTypeInfo(refTarget.value.type as ItemType)
    : { icon: 'mdi-help-circle-outline', color: '#7F8C8D', label: 'Unknown' }
)
const refImageUrl = computed(() =>
  refTarget.value?.featuredImage?.downloadUrl ? getFileDownloadUrl(refTarget.value.featuredImage) : null
)

function openSelectedRef() {
  if (!refTarget.value) return
  router.push({ name: 'ItemDetail', params: { libraryId: props.item.libraryId, itemId: refTarget.value.id } })
}
function startReplaceReference() {
  replaceMode.value = true
  showSelector.value = true
}

// ---- Sidebar meta ----
const sidebarIcon = computed(() => {
  if (selectedNode.value?.type === 'reference') return refTypeInfo.value.icon
  return getMindmapCategory(selectedNode.value?.data?.category).icon
})
const sidebarColor = computed(() => {
  if (selectedNode.value?.type === 'reference') return refTypeInfo.value.color
  return effectiveColor.value
})
const sidebarTitle = computed(() => {
  if (selectedNode.value?.type === 'reference') return 'Reference'
  return `${getMindmapCategory(selectedNode.value?.data?.category).label} note`
})

// ---- Toolbar actions ----
function addNoteNode(categoryId: string = DEFAULT_MINDMAP_CATEGORY) {
  if (readonly.value) return
  const cat = getMindmapCategory(categoryId)
  const id = genId('note')
  addNodes([
    {
      id,
      type: 'note',
      position: centerFlowPos(),
      data: { title: `New ${cat.label.toLowerCase()}`, html: '', category: cat.id },
      style: { width: '220px', height: '150px' },
    },
  ])
  selectedNodeId.value = id
  requestSave()
}

function openAddReference() {
  replaceMode.value = false
  showSelector.value = true
}

function onSelectItem(target: LibraryItem) {
  if (!target) return
  if (replaceMode.value && selectedNodeId.value) {
    updateNodeData(selectedNodeId.value, { libraryItemId: target.id })
    replaceMode.value = false
    requestSave()
    return
  }
  addReferenceNode(target)
}

function addReferenceNode(target: LibraryItem) {
  if (readonly.value || !target) return
  const id = genId('ref')
  addNodes([
    {
      id,
      type: 'reference',
      position: centerFlowPos(),
      data: { libraryItemId: target.id },
    },
  ])
  selectedNodeId.value = id
  requestSave()
}

function deleteSelected() {
  if (!selectedNodeId.value) return
  removeNodes([selectedNodeId.value])
  selectedNodeId.value = null
  requestSave()
}

function fitAll() {
  fitView({ padding: 0.2 })
}

onMounted(async () => {
  // Ensure the library's items are loaded so reference nodes resolve names/images.
  if (!itemsStore.isAlreadyLoaded(props.item.libraryId)) {
    try {
      await itemsStore.fetchItems(props.item.libraryId)
    } catch (e) {
      console.warn('[Mindmap] could not preload items for references', e)
    }
  }
})
</script>

<style scoped>
.mindmap-canvas-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 170px);
  min-height: 520px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: radial-gradient(circle at 30% 20%, rgba(142, 68, 173, 0.08), transparent 60%),
    rgb(16, 16, 22);
}

.mindmap-flow {
  width: 100%;
  height: 100%;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(20, 20, 28, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 6px 10px;
  transition: transform 0.22s ease;
}

.mindmap-toolbar.shifted {
  transform: translateX(320px);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.save-state {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
  margin-left: 4px;
}

.empty-hint {
  display: flex;
  align-items: center;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(20, 20, 28, 0.85);
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 6px 16px;
  pointer-events: none;
}

/* ---- Sidebar ---- */
.mindmap-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 320px;
  height: 100%;
  background: rgba(18, 18, 26, 0.97);
  backdrop-filter: blur(14px);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 8px 0 26px rgba(0, 0, 0, 0.35);
  z-index: 6;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
}

.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  scrollbar-width: thin;
}

.field-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  margin: 14px 0 6px;
}
.field-label:first-child {
  margin-top: 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.category-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.62rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.category-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}
.category-btn.active {
  color: #fff;
}

.swatch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.swatch {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, border-color 0.12s ease;
}
.swatch:hover {
  transform: scale(1.12);
}
.swatch.active {
  border-color: #fff;
}
.swatch.reset {
  background: rgba(255, 255, 255, 0.08);
}

.sidebar-editor :deep(.editor-toolbar) {
  flex-wrap: wrap;
}

.ref-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.ref-card-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
}
.ref-card-type {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-top: 2px;
}

.ro-title {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}
.ro-empty {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}
.rich-content {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}
.rich-content :deep(img) { max-width: 100%; border-radius: 6px; }

.mm-sidebar-enter-active,
.mm-sidebar-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.mm-sidebar-enter-from,
.mm-sidebar-leave-to {
  transform: translateX(-100%);
  opacity: 0.4;
}

:deep(.mdi-spin) {
  animation: mm-spin 0.9s linear infinite;
}

@keyframes mm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
