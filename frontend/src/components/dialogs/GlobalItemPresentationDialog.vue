<template>
  <v-dialog
    v-model="dialogsStore.itemPresentationOpen"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
    class="presentation-dialog"
  >
    <v-card 
      v-if="item" 
      class="presentation-card fill-height"
      @mousemove="handleInteraction"
      @keydown="handleInteraction"
      tabindex="0"
    >
      <!-- Toolbar -->
      <v-toolbar density="compact" color="rgba(0,0,0,0.6)" class="presentation-toolbar blur-toolbar">
        <v-btn icon="mdi-close" @click="dialogsStore.closeItemPresentation()" />
        <v-toolbar-title class="text-h6 font-weight-light">
          <span class="opacity-60">{{ item.name }}</span>
          <v-chip v-if="!isAutoPlaying" size="x-small" color="warning" class="ml-4 px-2" label>
            <v-icon start size="x-small">{{ interactionCooldown > 0 ? 'mdi-timer-sand' : 'mdi-pause' }}</v-icon>
            {{ interactionCooldown > 0 ? `RESUMING IN ${interactionCooldown}s` : 'PAUSED' }}
          </v-chip>
        </v-toolbar-title>
        <v-spacer />
        <div class="px-6 text-button opacity-50">
          {{ Math.round(scrollProgress) }}%
        </div>
      </v-toolbar>

      <!-- Gigantic Vertical Scroll Container -->
      <div 
        ref="scrollContainer" 
        class="scroll-viewport"
        @scroll="updateScrollProgress"
      >
        <div class="scroll-content">
          <div 
            v-for="(section, i) in sections" 
            :key="i"
            :ref="el => sectionRefs[i] = el"
            v-intersect="{ handler: onIntersect, options: { threshold: 0.1 } }"
            :data-index="i"
            class="presentation-section"
            :class="[`section-${section.type}`, { 'first-section': i === 0, 'is-visible': visibleSections.has(i) }]"
          >
            <!-- Integrated Vertical Header Section -->
            <div v-if="section.type === 'integrated-header'" class="integrated-header-layout w-100 pa-12 text-center">
               <div class="mb-14 anim-fade-in" style="--delay: 0s">
                 <v-avatar v-if="item.featuredImage" size="240" class="mb-6 border-gold-glow elevation-24">
                   <v-img :src="featuredImageUrl" cover />
                 </v-avatar>
                 <div class="text-h1 font-weight-black mb-2 glow-text display-1">{{ item.name }}</div>
                 <div class="text-h4 font-weight-light opacity-60 text-uppercase letter-spacing-lg mb-4">
                   {{ section.subtitle }}
                 </div>
                 <v-chip-group class="justify-center">
                   <v-chip v-for="tag in item.tags" :key="tag.id" size="x-large" :color="tag.color" variant="flat" class="px-6">
                     {{ tag.name }}
                   </v-chip>
                 </v-chip-group>
               </div>

               <div class="ability-integrated-row mb-14">
                 <div 
                   v-for="(stat, idx) in section.stats" 
                   :key="stat.label" 
                   class="ability-card-integrated anim-staggered"
                   :style="{ '--delay': (0.2 + idx * 0.05) + 's' }"
                 >
                   <div class="ability-label-integrated color-primary">{{ stat.label }}</div>
                   <div class="ability-mod-integrated">
                     {{ stat.mod >= 0 ? '+' : '' }}{{ stat.mod }}
                   </div>
                   <div class="ability-score-integrated">({{ stat.score }})</div>
                 </div>
               </div>

               <div class="combat-integrated-row">
                 <div 
                   v-for="(point, idx) in section.combatData" 
                   :key="point.label" 
                   class="combat-item-integrated anim-staggered"
                   :style="{ '--delay': (0.6 + idx * 0.05) + 's' }"
                 >
                   <div class="combat-value-integrated">{{ point.value }}</div>
                   <div class="combat-label-integrated text-uppercase">{{ point.label }}</div>
                 </div>
               </div>
            </div>

            <div v-else class="section-container pa-12">
              <div class="slide-header mb-8" v-if="section.title">
                <h1 class="slide-title text-uppercase">{{ section.title }}</h1>
                <div class="title-underline"></div>
              </div>

              <!-- Notes Content -->
              <div v-if="section.type === 'note-content'" class="note-layout max-width-xl anim-fade-in" style="--delay: 0.1s">
                 <div class="text-h4 font-weight-regular line-height-relaxed note-text-content" v-html="section.content"></div>
              </div>

              <!-- Actions/Spells -->
              <div v-if="section.type === 'actions'" class="actions-slide-layout max-width-xxl w-100">
                <v-row class="ma-0">
                  <v-col 
                    v-for="(action, idx) in section.actions" 
                    :key="action.name" 
                    cols="12" md="6" 
                    class="pa-4 anim-staggered"
                    :style="{ '--delay': (0.1 + idx * 0.05) + 's' }"
                  >
                    <v-card variant="flat" class="action-card pa-8 glass-card">
                      <div class="d-flex justify-space-between align-center mb-6">
                        <h2 class="text-h4 font-weight-black text-primary">{{ action.name }}</h2>
                        <v-chip size="small" color="secondary" variant="flat" class="text-uppercase font-weight-bold">
                          {{ action.actionType }}
                        </v-chip>
                      </div>
                      <div class="d-flex flex-wrap gap-3 mb-6">
                        <div v-if="action.toHit" class="roll-badge hit-badge"><div class="badge-label">HIT</div><div class="badge-value">{{ action.toHit }}</div></div>
                        <div v-if="action.roll" class="roll-badge damage-badge"><div class="badge-label">ROLL</div><div class="badge-value">{{ action.roll }}</div></div>
                      </div>
                      <div class="action-description text-h5 opacity-80" v-html="action.description"></div>
                    </v-card>
                  </v-col>
                </v-row>
              </div>

              <!-- General Text -->
              <div v-if="section.type === 'text'" class="text-slide-layout max-width-lg">
                <div 
                  v-for="(block, idx) in section.blocks" 
                  :key="block.heading" 
                  class="mb-14 text-center anim-staggered"
                  :style="{ '--delay': (0.1 + idx * 0.05) + 's' }"
                >
                  <h2 class="text-h2 font-weight-black mb-6 text-primary">{{ block.heading }}</h2>
                  <div class="text-h4 line-height-relaxed opacity-90">{{ block.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vertical Navigation -->
      <div class="vertical-navigation">
        <v-btn icon="mdi-chevron-up" @click="scrollToPrev" />
        <v-btn icon="mdi-chevron-down" @click="scrollToNext" />
      </div>

      <!-- Horizontal Progress Bar -->
      <div class="progress-container">
        <v-progress-linear v-model="scrollProgress" color="primary" height="6" />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue'
import { useDialogsStore } from '@/stores/dialogs'
import { useFilesStore } from '@/stores/files'

const dialogsStore = useDialogsStore()
const filesStore = useFilesStore()
const featuredImageUrl = ref('')
const scrollContainer = ref<HTMLElement | null>(null)
const sectionRefs = ref<any[]>([])
const scrollProgress = ref(0)
const lastInteractionTime = ref(Date.now())
const interactionCooldown = ref(0)
const isAutoPlaying = ref(true)
const visibleSections = ref(new Set<number>())

let scrollAnimationFrame: number | null = null
let cooldownTimer: any = null
let boundaryPauseStartTime: number | null = null
const SCROLL_SPEED = 1.3 
const AUTO_RESUME_TIME = 1000 
const BOUNDARY_PAUSE_DURATION = 1500 // Reduced from 2000

const item = computed(() => dialogsStore.itemPresentationData?.item)

const sections = computed(() => {
  if (!item.value) return []
  const type = item.value.type
  const data = item.value.data || {}
  const result: any[] = []

  const parseCR = (cr: any): number => {
    if (!cr) return 0
    if (typeof cr === 'number') return cr
    if (typeof cr === 'string') {
      if (cr.includes('/')) {
        const [n, d] = cr.split('/').map(Number)
        return n && d ? n / d : 0
      }
      return parseFloat(cr) || 0
    }
    return 0
  }

  let subtitle = item.value.description
  if (type === 'CHARACTER_DND_5E') {
    subtitle = `${data.race || ''} ${data.class || ''} • Lev ${data.level || 1}`
  } else if (type === 'STAT_BLOCK_DND_5E') {
    subtitle = `${data.size || 'M'} ${data.type || 'Creature'} • ${data.alignment || 'N'}`
  }

  if (type === 'CHARACTER_DND_5E' || type === 'STAT_BLOCK_DND_5E') {
    const stats = [
      { label: 'STR', score: data.str || 10, mod: Math.floor(((data.str || 10) - 10) / 2) },
      { label: 'DEX', score: data.dex || 10, mod: Math.floor(((data.dex || 10) - 10) / 2) },
      { label: 'CON', score: data.con || 10, mod: Math.floor(((data.con || 10) - 10) / 2) },
      { label: 'INT', score: data.int || 10, mod: Math.floor(((data.int || 10) - 10) / 2) },
      { label: 'WIS', score: data.wis || 10, mod: Math.floor(((data.wis || 10) - 10) / 2) },
      { label: 'CHA', score: data.cha || 10, mod: Math.floor(((data.cha || 10) - 10) / 2) },
    ]
    const crVal = data.cr || data.stats?.cr || 0
    const prof = type === 'CHARACTER_DND_5E' 
      ? Math.floor(((data.level || 1) - 1) / 4) + 2
      : Math.floor((parseCR(crVal) - 1) / 4) + 2

    const combatItems = [
      { label: 'AC', value: data.ac || data.stats?.ac || 10 },
      { label: 'HP', value: data.hp || data.stats?.hp || 10 },
      { label: 'Speed', value: data.speed || data.stats?.speed || '30 ft' },
      { label: 'Prof', value: `+${prof}` }
    ]

    result.push({ 
      type: 'integrated-header', 
      subtitle, 
      stats, 
      combatData: combatItems 
    })
  } else {
    result.push({ type: 'header', title: 'Start', subtitle })
  }

  if (type === 'CHARACTER_DND_5E' || type === 'STAT_BLOCK_DND_5E') {
    const defenseBlocks = []
    if (data.immunities) defenseBlocks.push({ heading: 'Immunities', content: data.immunities, icon: 'mdi-shield-lock' })
    if (data.resistances) defenseBlocks.push({ heading: 'Resistances', content: data.resistances, icon: 'mdi-shield-check' })
    if (data.vulnerabilities) defenseBlocks.push({ heading: 'Vulnerabilities', content: data.vulnerabilities, icon: 'mdi-heart-broken' })
    if (defenseBlocks.length) {
      result.push({ type: 'text', title: 'Defenses', blocks: defenseBlocks })
    }
  }

  if (type === 'NOTE') {
    result.push({ type: 'note-content', title: 'General', content: data.content || 'Empty note content.' })
    if (data.chapters?.length) {
      data.chapters.sort((a: any, b: any) => a.order - b.order).forEach((ch: any) => {
        result.push({ type: 'note-content', title: ch.title, content: ch.content })
      })
    }
    return result 
  }

  if (type === 'CHARACTER_DND_5E' || type === 'STAT_BLOCK_DND_5E') {
    if (data.traits?.length) {
      result.push({ type: 'text', title: 'Traits', blocks: [{ heading: 'Features', content: data.traits.map((t: any) => t.name).join(', ') }] })
    }
    let allActions = [...(data.actions || [])]
    if (type === 'CHARACTER_DND_5E' && data.inventory) {
      data.inventory.forEach((item: any) => {
        if (item.equipped && item.actions) {
          allActions = [...allActions, ...item.actions.map((a: any) => ({ ...a, name: `${a.name} (${item.name})` }))]
        }
      })
    }
    if (allActions.length) {
      const CHUNK_SIZE = 4
      for (let i = 0; i < allActions.length; i += CHUNK_SIZE) {
        result.push({ type: 'actions', title: `Actions ${allActions.length > CHUNK_SIZE ? `(${Math.floor(i/CHUNK_SIZE)+1})` : ''}`, actions: allActions.slice(i, i + CHUNK_SIZE) })
      }
    }
    if (data.spells?.length) {
      const CHUNK_SIZE = 4
      for (let i = 0; i < data.spells.length; i += CHUNK_SIZE) {
        result.push({ type: 'actions', title: `Magic ${data.spells.length > CHUNK_SIZE ? `(${Math.floor(i/CHUNK_SIZE)+1})` : ''}`, actions: data.spells.slice(i, i + CHUNK_SIZE).map((s: any) => ({ name: s.name, actionType: `Lvl ${s.level}`, toHit: s.toHit || s.dc, roll: s.roll, description: s.description })) })
      }
    }
  }

  if (type === 'ITEM_DND_5E') {
    result.push({ type: 'text', title: 'Item', blocks: [{ heading: 'Rarity', content: data.rarity || 'Common' }, { heading: 'Description', content: data.description || 'No description' }] })
  }
  return result
})

function onIntersect(isIntersecting: boolean, entries: IntersectionObserverEntry[]) {
  const entry = entries[0]
  const index = parseInt(entry.target.getAttribute('data-index') || '0')
  if (isIntersecting) visibleSections.value.add(index)
}

function autoScrollLoop() {
  if (!scrollContainer.value || !isAutoPlaying.value) {
    scrollAnimationFrame = requestAnimationFrame(autoScrollLoop)
    return
  }
  const container = scrollContainer.value
  const currentScroll = container.scrollTop
  // We look for any section boundary ahead
  const nextSection = sectionRefs.value.find(ref => ref && ref.offsetTop > currentScroll + 5)
  if (nextSection && Math.abs(currentScroll - nextSection.offsetTop) < 10) {
    if (!boundaryPauseStartTime) boundaryPauseStartTime = Date.now()
    if (Date.now() - boundaryPauseStartTime < BOUNDARY_PAUSE_DURATION) {
      scrollAnimationFrame = requestAnimationFrame(autoScrollLoop)
      return
    } else {
      boundaryPauseStartTime = null
      container.scrollTop += 12 
    }
  }
  container.scrollTop += SCROLL_SPEED
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) container.scrollTop = 0
  scrollAnimationFrame = requestAnimationFrame(autoScrollLoop)
}

function handleInteraction(e?: KeyboardEvent) {
  if (e?.key === 'ArrowDown') { scrollToNext(); return }
  if (e?.key === 'ArrowUp') { scrollToPrev(); return }

  lastInteractionTime.value = Date.now()
  isAutoPlaying.value = false
  if (cooldownTimer) clearInterval(cooldownTimer)
  interactionCooldown.value = AUTO_RESUME_TIME / 1000
  cooldownTimer = setInterval(() => {
    interactionCooldown.value--
    if (interactionCooldown.value <= 0) { isAutoPlaying.value = true; clearInterval(cooldownTimer) }
  }, 1000)
}

function updateScrollProgress() {
  if (!scrollContainer.value) return
  const container = scrollContainer.value
  scrollProgress.value = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100
}

function scrollToNext() {
  if (!scrollContainer.value) return
  const current = scrollContainer.value.scrollTop
  const next = sectionRefs.value.find(ref => ref && ref.offsetTop > current + 15)
  if (next) {
    scrollContainer.value.scrollTo({ top: next.offsetTop, behavior: 'smooth' })
    handleInteraction()
  }
}

function scrollToPrev() {
  if (!scrollContainer.value) return
  const current = scrollContainer.value.scrollTop
  const prev = [...sectionRefs.value].reverse().find(ref => ref && ref.offsetTop < current - 15)
  if (prev) {
    scrollContainer.value.scrollTo({ top: prev.offsetTop, behavior: 'smooth' })
    handleInteraction()
  }
}

watch(() => dialogsStore.itemPresentationOpen, (open) => {
  if (open) {
    visibleSections.value.clear()
    nextTick(() => {
      if (scrollContainer.value) scrollContainer.value.scrollTop = 0
      isAutoPlaying.value = true
      scrollAnimationFrame = requestAnimationFrame(autoScrollLoop)
    })
  } else {
    if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame)
    if (cooldownTimer) clearInterval(cooldownTimer)
  }
})

