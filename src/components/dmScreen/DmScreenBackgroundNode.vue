<template>
  <div class="dm-screen-background-node">
    <img
      v-if="data.imageUrl"
      :src="data.imageUrl"
      :style="imageStyle"
      alt="DM Screen Background"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  data: {
    imageUrl: string | null
    width: number
  }
  selected?: boolean
}

const props = defineProps<Props>()

const imageStyle = computed(() => {
  return {
    width: `${props.data.width}px`,
    height: 'auto',
    display: 'block',
    objectFit: 'contain',
  }
})
</script>

<style scoped>
.dm-screen-background-node {
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
  border: none;
  outline: none;
}

.dm-screen-background-node img {
  width: 100%;
  height: auto;
  display: block;
  border: none;
  outline: none;
}
</style>

