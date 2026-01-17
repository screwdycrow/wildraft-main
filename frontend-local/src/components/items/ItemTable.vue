<template>
  <div class="item-table-container" ref="containerRef">
    <!-- Grouped Table View -->
    <template v-if="groupBy !== 'none' && groupedItems.length > 0">
      <div 
        v-for="group in groupedItems" 
        :key="group.name" 
        class="item-group mb-6"
      >
        <!-- Group Header -->
        <div 
          class="group-header d-flex align-center gap-3 mb-3 cursor-pointer"
          @click="toggleGroup(group.name)"
        >
          <v-icon 
            :icon="isGroupCollapsed(group.name) ? 'mdi-chevron-right' : 'mdi-chevron-down'" 
            size="24"
          />
          <div class="d-flex align-center gap-2 flex-grow-1">
            <v-chip
              v-if="group.color"
              :color="group.color"
              size="small"
              variant="tonal"
            >
              <v-icon v-if="groupBy === 'tagFolder'" icon="mdi-folder" size="16" class="mr-1" />
              <v-icon v-else icon="mdi-tag" size="16" class="mr-1" />
              {{ group.name }}
            </v-chip>
            <span v-else class="text-h6 font-weight-medium">{{ group.name }}</span>
            <span class="text-caption text-grey ml-2">({{ group.items.length }} items)</span>
          </div>
        </div>

        <!-- Group Table -->
        <v-expand-transition>
          <div v-show="!isGroupCollapsed(group.name)">
            <v-data-table
              :headers="computedHeaders"
              :items="group.items"
              :items-per-page="-1"
              :item-value="item => item.id"
              class="glass-card item-table group-table"
              density="comfortable"
              hover
              hide-default-footer
              @click:row="handleTableRowClick"
            >
              <template #item.select="{ item }">
                <v-checkbox-btn
                  :model-value="selectedItems.has(item.id)"
                  @update:model-value="toggleSelection(item)"
                  @click.stop
                />
              </template>
              
              <template #item.name="{ item }">
                <div class="d-flex align-center gap-3">
                  <v-avatar
                    v-if="item.featuredImage"
                    size="40"
                    rounded="lg"
                    style="margin-right: 12px;"
                  >
                    <v-img :src="getImageUrl(item)" :alt="item.name" cover />
                  </v-avatar>
                  <v-avatar
                    v-else
                    size="40"
                    rounded="lg"
                    :color="getItemColor(item)"
                    style="margin-right: 12px;"
                  >
                    <v-icon :icon="getItemIcon(item)" size="20" />
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium text-body-2">{{ item.name }}</div>
                    <div
                      v-if="item.description"
                      class="text-caption text-grey text-truncate"
                      style="max-width: 200px"
                    >
                      {{ truncateText(item.description, 40) }}
                    </div>
                  </div>
                </div>
              </template>
              
              <template #item.itemType="{ item }">
                <v-chip :color="getItemColor(item)" size="small" variant="tonal">
                  {{ getItemLabel(item) }}
                </v-chip>
              </template>
              
              <template
                v-for="col in typeSpecificColumns"
                :key="`data_${col.key}`"
                #[`item.data_${col.key}`]="{ item }"
              >
                <span v-if="col.format" class="text-body-2">
                  {{ col.format(getDataValue(item, col), item) }}
                </span>
                <v-chip
                  v-else-if="col.type === 'chip' && getDataValue(item, col)"
                  size="small"
                  :color="typeof col.chipColor === 'function' ? col.chipColor(getDataValue(item, col), item) : col.chipColor"
                  variant="tonal"
                >
                  {{ getDataValue(item, col) }}
                </v-chip>
                <v-icon
                  v-else-if="col.type === 'boolean'"
                  :icon="getDataValue(item, col) ? 'mdi-check-circle' : 'mdi-circle-outline'"
                  :color="getDataValue(item, col) ? 'success' : 'grey'"
                  size="small"
                />
                <span
                  v-else-if="col.type === 'number'"
                  class="text-body-2 font-weight-medium"
                >
                  {{ getDataValue(item, col) ?? '-' }}
                </span>
                <div v-else-if="col.type === 'chips' && Array.isArray(getDataValue(item, col)) && getDataValue(item, col).length > 0" class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="(chip, idx) in (getDataValue(item, col) as any[]).slice(0, 3)"
                    :key="idx"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ chip }}
                  </v-chip>
                </div>
                <span v-else class="text-body-2">
                  {{ getDataValue(item, col) ?? '-' }}
                </span>
              </template>
              
              <template #item.tags="{ item }">
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="tag in (item.tags || []).slice(0, 2)"
                    :key="tag.id"
                    size="x-small"
                    :color="tag.color"
                    variant="tonal"
                  >
                    {{ tag.name }}
                  </v-chip>
                  <v-chip
                    v-if="(item.tags || []).length > 2"
                    size="x-small"
                    variant="outlined"
                  >
                    +{{ (item.tags || []).length - 2 }}
                  </v-chip>
                </div>
              </template>
              
              <template #item.updatedAt="{ item }">
                <span class="text-caption text-grey">{{ formatDate(item.updatedAt) }}</span>
              </template>
              
              <template #item.actions="{ item }">
                <div class="d-flex align-center justify-end gap-1 position-relative" @click.stop>
                  <v-btn
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    color="info"
                    @click.stop="emit('view', item)"
                  />
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    @click.stop="emit('edit', item)"
                  />
                  <v-menu location="bottom end" offset="8">
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        icon="mdi-dots-vertical"
                        size="small"
                        variant="text"
                        color="default"
                        @click.stop
                      />
                    </template>
                    <v-list density="compact">
                      <v-list-item
                        prepend-icon="mdi-tag-plus"
                        title="Add Tags"
                        @click.stop="handleAddTags(item)"
                      />
                      <v-divider class="my-1" />
                      <v-list-item
                        v-if="canSendToPortal(item)"
                        prepend-icon="mdi-television"
                        title="Send to Portal"
                        :disabled="isSendingToPortal === item.id"
                        @click.stop="handleSendToPortal(item)"
                      />
                      <v-list-item
                        v-if="canShowOnTop(item)"
                        prepend-icon="mdi-television-play"
                        title="Show on Top"
                        @click.stop="handleShowOnTop(item)"
                      />
                      <v-list-item
                        v-if="canPinToDmScreen()"
                        prepend-icon="mdi-pin"
                        title="Pin to Active DM Screen"
                        @click.stop="handlePinToDmScreen(item)"
                      />
                      <v-list-item
                        v-if="canAddToCombat()"
                        prepend-icon="mdi-sword-cross"
                        title="Add to Active Combat"
                        @click.stop="handleAddToCombat(item)"
                      />
                      <v-divider class="my-1" />
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete"
                        class="text-error"
                        @click.stop="emit('delete', item)"
                      />
                    </v-list>
                  </v-menu>
                </div>
              </template>
            </v-data-table>
          </div>
        </v-expand-transition>
      </div>
    </template>

    <!-- Flat Table View (no grouping) -->
    <v-data-table-virtual
      v-else
      :headers="computedHeaders"
      :items="items"
      :height="tableHeight"
      :item-value="item => item.id"
      class="glass-card item-table"
      fixed-header
      hover
      density="comfortable"
      @click:row="handleTableRowClick"
    >
      <template #item.select="{ item }">
        <v-checkbox-btn
          :model-value="selectedItems.has(item.id)"
          @update:model-value="toggleSelection(item)"
          @click.stop
        />
      </template>
      
      <template #item.name="{ item }">
        <div class="d-flex align-center gap-3">
          <v-avatar
            v-if="item.featuredImage"
            size="40"
            rounded="lg"
            style="margin-right: 12px;"
          >
            <v-img :src="getImageUrl(item)" :alt="item.name" cover />
          </v-avatar>
          <v-avatar
            v-else
            size="40"
            rounded="lg"
            :color="getItemColor(item)"
            style="margin-right: 12px;"
          >
            <v-icon :icon="getItemIcon(item)" size="20" />
          </v-avatar>
          <div>
            <div class="font-weight-medium text-body-2">{{ item.name }}</div>
            <div
              v-if="item.description"
              class="text-caption text-grey text-truncate"
              style="max-width: 200px"
            >
              {{ truncateText(item.description, 40) }}
            </div>
          </div>
        </div>
      </template>
      
      <template #item.itemType="{ item }">
        <v-chip :color="getItemColor(item)" size="small" variant="tonal">
          {{ getItemLabel(item) }}
        </v-chip>
      </template>
      
      <template
        v-for="col in typeSpecificColumns"
        :key="`data_${col.key}`"
        #[`item.data_${col.key}`]="{ item }"
      >
        <span v-if="col.format" class="text-body-2">
          {{ col.format(getDataValue(item, col), item) }}
        </span>
        <v-chip
          v-else-if="col.type === 'chip' && getDataValue(item, col)"
          size="small"
          :color="typeof col.chipColor === 'function' ? col.chipColor(getDataValue(item, col), item) : col.chipColor"
          variant="tonal"
        >
          {{ getDataValue(item, col) }}
        </v-chip>
        <v-icon
          v-else-if="col.type === 'boolean'"
          :icon="getDataValue(item, col) ? 'mdi-check-circle' : 'mdi-circle-outline'"
          :color="getDataValue(item, col) ? 'success' : 'grey'"
          size="small"
        />
        <span
          v-else-if="col.type === 'number'"
          class="text-body-2 font-weight-medium"
        >
          {{ getDataValue(item, col) ?? '-' }}
        </span>
        <div v-else-if="col.type === 'chips' && Array.isArray(getDataValue(item, col)) && getDataValue(item, col).length > 0" class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="(chip, idx) in (getDataValue(item, col) as any[]).slice(0, 3)"
            :key="idx"
            size="x-small"
            variant="tonal"
          >
            {{ chip }}
          </v-chip>
        </div>
        <span v-else class="text-body-2">
          {{ getDataValue(item, col) ?? '-' }}
        </span>
      </template>
      
      <template #item.tags="{ item }">
        <div class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="tag in (item.tags || []).slice(0, 2)"
            :key="tag.id"
            size="x-small"
            :color="tag.color"
            variant="tonal"
          >
            {{ tag.name }}
          </v-chip>
          <v-chip
            v-if="(item.tags || []).length > 2"
            size="x-small"
            variant="outlined"
          >
            +{{ (item.tags || []).length - 2 }}
          </v-chip>
        </div>
      </template>
      
      <template #item.updatedAt="{ item }">
        <span class="text-caption text-grey">{{ formatDate(item.updatedAt) }}</span>
      </template>
      
      <template #item.actions="{ item }">
        <div class="d-flex align-center justify-end gap-1 position-relative" @click.stop>
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            color="info"
            @click.stop="emit('view', item)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click.stop="emit('edit', item)"
          />
          <v-menu location="bottom end" offset="8">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                color="default"
                @click.stop
              />
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-tag-plus"
                title="Add Tags"
                @click.stop="handleAddTags(item)"
              />
              <v-divider class="my-1" />
              <v-list-item
                v-if="canSendToPortal(item)"
                prepend-icon="mdi-television"
                title="Send to Portal"
                :disabled="isSendingToPortal === item.id"
                @click.stop="handleSendToPortal(item)"
              />
              <v-list-item
                v-if="canShowOnTop(item)"
                prepend-icon="mdi-television-play"
                title="Show on Top"
                @click.stop="handleShowOnTop(item)"
              />
              <v-list-item
                v-if="canPinToDmScreen()"
                prepend-icon="mdi-pin"
                title="Pin to Active DM Screen"
                @click.stop="handlePinToDmScreen(item)"
              />
              <v-list-item
                v-if="canAddToCombat()"
                prepend-icon="mdi-sword-cross"
                title="Add to Active Combat"
                @click.stop="handleAddToCombat(item)"
              />
              <v-divider class="my-1" />
              <v-list-item
                prepend-icon="mdi-delete"
                title="Delete"
                class="text-error"
                @click.stop="emit('delete', item)"
              />
            </v-list>
          </v-menu>
        </div>
      </template>

      <!-- Empty state -->
      <template #no-data>
        <div class="pa-8 text-center">
          <v-icon :icon="emptyIcon" size="64" :color="emptyIconColor" class="mb-4" />
          <p class="text-h6 mb-2">{{ emptyTitle }}</p>
          <p class="text-body-2 text-grey">{{ emptyMessage }}</p>
        </div>
      </template>
    </v-data-table-virtual>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { LibraryItem, ItemType } from '@/types/item.types'
