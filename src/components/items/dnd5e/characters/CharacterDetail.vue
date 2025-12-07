<template>
  <div class="character-detail" :style="backgroundImageStyle">
    <div class="character-layout">
      <!-- Main Content Column (Left) -->
      <div class="main-content-wrapper">
        <div class="main-content">
          <!-- Header with Action Buttons -->
          <v-card class="page-topbar character-header mb-4" elevation="0">
            <div class="topbar-content">
              <!-- Left: Image, Title, Description, Tags -->
              <div class="topbar-left">
                <div class="topbar-title-row">
                  <!-- Circular Featured Image -->
                  <div class="character-avatar">
                    <v-avatar size="64" v-if="featuredImageUrl">
                      <v-img :src="featuredImageUrl" cover />
                    </v-avatar>
                    <v-avatar size="64" v-else color="primary">
                      <v-icon icon="mdi-account-circle" size="48" />
                    </v-avatar>
                  </div>
                  
                  <div class="character-title-info">
                    <h1 class="topbar-title">
                      {{ item.name }}
                    </h1>
                    <div class="character-description-row">
                      <div class="character-description">
                        Level {{ characterData.level || 1 }}
                        <span v-if="characterData.race || characterData.class"> • </span>
                        <span v-if="characterData.race">{{ characterData.race }}</span>
                        <span v-if="characterData.race && characterData.class"> • </span>
                        <span v-if="characterData.class">{{ characterData.class }}</span>
                      </div>
                      <!-- Tags in Header - Next to Description -->
                      <div v-if="item.tags && item.tags.length > 0" class="header-tags">
                        <v-chip
                          v-for="tag in item.tags"
                          :key="tag.id"
                          :color="tag.color"
                          size="small"
                          class="mr-1"
                        >
                          <v-icon icon="mdi-tag" size="x-small" class="mr-1" />
                          {{ tag.name }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Actions -->
              <div class="topbar-actions">
                <v-tooltip location="bottom">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" icon="mdi-information-outline" size="small" color="primary" />
                  </template>
                  <div class="character-info-tooltip">
                    <div v-if="characterData.race" class="tooltip-item">
                      <v-icon icon="mdi-account" size="small" class="mr-1" /> 
                      <strong>Race:</strong> {{ characterData.race }}
                    </div>
                    <div v-if="characterData.class" class="tooltip-item">
                      <v-icon icon="mdi-sword-cross" size="small" class="mr-1" /> 
                      <strong>Class:</strong> {{ characterData.class }}
                      <span v-if="characterData.subclass"> ({{ characterData.subclass }})</span>
                    </div>
                    <div v-if="characterData.background" class="tooltip-item">
                      <v-icon icon="mdi-book-open-variant" size="small" class="mr-1" /> 
                      <strong>Background:</strong> {{ characterData.background }}
                    </div>
                    <div v-if="characterData.experience" class="tooltip-item">
                      <v-icon icon="mdi-star" size="small" class="mr-1" /> 
                      <strong>XP:</strong> {{ characterData.experience?.toLocaleString() }}
                    </div>
                    <div v-if="characterData.alignment" class="tooltip-item">
                      <v-icon icon="mdi-compass" size="small" class="mr-1" /> 
                      <strong>Alignment:</strong> {{ characterData.alignment }}
                    </div>
                  </div>
                </v-tooltip>

                <v-menu location="bottom end">
                  <template #activator="{ props }">
                    <v-btn icon="mdi-dots-vertical" v-bind="props" size="small" variant="text" />
                  </template>
                  <v-list>
                    <v-list-item prepend-icon="mdi-printer" @click="showPrintDialog = true">
                      <v-list-item-title>Print / PDF</v-list-item-title>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-pencil" @click="$emit('edit')">
                      <v-list-item-title>Edit Character</v-list-item-title>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-delete" @click="$emit('delete')">
                      <v-list-item-title>Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </v-card>

          <v-tabs v-model="mainContentTab" class="main-content-tabs mb-4">
            <v-tab value="main">Main</v-tab>
            <v-tab value="notes">Notes</v-tab>
            <v-tab value="files">Files</v-tab>
          </v-tabs>

          <v-window v-model="mainContentTab" class="main-content-window">
            <!-- Main Tab -->
            <v-window-item value="main">
              <!-- Core Stats -->
              <div class="core-stats-container mb-4">
                <v-card class="glass-card text-center stat-card clickable" elevation="0" @click="showHealthEditor = true">
                  <v-card-text class="stat-card-content">
                    <v-icon icon="mdi-heart" class="stat-icon" color="error" />
                    <div class="stat-value">
                      {{ characterData.hp || 0 }}<span class="stat-divider">/</span>{{ effectiveMaxHp }}
                    </div>
                    <div class="stat-label">
                      <span class="label-desktop">Hit Points</span>
                      <span class="label-mobile">HP</span>
                    </div>
                    <v-tooltip v-if="equippedModifiers.maxHp" activator="parent" location="bottom">
                      Base: {{ characterData.maxHp || 0 }} + Items: {{ equippedModifiers.maxHp }}
                    </v-tooltip>
                    <v-icon icon="mdi-pencil" size="x-small" class="edit-hint" />
                  </v-card-text>
                </v-card>
                <v-card class="glass-card text-center stat-card" elevation="0">
                  <v-card-text class="stat-card-content">
                    <v-icon icon="mdi-shield" class="stat-icon" color="primary" />
                    <div class="stat-value">{{ effectiveAC }}</div>
                    <div class="stat-label">
                      <span class="label-desktop">Armor Class</span>
                      <span class="label-mobile">AC</span>
                    </div>
                    <v-tooltip v-if="equippedModifiers.ac" activator="parent" location="bottom">
                      Base: {{ characterData.ac || 10 }} + Items: {{ equippedModifiers.ac }}
                    </v-tooltip>
                  </v-card-text>
                </v-card>
                <v-card class="glass-card text-center stat-card" elevation="0">
                  <v-card-text class="stat-card-content">
                    <v-icon icon="mdi-run-fast" class="stat-icon" color="success" />
                    <div class="stat-value">{{ effectiveSpeed }}<span class="stat-unit">ft</span></div>
                    <div class="stat-label">
                      <span class="label-desktop">Speed</span>
                      <span class="label-mobile">SPD</span>
                    </div>
                    <v-tooltip v-if="equippedModifiers.speed" activator="parent" location="bottom">
                      Base: {{ characterData.speed || 30 }}ft + Items: {{ equippedModifiers.speed }}ft
                    </v-tooltip>
                  </v-card-text>
                </v-card>
                <v-card class="glass-card text-center stat-card" elevation="0">
                  <v-card-text class="stat-card-content">
                    <v-icon icon="mdi-dice-d20" class="stat-icon" color="warning" />
                    <div class="stat-value">+{{ proficiencyBonus }}</div>
                    <div class="stat-label">
                      <span class="label-desktop">Proficiency</span>
                      <span class="label-mobile">PROF</span>
                    </div>
                  </v-card-text>
                </v-card>
                <v-card class="glass-card text-center stat-card" elevation="0">
                  <v-card-text class="stat-card-content">
                    <v-icon icon="mdi-crosshairs" class="stat-icon" color="info" />
                    <div class="stat-value">
                      {{ initiativeDisplay }}
                    </div>
                    <div class="stat-label">
                      <span class="label-desktop">Initiative</span>
                      <span class="label-mobile">INIT</span>
                    </div>
                    <v-tooltip v-if="equippedModifiers.initiative" activator="parent" location="bottom">
                      Items: +{{ equippedModifiers.initiative }}
                    </v-tooltip>
                  </v-card-text>
                </v-card>
              </div>

              <!-- Ability Scores & Saving Throws -->
              <ability-scores-display
                :data="characterData"
                :level="characterData.level || 1"
                :effective-scores="effectiveAbilityScores"
                :equipment-save-bonus="equipmentSaveBonuses"
              />

              <!-- Skills -->
              <v-card class="glass-card mb-4 skills-card" elevation="0">
                <v-card-title class="d-flex align-center card-title-mobile">
                  <v-icon icon="mdi-hammer-screwdriver" size="small" class="mr-2" />
                  <span class="title-text">Skills</span>
                </v-card-title>
                <v-card-text class="skills-content">
                  <v-row>
                    <v-col v-for="skillDef in DND5E_SKILLS" :key="skillDef.name" cols="6" sm="6" md="4" lg="3">
                      <div class="skill-item d-flex align-center justify-space-between">
                        <div class="d-flex align-center skill-name-container">
                          <v-icon
                            v-if="getSkillProficiency(skillDef.name) === 'expertise'"
                            icon="mdi-checkbox-multiple-marked-circle"
                            color="purple"
                            size="x-small"
                            class="mr-1 skill-icon"
                          />
                          <v-icon
                            v-else-if="getSkillProficiency(skillDef.name) === 'proficient'"
                            icon="mdi-checkbox-marked-circle"
                            color="primary"
                            size="x-small"
                            class="mr-1 skill-icon"
                          />
                          <v-icon
                            v-else
                            icon="mdi-checkbox-blank-circle-outline"
                            color="grey"
                            size="x-small"
                            class="mr-1 skill-icon"
                          />
                          <span class="skill-name">{{ skillDef.name }}</span>
                          <span class="skill-ability">{{ ABILITY_LABELS[skillDef.ability] }}</span>
                        </div>
                        <span class="skill-bonus font-weight-bold">
                          {{ formatModifier(skillBonuses[skillDef.name]) }}
                        </span>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Resistances & Immunities -->
              <v-row class="mb-4">
                <v-col cols="12" md="6">
                  <v-card class="glass-card" elevation="0">
                    <v-card-title class="text-subtitle-2 d-flex align-center">
                      <v-icon icon="mdi-shield-half-full" size="small" class="mr-2" />
                      Resistances
                    </v-card-title>
                    <v-card-text class="text-body-2">
                      <span v-if="resistancesDisplay">{{ resistancesDisplay }}</span>
                      <span v-else class="text-grey">None</span>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card class="glass-card" elevation="0">
                    <v-card-title class="text-subtitle-2 d-flex align-center">
                      <v-icon icon="mdi-shield-off" size="small" class="mr-2" />
                      Immunities
                    </v-card-title>
                    <v-card-text class="text-body-2">
                      <span v-if="immunitiesDisplay">{{ immunitiesDisplay }}</span>
                      <span v-else class="text-grey">None</span>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- Notes Tab -->
            <v-window-item value="notes">
              <v-card class="glass-card" elevation="0">
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <v-icon icon="mdi-note-text" class="mr-2" />
                    Quick Notes
                  </div>
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="toggleEditNotes"
                  />
                </v-card-title>
                <v-card-text>
                  <div v-if="!editingNotes" class="quick-notes-display">
                    <div v-if="characterData.quickNotes" v-html="characterData.quickNotes" />
                    <div v-else class="text-grey text-caption">No notes yet. Click the pencil icon to add notes.</div>
                  </div>
                  <v-textarea
                    v-else
                    v-model="localQuickNotes"
                    variant="outlined"
                    rows="10"
                    placeholder="Add quick notes about your character..."
                    hide-details
                  />
                  <v-btn
                    v-if="editingNotes"
                    color="primary"
                    size="small"
                    class="mt-2"
                    @click="saveQuickNotes"
                  >
                    Save Notes
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-window-item>

            <!-- Files Tab -->
            <v-window-item value="files">
              <attached-files-grid
                :file-ids="fileIds"
                :featured-image-id="item.featuredImage?.id"
                :columns="4"
                :read-only="true"
              />
            </v-window-item>
          </v-window>
        </div>
      </div>

      <!-- Sidebar Column (Right) - Sticky -->
      <div class="sidebar-wrapper">
        <div class="sidebar-content">
          <v-tabs v-model="activeTab" class="sidebar-tabs mb-3">
            <v-tab value="combat">Combat</v-tab>
            <v-tab value="spells">Spells</v-tab>
            <v-tab value="inventory">Inventory</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="sidebar-window">
            <!-- Combat Tab -->
            <v-window-item value="combat">
              <custom-counters-display
                :counters="characterData.customCounters"
                :editable="props.canEdit"
                :hide-title="true"
                @update:counters="updateCustomCounters"
              />
              <action-list-display v-model="combinedActions" :editable="canEdit" @update:model-value="updateActions" />
              <trait-list-display v-model="characterData.traits" :editable="canEdit" @update:model-value="updateTraits" />
            </v-window-item>

            <!-- Spells Tab -->
            <v-window-item value="spells">
              <spell-slots-display
                :spell-slots="characterData.spellSlots"
                :spells="characterData.spells"
                @update:slots="updateSpellSlots"
              />
              <spell-list-display v-model="characterData.spells" :editable="canEdit" @update:model-value="updateSpells" />
            </v-window-item>

            <!-- Inventory Tab -->
            <v-window-item value="inventory">
              <!-- Gold -->
              <v-card class="glass-card mb-4 clickable" elevation="0" @click="showGoldEditor = true">
                <v-card-text class="d-flex align-center justify-space-between">
                  <div>
                    <v-icon icon="mdi-gold" color="warning" class="mr-2" />
                    <strong>Gold:</strong> {{ characterData.gold || 0 }} gp
                  </div>
                  <v-icon icon="mdi-pencil" size="small" />
                </v-card-text>
              </v-card>

              <!-- Inventory -->
              <v-card class="glass-card" elevation="0">
                <v-card-text>
                  <inventory-item-list
                    :items="characterData.inventory || []"
                    :library-id="item.libraryId"
                    @update="updateInventory"
                  />
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </div>
      </div>
    </div>

    <!-- Health Editor -->
    <amount-editor
      v-model="showHealthEditor"
      :current-amount="characterData.hp || 0"
      :max-amount="characterData.maxHp || 0"
      label="HP"
      title="Edit Health"
      icon="mdi-heart"
      icon-color="error"
      :presets="[20, 10, 5, 1, -1, -5, -10, -20]"
      :show-max="true"
      :auto-close-on-adjust="true"
      @update:amount="updateHealth"
    />

    <!-- Gold Editor -->
    <amount-editor
      v-model="showGoldEditor"
      :current-amount="characterData.gold || 0"
      label="Gold"
      title="Edit Gold"
      icon="mdi-gold"
      icon-color="warning"
      :presets="[1000, 100, 10, 1, -1, -10, -100]"
      @update:amount="updateGold"
    />

    <!-- Print Dialog -->
    <v-dialog v-model="showPrintDialog" fullscreen>
      <v-card>
        <v-toolbar color="primary">
          <v-toolbar-title>{{ item.name }} - Character Sheet</v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-printer" @click="printCharacter" />
          <v-btn icon="mdi-close" @click="showPrintDialog = false" />
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <div id="character-pdf-export" class="pdf-export-container">
      <div class="pdf-header">
        <h1>{{ item.name }}</h1>
        <div class="pdf-character-info">
          <span><strong>Race:</strong> {{ characterData.race }}</span> |
          <span><strong>Class:</strong> {{ characterData.class }}</span>
          <span v-if="characterData.subclass"> ({{ characterData.subclass }})</span> |
          <span><strong>Level:</strong> {{ characterData.level }}</span> |
          <span><strong>Alignment:</strong> {{ characterData.alignment }}</span>
        </div>
      </div>

      <!-- Core Stats -->
      <div class="pdf-section">
        <div class="pdf-stats-row">
          <div class="pdf-stat-box">
            <div class="pdf-stat-label">Hit Points</div>
            <div class="pdf-stat-value">_____ / {{ characterData.maxHp || '____' }}</div>
          </div>
          <div class="pdf-stat-box">
            <div class="pdf-stat-label">Armor Class</div>
            <div class="pdf-stat-value">{{ characterData.ac || '____' }}</div>
          </div>
          <div class="pdf-stat-box">
            <div class="pdf-stat-label">Speed</div>
            <div class="pdf-stat-value">{{ characterData.speed || '____' }}</div>
          </div>
          <div class="pdf-stat-box">
            <div class="pdf-stat-label">Proficiency</div>
            <div class="pdf-stat-value">+{{ proficiencyBonus }}</div>
          </div>
          <div class="pdf-stat-box">
            <div class="pdf-stat-label">Initiative</div>
            <div class="pdf-stat-value">{{ initiativeDisplay }}</div>
          </div>
        </div>
      </div>

      <div class="pdf-section" v-if="showDefenseInfo">
        <h3 class="pdf-section-title">Resistances & Immunities</h3>
        <p><strong>Resistances:</strong> {{ resistancesDisplay || 'None' }}</p>
        <p><strong>Immunities:</strong> {{ immunitiesDisplay || 'None' }}</p>
      </div>

      <!-- Ability Scores -->
      <div class="pdf-section">
        <h3 class="pdf-section-title">Ability Scores & Saving Throws</h3>
        <div class="pdf-abilities-grid">
          <div v-for="ability in ABILITIES" :key="ability" class="pdf-ability">
            <div class="pdf-ability-name">{{ ABILITY_LABELS[ability] }}</div>
            <div class="pdf-ability-score">{{ characterData[ability] || 10 }}</div>
            <div class="pdf-ability-modifier">{{ formatModifier(abilityModifiers[ability]) }}</div>
            <div class="pdf-ability-save">
              <span v-if="isSavingThrowProficient(ability)">✓</span>
              Save: {{ formatModifier(savingThrowBonuses[ability]) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Skills -->
      <div class="pdf-section">
        <h3 class="pdf-section-title">Skills</h3>
        <div class="pdf-skills-grid">
          <div v-for="skillDef in DND5E_SKILLS" :key="skillDef.name" class="pdf-skill">
            <span class="pdf-skill-prof">
              <span v-if="getSkillProficiency(skillDef.name) === 'expertise'">★</span>
              <span v-else-if="getSkillProficiency(skillDef.name) === 'proficient'">✓</span>
              <span v-else>○</span>
            </span>
            <span class="pdf-skill-name">{{ skillDef.name }}</span>
            <span class="pdf-skill-bonus">{{ formatModifier(skillBonuses[skillDef.name]) }}</span>
          </div>
        </div>
      </div>

      <!-- Traits & Features -->
      <div class="pdf-section">
        <h3 class="pdf-section-title">Traits & Features</h3>
        <div v-for="(trait, index) in characterData.traits" :key="index" class="pdf-item">
          <div class="pdf-item-name">{{ trait.name }}</div>
          <div class="pdf-item-description" v-html="trait.description"></div>
        </div>
        <!-- Blank spaces for additional traits -->
        <div class="blank-lines">
          <div v-for="i in 3" :key="`trait-blank-${i}`" class="blank-line"></div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pdf-section">
        <h3 class="pdf-section-title">Actions</h3>
        <div v-for="(action, index) in characterData.actions" :key="index" class="pdf-item">
          <div class="pdf-item-header">
            <span class="pdf-item-name">{{ action.name }}</span>
            <span class="pdf-action-type">{{ action.actionType }}</span>
          </div>
          <div v-if="action.range" class="pdf-item-meta">Range: {{ action.range }}</div>
          <div v-if="action.roll" class="pdf-item-meta">Roll: {{ action.roll }}</div>
          <div class="pdf-item-description" v-html="action.description"></div>
        </div>
        <!-- Blank spaces for additional actions -->
        <div class="blank-lines">
          <div v-for="i in 3" :key="`action-blank-${i}`" class="blank-line"></div>
        </div>
      </div>

      <!-- Spells -->
      <div class="pdf-section">
        <h3 class="pdf-section-title">Spells</h3>
        
        <!-- Spell Slots -->
        <div v-if="characterData.spellSlots && characterData.spellSlots.length > 0" class="pdf-spell-slots">
          <strong>Spell Slots (Max):</strong>
          <span v-for="slot in characterData.spellSlots" :key="slot.level" class="pdf-slot">
            Level {{ slot.level }}: ☐☐☐☐☐ ({{ slot.max }})
          </span>
        </div>

        <!-- Spells by Level -->
        <div v-for="spellLevel in uniqueSpellLevels" :key="`spell-level-${spellLevel}`" class="pdf-spell-level">
          <h4 class="pdf-spell-level-title">
            {{ spellLevel === 0 ? 'Cantrips' : `Level ${spellLevel}` }}
          </h4>
          <div class="pdf-spells-grid">
            <div 
              v-for="(spell, index) in getSpellsByLevel(spellLevel)" 
              :key="`spell-${spellLevel}-${index}`" 
              class="pdf-spell-card"
            >
              <div class="pdf-spell-name">
                {{ spell.name }}
                <span v-if="spell.concentration || spell.ritual" class="pdf-spell-badges">
                  <span v-if="spell.concentration" class="pdf-tag">C</span>
                  <span v-if="spell.ritual" class="pdf-tag">R</span>
                </span>
              </div>
              <div class="pdf-spell-meta">
                <span v-if="spell.school">{{ spell.school }}</span>
                <span v-if="spell.castingTime">• {{ spell.castingTime }}</span>
                <span v-if="spell.range">• {{ spell.range }}</span>
              </div>
              <div v-if="spell.components" class="pdf-spell-components">
                <strong>Components:</strong> {{ spell.components }}
              </div>
              <div v-if="spell.duration" class="pdf-spell-duration">
                <strong>Duration:</strong> {{ spell.duration }}
                <span v-if="spell.concentration" class="pdf-concentration-note"> (Concentration)</span>
              </div>
              <div v-if="spell.roll" class="pdf-spell-mechanics">
                <div class="pdf-spell-roll">
                  <strong>Roll:</strong> {{ spell.roll }}
                </div>
              </div>
              <div class="pdf-spell-description" v-html="spell.description"></div>
            </div>
          </div>
          <!-- Blank spaces for additional spells -->
          <div class="blank-lines">
            <div v-for="i in 2" :key="`spell-${spellLevel}-blank-${i}`" class="blank-line"></div>
          </div>
        </div>
        
        <!-- Additional blank spell level section -->
        <div class="pdf-spell-level">
          <h4 class="pdf-spell-level-title">{{ uniqueSpellLevels.length > 0 ? 'Additional Spells' : 'Spells' }}</h4>
          <div class="blank-lines">
            <div v-for="i in 8" :key="`extra-spell-blank-${i}`" class="blank-line"></div>
          </div>
        </div>
      </div>

      <!-- Inventory -->
      <div class="pdf-section">
        <h3 class="pdf-section-title">Inventory</h3>
        <div class="pdf-gold"><strong>Gold:</strong> _____________ gp</div>
        <div class="pdf-inventory">
          <div v-for="(invItem, index) in characterData.inventory" :key="index" class="pdf-inventory-item">
            <span class="pdf-inventory-equipped">○</span>
            <span class="pdf-inventory-name">{{ invItem.name }}</span>
            <span v-if="invItem.quantity && invItem.quantity > 1" class="pdf-inventory-qty">x{{ invItem.quantity }}</span>
            <span v-if="invItem.weight" class="pdf-inventory-weight">{{ invItem.weight }} lb</span>
            <div v-if="invItem.description" class="pdf-inventory-desc">{{ invItem.description }}</div>
          </div>
        </div>
        <!-- Blank spaces for additional inventory items -->
        <div class="blank-lines">
          <div v-for="i in 8" :key="`inventory-blank-${i}`" class="blank-line"></div>
        </div>
      </div>

      <!-- Quick Notes -->
      <div v-if="characterData.quickNotes" class="pdf-section">
        <h3 class="pdf-section-title">Quick Notes</h3>
        <div class="pdf-notes" v-html="characterData.quickNotes"></div>
      </div>
    </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LibraryItem, CustomCounter } from '@/types/item.types'
import type { CharacterData, ItemModifier, InventoryItem, ItemAction, Action } from '@/types/item.DND_5E.types'
import { ABILITIES, ABILITY_LABELS, DND5E_SKILLS } from '@/constants/dnd5e'
import {
  calculateModifier,
  calculateProficiencyBonus,
  calculateSkillBonus,
  formatModifier,
} from '@/composables/useDnd5eCalculations'
import { useFilesStore } from '@/stores/files'
import { useItemsStore } from '@/stores/items'
import { useToast } from 'vue-toastification'
import PageTopBar from '@/components/common/PageTopBar.vue'
import TraitListDisplay from '../common/TraitListDisplay.vue'
import ActionListDisplay from '../common/ActionListDisplay.vue'
import SpellListDisplay from '../common/SpellListDisplay.vue'
import SpellSlotsDisplay from '../common/SpellSlotsDisplay.vue'
import CustomCountersDisplay from '../common/CustomCountersDisplay.vue'
import InventoryItemList from '../common/InventoryItemList.vue'
import AttachedFilesGrid from '@/components/items/common/AttachedFilesGrid.vue'
import AmountEditor from '@/components/common/AmountEditor.vue'
import AbilityScoresDisplay from '../common/AbilityScoresDisplay.vue'

interface Props {
  item: LibraryItem
  canEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canEdit: true,
})

const emit = defineEmits<{
  edit: []
  delete: []
}>()

const filesStore = useFilesStore()
const itemsStore = useItemsStore()
const toast = useToast()

const activeTab = ref('combat')
const mainContentTab = ref('main')
const showHealthEditor = ref(false)
const showGoldEditor = ref(false)
const showPrintDialog = ref(false)
const editingNotes = ref(false)
const localQuickNotes = ref('')
const featuredImageUrl = ref<string>('')

const characterData = computed(() => props.item.data as CharacterData)

// Calculate total modifiers from all equipped items
const equippedModifiers = computed((): ItemModifier => {
  const inventory = characterData.value.inventory || []
  const equippedItems = inventory.filter((item: InventoryItem) => item.equipped && item.modifiers)
  
  const totalModifiers: ItemModifier = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
    ac: 0,
    maxHp: 0,
    speed: 0,
    initiative: 0,
    savingThrowBonus: 0,
    strSavingThrow: 0,
    dexSavingThrow: 0,
    conSavingThrow: 0,
    intSavingThrow: 0,
    wisSavingThrow: 0,
    chaSavingThrow: 0,
    skillBonus: 0,
    resistances: '',
    immunities: '',
  }
  
  equippedItems.forEach((item: InventoryItem) => {
    const mods = item.modifiers!
    // Sum up numeric modifiers
    if (mods.str) totalModifiers.str! += mods.str
    if (mods.dex) totalModifiers.dex! += mods.dex
    if (mods.con) totalModifiers.con! += mods.con
    if (mods.int) totalModifiers.int! += mods.int
    if (mods.wis) totalModifiers.wis! += mods.wis
    if (mods.cha) totalModifiers.cha! += mods.cha
    if (mods.ac) totalModifiers.ac! += mods.ac
    if (mods.maxHp) totalModifiers.maxHp! += mods.maxHp
    if (mods.speed) totalModifiers.speed! += mods.speed
    if (mods.initiative) totalModifiers.initiative! += mods.initiative
    if (mods.savingThrowBonus) totalModifiers.savingThrowBonus! += mods.savingThrowBonus
    if (mods.strSavingThrow) totalModifiers.strSavingThrow! += mods.strSavingThrow
    if (mods.dexSavingThrow) totalModifiers.dexSavingThrow! += mods.dexSavingThrow
    if (mods.conSavingThrow) totalModifiers.conSavingThrow! += mods.conSavingThrow
    if (mods.intSavingThrow) totalModifiers.intSavingThrow! += mods.intSavingThrow
    if (mods.wisSavingThrow) totalModifiers.wisSavingThrow! += mods.wisSavingThrow
    if (mods.chaSavingThrow) totalModifiers.chaSavingThrow! += mods.chaSavingThrow
    if (mods.skillBonus) totalModifiers.skillBonus! += mods.skillBonus
    
    // Concatenate resistance/immunity strings
    if (mods.resistances) {
      const existing = totalModifiers.resistances || ''
      totalModifiers.resistances = existing ? `${existing}, ${mods.resistances}` : mods.resistances
    }
    if (mods.immunities) {
      const existing = totalModifiers.immunities || ''
      totalModifiers.immunities = existing ? `${existing}, ${mods.immunities}` : mods.immunities
    }
  })
  
  return totalModifiers
})

