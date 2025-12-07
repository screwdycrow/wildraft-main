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
    description: `Import a D&D 5E character with stats, skills, spells, and equipment.

IMPORTANT - ITEM ACTIONS vs CHARACTER ACTIONS:
- Weapon attacks (Longsword, Bow, etc.) should be added as INVENTORY ITEMS with actions, NOT as character actions
- Inventory items with actions will automatically appear in the Combat tab when equipped
- Character actions[] should ONLY contain special abilities that are NOT from items (e.g., Breath Weapon, Wild Shape, Channel Divinity)
- For weapons, use inventory items with useCharacterStats: true to auto-calculate toHit and damage

AC CALCULATION:
- Base AC without armor = 10 + DEX modifier
- Light armor (leather): 11 + DEX modifier, Studded: 12 + DEX modifier
- Medium armor (chain shirt): 13 + DEX (max 2), Scale: 14 + DEX (max 2), Breastplate: 14 + DEX (max 2), Half-plate: 15 + DEX (max 2)
- Heavy armor: Ring: 14, Chain: 16, Splint: 17, Plate: 18 (no DEX bonus)
- Shield adds +2 AC
- Set ac field to BASE AC value (the armor's base), equipment modifiers will be added on top

EQUIPMENT MODIFIERS:
- Items in inventory can have modifiers (ac, str, dex, etc.) that apply when equipped
- Example: +1 Shield would have modifiers: { ac: 1 } (the +1 bonus, not the full +2 shield bonus)`,
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
      ac: 'number (required) - BASE Armor Class (from armor worn, NOT including magic item bonuses - those go in item modifiers)',
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
      // Actions (array) - ONLY for special abilities NOT from items
      actions: 'array (optional) - ONLY special class/racial abilities that are NOT weapon attacks. Weapon attacks should be inventory items with actions!',
      'actions[].name': 'string (required) - Action name (e.g., "Breath Weapon", "Wild Shape", "Channel Divinity" - NOT weapon names)',
      'actions[].actionType': 'string (required) - Type: "action", "bonus", "reaction", or "legendary"',
      'actions[].description': 'string (required) - Detailed action description including mechanics, effects, and flavor text',
      'actions[].toHit': 'string (optional) - Attack bonus. Format: "+5". Only for non-weapon special attacks.',
      'actions[].roll': 'string (optional) - Damage or effect roll. Format: "2d6 fire", "8d6 lightning". Include damage type.',
      'actions[].dc': 'string (optional) - Saving throw DC with ability. Format: "15 DEX", "18 CON". Calculate from 8 + ability modifier + proficiency.',
      'actions[].range': 'string (optional) - Effect range. Format: "30 ft cone", "15 ft radius", "60 ft"',
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
      // Equipment - WEAPONS AND ITEMS SHOULD HAVE ACTIONS HERE (not in character actions[])
      gold: 'number (optional) - Gold pieces',
      inventory: 'array (required for combat characters) - Inventory items. IMPORTANT: All weapons should be here with actions!',
      'inventory[].name': 'string - Item name (e.g., "Longsword", "+1 Longbow", "Shield", "Chain Mail")',
      'inventory[].description': 'string (optional) - Item description',
      'inventory[].quantity': 'number (optional) - Quantity (default 1)',
      'inventory[].weight': 'number (optional) - Weight in lbs',
      'inventory[].equipped': 'boolean (required for weapons/armor) - Set to true for worn/wielded items',
      'inventory[].toHit': 'string (optional) - Simple attack bonus for quick items',
      'inventory[].dc': 'string (optional) - Simple save DC',
      'inventory[].roll': 'string (optional) - Simple damage roll',
      'inventory[].range': 'string (optional) - Attack range',
      'inventory[].actions': 'array (required for weapons) - Actions this item grants when equipped. These appear in Combat tab!',
      'inventory[].actions[].name': 'string - Action name (e.g., "Longsword Attack", "Longbow Shot")',
      'inventory[].actions[].actionType': 'string - Usually "action" for attacks',
      'inventory[].actions[].useCharacterStats': 'boolean (RECOMMENDED: true) - Auto-calculate toHit/damage from character stats. Set true for all weapons!',
      'inventory[].actions[].abilityModifier': 'string (required if useCharacterStats) - "str" for melee, "dex" for ranged/finesse',
      'inventory[].actions[].itemBonus': 'number (optional) - Magic bonus (1 for +1 weapon, 2 for +2, etc.)',
      'inventory[].actions[].proficient': 'boolean (default true) - Character proficient with this weapon',
      'inventory[].actions[].damageDice': 'string (required if useCharacterStats) - Weapon damage dice (e.g., "1d8", "2d6", "1d10")',
      'inventory[].actions[].damageType': 'string (required if useCharacterStats) - Damage type (e.g., "slashing", "piercing", "bludgeoning")',
      'inventory[].actions[].addAbilityToDamage': 'boolean (default true) - Add ability modifier to damage',
      'inventory[].actions[].toHit': 'string (only if useCharacterStats is false) - Fixed attack bonus',
      'inventory[].actions[].dc': 'string (optional) - Save DC for special effects',
      'inventory[].actions[].roll': 'string (only if useCharacterStats is false) - Fixed damage roll',
      'inventory[].actions[].range': 'string (required) - "5ft" for melee, "80/320ft" for longbow, etc.',
      'inventory[].actions[].description': 'string - Brief description of the attack',
      'inventory[].modifiers': 'object (optional) - Stat modifiers applied when equipped (same structure as magic item modifiers)',
      'inventory[].modifiers.str': 'number (optional) - Strength modifier',
      'inventory[].modifiers.dex': 'number (optional) - Dexterity modifier',
      'inventory[].modifiers.con': 'number (optional) - Constitution modifier',
      'inventory[].modifiers.int': 'number (optional) - Intelligence modifier',
      'inventory[].modifiers.wis': 'number (optional) - Wisdom modifier',
      'inventory[].modifiers.cha': 'number (optional) - Charisma modifier',
      'inventory[].modifiers.ac': 'number (optional) - Armor Class bonus',
      'inventory[].modifiers.maxHp': 'number (optional) - Maximum HP bonus',
      'inventory[].modifiers.speed': 'number (optional) - Speed bonus in feet',
      'inventory[].modifiers.initiative': 'number (optional) - Initiative bonus',
      'inventory[].modifiers.savingThrowBonus': 'number (optional) - Bonus to all saving throws',
      'inventory[].modifiers.resistances': 'string (optional) - Additional resistances (comma-separated)',
      'inventory[].modifiers.immunities': 'string (optional) - Additional immunities (comma-separated)',
      // Notes
      quickNotes: 'string (optional) - Quick notes'
    },
    example: JSON.stringify({
      name: "Kira Shadowstrike",
      level: 5,
      class: "Fighter",
      race: "Human",
      subclass: "Champion",
      background: "Soldier",
      alignment: "Lawful Good",
      experience: 6500,
      hp: 44,
      maxHp: 44,
      ac: 18,
      speed: "30 ft",
      initiative: 2,
      resistances: "",
      immunities: "",
      str: 18,
      dex: 14,
      con: 16,
      int: 10,
      wis: 12,
      cha: 10,
      strSavingThrow: true,
      dexSavingThrow: false,
      conSavingThrow: true,
      intSavingThrow: false,
      wisSavingThrow: false,
      chaSavingThrow: false,
      skills: [
        { name: "Athletics", proficient: true },
        { name: "Intimidation", proficient: true },
        { name: "Perception", proficient: true },
        { name: "Survival", proficient: true }
      ],
      traits: [
        { name: "Fighting Style: Defense", description: "+1 AC while wearing armor (already included in base AC)" },
        { name: "Second Wind", description: "Bonus action: Regain 1d10+5 HP. Recharges on short rest." },
        { name: "Action Surge", description: "Take an additional action on your turn. Recharges on short rest." },
        { name: "Improved Critical", description: "Critical hit on 19-20" }
      ],
      actions: [
        { name: "Second Wind", actionType: "bonus", roll: "1d10+5 healing", description: "Regain hit points as a bonus action" }
      ],
      spellSlots: [],
      customCounters: [
        { name: "Second Wind", value: 1, min: 0, max: 1, icon: "mdi-heart-pulse", description: "Short rest recharge" },
        { name: "Action Surge", value: 1, min: 0, max: 1, icon: "mdi-lightning-bolt", description: "Short rest recharge" }
      ],
      spells: [],
      gold: 150,
      inventory: [
        {
          name: "+1 Longsword",
          description: "A finely crafted magical blade",
          quantity: 1,
          weight: 3,
          equipped: true,
          actions: [{
            name: "Longsword Attack",
            actionType: "action",
            useCharacterStats: true,
            abilityModifier: "str",
            itemBonus: 1,
            proficient: true,
            damageDice: "1d8",
            damageType: "slashing",
            addAbilityToDamage: true,
            range: "5ft",
            description: "Melee weapon attack with magical longsword"
          }]
        },
        {
          name: "Longbow",
          description: "Standard longbow",
          quantity: 1,
          weight: 2,
          equipped: true,
          actions: [{
            name: "Longbow Shot",
            actionType: "action",
            useCharacterStats: true,
            abilityModifier: "dex",
            itemBonus: 0,
            proficient: true,
            damageDice: "1d8",
            damageType: "piercing",
            addAbilityToDamage: true,
            range: "150/600ft",
            description: "Ranged weapon attack"
          }]
        },
        {
          name: "Chain Mail",
          description: "Heavy armor, AC 16",
          quantity: 1,
          weight: 55,
          equipped: true,
          modifiers: {}
        },
        {
          name: "+1 Shield",
          description: "Magical shield",
          quantity: 1,
          weight: 6,
          equipped: true,
          modifiers: { ac: 1 }
        },
        { name: "Arrows", description: "Quiver of 20 arrows", quantity: 20, weight: 1 },
        { name: "Explorer's Pack", description: "Standard adventuring gear", quantity: 1, weight: 59 }
      ],
      quickNotes: "Champion fighter - AC 18 (chain mail 16 + Fighting Style +1 + magic shield +1). Crits on 19-20!"
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
    description: `Import a D&D 5E magic item with properties, effects, and actions.

ITEM ACTIONS:
- Items can grant actions that appear in a character's Combat tab when equipped
- Use useCharacterStats: true for weapons so toHit/damage scales with the wielder
- Use useCharacterStats: false for items with fixed effects (wands, staves with charges)

WEAPON ACTIONS (useCharacterStats: true):
- abilityModifier: "str" for melee, "dex" for ranged/finesse
- itemBonus: 1 for +1 weapons, 2 for +2, etc.
- damageDice: the weapon's base dice ("1d8", "2d6")
- damageType: "slashing", "piercing", "bludgeoning", "fire", etc.

FIXED EFFECT ACTIONS (useCharacterStats: false):
- Use toHit for fixed attack bonus (e.g., Wand of the War Mage)
- Use roll for fixed damage/effect (e.g., "3d6 fire")
- Use dc for save DCs (e.g., "DC 15 DEX")

MODIFIERS:
- Apply bonuses when item is equipped
- ac: +1 for +1 armor, +2 for ring of protection, etc.
- Use for stat bonuses, resistances, immunities`,
    schema: {
      name: 'string (required) - Item name',
      rarity: 'string (required) - Rarity: common, uncommon, rare, very rare, legendary, artifact',
      itemType: 'string (required) - Item type: Weapon, Armor, Shield, Wondrous Item, Ring, Rod, Staff, Wand, Potion, Scroll',
      attunement: 'boolean (optional) - Requires attunement',
      value: 'string (optional) - Monetary value (e.g., "500 gp")',
      weight: 'number (optional) - Weight in pounds',
      damage: 'string (optional) - Base damage dice for quick reference (e.g., "1d8")',
      properties: 'array (optional) - Weapon properties (e.g., ["Finesse", "Light", "Thrown", "Two-Handed", "Versatile"])',
      effect: 'string (optional) - Special effect description',
      // Combat Properties (for simple display)
      toHit: 'string (optional) - Display attack bonus',
      dc: 'string (optional) - Display save DC',
      roll: 'string (optional) - Display damage roll',
      range: 'string (optional) - Display range',
      // Actions granted by the item - THE MAIN WAY TO ADD COMBAT ABILITIES
      actions: 'array (required for weapons) - Actions this item grants. These appear in Combat when equipped!',
      'actions[].name': 'string (required) - Action name (e.g., "Longsword Attack", "Fire Breath")',
      'actions[].actionType': 'string (required) - "action", "bonus", "reaction", or "legendary"',
      'actions[].useCharacterStats': 'boolean (IMPORTANT) - true = auto-calculate from wielder stats, false = fixed values',
      'actions[].abilityModifier': 'string (if useCharacterStats) - "str", "dex", "con", "int", "wis", or "cha"',
      'actions[].itemBonus': 'number (if useCharacterStats) - Magic bonus (+1, +2, +3)',
      'actions[].proficient': 'boolean (default true) - Does proficiency bonus apply',
      'actions[].damageDice': 'string (if useCharacterStats) - Base damage dice (e.g., "1d8")',
      'actions[].damageType': 'string (if useCharacterStats) - Damage type (e.g., "slashing")',
      'actions[].addAbilityToDamage': 'boolean (default true) - Add ability mod to damage',
      'actions[].toHit': 'string (if NOT useCharacterStats) - Fixed attack bonus',
      'actions[].dc': 'string (optional) - Save DC (e.g., "DC 15 DEX")',
      'actions[].roll': 'string (if NOT useCharacterStats) - Fixed damage/effect roll',
      'actions[].range': 'string (required) - Attack range',
      'actions[].description': 'string (required) - Action description',
      // Modifiers
      modifiers: 'object (optional) - Stat modifiers applied when equipped',
      'modifiers.str': 'number (optional) - Strength modifier',
      'modifiers.dex': 'number (optional) - Dexterity modifier',
      'modifiers.con': 'number (optional) - Constitution modifier',
      'modifiers.int': 'number (optional) - Intelligence modifier',
      'modifiers.wis': 'number (optional) - Wisdom modifier',
      'modifiers.cha': 'number (optional) - Charisma modifier',
      'modifiers.ac': 'number (optional) - Armor Class bonus',
      'modifiers.maxHp': 'number (optional) - Maximum HP bonus',
      'modifiers.speed': 'number (optional) - Speed bonus in feet',
      'modifiers.initiative': 'number (optional) - Initiative bonus',
      'modifiers.savingThrowBonus': 'number (optional) - Bonus to all saving throws',
      'modifiers.strSavingThrow': 'number (optional) - Strength saving throw bonus',
      'modifiers.dexSavingThrow': 'number (optional) - Dexterity saving throw bonus',
      'modifiers.conSavingThrow': 'number (optional) - Constitution saving throw bonus',
      'modifiers.intSavingThrow': 'number (optional) - Intelligence saving throw bonus',
      'modifiers.wisSavingThrow': 'number (optional) - Wisdom saving throw bonus',
      'modifiers.chaSavingThrow': 'number (optional) - Charisma saving throw bonus',
      'modifiers.resistances': 'string (optional) - Additional resistances (comma-separated)',
      'modifiers.immunities': 'string (optional) - Additional immunities (comma-separated)'
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
      toHit: "+7",
      roll: "1d8+4 slashing plus 2d6 fire",
      range: "5ft",
      effect: "While attuned to this sword, you gain +1 to attack and damage rolls. The sword sheds bright light in a 40-foot radius and dim light for another 40 feet.",
      actions: [
        {
          name: "Flame Tongue Attack",
          actionType: "action",
          useCharacterStats: true,
          abilityModifier: "str",
          itemBonus: 1,
          proficient: true,
          damageDice: "1d8",
          damageType: "slashing plus 2d6 fire",
          addAbilityToDamage: true,
          range: "5ft",
          description: "Make a melee attack with this flaming sword. On hit, deals slashing damage plus 2d6 fire damage."
        },
        {
          name: "Flame Burst",
          actionType: "bonus",
          useCharacterStats: false,
          dc: "DC 15 DEX",
          roll: "3d6 fire",
          range: "15ft cone",
          description: "Once per day, release a burst of flame in a 15-foot cone. Creatures must make a DC 15 DEX save or take 3d6 fire damage."
        }
      ],
      modifiers: {
        resistances: "fire"
      }
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