import type { GroupBy } from '@/composables/useViewPreferences'
import { useItemComponents, type TableColumnDefinition } from '@/composables/useItemComponents'
import { useFilesStore } from '@/stores/files'
import { useDialogsStore } from '@/stores/dialogs'
import { useTagsStore } from '@/stores/tags'
import { usePortalViewsStore } from '@/stores/portalViews'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useCombat } from '@/composables/useCombat'
import { usePortalSocket } from '@/composables/usePortalSocket'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow } from 'date-fns'
import { VChip, VIcon, VAvatar, VImg, VBtn, VCheckboxBtn, VList, VListItem, VDivider } from 'vuetify/components'

interface ItemGroup {
  name: string
  color?: string
  items: LibraryItem[]
}

interface Props {
  items: LibraryItem[]
  selectedItems?: Set<number>
  libraryId?: number
  showSelection?: boolean
  emptyIcon?: string
  emptyIconColor?: string
  emptyTitle?: string
  emptyMessage?: string
  itemType?: ItemType | null // If set, uses type-specific columns
  groupBy?: GroupBy
  collapsedGroups?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedItems: () => new Set(),
  showSelection: false,
  emptyIcon: 'mdi-bookshelf',
  emptyIconColor: 'primary',
  emptyTitle: 'No Items',
  emptyMessage: 'No items to display.',
  itemType: null,
  groupBy: 'none',
  collapsedGroups: () => [],
})