// Effective ability scores (base + equipment modifiers)
const effectiveAbilityScores = computed(() => ({
  str: (characterData.value.str || 10) + (equippedModifiers.value.str || 0),
  dex: (characterData.value.dex || 10) + (equippedModifiers.value.dex || 0),
  con: (characterData.value.con || 10) + (equippedModifiers.value.con || 0),
  int: (characterData.value.int || 10) + (equippedModifiers.value.int || 0),
  wis: (characterData.value.wis || 10) + (equippedModifiers.value.wis || 0),
  cha: (characterData.value.cha || 10) + (equippedModifiers.value.cha || 0),
}))

// Effective stats (base + equipment modifiers)
const effectiveAC = computed(() => (characterData.value.ac || 10) + (equippedModifiers.value.ac || 0))
const effectiveMaxHp = computed(() => (characterData.value.maxHp || 0) + (equippedModifiers.value.maxHp || 0))
const effectiveSpeed = computed(() => {
  const baseSpeed = parseInt(String(characterData.value.speed || '30'), 10) || 30
  return baseSpeed + (equippedModifiers.value.speed || 0)
})

// Equipment saving throw bonuses (for passing to AbilityScoresDisplay)
const equipmentSaveBonuses = computed(() => {
  const mods = equippedModifiers.value
  const allBonus = mods.savingThrowBonus || 0
  return {
    str: (mods.strSavingThrow || 0) + allBonus,
    dex: (mods.dexSavingThrow || 0) + allBonus,
    con: (mods.conSavingThrow || 0) + allBonus,
    int: (mods.intSavingThrow || 0) + allBonus,
    wis: (mods.wisSavingThrow || 0) + allBonus,
    cha: (mods.chaSavingThrow || 0) + allBonus,
  }
})

