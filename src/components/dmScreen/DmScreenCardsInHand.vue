<template>
  <div
    v-if="shouldShow && sortedDmScreenItems.length > 0"
    class="dm-screen-cards-in-hand glass-card"
    :style="containerStyle"
  >
    <!-- Filters and Controls Bar -->
    <div class="filters-bar">
      <div class="filters-left">
        <!-- Type Filters -->
        <div class="type-filters">
          <v-chip
            v-for="typeOption in availableTypes"
            :key="typeOption.value"
            :class="{ 'active': selectedType === typeOption.value }"
            size="small"
            variant="flat"
            class="type-filter-chip"
            @click="handleTypeFilterClick(typeOption.value)"
          >
            <v-icon :icon="typeOption.icon" size="x-small" class="mr-1" />
            {{ typeOption.label }}
          </v-chip>
        </div>

        <!-- Search -->
        <v-text-field
          v-model="searchQuery"
          density="compact"
          variant="solo-filled"
          placeholder="Search..."
          prepend-inner-icon="mdi-magnify"
          hide-details
          class="search-input"
          @focus="expandIfCollapsed"
          @click="expandIfCollapsed"
        />
      </div>

      <!-- Right Side: Toggle and Navigate -->
      <div class="filters-right">
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-monitor-dashboard"
          class="navigate-button"
          @click="navigateToDmScreen"
        >
          Open DM Screen
        </v-btn>
        <v-btn
          icon
          size="small"
          variant="text"
          class="toggle-button"
          @click="isCollapsed = !isCollapsed"
        >
          <v-icon>{{ isCollapsed ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          <v-tooltip activator="parent" location="top">
            {{ isCollapsed ? 'Show cards' : 'Hide cards' }}
          </v-tooltip>
        </v-btn>
      </div>
    </div>

    <!-- Cards Container -->
    <v-expand-transition>
      <div
        v-show="!isCollapsed"
        class="cards-wrapper"
        ref="scrollWrapper"
        :class="{ 'drag-over': isDragOver }"
        @wheel="handleHorizontalScroll"
        @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
          <div class="cards-container">
            <template v-for="(pair, index) in filteredItems" :key="pair.dmScreenItem.id">
              <!-- Drop zone BEFORE each card -->
              <div
                class="drop-zone"
                :class="{ 'active': draggedOverIndex === index }"
                @dragover.prevent="handleDropZoneDragOver($event, index)"
                @dragleave="handleDropZoneDragLeave"
                @drop.prevent="handleDropZoneDrop($event, index)"
              >
                <div v-if="draggedOverIndex === index && draggedItem" class="drop-preview-box">
                  <item-card-wrapper
                    v-if="draggedItem"
                    :item="draggedItem"
                    :library-id="activeDmScreen?.libraryId || 0"
                    :disable-click="true"
                    :compact="true"
                    class="drop-preview-card"
                  />
                </div>
              </div>
              
              <!-- Actual card with wrapper -->
              <dm-hand-card-wrapper
                :dm-screen-item="pair.dmScreenItem"
                :library-item="pair.libraryItem"
                :library-id="activeDmScreen?.libraryId || 0"
                @click="handleCardClick"
                @dragstart="handleCardDragStart"
                @dragend="handleCardDragEnd"
              />
            </template>
            
            <!-- Drop zone AFTER all cards -->
            <div
              class="drop-zone"
              :class="{ 'active': draggedOverIndex === filteredItems.length }"
              @dragover.prevent="handleDropZoneDragOver($event, filteredItems.length)"
              @dragleave="handleDropZoneDragLeave"
              @drop.prevent="handleDropZoneDrop($event, filteredItems.length)"
            >
              <div v-if="draggedOverIndex === filteredItems.length && draggedItem" class="drop-preview-box">
                <item-card-wrapper
                  v-if="draggedItem"
                  :item="draggedItem"
                  :library-id="activeDmScreen?.libraryId || 0"
                  :disable-click="true"
                  :compact="true"
                  class="drop-preview-card"
                />
              </div>
            </div>
          </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useItemsStore } from '@/stores/items'
import { useDialogsStore } from '@/stores/dialogs'
import { useFilesStore } from '@/stores/files'
import { itemsApi } from '@/api/items'
import { useItemComponents } from '@/composables/useItemComponents'
import DmHandCardWrapper from '@/components/dmScreen/DmHandCardWrapper.vue'
import type { LibraryItem, ItemType } from '@/types/item.types'
import type { DmScreenItem } from '@/types/dmScreen.types'
import type { UserFile } from '@/api/files'
import * as filesApi from '@/api/files'
import { useToast } from 'vue-toastification'

interface Props {
  leftSidebarWidth?: number
  rightSidebarWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  leftSidebarWidth: undefined,
  rightSidebarWidth: undefined,
})

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()
const dmScreensStore = useDmScreensStore()
const itemsStore = useItemsStore()
const dialogsStore = useDialogsStore()
const filesStore = useFilesStore()
const { getItemTypeInfo } = useItemComponents()
const toast = useToast()