const emit = defineEmits<{
  view: [item: LibraryItem]
  edit: [item: LibraryItem]
  delete: [item: LibraryItem]
  select: [item: LibraryItem, ctrlKey: boolean, metaKey: boolean]
  'update:collapsedGroups': [groups: string[]]
}>()

const { getItemTypeInfo, getTableColumns, getMixedTableColumns } = useItemComponents()
const filesStore = useFilesStore()
const dialogsStore = useDialogsStore()
const tagsStore = useTagsStore()
const portalViewsStore = usePortalViewsStore()
const dmScreensStore = useDmScreensStore()
const { addToActiveEncounter, activeEncounter } = useCombat()
const { sendPortalViewUpdate } = usePortalSocket()
const toast = useToast()

const containerRef = ref<HTMLElement>()
const tableHeight = ref(600)

// Image URL cache
const imageUrlCache = ref<Map<number, string>>(new Map())

// Menu state is now handled by VMenu component

// Local collapsed groups state
const localCollapsedGroups = ref<Set<string>>(new Set(props.collapsedGroups))

// Get columns based on item type or mixed content
const typeSpecificColumns = computed<TableColumnDefinition[]>(() => {
  if (props.itemType) {
    return getTableColumns(props.itemType)
  }
  // For mixed content, determine if all items are same type
  if (props.items.length > 0) {
    const firstType = props.items[0].type
    const allSameType = props.items.every(item => item.type === firstType)
    if (allSameType) {
      return getTableColumns(firstType)
    }
  }
  return getMixedTableColumns()
})

