<template>
  <div class="tiptap-editor-wrapper">
    <!-- First Row Toolbar -->
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

      <v-divider vertical class="mx-2" />

      <!-- Image and Table Buttons -->
      <v-btn-toggle v-if="effectiveLibraryId" density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="openFileManagerForImage"
        >
          <v-icon>mdi-image</v-icon>
        </v-btn>
        <v-btn
          size="small"
          :class="{ 'v-btn--active': editor.isActive('table') }"
          @click="insertTable"
        >
          <v-icon>mdi-table</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-btn-toggle v-else density="compact" variant="outlined">
        <v-btn
          size="small"
          :class="{ 'v-btn--active': editor.isActive('table') }"
          @click="insertTable"
        >
          <v-icon>mdi-table</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Second Row - Table Actions (Only shown when table is active) -->
    <div v-if="editor && editor.isActive('table')" class="editor-toolbar glass-card mb-2 pa-2">
      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().addRowBefore().run())"
        >
          <v-icon>mdi-table-row-plus-before</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().addRowAfter().run())"
        >
          <v-icon>mdi-table-row-plus-after</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().deleteRow().run())"
        >
          <v-icon>mdi-table-row-remove</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().addColumnBefore().run())"
        >
          <v-icon>mdi-table-column-plus-before</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().addColumnAfter().run())"
        >
          <v-icon>mdi-table-column-plus-after</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().deleteColumn().run())"
        >
          <v-icon>mdi-table-column-remove</v-icon>
        </v-btn>
      </v-btn-toggle>

      <v-divider vertical class="mx-2" />

      <v-btn-toggle density="compact" variant="outlined" divided>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().toggleHeaderRow().run())"
        >
          <v-icon>mdi-table-cog</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().toggleHeaderColumn().run())"
        >
          <v-icon>mdi-table-cog</v-icon>
        </v-btn>
        <v-btn
          size="small"
          @click="handleTableAction(() => editor.chain().focus().deleteTable().run())"
        >
          <v-icon>mdi-table-remove</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- File Manager Dialog for Images -->
    <file-manager
      v-if="effectiveLibraryId"
      v-model="imageManagerOpen"
      select-mode
      :multiple="true"
      return-type="id"
      @select="handleImagesSelected"
    />

      <editor-content :editor="editor" class="editor-content" />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, provide } from 'vue'
import { useEditor, EditorContent, VueNodeViewRenderer } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { FileAttachment } from './tiptap/FileAttachment'
import FileAttachmentNodeView from './tiptap/FileAttachmentNodeView.vue'
import ResizableImageNodeView from './tiptap/ResizableImageNodeView.vue'
import FileManager from '@/components/files/FileManager.vue'
import { getFile } from '@/api/files'
import { useToast } from 'vue-toastification'
import { useRoute } from 'vue-router'
import { useLibraryStore } from '@/stores/library'
import { computed } from 'vue'
import { getFileDownloadUrl } from '@/config/api'
import type { UserFile } from '@/types/item.types'
import { resolveImageUrlsInHtml } from '@/utils/imageResolver'

interface Props {
  modelValue: string
  placeholder?: string
  minHeight?: string
  error?: string
  libraryId?: number | null
  libraryItemId?: number | null
  userFileIds?: number[]
  userFiles?: Array<{ id: number; downloadUrl?: string; fileUrl?: string }>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start typing...',
  minHeight: '200px',
  libraryId: null,
  libraryItemId: null,
  userFileIds: () => [],
  userFiles: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:userFileIds': [fileIds: number[]]
}>()

const route = useRoute()
const libraryStore = useLibraryStore()
const toast = useToast()
const imageManagerOpen = ref(false)

// Get libraryId from prop, route, or store
const effectiveLibraryId = computed(() => {
  // First, use the prop if provided
  if (props.libraryId) {
    return props.libraryId
  }
  
  // Second, try to get from route params (for routes like /library/:id/...)
  const routeId = route.params.id || route.params.libraryId
  if (routeId) {
    const id = typeof routeId === 'string' ? Number(routeId) : routeId
    if (!isNaN(id as number)) {
      return id as number
    }
  }
  
  // Third, try to get from current library in store
  if (libraryStore.currentLibrary?.id) {
    return libraryStore.currentLibrary.id
  }
  
  return null
})

