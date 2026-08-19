<template>
  <div ref="rootRef" class="mindmap-canvas-wrapper">
    <div ref="wrapperRef" class="flow-area">
    <VueFlow
      :id="flowId"
      :nodes="initialNodes"
      :edges="initialEdges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-edge-options="{ type: 'mindmap' }"
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
      @edge-click="onEdgeClick"
      @pane-click="onPaneClick"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
    >
      <Background pattern-color="rgba(255,255,255,0.12)" :gap="22" />
      <Controls />
      <MiniMap pannable zoomable />

      <Panel position="top-left" class="mindmap-toolbar">
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

            <v-btn size="small" variant="tonal" icon="mdi-format-text" title="Add text" @click="addTextNode" />
            <v-btn size="small" variant="tonal" icon="mdi-link-variant-plus" title="Add reference" @click="openAddReference" />
            <v-btn size="small" variant="tonal" icon="mdi-shape-rectangle-plus" title="Add group" @click="addGroupNode" />
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
          <v-btn
            size="small"
            variant="text"
            :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
            :title="isFullscreen ? 'Exit full screen' : 'Full screen'"
            @click="toggleFullscreen"
          />
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
    </div>

    <!-- Node/edge settings sidebar (pushes the canvas, does not overlay it) -->
    <aside v-if="selectedNode || selectedEdge" class="mindmap-sidebar" @mousedown.stop @wheel.stop>
        <div class="sidebar-header">
          <v-icon :icon="sidebarIcon" :color="sidebarColor" size="18" class="mr-2" />
          <span class="sidebar-title">{{ sidebarTitle }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="clearSelection" />
        </div>

        <!-- NOTE settings -->
        <div v-if="selectedNode?.type === 'note'" class="sidebar-body">
          <template v-if="!readonly">
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
              compact
              :library-id="libraryId ?? undefined"
              :library-item-id="item.id"
              min-height="300px"
              placeholder="Write your idea…"
              class="sidebar-editor"
            />

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
        <div v-else-if="selectedNode?.type === 'reference'" class="sidebar-body">
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

        <!-- TEXT settings -->
        <div v-else-if="selectedNode?.type === 'text'" class="sidebar-body">
          <template v-if="!readonly">
            <div class="field-label">Text</div>
            <tip-tap-editor
              :key="selectedNode.id"
              v-model="noteHtml"
              compact
              :library-id="libraryId ?? undefined"
              :library-item-id="item.id"
              min-height="260px"
              placeholder="Write text…"
              class="sidebar-editor"
            />
            <div class="field-label">Color</div>
            <div class="swatch-row">
              <button
                v-for="c in swatches"
                :key="c"
                class="swatch"
                :class="{ active: (selectedNodeColor || '').toLowerCase() === c.toLowerCase() }"
                :style="{ background: c }"
                @click="setColor(c)"
              />
            </div>
            <v-btn block variant="tonal" color="error" prepend-icon="mdi-delete-outline" class="mt-4" @click="deleteSelected">
              Delete node
            </v-btn>
          </template>
          <template v-else>
            <div v-if="noteHtml" class="rich-content" v-html="noteHtml" />
            <div v-else class="ro-empty">Empty text</div>
          </template>
        </div>

        <!-- GROUP settings -->
        <div v-else-if="selectedNode?.type === 'group'" class="sidebar-body">
          <template v-if="!readonly">
            <div class="field-label">Label</div>
            <v-text-field
              v-model="groupLabel"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Group label…"
            />
            <div class="field-label">Color</div>
            <div class="swatch-row">
              <button
                v-for="c in swatches"
                :key="c"
                class="swatch"
                :class="{ active: (selectedNodeColor || '').toLowerCase() === c.toLowerCase() }"
                :style="{ background: c }"
                @click="setColor(c)"
              />
            </div>
            <v-btn block variant="tonal" color="error" prepend-icon="mdi-delete-outline" class="mt-4" @click="deleteSelected">
              Delete group
            </v-btn>
          </template>
        </div>

        <!-- JUNCTION settings -->
        <div v-else-if="selectedNode?.type === 'junction'" class="sidebar-body">
          <p class="sidebar-hint">
            A connection point. Drag a link from any node onto it (or from it to a node) to join them here.
          </p>
          <v-btn v-if="!readonly" block variant="tonal" color="error" prepend-icon="mdi-delete-outline" @click="deleteSelected">
            Delete connection point
          </v-btn>
        </div>

        <!-- EDGE settings -->
        <div v-else-if="selectedEdge" class="sidebar-body">
          <template v-if="!readonly">
            <div class="field-label">Label</div>
            <v-text-field
              v-model="edgeLabel"
              density="compact"
              variant="outlined"
              hide-details
              placeholder="Connection label…"
            />

            <div class="field-label">Style</div>
            <div class="style-row">
              <button
                v-for="s in edgeStyleOptions"
                :key="s.id"
                class="style-btn"
                :class="{ active: edgeStyle === s.id }"
                @click="setEdgeStyle(s.id)"
              >
                <v-icon :icon="s.icon" size="16" />
                <span>{{ s.label }}</span>
              </button>
            </div>

            <div class="field-label">Color</div>
            <div class="swatch-row">
              <button
                v-for="c in edgeSwatches"
                :key="c"
                class="swatch"
                :class="{ active: edgeColor.toLowerCase() === c.toLowerCase() }"
                :style="{ background: c }"
                @click="setEdgeColor(c)"
              />
            </div>

            <v-btn block variant="tonal" prepend-icon="mdi-source-branch" class="mt-3" @click="insertJunctionOnSelectedEdge">
              Insert connection point
            </v-btn>
            <v-btn block variant="tonal" color="error" prepend-icon="mdi-delete-outline" class="mt-2" @click="deleteSelectedEdge">
              Delete connection
            </v-btn>
          </template>
          <template v-else>
            <p class="ro-empty">Connection{{ selectedEdge.data?.label ? `: ${selectedEdge.data.label}` : '' }}</p>
          </template>
        </div>
      </aside>

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
import { ref, computed, markRaw, provide, onMounted, onBeforeUnmount } from 'vue'
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
import MindmapTextNode from './MindmapTextNode.vue'
import MindmapGroupNode from './MindmapGroupNode.vue'
import MindmapJunctionNode from './MindmapJunctionNode.vue'
import MindmapEdge from './MindmapEdge.vue'
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
const rootRef = ref<HTMLElement | null>(null)
const categories = MINDMAP_NOTE_CATEGORIES
const swatches = ['#8E44AD', '#3498DB', '#27AE60', '#F39C12', '#E67E22', '#E74C3C', '#16A085', '#95A5A6']
const edgeSwatches = ['#8E9BB5', '#8E44AD', '#3498DB', '#27AE60', '#F39C12', '#E74C3C', '#FFFFFF', '#5D6D7E']
const edgeStyleOptions = [
  { id: 'solid', label: 'Solid', icon: 'mdi-minus' },
  { id: 'dashed', label: 'Dashed', icon: 'mdi-dots-horizontal' },
  { id: 'animated', label: 'Flow', icon: 'mdi-transfer-right' },
]

const nodeTypes: any = {
  note: markRaw(MindmapNoteNode),
  reference: markRaw(MindmapReferenceNode),
  text: markRaw(MindmapTextNode),
  group: markRaw(MindmapGroupNode),
  junction: markRaw(MindmapJunctionNode),
}
const edgeTypes: any = {
  mindmap: markRaw(MindmapEdge),
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
    type: 'mindmap',
    // Migrate legacy top-level label into edge data.
    data: (e as any).data || (e.label ? { label: e.label } : {}),
  }))
)