// Whether to show type column (only for mixed content)
const showTypeColumn = computed(() => {
  if (props.itemType) return false
  if (props.items.length === 0) return true
  const firstType = props.items[0].type
  return !props.items.every(item => item.type === firstType)
})

// Computed table headers
const computedHeaders = computed(() => {
  const headers: any[] = []
  
  // Selection checkbox
  if (props.showSelection) {
    headers.push({
      key: 'select',
      title: '',
      width: 50,
      sortable: false,
    })
  }
  
  // Name column (always first)
  headers.push({
    key: 'name',
    title: 'Name',
    minWidth: 250,
    sortable: true,
  })
  
  // Type column (only for mixed content)
  if (showTypeColumn.value) {
    headers.push({
      key: 'itemType',
      title: 'Type',
      width: 130,
      sortable: true,
    })
  }
  
  // Type-specific columns
  typeSpecificColumns.value.forEach(col => {
    headers.push({
      key: `data_${col.key}`,
      title: col.title,
      width: col.width,
      minWidth: col.minWidth,
      sortable: col.sortable !== false,
      align: col.align || 'start',
    })
  })
  
  // Tags column
  headers.push({
    key: 'tags',
    title: 'Tags',
    minWidth: 180,
    sortable: false,
  })
  
  // Updated date column
  headers.push({
    key: 'updatedAt',
    title: 'Updated',
    width: 130,
    sortable: true,
  })
  
  // Actions column (always last)
  headers.push({
    key: 'actions',
    title: '',
    width: 110,
    sortable: false,
    align: 'end',
  })
  
  return headers
})

// Menu is now handled by VMenu component