const isLoading = ref(false)
const isCollapsed = ref(false)
const scrollWrapper = ref<HTMLElement | null>(null)

const searchQuery = ref('')
const selectedType = ref<ItemType | null>(null)
const draggedItemId = ref<string | null>(null) // DmScreenItem ID of the item being dragged
const draggedOverIndex = ref<number | null>(null) // Index where the item would be dropped
const isDragOver = ref(false) // For external drag over the whole hand
const draggedItem = ref<LibraryItem | null>(null) // LibraryItem being dragged for preview

// Store DmScreenItems sorted by order - this is our source of truth
const sortedDmScreenItems = ref<DmScreenItem[]>([])
// Map library item ID to LibraryItem for quick lookup
const libraryItemsMap = ref<Map<number, LibraryItem>>(new Map())

// Sidebar width calculations - use props if provided, otherwise detect from DOM
const leftSidebarWidth = ref(0)
const rightSidebarWidth = ref(0)
const leftSidebarOpen = ref(false)
const rightSidebarOpen = ref(false)

// Use props if provided, otherwise calculate from DOM
const effectiveLeftSidebarWidth = computed(() => {
  if (props.leftSidebarWidth !== undefined) {
    return props.leftSidebarWidth
  }
  return leftSidebarWidth.value
})

const effectiveRightSidebarWidth = computed(() => {
  if (props.rightSidebarWidth !== undefined) {
    return props.rightSidebarWidth
  }
  return rightSidebarWidth.value
})

// Calculate sidebar widths based on Vuetify defaults (fallback if props not provided)
const calculateSidebarWidths = () => {
  // Left sidebar: 200px when open, ~56px when in rail mode, 0 when closed
  const leftDrawers = document.querySelectorAll('.v-navigation-drawer')
  let leftDrawer: Element | null = null
  
  // Find the left drawer (not on the right side)
  for (const drawer of leftDrawers) {
    const style = window.getComputedStyle(drawer)
    const right = style.getPropertyValue('right')
    if (right === 'auto' || right === '' || parseFloat(right) === 0) {
      leftDrawer = drawer
      break
    }
  }
  
  if (leftDrawer) {
    const isRail = leftDrawer.classList.contains('v-navigation-drawer--rail')
    const isTemporary = leftDrawer.classList.contains('v-navigation-drawer--temporary')
    const computedStyle = window.getComputedStyle(leftDrawer)
    const transform = computedStyle.transform
    const isVisible = transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)' || 
                      (!isTemporary && !mobile.value)
    
    leftSidebarOpen.value = isVisible && !mobile.value
    leftSidebarWidth.value = isRail ? 56 : (isVisible && !mobile.value ? 200 : 0)
  } else {
    leftSidebarWidth.value = 0
    leftSidebarOpen.value = false
  }

  // Right sidebar: 350px when open, 0 when closed
  const rightDrawers = document.querySelectorAll('.v-navigation-drawer')
  let rightDrawer: Element | null = null
  
  // Find the right drawer (check for location="right" attribute or right positioning)
  for (const drawer of rightDrawers) {
    // Check if it's the right drawer by looking for location attribute or checking if it's positioned on the right
    const location = drawer.getAttribute('location')
    const style = window.getComputedStyle(drawer)
    const left = style.getPropertyValue('left')
    const right = style.getPropertyValue('right')
    
    // Right drawer is either marked with location="right" or positioned on the right side
    if (location === 'right' || (left === 'auto' && right !== 'auto' && parseFloat(right) >= 0)) {
      rightDrawer = drawer
      break
    }
  }
  
  if (rightDrawer) {
    const computedStyle = window.getComputedStyle(rightDrawer)
    const transform = computedStyle.transform
    const isTemporary = rightDrawer.classList.contains('v-navigation-drawer--temporary')
    const isVisible = transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)' ||
                      (!isTemporary && !mobile.value)
    
    rightSidebarOpen.value = isVisible && !mobile.value
    rightSidebarWidth.value = isVisible && !mobile.value ? 350 : 0
  } else {
    rightSidebarWidth.value = 0
    rightSidebarOpen.value = false
  }
}

