<template>
  <div class="mindmap-ref-node" :class="{ selected }" :style="nodeStyle">
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

    <button
      v-if="!readonly"
      class="mm-delete nodrag"
      title="Delete"
      @mousedown.stop
      @click.stop="onDelete"
    >
      <v-icon size="14">mdi-close</v-icon>
    </button>

    <div class="ref-body">
      <v-avatar size="40" class="ref-avatar" :color="typeInfo.color">
        <v-img v-if="imageUrl" :src="imageUrl" cover />
        <v-icon v-else :icon="typeInfo.icon" color="white" size="20" />
      </v-avatar>
      <div class="ref-text">
        <div class="ref-name">{{ target?.name || 'Missing item' }}</div>
        <div class="ref-type" :style="{ color: typeInfo.color }">
          <v-icon :icon="typeInfo.icon" size="11" class="mr-1" />
          {{ typeInfo.label }}
        </div>
      </div>
      <button
        v-if="target"
        class="ref-open nodrag"
        title="Open item"
        @mousedown.stop
        @click.stop="openItem"
      >
        <v-icon size="16">mdi-open-in-new</v-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { useItemsStore } from '@/stores/items'
import { useItemComponents } from '@/composables/useItemComponents'
import { getFileDownloadUrl } from '@/config/api'
import type { ItemType } from '@/types/item.types'

interface RefNodeData {
  libraryItemId?: number
  [key: string]: any
}

const props = defineProps<{
  id: string
  data: RefNodeData
  selected?: boolean
}>()

const readonly = inject<boolean>('mindmapReadonly', false)
const libraryId = inject<number | null>('mindmapLibraryId', null)
const requestSave = inject<() => void>('mindmapRequestSave', () => {})

const router = useRouter()
const itemsStore = useItemsStore()
const { getItemTypeInfo } = useItemComponents()
const { removeNodes } = useVueFlow()

const handlePositions = [
  { key: 'top', position: Position.Top },
  { key: 'right', position: Position.Right },
  { key: 'bottom', position: Position.Bottom },
  { key: 'left', position: Position.Left },
]

const target = computed(() =>
  itemsStore.items.find((i) => i.id === props.data.libraryItemId) || null
)

const typeInfo = computed(() =>
  target.value
    ? getItemTypeInfo(target.value.type as ItemType)
    : { icon: 'mdi-help-circle-outline', color: '#7F8C8D', label: 'Unknown' }
)

const imageUrl = computed(() =>
  target.value?.featuredImage?.downloadUrl ? getFileDownloadUrl(target.value.featuredImage) : null
)

const nodeStyle = computed(() => ({
  '--mm-accent': typeInfo.value.color,
  borderColor: props.selected ? typeInfo.value.color : 'rgba(255,255,255,0.12)',
}))

function openItem() {
  if (!target.value || libraryId == null) return
  router.push({
    name: 'ItemDetail',
    params: { libraryId, itemId: target.value.id },
  })
}

function onDelete() {
  removeNodes([props.id])
  requestSave()
}
</script>

<style scoped>
.mindmap-ref-node {
  position: relative;
  min-width: 180px;
  max-width: 260px;
  background: rgba(var(--panel-bg), 0.95);
  color: rgb(var(--panel-text));
  border: 1px solid rgba(var(--panel-border), 0.2);
  border-left: 3px solid var(--mm-accent, #7F8C8D);
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  transition: border-color 0.15s ease;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.mindmap-ref-node:active {
  cursor: grabbing;
}

.ref-body {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.ref-avatar {
  flex-shrink: 0;
}

.ref-text {
  flex: 1;
  min-width: 0;
}

.ref-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: rgb(var(--panel-text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ref-type {
  display: flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-top: 2px;
}

.ref-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--panel-text), 0.6);
  flex-shrink: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.ref-open:hover {
  color: rgb(var(--panel-text));
  background: rgba(var(--panel-text), 0.12);
}

.mm-delete {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
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

.mindmap-ref-node:hover .mm-delete,
.mindmap-ref-node.selected .mm-delete {
  display: inline-flex;
}

.mm-handle {
  width: 9px;
  height: 9px;
  background: var(--mm-accent, #7F8C8D);
  border: 2px solid rgba(var(--panel-bg), 0.9);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.mm-handle-source {
  cursor: crosshair;
}

.mindmap-ref-node:hover .mm-handle,
.mindmap-ref-node.selected .mm-handle {
  opacity: 1;
}
</style>
