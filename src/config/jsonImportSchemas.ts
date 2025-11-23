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
      actions: 'array (optional) - Combat actions with full mechanical details',
      'actions[].name': 'string (required) - Action name (e.g., "Longsword", "Healing Word", "Multiattack")',
      'actions[].actionType': 'string (required) - Type: "action", "bonus", "reaction", or "legendary"',
      'actions[].description': 'string (required) - Detailed action description including mechanics, effects, and flavor text',
      'actions[].toHit': 'string (optional) - Attack bonus for attack rolls. Format: "+5", "+3", "-1". Include ONLY if the action requires an attack roll. Calculate from ability modifier + proficiency if applicable.',
      'actions[].roll': 'string (optional) - Damage or healing roll ONLY. Format: "1d6 fire", "2d8+3 slashing", "1d4+1 healing", "26d6 fire". Include damage type. Do NOT include to-hit bonuses or DCs here.',
      'actions[].dc': 'string (optional) - Saving throw DC with ability. Format: "15 DEX", "18 CON", "12 WIS". Include ONLY if the action requires a saving throw. Calculate from 8 + ability modifier + proficiency.',
      'actions[].range': 'string (optional) - Attack or effect range. Format: "5 ft", "30/120 ft", "60 ft", "60 ft cone", "15 ft radius"',
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
      spells: 'array (optional) - Known spells with full mechanical details',
      'spells[].name': 'string (required) - Spell name (e.g., "Fire Bolt", "Cure Wounds", "Magic Missile")',
      'spells[].level': 'number (required, 0-9) - Spell level (0 for cantrips, 1-9 for spell levels)',
      'spells[].school': 'string (optional) - Spell school (e.g., "Evocation", "Abjuration", "Divination")',
      'spells[].castingTime': 'string (optional) - Casting time (e.g., "1 action", "1 bonus action", "1 reaction", "1 minute")',
      'spells[].range': 'string (optional) - Spell range (e.g., "Self", "Touch", "60 ft", "150 ft", "500 miles")',
      'spells[].components': 'string (optional) - Spell components (e.g., "V", "S", "M", "V, S", "V, S, M (a pinch of soot)")',
      'spells[].toHit': 'string (optional) - Spell attack bonus for spells that make attack rolls. Format: "+5", "+3". Calculate from spellcasting ability modifier + proficiency. Only include for spells like Fire Bolt, Ray of Frost, etc.',
      'spells[].roll': 'string (optional) - Damage or healing roll ONLY. Format: "1d10 fire", "8d6 fire", "1d4+1 healing", "2d8+3 cold". Include damage type. Do NOT include to-hit bonuses or DCs here.',
      'spells[].dc': 'string (optional) - Spell save DC with ability. Format: "15 DEX", "18 CON", "12 WIS". Calculate from 8 + spellcasting ability modifier + proficiency. Only include for spells requiring saving throws.',
      'spells[].duration': 'string (optional) - Spell duration (e.g., "Instantaneous", "1 minute", "1 hour", "Concentration, up to 1 minute", "Until dispelled")',
      'spells[].concentration': 'boolean (optional) - Requires concentration (true if duration includes "Concentration")',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual (true if spell has ritual tag)',
      'spells[].description': 'string (required) - Detailed spell description including effects, mechanics, and flavor text',
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
      spells: 'array (optional) - Spells the creature can cast with full mechanical details',
      'spells[].name': 'string (required) - Spell name (e.g., "Fireball", "Detect Magic", "Cure Wounds")',
      'spells[].level': 'number (required, 0-9) - Spell level (0 for cantrips, 1-9 for spell levels)',
      'spells[].school': 'string (optional) - Spell school (e.g., "Evocation", "Abjuration", "Divination")',
      'spells[].castingTime': 'string (optional) - Casting time (e.g., "1 action", "1 bonus action", "1 reaction", "1 minute")',
      'spells[].range': 'string (optional) - Spell range (e.g., "Self", "Touch", "60 ft", "150 ft", "500 miles")',
      'spells[].components': 'string (optional) - Spell components (e.g., "V", "S", "M", "V, S", "V, S, M (a pinch of soot)")',
      'spells[].toHit': 'string (optional) - Spell attack bonus for spells that make attack rolls. Format: "+5", "+3". Calculate from spellcasting ability modifier + proficiency. Only include for spells like Fire Bolt, Ray of Frost, etc.',
      'spells[].roll': 'string (optional) - Damage or healing roll ONLY. Format: "1d10 fire", "8d6 fire", "1d4+1 healing", "2d8+3 cold". Include damage type. Do NOT include to-hit bonuses or DCs here.',
      'spells[].dc': 'string (optional) - Spell save DC with ability. Format: "15 DEX", "18 CON", "12 WIS". Calculate from 8 + spellcasting ability modifier + proficiency. Only include for spells requiring saving throws.',
      'spells[].duration': 'string (optional) - Spell duration (e.g., "Instantaneous", "1 minute", "1 hour", "Concentration, up to 1 minute", "Until dispelled")',
      'spells[].concentration': 'boolean (optional) - Requires concentration (true if duration includes "Concentration")',
      'spells[].ritual': 'boolean (optional) - Can be cast as ritual (true if spell has ritual tag)',
      'spells[].description': 'string (required) - Detailed spell description including effects, mechanics, and flavor text'
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
          description: "The dragon can use its Frightful Presence. It then makes three attacks: one with its bite and two with its claws."
        },
        {
          name: "Bite",
          actionType: "action",
          toHit: "+17",
          roll: "2d10+10 piercing plus 4d6 fire",
          range: "15 ft",
          description: "Melee Weapon Attack: +17 to hit, reach 15 ft., one target. Hit: 21 (2d10 + 10) piercing damage plus 14 (4d6) fire damage."
        },
        {
          name: "Fire Breath (Recharge 5-6)",
          actionType: "action",
          dc: "24 DEX",
          roll: "26d6 fire",
          range: "60 ft cone",
          description: "The dragon exhales fire in a 60-foot cone. Each creature in that area must make a DC 24 Dexterity saving throw, taking 91 (26d6) fire damage on a failed save, or half as much damage on a successful one."
        }
      ],
      spells: [
        {
          name: "Detect Magic",
          level: 1,
          school: "Divination",
          castingTime: "1 action",
          range: "Self",
          components: "V, S",
          duration: "Concentration, up to 10 minutes",
          concentration: true,
          description: "For the duration, you sense the presence of magic within 30 feet of you. If you sense magic in this way, you can use your action to see a faint aura around any visible creature or object in the area that bears magic, and you learn its school of magic, if any."
        },
        {
          name: "Fireball",
          level: 3,
          school: "Evocation",
          castingTime: "1 action",
          range: "150 ft",
          components: "V, S, M (a tiny ball of bat guano and sulfur)",
          dc: "18 DEX",
          roll: "8d6 fire",
          duration: "Instantaneous",
          description: "A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame. Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one. The fire spreads around corners. It ignites flammable objects in the area that aren't being worn or carried."
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
    description: 'Import a note with optional chapters and content. Supports various note types: session notes, dungeons, NPCs, locations, shops, loot, quests, and more.',
    schema: {
      name: 'string (required) - Note title',
      content: 'string (required) - Main note content (supports HTML/rich text. Use <p> tags for paragraphs, <ul>/<ol> for lists, <strong>/<em> for emphasis)',
      chapters: 'array (optional) - Additional chapters for organizing content',
      'chapters[].order': 'number (optional) - Chapter order (auto-assigned if not provided, starting from 1)',
      'chapters[].title': 'string (required) - Chapter title',
      'chapters[].content': 'string (required) - Chapter content (supports HTML/rich text)',
      isPinned: 'boolean (optional) - Whether the note is pinned (default: false)'
    },
    example: JSON.stringify({
      name: "Campaign Session Notes",
      content: "<p>This session covered the party's journey through the Whispering Woods. They discovered an ancient temple and encountered several hostile creatures.</p>",
      isPinned: false,
      chapters: [
        {
          order: 1,
          title: "Travel Encounters",
          content: "<p>The party encountered a group of bandits at the crossroads. After a brief negotiation, they decided to fight. The bandits were defeated, and the party found 50 gold pieces.</p>"
        },
        {
          order: 2,
          title: "Dungeon Exploration",
          content: "<p>Upon entering the ancient ruins, the party found:</p><ul><li>A trapped hallway with pressure plates</li><li>A room with a riddle inscribed on the wall</li><li>A treasure chamber with magical items</li></ul>"
        }
      ]
    }, null, 2)
  }
}