// Background image style
const backgroundImageStyle = computed(() => {
  if (!featuredImageUrl.value) return {}
  return {
    '--bg-image': `url(${featuredImageUrl.value})`,
  }
})

// Load featured image URL
watch(
  () => props.item.featuredImage?.id,
  async (imageId) => {
    if (imageId) {
      try {
        featuredImageUrl.value = await filesStore.getDownloadUrl(imageId)
      } catch (error) {
        console.error('Failed to load featured image:', error)
        featuredImageUrl.value = ''
      }
    } else {
      featuredImageUrl.value = ''
    }
  },
  { immediate: true }
)

// Add files to store and get IDs
const fileIds = computed(() => {
  if (props.item.userFiles && props.item.userFiles.length > 0) {
    filesStore.addFiles(props.item.userFiles)
    return props.item.userFiles.map(f => f.id)
  }
  return []
})

// Calculations
const proficiencyBonus = computed(() =>
  calculateProficiencyBonus(characterData.value.level || 1)
)

const initiativeValue = computed(() => {
  const baseInit = characterData.value.initiative
  const equipBonus = equippedModifiers.value.initiative || 0
  // If base initiative is set, add equipment bonus
  if (baseInit !== undefined && baseInit !== null && baseInit !== '') {
    return Number(baseInit) + equipBonus
  }
  // If no base initiative, calculate from DEX modifier + equipment bonus
  const dexMod = calculateModifier(effectiveAbilityScores.value.dex)
  return dexMod + equipBonus
})

