import { ref, computed } from 'vue'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useFilesStore } from '@/stores/files'
import { useVueFlowStore } from '@/stores/vueFlow'
import { useToast } from 'vue-toastification'
import type { DmScreenItem, DmScreenSettings, GridOptions } from '@/types/dmScreen.types'
import type { LibraryItem } from '@/types/item.types'
import { debounce } from '@/utils/helpers'

export function useDmScreen(dmScreenId: string, libraryId: number) {
  const dmScreensStore = useDmScreensStore()
  const filesStore = useFilesStore()
  const vueFlowStore = useVueFlowStore()
  const toast = useToast()

  // UI State
  const showSettingsDialog = ref(false)
  const showFileManager = ref(false)
  const showItemSelector = ref(false)
  const showCanvasBackgroundSelector = ref(false)
  const showShapeStyleDialog = ref(false)
  const selectedItem = ref<DmScreenItem | null>(null)
  const isUpdating = ref(false)

  // Shape editor state
  const editingShapeData = ref({
    shape: 'circle' as 'circle' | 'square' | 'triangle',
    color: '#6366f1',
    opacity: 1,
    borderColor: '#ffffff',
    borderWidth: 0,
    label: '',
  })
  const editingShapeItemId = ref<string | null>(null)

  // Get current DM screen
  const dmScreen = computed(() => {
    return dmScreensStore.dmScreens.find(ds => ds.id === dmScreenId) || dmScreensStore.currentDmScreen
  })

  // Settings
  const lockBackgroundImages = computed(() => {
    return dmScreen.value?.settings?.lockBackgroundImages || false
  })

  const showGrid = computed(() => {
    return dmScreen.value?.settings?.grid?.showGrid !== false
  })

  const gridOptions = computed<GridOptions>(() => {
    return dmScreen.value?.settings?.grid || {
      showGrid: true,
      gridSize: 20,
      gridColor: 'rgba(255, 255, 255, 0.1)',
      gridLineWidth: 1,
      gridOpacity: 0.3,
      snapToGrid: false,
    }
  })

  // Helper function to get viewport center position
  // Uses VueFlow store
  function getViewportCenter(itemWidth = 300, itemHeight = 200): { x: number; y: number } {
    return vueFlowStore.getViewportCenter(itemWidth, itemHeight)
  }

  // Debounced update function
  const debouncedUpdate = debounce(async (updatedItems: DmScreenItem[]) => {
    if (!dmScreen.value) return
    
    isUpdating.value = true
    try {
      await dmScreensStore.updateDmScreen(
        libraryId,
        dmScreenId,
        { items: updatedItems }
      )
    } catch (error: any) {
      console.error('[useDmScreen] Failed to update DM screen:', error)
      toast.error('Failed to save changes')
    } finally {
      setTimeout(() => {
        isUpdating.value = false
      }, 100)
    }
  }, 500)

  // Debounced settings update
  const debouncedSettingsUpdate = debounce(async (settings: DmScreenSettings) => {
    if (!dmScreen.value) return
    
    isUpdating.value = true
    try {
      await dmScreensStore.updateDmScreen(
        libraryId,
        dmScreenId,
        { settings }
      )
      toast.success('Settings saved')
    } catch (error: any) {
      console.error('[useDmScreen] Failed to update settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setTimeout(() => {
        isUpdating.value = false
      }, 100)
    }
  }, 300)

  // Actions
  async function addTextNode() {
    if (!dmScreen.value) return

    try {
      const center = getViewportCenter(200, 100)
      const newItem: DmScreenItem = {
        id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'TextNode',
        data: {
          text: 'Double-click to edit',
          fontSize: 16,
          fontWeight: 'normal',
          textColor: '#ffffff',
          textAlign: 'center',
        },
        nodeOptions: {
          x: center.x,
          y: center.y,
          position: center,
          width: 200,
          height: 100,
          resizable: true,
        },
        isMinimized: false,
      }

      const updatedItems = [...(dmScreen.value.items || []), newItem]
      await debouncedUpdate(updatedItems)
      toast.success('Text node added')
    } catch (error: any) {
      console.error('[useDmScreen] Failed to add text node:', error)
      toast.error('Failed to add text node')
    }
  }

  async function addShapeNode() {
    if (!dmScreen.value) return

    try {
      const center = getViewportCenter(150, 150)
      const newItem: DmScreenItem = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'ShapeNode',
        data: {
          shape: 'circle',
          color: '#6366f1',
          opacity: 0.8,
          borderColor: '#ffffff',
          borderWidth: 2,
          label: '',
        },
        nodeOptions: {
          x: center.x,
          y: center.y,
          position: center,
          width: 150,
          height: 150,
          resizable: true,
        },
        isMinimized: false,
      }

      const updatedItems = [...(dmScreen.value.items || []), newItem]
      await debouncedUpdate(updatedItems)
      toast.success('Shape node added')
    } catch (error: any) {
      console.error('[useDmScreen] Failed to add shape node:', error)
      toast.error('Failed to add shape node')
    }
  }

  async function addLibraryItem(libraryItem: LibraryItem) {
    if (!dmScreen.value) return

    try {
      let featuredImageUrl: string | null = null
      if (libraryItem.featuredImage) {
        featuredImageUrl = await filesStore.getDownloadUrl(libraryItem.featuredImage.id)
      }

      const newItem = dmScreensStore.convertLibraryItemToDmScreenItem(
        libraryItem,
        featuredImageUrl
      )
      
      const center = getViewportCenter(300, 500)
      newItem.nodeOptions = {
        ...newItem.nodeOptions,
        x: center.x,
        y: center.y,
        position: center,
      }

      const updatedItems = [...(dmScreen.value.items || []), newItem]
      await debouncedUpdate(updatedItems)
      toast.success('Item added to DM screen')
    } catch (error: any) {
      console.error('[useDmScreen] Failed to add item:', error)
      toast.error('Failed to add item')
    }
  }

  async function addUserFile(userFile: any) {
    if (!dmScreen.value) return

    try {
      const fileItem: DmScreenItem = dmScreensStore.convertUserFileToDmScreenItem(userFile)
      const center = getViewportCenter(300, 200)
      fileItem.nodeOptions = {
        ...fileItem.nodeOptions,
        x: center.x,
        y: center.y,
        position: center,
      }

      const updatedItems = [...(dmScreen.value.items || []), fileItem]
      await debouncedUpdate(updatedItems)
      toast.success('File added to DM screen')
    } catch (error: any) {
      console.error('[useDmScreen] Failed to add file:', error)
      toast.error('Failed to add file')
    }
  }

  async function deleteItem(itemId: string) {
    if (!dmScreen.value) return

    const updatedItems = (dmScreen.value.items || []).filter((item: DmScreenItem) => item.id !== itemId)
    await debouncedUpdate(updatedItems)
    toast.success('Item removed from DM screen')
  }

  function sendToBack(item: DmScreenItem | null) {
    if (!item || !dmScreen.value) return
    
    const updatedItems = (dmScreen.value.items || []).map(i => {
      if (i.id === item.id) {
        return { ...i, nodeOptions: { ...i.nodeOptions, zIndex: -2 } }
      }
      return i
    })
    debouncedUpdate(updatedItems)
  }

  function sendToFront(item: DmScreenItem | null) {
    if (!item || !dmScreen.value) return
    
    const updatedItems = (dmScreen.value.items || []).map(i => {
      if (i.id === item.id) {
        return { ...i, nodeOptions: { ...i.nodeOptions, zIndex: 100 } }
      }
      return i
    })
    debouncedUpdate(updatedItems)
  }

  function rotateItem(item: DmScreenItem | null, degrees: number) {
    if (!item || !dmScreen.value) return
    
    const currentRotation = item.nodeOptions?.rotation || 0
    const newRotation = (currentRotation + degrees) % 360
    
    const updatedItems = (dmScreen.value.items || []).map((i: DmScreenItem) => {
      if (i.id === item.id) {
        return {
          ...i,
          nodeOptions: {
            ...i.nodeOptions,
            rotation: newRotation,
          },
        }
      }
      return i
    })
    
    debouncedUpdate(updatedItems)
  }

  function editShapeStyle(item: DmScreenItem | null) {
    if (item?.type === 'ShapeNode') {
      editingShapeItemId.value = item.id
      editingShapeData.value = {
        shape: item.data.shape as 'circle' | 'square' | 'triangle',
        color: item.data.color || '#6366f1',
        opacity: item.data.opacity ?? 1,
        borderColor: item.data.borderColor || '#ffffff',
        borderWidth: item.data.borderWidth || 0,
        label: item.data.label || '',
      }
      showShapeStyleDialog.value = true
    }
  }

  function saveShapeStyle() {
    if (!editingShapeItemId.value || !dmScreen.value) return

    const updatedItems = (dmScreen.value.items || []).map((item: DmScreenItem) => {
      if (item.id === editingShapeItemId.value && item.type === 'ShapeNode') {
        return {
          ...item,
          data: {
            ...item.data,
            color: editingShapeData.value.color,
            opacity: editingShapeData.value.opacity,
            borderColor: editingShapeData.value.borderColor,
            borderWidth: editingShapeData.value.borderWidth,
            label: editingShapeData.value.label,
          },
        }
      }
      return item
    })

    debouncedUpdate(updatedItems)
    showShapeStyleDialog.value = false
    toast.success('Shape style updated')
  }

  function toggleLockBackground() {
    if (!dmScreen.value) return
    
    const updatedSettings: DmScreenSettings = {
      ...dmScreen.value.settings,
      lockBackgroundImages: !lockBackgroundImages.value,
    }
    debouncedSettingsUpdate(updatedSettings)
  }

  function toggleGrid() {
    if (!dmScreen.value) return
    
    const updatedSettings: DmScreenSettings = {
      ...dmScreen.value.settings,
      grid: {
        ...gridOptions.value,
        showGrid: !showGrid.value,
      },
    }
    debouncedSettingsUpdate(updatedSettings)
  }

  function updateItems(updatedItems: DmScreenItem[]) {
    debouncedUpdate(updatedItems)
  }

  return {
    // State
    dmScreen,
    showSettingsDialog,
    showFileManager,
    showItemSelector,
    showCanvasBackgroundSelector,
    showShapeStyleDialog,
    selectedItem,
    editingShapeData,
    editingShapeItemId,
    lockBackgroundImages,
    showGrid,
    gridOptions,
    isUpdating,
    
    // Actions
    addTextNode,
    addShapeNode,
    addLibraryItem,
    addUserFile,
    deleteItem,
    sendToBack,
    sendToFront,
    rotateItem,
    editShapeStyle,
    saveShapeStyle,
    toggleLockBackground,
    toggleGrid,
    updateItems,
    getViewportCenter,
    debouncedUpdate,
    debouncedSettingsUpdate,
  }
}