// Watch for sidebar changes
let observer: MutationObserver | null = null
let intervalId: number | null = null

onMounted(() => {
  // Only calculate from DOM if props are not provided
  if (props.leftSidebarWidth === undefined || props.rightSidebarWidth === undefined) {
    calculateSidebarWidths()
    
    // Observe DOM changes for sidebar state
    observer = new MutationObserver(() => {
      calculateSidebarWidths()
    })
    
    // Observe the app container for sidebar changes
    const app = document.querySelector('.v-application')
    if (app) {
      observer.observe(app, {
        attributes: true,
        attributeFilter: ['class', 'style'],
        childList: true,
        subtree: true
      })
    }
    
    // Also listen for window resize
    window.addEventListener('resize', calculateSidebarWidths)
    
    // Periodic check as fallback
    intervalId = window.setInterval(calculateSidebarWidths, 500)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  window.removeEventListener('resize', calculateSidebarWidths)
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})

// Computed style for parent container to respect sidebars
const containerStyle = computed(() => {
  const left = Math.max(0, effectiveLeftSidebarWidth.value)
  const right = Math.max(0, effectiveRightSidebarWidth.value)
  const totalMargin = left + right

  return {
    left: `${left}px`,
    right: `${right}px`,
    width: `calc(100% - ${totalMargin}px)`,
  }
})

const activeDmScreen = computed(() => dmScreensStore.activeDmScreen)
const cardsInHandEnabled = computed(() => dmScreensStore.cardsInHandEnabled)

// Hide on DM screen view or if disabled
const shouldShow = computed(() => {
  return (
    route.name !== 'DmScreen' &&
    activeDmScreen.value !== null &&
    cardsInHandEnabled.value
  )
})

// Watch for changes in active DM screen, route, or enabled state
watch([activeDmScreen, () => route.name, cardsInHandEnabled], async () => {
  if (shouldShow.value && activeDmScreen.value?.items) {
    await loadLibraryItems()
  } else {
    sortedDmScreenItems.value = []
    libraryItemsMap.value.clear()
  }
}, { immediate: true, deep: true })

// Watch for sidebar width changes from props
watch([() => props.leftSidebarWidth, () => props.rightSidebarWidth], () => {
  // Force reactivity update
}, { immediate: true })

async function loadLibraryItems() {
  if (!activeDmScreen.value?.items) {
    sortedDmScreenItems.value = [] 
    
    libraryItemsMap.value.clear()
    return
  }

  isLoading.value = true
  
  try {
    // Get DmScreenItems that are library items OR user files (non-background) and sort by order
    const dmScreenLibraryItems = activeDmScreen.value.items
      .filter((item: DmScreenItem) => 
        (item.type === 'LibraryItemId' && item.data?.id) ||
        (item.type === 'UserFileId' && item.data?.id && !item.data?.isBackground)
      )
      .sort((a: DmScreenItem, b: DmScreenItem) => (a.order ?? 999999) - (b.order ?? 999999))
    
    // Separate library items and user files
    const libraryItemIds: number[] = []
    const userFileIds: number[] = []
    
    dmScreenLibraryItems.forEach((item: DmScreenItem) => {
      if (item.type === 'LibraryItemId' && item.data?.id) {
        libraryItemIds.push(item.data.id as number)
      } else if (item.type === 'UserFileId' && item.data?.id) {
        userFileIds.push(item.data.id as number)
      }
    })
    
    // Fetch library items
    const itemsToLoad: LibraryItem[] = []
    const itemsToFetch: number[] = []

    // First, check which library items are already in the store
    for (const itemId of libraryItemIds) {
      const cachedItem = itemsStore.getItemById(itemId)
      if (cachedItem) {
        itemsToLoad.push(cachedItem)
      } else {
        itemsToFetch.push(itemId)
      }
    }

    // Fetch missing library items
    if (itemsToFetch.length > 0) {
      const fetchPromises = itemsToFetch.map(itemId =>
        itemsApi.getById(activeDmScreen.value!.libraryId, itemId)
          .then(response => response.item)
          .catch(error => {
            console.error(`Failed to fetch item ${itemId}:`, error)
            return null
          })
      )

      const fetchedItems = await Promise.all(fetchPromises)
      const validItems = fetchedItems.filter((item): item is LibraryItem => item !== null)
      itemsToLoad.push(...validItems)
    }
    
    // Fetch user files and convert them to a LibraryItem-like structure for display
    if (userFileIds.length > 0) {
      const userFilePromises = userFileIds.map(async (fileId) => {
        try {
          const file = await filesApi.getFile(fileId)
          // Create a pseudo-LibraryItem from UserFile for display purposes
          const pseudoItem: LibraryItem = {
            id: file.id,
            name: file.fileName,
            description: `File: ${file.fileType}`,
            type: 'UserFile' as any, // Special type for user files
            libraryId: activeDmScreen.value!.libraryId,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            // Store the actual UserFile in a custom property
            _userFile: file,
          } as any
          return pseudoItem
        } catch (error) {
          console.error(`Failed to fetch user file ${fileId}:`, error)
          return null
        }
      })
      
      const fetchedUserFiles = await Promise.all(userFilePromises)
      const validUserFiles = fetchedUserFiles.filter((item): item is LibraryItem => item !== null)
      itemsToLoad.push(...validUserFiles)
    }

    // Update sorted DmScreenItems (source of truth for order)
    sortedDmScreenItems.value = dmScreenLibraryItems
    
    // Update libraryItemsMap for quick lookup (includes both library items and user files)
    libraryItemsMap.value.clear()
    itemsToLoad.forEach((item: LibraryItem) => {
      libraryItemsMap.value.set(item.id, item)
    })
  } catch (error) {
    console.error('Failed to load library items:', error)
  } finally {
    isLoading.value = false
  }
}

function handleCardClick(item: LibraryItem) {
  if (activeDmScreen.value) {
    dialogsStore.openItemViewer(item, activeDmScreen.value.libraryId)
  }
}

function handleHorizontalScroll(event: WheelEvent) {
  if (!scrollWrapper.value) return
  event.preventDefault()
  scrollWrapper.value.scrollLeft += event.deltaY
}

// Get available types from loaded items
const availableTypes = computed(() => {
  const typesSet = new Set<ItemType>()
  sortedDmScreenItems.value.forEach((dmItem: DmScreenItem) => {
    const libraryItem = libraryItemsMap.value.get(dmItem.data?.id as number)
    if (libraryItem) {
      typesSet.add(libraryItem.type)
    }
  })
  
  return Array.from(typesSet).map((type: ItemType) => {
    const info = getItemTypeInfo(type)
    return {
      value: type,
      label: info.label,
      icon: info.icon,
      color: info.color,
    }
  }).sort((a, b) => a.label.localeCompare(b.label))
})

// Filtered items based on search and type filters
// Returns pairs of DmScreenItem and LibraryItem
const filteredItems = computed(() => {
  const items: Array<{ dmScreenItem: DmScreenItem; libraryItem: LibraryItem | undefined }> = []
  
  for (const dmItem of sortedDmScreenItems.value) {
    const libraryItem = libraryItemsMap.value.get(dmItem.data?.id as number)
    if (!libraryItem) continue
    
    // Filter by selected type
    if (selectedType.value) {
      const itemType = (libraryItem as any)._userFile ? 'UserFile' : libraryItem.type
      if (itemType !== selectedType.value) {
        continue
      }
    }
    
    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase().trim()
      const matches = libraryItem.name.toLowerCase().includes(query) ||
                     libraryItem.description?.toLowerCase().includes(query)
      if (!matches) continue
    }
    
    items.push({ dmScreenItem: dmItem, libraryItem })
  }
  
  return items
})

