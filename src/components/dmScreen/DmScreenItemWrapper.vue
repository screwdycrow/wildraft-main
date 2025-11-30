<template>
  <div 
    class="dm-screen-item-wrapper"
    :class="{ 
      'scaled': isScaled && !item.data.isBackground && item.type !== 'TokenNode' && item.type !== 'ShapeNode' && item.type !== 'EffectNode',
      'is-background': item.data.isBackground,
      'is-token': item.type === 'TokenNode',
      'is-effect': item.type === 'EffectNode',
      'is-shape': item.type === 'ShapeNode',
      'transparent': item.type === 'TextNode' || item.type === 'ShapeNode' || item.type === 'EffectNode'
    }"
    :style="wrapperStyle"
  >
    <!-- Selection handle / toolbar for regular items (not tokens, text/shape/effect nodes, or backgrounds) -->
    <div 
      v-if="item.type !== 'TokenNode' && item.type !== 'TextNode' && item.type !== 'ShapeNode' && item.type !== 'EffectNode' && !item.data.isBackground" 
      class="selection-handle"
      data-drag-handle
    >
      <div class="handle-grab">
        <v-icon size="x-small" color="rgba(255, 255, 255, 0.7)">mdi-drag</v-icon>
        <span class="handle-title">{{ itemTitle }}</span>
      </div>
    </div>

    <!-- TokenNode Display (compact circular token) -->
    <token-node-display
      v-if="item.type === 'TokenNode'"
      :item="item"
      :library-id="libraryId"
    />

    <!-- Full View (all other types) -->
    <div v-else class="item-content" :class="{ 'has-handle': !item.data.isBackground && item.type !== 'TokenNode' && item.type !== 'ShapeNode' && item.type !== 'TextNode' && item.type !== 'EffectNode' }" :style="shouldApplyContentScaling ? contentStyle : {}">
      <!-- LibraryItemId -->
      <div 
        v-if="item.type === 'LibraryItemId' && libraryItem" 
        class="item-content-wrapper library-item-content"
        @click.prevent.stop="handleView(libraryItem)"
      >
        <item-card-wrapper
          :item="libraryItem"
          :hide-delete="true"
          :disable-click="true"
          @featured-image-url="handleFeaturedImageUrl"
          @edit="handleEdit"
          @view="handleView"
        />
      </div>

      <!-- UserFileId (Background images show as full image) -->
      <div 
        v-else-if="item.type === 'UserFileId' && userFile && item.data.isBackground" 
        class="background-image-container"
        :style="{ opacity: props.backgroundOpacity ?? 1 }"
      >
        <img
          v-if="userFile.fileType.startsWith('image/') && userFile.downloadUrl"
          :key="`bg-img-${userFile.id}-${item.data.objectFit || 'fill'}`"
          :src="userFile.downloadUrl"
          class="background-image"
          :class="{ 'object-fit-cover': item.data.objectFit === 'cover' }"
          alt="Background"
        />
        <media-card
          v-else
          :key="`bg-card-${userFile.id}`"
          :file="userFile"
          @click="handleFileClick"
        />
        <!-- Portal Actions for Background Images -->
        <div v-if="hasActivePortal" class="background-portal-actions">
          <v-tooltip text="Send to Portal" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                icon="mdi-television"
                size="x-small"
                color="primary"
                :loading="isSendingToPortal"
                @click.stop="handleSendToPortal"
              />
            </template>
          </v-tooltip>
          <v-tooltip text="Show On Top" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                icon="mdi-television-play"
                size="x-small"
                color="primary"
                :disabled="isSendingToPortal"
                @click.stop="handleShowOnTop"
              />
            </template>
          </v-tooltip>
        </div>
      </div>
      <!-- UserFileId (Regular files) -->
      <div 
        v-else-if="item.type === 'UserFileId' && userFile" 
        class="item-content-wrapper"
        @click.prevent.stop="handleFileClick(userFile)"
      >
        <media-card
          :file="userFile"
        />
      </div>

      <!-- CombatantItemToken -->
      <token-component
        v-else-if="item.type === 'CombatantItemToken'"
        :item="item"
        :library-id="libraryId"
        @update="handleItemUpdate"
      />

      <!-- QuickNote -->
      <quick-note-component
        v-else-if="item.type === 'quickNote'"
        :item="item"
        @update="handleItemUpdate"
      />

      <!-- WebLink -->
      <web-link-component
        v-else-if="item.type === 'webLink'"
        :item="item"
        @update="handleItemUpdate"
      />

      <!-- ImageUrl -->
      <image-url-component
        v-else-if="item.type === 'ImageUrl'"
        :item="item"
        @update="handleItemUpdate"
      />

      <!-- TextNode -->
      <text-node
        v-else-if="item.type === 'TextNode'"
        :item="item"
        @update:text="handleTextUpdate"
      />

      <!-- ShapeNode -->
      <shape-node
        v-else-if="item.type === 'ShapeNode'"
        :item="item"
        :selected="props.selected"
        :rotation="props.rotation"
        :width="props.item.nodeOptions?.width"
        :height="props.item.nodeOptions?.height"
        @update:data="handleShapeDataUpdate"
      />

      <!-- EffectNode (particle/lighting effects) -->
      <effect-node-display
        v-else-if="item.type === 'EffectNode'"
        :item="item"
        :library-id="libraryId"
        :selected="props.selected"
        :rotation="props.rotation"
        @update:path="handleBeamPathUpdate"
      />

      <!-- Fallback for unknown types -->
      <div v-else class="unknown-item-type">
        <v-icon icon="mdi-alert" size="48" color="warning" />
        <p class="text-body-2 mt-2">Unknown item type: {{ item.type }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import type { UserFile } from '@/api/files'
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import MediaCard from '@/components/files/MediaCard.vue'
import TokenComponent from './TokenComponent.vue'
import TokenNodeDisplay from './TokenNodeDisplay.vue'
import QuickNoteComponent from './QuickNoteComponent.vue'
import WebLinkComponent from './WebLinkComponent.vue'
import ImageUrlComponent from './ImageUrlComponent.vue'
import TextNode from './TextNode.vue'
import ShapeNode from './ShapeNode.vue'
import EffectNodeDisplay from './EffectNodeDisplay.vue'
import { useItemsStore } from '@/stores/items'
import { useFilesStore } from '@/stores/files'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useDialogsStore } from '@/stores/dialogs'
import { usePortalViewsStore } from '@/stores/portalViews'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useToast } from 'vue-toastification'
import * as filesApi from '@/api/files'
import { itemsApi } from '@/api/items'