watch(() => item.value, async (newItem) => {
  if (newItem?.featuredImage) {
    try { featuredImageUrl.value = await filesStore.getDownloadUrl(newItem.featuredImage.id) }
    catch { featuredImageUrl.value = '' }
  } else featuredImageUrl.value = ''
}, { immediate: true })

onMounted(() => { if (dialogsStore.itemPresentationOpen) scrollAnimationFrame = requestAnimationFrame(autoScrollLoop) })
onUnmounted(() => { if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame); if (cooldownTimer) clearInterval(cooldownTimer) })
</script>

<style scoped>
.presentation-card {
  background: radial-gradient(circle at center, #1b1b26 0%, #050508 100%) !important;
  color: white !important;
  cursor: default;
  outline: none;
}

.scroll-viewport { height: calc(100vh - 48px); overflow-y: scroll; scroll-behavior: auto; }
.scroll-viewport::-webkit-scrollbar { display: none; }
.scroll-viewport { -ms-overflow-style: none; scrollbar-width: none; }

.presentation-section { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  position: relative; 
  padding: 15vh 0; /* Vertical breathing room instead of forced 100vh */
  border-bottom: 1px solid rgba(255,255,255,0.02); 
}

/* Header Slide still gets full height for impact */
.section-integrated-header, .section-header {
  min-height: 100vh;
}

/* Large Notes still get significant space */
.section-note-content {
  min-height: 80vh;
}

.section-container { width: 100%; }

/* Staggered Entrance Animations */
.is-visible .anim-fade-in {
  animation: entrance-fade 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay);
}