const {
  onConnect: registerConnect,
  addEdges,
  addNodes,
  removeNodes,
  removeEdges,
  updateNodeData,
  updateEdgeData,
  findNode,
  findEdge,
  screenToFlowCoordinate,
  fitView,
  getNodes,
  getEdges,
} = useVueFlow(flowId)

const isEmpty = ref((seed.nodes || []).length === 0)
const showSelector = ref(false)
const saveState = ref<'' | 'saving' | 'saved'>('')
const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const replaceMode = ref(false)
const isFullscreen = ref(false)

const selectedNode = computed(() => (selectedNodeId.value ? findNode(selectedNodeId.value) || null : null))
const selectedEdge = computed(() => (selectedEdgeId.value ? findEdge(selectedEdgeId.value) || null : null))
const selectedNodeColor = computed(() => selectedNode.value?.data?.color || '')

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
    type: 'mindmap',
    data: { ...(e.data || {}) },
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
provide('mindmapInsertJunction', (edgeId: string, x?: number, y?: number) => insertJunction(edgeId, x, y))

// ---- Vue Flow events ----
registerConnect((connection: Connection) => {
  addEdges([{ ...connection, id: genId('edge'), type: 'mindmap', data: {} }])
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
  selectedEdgeId.value = null
  selectedNodeId.value = node.id
}

function onEdgeClick({ edge }: any) {
  selectedNodeId.value = null
  selectedEdgeId.value = edge.id
}

function onPaneClick() {
  selectedNodeId.value = null
  selectedEdgeId.value = null
}

function clearSelection() {
  selectedNodeId.value = null
  selectedEdgeId.value = null
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
  // Changing the type also resets the color to that type's default
  // (a custom color can still be picked afterwards).
  patchSelected({ category: id, color: undefined })
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

// ---- Group node ----
const groupLabel = computed({
  get: () => selectedNode.value?.data?.label || '',
  set: (v: string) => patchSelected({ label: v }),
})

// ---- Edge editing ----
function patchEdge(patch: Record<string, any>) {
  if (!selectedEdgeId.value) return
  const current = selectedEdge.value?.data || {}
  updateEdgeData(selectedEdgeId.value, { ...current, ...patch })
  requestSave()
}
const edgeLabel = computed({
  get: () => selectedEdge.value?.data?.label || '',
  set: (v: string) => patchEdge({ label: v }),
})
const edgeStyle = computed(() => selectedEdge.value?.data?.style || 'solid')
const edgeColor = computed(() => selectedEdge.value?.data?.color || '#8E9BB5')
function setEdgeStyle(id: string) {
  patchEdge({ style: id })
}
function setEdgeColor(c: string) {
  patchEdge({ color: c })
}
function deleteSelectedEdge() {
  if (!selectedEdgeId.value) return
  removeEdges([selectedEdgeId.value])
  selectedEdgeId.value = null
  requestSave()
}

// Split an edge with a junction node so a third node can connect "in the middle".
function insertJunction(edgeId: string, x?: number, y?: number) {
  if (readonly.value) return
  const edge = findEdge(edgeId)
  if (!edge) return

  let px = x
  let py = y
  if (px == null || py == null) {
    const s = findNode(edge.source)
    const t = findNode(edge.target)
    const center = (n: any) => ({
      x: n.position.x + (n.dimensions?.width || 120) / 2,
      y: n.position.y + (n.dimensions?.height || 60) / 2,
    })
    if (s && t) {
      const a = center(s)
      const b = center(t)
      px = (a.x + b.x) / 2
      py = (a.y + b.y) / 2
    } else {
      px = 0
      py = 0
    }
  }

  const jid = genId('junction')
  const data = { ...(edge.data || {}) }
  addNodes([{ id: jid, type: 'junction', position: { x: px - 8, y: py - 8 }, data: {} }])
  addEdges([
    { id: genId('edge'), source: edge.source, target: jid, sourceHandle: edge.sourceHandle, type: 'mindmap', data: { ...data } },
    { id: genId('edge'), source: jid, target: edge.target, targetHandle: edge.targetHandle, type: 'mindmap', data: { ...data } },
  ])
  removeEdges([edgeId])
  selectedEdgeId.value = null
  requestSave()
}
function insertJunctionOnSelectedEdge() {
  if (selectedEdgeId.value) insertJunction(selectedEdgeId.value)
}

// ---- Sidebar meta ----
const sidebarIcon = computed(() => {
  if (selectedEdge.value) return 'mdi-vector-line'
  const t = selectedNode.value?.type
  if (t === 'reference') return refTypeInfo.value.icon
  if (t === 'text') return 'mdi-format-text'
  if (t === 'group') return 'mdi-group'
  if (t === 'junction') return 'mdi-source-branch'
  return getMindmapCategory(selectedNode.value?.data?.category).icon
})
const sidebarColor = computed(() => {
  if (selectedEdge.value) return edgeColor.value
  const t = selectedNode.value?.type
  if (t === 'reference') return refTypeInfo.value.color
  if (t === 'text' || t === 'group') return selectedNodeColor.value || '#8E44AD'
  if (t === 'junction') return '#8E44AD'
  return effectiveColor.value
})
const sidebarTitle = computed(() => {
  if (selectedEdge.value) return 'Connection'
  const t = selectedNode.value?.type
  if (t === 'reference') return 'Reference'
  if (t === 'text') return 'Text'
  if (t === 'group') return 'Group'
  if (t === 'junction') return 'Connection point'
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
  selectedEdgeId.value = null
  selectedNodeId.value = id
  requestSave()
}

function addTextNode() {
  if (readonly.value) return
  const id = genId('text')
  addNodes([
    {
      id,
      type: 'text',
      position: centerFlowPos(),
      data: { html: '' },
      style: { width: '160px', height: '48px' },
    },
  ])
  selectedEdgeId.value = null
  selectedNodeId.value = id
  requestSave()
}

function addGroupNode() {
  if (readonly.value) return
  const id = genId('group')
  addNodes([
    {
      id,
      type: 'group',
      position: centerFlowPos(),
      data: { label: 'Group', color: '#5D6D7E' },
      style: { width: '280px', height: '200px' },
    },
  ])
  selectedEdgeId.value = null
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

// ---- Fullscreen ----
function onFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === rootRef.value
}
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await rootRef.value?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (e) {
    console.warn('[Mindmap] fullscreen toggle failed', e)
  }
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  // Ensure the library's items are loaded so reference nodes resolve names/images.
  if (!itemsStore.isAlreadyLoaded(props.item.libraryId)) {
    try {
      await itemsStore.fetchItems(props.item.libraryId)
    } catch (e) {
      console.warn('[Mindmap] could not preload items for references', e)
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})
</script>

<style scoped>
.mindmap-canvas-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  height: calc(100vh - 170px);
  min-height: 520px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--panel-border), 0.18);
  background: radial-gradient(circle at 30% 20%, rgba(142, 68, 173, 0.08), transparent 60%),
    rgb(var(--canvas-bg));
}

