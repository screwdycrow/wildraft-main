<template>
  <v-menu location="bottom" :close-on-content-click="false" max-width="300">
    <template #activator="{ props: menuProps }">
      <v-btn
        icon
        v-bind="menuProps"
        class="dm-screen-control-button"
        size="default"
      >
        <v-icon icon="mdi-monitor-dashboard" size="20" />
        <v-badge
          v-if="activeDmScreen"
          color="primary"
          dot
          location="bottom right"
          offset-x="2"
          offset-y="2"
        />
        <v-tooltip activator="parent" location="bottom">
          {{ activeDmScreen?.name || 'DM Screen' }}
        </v-tooltip>
      </v-btn>
    </template>

    <v-card class="dm-screen-control-card">
      <!-- Header -->
      <v-card-title class="d-flex align-center pa-3">
        <v-icon icon="mdi-monitor-dashboard" size="small" class="mr-2" />
        <span class="text-subtitle-2">DM Screen</span>
      </v-card-title>

      <v-divider />

      <!-- Active DM Screen Selection -->
      <v-card-text class="pa-3">
        <v-select
          :model-value="activeDmScreen?.id"
          :items="dmScreenOptions"
          item-title="name"
          item-value="id"
          variant="outlined"
          density="compact"
          placeholder="Select a DM screen..."
          prepend-inner-icon="mdi-monitor-dashboard"
          @update:model-value="handleDmScreenChange"
        >
          <template #append>
            <v-btn
              v-if="activeDmScreen"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click.stop="clearActiveDmScreen"
            />
          </template>
        </v-select>

        <template v-if="activeDmScreen">
          <v-divider class="my-3" />

          <!-- DM Screen Info -->
          <div class="mb-3">
            <div class="d-flex align-center gap-2 mb-2">
              <span class="text-caption text-medium-emphasis">Items:</span>
              <v-chip size="x-small" variant="tonal">
                {{ activeDmScreen.items?.length || 0 }}
              </v-chip>
            </div>
          </div>

          <v-divider class="my-3" />

          <!-- Cards in Hand Toggle -->
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="d-flex flex-column">
              <span class="text-caption font-weight-medium">Cards in Hand</span>
              <span class="text-caption text-medium-emphasis">Show cards at bottom</span>
            </div>
            <v-switch
              :model-value="cardsInHandEnabled"
              density="compact"
              hide-details
              @update:model-value="handleCardsInHandToggle"
            />
          </div>

          <v-divider class="my-3" />

          <!-- Add Files Button -->
          <v-btn
            size="small"
            variant="tonal"
            prepend-icon="mdi-file-plus"
            block
            class="mb-3"
            @click="showFileManager = true"
          >
            Add Files
          </v-btn>

          <v-divider class="my-3" />

          <!-- Send to Portal Button -->
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-projector-screen"
            block
            class="mb-3"
            @click="handleSendToPortal"
            :disabled="!hasActivePortal"
          >
            Send to Portal
          </v-btn>

          <v-divider class="my-3" />

          <!-- Actions -->
          <div class="d-flex gap-2">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-eye"
              block
              @click="openDmScreen"
            >
              Open
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-cog"
              @click="openDmScreenSettings"
            >
              <v-icon />
              <v-tooltip activator="parent" location="top">Settings</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-card-text>
    </v-card>

    <!-- File Manager Dialog -->
    <file-manager
      v-model="showFileManager"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleFilesSelected"
    />
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDmScreensStore } from '@/stores/dmScreens'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useFilesStore } from '@/stores/files'
import { useToast } from 'vue-toastification'
import FileManager from '@/components/files/FileManager.vue'
import * as filesApi from '@/api/files'
import type { DmScreen } from '@/types/dmScreen.types'
import type { DmScreenItem } from '@/types/dmScreen.types'

const router = useRouter()
const dmScreensStore = useDmScreensStore()
const portalViewsStore = usePortalViewsStore()
const filesStore = useFilesStore()
const toast = useToast()

const showFileManager = ref(false)

