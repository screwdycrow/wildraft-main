<template>
  <div class="mm-text-node" :class="{ selected }" :style="nodeStyle">
    <NodeResizer
      v-if="!readonly"
      :min-width="80"
      :min-height="34"
      color="#8E44AD"
      :is-visible="selected"
    />

    <template v-for="pos in handlePositions" :key="pos.key">
      <Handle :id="`${pos.key}-target`" type="target" :position="pos.position" class="mm-handle" :connectable="!readonly" />
      <Handle :id="`${pos.key}-source`" type="source" :position="pos.position" class="mm-handle mm-handle-source" :connectable="!readonly" />
    </template>

    <button
      v-if="!readonly"
      class="mm-del nodrag"
      title="Delete"
      @mousedown.stop
      @click.stop="onDelete"
    >
      <v-icon size="12">mdi-close</v-icon>
    </button>

    <div class="mm-text-body">
      <div v-if="data.html" class="rich-content" v-html="data.html" />
      <div v-else class="placeholder">{{ readonly ? '' : 'Click to edit text…' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'

const props = defineProps<{ id: string; data: Record<string, any>; selected?: boolean }>()

const readonly = inject<boolean>('mindmapReadonly', false)
const requestSave = inject<() => void>('mindmapRequestSave', () => {})
const { removeNodes } = useVueFlow()

const handlePositions = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
]

// '#ffffff' was the old hard-coded default for new text nodes; treat it as
// "unset" so the node inherits the theme's panel text colour instead of
// disappearing on light themes.
const customColor = computed(() => {
  const c = props.data.color
  return c && c.toLowerCase() !== '#ffffff' ? c : null
})

const nodeStyle = computed(() => ({
  '--mm-accent': customColor.value || 'rgb(var(--panel-text))',
  ...(customColor.value ? { color: customColor.value } : {}),
}))

function onDelete() {
  removeNodes([props.id])
  requestSave()
}
</script>

<style scoped>
.mm-text-node {
  position: relative;
  color: rgb(var(--panel-text));
  width: 100%;
  height: 100%;
  min-width: 80px;
  min-height: 34px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  border-radius: 6px;
  border: 1px dashed transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.mm-text-node:active {
  cursor: grabbing;
}
.mm-text-node:hover {
  border-color: rgba(var(--panel-border), 0.32);
  background: rgba(var(--panel-text), 0.05);
}
.mm-text-node.selected {
  border-color: var(--mm-accent);
  background: rgba(var(--panel-text), 0.06);
}

.mm-text-body {
  padding: 6px 8px;
  font-size: 0.85rem;
  line-height: 1.45;
  word-break: break-word;
}
.placeholder {
  color: rgba(var(--panel-text), 0.5);
  font-style: italic;
}
.rich-content :deep(p) { margin: 0 0 0.3em; }
.rich-content :deep(h1) { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.2em; }
.rich-content :deep(h2) { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.2em; }
.rich-content :deep(ul), .rich-content :deep(ol) { padding-left: 1.1em; margin: 0.2em 0; }

.mm-del {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgb(var(--panel-bg-elevated));
  border: 1px solid rgba(var(--panel-border), 0.32);
  color: rgb(var(--panel-text));
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 3;
}
.mm-text-node:hover .mm-del,
.mm-text-node.selected .mm-del {
  display: inline-flex;
}

.mm-handle {
  width: 8px;
  height: 8px;
  background: var(--mm-accent, #8E44AD);
  border: 2px solid rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.mm-handle-source { cursor: crosshair; }
.mm-text-node:hover .mm-handle,
.mm-text-node.selected .mm-handle { opacity: 1; }

:deep(.vue-flow__resize-control) { z-index: 12; }
</style>
