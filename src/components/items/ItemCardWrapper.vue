<template>
  <div class="item-card-wrapper" @mouseenter="showActions = true" @mouseleave="showActions = false">
    <component
      :is="cardComponent"
      :item="item"
      v-bind="$attrs"
      @click="handleCardClick"
    />
    
    <!-- Hover Actions -->
    <transition name="fade">
      <div v-if="showActions" class="card-actions">
        <v-btn
          v-if="canAddToCombat"
          icon="mdi-sword-cross"
          size="small"
          color="success"
          variant="flat"
          @click.stop="handleAddToCombat"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Add to Active Combat
          </v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-pencil"
          size="small"
          color="primary"
          variant="flat"
          @click.stop="$emit('edit', item)"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Edit
          </v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-eye"
          size="small"
          color="info"
          variant="flat"
          @click.stop="$emit('view', item)"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Quick View
          </v-tooltip>
        </v-btn>
        <v-btn
          icon="mdi-delete"
          size="small"
          color="error"
          variant="flat"
          @click.stop="$emit('delete', item)"
        >
          <v-icon />
          <v-tooltip activator="parent" location="bottom">
            Delete
          </v-tooltip>
        </v-btn>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LibraryItem } from '@/types/item.types'
import { useItemComponents } from '@/composables/useItemComponents'
import { useQuickItemViewStore } from '@/stores/quickItemView'
import { useCombat } from '@/composables/useCombat'
import { useCombatEncountersStore } from '@/stores/combatEncounters'
import { useToast } from 'vue-toastification'

interface Props {
  item: LibraryItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [item: LibraryItem]
  view: [item: LibraryItem]
  delete: [item: LibraryItem]
}>()

const showActions = ref(false)

const { getItemComponent } = useItemComponents()
const quickItemViewStore = useQuickItemViewStore()
const { addToActiveEncounter, activeEncounter } = useCombat()
const combatStore = useCombatEncountersStore()
const toast = useToast()

const cardComponent = computed(() => {
  return getItemComponent(props.item.type, 'card')
})

const canAddToCombat = computed(() => {
  // Only show if there's an active encounter
  return !!activeEncounter.value
})

function handleCardClick() {
  quickItemViewStore.open(props.item)
}

async function handleAddToCombat() {
  if (!activeEncounter.value) {
    toast.warning('No active combat encounter')
    return
  }

  try {
    await addToActiveEncounter(props.item)
    toast.success(`${props.item.name} added to combat!`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to add to combat')
  }
}
</script>

<style scoped>
.item-card-wrapper {
  position: relative;
  cursor: pointer;
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