// Group items by tag or tag folder
const groupedItems = computed<ItemGroup[]>(() => {
  if (props.groupBy === 'none') return []
  
  const groups: Map<string, ItemGroup> = new Map()
  
  props.items.forEach(item => {
    if (props.groupBy === 'tag') {
      const itemTags = item.tags || []
      if (itemTags.length === 0) {
        if (!groups.has('Untagged')) {
          groups.set('Untagged', { name: 'Untagged', items: [] })
        }
        groups.get('Untagged')!.items.push(item)
      } else {
        itemTags.forEach(tag => {
          if (!groups.has(tag.name)) {
            groups.set(tag.name, { name: tag.name, color: tag.color, items: [] })
          }
          groups.get(tag.name)!.items.push(item)
        })
      }
    } else if (props.groupBy === 'tagFolder') {
      const itemTags = item.tags || []
      const folders = new Set<string>()
      
      itemTags.forEach(tag => {
        const fullTag = tagsStore.getTagById(tag.id)
        const folder = fullTag?.folder || 'Uncategorized'
        folders.add(folder)
      })
      
      if (folders.size === 0) {
        folders.add('Uncategorized')
      }
      
      folders.forEach(folder => {
        if (!groups.has(folder)) {
          groups.set(folder, { name: folder, items: [] })
        }
        const existingIds = new Set(groups.get(folder)!.items.map(i => i.id))
        if (!existingIds.has(item.id)) {
          groups.get(folder)!.items.push(item)
        }
      })
    }
  })
  
  return Array.from(groups.values()).sort((a, b) => {
    if (a.name === 'Untagged' || a.name === 'Uncategorized') return 1
    if (b.name === 'Untagged' || b.name === 'Uncategorized') return -1
    return a.name.localeCompare(b.name)
  })
})

// Toggle group collapsed state
const toggleGroup = (groupName: string) => {
  if (localCollapsedGroups.value.has(groupName)) {
    localCollapsedGroups.value.delete(groupName)
  } else {
    localCollapsedGroups.value.add(groupName)
  }
  emit('update:collapsedGroups', Array.from(localCollapsedGroups.value))
}

const isGroupCollapsed = (groupName: string) => {
  return localCollapsedGroups.value.has(groupName)
}

// Get item display info
const getItemIcon = (item: LibraryItem) => {
  const info = getItemTypeInfo(item.type)
  return info.icon
}

const getItemColor = (item: LibraryItem) => {
  const info = getItemTypeInfo(item.type)
  return info.color
}

const getItemLabel = (item: LibraryItem) => {
  const info = getItemTypeInfo(item.type)
  return info.label
}

// Get data value from item
const getDataValue = (item: LibraryItem, column: TableColumnDefinition): any => {
  if (column.dataPath) {
    return item.data?.[column.dataPath]
  }
  return item.data?.[column.key]
}

// Get image URL
const getImageUrl = (item: LibraryItem): string => {
  if (!item.featuredImage) return ''
  
  const cached = imageUrlCache.value.get(item.featuredImage.id)
  if (cached) return cached
  
  filesStore.getDownloadUrl(item.featuredImage.id).then(url => {
    imageUrlCache.value.set(item.featuredImage!.id, url)
  })
  
  return ''
}

// Truncate text
const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Format date
const formatDate = (date: string) => {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return date
  }
}

// Handle row click
const handleRowClick = (event: MouseEvent, item: LibraryItem) => {
  if (event.ctrlKey || event.metaKey) {
    emit('select', item, event.ctrlKey, event.metaKey)
  } else if (props.libraryId) {
    dialogsStore.openItemViewer(item, props.libraryId)
  } else {
    emit('view', item)
  }
}

// Handle table row click (for v-data-table)
const handleTableRowClick = (event: MouseEvent, { item }: { item: LibraryItem }) => {
  handleRowClick(event, item)
}

// Toggle selection
const toggleSelection = (item: LibraryItem) => {
  emit('select', item, true, false)
}

// Action handlers
const hasFeaturedImage = (item: LibraryItem) => !!item.featuredImage
const canSendToPortal = (item: LibraryItem) => hasFeaturedImage(item) && !!portalViewsStore.activePortal
const canShowOnTop = (item: LibraryItem) => hasFeaturedImage(item) && !!portalViewsStore.activePortal
const canPinToDmScreen = () => !!dmScreensStore.activeDmScreen
const canAddToCombat = () => !!activeEncounter.value

const isSendingToPortal = ref<number | null>(null)