interface Props {
  item: DmScreenItem
  libraryId: number
  dmScreenId: string
  snapToGrid?: boolean
  gridSize?: number
  backgroundOpacity?: number
  selected?: boolean
  rotation?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [item: DmScreenItem]
  delete: [itemId: string]
}>()

const itemsStore = useItemsStore()
const filesStore = useFilesStore()
const dmScreensStore = useDmScreensStore()
const dialogsStore = useDialogsStore()
const portalViewsStore = usePortalViewsStore()
const { sendPortalViewUpdate } = usePortalSocket()
const toast = useToast()
const isSendingToPortal = ref(false)

const libraryItem = ref<LibraryItem | null>(null)
const userFile = ref<UserFile | null>(null)

// Load library item if type is LibraryItemId (cached to prevent reloading)
const loadLibraryItem = async () => {
  if (props.item.type === 'LibraryItemId' && props.item.data.id) {
    // Don't reload if we already have it
    if (libraryItem.value && libraryItem.value.id === props.item.data.id) {
      return
    }
    
    try {
      // Try to get from store first
      const cachedItem = itemsStore.getItemById(props.item.data.id)
      if (cachedItem) {
        libraryItem.value = cachedItem
        return
      }
      
      // If not in store, fetch from API
      const response = await itemsApi.getById(props.libraryId, props.item.data.id)
      libraryItem.value = response.item
    } catch (error) {
      console.error('[DmScreenItemWrapper] Failed to load library item:', error)
    }
  }
}

// Load user file if type is UserFileId (cached to prevent reloading)
const loadUserFile = async () => {
  if (props.item.type === 'UserFileId' && props.item.data.id) {
    // Don't reload if we already have it
    if (userFile.value && userFile.value.id === props.item.data.id) {
      return
    }
    
    try {
      const file = await filesApi.getFile(props.item.data.id)
      userFile.value = file
    } catch (error) {
      console.error('[DmScreenItemWrapper] Failed to load user file:', error)
    }
  }
}

// Get item title for display
const itemTitle = computed(() => {
  switch (props.item.type) {
    case 'LibraryItemId':
      return libraryItem.value?.name || 'Library Item'
    case 'UserFileId':
      return userFile.value?.fileName || 'File'
    case 'CombatantItemToken':
      return props.item.data.combatantName || 'Token'
    case 'TokenNode':
      return props.item.data.tokenLabel || 'Token'
    case 'quickNote':
      return props.item.data.title || 'Quick Note'
    case 'webLink':
      return props.item.data.title || 'Web Link'
    case 'ImageUrl':
      return props.item.data.title || 'Image'
    case 'EffectNode':
      return props.item.data.effectConfig?.effectType || 'Effect'
    default:
      return 'Item'
  }
})

