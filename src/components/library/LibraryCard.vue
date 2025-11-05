<template>
  <v-card
    class="library-card glass-card"
    elevation="0"
    hover
    @click="handleClick"
  >
    <div class="library-card-content">
      <!-- Role Badge -->
      <v-chip
        :color="roleColor"
        size="small"
        class="role-badge"
      >
        <v-icon :icon="roleIcon" size="small" class="mr-1" />
        {{ library.role }}
      </v-chip>

      <!-- Library Icon -->
      <div class="library-icon mb-4">
        <v-icon icon="mdi-book-open-variant" size="64" color="primary" />
      </div>

      <!-- Library Info -->
      <v-card-title class="text-h5 font-weight-bold px-0 pb-2">
        {{ library.name }}
      </v-card-title>

      <v-card-subtitle class="px-0 pb-4 text-grey-lighten-1">
        {{ library.description || 'No description' }}
      </v-card-subtitle>

      <!-- Stats -->
      <div class="library-stats mb-4">
        <div class="stat-item">
          <v-icon icon="mdi-calendar-clock" size="small" class="mr-1" />
          <span class="text-caption">
            Updated {{ formatDate(library.updatedAt) }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="library-actions">
        <v-btn
          color="primary"
          variant="outlined"
          block
          prepend-icon="mdi-eye"
          @click.stop="handleView"
        >
          View Library
        </v-btn>

        <v-menu v-if="canEdit" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              class="action-menu-btn"
              @click.stop
            />
          </template>
          <v-list class="glass-menu">
            <v-list-item
              prepend-icon="mdi-pencil"
              title="Edit"
              @click="handleEdit"
            />
            <v-list-item
              prepend-icon="mdi-share-variant"
              title="Share"
              @click="handleShare"
            />
            <v-divider v-if="isOwner" class="my-2" />
            <v-list-item
              v-if="isOwner"
              prepend-icon="mdi-delete"
              title="Delete"
              class="text-error"
              @click="handleDelete"
            />
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
import type { Library } from '@/types/library.types'
import { formatDistanceToNow } from 'date-fns'

const props = defineProps<{
  library: Library
}>()

const emit = defineEmits<{
  edit: [library: Library]
  delete: [library: Library]
  share: [library: Library]
}>()

const router = useRouter()

const isOwner = computed(() => props.library.role === 'OWNER')
const canEdit = computed(() => ['OWNER', 'EDITOR'].includes(props.library.role))

const roleColor = computed(() => {
  switch (props.library.role) {
    case 'OWNER': return 'primary'
    case 'EDITOR': return 'secondary'
    case 'VIEWER': return 'info'
    default: return 'grey'
  }
})

const roleIcon = computed(() => {
  switch (props.library.role) {
    case 'OWNER': return 'mdi-crown'
    case 'EDITOR': return 'mdi-pencil'
    case 'VIEWER': return 'mdi-eye'
    default: return 'mdi-account'
  }
})

function formatDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function handleClick() {
  handleView()
}

function handleView() {
  router.push({ name: 'Library', params: { id: props.library.id } })
}

function handleEdit() {
  emit('edit', props.library)
}

function handleDelete() {
  emit('delete', props.library)
}

function handleShare() {
  emit('share', props.library)
}
</script>

<style scoped>
.library-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.library-card-content {
  padding: 24px;
  position: relative;
  z-index: 2;
}

.role-badge {
  position: absolute;
  top: 16px;
  right: 16px;
}

.library-icon {
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

.library-card:hover .library-icon {
  background: rgba(220, 20, 60, 0.2);
  border-color: rgba(220, 20, 60, 0.5);
  transform: scale(1.05);
}

.library-stats {
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

.library-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.library-actions .v-btn:first-child {
  flex: 1;
}

.action-menu-btn {
  flex-shrink: 0;
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

.library-card:hover .card-glow {
  opacity: 1;
}
</style>