const initiativeDisplay = computed(() => {
  const value = initiativeValue.value
  if (value === undefined || value === null) return '—'
  return formatModifier(value)
})

const resistancesDisplay = computed(() => {
  const base = (characterData.value.resistances || '').trim()
  const equip = (equippedModifiers.value.resistances || '').trim()
  if (base && equip) return `${base}, ${equip}`
  return base || equip || ''
})

const immunitiesDisplay = computed(() => {
  const base = (characterData.value.immunities || '').trim()
  const equip = (equippedModifiers.value.immunities || '').trim()
  if (base && equip) return `${base}, ${equip}`
  return base || equip || ''
})

const showDefenseInfo = computed(() => {
  const hasInitiative = initiativeValue.value !== undefined && initiativeValue.value !== null
  return hasInitiative || resistancesDisplay.value.length > 0 || immunitiesDisplay.value.length > 0
})

const abilityModifiers = computed(() => ({
  str: calculateModifier(effectiveAbilityScores.value.str),
  dex: calculateModifier(effectiveAbilityScores.value.dex),
  con: calculateModifier(effectiveAbilityScores.value.con),
  int: calculateModifier(effectiveAbilityScores.value.int),
  wis: calculateModifier(effectiveAbilityScores.value.wis),
  cha: calculateModifier(effectiveAbilityScores.value.cha),
}))

const savingThrowBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  const mods = equippedModifiers.value
  
  ABILITIES.forEach(ability => {
    const effectiveScore = effectiveAbilityScores.value[ability as keyof typeof effectiveAbilityScores.value]
    const modifier = calculateModifier(effectiveScore)
    const isProficient = isSavingThrowProficient(ability)
    
    // Get equipment saving throw bonus for this ability
    const abilityKey = `${ability}SavingThrow` as keyof ItemModifier
    const equipmentBonus = (mods[abilityKey] as number || 0) + (mods.savingThrowBonus || 0)
    
    bonuses[ability] = modifier + (isProficient ? proficiencyBonus.value : 0) + equipmentBonus
  })
  return bonuses
})

const skillBonuses = computed(() => {
  const bonuses: Record<string, number> = {}
  const mods = equippedModifiers.value
  
  DND5E_SKILLS.forEach(skillDef => {
    const skill = characterData.value.skills?.find(s => s.name === skillDef.name)
    const effectiveScore = effectiveAbilityScores.value[skillDef.ability as keyof typeof effectiveAbilityScores.value]
    const baseBonus = calculateSkillBonus(
      effectiveScore,
      skill?.proficient || false,
      skill?.expertise || false,
      proficiencyBonus.value
    )
    // Add equipment skill bonus
    bonuses[skillDef.name] = baseBonus + (mods.skillBonus || 0)
  })
  return bonuses
})

// Combined actions: character actions + equipped item actions
const combinedActions = computed(() => {
  const characterActions = characterData.value.actions || []
  const inventory = characterData.value.inventory || []
  
  // Get actions from equipped items
  const itemActions: Action[] = []
  inventory.forEach((item: InventoryItem) => {
    if (item.equipped && item.actions && item.actions.length > 0) {
      item.actions.forEach((action: ItemAction) => {
        // Calculate actual values if using character stats
        let calculatedToHit = action.toHit
        let calculatedRoll = action.roll
        
        if (action.useCharacterStats && action.abilityModifier) {
          const abilityMod = abilityModifiers.value[action.abilityModifier] || 0
          const profBonus = action.proficient !== false ? proficiencyBonus.value : 0
          const itemBonus = action.itemBonus || 0
          
          // Calculate to-hit: proficiency + ability modifier + item bonus
          const totalToHit = profBonus + abilityMod + itemBonus
          calculatedToHit = formatModifier(totalToHit)
          
          // Calculate damage roll if using character stats
          if (action.damageDice) {
            const damageAbilityMod = action.addAbilityToDamage !== false ? abilityMod : 0
            const totalDamageBonus = damageAbilityMod + itemBonus
            const bonusStr = totalDamageBonus !== 0 ? (totalDamageBonus > 0 ? `+${totalDamageBonus}` : `${totalDamageBonus}`) : ''
            calculatedRoll = `${action.damageDice}${bonusStr}${action.damageType ? ` ${action.damageType}` : ''}`
          }
        }
        
        // Create the action with calculated values and source item name
        itemActions.push({
          ...action,
          name: `${action.name} (${item.name})`,
          toHit: calculatedToHit,
          roll: calculatedRoll,
        })
      })
    }
  })
  
  return [...characterActions, ...itemActions]
})

function isSavingThrowProficient(ability: string): boolean {
  const key = `${ability}SavingThrow` as keyof CharacterData
  return characterData.value[key] as boolean || false
}

function getSkillProficiency(skillName: string): 'none' | 'proficient' | 'expertise' {
  const skill = characterData.value.skills?.find(s => s.name === skillName)
  if (!skill) return 'none'
  if (skill.expertise) return 'expertise'
  if (skill.proficient) return 'proficient'
  return 'none'
}

async function updateHealth(newHp: number) {
  // Update immediately in local state
  const updatedData = { ...characterData.value, hp: newHp }
  Object.assign(props.item.data, updatedData)
  showHealthEditor.value = false
  
  // Then save to server in background
  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Health updated!')
  } catch (error: any) {
    console.error('Failed to update health:', error)
    toast.error('Failed to save health - please try again')
    // Optionally reload the item on error
  }
}

async function updateGold(newGold: number) {
  // Update immediately in local state
  const updatedData = { ...characterData.value, gold: newGold }
  Object.assign(props.item.data, updatedData)
  showGoldEditor.value = false
  
  // Then save to server in background
  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Gold updated!')
  } catch (error: any) {
    console.error('Failed to update gold:', error)
    toast.error('Failed to save gold - please try again')
  }
}