function handleTypeFilterClick(type: ItemType | string) {
  expandIfCollapsed()
  // If clicking the same type, deselect it. Otherwise, select the new type
  if (selectedType.value === type) {
    selectedType.value = null
  } else {
    selectedType.value = type
  }
}

function expandIfCollapsed() {
  if (isCollapsed.value) {
    isCollapsed.value = false
  }
}

function navigateToDmScreen() {
  if (activeDmScreen.value) {
    router.push({
      name: 'DmScreen',
      params: {
        id: activeDmScreen.value.libraryId,
        dmScreenId: activeDmScreen.value.id,
      },
    })
  }
}

// Drag and drop handlers
function handleDragOver(event: DragEvent) {
  if (!event.dataTransfer) return
  
  // Check if dragging a library item
  const types = event.dataTransfer.types
  if (types.includes('application/json') || types.includes('text/plain')) {
    event.dataTransfer.dropEffect = 'move'
    isDragOver.value = true
    
    // If dragging over the container but not a specific card, set to end
    if (draggedOverIndex.value === null) {
      draggedOverIndex.value = filteredItems.value.length
    }
  }
}

function handleDragLeave(event: DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  if (!currentTarget.contains(relatedTarget)) {
    isDragOver.value = false
    draggedOverIndex.value = null
  }
}

