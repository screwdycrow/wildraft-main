import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Node } from '@vue-flow/core'
import type { DmScreenItem } from '@/types/dmScreen.types'

interface NodeCreationOptions {
  libraryId: number
  dmScreenId: string
  snapToGrid: boolean
  gridSize: number
  backgroundOpacity: number
  lockBackgroundImages: boolean
  backgroundImageWidth: number
  onUpdate: (item: DmScreenItem) => void
  onDelete: (itemId: string) => void
}

export const useVueFlowStore = defineStore('vueFlow', () => {
  // Store for VueFlow project function (set by DmScreenWrapper)
  const projectFn = ref<((point: { x: number; y: number }) => { x: number; y: number }) | null>(null)
  
  // Store for VueFlow instance methods
  const vueFlowInstance = ref<any>(null)
  
  // Store for nodes - keyed by dmScreenId (using shallowRef for better performance)
  const nodesByScreen = shallowRef<Record<string, Node[]>>({})
  
  // Store for node creation options - keyed by dmScreenId
  const nodeOptionsByScreen = ref<Record<string, NodeCreationOptions>>({})
  
  function setProjectFn(fn: ((point: { x: number; y: number }) => { x: number; y: number }) | null) {
    projectFn.value = fn
  }
  
  function setVueFlowInstance(instance: any) {
    vueFlowInstance.value = instance
  }
  
  function getViewportCenter(itemWidth = 300, itemHeight = 200): { x: number; y: number } {
    try {
      const viewportCenterX = window.innerWidth / 2
      const viewportCenterY = window.innerHeight / 2
      
      if (projectFn.value) {
        const flowPosition = projectFn.value({ x: viewportCenterX, y: viewportCenterY })
        return {
          x: flowPosition.x - itemWidth / 2,
          y: flowPosition.y - itemHeight / 2,
        }
      }
    } catch (error) {
      console.warn('[VueFlowStore] Could not get viewport center, using default position')
    }
    // Fallback to default position
    return { x: 400, y: 300 }
  }
  
  /**
   * Create a node from a DmScreenItem
   */
  function createNodeFromItem(item: DmScreenItem, options: NodeCreationOptions): Node {
    const nodeOptions = item.nodeOptions || {}
    const position = nodeOptions.position || { x: 0, y: 0 }
    
    // Check if this is a background image
    const isBackground = item.data.isBackground === true
    const isLocked = isBackground && options.lockBackgroundImages
    
    // Apply opacity to background images
    const backgroundOpacity = isBackground ? options.backgroundOpacity : 1
    const rotation = nodeOptions.rotation || 0
    
    // Determine dimensions based on minimized state
    let nodeWidth: number
    let nodeHeight: number
    
    if (item.isMinimized) {
      // Use stored minimized dimensions if resized, otherwise default to 150x150
      nodeWidth = nodeOptions.width || item.minimizedDimensions?.width || 150
      nodeHeight = nodeOptions.height || item.minimizedDimensions?.height || 150
    } else {
      // Full size dimensions
      const defaultWidth = 300
      const defaultHeight = 200
      nodeWidth = nodeOptions.fullWidth || nodeOptions.width || (isBackground ? options.backgroundImageWidth : defaultWidth)
      nodeHeight = nodeOptions.fullHeight || nodeOptions.height || (isBackground ? Math.round((nodeOptions.width || options.backgroundImageWidth) * 0.75) : defaultHeight)
    }
    
    return {
      id: item.id,
      type: 'dmScreenItem',
      position: {
        x: position.x || nodeOptions.x || 0,
        y: position.y || nodeOptions.y || 0,
      },
      data: {
        item,
        libraryId: options.libraryId,
        dmScreenId: options.dmScreenId,
        snapToGrid: options.snapToGrid,
        gridSize: options.gridSize,
        onUpdate: options.onUpdate,
        onDelete: options.onDelete,
        backgroundOpacity,
        rotation,
      },
      draggable: !isLocked,
      selectable: !isLocked,
      resizable: true,
      style: {
        minWidth: item.isMinimized ? '20px' : (isBackground ? '100px' : '100px'),
        minHeight: item.isMinimized ? '20px' : (isBackground ? '100px' : '100px'),
        opacity: backgroundOpacity,
        ...nodeOptions.style,
      },
      width: nodeWidth,
      height: nodeHeight,
      class: nodeOptions.class || '',
      zIndex: isBackground ? -1 : 1,
      rotation,
      ...nodeOptions,
    }
  }
  
  /**
   * Set node creation options for a DM screen
   */
  function setNodeOptions(dmScreenId: string, options: NodeCreationOptions) {
    nodeOptionsByScreen.value[dmScreenId] = options
  }
  
  /**
   * Create nodes from DmScreenItems
   */
  function createNodesFromItems(dmScreenId: string, items: DmScreenItem[]): Node[] {
    const options = nodeOptionsByScreen.value[dmScreenId]
    if (!options) {
      console.warn(`[VueFlowStore] No node options found for dmScreenId: ${dmScreenId}`)
      return []
    }
    
    if (!items) return []
    
    console.log('[VueFlowStore] Creating nodes from items:', {
      dmScreenId,
      itemCount: items.length,
      timestamp: new Date().toISOString()
    })
    
    const nodes = items.map((item: DmScreenItem) => createNodeFromItem(item, options))
    
    // Update with new object reference to trigger reactivity
    nodesByScreen.value = { ...nodesByScreen.value, [dmScreenId]: nodes }
    
    console.log('[VueFlowStore] Created nodes:', {
      dmScreenId,
      nodeCount: nodes.length
    })
    
    return nodes
  }
  
  /**
   * Get nodes for a DM screen (computed for reactivity)
   */
  function getNodes(dmScreenId: string): Node[] {
    return nodesByScreen.value[dmScreenId] || []
  }
  
  /**
   * Update a single node (when item is updated)
   */
  function updateNode(dmScreenId: string, item: DmScreenItem) {
    const options = nodeOptionsByScreen.value[dmScreenId]
    if (!options) {
      console.warn(`[VueFlowStore] No node options found for dmScreenId: ${dmScreenId}`)
      return
    }
    
    const nodes = nodesByScreen.value[dmScreenId] || []
    const nodeIndex = nodes.findIndex(n => n.id === item.id)
    
    if (nodeIndex !== -1) {
      // Update existing node
      const newNode = createNodeFromItem(item, options)
      const newNodes = [...nodes]
      newNodes[nodeIndex] = newNode
      nodesByScreen.value = { ...nodesByScreen.value, [dmScreenId]: newNodes } // Trigger reactivity
      console.log('[VueFlowStore] Updated node:', { dmScreenId, itemId: item.id })
    } else {
      // Add new node
      const newNode = createNodeFromItem(item, options)
      nodesByScreen.value = { ...nodesByScreen.value, [dmScreenId]: [...nodes, newNode] } // Trigger reactivity
      console.log('[VueFlowStore] Added new node:', { dmScreenId, itemId: item.id })
    }
  }
  
  /**
   * Remove a node
   */
  function removeNode(dmScreenId: string, itemId: string) {
    const nodes = nodesByScreen.value[dmScreenId] || []
    const newNodes = nodes.filter(n => n.id !== itemId)
    nodesByScreen.value = { ...nodesByScreen.value, [dmScreenId]: newNodes } // Trigger reactivity
    console.log('[VueFlowStore] Removed node:', { dmScreenId, itemId })
  }
  
  /**
   * Clear nodes for a DM screen
   */
  function clearNodes(dmScreenId: string) {
    const newNodesByScreen = { ...nodesByScreen.value }
    delete newNodesByScreen[dmScreenId]
    nodesByScreen.value = newNodesByScreen // Trigger reactivity
    
    const newNodeOptionsByScreen = { ...nodeOptionsByScreen.value }
    delete newNodeOptionsByScreen[dmScreenId]
    nodeOptionsByScreen.value = newNodeOptionsByScreen
    console.log('[VueFlowStore] Cleared nodes for:', { dmScreenId })
  }
  
  return {
    projectFn,
    vueFlowInstance,
    nodesByScreen,
    setProjectFn,
    setVueFlowInstance,
    getViewportCenter,
    setNodeOptions,
    createNodesFromItems,
    getNodes,
    updateNode,
    removeNode,
    clearNodes,
  }
})

