<template>
  <v-card
    class="note-card"
    elevation="0"
    hover
    @click="$emit('click', item)"
  >
    <!-- Featured Image Background -->
    <div class="card-background" :style="backgroundStyle"></div>
    
    <!-- Content -->
    <div class="card-content">
      <v-card-title class="card-title d-flex align-center pb-2" :style="{ color: textColor }">
        <v-icon icon="mdi-note-text" size="small" class="mr-2" :style="{ color: textColor }" />
        <span class="text-truncate font-weight-bold">{{ item.name }}</span>
        <v-spacer />
        <v-icon
          v-if="noteData.isPinned"
          icon="mdi-pin"
          size="small"
          :style="{ color: textColor }"
        />
      </v-card-title>

      <!-- Description -->
      <v-card-text class="flex-grow-1">
        <p v-if="item.description" class="text-body-1 mb-3 description-text" :style="{ color: textColor }">
          {{ item.description }}
        </p>

        <!-- Content Snippet -->
        <p class="text-body-2 content-preview" :style="{ color: textColor, opacity: 0.85 }">
          {{ getContentPreview(noteData.content) }}
        </p>
      </v-card-text>

      <!-- Footer -->
      <v-card-actions class="card-footer">
        <!-- Tags -->
        <div v-if="item.tags && item.tags.length > 0" class="tags-container">
          <v-chip
            v-for="tag in item.tags.slice(0, 3)"
            :key="tag.id"
            :color="tag.color"
            size="x-small"
            class="mr-1"
          >
            {{ tag.name }}
          </v-chip>
          <v-chip
            v-if="item.tags.length > 3"
            size="x-small"
            variant="tonal"
            :style="{ color: textColor }"
          >
            +{{ item.tags.length - 3 }}
          </v-chip>
        </div>

        <v-spacer />

        <!-- File count -->
        <div v-if="item.userFiles && item.userFiles.length > 0" class="file-count" :style="{ color: textColor }">
          <v-icon icon="mdi-paperclip" size="small" class="mr-1" />
          <span class="text-caption">{{ item.userFiles.length }}</span>
        </div>
      </v-card-actions>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LibraryItem, NoteData } from '@/types/item.types'
import { useFilesStore } from '@/stores/files'

interface Props {
  item: LibraryItem
  showActions?: boolean
  textColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  textColor: '#FFFFFF', // White by default, can be customized later
})

defineEmits<{
  click: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const filesStore = useFilesStore()
const noteData = computed<NoteData>(() => props.item.data as NoteData)

// Load featured image URL
const featuredImageUrl = ref('')
watch(() => props.item.featuredImage, async (featuredImage) => {
  if (featuredImage) {
    try {
      featuredImageUrl.value = await filesStore.getDownloadUrl(featuredImage.id)
    } catch (error) {
      console.error('Failed to load featured image:', error)
    }
  } else {
    featuredImageUrl.value = ''
  }
}, { immediate: true })

const backgroundStyle = computed(() => {
  if (featuredImageUrl.value) {
    return {
      backgroundImage: `url(${featuredImageUrl.value})`,
    }
  }
  return {
    background: 'linear-gradient(135deg, rgba(149, 165, 166, 0.3), rgba(127, 140, 141, 0.3))',
  }
})

const getContentPreview = (content: string): string => {
  if (!content) return 'No content'
  // Strip markdown/HTML and truncate
  const plainText = content.replace(/[#*_`~\[\]()]/g, '').trim()
  return plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '')
}
</script>

<style scoped>
.note-card {
  position: relative;
  overflow: hidden;
  height: 300px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  background-color: rgba(var(--v-theme-card-background)) !important;
  border-radius: 16px !important;
  border: none !important;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.note-card:hover .card-background {
  opacity: 0.4;
}

.card-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.description-text {
  font-weight: 500;
  line-height: 1.4;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-preview {
  line-height: 1.5;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.file-count {
  display: flex;
  align-items: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
