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
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
    >
      <Background pattern-color="rgba(255,255,255,0.12)" :gap="22" />
      <Controls />
      <MiniMap pannable zoomable />

      <Panel position="top-left" class="mindmap-toolbar">
        <div class="toolbar-group">
          <template v-if="!readonly">
            <v-btn size="small" variant="flat" color="deep-purple" prepend-icon="mdi-card-plus-outline" @click="addNoteNode">
              Note
            </v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-link-variant-plus" @click="showSelector = true">
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
          <v-btn v-if="!readonly" size="small" variant="text" prepend-icon="mdi-pencil" @click="$emit('edit', item)">
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

    <library-item-selector
      v-if="libraryId != null"
      v-model="showSelector"
      :library-id="libraryId"
      confirm-label="Add to Mindmap"
      @select="addReferenceNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, provide, onMounted } from 'vue'
import { VueFlow, useVueFlow, Panel, type Connection } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useItemsStore } from '@/stores/items'
import { useLibraryStore } from '@/stores/library'
import LibraryItemSelector from '@/components/dmScreen/LibraryItemSelector.vue'
import MindmapNoteNode from './MindmapNoteNode.vue'
import MindmapReferenceNode from './MindmapReferenceNode.vue'
import type { LibraryItem, MindmapData, MindmapNode } from '@/types/item.types'

const props = defineProps<{ item: LibraryItem }>()
defineEmits<{ edit: [item: LibraryItem]; delete: [item: LibraryItem] }>()

const itemsStore = useItemsStore()
const libraryStore = useLibraryStore()

const libraryId = computed(() => props.item.libraryId)
const readonly = computed(() => !['OWNER', 'EDITOR'].includes(libraryStore.currentLibrary?.role || ''))

const flowId = `mindmap-${props.item.id}`
const wrapperRef = ref<HTMLElement | null>(null)

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
  screenToFlowCoordinate,
  fitView,
  getNodes,
  getEdges,
} = useVueFlow(flowId)

const isEmpty = ref((seed.nodes || []).length === 0)
const showSelector = ref(false)
const saveState = ref<'' | 'saving' | 'saved'>('')

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
  // Persist on drag-stop, removal, resize, add (ignore select/hover churn and mid-drag events)
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

function addNoteNode() {
  if (readonly.value) return
  addNodes([
    {
      id: genId('note'),
      type: 'note',
      position: centerFlowPos(),
      data: { title: 'New note', html: '', color: '#8E44AD' },
      style: { width: '220px', height: '140px' },
    },
  ])
  requestSave()
}

function addReferenceNode(target: LibraryItem) {
  if (readonly.value || !target) return
  addNodes([
    {
      id: genId('ref'),
      type: 'reference',
      position: centerFlowPos(),
      data: { libraryItemId: target.id },
    },
  ])
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

:deep(.mdi-spin) {
  animation: mm-spin 0.9s linear infinite;
}

@keyframes mm-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
