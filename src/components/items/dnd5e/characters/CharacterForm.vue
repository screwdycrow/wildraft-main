<template>
  <v-form ref="formRef" @submit.prevent="handleSubmit" >
    <v-card class="glass-card mb-4 form-container" elevation="0">
      <v-card-title class="text-h5 font-weight-bold d-flex align-center  form-actions-sticky px-6">
        <v-icon icon="mdi-account-circle" color="#3498DB" size="32" class="mr-3" />
        {{ isEditMode ? 'Edit Character' : 'Create Character' }}
        <v-spacer />
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('cancel')" />
        <v-btn icon="mdi-check" size="small" variant="text" @click="handleSubmit" :loading="isLoading" />
      </v-card-title>

      <v-row no-gutters class="form-row-content">
        <!-- Vertical Tabs -->
        <v-col cols="2" class="border-e">
          <v-tabs
            v-model="activeTab"
            direction="vertical"
            color="primary"
            class="character-tabs"
          >
            <v-tab value="basic" prepend-icon="mdi-information">
              <span class="text-caption">Basic Info</span>
            </v-tab>
            <v-tab value="stats" prepend-icon="mdi-shield-account">
              <span class="text-caption">Stats</span>
            </v-tab>
            <v-tab value="traits" prepend-icon="mdi-star-circle">
              <span class="text-caption">Traits</span>
            </v-tab>
            <v-tab value="actions" prepend-icon="mdi-sword">
              <span class="text-caption">Actions</span>
            </v-tab>
            <v-tab value="spells" prepend-icon="mdi-auto-fix">
              <span class="text-caption">Spells</span>
            </v-tab>
            <v-tab value="items" prepend-icon="mdi-bag-personal">
              <span class="text-caption">Items</span>
            </v-tab>
            <v-tab value="description" prepend-icon="mdi-text">
              <span class="text-caption">Description</span>
            </v-tab>
            <v-tab value="files" prepend-icon="mdi-paperclip">
              <span class="text-caption">Files</span>
            </v-tab>
          </v-tabs>
          
          <v-divider class="my-4" />
          
          <!-- Tags Selector at bottom -->
          <div class="px-4">
            <tag-selector
              v-model="formData.tagIds"
              :library-id="libraryId"
              hint=""
              show-add-button
              @add-tag="showTagDialog = true"
            />
          </div>
        </v-col>

        <!-- Content Area -->
        <v-col cols="10">
          <v-card-text class="pa-6 form-content-scrollable">
            <v-window v-model="activeTab">
              <!-- Basic Info Tab -->
              <v-window-item value="basic">
                <h3 class="text-h6 mb-4">Character Information</h3>
                
                <v-row>
                  <v-col cols="12" md="8">
                    <v-text-field
                      v-model="formData.name"
                      label="Character Name"
                      :rules="[(v) => !!v || 'Name is required']"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.level"
                      label="Level"
                      :rules="[(v) => !!v || 'Level is required']"
                      type="number"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.race"
                      label="Race"
                      :rules="[(v) => !!v || 'Race is required']"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.class"
                      label="Class"
                      :rules="[(v) => !!v || 'Class is required']"
                      variant="outlined"
                      required
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.subclass"
                      label="Subclass (optional)"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.background"
                      label="Background (optional)"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.playerName"
                      label="Player Name (optional)"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model.number="formData.data.experience"
                      label="Experience Points"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="12" md="4">
                    <v-select
                      v-model="formData.data.alignment"
                      :items="alignmentOptions"
                      label="Alignment"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.proficiencyBonus"
                      label="Proficiency Bonus"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                      prefix="+"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-switch
                      v-model="formData.data.inspiration"
                      label="Has Inspiration"
                      color="amber"
                      hide-details
                      inset
                    />
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Stats Tab -->
              <v-window-item value="stats">
                <h3 class="text-h6 mb-4">Combat Statistics</h3>
                
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.ac"
                      label="Armor Class"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.hp"
                      label="Current HP"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model.number="formData.data.maxHp"
                      label="Max HP"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-text-field
                  v-model="formData.data.speed"
                  label="Speed"
                  variant="outlined"
                  placeholder="e.g., 30 ft."
                  density="comfortable"
                  class="mb-4"
                />

                <v-divider class="my-6" />

                <h3 class="text-h6 mb-4">Ability Scores</h3>
                <v-row>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.str"
                      label="STR"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.dex"
                      label="DEX"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.con"
                      label="CON"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.int"
                      label="INT"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.wis"
                      label="WIS"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="4" sm="2">
                    <v-text-field
                      v-model.number="formData.data.cha"
                      label="CHA"
                      type="number"
                      variant="outlined"
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-divider class="my-6" />

                <h3 class="text-h6 mb-4">Additional Info</h3>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.languages"
                      label="Languages"
                      variant="outlined"
                      placeholder="e.g., Common, Elvish"
                      density="comfortable"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="formData.data.senses"
                      label="Senses"
                      variant="outlined"
                      placeholder="e.g., darkvision 60 ft."
                      density="comfortable"
                    />
                  </v-col>
                </v-row>

                <v-divider class="my-6" />

                <!-- Skills -->
                <div class="d-flex align-center mb-3">
                  <h3 class="text-h6">Skills</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addSkill"
                  >
                    Add Skill
                  </v-btn>
                </div>

                <v-row v-if="formData.data.skills && formData.data.skills.length > 0">
                  <v-col
                    v-for="(skill, index) in formData.data.skills"
                    :key="'skill-' + index"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card variant="outlined" class="pa-3">
                      <div class="d-flex align-center mb-2">
                        <v-text-field
                          v-model="skill.name"
                          label="Skill Name"
                          variant="outlined"
                          density="compact"
                          hide-details
                        />
                        <v-btn
                          icon="mdi-delete"
                          size="x-small"
                          variant="text"
                          color="error"
                          class="ml-2"
                          @click="removeSkill(index)"
                        />
                      </div>
                      <v-row dense class="mt-2">
                        <v-col cols="6">
                          <v-select
                            v-model="skill.ability"
                            :items="abilityOptions"
                            label="Ability"
                            variant="outlined"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                        <v-col cols="6">
                          <v-text-field
                            v-model.number="skill.bonus"
                            label="Bonus"
                            type="number"
                            variant="outlined"
                            density="compact"
                            hide-details
                            prefix="+"
                          />
                        </v-col>
                      </v-row>
                      <div class="d-flex gap-2 mt-2">
                        <v-checkbox
                          v-model="skill.proficient"
                          label="Proficient"
                          density="compact"
                          hide-details
                        />
                        <v-checkbox
                          v-model="skill.expertise"
                          label="Expertise"
                          density="compact"
                          hide-details
                        />
                      </div>
                    </v-card>
                  </v-col>
                </v-row>

                <v-alert v-else type="info" variant="tonal" density="compact">
                  No skills added. Click "Add Skill" to add skill proficiencies.
                </v-alert>

                <v-divider class="my-6" />

                <!-- Proficiencies -->
                <div class="d-flex align-center mb-3">
                  <h3 class="text-h6">Proficiencies</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addProficiency"
                  >
                    Add Proficiency
                  </v-btn>
                </div>

                <v-row v-if="formData.data.proficiencies && formData.data.proficiencies.length > 0">
                  <v-col
                    v-for="(prof, index) in formData.data.proficiencies"
                    :key="'prof-' + index"
                    cols="12"
                    md="6"
                    lg="4"
                  >
                    <v-card variant="outlined" class="pa-3">
                      <div class="d-flex align-center gap-2">
                        <v-text-field
                          v-model="prof.name"
                          label="Proficiency"
                          variant="outlined"
                          density="compact"
                          hide-details
                        />
                        <v-select
                          v-model="prof.type"
                          :items="proficiencyTypes"
                          variant="outlined"
                          density="compact"
                          hide-details
                          style="max-width: 140px;"
                        />
                        <v-btn
                          icon="mdi-delete"
                          size="x-small"
                          variant="text"
                          color="error"
                          @click="removeProficiency(index)"
                        />
                      </div>
                    </v-card>
                  </v-col>
                </v-row>

                <v-alert v-else type="info" variant="tonal" density="compact">
                  No proficiencies added. Click "Add Proficiency" to add armor, weapon, tool, or other proficiencies.
                </v-alert>
              </v-window-item>

              <!-- Traits Tab -->
              <v-window-item value="traits">
                <div class="d-flex align-center mb-4">
                  <h3 class="text-h6">Racial & Class Features</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addTrait"
                  >
                    Add Feature
                  </v-btn>
                </div>

                <p class="text-caption text-grey-lighten-1 mb-4">
                  Add racial traits, class features, and other passive abilities.
                </p>

                <v-expansion-panels v-if="formData.data.traits && formData.data.traits.length > 0">
                  <v-expansion-panel
                    v-for="(trait, index) in formData.data.traits"
                    :key="'trait-' + index"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center w-100">
                        <v-icon icon="mdi-star-circle" class="mr-2" color="warning" />
                        <span class="font-weight-bold">{{ trait.name || 'Unnamed Feature' }}</span>
                        <v-spacer />
                        <v-btn
                          icon="mdi-delete"
                          size="x-small"
                          variant="text"
                          color="error"
                          @click.stop="removeTrait(index)"
                        />
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-text-field
                        v-model="trait.name"
                        label="Feature Name"
                        variant="outlined"
                        density="comfortable"
                        class="mb-3"
                      />
                      <v-textarea
                        v-model="trait.description"
                        label="Description"
                        variant="outlined"
                        rows="3"
                      />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-alert v-else type="info" variant="tonal">
                  No features added yet. Click "Add Feature" to add racial traits or class features.
                </v-alert>
              </v-window-item>

              <!-- Actions Tab (same as stat block) -->
              <v-window-item value="actions">
                <div class="d-flex align-center mb-4">
                  <h3 class="text-h6">Actions</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addAction"
                  >
                    Add Action
                  </v-btn>
                </div>

                <p class="text-caption text-grey-lighten-1 mb-4">
                  Combat actions including attacks, spells, and special abilities.
                </p>

                <div v-if="formData.data.actions && formData.data.actions.length > 0">
                  <!-- Actions by Type (same grouping as stat block) -->
                  <div v-if="actionsByType.action.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">Actions</h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.action"
                        :key="'action-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Action' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Bonus Actions -->
                  <div v-if="actionsByType.bonus.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">Bonus Actions</h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.bonus"
                        :key="'bonus-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Bonus Action' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Reactions -->
                  <div v-if="actionsByType.reaction.length > 0" class="mb-4">
                    <h4 class="text-subtitle-1 font-weight-bold mb-2">Reactions</h4>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(action, index) in actionsByType.reaction"
                        :key="'reaction-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-bold">{{ action.action.name || 'Unnamed Reaction' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeAction(action.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <action-form-fields :action="action.action" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>
                </div>

                <v-alert v-else type="info" variant="tonal">
                  No actions added yet. Click "Add Action" to create combat actions.
                </v-alert>
              </v-window-item>

              <!-- Spells Tab -->
              <v-window-item value="spells">
                <h3 class="text-h6 mb-4">Spellcasting</h3>

                <!-- Spell Slots -->
                <v-card class="glass-card mb-4" variant="outlined">
                  <v-card-title class="text-subtitle-1">
                    <v-icon icon="mdi-cards-diamond" class="mr-2" />
                    Spell Slots
                  </v-card-title>
                  <v-card-text>
                    <v-row dense>
                      <v-col
                        v-for="level in 9"
                        :key="'slot-' + level"
                        cols="6"
                        sm="4"
                        md="3"
                        lg="2"
                      >
                        <v-card variant="tonal" class="pa-2">
                          <div class="text-caption text-center mb-1 font-weight-bold">Lv {{ level }}</div>
                          <v-row dense no-gutters>
                            <v-col cols="6" class="pr-1">
                              <v-text-field
                                v-model.number="getOrCreateSpellSlot(level).remaining"
                                type="number"
                                variant="outlined"
                                density="compact"
                                hide-details
                                placeholder="0"
                                class="text-center"
                              >
                                <template #prepend-inner>
                                  <span class="text-caption">R:</span>
                                </template>
                              </v-text-field>
                            </v-col>
                            <v-col cols="6" class="pl-1">
                              <v-text-field
                                v-model.number="getOrCreateSpellSlot(level).max"
                                type="number"
                                variant="outlined"
                                density="compact"
                                hide-details
                                placeholder="0"
                                class="text-center"
                              >
                                <template #prepend-inner>
                                  <span class="text-caption">M:</span>
                                </template>
                              </v-text-field>
                            </v-col>
                          </v-row>
                        </v-card>
                      </v-col>
                    </v-row>
                    <v-alert type="info" variant="tonal" density="compact" class="mt-3">
                      R = Remaining, M = Max. Set max slots for each spell level.
                    </v-alert>
                  </v-card-text>
                </v-card>

                <!-- Spells List -->
                <div class="d-flex align-center mb-4">
                  <h4 class="text-subtitle-1">Known Spells</h4>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addSpell"
                  >
                    Add Spell
                  </v-btn>
                </div>

                <div v-if="spellsByLevel && Object.keys(spellsByLevel).length > 0">
                  <!-- Cantrips -->
                  <div v-if="spellsByLevel[0] && spellsByLevel[0].length > 0" class="mb-4">
                    <h5 class="text-body-1 font-weight-bold mb-2">Cantrips</h5>
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(spell, index) in spellsByLevel[0]"
                        :key="'cantrip-' + index"
                      >
                        <v-expansion-panel-title>
                          <div class="d-flex align-center w-100">
                            <span class="font-weight-medium">{{ spell.spell.name || 'Unnamed Spell' }}</span>
                            <v-spacer />
                            <v-btn
                              icon="mdi-delete"
                              size="x-small"
                              variant="text"
                              color="error"
                              @click.stop="removeSpell(spell.originalIndex)"
                            />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <spell-form-fields :spell="spell.spell" />
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </div>

                  <!-- Leveled Spells -->
                  <div
                    v-for="level in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                    :key="'level-' + level"
                  >
                    <div v-if="spellsByLevel[level] && spellsByLevel[level].length > 0" class="mb-4">
                      <h5 class="text-body-1 font-weight-bold mb-2">Level {{ level }}</h5>
                      <v-expansion-panels>
                        <v-expansion-panel
                          v-for="(spell, index) in spellsByLevel[level]"
                          :key="'spell-' + level + '-' + index"
                        >
                          <v-expansion-panel-title>
                            <div class="d-flex align-center w-100">
                              <span class="font-weight-medium">{{ spell.spell.name || 'Unnamed Spell' }}</span>
                              <v-spacer />
                              <v-btn
                                icon="mdi-delete"
                                size="x-small"
                                variant="text"
                                color="error"
                                @click.stop="removeSpell(spell.originalIndex)"
                              />
                            </div>
                          </v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <spell-form-fields :spell="spell.spell" />
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </div>
                  </div>
                </div>

                <v-alert v-else type="info" variant="tonal">
                  No spells added yet. Click "Add Spell" if this character is a spellcaster.
                </v-alert>
              </v-window-item>

              <!-- Items Tab -->
              <v-window-item value="items">
                <div class="d-flex align-center mb-4">
                  <h3 class="text-h6">Equipment & Items</h3>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    @click="addItem"
                  >
                    Add Item
                  </v-btn>
                </div>

                <p class="text-caption text-grey-lighten-1 mb-4">
                  Character's inventory, equipment, and treasure.
                </p>

                <v-expansion-panels v-if="formData.data.items && formData.data.items.length > 0">
                  <v-expansion-panel
                    v-for="(item, index) in formData.data.items"
                    :key="'item-' + index"
                  >
                    <v-expansion-panel-title>
                      <div class="d-flex align-center w-100">
                        <v-icon icon="mdi-bag-personal" class="mr-2" color="amber" />
                        <span class="font-weight-bold">{{ item.title || 'Unnamed Item' }}</span>
                        <v-spacer />
                        <v-btn
                          icon="mdi-delete"
                          size="x-small"
                          variant="text"
                          color="error"
                          @click.stop="removeItem(index)"
                        />
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row>
                        <v-col cols="12" md="8">
                          <v-text-field
                            v-model="item.title"
                            label="Item Name"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-text-field
                            v-model.number="item.uses"
                            label="Uses/Quantity"
                            type="number"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="item.gold"
                            label="Value (optional)"
                            variant="outlined"
                            density="comfortable"
                            placeholder="e.g., 50 gp"
                          />
                        </v-col>
                        <v-col cols="12">
                          <v-textarea
                            v-model="item.description"
                            label="Description (optional)"
                            variant="outlined"
                            rows="2"
                          />
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <v-alert v-else type="info" variant="tonal">
                  No items in inventory. Click "Add Item" to add equipment or treasure.
                </v-alert>
              </v-window-item>

              <!-- Description Tab -->
              <v-window-item value="description">
                <h3 class="text-h6 mb-3">Character Background</h3>
                <p class="text-caption text-grey-lighten-1 mb-4">
                  Add character backstory, personality, appearance, and narrative details.
                </p>
                <tip-tap-editor
                  v-model="formData.description"
                  placeholder="Describe your character's appearance, personality, backstory..."
                  min-height="400px"
                />
              </v-window-item>

              <!-- Files Tab -->
              <v-window-item value="files">
                <h3 class="text-h6 mb-3">Attached Files</h3>
                <p class="text-caption text-grey-lighten-1 mb-4">
                  Upload character portraits, reference images, or related files.
                </p>
                <file-attachment-selector v-model="formData.fileIds" />
                
                <v-divider class="my-6" />
                
                <featured-image-selector
                  v-model="formData.featuredImageId"
                  :file-ids="formData.fileIds"
                />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-col>
      </v-row>

      <v-divider />
      
    </v-card>

    <!-- Tag Creation Dialog -->
    <tag-creation-dialog
      v-model="showTagDialog"
      :library-id="libraryId"
      @created="handleTagCreated"
    />
  </v-form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { VForm } from 'vuetify/components'
import type { LibraryItem, CreateLibraryItemPayload, UpdateLibraryItemPayload, CharacterData, Action, Trait, Spell, SpellSlot, CharacterItem, Skill, Proficiency } from '@/types/item.types'
import TagSelector from '@/components/tags/TagSelector.vue'
import TipTapEditor from '@/components/common/TipTapEditor.vue'
import FileAttachmentSelector from '@/components/items/common/FileAttachmentSelector.vue'
import FeaturedImageSelector from '@/components/items/common/FeaturedImageSelector.vue'
import TagCreationDialog from '@/components/tags/TagCreationDialog.vue'
import ActionFormFields from '../stat-blocks/ActionFormFields.vue'
import SpellFormFields from '../stat-blocks/SpellFormFields.vue'

interface Props {
  item?: LibraryItem | null
  libraryId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [data: CreateLibraryItemPayload | UpdateLibraryItemPayload, callback?: (success: boolean) => void]
  cancel: []
}>()

const formRef = ref<VForm>()
const isLoading = ref(false)
const activeTab = ref('basic')
const showTagDialog = ref(false)

const alignmentOptions = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
]

const abilityOptions = [
  { title: 'STR', value: 'str' },
  { title: 'DEX', value: 'dex' },
  { title: 'CON', value: 'con' },
  { title: 'INT', value: 'int' },
  { title: 'WIS', value: 'wis' },
  { title: 'CHA', value: 'cha' },
]

const proficiencyTypes = [
  { title: 'Armor', value: 'armor' },
  { title: 'Weapon', value: 'weapon' },
  { title: 'Tool', value: 'tool' },
  { title: 'Language', value: 'language' },
  { title: 'Saving Throw', value: 'saving_throw' },
  { title: 'Other', value: 'other' },
]

const formData = ref<{
  name: string
  description: string
  data: CharacterData
  tagIds: number[]
  fileIds: number[]
  featuredImageId: number | null
}>({
  name: '',
  description: '',
  data: {
    level: 1,
    class: '',
    race: '',
    subclass: '',
    background: '',
    playerName: '',
    experience: 0,
    proficiencyBonus: 2,
    inspiration: false,
    str: undefined,
    dex: undefined,
    con: undefined,
    int: undefined,
    wis: undefined,
    cha: undefined,
    hp: undefined,
    maxHp: undefined,
    ac: undefined,
    speed: '',
    alignment: '',
    languages: '',
    senses: '',
    actions: [],
    traits: [],
    spells: [],
    spellSlots: [],
    items: [],
    skills: [],
    proficiencies: [],
  },
  tagIds: [],
  fileIds: [],
  featuredImageId: null,
})

const isEditMode = computed(() => !!props.item)

function handleTagCreated(tagId: number) {
  if (!formData.value.tagIds.includes(tagId)) {
    formData.value.tagIds.push(tagId)
  }
}

// Group actions by type
const actionsByType = computed(() => {
  const grouped: Record<string, Array<{ action: Action; originalIndex: number }>> = {
    action: [],
    bonus: [],
    reaction: [],
    legendary: [],
  }

  formData.value.data.actions?.forEach((action, index) => {
    const type = action.actionType || 'action'
    grouped[type].push({ action, originalIndex: index })
  })

  return grouped
})

// Group spells by level
const spellsByLevel = computed(() => {
  const grouped: Record<number, Array<{ spell: Spell; originalIndex: number }>> = {}
  
  formData.value.data.spells?.forEach((spell, index) => {
    const level = spell.level || 0
    if (!grouped[level]) {
      grouped[level] = []
    }
    grouped[level].push({ spell, originalIndex: index })
  })
  
  return grouped
})

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value.name = newItem.name
    formData.value.description = newItem.description || ''
    formData.value.data = { ...newItem.data } as CharacterData
    formData.value.tagIds = newItem.tags?.map(t => t.id) || []
    formData.value.fileIds = newItem.userFiles?.map(f => f.id) || []
    formData.value.featuredImageId = newItem.featuredImageId || null
    
    // Ensure arrays exist
    if (!formData.value.data.actions) formData.value.data.actions = []
    if (!formData.value.data.traits) formData.value.data.traits = []
    if (!formData.value.data.spells) formData.value.data.spells = []
    if (!formData.value.data.spellSlots) formData.value.data.spellSlots = []
    if (!formData.value.data.items) formData.value.data.items = []
    if (!formData.value.data.skills) formData.value.data.skills = []
    if (!formData.value.data.proficiencies) formData.value.data.proficiencies = []
  }
}, { immediate: true })

