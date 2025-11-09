<template>
  <div class="pdf-viewer">
    <iframe
      :src="url"
      class="pdf-viewer__iframe"
      frameborder="0"
    />

    <!-- Controls -->
    <div class="pdf-viewer__controls">
      <v-btn
        icon="mdi-download"
        size="small"
        @click="download"
      />
      <v-btn
        icon="mdi-open-in-new"
        size="small"
        @click="openInNewTab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  url: string
  fileName: string
}

const props = defineProps<Props>()

const download = () => {
  const link = document.createElement('a')
  link.href = props.url
  link.download = props.fileName
  link.click()
}

const openInNewTab = () => {
  window.open(props.url, '_blank')
}
</script>

<style scoped>
.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.9);
}

.pdf-viewer__iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-viewer__controls {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
}
</style>


