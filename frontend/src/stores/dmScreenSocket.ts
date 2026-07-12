import { defineStore } from 'pinia'
import { ref } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useDmScreensStore } from '@/stores/dmScreens'
import { SOCKET_BASE_URL, SOCKET_IO_OPTIONS } from '@/config/api'

/**
 * Notification socket for live DM screen sync: when anyone else saves the
 * screen, we refetch it (debounced). REST remains the only write path.
 */
export const useDmScreenSocketStore = defineStore('dmScreenSocket', () => {
  const socketInstance = ref<Socket | null>(null)
  const isConnected = ref(false)
  const connectedScreenId = ref<string | null>(null)

  const authStore = useAuthStore()

  let refetchTimer: ReturnType<typeof setTimeout> | null = null
  let currentLibraryId: number | null = null

  const connect = (libraryId: number, dmScreenId: string) => {
    if (connectedScreenId.value === dmScreenId && socketInstance.value?.connected) return
    disconnect()

    const token = authStore.accessToken
    if (!token) return

    currentLibraryId = libraryId
    connectedScreenId.value = dmScreenId

    const socketUrl = `${SOCKET_BASE_URL}/dm-screen/${dmScreenId}`
    socketInstance.value = io(socketUrl, {
      ...SOCKET_IO_OPTIONS,
      auth: { token },
    })

    socketInstance.value.on('connect', () => {
      isConnected.value = true
    })
    socketInstance.value.on('disconnect', () => {
      isConnected.value = false
    })

    socketInstance.value.on('dm-screen-updated', (data: any) => {
      if (data?.sourceUserId === authStore.user?.id) return
      // Debounced refetch so rapid remote edits collapse into one request
      if (refetchTimer) clearTimeout(refetchTimer)
      refetchTimer = setTimeout(() => {
        refetchTimer = null
        if (currentLibraryId && connectedScreenId.value) {
          useDmScreensStore().fetchDmScreen(currentLibraryId, connectedScreenId.value, true)
        }
      }, 500)
    })
  }

  const disconnect = () => {
    if (refetchTimer) {
      clearTimeout(refetchTimer)
      refetchTimer = null
    }
    if (socketInstance.value) {
      socketInstance.value.removeAllListeners()
      socketInstance.value.disconnect()
      socketInstance.value = null
    }
    isConnected.value = false
    connectedScreenId.value = null
    currentLibraryId = null
  }

  return { isConnected, connectedScreenId, connect, disconnect }
})
