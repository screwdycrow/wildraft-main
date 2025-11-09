<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit">
    <v-card class="glass-card  form-container" elevation="0">
      <!-- Header -->
      <v-card-title class="text-h5 font-weight-bold d-flex align-center form-actions-sticky px-6">
        <v-icon :icon="icon" :color="iconColor" size="32" class="mr-3" />
        {{ title }}
        <v-spacer />
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('cancel')" />
        <v-btn icon="mdi-check" size="small" variant="text" @click="handleSubmit" :loading="isLoading" />
      </v-card-title>

      <v-row no-gutters class="form-row-content">
        <!-- Left Tabs (Optional) -->
        <v-col v-if="$slots.tabs" cols="2" class="border-e">
          <slot name="tabs" />
        </v-col>

        <!-- Main Content -->
        <v-col class="form-main-content" :cols="$slots.tabs ? 7 : 9">
          <v-card-text class="pa-6 form-content-scrollable">
            <slot name="content" />
          </v-card-text>
        </v-col>

        <!-- Sidebar (Right): Actions, Files & Tags -->
        <v-col cols="3" class="border-s border-e">
          <div class="form-content-scrollable pa-4">
            <slot name="sidebar" />

            <!-- File Attachments -->
            <div class="mb-6">
              <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon icon="mdi-paperclip" size="small" class="mr-2" />
                Files & Images
              </h3>
              <file-attachment-manager 
                :model-value="fileIds"
                @update:model-value="$emit('update:fileIds', $event)"
                :featured-image-id="featuredImageId"
                @update:featured-image-id="$emit('update:featuredImageId', $event)"
                :columns="3"
              />
            </div>

            <v-divider class="my-4" />

            <!-- Tags Selector -->
            <div>
              <h3 class="text-subtitle-1 font-weight-bold mb-3 d-flex align-center">
                <v-icon icon="mdi-tag-multiple" size="small" class="mr-2" />
                Tags
              </h3>
              <tag-selector
                :model-value="tagIds"
                @update:model-value="$emit('update:tagIds', $event)"
                :library-id="libraryId"
                hint=""
                show-add-button
                @add-tag="$emit('add-tag')"
              />
            </div>
          </div>
        </v-col>
      </v-row>

      <v-divider />
      
      <!-- Bottom Actions (Sticky) -->
      <v-card-actions class="form-actions-sticky px-6 ">
        <v-spacer />
        <v-btn variant="text" @click="$emit('cancel')" :disabled="isLoading">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="flat" type="submit" :loading="isLoading">
          <v-icon icon="mdi-check" class="mr-2" />
          {{ saveButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VForm } from 'vuetify/components'
import TagSelector from '@/components/tags/TagSelector.vue'
import FileAttachmentManager from '@/components/items/common/FileAttachmentManager.vue'

interface Props {
  title: string
  icon: string
  iconColor?: string
  isLoading: boolean
  saveButtonText: string
  libraryId: number
  fileIds: number[]
  featuredImageId: number | null
  tagIds: number[]
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
})

const emit = defineEmits<{
  submit: []
  cancel: []
  'update:fileIds': [value: number[]]
  'update:featuredImageId': [value: number | null]
  'update:tagIds': [value: number[]]
  'add-tag': []
}>()

const formRef = ref<VForm>()

async function handleSubmit() {
  emit('submit')
}

defineExpose({
  formRef,
})
</script>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  min-height: 60vh;
  max-height: 90vh;
}


.form-row-content {
  min-height: 60vh;
  max-height: 90vh;
}

.form-content-scrollable {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  padding-bottom: 60px;
}

.form-actions-sticky {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
  padding-bottom: 24px !important;
}

.border-s {
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.border-e {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}
</style>