async function handleDrop(event: DragEvent) {
  isDragOver.value = false
  draggedOverIndex.value = null
  
  if (!event.dataTransfer || !activeDmScreen.value) return
  
  try {
    let libraryItemId: number | null = null
    
    // Try to get library item ID from dataTransfer
    try {
      const data = event.dataTransfer.getData('application/json')
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.type === 'library-item' && parsed.itemId) {
          libraryItemId = parsed.itemId
        }
      }
    } catch (e) {
      const textData = event.dataTransfer.getData('text/plain')
      if (textData && textData.startsWith('item:')) {
        libraryItemId = parseInt(textData.replace('item:', ''))
      }
    }
    
    if (!libraryItemId || isNaN(libraryItemId)) {
      return
    }
    
    // Check if item is already in the hand
    const existingItem = activeDmScreen.value.items?.find(
      (item: DmScreenItem) => item.type === 'LibraryItemId' && item.data?.id === libraryItemId
    )
    
    if (existingItem) {
      // Item already in hand, reorder it to the preview position
      const dropIndex = draggedOverIndex.value ?? sortedDmScreenItems.value.length
      await reorderItem(libraryItemId, dropIndex)
      return
    }
    
    // Get the library item
    const libraryItem = itemsStore.getItemById(libraryItemId) || 
      await itemsApi.getById(activeDmScreen.value.libraryId, libraryItemId).then(r => r.item)
    
    if (!libraryItem) {
      console.error('Item not found:', libraryItemId)
      return
    }
    
    // Get featured image URL if available
    let featuredImageUrl: string | null = null
    if (libraryItem.featuredImage) {
      featuredImageUrl = await filesStore.getDownloadUrl(libraryItem.featuredImage.id)
    }
    
    // Determine insertion position based on preview
    const dropIndex = draggedOverIndex.value ?? sortedDmScreenItems.value.length
    
    // Get the order value for the insertion position
    let newOrder: number
    if (dropIndex === 0) {
      // Insert at beginning - order before the first item
      const firstItem = sortedDmScreenItems.value[0]
      const firstOrder = firstItem?.order ?? 0
      newOrder = firstOrder - 1
    } else if (dropIndex >= sortedDmScreenItems.value.length) {
      // Insert at end - order after the last item
      const lastItem = sortedDmScreenItems.value[sortedDmScreenItems.value.length - 1]
      const lastOrder = lastItem?.order ?? 0
      newOrder = lastOrder + 1
    } else {
      // Insert between items
      const prevItem = sortedDmScreenItems.value[dropIndex - 1]
      const nextItem = sortedDmScreenItems.value[dropIndex]
      const prevOrder = prevItem?.order ?? 0
      const nextOrder = nextItem?.order ?? prevOrder + 1
      newOrder = (prevOrder + nextOrder) / 2
    }
    
    // Convert to DM screen item
    const dmScreenItem = dmScreensStore.convertLibraryItemToDmScreenItem(
      libraryItem,
      featuredImageUrl,
      newOrder
    )
    
    // Add to active DM screen
    const currentItems = activeDmScreen.value.items || []
    const updatedItems = [...currentItems, dmScreenItem]
    
    await dmScreensStore.updateDmScreen(
      activeDmScreen.value.libraryId,
      activeDmScreen.value.id,
      { items: updatedItems }
    )
    
    // Reload items to reflect the new order
    await loadLibraryItems()
  } catch (error: any) {
    console.error('Failed to add item to DM screen:', error)
  }
}

