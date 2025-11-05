<template>
  <v-app>
    <v-app-bar elevation="0" class="glass-header" height="70">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      
      <v-toolbar-title class="d-flex align-center">
        <v-icon icon="mdi-shield-sword" size="32" color="primary" class="mr-2" />
        <span class="text-h5 font-weight-bold">Wildraft</span>
      </v-toolbar-title>

      <v-spacer />

      <v-btn icon="mdi-bell-outline" variant="text" />
      
      <user-menu />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" class="glass-sidebar">
      <v-list>
        <v-list-item
          :to="{ name: 'Dashboard' }"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
        />
        <v-divider class="my-2" />
        <v-list-subheader>Libraries</v-list-subheader>
        <v-list-item
          prepend-icon="mdi-book-plus"
          title="Create Library"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main class="gradient-background">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserMenu from '@/components/common/UserMenu.vue'

const drawer = ref(true)
</script>
