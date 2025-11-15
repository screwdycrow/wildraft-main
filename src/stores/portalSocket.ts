import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { io, Socket } from 'socket.io-client'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useAuthStore } from '@/stores/auth'

// @ts-ignore - Vite env variable
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'

export const usePortalSocketStore = defineStore('portalSocket', () => {
  // State
  const socketInstance = ref<Socket | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const userRole = ref<'controller' | 'viewer' | null>(null)
  const userId = ref<number | null>(null)
  const activePortalId = ref<string | null>(null)
  
  // Event handlers map
  const eventHandlers = ref<Map<string, Set<Function>>>(new Map())
  
  // Get stores
  const portalViewsStore = usePortalViewsStore()
  const authStore = useAuthStore()
  
  // Computed
  const activePortal = computed(() => portalViewsStore.activePortal)
  const socket = computed(() => socketInstance.value)
  
  // Emit custom events to registered handlers
  const emitEvent = (eventName: string, data: any) => {
    const handlers = eventHandlers.value.get(eventName)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
  
  // Subscribe to custom events
  const on = (eventName: string, handler: Function) => {
    if (!eventHandlers.value.has(eventName)) {
      eventHandlers.value.set(eventName, new Set())
    }
    eventHandlers.value.get(eventName)!.add(handler)
  }
  
  // Unsubscribe from custom events
  const off = (eventName: string, handler: Function) => {
    const handlers = eventHandlers.value.get(eventName)
    if (handlers) {
      handlers.delete(handler)
    }
  }
  
  // Connect to Socket.IO
  const connect = () => {
    // If already connecting or connected to the same portal, skip
    if (activePortal.value?.portalViewId === activePortalId.value && socketInstance.value?.connected) {
      return
    }
    
    if (!activePortal.value) return
    
    // Disconnect from old portal if different
    if (socketInstance.value && activePortalId.value !== activePortal.value.portalViewId) {
      socketInstance.value.removeAllListeners()
      socketInstance.value.disconnect()
      socketInstance.value = null
    }
    
    const token = authStore.accessToken
    if (!token) {
      isConnecting.value = false
      return
    }
    
    isConnecting.value = true
    activePortalId.value = activePortal.value.portalViewId
    
    // Create Socket.IO connection
    const socketUrl = `${BASE_URL}/portal-view/${activePortal.value.portalViewId}`
    
    socketInstance.value = io(socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    })
    
    // Connection events
    socketInstance.value.on('connect', () => {
      isConnected.value = true
      isConnecting.value = false
    })
    
    socketInstance.value.on('disconnect', () => {
      isConnected.value = false
      userRole.value = null
      userId.value = null
    })
    
    socketInstance.value.on('connect_error', (error) => {
      isConnecting.value = false
      emitEvent('error', error.message)
    })
    
    // Custom events from server
    socketInstance.value.on('connected', (data: any) => {
      userRole.value = data.role || null
      userId.value = data.userId || null
      emitEvent('connected', data)
    })
    
    socketInstance.value.on('portal-view-updated', (data: any) => {
      emitEvent('portal-view-updated', data)
    })
    
    socketInstance.value.on('item-updated', (data: any) => {
      emitEvent('item-updated', data)
    })
    
    socketInstance.value.on('sync-requested', (data: any) => {
      emitEvent('sync-requested', data)
    })
    
    socketInstance.value.on('sync-response', (data: any) => {
      emitEvent('sync-response', data)
    })
    
    socketInstance.value.on('pong', (data: any) => {
      emitEvent('pong', data)
    })
    
    socketInstance.value.on('error', (error: any) => {
      emitEvent('error', error.message || 'Unknown error')
    })
  }
  
  // Disconnect socket
  const disconnect = () => {
    if (socketInstance.value) {
      socketInstance.value.removeAllListeners()
      socketInstance.value.disconnect()
      socketInstance.value = null
      isConnected.value = false
      activePortalId.value = null
      userRole.value = null
      userId.value = null
    }
  }
  
  // Send methods (from backend documentation)
  
  // Send ping (health check)
  const sendPing = () => {
    if (!socketInstance.value || !socketInstance.value.connected) return false
    socketInstance.value.emit('ping')
    return true
  }
  
  // Send portal view update (controller only)
  const sendPortalViewUpdate = (payload: any) => {
    if (userRole.value !== 'controller') {
      return false
    }
    if (!socketInstance.value || !socketInstance.value.connected) {
      return false
    }
    socketInstance.value.emit('portal-view-update', payload)
    return true
  }
  
  // Send item update (controller only)
  const sendItemUpdate = (payload: any) => {
    if (userRole.value !== 'controller') return false
    if (!socketInstance.value || !socketInstance.value.connected) return false
    socketInstance.value.emit('item-update', payload)
    return true
  }
  
  // Request sync (viewer only)
  const requestSync = () => {
    if (userRole.value !== 'viewer') return false
    if (!socketInstance.value || !socketInstance.value.connected) return false
    socketInstance.value.emit('request-sync')
    return true
  }
  
  // Send sync response (controller only)
  const sendSyncResponse = (payload: any) => {
    if (userRole.value !== 'controller') return false
    if (!socketInstance.value || !socketInstance.value.connected) return false
    socketInstance.value.emit('sync-response', payload)
    return true
  }
  
  // Watch active portal and connect/disconnect accordingly
  watch(activePortal, (newPortal, oldPortal) => {
    if (newPortal && (!oldPortal || newPortal.portalViewId !== oldPortal.portalViewId)) {
      // New portal activated or changed - reconnect
      connect()
    } else if (!newPortal && oldPortal) {
      // Portal deactivated - disconnect
      disconnect()
    }
  }, { immediate: true })
  
  return {
    // State
    socketInstance,
    isConnected,
    isConnecting,
    userRole,
    userId,
    activePortalId,
    
    // Computed
    socket,
    activePortal,
    
    // Connection control
    connect,
    disconnect,
    
    // Send methods
    sendPing,
    sendPortalViewUpdate,
    sendItemUpdate,
    requestSync,
    sendSyncResponse,
    
    // Event listeners
    on,
    off,
  }
})

