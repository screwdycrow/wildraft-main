// D&D 5E Constants for Autocomplete/Combobox Options

export const DND5E_RACES = [
  'Dragonborn',
  'Dwarf (Hill)',
  'Dwarf (Mountain)',
  'Elf (High)',
  'Elf (Wood)',
  'Elf (Drow)',
  'Gnome (Forest)',
  'Gnome (Rock)',
  'Half-Elf',
  'Half-Orc',
  'Halfling (Lightfoot)',
  'Halfling (Stout)',
  'Human',
  'Tiefling',
]

export const DND5E_CLASSES = [
  'Artificer',
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
]

export const DND5E_ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
  'Unaligned',
]

export const DND5E_BACKGROUNDS = [
  'Acolyte',
  'Charlatan',
  'Criminal',
  'Entertainer',
  'Folk Hero',
  'Guild Artisan',
  'Hermit',
  'Noble',
  'Outlander',
  'Sage',
  'Sailor',
  'Soldier',
  'Urchin',
]

export const DND5E_SIZES = [
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
  'Gargantuan',
]

// All D&D 5E Skills with their associated abilities
export const DND5E_SKILLS = [
  { name: 'Acrobatics', ability: 'dex' as const },
  { name: 'Animal Handling', ability: 'wis' as const },
  { name: 'Arcana', ability: 'int' as const },
  { name: 'Athletics', ability: 'str' as const },
  { name: 'Deception', ability: 'cha' as const },
  { name: 'History', ability: 'int' as const },
  { name: 'Insight', ability: 'wis' as const },
  { name: 'Intimidation', ability: 'cha' as const },
  { name: 'Investigation', ability: 'int' as const },
  { name: 'Medicine', ability: 'wis' as const },
  { name: 'Nature', ability: 'int' as const },
  { name: 'Perception', ability: 'wis' as const },
  { name: 'Performance', ability: 'cha' as const },
  { name: 'Persuasion', ability: 'cha' as const },
  { name: 'Religion', ability: 'int' as const },
  { name: 'Sleight of Hand', ability: 'dex' as const },
  { name: 'Stealth', ability: 'dex' as const },
  { name: 'Survival', ability: 'wis' as const },
]

// Ability score labels
export const ABILITY_LABELS = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
}

// Abilities array
export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