async function handleSendToPortal(item: LibraryItem) {
  if (!item.featuredImage) {
    toast.warning('No featured image to send')
    return
  }

  isSendingToPortal.value = item.id
  try {
    await portalViewsStore.addItemToActivePortal(item.featuredImage as any, true)
    toast.success(`Sent "${item.featuredImage.fileName}" to portal and set as current`)
  } catch (error: any) {
    console.error('[ItemTable] Failed to send to portal:', error)
    toast.error(error.message || 'Failed to send to portal')
  } finally {
    isSendingToPortal.value = null
  }
}

function handleShowOnTop(item: LibraryItem) {
  if (!item.featuredImage) {
    toast.warning('No featured image to show')
    return
  }

  sendPortalViewUpdate({
    command: 'show-on-top',
    userFile: item.featuredImage as any,
  })
  
  toast.success(`Showing "${item.featuredImage.fileName}" on portal`)
}

async function handlePinToDmScreen(item: LibraryItem) {
  if (!dmScreensStore.activeDmScreen) {
    toast.warning('No active DM screen')
    return
  }

  try {
    // Get featured image URL if available
    let featuredImageUrl: string | null = null
    if (item.featuredImage) {
      featuredImageUrl = await filesStore.getDownloadUrl(item.featuredImage.id)
    }

    // Convert library item to DM screen item
    const dmScreenItem = dmScreensStore.convertLibraryItemToDmScreenItem(
      item,
      featuredImageUrl
    )

    // Add to active DM screen
    const currentItems = dmScreensStore.activeDmScreen.items || []
    const updatedItems = [...currentItems, dmScreenItem]

    await dmScreensStore.updateDmScreen(
      dmScreensStore.activeDmScreen.libraryId,
      dmScreensStore.activeDmScreen.id,
      { items: updatedItems }
    )

    toast.success(`"${item.name}" pinned to DM screen`)
  } catch (error: any) {
    console.error('[ItemTable] Failed to pin to DM screen:', error)
    toast.error(error.message || 'Failed to pin to DM screen')
  }
}

async function handleAddToCombat(item: LibraryItem) {
  if (!activeEncounter.value) {
    toast.warning('No active combat encounter')
    return
  }

  try {
    await addToActiveEncounter(item)
    toast.success(`${item.name} added to combat!`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to add to combat')
  }
}

function handleAddTags(item: LibraryItem) {
  // Open tag editor dialog - this would need to be implemented
  // For now, we'll emit an event that the parent can handle
  emit('edit', item)
}

// Removed renderCell - now using template slots instead

// Update table height based on container
const updateTableHeight = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    const availableHeight = window.innerHeight - rect.top - 32
    tableHeight.value = Math.max(400, availableHeight)
  }
}

onMounted(() => {
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.item-table-container {
  width: 100%;
}

.item-table {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.6) !important;
  backdrop-filter: blur(10px);
}

.item-table :deep(.v-data-table-header) {
  background: rgba(var(--v-theme-surface-variant), 0.4) !important;
}

.item-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.item-table :deep(.v-data-table__tr) {
  transition: background-color 0.15s ease;
}

.item-table :deep(.v-data-table__tr:hover) {
  background: rgba(var(--v-theme-primary), 0.08) !important;
  cursor: pointer;
}

.item-table :deep(.v-data-table__tr:nth-child(even)) {
  background: rgba(var(--v-theme-surface-variant), 0.15);
}

.item-table :deep(.v-data-table__tr:nth-child(even):hover) {
  background: rgba(var(--v-theme-primary), 0.08) !important;
}

.item-table :deep(.v-data-table__td) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06) !important;
  padding-top: 12px !important;
  padding-bottom: 12px !important;
}

/* Group styles */
.item-group {
  width: 100%;
}

.group-header {
  padding: 10px 16px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 10px;
  transition: all 0.2s ease;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.group-header:hover {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-color: rgba(var(--v-theme-primary), 0.2);
}

.cursor-pointer {
  cursor: pointer;
}

.group-table {
  margin-left: 24px;
  margin-right: 8px;
}

.group-table :deep(.v-data-table__th) {
  background: rgba(var(--v-theme-surface-variant), 0.3) !important;
}

/* Better chip styles */
.item-table :deep(.v-chip) {
  font-weight: 500;
}

/* Scrollbar styling */
.item-table :deep(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

.item-table :deep(::-webkit-scrollbar-track) {
  background: rgba(var(--v-theme-surface-variant), 0.2);
  border-radius: 4px;
}

.item-table :deep(::-webkit-scrollbar-thumb) {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 4px;
}

.item-table :deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(var(--v-theme-on-surface), 0.3);
}

</style>