function toggleEditNotes() {
  if (!editingNotes.value) {
    localQuickNotes.value = characterData.value.quickNotes || ''
  }
  editingNotes.value = !editingNotes.value
}

async function saveQuickNotes() {
  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: {
        ...characterData.value,
        quickNotes: localQuickNotes.value,
      },
    })
    toast.success('Notes saved!')
    editingNotes.value = false
  } catch (error: any) {
    console.error('Failed to save notes:', error)
    toast.error('Failed to save notes')
  }
}

async function updateSpellSlots(slots: any[]) {
  // Update immediately in local state
  const updatedData = { ...characterData.value, spellSlots: slots }
  Object.assign(props.item.data, updatedData)
  
  // Then save to server in background
  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Spell slots updated!')
  } catch (error: any) {
    console.error('Failed to update spell slots:', error)
    toast.error('Failed to save spell slots')
  }
}

async function updateCustomCounters(counters: CustomCounter[]) {
  const updatedData = { ...characterData.value, customCounters: counters }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Custom counters updated!')
  } catch (error: any) {
    console.error('Failed to update custom counters:', error)
    toast.error('Failed to save custom counters')
  }
}

async function updateInventory() {
  // Update immediately (inventory is already mutated)
  const updatedData = { ...characterData.value }
  
  // Then save to server in background
  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Inventory updated!')
  } catch (error: any) {
    console.error('Failed to update inventory:', error)
    toast.error('Failed to save inventory')
  }
}

async function updateActions(actions: any[]) {
  // Filter out item actions (they have source item name in parentheses) - only save character actions
  const characterActions = actions.filter(a => !a.name?.includes('('))
  const updatedData = { ...characterData.value, actions: characterActions }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Actions updated!')
  } catch (error: any) {
    console.error('Failed to update actions:', error)
    toast.error('Failed to save actions')
  }
}

async function updateTraits(traits: any[]) {
  const updatedData = { ...characterData.value, traits }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Traits updated!')
  } catch (error: any) {
    console.error('Failed to update traits:', error)
    toast.error('Failed to save traits')
  }
}

async function updateSpells(spells: any[]) {
  const updatedData = { ...characterData.value, spells }
  Object.assign(props.item.data, updatedData)

  try {
    await itemsStore.updateItem(props.item.libraryId, props.item.id, {
      data: updatedData,
    })
    toast.success('Spells updated!')
  } catch (error: any) {
    console.error('Failed to update spells:', error)
    toast.error('Failed to save spells')
  }
}

// PDF Export
const uniqueSpellLevels = computed((): number[] => {
  if (!characterData.value.spells) return []
  const levels = new Set<number>(characterData.value.spells.map((s: any) => Number(s.level)))
  return Array.from(levels).sort((a, b) => a - b)
})

function getSpellsByLevel(level: number) {
  if (!characterData.value.spells) return []
  return characterData.value.spells.filter((s: any) => s.level === level)
}

