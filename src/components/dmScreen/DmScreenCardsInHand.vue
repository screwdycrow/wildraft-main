<template>
  <div
    v-if="shouldShow && libraryItems.length > 0"
    class="dm-screen-cards-in-hand glass-card"
    :style="containerStyle"
  >
    <!-- Collapse/Expand Button -->
    <div class="toggle-button-container">
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

    <!-- Cards Container -->
    <v-expand-transition>
      <div
        v-show="!isCollapsed"
        class="cards-wrapper"
        ref="scrollWrapper"
        @wheel="handleHorizontalScroll"
      >
        <div class="cards-container">
          <div
          v-for="item in libraryItems"
          :key="item.id"
          class="card-wrapper"
          @click="handleCardClick(item)"
        >
          <item-card-wrapper
            :item="item"
            :library-id="activeDmScreen?.libraryId"
            :disable-click="true"
            class="hand-card"
          />
        </div>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useItemsStore } from '@/stores/items'
import { useDialogsStore } from '@/stores/dialogs'
import { itemsApi } from '@/api/items'
import ItemCardWrapper from '@/components/items/ItemCardWrapper.vue'
import type { LibraryItem } from '@/types/item.types'
import type { DmScreenItem } from '@/types/dmScreen.types'

interface Props {
  leftSidebarWidth?: number
  rightSidebarWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  leftSidebarWidth: undefined,
  rightSidebarWidth: undefined,
})

const route = useRoute()
const { mobile } = useDisplay()
const dmScreensStore = useDmScreensStore()
const itemsStore = useItemsStore()
const dialogsStore = useDialogsStore()

const libraryItems = ref<LibraryItem[]>([])
const isLoading = ref(false)
const isCollapsed = ref(false)
const scrollWrapper = ref<HTMLElement | null>(null)

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

// Hide on DM screen view
const shouldShow = computed(() => {
  return route.name !== 'DmScreen' && activeDmScreen.value !== null
})

// Get library item IDs from active DM screen
const libraryItemIds = computed(() => {
  if (!activeDmScreen.value?.items) return []
  
  return activeDmScreen.value.items
    .filter((item: DmScreenItem) => item.type === 'LibraryItemId' && item.data?.id)
    .map((item: DmScreenItem) => item.data.id as number)
})

// Watch for changes in active DM screen or library item IDs
watch([activeDmScreen, libraryItemIds], async () => {
  if (shouldShow.value && libraryItemIds.value.length > 0) {
    await loadLibraryItems()
  } else {
    libraryItems.value = []
  }
}, { immediate: true, deep: true })

// Watch for sidebar width changes from props
watch([() => props.leftSidebarWidth, () => props.rightSidebarWidth], () => {
  // Force reactivity update
}, { immediate: true })

async function loadLibraryItems() {
  if (!activeDmScreen.value || libraryItemIds.value.length === 0) {
    libraryItems.value = []
    return
  }

  isLoading.value = true
  
  try {
    const itemsToLoad: LibraryItem[] = []
    const itemsToFetch: number[] = []

    // First, check which items are already in the store
    for (const itemId of libraryItemIds.value) {
      const cachedItem = itemsStore.getItemById(itemId)
      if (cachedItem) {
        itemsToLoad.push(cachedItem)
      } else {
        itemsToFetch.push(itemId)
      }
    }

    // Fetch missing items
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

    // Update libraryItems, maintaining order from DM screen
    libraryItems.value = libraryItemIds.value
      .map(id => itemsToLoad.find(item => item.id === id))
      .filter((item): item is LibraryItem => item !== null)
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

onMounted(() => {
  if (shouldShow.value && libraryItemIds.value.length > 0) {
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
  overflow: hidden;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
  transition: left 0.3s ease, right 0.3s ease;
}

.dm-screen-cards-in-hand.glass-card {
  border-radius: 16px 16px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(var(--v-theme-surface), 0.85);
  box-shadow: 0 -10px 35px rgba(0, 0, 0, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.1);
}

.toggle-button-container {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  gap: 12px;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 16px;
  min-width: fit-content;
  flex-wrap: nowrap;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  transform: rotateX(180deg);
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
}

.card-wrapper {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 200px;

}

.card-wrapper:hover {
  transform: scale(0.85) translateY(-8px);
  z-index: 10;
  position: relative;
}

.hand-card {
  width: 100%;
  height: auto;
}

</style>

