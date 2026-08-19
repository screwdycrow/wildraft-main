<template>
  <BaseEdge
    :id="id"
    :path="path"
    :marker-end="markerEnd"
    :style="edgeStyle"
    :class="{ 'mm-animated': data?.style === 'animated' }"
  />
  <EdgeLabelRenderer>
    <div class="mm-edge-label-wrap" :class="{ selected }" :style="wrapStyle">
      <div
        v-if="data?.label"
        class="mm-edge-label"
        :class="{ selected }"
        :style="{ borderColor: color, color: color }"
      >
        {{ data.label }}
      </div>
      <button
        v-if="!readonly"
        class="mm-edge-add nodrag nopan"
        title="Insert connection point"
        @click.stop="onInsert"
      >
        <v-icon size="12">mdi-plus</v-icon>
      </button>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Position } from '@vue-flow/core'

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  data?: Record<string, any>
  markerEnd?: string
  selected?: boolean
}>()

const readonly = inject<boolean>('mindmapReadonly', false)
const insertJunction = inject<(edgeId: string, x: number, y: number) => void>(
  'mindmapInsertJunction',
  () => {}
)

const pathData = computed(() =>
  getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  })
)
const path = computed(() => pathData.value[0])
const labelX = computed(() => pathData.value[1])
const labelY = computed(() => pathData.value[2])

const color = computed(() => props.data?.color || '#8E9BB5')

const edgeStyle = computed(() => ({
  stroke: color.value,
  strokeWidth: props.selected ? 3 : 2,
  strokeDasharray:
    props.data?.style === 'dashed' || props.data?.style === 'animated' ? '6 5' : undefined,
}))

const wrapStyle = computed(() => ({
  transform: `translate(-50%, -50%) translate(${labelX.value}px, ${labelY.value}px)`,
}))

function onInsert() {
  insertJunction(props.id, labelX.value, labelY.value)
}
</script>

<style scoped>
.mm-edge-label-wrap {
  position: absolute;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 26px;
  min-height: 26px;
}

.mm-edge-label {
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(var(--panel-bg), 0.94);
  border: 1px solid;
  font-size: 0.68rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}
.mm-edge-label.selected {
  box-shadow: 0 0 0 2px currentColor;
}

.mm-edge-add {
  display: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgb(var(--panel-bg-elevated));
  border: 1px solid rgba(var(--panel-border), 0.35);
  color: rgb(var(--panel-text));
  cursor: pointer;
}
.mm-edge-label-wrap:hover .mm-edge-add,
.mm-edge-label-wrap.selected .mm-edge-add {
  display: inline-flex;
}

:deep(.mm-animated) {
  animation: mm-edge-dash 0.5s linear infinite;
}
@keyframes mm-edge-dash {
  to {
    stroke-dashoffset: -22;
  }
}
</style>
