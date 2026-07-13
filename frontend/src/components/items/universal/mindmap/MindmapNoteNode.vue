<template>
  <div
    class="mindmap-note-node"
    :class="{ selected }"
    :style="nodeStyle"
  >
    <NodeResizer
      v-if="!readonly"
      :min-width="160"
      :min-height="90"
      color="rgba(142, 68, 173, 0.9)"
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

    <!-- Header -->
    <div class="note-header nodrag" :style="headerStyle">
      <input
        v-if="isEditing"
        v-model="localTitle"
        class="note-title-input"
        placeholder="Title…"
        @mousedown.stop
      />
      <span v-else class="note-title" @dblclick="startEditing">
        {{ data.title || 'Untitled' }}
      </span>

      <div class="note-header-actions">
        <v-menu v-if="!readonly" location="bottom end">
          <template #activator="{ props: menuProps }">
            <button class="mm-icon-btn" v-bind="menuProps" @mousedown.stop title="Color">
              <span class="color-dot" :style="{ background: data.color || defaultColor }" />
            </button>
          </template>
          <div class="color-swatches">
            <button
              v-for="c in swatches"
              :key="c"
              class="swatch"
              :style="{ background: c }"
              @click="setColor(c)"
            />
          </div>
        </v-menu>
        <button
          v-if="!readonly && !isEditing"
          class="mm-icon-btn nodrag"
          title="Edit"
          @mousedown.stop
          @click="startEditing"
        >
          <v-icon size="14">mdi-pencil</v-icon>
        </button>
        <button
          v-if="!readonly"
          class="mm-icon-btn nodrag"
          title="Delete"
          @mousedown.stop
          @click="onDelete"
        >
          <v-icon size="14">mdi-delete-outline</v-icon>
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="note-body nodrag nowheel" @wheel.stop @mousedown.stop>
      <div v-if="!isEditing" class="note-content" @dblclick="startEditing">
        <div v-if="data.html" class="rich-content" v-html="data.html" />
        <span v-else class="placeholder">Double-click to write…</span>
      </div>

      <div v-else class="note-editor-wrap">
        <tip-tap-editor
          v-model="localHtml"
          placeholder="Write your idea…"
          min-height="120px"
          :library-id="libraryId"
        />
        <div class="editor-actions">
          <v-btn size="x-small" variant="text" @mousedown.stop @click="cancelEditing">Cancel</v-btn>
          <v-btn size="x-small" color="primary" variant="flat" @mousedown.stop @click="finishEditing">Done</v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'
import TipTapEditor from '@/components/common/TipTapEditor.vue'

interface NoteNodeData {
  title?: string
  html?: string
  color?: string
  [key: string]: any
}

const props = defineProps<{
  id: string
  data: NoteNodeData
  selected?: boolean
}>()

const readonly = inject<boolean>('mindmapReadonly', false)
const libraryId = inject<number | null>('mindmapLibraryId', null)
const requestSave = inject<() => void>('mindmapRequestSave', () => {})

const { updateNodeData, removeNodes } = useVueFlow()

const defaultColor = '#8E44AD'
const swatches = ['#8E44AD', '#3498DB', '#27AE60', '#E67E22', '#E74C3C', '#F1C40F', '#1ABC9C', '#95A5A6']

const handlePositions = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
]

const isEditing = ref(false)
const localTitle = ref('')
const localHtml = ref('')

const accent = computed(() => props.data.color || defaultColor)

const nodeStyle = computed(() => ({
  '--mm-accent': accent.value,
  borderColor: props.selected ? accent.value : 'rgba(255,255,255,0.12)',
}))

const headerStyle = computed(() => ({
  background: `linear-gradient(135deg, ${accent.value}, ${accent.value}22)`,
}))

function startEditing() {
  if (readonly) return
  localTitle.value = props.data.title || ''
  localHtml.value = props.data.html || ''
  isEditing.value = true
}

function finishEditing() {
  updateNodeData(props.id, { title: localTitle.value, html: localHtml.value })
  isEditing.value = false
  requestSave()
}

function cancelEditing() {
  isEditing.value = false
}

function setColor(color: string) {
  updateNodeData(props.id, { color })
  requestSave()
}

function onDelete() {
  removeNodes([props.id])
  requestSave()
}
</script>

<style scoped>
.mindmap-note-node {
  width: 100%;
  height: 100%;
  min-width: 160px;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  background: rgba(24, 24, 32, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  transition: border-color 0.15s ease;
}

.mindmap-note-node.selected {
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
}

.note-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  min-height: 28px;
  flex-shrink: 0;
}

.note-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  cursor: text;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-title-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 4px;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 2px 6px;
  outline: none;
}

.note-header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.mindmap-note-node:hover .note-header-actions,
.mindmap-note-node.selected .note-header-actions {
  opacity: 1;
}

.mm-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.85);
  background: transparent;
  cursor: pointer;
  border: none;
}

.mm-icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.color-swatches {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px;
  background: rgb(30, 30, 40);
  border-radius: 8px;
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.swatch:hover {
  transform: scale(1.12);
}

.note-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 10px;
  scrollbar-width: thin;
}

.note-content {
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
  cursor: text;
  word-break: break-word;
}

.placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.rich-content :deep(p) { margin: 0 0 0.4em; }
.rich-content :deep(h1) { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.3em; }
.rich-content :deep(h2) { font-size: 1rem; font-weight: 700; margin: 0 0 0.3em; }
.rich-content :deep(h3) { font-size: 0.9rem; font-weight: 600; margin: 0 0 0.2em; }
.rich-content :deep(ul), .rich-content :deep(ol) { padding-left: 1.1em; margin: 0.2em 0; }
.rich-content :deep(a) { color: #7abaff; }

.note-editor-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

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
