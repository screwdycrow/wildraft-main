export interface Message {
  id: string
  username: string
  message: string
  datetime: Date
  replyingTo?: string // Message ID being replied to
  hideToOthers?: boolean // Private to sender eyes only
  showOnlyToRecipient?: string // Private message to specific user
}

export interface ChatStorage {
  messages: Message[]
  lastCleanup: number
}