// Get current node width from nodeOptions
const nodeWidth = computed(() => {
  return props.item.nodeOptions?.width || 300
})

// Check if content should be scaled down (below 300px)
const isScaled = computed(() => {
  return nodeWidth.value < 300
})

// Only apply content scaling to library items, not shapes/text/effects
const shouldApplyContentScaling = computed(() => {
  const type = props.item.type
  // Don't scale backgrounds, shapes, text, effects, or tokens
  if (props.item.data.isBackground) return false
  if (type === 'ShapeNode' || type === 'TextNode' || type === 'EffectNode' || type === 'TokenNode') return false
  // Only apply scaling for library items when scaled
  return isScaled.value
})

// Wrapper style
const wrapperStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
  }
})

// Content style (scale down if below 300px)
// NOTE: Shapes and Effects should NOT be scaled - they resize directly
const contentStyle = computed(() => {
  // Don't apply scaling to ShapeNode or EffectNode - they use direct sizing
  if (props.item.type === 'ShapeNode' || props.item.type === 'EffectNode') {
    return {}
  }
  
  if (isScaled.value) {
    const scale = nodeWidth.value / 300
    return {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: '300px',
    }
  }
  return {}
})

// Handle featured image URL from ItemCardWrapper
function handleFeaturedImageUrl(url: string) {
  // Update item data with the URL for caching
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      featuredImageUrl: url
    }
  }
  emit('update', updatedItem)
}

function handleDelete() {
  emit('delete', props.item.id)
}

function handleEdit(item: LibraryItem) {
  // Open item editor globally
  dialogsStore.openItemEditor(item, props.libraryId)
}

function handleView(item: LibraryItem) {
  // Open item viewer globally
  dialogsStore.openItemViewer(item, props.libraryId)
}

function handleFileClick(file: UserFile) {
  // Open file viewer globally
  dialogsStore.openFileViewer(file)
}

const hasActivePortal = computed(() => !!portalViewsStore.activePortal)

async function handleSendToPortal() {
  if (!userFile.value) return
  isSendingToPortal.value = true
  try {
    await portalViewsStore.addItemToActivePortal(userFile.value, true)
    toast.success(`Sent "${userFile.value.fileName}" to portal and set as current`)
  } catch (error: any) {
    console.error('[DmScreenItemWrapper] Failed to send to portal:', error)
    toast.error(error.message || 'Failed to send to portal')
  } finally {
    isSendingToPortal.value = false
  }
}

function handleShowOnTop() {
  if (!userFile.value) return
  // Send show-on-top command with the UserFile
  sendPortalViewUpdate({
    command: 'show-on-top',
    userFile: userFile.value,
  })
  
  toast.success(`Showing "${userFile.value.fileName}" on portal`)
}

function handleContentClick() {
  // Open viewer when clicking on the content
  if (libraryItem.value) {
    handleView(libraryItem.value)
  } else if (userFile.value) {
    handleFileClick(userFile.value)
  }
}

function handleItemUpdate(updatedItem: DmScreenItem) {
  emit('update', updatedItem)
}

function handleTextUpdate(text: string) {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      text,
    }
  }
  emit('update', updatedItem)
}

function handleShapeDataUpdate(data: any) {
  const updatedItem = {
    ...props.item,
    data: {
      ...props.item.data,
      ...data,
    }
  }
  emit('update', updatedItem)
}

function handleBeamPathUpdate(path: string) {
  if (!props.item.data.effectConfig) return
  
  const updatedItem: DmScreenItem = {
    ...props.item,
    data: {
      ...props.item.data,
      effectConfig: {
        ...props.item.data.effectConfig,
        beamPath: path,
      },
    },
  }
  emit('update', updatedItem)
}

onMounted(async () => {
  await Promise.all([
    loadLibraryItem(),
    loadUserFile()
  ])
  
  console.log('[DmScreenItemWrapper] Mounted item:', props.item.id, props.item.type)
})

// Watch for item changes (only when ID or type changes, not position)
watch(() => [props.item.type, props.item.data.id], ([newType, newId], [oldType, oldId]) => {
  // Only reload if the type or ID actually changed
  if (newType !== oldType || newId !== oldId) {
    if (props.item.type === 'LibraryItemId') {
      loadLibraryItem()
    } else if (props.item.type === 'UserFileId') {
      loadUserFile()
    }
  }
}, { immediate: false })

