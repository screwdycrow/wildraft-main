// Node categories for Mindmap note nodes.
// Each category drives the node's icon and default accent color.

export interface MindmapCategory {
  id: string
  label: string
  icon: string
  color: string
}

export const MINDMAP_NOTE_CATEGORIES: MindmapCategory[] = [
  { id: 'idea', label: 'Idea', icon: 'mdi-lightbulb-on-outline', color: '#8E44AD' },
  { id: 'npc', label: 'NPC', icon: 'mdi-account-outline', color: '#3498DB' },
  { id: 'location', label: 'Location', icon: 'mdi-map-marker-outline', color: '#27AE60' },
  { id: 'loot', label: 'Loot', icon: 'mdi-treasure-chest-outline', color: '#F39C12' },
  { id: 'item', label: 'Item', icon: 'mdi-sword', color: '#E67E22' },
  { id: 'quest', label: 'Quest', icon: 'mdi-flag-outline', color: '#E74C3C' },
  { id: 'lore', label: 'Lore', icon: 'mdi-book-open-variant', color: '#16A085' },
  { id: 'monster', label: 'Monster', icon: 'mdi-emoticon-devil-outline', color: '#C0392B' },
  { id: 'plot', label: 'Plot Hook', icon: 'mdi-script-text-outline', color: '#9B59B6' },
]

export const DEFAULT_MINDMAP_CATEGORY = 'idea'

export function getMindmapCategory(id?: string): MindmapCategory {
  return (
    MINDMAP_NOTE_CATEGORIES.find((c) => c.id === id) ||
    MINDMAP_NOTE_CATEGORIES.find((c) => c.id === DEFAULT_MINDMAP_CATEGORY) ||
    MINDMAP_NOTE_CATEGORIES[0]
  )
}
