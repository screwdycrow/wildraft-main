<template>
  <div class="mm-junction-node" :class="{ selected }">
    <template v-for="pos in handlePositions" :key="pos.key">
      <Handle :id="`${pos.key}-target`" type="target" :position="pos.position" class="mm-j-handle" :connectable="!readonly" />
      <Handle :id="`${pos.key}-source`" type="source" :position="pos.position" class="mm-j-handle" :connectable="!readonly" />
    </template>

    <div class="mm-junction-dot" />

    <button
      v-if="!readonly"
      class="mm-del nodrag"
      title="Delete connection point"
      @mousedown.stop
      @click.stop="onDelete"
    >
      <v-icon size="11">mdi-close</v-icon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'

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

function onDelete() {
  removeNodes([props.id])
  requestSave()
}
</script>

<style scoped>
.mm-junction-node {
  position: relative;
  width: 16px;
  height: 16px;
  cursor: grab;
}
.mm-junction-node:active { cursor: grabbing; }

.mm-junction-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(240, 240, 245, 0.95);
  border: 2px solid rgba(142, 68, 173, 0.9);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.mm-junction-node.selected .mm-junction-dot {
  box-shadow: 0 0 0 3px rgba(142, 68, 173, 0.5);
}

.mm-del {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgb(40, 40, 50);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 3;
}
.mm-junction-node:hover .mm-del,
.mm-junction-node.selected .mm-del { display: inline-flex; }

.mm-j-handle {
  width: 8px;
  height: 8px;
  background: rgba(142, 68, 173, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.85);
  opacity: 0;
  transition: opacity 0.15s ease;
}
.mm-junction-node:hover .mm-j-handle,
.mm-junction-node.selected .mm-j-handle { opacity: 1; }
</style>
