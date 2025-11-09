<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-2">Inventory Items</div>
      <v-btn
        prepend-icon="mdi-plus"
        color="primary"
        variant="tonal"
        size="small"
        @click="addItem"
      >
        Add Item
      </v-btn>
    </div>

    <!-- Empty State -->
    <div v-if="items.length === 0" class="text-caption text-grey text-center py-4">
      No items in inventory
    </div>

    <!-- Items List -->
    <v-list v-else density="compact">
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        class="inventory-item"
      >
        <template #prepend>
          <v-checkbox
            v-model="item.equipped"
            density="compact"
            hide-details
            color="success"
            @update:model-value="$emit('update')"
          >
            <template #label>
              <v-icon
                :icon="item.equipped ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
                size="small"
              />
            </template>
          </v-checkbox>
        </template>

        <v-list-item-title class="d-flex align-center gap-2">
          <span>{{ item.name }}</span>
          <v-chip v-if="item.quantity && item.quantity > 1" size="x-small" variant="tonal">
            x{{ item.quantity }}
          </v-chip>
          <v-chip v-if="item.weight" size="x-small" variant="text" class="text-caption">
            {{ item.weight }} lb
          </v-chip>
        </v-list-item-title>

        <v-list-item-subtitle v-if="item.description" class="text-caption">
          {{ item.description }}
        </v-list-item-subtitle>

        <template #append>
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-pencil"
              size="x-small"
              variant="text"
              @click="editItem(index)"
            />
            <v-btn
              icon="mdi-delete"
              size="x-small"
              variant="text"
              color="error"
              @click="removeItem(index)"
            />
          </div>
        </template>
      </v-list-item>
    </v-list>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="showDialog" max-width="500">
      <v-card class="glass-card">
        <v-card-title>{{ editingIndex !== null ? 'Edit' : 'Add' }} Item</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingItem.name"
            label="Item Name"
            variant="outlined"
            density="compact"
            class="mb-3"
            autofocus
          />
          <v-textarea
            v-model="editingItem.description"
            label="Description"
            variant="outlined"
            density="compact"
            rows="2"
            class="mb-3"
          />
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="editingItem.quantity"
                label="Quantity"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="editingItem.weight"
                label="Weight (lb)"
                type="number"
                variant="outlined"
                density="compact"
              />
            </v-col>
          </v-row>
          <v-checkbox
            v-model="editingItem.equipped"
            label="Equipped"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveItem">
            {{ editingIndex !== null ? 'Update' : 'Add' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { InventoryItem } from '@/types/item.types'

interface Props {
  items: InventoryItem[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: []
}>()

const showDialog = ref(false)
const editingIndex = ref<number | null>(null)
const editingItem = ref<InventoryItem>({
  name: '',
  description: '',
  quantity: 1,
  weight: 0,
  equipped: false,
})

function addItem() {
  editingIndex.value = null
  editingItem.value = {
    name: '',
    description: '',
    quantity: 1,
    weight: 0,
    equipped: false,
  }
  showDialog.value = true
}

function editItem(index: number) {
  editingIndex.value = index
  editingItem.value = { ...props.items[index] }
  showDialog.value = true
}

function saveItem() {
  if (!editingItem.value.name.trim()) return

  if (editingIndex.value !== null) {
    // Update existing item
    Object.assign(props.items[editingIndex.value], editingItem.value)
  } else {
    // Add new item
    props.items.push({ ...editingItem.value })
  }

  emit('update')
  closeDialog()
}

function removeItem(index: number) {
  if (confirm('Remove this item from inventory?')) {
    props.items.splice(index, 1)
    emit('update')
  }
}

function closeDialog() {
  showDialog.value = false
  editingIndex.value = null
}
</script>

<style scoped>
.inventory-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.inventory-item:last-child {
  border-bottom: none;
}

.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>


