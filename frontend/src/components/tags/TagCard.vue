<template>
  <v-card 
    class="glass-card tag-card" 
    elevation="0" 
    hover
    style="cursor: pointer; position: relative; overflow: hidden;"
    @click="emit('click', tag)"
  >
    <!-- Featured Image Background -->
    <div 
      v-if="featuredImageUrl" 
      class="tag-background"
      :style="{ backgroundImage: `url(${featuredImageUrl})` }"
    />
    
    <!-- Color Overlay -->
    <div 
      class="tag-color-overlay"
      :style="{ backgroundColor: tag.color }"
    />
    
    <!-- Main Content -->
    <v-card-text class="tag-content pa-4">
      <div class="d-flex align-items-center justify-space-between mb-2">
        <div class="d-flex align-center flex-1 min-width-0">
          <v-icon
            v-if="draggable"
            icon="mdi-drag"
            class="tag-drag-handle mr-2 cursor-grab"
            color="white"
            size="small"
            @click.stop
          />
          <h3 class="tag-name text-h6 font-weight-bold text-white">
            <v-icon icon="mdi-tag" size="small" class="mr-1" />
            {{ tag.name }}
          </h3>
        </div>
        <v-menu v-if="canEdit" location="bottom end">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              color="white"
              class="tag-menu-btn"
              @click.stop
            />
          </template>
          <v-list class="glass-menu" density="compact">
            <v-list-item
              prepend-icon="mdi-pencil"
              title="Edit"
              @click.stop="emit('edit', tag)"
            />
            <v-divider class="my-1" />
            <v-list-item
              prepend-icon="mdi-delete"
              title="Delete"
              class="text-error"
              @click.stop="emit('delete', tag)"
            />
          </v-list>
        </v-menu>
      </div>

      <div class="d-flex align-items-center text-white tag-meta">
        <v-icon icon="mdi-file-document" size="small" class="mr-1" />
        <span class="text-body-2 font-weight-medium">
          {{ tag.itemCount || 0 }} {{ tag.itemCount === 1 ? 'item' : 'items' }}
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Tag } from '@/types/tag.types'
import { useFilesStore } from '@/stores/files'

const props = defineProps<{
  tag: Tag
  canEdit?: boolean
  draggable?: boolean
}>()

const emit = defineEmits<{
  click: [tag: Tag]
  edit: [tag: Tag]
  delete: [tag: Tag]
}>()

const filesStore = useFilesStore()
const featuredImageUrl = ref<string | null>(null)

async function loadFeaturedImage() {
  if (props.tag.featuredImage) {
    try {
      featuredImageUrl.value = await filesStore.getDownloadUrl(props.tag.featuredImage.id)
    } catch {
      featuredImageUrl.value = null
    }
  } else {
    featuredImageUrl.value = null
  }
}

onMounted(() => {
  loadFeaturedImage()
})

watch(() => props.tag.featuredImage, () => {
  loadFeaturedImage()
})
</script>

<style scoped>
.tag-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  min-height: 120px;
}

.tag-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* Featured Image Background */
.tag-background {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: right center;
  background-repeat: no-repeat;
  opacity: 0.4;
  z-index: 0;
  /* Right-aligned 3:2 ratio with fade to left (same as combatant) */
  mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0) 100%);
  -webkit-mask-image: linear-gradient(to left, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0.6) 70%, rgba(0, 0, 0, 0) 100%);
  /* Maintain 3:2 aspect ratio by constraining width */
  max-width: calc(100% * 2 / 4);
}

/* Color Overlay */
.tag-color-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  z-index: 1;
  mix-blend-mode: multiply;
}

/* Content */
.tag-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.tag-name {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  margin: 0;
  line-height: 1.2;
}

.tag-meta {
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.tag-menu-btn {
  opacity: 0.8;
  transition: opacity 0.2s;
}

.tag-menu-btn:hover {
  opacity: 1;
}

.cursor-grab {
  cursor: grab;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.cursor-grab:hover {
  opacity: 1;
}

.cursor-grab:active {
  cursor: grabbing;
}

.min-width-0 {
  min-width: 0;
}

.flex-1 {
  flex: 1;
}
</style>