const activeDmScreen = computed(() => dmScreensStore.activeDmScreen)
const cardsInHandEnabled = computed(() => dmScreensStore.cardsInHandEnabled)
const hasActivePortal = computed(() => !!portalViewsStore.activePortal)

const dmScreenOptions = computed(() => {
  return dmScreensStore.dmScreens.map(ds => ({
    id: ds.id,
    name: ds.name,
    libraryId: ds.libraryId,
  }))
})

const handleDmScreenChange = async (dmScreenId: string) => {
  const dmScreen = dmScreensStore.dmScreens.find(ds => ds.id === dmScreenId)
  if (!dmScreen) return
  
  dmScreensStore.setActiveDmScreen(dmScreen)
}

const clearActiveDmScreen = () => {
  dmScreensStore.setActiveDmScreen(null)
}

const openDmScreen = () => {
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

const openDmScreenSettings = () => {
  if (activeDmScreen.value) {
    router.push({
      name: 'LibraryDmScreens',
      params: {
        id: activeDmScreen.value.libraryId,
      },
    })
  }
}

const handleCardsInHandToggle = (enabled: boolean) => {
  dmScreensStore.setCardsInHandEnabled(enabled)
}

async function handleFilesSelected(fileIds: number | number[]) {
  if (!activeDmScreen.value) return
  
  const idsArray = Array.isArray(fileIds) ? fileIds : [fileIds]
  if (idsArray.length === 0) return
  
  try {
    const currentItems = activeDmScreen.value.items || []
    const newItems: DmScreenItem[] = []
    
    // Default size for MediaCard nodes
    const defaultWidth = 300
    const defaultHeight = 400
    
    // Calculate center position (approximate, will be adjusted when DM screen is opened)
    const centerX = 400
    const centerY = 300
    
    // Add each selected file as a UserFile node
    for (let i = 0; i < idsArray.length; i++) {
      const fileId = idsArray[i]
      
      // Stagger positions slightly for multiple files
      const offsetX = (i % 3) * 50 - 50 // -50, 0, 50
      const offsetY = Math.floor(i / 3) * 50
      
      const userFileItem: DmScreenItem = {
        id: `userfile-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'UserFileId',
        data: {
          id: fileId,
          isBackground: false,
        },
        nodeOptions: {
          x: centerX + offsetX - defaultWidth / 2,
          y: centerY + offsetY - defaultHeight / 2,
          position: { 
            x: centerX + offsetX - defaultWidth / 2,
            y: centerY + offsetY - defaultHeight / 2
          },
          width: defaultWidth,
          height: defaultHeight,
          resizable: true,
        },
        isMinimized: false,
      }
      
      newItems.push(userFileItem)
    }
    
    const updatedItems = [...currentItems, ...newItems]
    
    await dmScreensStore.updateDmScreen(
      activeDmScreen.value.libraryId,
      activeDmScreen.value.id,
      { items: updatedItems }
    )
    
    toast.success(`Added ${idsArray.length} file${idsArray.length > 1 ? 's' : ''} to DM screen`)
    showFileManager.value = false
  } catch (error: any) {
    console.error('[DmScreenControlMenu] Failed to add files:', error)
    toast.error('Failed to add files to DM screen')
  }
}

async function handleSendToPortal() {
  if (!activeDmScreen.value) {
    toast.error('No active DM screen')
    return
  }
  
  if (!hasActivePortal.value) {
    toast.error('No active portal. Please set an active portal first.')
    return
  }
  
  try {
    await portalViewsStore.addDmScreenToActivePortal(activeDmScreen.value, true)
    toast.success('DM screen sent to portal')
  } catch (error: any) {
    console.error('[DmScreenControlMenu] Failed to send DM screen to portal:', error)
    toast.error(error.message || 'Failed to send DM screen to portal')
  }
}
</script>

<style scoped>
.dm-screen-control-button {
  background: rgba(var(--v-theme-surface), 0.2) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.dm-screen-control-button:hover {
  background: rgba(var(--v-theme-surface), 0.3) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  opacity: 1;
}

.dm-screen-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dm-screen-control-card {
  backdrop-filter: blur(20px);
}
</style>

