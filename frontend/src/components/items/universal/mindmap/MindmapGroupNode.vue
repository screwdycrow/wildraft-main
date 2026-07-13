<template>
  <div class="mm-group-node" :class="{ selected }" :style="nodeStyle">
    <NodeResizer
      v-if="!readonly"
      :min-width="140"
      :min-height="100"
      :color="color"
      :is-visible="selected"
    />

    <!-- Fill ignores pointer events so nodes placed on top stay clickable -->
    <div class="mm-group-fill" :style="{ borderColor: color, background: color + '14' }" />

    <!-- Header is the interactive/draggable part -->
    <div class="mm-group-header" :style="{ background: color }">
      <v-icon icon="mdi-group" size="13" color="white" class="mr-1" />
      <span class="mm-group-label">{{ data.label || 'Group' }}</span>
      <span class="spacer" />
      <button
        v-if="!readonly"
        class="mm-del nodrag"
        title="Delete group"
        @mousedown.stop
        @click.stop="onDelete"
      >
        <v-icon size="13">mdi-close</v-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'

const props = defineProps<{ id: string; data: Record<string, any>; selected?: boolean }>()

const readonly = inject<boolean>('mindmapReadonly', false)
const requestSave = inject<() => void>('mindmapRequestSave', () => {})
const { removeNodes } = useVueFlow()

const color = computed(() => props.data.color || '#5D6D7E')
const nodeStyle = computed(() => ({ '--mm-accent': color.value }))

function onDelete() {
  removeNodes([props.id])
  requestSave()
}
</script>

<style scoped>
.mm-group-node {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 140px;
  min-height: 100px;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}
.mm-group-node:active { cursor: grabbing; }

.mm-group-fill {
  position: absolute;
  inset: 0;
  border: 1.5px solid;
  border-radius: 12px;
  pointer-events: none; /* let nodes inside the group receive clicks */
}
.mm-group-node.selected .mm-group-fill {
  box-shadow: 0 0 0 2px var(--mm-accent);
}

.mm-group-header {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: 12px 12px 8px 0;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.mm-group-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spacer { width: 6px; }

.mm-del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
}
.mm-group-node:hover .mm-del,
.mm-group-node.selected .mm-del { opacity: 0.9; }
.mm-del:hover { background: rgba(0, 0, 0, 0.25); }

:deep(.vue-flow__resize-control) { z-index: 12; }
</style>
