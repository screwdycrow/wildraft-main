<template>
  <div class="tiptap-editor-wrapper">
    <div v-if="editor" class="editor-toolbar glass-card mb-2 pa-2">
      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'v-btn--active': editor.isActive('bold') }"
        >
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'v-btn--active': editor.isActive('italic') }"
        >
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'v-btn--active': editor.isActive('strike') }"
        >
          <v-icon>mdi-format-strikethrough</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'v-btn--active': editor.isActive('heading', { level: 1 }) }"
        >
          <v-icon>mdi-format-header-1</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'v-btn--active': editor.isActive('heading', { level: 2 }) }"
        >
          <v-icon>mdi-format-header-2</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'v-btn--active': editor.isActive('heading', { level: 3 }) }"
        >
          <v-icon>mdi-format-header-3</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'v-btn--active': editor.isActive('bulletList') }"
        >
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'v-btn--active': editor.isActive('orderedList') }"
        >
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'v-btn--active': editor.isActive('blockquote') }"
        >
          <v-icon>mdi-format-quote-close</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="editor.chain().focus().setHorizontalRule().run()"
        >
          <v-icon>mdi-minus</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
        >
          <v-icon>mdi-undo</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
        >
          <v-icon>mdi-redo</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>

      <editor-content :editor="editor" class="editor-content" />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'

interface Props {
  modelValue: string
  placeholder?: string
  minHeight?: string
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start typing...',
  minHeight: '200px',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Link.configure({
      openOnClick: false,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-content',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue || '', false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.tiptap-editor-wrapper {
  width: 100%;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-radius: 8px;
}

.editor-content {
  padding: 16px;
}

:deep(.tiptap-content) {
  min-height: v-bind(minHeight);
  outline: none;
}

:deep(.tiptap-content p) {
  margin: 0.5em 0;
}

:deep(.tiptap-content h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

:deep(.tiptap-content h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.75em 0;
}

:deep(.tiptap-content h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 0.83em 0;
}

:deep(.tiptap-content ul),
:deep(.tiptap-content ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.tiptap-content blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding-left: 1em;
  margin-left: 0;
  font-style: italic;
  opacity: 0.8;
}

:deep(.tiptap-content hr) {
  border: none;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
  margin: 1em 0;
}

:deep(.tiptap-content code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

:deep(.tiptap-content pre) {
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.75em 1em;
  border-radius: 5px;
  overflow-x: auto;
}

:deep(.tiptap-content pre code) {
  background: none;
  padding: 0;
}

:deep(.tiptap-content a) {
  color: #3498db;
  text-decoration: underline;
}

:deep(.tiptap-content .is-empty::before) {
  content: attr(data-placeholder);
  float: left;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  height: 0;
}
</style>