function handleCardDragStart(dmScreenItemId: string, event: DragEvent) {
  draggedItemId.value = dmScreenItemId
  // Find the DmScreenItem and get its library item ID
  const dmItem = sortedDmScreenItems.value.find(item => item.id === dmScreenItemId)
  if (dmItem && dmItem.data?.id) {
    const libraryItemId = dmItem.data.id as number
    draggedItem.value = libraryItemsMap.value.get(libraryItemId) || null
  } else {
    draggedItem.value = null
  }
}

function handleCardDragEnd() {
  draggedItemId.value = null
  draggedOverIndex.value = null
  draggedItem.value = null
}

function handleDropZoneDragOver(event: DragEvent, index: number) {
  if (!event.dataTransfer) return
  
  const types = event.dataTransfer.types
  if (types.includes('application/json') || types.includes('text/plain')) {
    event.dataTransfer.dropEffect = 'move'
    draggedOverIndex.value = index
  }
}

function handleDropZoneDragLeave(event: DragEvent) {
  const relatedTarget = event.relatedTarget as HTMLElement
  const currentTarget = event.currentTarget as HTMLElement
  
  if (!currentTarget.contains(relatedTarget)) {
    // Keep draggedOverIndex for smooth transition between zones
  }
}

async function handleDropZoneDrop(event: DragEvent, targetIndex: number) {
  const dropIndex = draggedOverIndex.value ?? targetIndex
  draggedOverIndex.value = null
  isDragOver.value = false
  
  if (!event.dataTransfer || !activeDmScreen.value) return
  
  try {
    let dmScreenItemId: string | null = null
    
    // Try to get DmScreenItem ID
    try {
      const data = event.dataTransfer.getData('application/json')
      if (data) {
        const parsed = JSON.parse(data)
        if (parsed.type === 'dm-hand-item' && parsed.dmScreenItemId) {
          dmScreenItemId = parsed.dmScreenItemId
        }
      }
    } catch (e) {
      const textData = event.dataTransfer.getData('text/plain')
      if (textData && textData.startsWith('dm-hand-item:')) {
        dmScreenItemId = textData.replace('dm-hand-item:', '')
      }
    }
    
    if (!dmScreenItemId) {
      return
    }
    
    // Reorder the item using the preview index
    await reorderItem(dmScreenItemId, dropIndex)
    toast.success('Card reordered!')
  } catch (error: any) {
    console.error('Failed to reorder item:', error)
    toast.error('Failed to reorder card')
  }
}

