import { Node, mergeAttributes } from '@tiptap/core'

export interface FileAttachmentOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      /**
       * Insert a file attachment
       */
      setFileAttachment: (options: { fileId: number; fileName: string; fileType: string; fileUrl?: string }) => ReturnType
    }
  }
}

export const FileAttachment = Node.create<FileAttachmentOptions>({
  name: 'fileAttachment',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'inline',

  inline: true,

  selectable: false,

  atom: true,

  addAttributes() {
    return {
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
      fileName: {
        default: null,
        parseHTML: element => element.getAttribute('data-file-name'),
        renderHTML: attributes => {
          if (!attributes.fileName) {
            return {}
          }
          return {
            'data-file-name': String(attributes.fileName),
          }
        },
      },
      fileType: {
        default: null,
        parseHTML: element => element.getAttribute('data-file-type'),
        renderHTML: attributes => {
          if (!attributes.fileType) {
            return {}
          }
          return {
            'data-file-type': String(attributes.fileType),
          }
        },
      },
      fileUrl: {
        default: null,
        parseHTML: element => element.getAttribute('data-file-url'),
        renderHTML: attributes => {
          if (!attributes.fileUrl) {
            return {}
          }
          return {
            'data-file-url': String(attributes.fileUrl),
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="file-attachment"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'file-attachment',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setFileAttachment:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})

