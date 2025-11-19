<template>
  <div class="video-viewer">
    <video
      ref="videoEl"
      :src="url"
      controls
      class="video-viewer__player"
      @loadedmetadata="onMetadataLoad"
    >
      Your browser does not support the video tag.
    </video>

    <!-- Additional Controls -->
    <div class="video-viewer__controls">
      <v-btn
        icon="mdi-skip-backward"
        size="small"
        @click="skipBackward"
      />
      <v-btn
        :icon="isPlaying ? 'mdi-pause' : 'mdi-play'"
        size="small"
        @click="togglePlay"
      />
      <v-btn
        icon="mdi-skip-forward"
        size="small"
        @click="skipForward"
      />
      
      <v-chip class="ml-4">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </v-chip>

      <v-spacer />

      <v-btn
        :icon="isMuted ? 'mdi-volume-off' : 'mdi-volume-high'"
        size="small"
        @click="toggleMute"
      />
      
      <v-btn
        icon="mdi-fullscreen"
        size="small"
        @click="toggleFullscreen"
      />
      
      <v-btn
        icon="mdi-download"
        size="small"
        @click="download"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  url: string
  fileName: string
}

const props = defineProps<Props>()

const videoEl = ref<HTMLVideoElement>()
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const onMetadataLoad = () => {
  if (videoEl.value) {
    duration.value = videoEl.value.duration
  }
}

const togglePlay = () => {
  if (!videoEl.value) return
  
  if (videoEl.value.paused) {
    videoEl.value.play()
    isPlaying.value = true
  } else {
    videoEl.value.pause()
    isPlaying.value = false
  }
}

const skipBackward = () => {
  if (videoEl.value) {
    videoEl.value.currentTime = Math.max(0, videoEl.value.currentTime - 10)
  }
}

const skipForward = () => {
  if (videoEl.value) {
    videoEl.value.currentTime = Math.min(duration.value, videoEl.value.currentTime + 10)
  }
}

const toggleMute = () => {
  if (videoEl.value) {
    videoEl.value.muted = !videoEl.value.muted
    isMuted.value = videoEl.value.muted
  }
}

const toggleFullscreen = () => {
  if (videoEl.value) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      videoEl.value.requestFullscreen()
    }
  }
}

const download = () => {
  const link = document.createElement('a')
  link.href = props.url
  link.download = props.fileName
  link.click()
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const updateTime = () => {
  if (videoEl.value) {
    currentTime.value = videoEl.value.currentTime
  }
}

// Keyboard shortcuts
const handleKeyPress = (e: KeyboardEvent) => {
  switch (e.key) {
    case ' ':
      e.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      skipBackward()
      break
    case 'ArrowRight':
      skipForward()
      break
    case 'm':
      toggleMute()
      break
    case 'f':
      toggleFullscreen()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  if (videoEl.value) {
    videoEl.value.addEventListener('timeupdate', updateTime)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
  if (videoEl.value) {
    videoEl.value.removeEventListener('timeupdate', updateTime)
  }
})
</script>

<style scoped>
.video-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
}

.video-viewer__player {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-viewer__controls {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
}
</style>



