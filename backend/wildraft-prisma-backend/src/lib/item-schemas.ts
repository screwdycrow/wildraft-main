// Type-specific JSON schemas for LibraryItem.data field
// These define REQUIRED fields but allow additional properties

import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv({ allErrors: true });

// Base schema properties that all items should have
const baseProperties = {
  version: { type: 'string', nullable: true },
  customFields: { type: 'object', nullable: true },
};

const counterProperties = {
  counter: { type: 'number', nullable: true },
  counterName: { type: 'string', nullable: true },
  counterDescription: { type: 'string', nullable: true },
  counterType: { type: 'string', nullable: true },
  counterValue: { type: 'number', nullable: true },
  counterMaxValue: { type: 'number', nullable: true },
  counterMinValue: { type: 'number', nullable: true },
};

// D&D ability scores (used by both stat blocks and characters)
const abilityScoreProperties = {
  str: { type: 'number', nullable: true, description: 'Strength' },
  dex: { type: 'number', nullable: true, description: 'Dexterity' },
  con: { type: 'number', nullable: true, description: 'Constitution' },
  int: { type: 'number', nullable: true, description: 'Intelligence' },
  wis: { type: 'number', nullable: true, description: 'Wisdom' },
  cha: { type: 'number', nullable: true, description: 'Charisma' },
};

// Combat stats (used by both stat blocks and characters)
const combatStatsProperties = {
  hp: { type: 'number', nullable: true, description: 'Hit Points' },
  maxHp: { type: 'number', nullable: true, description: 'Maximum Hit Points' },
  ac: { type: 'number', nullable: true, description: 'Armor Class' },
  speed: { type: 'string', nullable: true, description: 'Speed (e.g., "30 ft.")' },
};

// D&D creature descriptors
const creatureDescriptorProperties = {
  size: { type: 'string', nullable: true, description: 'Size (e.g., Medium, Large)' },
  type: { type: 'string', nullable: true, description: 'Creature type' },
  alignment: { type: 'string', nullable: true, description: 'Alignment' },
  languages: { type: 'string', nullable: true, description: 'Known languages' },
  senses: { type: 'string', nullable: true, description: 'Senses (e.g., darkvision)' },
};

// Action structure for stat blocks and characters
const actionItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Action name' },
    roll: { type: 'string', description: 'Dice roll (e.g., "1d20+5" or "2d6+3")' },
    range: { type: 'string', description: 'Range (e.g., "5 ft.", "30/120 ft.")' },
    description: { type: 'string', description: 'Action description' },
  },
  required: ['name', 'description'],
  additionalProperties: true, // Allow custom action fields
};

// STAT_BLOCK: D&D creature/NPC stat block
export const statBlockSchema = {
  type: 'object',
  properties: {
    ...baseProperties,
    ...abilityScoreProperties,
    ...combatStatsProperties,
    ...creatureDescriptorProperties,
    
    // Stat block specific (required)
    cr: { type: 'string', description: 'Challenge Rating (e.g., "1/2", "5")' },
    
    // Stat block specific overrides (make hp/ac/speed required)
    hp: { type: 'number', description: 'Hit Points' }, // required, no nullable
    ac: { type: 'number', description: 'Armor Class' }, // required
    speed: { type: 'string', description: 'Speed (e.g., "30 ft.")' }, // required
    
    // Stat block specific arrays
    traits: { type: 'array', items: actionItemSchema, nullable: true },
    actions: { type: 'array', items: actionItemSchema, nullable: true },
    legendaryActions: { type: 'array', items: actionItemSchema, nullable: true },
  },
  required: ['cr', 'hp', 'ac', 'speed'],
  additionalProperties: true, // ✅ Allow custom fields!
} as const;

// NOTE: Simple text note with optional formatting
export const noteSchema = {
  type: 'object',
  properties: {
    ...baseProperties,
    content: { type: 'string', description: 'Note content' },
    format: { 
      type: 'string', 
      enum: ['markdown', 'html', 'plain'],
      nullable: true 
    },
    isPinned: { type: 'boolean', nullable: true },
    category: { type: 'string', nullable: true },
  },
  required: ['content'],
  additionalProperties: true, // ✅ Allow custom fields!
} as const;

// ITEM: D&D item/equipment
export const itemSchema = {
  type: 'object',
  properties: {
    ...baseProperties,
    rarity: { 
      type: 'string',
      enum: ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'],
    },
    itemType: { 
      type: 'string',
      description: 'e.g., weapon, armor, potion, wondrous item',
    },
    
    // Optional fields
    attunement: { type: 'boolean', nullable: true },
    value: { type: 'string', nullable: true }, // e.g., "50 gp"
    weight: { type: 'number', nullable: true },
    properties: { type: 'array', items: { type: 'string' }, nullable: true },
    damage: { type: 'string', nullable: true }, // e.g., "1d8 slashing"
    armorClass: { type: 'string', nullable: true },
    effect: { type: 'string', nullable: true },
  },
  required: ['rarity', 'itemType'],
  additionalProperties: true, // ✅ Allow custom fields!
} as const;

// CHARACTER: Player character or NPC
export const characterSchema = {
  type: 'object',
  properties: {
    ...baseProperties,
    ...abilityScoreProperties,
    ...combatStatsProperties,
    ...creatureDescriptorProperties,
    
    // Character specific (required)
    level: { type: 'number', description: 'Character level' },
    class: { type: 'string', description: 'Character class' },
    race: { type: 'string', description: 'Character race' },
    
    // Character specific (optional)
    subclass: { type: 'string', nullable: true, description: 'Subclass/archetype' },
    background: { type: 'string', nullable: true, description: 'Background' },
    playerName: { type: 'string', nullable: true, description: 'Player name (if PC)' },
    
    // Character specific arrays
    equipment: { type: 'array', items: { type: 'object' }, nullable: true }, // Keep flexible
    spells: { type: 'array', items: { type: 'object' }, nullable: true }, // Keep flexible
    features: { type: 'array', items: actionItemSchema, nullable: true }, // Use action structure
  },
  required: ['level', 'class', 'race'],
  additionalProperties: true, // ✅ Allow custom fields!
} as const;



// Schema map by type
export const itemSchemas = {
  STAT_BLOCK_DND_5E: statBlockSchema,
  NOTE: noteSchema,
  ITEM_DND_5E: itemSchema,
  CHARACTER_DND_5E: characterSchema,
} as const;

// Validation function
export function validateItemData(type: keyof typeof itemSchemas, data: any): { valid: boolean; errors: string[] } {
  const schema = itemSchemas[type];
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  if (valid) {
    return { valid: true, errors: [] };
  }
  
  const errors = validate.errors?.map(err => {
    const field = err.instancePath || err.params.missingProperty || 'data';
    return `${field}: ${err.message}`;
  }) || ['Validation failed'];
  
  return { valid: false, errors };
}

// Type helper to get TypeScript types from schemas
export type StatBlockData = {
  cr: string;
  hp: number;
  ac: number;
  speed: string;
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  // ... but allows any additional fields
  [key: string]: any;
};

export type NoteData = {
  content: string;
  format?: 'markdown' | 'html' | 'plain';
  isPinned?: boolean;
  category?: string;
  [key: string]: any;
};

export type ItemData = {
  rarity: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';
  itemType: string;
  attunement?: boolean;
  value?: string;
  weight?: number;
  [key: string]: any;
};


export type CharacterData = {
  level: number;
  class: string;
  race: string;
  subclass?: string;
  [key: string]: any;
};



export type LibraryItemData = 
  | StatBlockData 
  | NoteData 
  | ItemData 
  | CharacterData 

