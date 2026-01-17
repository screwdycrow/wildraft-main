<template>
  <v-dialog
    :model-value="store.isOpen"
    max-width="1400px"
    height="100%"
    persistent
    @update:model-value="store.setOpen"
  >
    <v-card v-if="store.item"  elevation="0">
      <v-card-title class="d-flex align-center">
        <div>
          <div class="text-h5 font-weight-bold">
            {{ store.item.name }}
          </div>
          <div class="text-subtitle-2 text-grey-lighten-1">
            {{ getItemTypeInfo(store.item.type).label }}
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-open-in-new" variant="text" @click="openFullView" />
        <v-btn icon="mdi-close" variant="text" @click="store.close()" />
      </v-card-title>

      <v-card-text class="pa-0">
        <div class="detail-container">
          <component
            v-if="detailComponent"
            :is="detailComponent"
            :item="store.item"
          />
          <div v-else class="pa-6 text-center">
            <v-progress-circular indeterminate color="primary" />
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuickItemViewStore } from '@/stores/quickItemView'
import { useItemComponents } from '@/composables/useItemComponents'

const store = useQuickItemViewStore()
const router = useRouter()
const { getItemComponent, getItemTypeInfo } = useItemComponents()

const detailComponent = computed(() => {
  if (!store.item) return null
  return getItemComponent(store.item.type, 'detail')
})

function openFullView() {
  if (!store.item) return
  store.close()
  router.push({
    name: 'ItemDetail',
    params: {
      libraryId: store.item.libraryId,
      itemId: store.item.id,
    },
  })
}
</script>

<style scoped>
.glass-card {
  background: rgba(17, 25, 40, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(18px);
}

.detail-container {
  overflow-y: auto;
  padding:24px;
  background-color: rgba(var(--v-theme-background), 0.95);
  height: 100%;
}
</style>


