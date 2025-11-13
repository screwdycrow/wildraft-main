<template>
  <NodeViewWrapper as="span" class="file-attachment-wrapper">
    <file-attachment-card
      :file-id="node.attrs.fileId"
      :file-name="node.attrs.fileName"
      :file-type="node.attrs.fileType"
      :file-url="node.attrs.fileUrl"
      :deletable="deletable"
      @delete="handleDelete"
    />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { NodeViewWrapper } from '@tiptap/vue-3'
import FileAttachmentCard from './FileAttachmentCard.vue'

interface Props {
  node: ProseMirrorNode
  deletable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  deletable: true,
})

const emit = defineEmits<{
  delete: [fileId: number]
}>()

const handleFileDelete = inject<(fileId: number) => Promise<void>>('handleFileDelete')

function handleDelete(fileId: number) {
  if (handleFileDelete) {
    handleFileDelete(fileId)
  }
  emit('delete', fileId)
}
</script>

<style scoped>
.file-attachment-wrapper {
  display: inline-block;
}
</style>

