<template>
  <div
    class="dm-hand-card-wrapper"
    :class="{ 'dragging': isDragging }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @dragover.prevent.stop
    @drop.prevent.stop
  >
    <item-card-wrapper
      v-if="libraryItem && !isUserFile"
      :item="libraryItem"
      :library-id="libraryId"
      :disable-click="true"
      :compact="true"
      class="hand-card"
    />
    <media-card
      v-else-if="userFile"
      :file="userFile"
      :hide-title="false"
      class="hand-card"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import MediaCard from '@/components/files/MediaCard.vue'
import type { LibraryItem } from '@/types/item.types'
import type { DmScreenItem } from '@/types/dmScreen.types'
import type { UserFile } from '@/api/files'
import * as filesApi from '@/api/files'

interface Props {
  dmScreenItem: DmScreenItem
  libraryItem: LibraryItem | undefined
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [item: LibraryItem | UserFile]
  dragstart: [dmScreenItemId: string, event: DragEvent]
  dragend: []
}>()

const isDragging = ref(false)
const userFile = ref<UserFile | null>(null)

const isUserFile = computed(() => {
  return props.dmScreenItem.type === 'UserFileId' && (props.libraryItem as any)?._userFile
})

onMounted(async () => {
  if (isUserFile.value && props.libraryItem) {
    const userFileData = (props.libraryItem as any)._userFile as UserFile
    if (userFileData) {
      userFile.value = userFileData
    } else if (props.dmScreenItem.data?.id) {
      // Fallback: fetch the file if not in the pseudo-item
      try {
        const fileId = typeof props.dmScreenItem.data.id === 'number' 
          ? props.dmScreenItem.data.id 
          : parseInt(props.dmScreenItem.data.id as string, 10)
        if (!isNaN(fileId)) {
          userFile.value = await filesApi.getFile(fileId)
        }
      } catch (error) {
        console.error('[DmHandCardWrapper] Failed to load user file:', error)
      }
    }
  }
})

function handleDragStart(event: DragEvent) {
  if (!event.dataTransfer) return
  
  const itemId = props.libraryItem?.id || userFile.value?.id
  if (!itemId) return
  
  isDragging.value = true
  event.dataTransfer.effectAllowed = 'move'
  
  // Store DmScreenItem ID for reordering
  event.dataTransfer.setData('application/json', JSON.stringify({ 
    type: 'dm-hand-item', 
    dmScreenItemId: props.dmScreenItem.id,
    libraryItemId: itemId
  }))
  event.dataTransfer.setData('text/plain', `dm-hand-item:${props.dmScreenItem.id}`)
  
  // Set a custom drag image
  const dragImage = (event.target as HTMLElement).cloneNode(true) as HTMLElement
  dragImage.style.opacity = '0.8'
  dragImage.style.position = 'absolute'
  dragImage.style.top = '-1000px'
  dragImage.style.pointerEvents = 'none'
  document.body.appendChild(dragImage)
  event.dataTransfer.setDragImage(dragImage, 0, 0)
  
  setTimeout(() => {
    if (document.body.contains(dragImage)) {
      document.body.removeChild(dragImage)
    }
  }, 0)
  
  emit('dragstart', props.dmScreenItem.id, event)
}

function handleDragEnd() {
  isDragging.value = false
  emit('dragend')
}

function handleClick() {
  if (userFile.value) {
    emit('click', userFile.value)
  } else if (props.libraryItem) {
    emit('click', props.libraryItem)
  }
}
</script>

<style scoped>
.dm-hand-card-wrapper {
  flex-shrink: 0;
  cursor: grab;
  transition: transform 0.2s ease, opacity 0.2s ease;
  width: 180px;
  position: relative;
  user-select: none;
}

.dm-hand-card-wrapper:hover:not(.dragging) {
  transform: scale(0.9) translateY(-20px);
  z-index: 1000;
  position: relative;
  will-change: transform;
}

.dm-hand-card-wrapper.dragging {
  opacity: 0.4;
  transform: scale(0.95);
}

.hand-card {
  width: 100%;
  height: auto;
}
</style>