// Handle file deletion from editor
async function handleFileDelete(fileId: number) {
  if (!editor.value) return
  
  // Find and remove the file attachment node
  const { state } = editor.value
  const { tr } = state
  let found = false
  
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'fileAttachment' && node.attrs.fileId === fileId && !found) {
      tr.delete(pos, pos + node.nodeSize)
      found = true
    }
  })
  
  if (found) {
    editor.value.view.dispatch(tr)
    
    // Remove from userFileIds (file will be detached when the note is saved)
    const updatedFileIds = (props.userFileIds || []).filter(id => id !== fileId)
    emit('update:userFileIds', updatedFileIds)
  }
}

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
    Image.extend({
      addAttributes() {
        return {
          ...this.parent?.(),
          fileId: {
            default: null,
            parseHTML: element => {
              const id = element.getAttribute('data-file-id')
              return id ? Number(id) : null
            },
            renderHTML: attributes => {
              if (!attributes.fileId) {
                return {}
              }
              return {
                'data-file-id': String(attributes.fileId),
              }
            },
          },
          width: {
            default: null,
            renderHTML: attributes => {
              if (!attributes.width) {
                return {}
              }
              return {
                width: attributes.width,
              }
            },
            parseHTML: element => {
              const width = element.getAttribute('width')
              return width ? parseInt(width, 10) : null
            },
          },
          height: {
            default: null,
            renderHTML: attributes => {
              if (!attributes.height) {
                return {}
              }
              return {
                height: attributes.height,
              }
            },
            parseHTML: element => {
              const height = element.getAttribute('height')
              return height ? parseInt(height, 10) : null
            },
          },
        }
      },
      addNodeView() {
        return VueNodeViewRenderer(ResizableImageNodeView)
      },
    }).configure({
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'editor-table',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
    FileAttachment.extend({
      addNodeView() {
        return VueNodeViewRenderer(FileAttachmentNodeView)
      },
    }).configure({
      HTMLAttributes: {
        class: 'file-attachment-node',
      },
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

// Provide delete handler and userFiles to node views
provide('handleFileDelete', handleFileDelete)
provide('userFiles', computed(() => props.userFiles || []))

async function openFileManagerForImage() {
  imageManagerOpen.value = true
}

function insertTable() {
  if (!editor.value) return
  const result = editor.value.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  if (!result) {
    console.error('Failed to insert table')
    toast.error('Failed to insert table')
  }
}

function handleTableAction(action: () => boolean) {
  if (!editor.value) return
  const result = action()
  if (!result) {
    toast.error('Cannot perform this action')
  }
}

async function handleImagesSelected(fileIds: number | number[]) {
  if (!effectiveLibraryId.value || !editor.value) return

  const idsArray = Array.isArray(fileIds) ? fileIds : [fileIds]
  
  try {
    // Fetch file details for all selected files (allow inserting same image multiple times)
    const filePromises = idsArray.map(id => getFile(id))
    const files = await Promise.all(filePromises)
    
    // Update userFileIds - only add files that aren't already attached
    const existingFileIds = new Set(props.userFileIds || [])
    const newFileIds = idsArray.filter(id => !existingFileIds.has(id))
    if (newFileIds.length > 0) {
      const updatedFileIds = [...(props.userFileIds || []), ...newFileIds]
      emit('update:userFileIds', updatedFileIds)
    }
    
    // Insert images as images, other files as attachments (allow duplicates in editor)
    files.forEach(file => {
      const isImage = file.fileType.startsWith('image/')
      const fileUrl = file.downloadUrl || file.fileUrl
      
      if (isImage && fileUrl) {
        // Insert as resizable image with fileId reference
        editor.value?.chain().focus().setImage({ 
          src: fileUrl, // Temporary URL for immediate display
          alt: file.fileName,
          fileId: file.id // Store fileId for later resolution
        }).run()
      } else {
        // Insert as file attachment
        editor.value?.chain().focus().setFileAttachment({
          fileId: file.id,
          fileName: file.fileName,
          fileType: file.fileType,
          fileUrl: fileUrl,
        }).run()
      }
    })
    
    imageManagerOpen.value = false
  } catch (error) {
    console.error('Failed to load file details:', error)
    toast.error('Failed to insert images')
  }
}


watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    // Resolve image URLs before setting content
    const resolvedContent = resolveImageUrlsInHtml(newValue || '', props.userFiles || [])
    editor.value.commands.setContent(resolvedContent || '', false)
  }
})

// Watch userFiles to update image URLs when they change
watch(() => props.userFiles, () => {
  if (editor.value && props.userFiles?.length) {
    const currentHtml = editor.value.getHTML()
    const resolvedContent = resolveImageUrlsInHtml(currentHtml, props.userFiles)
    if (resolvedContent !== currentHtml) {
      editor.value.commands.setContent(resolvedContent, false)
    }
  }
}, { deep: true })

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
  padding: 24px 32px;
  transition: all 0.3s ease;
  border-radius: 8px;
  max-height: v-bind(minHeight);
  overflow-y: auto;
}

:deep(.tiptap-content) {
  min-height: v-bind(minHeight);
  outline: none;
  font-size: 1.0625rem;
  line-height: 1.8;
  letter-spacing: 0.005em;
  color: rgba(255, 255, 255, 0.9);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: color 0.2s ease;
}

:deep(.tiptap-content p) {
  margin: 0.7em 0;
  padding: 0;
}

:deep(.tiptap-content h1) {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 1.25em 0 0.6em 0;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.95);
}

:deep(.tiptap-content h2) {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 1.3;
  margin: 1.1em 0 0.55em 0;
  letter-spacing: -0.01em;
  color: rgba(255, 255, 255, 0.95);
}

