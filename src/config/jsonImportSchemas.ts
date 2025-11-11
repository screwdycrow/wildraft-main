import type { ItemType } from '@/types/item.types'

/**
 * JSON Import Schema interface
 */
export interface JsonImportSchema {
  title: string
  description: string
  schema: Record<string, any>
  example: string
}

/**
 * JSON Import Schemas for each item type
 * Used for importing items from JSON data
 */
export const itemTypeJsonSchemas: Partial<Record<ItemType, JsonImportSchema>> = {
  // DND 5E Character
  CHARACTER_DND_5E: {
    title: 'D&D 5E Character',
    description: 'Import a D&D 5E character with stats, skills, spells, and equipment',
    schema: {
      name: 'string (required) - Character name',
      level: 'number (required, 1-20) - Character level',
      class: 'string (required) - Character class',
      race: 'string (required) - Character race',
      subclass: 'string (optional) - Character subclass',
      background: 'string (optional) - Character background',
      alignment: 'string (optional) - Character alignment',
      experience: 'number (optional) - Experience points',
      hp: 'number (optional) - Current hit points',
      maxHp: 'number (optional) - Maximum hit points',
      ac: 'number (optional) - Armor class',
      speed: 'string (optional) - Movement speed (e.g., "30 ft")',
      initiative: 'number (optional) - Initiative modifier',
      resistances: 'string (optional) - Damage resistances',
      immunities: 'string (optional) - Damage immunities',
      // Ability Scores
      str: 'number (optional, 1-20) - Strength score',
      dex: 'number (optional, 1-20) - Dexterity score',
      con: 'number (optional, 1-20) - Constitution score',
      int: 'number (optional, 1-20) - Intelligence score',
      wis: 'number (optional, 1-20) - Wisdom score',
      cha: 'number (optional, 1-20) - Charisma score',
      // Saving Throws (boolean flags)
      strSavingThrow: 'boolean (optional) - Proficiency in Strength saves',
      dexSavingThrow: 'boolean (optional) - Proficiency in Dexterity saves',
      conSavingThrow: 'boolean (optional) - Proficiency in Constitution saves',
      intSavingThrow: 'boolean (optional) - Proficiency in Intelligence saves',
      wisSavingThrow: 'boolean (optional) - Proficiency in Wisdom saves',
      chaSavingThrow: 'boolean (optional) - Proficiency in Charisma saves',
      // Skills (array of skill objects)
      skills: 'array (optional) - Character skills',
      'skills[].name': 'string - Skill name (e.g., "Athletics")',
      'skills[].proficient': 'boolean - Has proficiency in this skill',
      'skills[].expertise': 'boolean (optional) - Has expertise in this skill',
      // Proficiencies (array)
      proficiencies: 'array (optional) - Other proficiencies',
      'proficiencies[].name': 'string - Proficiency name',
      'proficiencies[].type': 'string - Type: armor, weapon, tool, language, other',
      // Traits & Features (array)
      traits: 'array (optional) - Racial/class features',
      'traits[].name': 'string - Feature name',
      'traits[].description': 'string - Feature description',
      // Actions (array)
      actions: 'array (optional) - Combat actions',
      'actions[].name': 'string - Action name',
      'actions[].actionType': 'string - Type: action, bonus, reaction, legendary',
      'actions[].toHit': 'string (optional) - Attack bonus or to-hit value',
      'actions[].dc': 'string (optional) - Saving throw DC',
      'actions[].roll': 'string (optional) - Attack/damage roll',
      'actions[].range': 'string (optional) - Attack range',
      'actions[].description': 'string - Action description',
      // Spells
      spellSlots: 'array (optional) - Spell slots by level',
      'spellSlots[].level': 'number (1-9) - Spell level',
      'spellSlots[].max': 'number - Maximum slots',
      'spellSlots[].remaining': 'number - Remaining slots',
      customCounters: 'array (optional) - Custom counters for tracking resources',
      'customCounters[].name': 'string - Counter name',
      'customCounters[].value': 'number - Current value',
      'customCounters[].min': 'number (optional) - Minimum value',
      'customCounters[].max': 'number (optional) - Maximum value',
      'customCounters[].icon': 'string (optional) - Material Design Icon name (mdi-*)',
      'customCounters[].color': 'string (optional) - Hex or theme color name',
      'customCounters[].description': 'string (optional) - Helper text',
      spells: 'array (optional) - Known spells',
      'spells[].name': 'string - Spell name',
      'spells[].level': 'number (0-9) - Spell level (0 for cantrips)',
      'spells[].school': 'string (optional) - Spell school',
      'spells[].castingTime': 'string (optional) - Casting time',
      'spells[].range': 'string (optional) - Spell range',
      'spells[].components': 'string (optional) - Spell components',
      'spells[].roll': 'string (optional) - Spell attack/save',
      'spells[].toHit': 'string (optional) - Spell attack bonus',
      'spells[].dc': 'string (optional) - Spell save DC',
      'spells[].duration': 'string (optional) - Spell duration',
      'spells[].concentration': 'boolean (optional) - Requires concentration',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual',
      'spells[].description': 'string - Spell description',
      // Equipment
      gold: 'number (optional) - Gold pieces',
      inventory: 'array (optional) - Inventory items',
      'inventory[].name': 'string - Item name',
      'inventory[].description': 'string (optional) - Item description',
      'inventory[].quantity': 'number (optional) - Quantity',
      'inventory[].weight': 'number (optional) - Weight in lbs',
      'inventory[].equipped': 'boolean (optional) - Is equipped',
      // Notes
      quickNotes: 'string (optional) - Quick notes'
    },
    example: JSON.stringify({
      name: "Elara Moonwhisper",
      level: 5,
      class: "Druid",
      race: "Wood Elf",
      subclass: "Circle of the Moon",
      background: "Hermit",
      alignment: "Neutral Good",
      experience: 6500,
      hp: 38,
      maxHp: 38,
      ac: 14,
      speed: "30 ft",
      initiative: 2,
      resistances: "fire",
      immunities: "",
      str: 14,
      dex: 16,
      con: 16,
      int: 10,
      wis: 18,
      cha: 12,
      strSavingThrow: false,
      dexSavingThrow: false,
      conSavingThrow: true,
      intSavingThrow: false,
      wisSavingThrow: true,
      chaSavingThrow: false,
      skills: [
        { name: "Animal Handling", proficient: true },
        { name: "Medicine", proficient: true },
        { name: "Nature", proficient: true },
        { name: "Perception", proficient: false },
        { name: "Religion", proficient: false },
        { name: "Survival", proficient: true }
      ],
      traits: [
        { name: "Fey Ancestry", description: "Advantage on saves vs. charm, immune to sleep" }
      ],
      actions: [
        { name: "Staff", actionType: "action", toHit: "+4", dc: "", roll: "1d6+2 bludgeoning", range: "5 ft", description: "Quarterstaff swing" }
      ],
      spellSlots: [
        { level: 1, max: 4, remaining: 4 },
        { level: 2, max: 3, remaining: 3 },
        { level: 3, max: 2, remaining: 2 }
      ],
      customCounters: [
        { name: "Wild Shape", value: 2, min: 0, max: 2, icon: "mdi-paw", description: "Uses per short rest" },
        { name: "Starry Form", value: 1, min: 0, max: 1, icon: "mdi-star-circle" }
      ],
      spells: [
        { name: "Druidcraft", level: 0, school: "Transmutation", castingTime: "1 action", range: "30 ft", components: "V, S", duration: "Instantaneous", description: "Small nature trick" },
        { name: "Entangle", level: 1, school: "Conjuration", castingTime: "1 action", range: "90 ft", components: "V, S", duration: "Concentration, 1 minute", concentration: true, dc: "14 STR", description: "Grasping vines" }
      ],
      gold: 125,
      inventory: [
        { name: "Quarterstaff", description: "Wooden staff", quantity: 1, weight: 4, equipped: true },
        { name: "Leather Armor", description: "Basic leather armor", quantity: 1, weight: 10, equipped: true },
        { name: "Explorer's Pack", description: "Standard adventuring gear", quantity: 1, weight: 59 },
        { name: "Druidic Focus", description: "Sprig of mistletoe", quantity: 1, weight: 0 }
      ],
      quickNotes: "Circle of the Moon druid focused on wild shape combat"
    }, null, 2)
  },

  // DND 5E Stat Block (Monster/NPC)
  STAT_BLOCK_DND_5E: {
    title: 'D&D 5E Stat Block',
    description: 'Import a D&D 5E creature stat block (monster, NPC, etc.)',
    schema: {
      name: 'string (required) - Creature name',
      cr: 'string (required) - Challenge Rating (e.g., "1/2", "5", "15")',
      hp: 'number (required) - Hit points',
      ac: 'number (required) - Armor class',
      speed: 'string (required) - Movement speed (e.g., "30 ft, fly 60 ft")',
      initiative: 'number (optional) - Initiative modifier',
      resistances: 'string (optional) - Damage resistances',
      immunities: 'string (optional) - Damage immunities',
      // Basic Info
      size: 'string (optional) - Size category (Tiny, Small, Medium, Large, Huge, Gargantuan)',
      type: 'string (optional) - Creature type (e.g., humanoid, beast, dragon)',
      alignment: 'string (optional) - Alignment',
      senses: 'string (optional) - Special senses (e.g., "darkvision 60 ft")',
      languages: 'string (optional) - Languages spoken',
      // Ability Scores
      str: 'number (optional, 1-30) - Strength score',
      dex: 'number (optional, 1-30) - Dexterity score',
      con: 'number (optional, 1-30) - Constitution score',
      int: 'number (optional, 1-30) - Intelligence score',
      wis: 'number (optional, 1-30) - Wisdom score',
      cha: 'number (optional, 1-30) - Charisma score',
      // Saving Throws (boolean flags for proficiency)
      strSavingThrow: 'boolean (optional) - Proficient in Strength saves',
      dexSavingThrow: 'boolean (optional) - Proficient in Dexterity saves',
      conSavingThrow: 'boolean (optional) - Proficient in Constitution saves',
      intSavingThrow: 'boolean (optional) - Proficient in Intelligence saves',
      wisSavingThrow: 'boolean (optional) - Proficient in Wisdom saves',
      chaSavingThrow: 'boolean (optional) - Proficient in Charisma saves',
      // Traits & Abilities (array)
      traits: 'array (optional) - Special traits and abilities',
      'traits[].name': 'string - Trait name',
      'traits[].description': 'string - Trait description',
      // Actions (array)
      actions: 'array (optional) - Combat actions',
      'actions[].name': 'string - Action name',
      'actions[].actionType': 'string - Type: action, bonus, reaction, legendary',
      'actions[].toHit': 'string (optional) - Attack bonus or to-hit value',
      'actions[].dc': 'string (optional) - Saving throw DC',
      'actions[].roll': 'string (optional) - Attack/damage roll',
      'actions[].range': 'string (optional) - Attack range',
      'actions[].description': 'string - Action description',
      customCounters: 'array (optional) - Custom counters for recharge abilities or limited uses',
      'customCounters[].name': 'string - Counter name',
      'customCounters[].value': 'number - Current value',
      'customCounters[].min': 'number (optional) - Minimum value',
      'customCounters[].max': 'number (optional) - Maximum value',
      'customCounters[].icon': 'string (optional) - Material Design Icon name (mdi-*)',
      'customCounters[].color': 'string (optional) - Hex or theme color name',
      'customCounters[].description': 'string (optional) - Helper text',
      // Spells (array)
      spells: 'array (optional) - Spells the creature can cast',
      'spells[].name': 'string - Spell name',
      'spells[].level': 'number (0-9) - Spell level (0 for cantrips)',
      'spells[].school': 'string (optional) - Spell school',
      'spells[].castingTime': 'string (optional) - Casting time',
      'spells[].range': 'string (optional) - Spell range',
      'spells[].components': 'string (optional) - Spell components',
      'spells[].roll': 'string (optional) - Spell attack/save',
      'spells[].toHit': 'string (optional) - Spell attack bonus',
      'spells[].dc': 'string (optional) - Spell save DC',
      'spells[].duration': 'string (optional) - Spell duration',
      'spells[].concentration': 'boolean (optional) - Requires concentration',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual',
      'spells[].description': 'string - Spell description'
    },
    example: JSON.stringify({
      name: "Ancient Red Dragon",
      cr: "24",
      hp: 546,
      ac: 22,
      speed: "40 ft, climb 40 ft, fly 80 ft",
      initiative: 0,
      resistances: "fire",
      immunities: "",
      size: "Gargantuan",
      type: "dragon",
      alignment: "Chaotic Evil",
      senses: "blindsight 60 ft, darkvision 120 ft",
      languages: "Common, Draconic",
      str: 30,
      dex: 10,
      con: 29,
      int: 18,
      wis: 15,
      cha: 23,
      strSavingThrow: true,
      dexSavingThrow: false,
      conSavingThrow: true,
      intSavingThrow: false,
      wisSavingThrow: true,
      chaSavingThrow: true,
      traits: [
        {
          name: "Legendary Resistance (3/Day)",
          description: "If the dragon fails a saving throw, it can choose to succeed instead."
        }
      ],
      actions: [
        {
          name: "Multiattack",
          actionType: "action",
          description: "One bite and two claws."
        },
        {
          name: "Bite",
          actionType: "action",
          toHit: "+17",
          roll: "2d10+10 piercing, 4d6 fire",
          description: "Bite with flame"
        }
      ],
      spells: [
        {
          name: "Detect",
          level: 1,
          school: "Divination",
          castingTime: "1 action",
          range: "Self",
          components: "V, S",
          duration: "Concentration, 10 minutes",
          concentration: true,
          description: "Sense nearby magic"
        }
      ],
      customCounters: [
        { name: "Legendary Resistance", value: 3, min: 0, max: 3, icon: "mdi-shield-star", description: "Uses per day" },
        { name: "Fire Breath Recharge", value: 0, min: 0, max: 1, icon: "mdi-fire", color: "#E74C3C" }
      ]
    }, null, 2)
  },

  // DND 5E Magic Item
  ITEM_DND_5E: {
    title: 'D&D 5E Magic Item',
    description: 'Import a D&D 5E magic item with properties and effects',
    schema: {
      name: 'string (required) - Item name',
      rarity: 'string (required) - Rarity: common, uncommon, rare, very rare, legendary, artifact',
      itemType: 'string (required) - Item type (e.g., Weapon, Armor, Wondrous Item, Potion)',
      attunement: 'boolean (optional) - Requires attunement',
      value: 'string (optional) - Monetary value (e.g., "500 gp")',
      weight: 'number (optional) - Weight in pounds',
      damage: 'string (optional) - Damage dice (e.g., "1d8")',
      properties: 'array (optional) - Item properties (e.g., ["Finesse", "Light", "Thrown"])',
      effect: 'string (optional) - Special effects or abilities'
    },
    example: JSON.stringify({
      name: "Flame Tongue",
      rarity: "rare",
      itemType: "Weapon",
      attunement: true,
      value: "5000 gp",
      weight: 3,
      damage: "1d8 slashing",
      properties: ["Finesse", "Light"],
      effect: "While attuned to this sword, you gain +1 to attack and damage rolls. The sword sheds bright light in a 40-foot radius and dim light for another 40 feet. When you hit with it, the target takes an extra 2d6 fire damage."
    }, null, 2)
  },

  // Universal Note
  NOTE: {
    title: 'Note',
    description: 'Import a note with optional chapters and content',
    schema: {
      name: 'string (required) - Note title',
      content: 'string (required) - Main note content (supports rich text/markdown)',
      chapters: 'array (optional) - Additional chapters',
      'chapters[].order': 'number - Chapter order (auto-assigned if not provided)',
      'chapters[].title': 'string - Chapter title',
      'chapters[].content': 'string - Chapter content (supports rich text/markdown)',
      isPinned: 'boolean (optional) - Whether the note is pinned'
    },
    example: JSON.stringify({
      name: "Campaign Session Notes",
      content: "<p>This session covered the party's journey through the Whispering Woods...</p>",
      isPinned: false,
      chapters: [
        {
          order: 1,
          title: "Travel Encounters",
          content: "<p>The party encountered a group of bandits at the crossroads...</p>"
        },
        {
          order: 2,
          title: "Dungeon Exploration",
          content: "<p>Upon entering the ancient ruins, the party found...</p>"
        }
      ]
    }, null, 2)
  }
}