// Trait management
const addTrait = () => {
  formData.value.data.traits!.push({ name: '', description: '' })
}

const removeTrait = (index: number) => {
  formData.value.data.traits!.splice(index, 1)
}

// Action management
const addAction = () => {
  formData.value.data.actions!.push({ 
    name: '', 
    actionType: 'action',
    description: '', 
    roll: '', 
    range: '' 
  })
}

const removeAction = (index: number) => {
  formData.value.data.actions!.splice(index, 1)
}

// Spell management
const addSpell = () => {
  formData.value.data.spells!.push({
    name: '',
    level: 0,
    description: '',
    school: '',
    castingTime: '',
    range: '',
    components: '',
    duration: '',
    concentration: false,
    ritual: false,
  })
}

const removeSpell = (index: number) => {
  formData.value.data.spells!.splice(index, 1)
}

// Item management
const addItem = () => {
  formData.value.data.items!.push({
    title: '',
    description: '',
    uses: 1,
    gold: '',
  })
}

const removeItem = (index: number) => {
  formData.value.data.items!.splice(index, 1)
}

// Get or create spell slot for a level
const getOrCreateSpellSlot = (level: number): SpellSlot => {
  let slot = formData.value.data.spellSlots!.find(s => s.level === level)
  if (!slot) {
    slot = { level, max: 0, remaining: 0 }
    formData.value.data.spellSlots!.push(slot)
  }
  return slot
}

