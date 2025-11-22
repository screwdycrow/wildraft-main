<template>
  <v-card
    class="dm-screen-card glass-card"
    elevation="0"
    hover
    @click="handleClick"
  >
    <div class="dm-screen-card-content">
      <!-- Active Badge -->
      <v-chip
        v-if="isActive"
        color="success"
        size="small"
        class="active-badge"
      >
        <v-icon icon="mdi-check-circle" size="small" class="mr-1" />
        Active
      </v-chip>

      <!-- DM Screen Icon -->
      <div class="dm-screen-icon mb-4">
        <v-icon icon="mdi-monitor-dashboard" size="64" color="primary" />
      </div>

      <!-- DM Screen Info -->
      <v-card-title class="text-h5 font-weight-bold px-0 pb-2">
        {{ dmScreen.name }}
      </v-card-title>

      <v-card-subtitle class="px-0 pb-4 text-grey-lighten-1">
        {{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}
      </v-card-subtitle>

      <!-- Stats -->
      <div class="dm-screen-stats mb-4">
        <div class="stat-item">
          <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
          <span class="text-caption">
            Updated {{ formatDate(dmScreen.updatedAt) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="dm-screen-actions">
        <v-btn
          color="primary"
          variant="outlined"
          block
          prepend-icon="mdi-eye"
          @click.stop="handleView"
        >
          Open Screen
        </v-btn>

        <v-menu location="bottom">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-vertical"
              variant="text"
              size="default"
              class="action-menu-btn"
              color="grey-lighten-1"
              @click.stop
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list class="glass-menu">
            <v-list-item
              prepend-icon="mdi-check-circle"
              :title="isActive ? 'Active' : 'Set as Active'"
              :disabled="isActive"
              @click="handleSetActive"
            />
            <template v-if="props.canEdit">
              <v-divider class="my-2" />
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Edit"
                @click="handleEdit"
              />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                class="text-error"
                @click="handleDelete"
              />
            </template>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Hover Glow Effect -->
    <div class="card-glow" />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { DmScreen } from '@/types/dmScreen.types'
import { formatDistanceToNow } from 'date-fns'
import { useDmScreensStore } from '@/stores/dmScreens'

const props = withDefaults(defineProps<{
  dmScreen: DmScreen
  libraryId: number
  canEdit?: boolean
}>(), {
  canEdit: true
})

const emit = defineEmits<{
  edit: [dmScreen: DmScreen]
  delete: [dmScreen: DmScreen]
  setActive: [dmScreen: DmScreen]
}>()

const router = useRouter()
const dmScreensStore = useDmScreensStore()

const isActive = computed(() => {
  return dmScreensStore.activeDmScreen?.id === props.dmScreen.id
})

const itemCount = computed(() => {
  return props.dmScreen.items?.length || 0
})

function formatDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function handleClick() {
  handleView()
}

function handleView() {
  router.push({ 
    name: 'DmScreen', 
    params: { 
      id: props.libraryId,
      dmScreenId: props.dmScreen.id 
    } 
  })
}

function handleEdit() {
  emit('edit', props.dmScreen)
}

function handleDelete() {
  emit('delete', props.dmScreen)
}

function handleSetActive() {
  emit('setActive', props.dmScreen)
}
</script>

<style scoped>
.dm-screen-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.dm-screen-card-content {
  padding: 24px;
  position: relative;
  z-index: 2;
}

.active-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 3;
}

.dm-screen-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  background: rgba(220, 20, 60, 0.1);
  border-radius: 50%;
  border: 2px solid rgba(220, 20, 60, 0.3);
  transition: all 0.3s ease-in-out;
}

.dm-screen-card:hover .dm-screen-icon {
  background: rgba(220, 20, 60, 0.2);
  border-color: rgba(220, 20, 60, 0.5);
  transform: scale(1.05);
}

.dm-screen-stats {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
}

.dm-screen-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  margin-top: 8px;
}

.dm-screen-actions .v-btn:first-child {
  flex: 1;
  min-width: 0;
}

.action-menu-btn {
  flex-shrink: 0;
  min-width: 40px !important;
  width: 40px !important;
  height: 40px !important;
  opacity: 0.8;
}

.action-menu-btn:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(220, 20, 60, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  pointer-events: none;
}

.dm-screen-card:hover .card-glow {
  opacity: 1;
}
</style>