.mindmap-canvas-wrapper:fullscreen {
  height: 100vh;
  min-height: 100vh;
  border-radius: 0;
  border: none;
}

.flow-area {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
}

.mindmap-flow {
  width: 100%;
  height: 100%;
}

.mindmap-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(var(--panel-bg), 0.9);
  color: rgb(var(--panel-text));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--panel-border), 0.18);
  border-radius: 10px;
  padding: 6px 10px;
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
  color: rgba(var(--panel-text), 0.6);
  margin-left: 4px;
}

.empty-hint {
  display: flex;
  align-items: center;
  font-size: 0.82rem;
  color: rgba(var(--panel-text), 0.7);
  background: rgba(var(--panel-bg), 0.9);
  border: 1px dashed rgba(var(--panel-border), 0.32);
  border-radius: 999px;
  padding: 6px 16px;
  pointer-events: none;
}

/* ---- Sidebar (static flex child on the left; pushes the canvas) ---- */
.mindmap-sidebar {
  order: -1;
  flex-shrink: 0;
  width: 320px;
  height: 100%;
  background: rgba(var(--panel-bg), 0.97);
  color: rgb(var(--panel-text));
  border-right: 1px solid rgba(var(--panel-border), 0.2);
  box-shadow: 4px 0 18px rgba(0, 0, 0, 0.3);
  z-index: 6;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--panel-border), 0.18);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgb(var(--panel-text));
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
  color: rgba(var(--panel-text), 0.62);
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
  border: 1px solid rgba(var(--panel-border), 0.2);
  background: rgba(var(--panel-text), 0.05);
  color: rgba(var(--panel-text), 0.85);
  font-size: 0.62rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.category-btn:hover {
  background: rgba(var(--panel-text), 0.1);
}
.category-btn.active {
  color: rgb(var(--panel-text));
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
  border: 2px solid rgba(var(--panel-border), 0.3);
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
  border-color: rgb(var(--panel-text));
}
.swatch.reset {
  background: rgba(var(--panel-text), 0.1);
}

.style-row {
  display: flex;
  gap: 6px;
}
.style-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid rgba(var(--panel-border), 0.2);
  background: rgba(var(--panel-text), 0.05);
  color: rgba(var(--panel-text), 0.8);
  font-size: 0.62rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.style-btn:hover {
  background: rgba(var(--panel-text), 0.1);
}
.style-btn.active {
  border-color: #8e44ad;
  background: rgba(142, 68, 173, 0.22);
  color: rgb(var(--panel-text));
}

.sidebar-hint {
  font-size: 0.8rem;
  color: rgba(var(--panel-text), 0.7);
  line-height: 1.5;
  margin-bottom: 14px;
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
  background: rgba(var(--panel-text), 0.05);
  border: 1px solid rgba(var(--panel-border), 0.18);
}
.ref-card-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: rgb(var(--panel-text));
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
  color: rgb(var(--panel-text));
  margin-bottom: 8px;
}
.ro-empty {
  color: rgba(var(--panel-text), 0.55);
  font-style: italic;
}
.rich-content {
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(var(--panel-text), 0.92);
}
.rich-content :deep(img) { max-width: 100%; border-radius: 6px; }

:deep(.mdi-spin) {
  animation: mm-spin 0.9s linear infinite;
}

@keyframes mm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
