<template>
  <div
    class="text-node-container"
    :style="containerStyle"
    :class="{ 'has-background': hasBackground }"
  >
    <!-- Category Header -->
    <div
      v-if="category"
      class="note-category-header"
      :style="{ backgroundColor: category.color }"
    >
      <v-icon :icon="category.icon" size="12" color="white" class="mr-1" />
      <span class="category-label">{{ category.name }}</span>
    </div>

    <!-- Optional Title Header -->
    <div
      v-if="data.title || isEditing"
      class="note-title-header"
      :style="{ color: data.textColor || '#ffffff' }"
    >
      <input
        v-if="isEditing"
        v-model="localTitle"
        class="title-editor nodrag"
        placeholder="Note title..."
        @keydown.enter.prevent="textareaRef?.focus()"
        @blur="handleBlur"
        @mousedown.stop
        @click.stop
      />
      <span v-else>{{ data.title }}</span>
    </div>

    <!-- Content Area -->
    <div class="note-body nowheel" @wheel.stop>
      <!-- Display Mode -->
      <div
        v-if="!isEditing"
        class="text-content"
        :style="textStyle"
        @dblclick="startEditing"
      >
        <div v-if="data.useMarkdown && data.text" class="markdown-content" v-html="renderedMarkdown" />
        <span v-else>{{ data.text || 'Double-click to edit' }}</span>
      </div>

      <!-- Edit Mode -->
      <textarea
        v-else
        ref="textareaRef"
        v-model="localText"
        class="text-editor nodrag nowheel"
        :style="textStyle"
        @blur="handleBlur"
        @keydown.esc="cancelEditing"
        @keydown.ctrl.enter="finishEditing"
        @click.stop
        @mousedown.stop
      />
    </div>

    <!-- Hover Actions -->
    <div class="note-actions" @click.stop>
      <!-- Quick Category Dots -->
      <div class="category-dots">
        <div
          v-for="cat in NOTE_CATEGORIES"
          :key="cat.id"
          v-show="cat.id !== data.noteCategory"
          class="category-dot"
          :style="{ backgroundColor: cat.color }"
          @click.stop="setCategory(cat)"
        >
          <v-tooltip activator="parent" location="top">{{ cat.name }}</v-tooltip>
        </div>
      </div>

      <v-btn
        icon="mdi-cog"
        size="x-small"
        variant="text"
        density="compact"
        :style="{ color: data.textColor || '#ffffff' }"
        @click.stop="$emit('open-settings')"
      >
        <v-icon size="14" />
        <v-tooltip activator="parent" location="top">Note Settings</v-tooltip>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { DmScreenItem } from '@/types/dmScreen.types'
import { NOTE_CATEGORIES } from '@/types/dmScreen.types'

const props = defineProps<{
  item: DmScreenItem
}>()

const emit = defineEmits<{
  'update:text': [text: string]
  'update:data': [data: Record<string, any>]
  'open-settings': []
}>()

const data = computed(() => props.item.data)

const isEditing = ref(false)
const localText = ref(data.value.text || '')
const localTitle = ref(data.value.title || '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Determine category from data
const category = computed(() => {
  if (!data.value.noteCategory) return null
  return NOTE_CATEGORIES.find(c => c.id === data.value.noteCategory) || null
})

// Check if background is set
const hasBackground = computed(() => {
  return !!data.value.backgroundColor && (data.value.backgroundOpacity ?? 0) > 0
})

// Container styling
const containerStyle = computed(() => {
  const bg = data.value.backgroundColor || 'transparent'
  const opacity = data.value.backgroundOpacity ?? 0
  const radius = data.value.borderRadius ?? 8

  // Parse hex to rgb for rgba
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 }
  }

  const rgb = hexToRgb(bg)

  return {
    '--note-bg': `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
    '--note-radius': `${radius}px`,
    '--note-text-color': data.value.textColor || '#ffffff',
    borderRadius: `${radius}px`,
    background: hasBackground.value ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : 'transparent',
  }
})

// Text styling
const textStyle = computed(() => ({
  fontSize: `${data.value.fontSize || 14}px`,
  fontWeight: data.value.fontWeight || 'normal',
  color: data.value.textColor || '#ffffff',
  textAlign: (data.value.textAlign || 'left') as 'left' | 'center' | 'right',
}))

// Simple markdown renderer (no external deps)
const renderedMarkdown = computed(() => {
  const text = data.value.text || ''
  return simpleMarkdown(text)
})

function simpleMarkdown(text: string): string {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headers (must be at start of line)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>')

  // Process list blocks BEFORE converting newlines to <br>
  // Match consecutive lines starting with '- '
  html = html.replace(/(^- .+$\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      let content = line.replace(/^- /, '')
      
      // Checkboxes [x] or [ ]
      if (content.startsWith('[x] ') || content.startsWith('[X] ')) {
        content = `<span class="chkbox checked">&#9745;</span> ` + content.substring(4)
      } else if (content.startsWith('[ ] ')) {
        content = `<span class="chkbox unchecked">&#9744;</span> ` + content.substring(4)
      }
      return `<li>${content}</li>`
    }).join('')
    return `<ul>${items}</ul>`
  })

  // Basic Tables
  // Find lines with |
  const tableRegex = /((?:\|.+\|\n)+)/g
  html = html.replace(tableRegex, (match) => {
    const rows = match.trim().split('\n')
    let tableHtml = '<div class="table-container"><table>'
    let isHeader = true

    rows.forEach(row => {
      // Skip separator rows like |---|---|
      if (row.match(/^\|[-\s:|]+\|$/)) {
        isHeader = false
        return
      }

      const cells = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim())
      tableHtml += '<tr>'
      cells.forEach(cell => {
        tableHtml += isHeader ? `<th>${cell}</th>` : `<td>${cell}</td>`
      })
      tableHtml += '</tr>'
      if (isHeader) isHeader = false // fallback if no separator
    })
    tableHtml += '</table></div>'
    return tableHtml
  })

  // Inline formatting
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')

  // Line breaks (but not inside block elements)
  html = html.replace(/\n/g, '<br>')

  // Clean up extra <br> around block elements
  html = html.replace(/<br><(ul|ol|h[1-3]|hr|div class="table-container")/g, '<$1')
  html = html.replace(/<\/(ul|ol|h[1-3]|div)><br>/g, '</$1>')

  return html
}