:deep(.tiptap-content h3) {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.4;
  margin: 0.95em 0 0.5em 0;
  color: rgba(255, 255, 255, 0.93);
}

:deep(.tiptap-content ul),
:deep(.tiptap-content ol) {
  padding-left: 1.75em;
  margin: 0.7em 0;
  line-height: 1.8;
}

:deep(.tiptap-content li) {
  margin: 0.35em 0;
  padding-left: 0.4em;
}

:deep(.tiptap-content blockquote) {
  border-left: 4px solid rgba(148, 197, 255, 0.5);
  padding-left: 1.25em;
  margin: 1.1em 0;
  font-style: italic;
  opacity: 0.9;
  font-size: 1.05em;
  line-height: 1.75;
  background: rgba(255, 255, 255, 0.02);
  padding: 0.9em 1.25em;
  border-radius: 0 8px 8px 0;
}

:deep(.tiptap-content hr) {
  border: none;
  border-top: 2px solid rgba(255, 255, 255, 0.15);
  margin: 1.75em 0;
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
  color: rgba(148, 197, 255, 0.9);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}

:deep(.tiptap-content a:hover) {
  color: rgba(148, 197, 255, 1);
}

:deep(.tiptap-content .is-empty::before) {
  content: attr(data-placeholder);
  float: left;
  color: rgba(255, 255, 255, 0.25);
  pointer-events: none;
  height: 0;
  font-size: 1.0625rem;
  font-style: italic;
}

:deep(.tiptap-content [data-type="file-attachment"]) {
  display: inline-block;
  margin: 0 2px;
}

:deep(.tiptap-content .editor-image) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 1.5em 0;
  cursor: pointer;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:deep(.tiptap-content .editor-image:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

:deep(.tiptap-content .resizable-image-wrapper) {
  display: inline-block;
  margin: 1.5em 0;
  max-width: 100%;
}

:deep(.tiptap-content .resizable-image-wrapper.is-selected) {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Table Styles - Make sure tables are visible! */
:deep(.tiptap-content table),
:deep(.tiptap-content .editor-table) {
  border-collapse: collapse;
  margin: 1.5em 0;
  table-layout: fixed;
  width: 100%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: table !important;
  visibility: visible !important;
}

:deep(.tiptap-content table td),
:deep(.tiptap-content table th),
:deep(.tiptap-content .editor-table td),
:deep(.tiptap-content .editor-table th) {
  min-width: 1em;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding: 12px 16px !important;
  vertical-align: top;
  box-sizing: border-box;
  position: relative;
  transition: background-color 0.2s ease;
  color: rgb(var(--v-theme-on-surface)) !important;
  display: table-cell !important;
  visibility: visible !important;
}

:deep(.tiptap-content table th),
:deep(.tiptap-content .editor-table th) {
  font-weight: 600 !important;
  text-align: left;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.2), rgba(var(--v-theme-primary), 0.1)) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  border-bottom: 2px solid rgba(var(--v-theme-primary), 0.4) !important;
}

:deep(.tiptap-content table td:hover),
:deep(.tiptap-content .editor-table td:hover) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}

:deep(.tiptap-content table .selectedCell),
:deep(.tiptap-content .editor-table .selectedCell) {
  background-color: rgba(var(--v-theme-primary), 0.15) !important;
}

:deep(.tiptap-content table .selectedCell:after),
:deep(.tiptap-content .editor-table .selectedCell:after) {
  z-index: 2;
  position: absolute;
  content: "";
  left: 0; right: 0; top: 0; bottom: 0;
  border: 2px solid rgb(var(--v-theme-primary));
  pointer-events: none;
  border-radius: 2px;
}

:deep(.tiptap-content table .column-resize-handle),
:deep(.tiptap-content .editor-table .column-resize-handle) {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: -2px;
  width: 4px;
  background-color: rgb(var(--v-theme-primary));
  cursor: col-resize;
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.tiptap-content table:hover .column-resize-handle),
:deep(.tiptap-content .editor-table:hover .column-resize-handle) {
  opacity: 1;
}

:deep(.tiptap-content table tr:first-child th:first-child),
:deep(.tiptap-content .editor-table tr:first-child th:first-child) {
  border-top-left-radius: 8px;
}

:deep(.tiptap-content table tr:first-child th:last-child),
:deep(.tiptap-content .editor-table tr:first-child th:last-child) {
  border-top-right-radius: 8px;
}

:deep(.tiptap-content table tr:last-child td:first-child),
:deep(.tiptap-content .editor-table tr:last-child td:first-child) {
  border-bottom-left-radius: 8px;
}

:deep(.tiptap-content table tr:last-child td:last-child),
:deep(.tiptap-content .editor-table tr:last-child td:last-child) {
  border-bottom-right-radius: 8px;
}

/* Ensure table wrapper is visible */
:deep(.tiptap-content .tableWrapper) {
  margin: 1.5em 0;
  overflow-x: auto;
}

:deep(.tiptap-content .tableWrapper table) {
  margin: 0;
}

</style>