.is-visible .anim-staggered {
  animation: entrance-scale 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay);
}

@keyframes entrance-fade {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes entrance-scale {
  from { opacity: 0; transform: scale(0.9) translateY(40px); filter: blur(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
}

.integrated-header-layout { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; }

.ability-integrated-row { display: flex; justify-content: center; gap: 30px; width: 100%; }
.ability-card-integrated { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 30px 20px; border-radius: 24px; text-align: center; min-width: 160px; }
.ability-mod-integrated { font-size: 6rem; font-weight: 900; line-height: 1; text-shadow: 0 5px 20px rgba(var(--v-theme-primary), 0.3); }

.combat-integrated-row { display: flex; justify-content: center; gap: 60px; width: 100%; }
.combat-value-integrated { font-size: 8rem; font-weight: 900; color: rgb(var(--v-theme-primary)); line-height: 0.9; text-shadow: 0 10px 40px rgba(var(--v-theme-primary), 0.4); }

.note-layout { padding: 40px; background: rgba(255,255,255,0.02); border-radius: 40px; backdrop-filter: blur(30px); }
.blur-toolbar { backdrop-filter: blur(15px); border-bottom: 1px solid rgba(255,255,255,0.05); z-index: 2000; }
.action-card { background: rgba(255,255,255,0.02) !important; border-left: 4px solid rgb(var(--v-theme-primary)) !important; border-radius: 16px !important; }
.badge-value { font-size: 1.4rem; font-weight: 900; }

.border-gold-glow { border: 4px solid #d4af37; box-shadow: 0 0 60px rgba(212, 175, 55, 0.3); }
.glow-text { text-shadow: 0 0 40px rgba(var(--v-theme-primary), 0.5); }

.vertical-navigation { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 1000; }
.progress-container { position: absolute; bottom: 0; left: 0; right: 0; }
.color-primary { color: rgb(var(--v-theme-primary)); }
.max-width-xl { max-width: 1200px; margin: 0 auto; }
.max-width-xxl { max-width: 1600px; margin: 0 auto; }
</style>