function printCharacter() {
  // Get the print content
  const printContent = document.getElementById('character-pdf-export')
  if (!printContent) return
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  
  // Write the content with styles
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${props.item.name} - Character Sheet</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: #000;
            padding: 20px;
          }
          
          ${getComputedStyle(document.documentElement).cssText}
          
          /* Copy all the PDF styles */
          .pdf-export-container { width: 100%; max-width: 210mm; margin: 0 auto; background: white; color: #000; padding: 20px; font-family: Arial, sans-serif; }
          .pdf-export-container * { background: transparent; color: #000; border-color: #000; }
          .pdf-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .pdf-header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
          .pdf-character-info { font-size: 14px; color: #333; }
          .pdf-section { margin-bottom: 20px; page-break-inside: avoid; }
          .pdf-section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #666; margin-bottom: 10px; padding-bottom: 5px; }
          .pdf-stats-row { display: flex; justify-content: space-around; margin-bottom: 15px; }
          .pdf-stat-box { text-align: center; padding: 10px; border: 1px solid #000; border-radius: 5px; min-width: 100px; }
          .pdf-stat-label { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 5px; }
          .pdf-stat-value { font-size: 20px; font-weight: bold; }
          .pdf-abilities-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 15px; }
          .pdf-ability { border: 1px solid #000; padding: 8px; text-align: center; border-radius: 5px; }
          .pdf-ability-name { font-size: 11px; font-weight: bold; color: #666; text-transform: uppercase; }
          .pdf-ability-score { font-size: 24px; font-weight: bold; margin: 5px 0; }
          .pdf-ability-modifier { font-size: 16px; color: #333; }
          .pdf-ability-save { font-size: 10px; margin-top: 5px; padding-top: 5px; border-top: 1px solid #ccc; }
          .pdf-skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
          .pdf-skill { display: flex; align-items: center; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; }
          .pdf-skill-prof { margin-right: 5px; font-weight: bold; }
          .pdf-skill-name { flex: 1; }
          .pdf-skill-bonus { font-weight: bold; color: #0066cc; }
          .pdf-item { margin-bottom: 10px; padding: 8px; border: 1px solid #ddd; border-radius: 5px; page-break-inside: avoid; }
          .pdf-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
          .pdf-item-name { font-weight: bold; font-size: 14px; }
          .pdf-action-type { font-size: 11px; padding: 2px 8px; background: #eee; border-radius: 3px; text-transform: uppercase; }
          .pdf-item-meta { font-size: 11px; color: #666; margin-bottom: 3px; }
          .pdf-item-description { font-size: 12px; line-height: 1.4; margin-top: 5px; }
          .pdf-spell-slots { margin-bottom: 15px; padding: 10px; background: #f5f5f5; border-radius: 5px; font-size: 12px; }
          .pdf-slot { margin-right: 15px; font-weight: bold; display: inline-block; margin-bottom: 5px; }
          .pdf-spell-level { margin-bottom: 15px; page-break-inside: avoid; }
          .pdf-spell-level-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #0066cc; }
          .pdf-spells-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .pdf-spell-card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; page-break-inside: avoid; }
          .pdf-spell-name { font-weight: bold; font-size: 13px; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between; }
          .pdf-spell-badges { display: flex; gap: 4px; }
          .pdf-spell-meta { font-size: 10px; color: #666; margin-bottom: 5px; }
          .pdf-spell-components, .pdf-spell-duration { font-size: 10px; color: #333; margin-bottom: 3px; }
          .pdf-spell-mechanics { margin: 5px 0; padding: 5px; background: #f9f9f9; border-radius: 3px; font-size: 10px; }
          .pdf-spell-roll { margin-bottom: 2px; color: #000; }
          .pdf-concentration-note { font-style: italic; color: #666; }
          .pdf-tag { display: inline-block; font-size: 9px; padding: 2px 6px; background: #e0e0e0; border-radius: 3px; margin-right: 5px; font-weight: bold; }
          .pdf-spell-description { font-size: 11px; line-height: 1.3; margin-top: 5px; }
          .pdf-gold { font-size: 14px; margin-bottom: 10px; padding: 8px; background: #fff9e6; border-radius: 5px; }
          .pdf-inventory-item { padding: 5px; border-bottom: 1px solid #eee; font-size: 12px; }
          .pdf-inventory-equipped { margin-right: 5px; font-weight: bold; }
          .pdf-inventory-name { font-weight: bold; margin-right: 10px; }
          .pdf-inventory-qty, .pdf-inventory-weight { font-size: 10px; color: #666; margin-right: 10px; }
          .pdf-inventory-desc { font-size: 10px; color: #666; margin-top: 3px; margin-left: 20px; }
          .pdf-notes { font-size: 12px; line-height: 1.5; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .blank-lines { margin-top: 10px; }
          .blank-line { border-bottom: 1px solid #ccc; height: 20px; margin-bottom: 8px; }
          
          @media print {
            body { padding: 10mm; }
            .pdf-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `)
  
  printWindow.document.close()
  printWindow.focus()
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}
</script>

<style scoped>
.character-detail {
  width: 100%;
  position: relative;
  min-height: auto;
}

.character-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 45vw;
  height: 100%;
  max-height: 800px;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: left center;
  background-repeat: no-repeat;
  pointer-events: none;
  z-index: 0;
  opacity: 0.28;
  mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-image: 
    linear-gradient(to right, black 0%, black 60%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
  -webkit-mask-composite: source-in;
}

.character-detail > * {
  position: relative;
  z-index: 1;
}

/* Character Layout - Two Column */
.character-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  position: relative;
  padding-bottom: 24px;
}

/* Main Content Wrapper */
.main-content-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: center;
  margin-right: 424px; /* 400px sidebar + 24px gap */
}

.main-content {
  width: 100%;
  max-width: 1200px;
  position: relative;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-right: 8px;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.main-content-tabs {
  background: transparent !important;
}

.main-content-tabs :deep(.v-tab) {
  min-width: auto;
  padding: 0 16px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.main-content-window {
  background: transparent !important;
}

.main-content-window :deep(.v-window__container) {
  background: transparent !important;
}

/* Sidebar Wrapper - Fixed with max-height */
.sidebar-wrapper {
  width: 400px;
  flex-shrink: 0;
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  max-height: 85vh;
  z-index: 10;
}

.sidebar-content {
  background: rgba(30, 30, 35, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}


.sidebar-tabs {
  background: transparent !important;
}

.sidebar-tabs :deep(.v-tab) {
  min-width: auto;
  padding: 0 12px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-window {
  background: transparent !important;
}

.sidebar-window :deep(.v-window__container) {
  background: transparent !important;
}

/* Character Header */
.character-header {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.character-header .topbar-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  gap: 24px;
}

.character-header .topbar-left {
  flex: 1;
  min-width: 0;
}

.character-header .topbar-title-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.character-avatar {
  flex-shrink: 0;
}

.character-avatar :deep(.v-avatar) {
  border: 3px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.character-title-info {
  flex: 1;
  min-width: 0;
}

.character-header .topbar-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 8px 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.character-description-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.character-description {
  font-size: 0.9rem;
  opacity: 0.7;
  white-space: nowrap;
}

.header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.character-header .topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* Character Info Tooltip */
.character-info-tooltip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.tooltip-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  white-space: nowrap;
}

/* Core Stats Container - 5 equal columns */
.core-stats-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (min-width: 960px) {
  .core-stats-container {
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }
}

.stat-card {
  transition: transform 0.2s;
  min-height: 100px;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card-content {
  padding: 12px 8px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 32px !important;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-divider {
  margin: 0 2px;
  opacity: 0.7;
}

.stat-unit {
  font-size: 0.875rem;
  margin-left: 2px;
  opacity: 0.8;
}

.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.label-mobile {
  display: none;
}

.label-desktop {
  display: inline;
}

.clickable {
  cursor: pointer;
  position: relative;
}

.clickable:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

.edit-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.clickable:hover .edit-hint {
  opacity: 0.6;
}


/* Skills */
.skills-content .v-row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.skills-content .v-col {
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}

.skill-item {
  padding: 4px 6px;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s;
  font-size: 0.8rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.skill-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.skill-name-container {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill-ability {
  font-size: 0.65rem;
  opacity: 0.5;
  font-weight: 500;
  flex-shrink: 0;
}

.skill-bonus {
  color: rgb(var(--v-theme-primary));
  min-width: 28px;
  text-align: right;
  font-size: 0.8rem;
}

.quick-notes-display {
  min-height: 60px;
}

/* Transparent Tabs */
.transparent-tabs :deep(.v-tab) {
  background: transparent !important;
  border: none !important;
}

.transparent-tabs :deep(.v-slide-group__content) {
  background: transparent !important;
}

.transparent-window {
  background: transparent !important;
}

.transparent-window-item {
  background: transparent !important;
}

:deep(.v-window__container) {
  background: transparent !important;
}

/* ==================== MOBILE STYLES ==================== */
@media (max-width: 959px) {
  /* Character Layout - Mobile */
  .character-layout {
    flex-direction: column;
    gap: 16px;
  }

  .main-content-wrapper {
    margin-right: 0;
  }

  .sidebar-wrapper {
    width: 100%;
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    max-height: none;
    order: -1;
  }

  .sidebar-content {
    padding: 12px;
    max-height: 50vh;
  }

  .main-content {
    max-width: 100%;
    max-height: none;
  }

  /* Character Header - Mobile */
  .character-header .topbar-content {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }

  .character-header .topbar-title-row {
    width: 100%;
  }

  .character-avatar :deep(.v-avatar) {
    width: 56px !important;
    height: 56px !important;
  }

  .character-header .topbar-title {
    font-size: 1.5rem;
  }

  .character-description-row {
    gap: 8px;
  }

  .character-description {
    font-size: 0.85rem;
  }

  .header-tags {
    gap: 4px;
  }

  .character-header .topbar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  /* Core Stats - 2x2 grid on mobile */
  .core-stats-container {
    gap: 8px;
  }

  .stat-card {
    min-height: auto;
  }

  .stat-card-content {
    padding: 12px 8px !important;
    gap: 4px;
  }

  .stat-icon {
    font-size: 28px !important;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 1.375rem;
    font-weight: 700;
  }

  .stat-divider {
    margin: 0 2px;
    font-size: 1rem;
  }

  .stat-unit {
    font-size: 0.75rem;
  }

  .stat-label {
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }

  /* Show mobile labels, hide desktop */
  .label-mobile {
    display: inline;
  }

  .label-desktop {
    display: none;
  }

  /* Card Titles - Smaller on mobile */
  .card-title-mobile {
    padding: 12px 16px !important;
    font-size: 0.875rem !important;
  }

  .card-title-mobile .title-text {
    font-size: 0.875rem !important;
    font-weight: 600;
  }


  /* Skills - Reduce spacing and font size on mobile */
  .skills-card :deep(.v-card-text) {
    padding: 10px !important;
  }

  .skills-content .v-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .skill-item {
    padding: 3px 5px;
    border-radius: 0;
    font-size: 0.7rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  }

  .skill-name-container {
    gap: 4px;
  }

  .skill-icon {
    font-size: 11px !important;
  }

  .skill-name {
    font-size: 0.7rem;
  }

  .skill-ability {
    font-size: 0.6rem;
  }

  .skill-bonus {
    min-width: 24px;
    font-size: 0.7rem;
  }

  /* Quick Notes - Compact */
  .quick-notes-display {
    min-height: 40px;
    font-size: 0.8125rem;
  }

  /* Tabs - Smaller on mobile */
  .transparent-tabs :deep(.v-tab) {
    min-height: 36px !important;
    padding: 0 12px !important;
    font-size: 0.75rem !important;
  }

  /* General card spacing */
  :deep(.v-card-text) {
    padding: 12px !important;
  }

  :deep(.v-card-title) {
    padding: 12px 16px !important;
    font-size: 0.875rem !important;
  }
}

/* Extra small mobile screens */
@media (max-width: 599px) {
  /* Character Header - Extra Small */
  .character-header .topbar-content {
    padding: 12px;
  }

  .character-avatar :deep(.v-avatar) {
    width: 48px !important;
    height: 48px !important;
  }

  .character-header .topbar-title {
    font-size: 1.25rem;
  }

  .character-description-row {
    gap: 6px;
  }

  .character-description {
    font-size: 0.8rem;
  }

  .header-tags {
    gap: 3px;
  }

  /* Core stats still visible, just slightly smaller */
  .stat-value {
    font-size: 1.25rem;
  }

  .stat-icon {
    font-size: 24px !important;
  }

  .stat-label {
    font-size: 0.6875rem;
  }

  .stat-card-content {
    padding: 10px 6px !important;
  }


  /* Skills compact */
  .skill-item {
    padding: 2px 4px;
  }

  .skill-name-container {
    gap: 3px;
  }

  .skill-name {
    font-size: 0.65rem;
  }

  .skill-ability {
    font-size: 0.55rem;
  }

  .skill-bonus {
    font-size: 0.65rem;
    min-width: 22px;
  }
}

/* ==================== PDF EXPORT STYLES ==================== */
.pdf-export-container {
  width: 100%;
  max-width: 210mm; 
  margin: 0 auto;
  background: white !important;
  color: #000 !important;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.pdf-export-container * {
  background: transparent !important;
  color: #000 !important;
  border-color: #000 !important;
}

.pdf-export-container h1,
.pdf-export-container h2,
.pdf-export-container h3,
.pdf-export-container h4 {
  color: #000 !important;
}

/* Print styles */
@media print {
  body * {
    visibility: hidden;
  }
  
  .pdf-export-container,
  .pdf-export-container * {
    visibility: visible !important;
  }
  
  .pdf-export-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    max-width: 100%;
    padding: 10mm;
  }
  
  /* Hide dialog controls when printing */
  .v-toolbar,
  .v-overlay,
  .v-dialog__content {
    display: none !important;
  }
}

.pdf-header {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.pdf-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.pdf-character-info {
  font-size: 14px;
  color: #333 !important;
}

.pdf-section {
  margin-bottom: 20px;
  page-break-inside: avoid;
}

.pdf-section-title {
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #666;
  margin-bottom: 10px;
  padding-bottom: 5px;
}

/* Stats Row */
.pdf-stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.pdf-stat-box {
  text-align: center;
  padding: 10px;
  border: 1px solid #000;
  border-radius: 5px;
  min-width: 100px;
}

.pdf-stat-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #666 !important;
  margin-bottom: 5px;
}

.pdf-stat-value {
  font-size: 20px;
  font-weight: bold;
}

/* Abilities Grid */
.pdf-abilities-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.pdf-ability {
  border: 1px solid #000;
  padding: 8px;
  text-align: center;
  border-radius: 5px;
}

.pdf-ability-name {
  font-size: 11px;
  font-weight: bold;
  color: #666 !important;
  text-transform: uppercase;
}

.pdf-ability-score {
  font-size: 24px;
  font-weight: bold;
  margin: 5px 0;
  color: #000 !important;
}

.pdf-ability-modifier {
  font-size: 16px;
  color: #333 !important;
}

.pdf-ability-save {
  font-size: 10px;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid #ccc;
}

/* Skills Grid */
.pdf-skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}

.pdf-skill {
  display: flex;
  align-items: center;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.pdf-skill-prof {
  margin-right: 5px;
  font-weight: bold;
}

.pdf-skill-name {
  flex: 1;
}

.pdf-skill-bonus {
  font-weight: bold;
  color: #0066cc !important;
}

/* Items (Traits, Actions) */
.pdf-item {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 5px;
  page-break-inside: avoid;
}

.pdf-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.pdf-item-name {
  font-weight: bold;
  font-size: 14px;
}

.pdf-action-type {
  font-size: 11px;
  padding: 2px 8px;
  background: #eee !important;
  border-radius: 3px;
  text-transform: uppercase;
  color: #000 !important;
}

.pdf-item-meta {
  font-size: 11px;
  color: #666 !important;
  margin-bottom: 3px;
}

.pdf-item-description {
  font-size: 12px;
  line-height: 1.4;
  margin-top: 5px;
}

/* Spells */
.pdf-spell-slots {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5 !important;
  border-radius: 5px;
  font-size: 12px;
  color: #000 !important;
}

.pdf-slot {
  margin-right: 15px;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 5px;
}

.pdf-spell-level {
  margin-bottom: 15px;
  page-break-inside: avoid;
}

.pdf-spell-level-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #0066cc !important;
}

.pdf-spells-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.pdf-spell-card {
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  page-break-inside: avoid;
}

.pdf-spell-name {
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pdf-spell-badges {
  display: flex;
  gap: 4px;
}

.pdf-spell-meta {
  font-size: 10px;
  color: #666 !important;
  margin-bottom: 5px;
}

.pdf-spell-components,
.pdf-spell-duration {
  font-size: 10px;
  color: #333 !important;
  margin-bottom: 3px;
}

.pdf-spell-mechanics {
  margin: 5px 0;
  padding: 5px;
  background: #f9f9f9 !important;
  border-radius: 3px;
  font-size: 10px;
}

.pdf-spell-roll {
  margin-bottom: 2px;
  color: #000 !important;
}

.pdf-concentration-note {
  font-style: italic;
  color: #666 !important;
}

.pdf-tag {
  display: inline-block;
  font-size: 9px;
  padding: 2px 6px;
  background: #e0e0e0 !important;
  border-radius: 3px;
  margin-right: 5px;
  color: #000 !important;
  font-weight: bold;
}

.pdf-spell-description {
  font-size: 11px;
  line-height: 1.3;
  margin-top: 5px;
}

/* Inventory */
.pdf-gold {
  font-size: 14px;
  margin-bottom: 10px;
  padding: 8px;
  background: #fff9e6 !important;
  border-radius: 5px;
  color: #000 !important;
}

.pdf-inventory-item {
  padding: 5px;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.pdf-inventory-equipped {
  margin-right: 5px;
  font-weight: bold;
}

.pdf-inventory-name {
  font-weight: bold;
  margin-right: 10px;
}

.pdf-inventory-qty,
.pdf-inventory-weight {
  font-size: 10px;
  color: #666 !important;
  margin-right: 10px;
}

.pdf-inventory-desc {
  font-size: 10px;
  color: #666 !important;
  margin-top: 3px;
  margin-left: 20px;
}

/* Notes */
.pdf-notes {
  font-size: 12px;
  line-height: 1.5;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

/* Blank Lines for Manual Entries */
.blank-lines {
  margin-top: 15px;
  margin-bottom: 10px;
}

.blank-line {
  border-bottom: 1px solid #ccc !important;
  height: 24px;
  margin-bottom: 10px;
  background: transparent !important;
}
</style>

<!-- Non-scoped styles for modal/dialog context -->
<style>
/* When CharacterDetail is inside a modal/dialog - reduce sidebar height */
.v-dialog .character-detail .sidebar-wrapper {
  max-height: 75vh !important;
}

.v-dialog .character-detail .sidebar-content {
  max-height: 75vh !important;
}

.v-overlay__content .character-detail .sidebar-wrapper {
  max-height: 75vh !important;
}

.v-overlay__content .character-detail .sidebar-content {
  max-height: 75vh !important;
}
</style>
