import { storeToRefs } from 'pinia'
import { usePortalSocketStore } from '@/stores/portalSocket'

/**
 * Composable wrapper for portal socket store
 * Provides backward compatibility for components using the composable
 * 
 * @deprecated Consider using usePortalSocketStore() directly for better type safety
 */
export function usePortalSocket(_options?: { isViewer?: boolean }) {
  const socketStore = usePortalSocketStore()
  
  // Extract reactive refs from store
  const { isConnected, isConnecting, userRole, userId, socket } = storeToRefs(socketStore)
  
  // Return store methods and state
  return {
    // Connection state (reactive refs)
    isConnected,
    isConnecting,
    userRole,
    userId,
    
    // Connection control
    connect: socketStore.connect,
    disconnect: socketStore.disconnect,
    
    // Send methods
    sendPing: socketStore.sendPing,
    sendPortalViewUpdate: socketStore.sendPortalViewUpdate,
    sendItemUpdate: socketStore.sendItemUpdate,
    requestSync: socketStore.requestSync,
    sendSyncResponse: socketStore.sendSyncResponse,
    
    // Event listeners
    on: socketStore.on,
    off: socketStore.off,
    
    // Socket reference for direct access
    socket,
  }
}