async function reorderItem(dmScreenItemId: string, targetIndex: number) {
  if (!activeDmScreen.value) return
  
  const currentItems = activeDmScreen.value.items || []
  
  // Get all hand items (library items AND user files, excluding background images) sorted by order
  const handItemsOnly = currentItems
    .filter((item: DmScreenItem) => 
      (item.type === 'LibraryItemId' && item.data?.id) ||
      (item.type === 'UserFileId' && item.data?.id && !item.data?.isBackground)
    )
    .sort((a: DmScreenItem, b: DmScreenItem) => (a.order ?? 999999) - (b.order ?? 999999))
  
  // Find the source item by DmScreenItem ID
  const sourceItemIndex = handItemsOnly.findIndex((item: DmScreenItem) => item.id === dmScreenItemId)
  if (sourceItemIndex === -1) {
    console.error('Source item not found:', dmScreenItemId)
    console.log('Available items:', handItemsOnly.map(i => ({ id: i.id, type: i.type })))
    return
  }
  
  // The targetIndex is a drop zone index (0 means before first card, 1 means before second card, etc.)
  let actualTargetIndex = targetIndex
  
  // If source and target are the same, no need to reorder
  if (sourceItemIndex === actualTargetIndex) {
    return
  }
  
  // Remove source item from array
  const [sourceItem] = handItemsOnly.splice(sourceItemIndex, 1)
  
  // Adjust target index if source was before target (since we removed it)
  const adjustedTargetIndex = sourceItemIndex < actualTargetIndex ? actualTargetIndex - 1 : actualTargetIndex
  
  // Insert at new position
  handItemsOnly.splice(adjustedTargetIndex, 0, sourceItem)
  
  // Update orders sequentially (0, 1, 2, ...) - create new objects for reactivity
  const reorderedItems = handItemsOnly.map((item: DmScreenItem, index: number) => ({
    ...item,
    order: index
  }))
  
  // Reconstruct items array (keep non-hand items in place - background images, text nodes, shapes, etc.)
  const nonHandItems = currentItems.filter((item: DmScreenItem) => 
    !((item.type === 'LibraryItemId' && item.data?.id) ||
      (item.type === 'UserFileId' && item.data?.id && !item.data?.isBackground))
  )
  const updatedItems = [...nonHandItems, ...reorderedItems]
  
  try {
    await dmScreensStore.updateDmScreen(
      activeDmScreen.value.libraryId,
      activeDmScreen.value.id,
      { items: updatedItems }
    )
    
    // Reload items to reflect new order
    await loadLibraryItems()
  } catch (error: any) {
    console.error('Failed to reorder item:', error)
    throw error
  }
}

onMounted(() => {
  if (shouldShow.value && activeDmScreen.value?.items) {
    loadLibraryItems()
  }
})
</script>

<style scoped>
.dm-screen-cards-in-hand {
  position: fixed;
  bottom: 0;
  z-index: 4;
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0;
  max-height: 300px;
  overflow-x: hidden;
  overflow-y: hidden;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
  transition: left 0.3s ease, right 0.3s ease;
  /* Allow hovered cards to overflow */
  clip-path: none;
}

.dm-screen-cards-in-hand.glass-card {
  border-radius: 16px 16px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(var(--v-theme-surface), 0.85);
  box-shadow: 0 -10px 35px rgba(0, 0, 0, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.1);
}

.filters-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.filters-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.filters-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.type-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.type-filter-chip {
  background: rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 0.75rem;
  height: 28px;
  padding: 0 10px;
}

