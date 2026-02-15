<template>
    <div class="dm-screen-node-display" @dblclick="handleDoubleClick">
        <!-- Header -->
        <div class="dm-screen-node-header">
            <v-icon icon="mdi-monitor-dashboard" size="small" class="mr-2" />
            <span class="dm-screen-node-title">{{ screenName }}</span>
        </div>

        <!-- Content Preview -->
        <div class="dm-screen-node-body">
            <div v-if="isLoading" class="dm-screen-node-loading">
                <v-progress-circular indeterminate size="24" color="primary" />
            </div>

            <div v-else-if="referencedScreen" class="dm-screen-node-preview">
                <!-- Token items preview -->
                <div v-if="tokenItems.length > 0" class="token-preview-grid">
                    <div v-for="token in tokenItems.slice(0, 6)" :key="token.id" class="token-preview-item">
                        <div class="token-preview-circle">
                            <img v-if="getTokenImage(token)" :src="getTokenImage(token)" class="token-preview-img"
                                :alt="getTokenLabel(token)" />
                            <v-icon v-else icon="mdi-account-circle" size="small" color="white" />
                        </div>
                        <span class="token-preview-label">{{ getTokenLabel(token) }}</span>
                    </div>
                    <div v-if="tokenItems.length > 6" class="token-preview-more">
                        +{{ tokenItems.length - 6 }} more
                    </div>
                </div>

                <!-- Item count -->
                <div class="dm-screen-node-info">
                    <v-icon icon="mdi-layers" size="x-small" class="mr-1" />
                    {{ itemCount }} item{{ itemCount !== 1 ? 's' : '' }}
                </div>
            </div>

            <div v-else class="dm-screen-node-empty">
                <v-icon icon="mdi-alert-circle-outline" size="24" color="warning" />
                <span class="text-caption mt-1">DM Screen not found</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { DmScreenItem, DmScreen } from '@/types/dmScreen.types'
import { useDmScreensStore } from '@/stores/dmScreens'
import { useItemsStore } from '@/stores/items'
import { useRouter } from 'vue-router'

interface Props {
    item: DmScreenItem
    libraryId: number
}

const props = defineProps<Props>()

const dmScreensStore = useDmScreensStore()
const itemsStore = useItemsStore()
const router = useRouter()

const isLoading = ref(false)
const referencedScreen = ref<DmScreen | null>(null)

// Computed
const screenName = computed(() => {
    return props.item.data.label || referencedScreen.value?.name || 'DM Screen'
})

const itemCount = computed(() => {
    return referencedScreen.value?.items?.length || 0
})

const tokenItems = computed(() => {
    if (!referencedScreen.value?.items) return []
    return referencedScreen.value.items.filter(
        (i: DmScreenItem) => i.type === 'TokenNode' || i.type === 'LibraryItemId'
    )
})

// Token helpers using items store
function getTokenLabel(dmItem: DmScreenItem): string {
    if (dmItem.data.tokenLabel) return dmItem.data.tokenLabel
    if (dmItem.data.id) {
        const item = itemsStore.getItemById(dmItem.data.id)
        if (item) return item.name
    }
    return 'Token'
}

function getTokenImage(dmItem: DmScreenItem): string | undefined {
    if (dmItem.data.tokenImageUrl) return dmItem.data.tokenImageUrl
    if (dmItem.data.id) {
        const item = itemsStore.getItemById(dmItem.data.id)
        if (item?.featuredImage?.downloadUrl) return item.featuredImage.downloadUrl
    }
    return undefined
}

// Load referenced DM screen
async function loadScreen() {
    const dmScreenId = props.item.data.dmScreenId
    if (!dmScreenId) return

    isLoading.value = true
    try {
        // Try cache first
        const cached = dmScreensStore.getDmScreenById(dmScreenId)
        if (cached) {
            referencedScreen.value = cached
        } else {
            // Fetch from API
            const screen = await dmScreensStore.fetchDmScreen(props.libraryId, dmScreenId)
            referencedScreen.value = screen
        }

        // Ensure items are loaded in the items store for token display
        if (referencedScreen.value?.items) {
            await itemsStore.fetchItems(props.libraryId)
        }
    } catch (error) {
        console.error('[DmScreenNodeDisplay] Failed to load DM screen:', error)
    } finally {
        isLoading.value = false
    }
}

function handleDoubleClick() {
    const dmScreenId = props.item.data.dmScreenId
    if (dmScreenId) {
        router.push({
            name: 'DmScreen',
            params: {
                id: props.libraryId,
                dmScreenId: dmScreenId,
            },
        })
    }
}

onMounted(() => {
    loadScreen()
})

watch(() => props.item.data.dmScreenId, () => {
    loadScreen()
})
</script>

<style scoped>
.dm-screen-node-display {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: rgba(20, 20, 35, 0.95);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(99, 102, 241, 0.3);
}

.dm-screen-node-display:hover {
    border-color: rgba(99, 102, 241, 0.6);
}

.dm-screen-node-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgba(99, 102, 241, 0.15);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    flex-shrink: 0;
}

.dm-screen-node-title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dm-screen-node-body {
    flex: 1;
    padding: 8px;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.dm-screen-node-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.dm-screen-node-preview {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 8px;
}

.token-preview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-start;
}

.token-preview-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
}

.token-preview-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(99, 102, 241, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

.token-preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.token-preview-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.7);
    max-width: 48px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
}

.token-preview-more {
    font-size: 10px;
    color: rgba(99, 102, 241, 0.8);
    padding: 4px 8px;
    align-self: center;
}

.dm-screen-node-info {
    display: flex;
    align-items: center;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: auto;
    padding-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.dm-screen-node-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: rgba(255, 255, 255, 0.5);
}
</style>
