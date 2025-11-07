<template>
  <div class="character-view-page">
    <page-top-bar
      :title="itemsStore.currentItem?.name || 'Character'"
      icon="mdi-account-circle"
      description="Character Sheet"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-pencil"
          @click="openEditDialog"
        >
          Edit Character
        </v-btn>
      </template>
    </page-top-bar>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <p class="text-h6 text-grey-lighten-1 mt-4">Loading character...</p>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Character Viewer -->
    <character-viewer
      v-else-if="itemsStore.currentItem"
      :character="itemsStore.currentItem"
      @edit="openEditDialog"
      @update="handleUpdate"
    />

    <!-- Edit Dialog -->
    <item-dialog
      v-model="showEditDialog"
      :library-id="libraryId!"
      :item="itemsStore.currentItem"
      :item-type="'CHARACTER_DND_5E'"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import CharacterViewer from '@/components/items/dnd5e/characters/CharacterViewer.vue'
import { ItemDialog } from '@/components/items'
import type { Breadcrumb } from '@/components/common/PageTopBar.vue'
import type { CharacterData } from '@/types/item.DND_5E.types'

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const itemsStore = useItemsStore()
const toast = useToast()

const showEditDialog = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const libraryId = computed(() => {
  const id = route.params.libraryId
  return id ? Number(id) : null
})

const itemId = computed(() => {
  const id = route.params.itemId
  return id ? Number(id) : null
})

const breadcrumbs = computed<Breadcrumb[]>(() => {
  const crumbs: Breadcrumb[] = []
  
  if (libraryStore.currentLibrary) {
    crumbs.push(
      { text: 'Libraries', to: { name: 'Dashboard' } },
      { text: libraryStore.currentLibrary.name, to: { name: 'Library', params: { id: libraryId.value } } },
      { text: 'Characters', to: { name: 'LibraryCharacters', params: { id: libraryId.value } } }
    )
  }
  
  if (itemsStore.currentItem) {
    crumbs.push({ text: itemsStore.currentItem.name })
  }
  
  return crumbs
})

async function loadCharacter() {
  if (!libraryId.value || !itemId.value) return

  isLoading.value = true
  error.value = null

  try {
    await itemsStore.fetchItem(libraryId.value, itemId.value)
  } catch (err: any) {
    console.error('Failed to load character:', err)
    error.value = err.message || 'Failed to load character'
    toast.error('Failed to load character')
  } finally {
    isLoading.value = false
  }
}

function openEditDialog() {
  showEditDialog.value = true
}

function handleUpdated() {
  toast.success('Character updated!')
  // Reload to get latest data
  loadCharacter()
}

async function handleUpdate(data: Partial<CharacterData>) {
  if (!libraryId.value || !itemId.value) return

  try {
    await itemsStore.updateItem(libraryId.value, itemId.value, {
      data: {
        ...itemsStore.currentItem?.data,
        ...data,
      },
    })
    toast.success('Character updated!')
  } catch (err: any) {
    console.error('Failed to update character:', err)
    toast.error('Failed to update character')
  }
}

onMounted(() => {
  loadCharacter()
})

watch([libraryId, itemId], () => {
  loadCharacter()
})
</script>

<style scoped>
.character-view-page {
  width: 100%;
  min-height: 100vh;
}
</style>