.type-filter-chip:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  transform: translateY(-1px);
}

.type-filter-chip.active {
  background: rgba(var(--v-theme-primary), 0.2) !important;
  border-color: rgba(var(--v-theme-primary), 0.4) !important;
  color: rgba(255, 255, 255, 1) !important;
}

.type-filter-chip.active:hover {
  background: rgba(var(--v-theme-primary), 0.3) !important;
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}

.search-input {
  max-width: 200px;
  flex-shrink: 0;
}

.search-input :deep(.v-field) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
}

.search-input :deep(.v-field__input) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 0.875rem;
  padding: 4px 8px !important;
}

.search-input :deep(.v-field__prepend-inner) {
  padding-top: 0 !important;
  padding-inline-start: 8px !important;
}

.search-input :deep(.v-field__prepend-inner .v-icon) {
  color: rgba(255, 255, 255, 0.6) !important;
  font-size: 18px !important;
}

.search-input :deep(.v-field):hover {
  border-color: rgba(255, 255, 255, 0.2) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

.search-input :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.navigate-button {
  color: rgba(255, 255, 255, 0.8) !important;
  font-size: 0.875rem;
  text-transform: none;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease;
}

.navigate-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 1) !important;
  transform: translateY(-1px);
}

.toggle-button {
  color: rgba(255, 255, 255, 0.7);
}

.toggle-button:hover {
  color: rgba(255, 255, 255, 1);
  background: rgba(255, 255, 255, 0.1);
}

.cards-container {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 16px;
  min-width: fit-content;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  transform: rotateX(180deg);
  position: relative;
}

.cards-wrapper::-webkit-scrollbar,
.cards-container::-webkit-scrollbar {
  height: 6px;
}

.cards-wrapper::-webkit-scrollbar-track,
.cards-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.cards-wrapper::-webkit-scrollbar-thumb,
.cards-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.cards-wrapper::-webkit-scrollbar-thumb:hover,
.cards-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.cards-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  transform: rotateX(180deg);
  border: none;
  /* Allow hovered cards to overflow */
  clip-path: none;
}

.card-wrapper {
  flex-shrink: 0;
  cursor: grab;
  transition: transform 0.2s ease;
  width: 180px;
  position: relative;
  user-select: none;
}

.card-wrapper:active {
  cursor: grabbing;
}

  .card-wrapper:hover:not(.dragging) {
    transform: scale(0.9) translateY(-20px);
    z-index: 1000;
    position: relative;
    will-change: transform;
  }
  
  .card-wrapper.dragging {
    opacity: 0.4;
    transform: scale(0.95);
  }
  
  .hand-card {
    width: 100%;
    height: auto;
  }
  
  /* Drop zone styles */
  .drop-zone {
    flex-shrink: 0;
    width: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: width 0.2s ease;
    position: relative;
    min-height: 200px;
  }
  
  .drop-zone.active {
    width: 190px;
  }
  
  .drop-preview-box {
    width: 180px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .drop-preview-card {
    width: 100%;
    opacity: 0.5;
    transform: scale(0.95);
    filter: blur(2px);
    pointer-events: none;
    position: relative;
    animation: shadow-pulse 1.5s ease-in-out infinite;
  }
  
  .drop-preview-card :deep(.v-card) {
    box-shadow: 
      0 8px 32px rgba(var(--v-theme-primary), 0.4),
      0 0 20px rgba(var(--v-theme-primary), 0.3),
      inset 0 0 0 2px rgba(var(--v-theme-primary), 0.5) !important;
    border: 2px solid rgba(var(--v-theme-primary), 0.6) !important;
  }
  
  @keyframes shadow-pulse {
    0%, 100% {
      opacity: 0.4;
      filter: blur(2px);
      transform: scale(0.95);
    }
    50% {
      opacity: 0.6;
      filter: blur(1px);
      transform: scale(0.97);
    }
  }
.ability-item {
  display: none;
}

</style>

