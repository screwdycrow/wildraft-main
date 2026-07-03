<template>
  <v-container class="py-10">
    <div class="text-center mb-8">
      <v-icon icon="mdi-sword-cross" size="56" color="primary" class="mb-3" />
      <h1 class="text-h4 font-weight-bold">Your Adventures</h1>
      <p class="text-body-1 text-medium-emphasis">Pick a campaign to jump in</p>
    </div>

    <div v-if="libraryStore.isLoading" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <v-row v-else justify="center">
      <v-col v-for="library in playerLibraries" :key="library.id" cols="12" sm="6" md="4">
        <v-card
          class="glass-card pa-2 library-card"
          elevation="0"
          @click="enter(library.id)"
        >
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-book-open-page-variant" color="primary" class="mr-3" />
            {{ library.name }}
          </v-card-title>
          <v-card-subtitle v-if="library.description">{{ library.description }}</v-card-subtitle>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" variant="tonal" append-icon="mdi-arrow-right">Enter</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col v-if="playerLibraries.length === 0" cols="12" sm="8" md="6">
        <v-card class="glass-card pa-8 text-center" elevation="0">
          <v-icon icon="mdi-email-open-outline" size="64" color="primary" class="mb-4" />
          <h2 class="text-h6 mb-2">No campaigns yet</h2>
          <p class="text-body-2 text-medium-emphasis">
            Ask your DM for an invite link — opening it will bring you right in.
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLibraryStore } from '@/stores/library'

const router = useRouter()
const libraryStore = useLibraryStore()

// All libraries are usable from the player view; players only have PLAYER ones,
// while DMs can use this to preview the player experience.
const playerLibraries = computed(() => libraryStore.libraries)

function enter(libraryId: number) {
  router.push({ name: 'PlayerDashboard', params: { id: libraryId } })
}

onMounted(async () => {
  if (libraryStore.libraries.length === 0) {
    await libraryStore.fetchLibraries()
  }
})
</script>

<style scoped>
.library-card {
  cursor: pointer;
  transition: transform 0.15s ease;
}
.library-card:hover {
  transform: translateY(-3px);
}
</style>
