<template>
  <v-app>
    <v-app-bar elevation="0" class="glass-header" height="70">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      
      <v-toolbar-title class="d-flex align-center">
        <v-icon icon="mdi-shield-sword" size="32" color="primary" class="mr-2" />
        <span class="text-h5 font-weight-bold">Wildraft</span>
      </v-toolbar-title>

      <v-spacer />

      <!-- Dice Roller -->
      <dice-roller class="mx-2" />

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
      <v-container fluid class="pa-8">
        <router-view />
      </v-container>
    </v-main>

    <!-- 3D Dice Box -->
    <DiceBox3D />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import UserMenu from '@/components/common/UserMenu.vue'
import DiceRoller from '@/components/dice/DiceRoller.vue'
import DiceBox3D from '@/components/dice/DiceBox3D.vue'

const theme = useTheme()
const drawer = ref(true)

const isPapyrusTheme = computed(() => theme.global.name.value === 'papyrusTheme')
</script>