// Skill management
const addSkill = () => {
  formData.value.data.skills!.push({
    name: '',
    ability: 'str',
    proficient: false,
    expertise: false,
    bonus: 0,
  })
}

const removeSkill = (index: number) => {
  formData.value.data.skills!.splice(index, 1)
}

// Proficiency management
const addProficiency = () => {
  formData.value.data.proficiencies!.push({
    name: '',
    type: 'other',
  })
}

const removeProficiency = (index: number) => {
  formData.value.data.proficiencies!.splice(index, 1)
}

async function handleSubmit() {
  if (isLoading.value) return

  const { valid } = await formRef.value!.validate()
  if (!valid) return

  isLoading.value = true

  // Clean up data object - remove undefined/null/empty values except for arrays
  const cleanData: Record<string, any> = {}
  Object.keys(formData.value.data).forEach(key => {
    const value = formData.value.data[key as keyof CharacterData]
    if (Array.isArray(value)) {
      // Always include arrays even if empty
      cleanData[key] = value
    } else if (value !== undefined && value !== null && value !== '') {
      cleanData[key] = value
    }
  })

  const payload = {
    name: formData.value.name.trim(),
    description: formData.value.description || undefined,
    data: cleanData,
    tagIds: formData.value.tagIds,
    fileIds: formData.value.fileIds,
    featuredImageId: formData.value.featuredImageId || undefined,
    ...(isEditMode.value ? {} : { type: 'CHARACTER_DND_5E' as const }),
  }

  console.log('Character Form Payload:', JSON.stringify(payload, null, 2))

  emit('submit', payload, (success: boolean) => {
    isLoading.value = false
  })
}
</script>

<style scoped>
.character-tabs :deep(.v-tab) {
  justify-content: flex-start;
  min-height: 48px;
  text-transform: none;
  letter-spacing: normal;
}

.character-tabs :deep(.v-tab--selected) {
  background: rgba(52, 152, 219, 0.15);
  border-right: 3px solid #3498DB;
}

.border-e {
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.form-container {
  display: flex;
  flex-direction: column;
}

.form-row-content {
  flex: 1;
 
}

.form-content-scrollable {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 24px;
}

.form-actions-sticky {
  position: sticky;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}
</style>
