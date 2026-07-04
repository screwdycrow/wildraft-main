import { onMounted, onUnmounted } from 'vue'
import { usePortalSocketStore } from '@/stores/portalSocket'
import { useDiceRollerStore } from '@/stores/diceRoller'

/**
 * Wires remote dice rolls from the portal socket into the dice roller.
 * Mount once per layout that shows the 3D dice (PortalLayout, PlayerLayout).
 */
export function useSharedDice() {
  const portalSocket = usePortalSocketStore()
  const diceRoller = useDiceRollerStore()

  const handler = (data: any) => {
    // Server excludes the sender, but guard against echoes anyway
    if (data?.userId != null && data.userId === portalSocket.userId) return
    diceRoller.receiveRemoteRoll(data)
  }

  onMounted(() => portalSocket.on('dice-roll', handler))
  onUnmounted(() => portalSocket.off('dice-roll', handler))
}
