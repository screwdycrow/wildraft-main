<template>
  <v-menu :location="location">
    <template #activator="{ props }">
      <v-btn
      fab
      icon
      v-bind="props"
      color="primary"
    
      >
        <v-icon  icon="mdi-plus" />
      </v-btn>
    
    </template>
    <v-list class="glass-menu">
      <v-list-item
        prepend-icon="mdi-sword-cross"
        title="Stat Block"
        @click="$emit('add-stat-block')"
      />
      <v-list-item
        prepend-icon="mdi-account"
        title="Character"
        @click="$emit('add-character')"
      />
      <v-list-item
        prepend-icon="mdi-treasure-chest"
        title="Item"
        @click="$emit('add-item')"
      />
      <v-list-item
        prepend-icon="mdi-note-plus"
        title="Note"
        @click="$emit('add-note')"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'add-stat-block': []
  'add-character': []
  'add-item': []
  'add-note': []
}>()
</script>