// Watch for external changes
watch(() => data.value.text, (newText) => {
  if (!isEditing.value) {
    localText.value = newText || ''
  }
}, { immediate: true })

watch(() => data.value.title, (newTitle) => {
  if (!isEditing.value) {
    localTitle.value = newTitle || ''
  }
}, { immediate: true })

function setCategory(cat: any) {
  if (cat.id === 'custom') {
    emit('update:data', { noteCategory: undefined, categoryColor: undefined })
  } else {
    emit('update:data', { noteCategory: cat.id, categoryColor: cat.color })
  }
}

function handleBlur(e: FocusEvent) {
  const target = e.relatedTarget as HTMLElement
  if (target && (target.classList.contains('title-editor') || target.classList.contains('text-editor'))) {
    return
  }
  finishEditing()
}

function startEditing() {
  isEditing.value = true
  localText.value = data.value.text || ''
  localTitle.value = data.value.title || ''
  nextTick(() => {
    textareaRef.value?.focus()
    // Intentionally omitting .select() per user request
  })
}

function finishEditing() {
  if (isEditing.value) {
    emit('update:text', localText.value)
    if (localTitle.value !== data.value.title) {
      emit('update:data', { title: localTitle.value })
    }
    isEditing.value = false
  }
}

function cancelEditing() {
  localText.value = data.value.text || ''
  localTitle.value = data.value.title || ''
  isEditing.value = false
}
</script>

<style scoped>
.text-node-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: border-color 0.2s ease;
}

.text-node-container:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.text-node-container.has-background {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}



/* Category header */
.note-category-header {
  display: flex;
  align-items: center;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #fff;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.note-category-header:hover {
  filter: brightness(1.15);
}

.category-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}



/* Body */
.note-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.note-body::-webkit-scrollbar {
  width: 3px;
}

.note-body::-webkit-scrollbar-track {
  background: transparent;
}

.note-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

/* Optional title format */
.note-title-header {
  padding: 8px 10px 4px 10px;
  font-size: 16px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
}

/* Text content */
.text-content {
  width: 100%;
  height: 100%;
  padding: 8px 10px;
  cursor: text;
  user-select: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
}

/* Markdown styles */
.markdown-content {
  line-height: 1.5;
}

.markdown-content :deep(h1) {
  font-size: 1.3em;
  font-weight: 700;
  margin: 0 0 0.3em;
  line-height: 1.2;
}

.markdown-content :deep(h2) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 0 0 0.3em;
  line-height: 1.2;
}

.markdown-content :deep(h3) {
  font-size: 1.05em;
  font-weight: 600;
  margin: 0 0 0.2em;
  line-height: 1.2;
}

.markdown-content :deep(strong) {
  font-weight: 700;
}

.markdown-content :deep(code) {
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Fira Code', 'Consolas', monospace;
}

.markdown-content :deep(ul) {
  padding-left: 1.2em;
  margin: 0.2em 0;
}

.markdown-content :deep(li) {
  margin-bottom: 0.15em;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  margin: 0.5em 0;
}

.markdown-content :deep(del) {
  opacity: 0.5;
}

/* Text editor */
.text-editor {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(99, 102, 241, 0.6);
  border-radius: 4px;
  padding: 8px 10px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
}

.text-editor:focus {
  border-color: rgba(99, 102, 241, 0.9);
  background: rgba(0, 0, 0, 0.35);
}

.title-editor {
  width: 100%;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(99, 102, 241, 0.6);
  border-radius: 4px;
  padding: 4px 6px;
  outline: none;
  color: inherit;
  font-weight: inherit;
  font-family: inherit;
  font-size: inherit;
}

.title-editor:focus {
  border-color: rgba(99, 102, 241, 0.9);
  background: rgba(0, 0, 0, 0.35);
}

/* Checkboxes */
.chkbox {
  display: inline-block;
  font-size: 1.1em;
  line-height: 1;
  vertical-align: middle;
  margin-right: 4px;
}
.chkbox.checked { color: #4ade80; }
.chkbox.unchecked { color: #94a3b8; }

/* Markdown Tables */
.table-container {
  overflow-x: auto;
  margin: 0.5em 0;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.15);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 6px 10px;
}

.markdown-content :deep(th) {
  font-weight: 600;
  background: rgba(0, 0, 0, 0.25);
  text-align: left;
}

/* Hover actions */
.note-actions {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 5;
}

.text-node-container:hover .note-actions {
  opacity: 1;
}

.toolbar-btn {
  background: rgba(30, 30, 40, 0.6) !important;
  backdrop-filter: blur(4px);
}

.toolbar-btn:hover {
  background: rgba(30, 30, 40, 0.9) !important;
}

.category-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-right: 4px;
}

.category-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.category-dot:hover {
  transform: scale(1.3);
  border-color: #fff;
}
</style>