// Vue Flow handles all positioning and dragging
</script>

<style scoped>
.dm-screen-item-wrapper {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.01);
  overflow: hidden;
  user-select: none;
  position: relative;
  display: flex;
  flex-direction: column;
}


.dm-screen-item-wrapper:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.dm-screen-item-wrapper.transparent {
  border: none;
  background: transparent;
  overflow: visible;
}

.dm-screen-item-wrapper.transparent:hover {
  border-color: transparent;
  background: transparent;
}

/* Background images - fill container completely, no scaling */
.dm-screen-item-wrapper.is-background {
  border: none;
  background: transparent;
  border-radius: 0;
}

.dm-screen-item-wrapper.is-background:hover {
  border: none;
  background: transparent;
}

.dm-screen-item-wrapper.is-background .item-content {
  width: 100% !important;
  height: 100% !important;
  transform: none !important;
  padding: 0 !important;
}

/* Selection handle toolbar - More discrete */
.selection-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: rgba(20, 20, 30, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  z-index:1000;
  cursor: move;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  opacity: 0.7;
}

.selection-handle:hover {
  opacity: 1;
  background: rgba(30, 30, 40, 0.95);
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.handle-grab {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  cursor: move;
  user-select: none;
}

.handle-title {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.handle-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.item-controls {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  z-index: 20;
  opacity: 0;
}

.dm-screen-item-wrapper:hover .item-controls {
  opacity: 1;
}

/* Token node styles - circular display without background */
.dm-screen-item-wrapper.is-token {
  border: none;
  background: transparent;
  border-radius: 50%;
  overflow: visible;
}

.dm-screen-item-wrapper.is-token:hover {
  border: none;
  background: transparent;
}

/* Effect node styles - transparent, allows blend modes to work with content below */
.dm-screen-item-wrapper.is-effect {
  border: none;
  background: transparent;
  border-radius: 0;
  overflow: visible;
  pointer-events: none; /* Allow clicks to pass through effect */
  /* Critical: don't isolate stacking context so blend modes affect content below */
  isolation: auto;
  mix-blend-mode: normal;
}

.dm-screen-item-wrapper.is-effect:hover {
  border: none;
  background: transparent;
}

.dm-screen-item-wrapper.is-effect .item-content {
  overflow: visible;
  pointer-events: none;
  isolation: auto;
}

/* Shape node styles - direct sizing, no scaling */
.dm-screen-item-wrapper.is-shape {
  border: none;
  background: transparent;
  border-radius: 0;
  overflow: visible;
}

.dm-screen-item-wrapper.is-shape .item-content {
  width: 100%;
  height: 100%;
  overflow: visible;
  padding: 0;
}

/* Ensure shapes and effects fill their containers directly without transform scaling */
.dm-screen-item-wrapper.is-shape .shape-node,
.dm-screen-item-wrapper.is-effect .effect-node-container {
  width: 100%;
  height: 100%;
}

.item-content {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0; /* Important for flex children */
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.item-content.has-handle {
  padding-top: 24px; /* Space for toolbar */
  height: 100%;
}

.dm-screen-item-wrapper.transparent .item-content {
  overflow: visible;
  padding: 0;
  width: 100%;
  height: 100%;
}

/* Shape node specific - ensure full fill */
.dm-screen-item-wrapper.transparent .shape-node {
  width: 100%;
  height: 100%;
}

.item-content-wrapper {
  flex: 1;
  min-height: 0;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.item-content-wrapper:hover {
  transform: translateY(-2px);
}

.item-content-wrapper:active {
  transform: translateY(0);
}

/* Library items scale proportionally on resize */
.library-item-content {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.library-item-content :deep(.item-card-wrapper) {
  width: 100%;
  height: 100%;
  transform-origin: top left;
}

/* Scale library item content to fit container while maintaining aspect ratio */
.library-item-content :deep(.v-card) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dm-screen-item-wrapper.scaled .item-content {
  overflow: visible;
}

.background-image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: fill; /* Default: stretches to fit container */
}

.background-image.object-fit-cover {
  object-fit: cover; /* Crops to fill while maintaining aspect ratio */
}

.background-portal-actions {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  gap: 4px;
}

.background-image-container:hover .background-portal-actions {
  opacity: 1;
}

.unknown-item-type {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
}
</style>

