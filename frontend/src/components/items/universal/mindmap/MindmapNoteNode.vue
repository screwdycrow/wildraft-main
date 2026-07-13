<template>
  <div
    class="mindmap-note-node"
    :class="{ selected }"
    :style="nodeStyle"
  >
    <NodeResizer
      v-if="!readonly"
      :min-width="150"
      :min-height="80"
      :color="accent"
      :is-visible="selected"
    />

    <!-- Connection handles: a source + target on each side for free-form linking -->
    <template v-for="pos in handlePositions" :key="pos.key">
      <Handle
        :id="`${pos.key}-target`"
        type="target"
        :position="pos.position"
        class="mm-handle"
        :connectable="!readonly"
      />
      <Handle
        :id="`${pos.key}-source`"
        type="source"
        :position="pos.position"
        class="mm-handle mm-handle-source"
        :connectable="!readonly"
      />
    </template>

    <!-- Category bar -->
    <div class="note-category-bar" :style="{ background: accent }">
      <v-icon :icon="category.icon" size="12" color="white" class="mr-1" />
      <span class="category-label">{{ category.label }}</span>
      <span class="spacer" />
      <button
        v-if="!readonly"
        class="mm-del nodrag"
        title="Delete"
        @mousedown.stop
        @click.stop="onDelete"
      >
        <v-icon size="13">mdi-close</v-icon>
      </button>
    </div>

    <!-- Body -->
    <div class="note-body">
      <div v-if="data.title" class="note-title">{{ data.title }}</div>
      <div v-if="data.html" class="rich-content" v-html="data.html" />
      <div v-else class="placeholder">{{ readonly ? 'Empty note' : 'Click to edit…' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import { getMindmapCategory } from './mindmapCategories'

interface NoteNodeData {
  title?: string
  html?: string
  color?: string
  category?: string
  [key: string]: any
}

const props = defineProps<{
  id: string
  data: NoteNodeData
  selected?: boolean
}>()

const readonly = inject<boolean>('mindmapReadonly', false)
const requestSave = inject<() => void>('mindmapRequestSave', () => {})

const { removeNodes } = useVueFlow()

const category = computed(() => getMindmapCategory(props.data.category))
const accent = computed(() => props.data.color || category.value.color)

const handlePositions = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
]

const nodeStyle = computed(() => ({
  '--mm-accent': accent.value,
  borderColor: props.selected ? accent.value : 'rgba(255,255,255,0.12)',
}))

function onDelete() {
  removeNodes([props.id])
  requestSave()
}
</script>

<style scoped>
.mindmap-note-node {
  width: 100%;
  height: 100%;
  min-width: 150px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  background: rgba(24, 24, 32, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.mindmap-note-node:active {
  cursor: grabbing;
}

.mindmap-note-node.selected {
  box-shadow: 0 0 0 2px var(--mm-accent), 0 8px 26px rgba(0, 0, 0, 0.5);
}

.note-category-bar {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  min-height: 22px;
  flex-shrink: 0;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spacer {
  flex: 1;
}

.mm-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: #fff;
  background: transparent;
  cursor: pointer;
  border: none;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.mindmap-note-node:hover .mm-del,
.mindmap-note-node.selected .mm-del {
  opacity: 0.85;
}

.mm-del:hover {
  background: rgba(0, 0, 0, 0.25);
  opacity: 1;
}

.note-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 10px;
  scrollbar-width: thin;
}

.note-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
  word-break: break-word;
}

.rich-content {
  font-size: 0.76rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
  word-break: break-word;
}

.placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  font-size: 0.76rem;
}

.rich-content :deep(p) { margin: 0 0 0.4em; }
.rich-content :deep(h1) { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.3em; }
.rich-content :deep(h2) { font-size: 0.95rem; font-weight: 700; margin: 0 0 0.3em; }
.rich-content :deep(h3) { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.2em; }
.rich-content :deep(ul), .rich-content :deep(ol) { padding-left: 1.1em; margin: 0.2em 0; }
.rich-content :deep(a) { color: #7abaff; }
.rich-content :deep(img) { max-width: 100%; border-radius: 4px; }

.mm-handle {
  width: 9px;
  height: 9px;
  background: var(--mm-accent, #8E44AD);
  border: 2px solid rgba(255, 255, 255, 0.85);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.mm-handle-source {
  cursor: crosshair;
}

.mindmap-note-node:hover .mm-handle,
.mindmap-note-node.selected .mm-handle {
  opacity: 1;
}
</style>
