import { computed, type Ref } from 'vue'
import type { CharacterData, Skill } from '@/types/item.types'
import { DND5E_SKILLS } from '@/constants/dnd5e'

/**
 * Calculate ability modifier from ability score
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/**
 * Calculate proficiency bonus by level
 */
export function calculateProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

/**
 * Parse CR string to number
 */
function parseCR(cr: string): number {
  if (cr === '1/8') return 0.125
  if (cr === '1/4') return 0.25
  if (cr === '1/2') return 0.5
  return parseFloat(cr) || 0
}

/**
 * Calculate proficiency bonus by Challenge Rating (for stat blocks)
 */
export function calculateStatBlockProficiencyBonus(cr: string): number {
  const parsedCr = parseCR(cr)
  if (parsedCr < 1) return 2 // CR 0, 1/8, 1/4, 1/2 typically have +2
  return Math.ceil(parsedCr / 4) + 1
}

/**
 * Calculate skill bonus
 */
export function calculateSkillBonus(
  abilityScore: number,
  proficient: boolean,
  expertise: boolean,
  proficiencyBonus: number
): number {
  const modifier = calculateModifier(abilityScore)
  let bonus = modifier
  
  if (expertise) {
    bonus += proficiencyBonus * 2
  } else if (proficient) {
    bonus += proficiencyBonus
  }
  
  return bonus
}

/**
 * Calculate saving throw bonus
 */
export function calculateSavingThrowBonus(
  abilityScore: number,
  proficient: boolean,
  proficiencyBonus: number
): number {
  const modifier = calculateModifier(abilityScore)
  return modifier + (proficient ? proficiencyBonus : 0)
}

/**
 * Format modifier with + or - sign
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

/**
 * Initialize all D&D 5e skills with default values
 */
export function initializeSkills(): Skill[] {
  return DND5E_SKILLS.map(skill => ({
    name: skill.name,
    ability: skill.ability,
    proficient: false,
    expertise: false,
  }))
}


/**
 * Composable for D&D 5e character calculations
 */
export function useDnd5eCalculations(characterData: Ref<CharacterData>) {
  // Proficiency bonus
  const proficiencyBonus = computed(() => 
    calculateProficiencyBonus(characterData.value.level || 1)
  )

  // Ability modifiers
  const abilityModifiers = computed(() => ({
    str: calculateModifier(characterData.value.str || 10),
    dex: calculateModifier(characterData.value.dex || 10),
    con: calculateModifier(characterData.value.con || 10),
    int: calculateModifier(characterData.value.int || 10),
    wis: calculateModifier(characterData.value.wis || 10),
    cha: calculateModifier(characterData.value.cha || 10),
  }))

  // Saving throw bonuses
  const savingThrowBonuses = computed(() => {
    const bonuses: Record<string, number> = {}
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
    
    abilities.forEach(ability => {
      const score = characterData.value[ability] || 10
      const savingThrowKey = `${ability}SavingThrow` as keyof CharacterData
      const isProficient = characterData.value[savingThrowKey] as boolean || false
      bonuses[ability] = calculateSavingThrowBonus(
        score,
        isProficient,
        proficiencyBonus.value
      )
    })
    
    return bonuses
  })

  // Skill bonuses
  const skillBonuses = computed(() => {
    const bonuses: Record<string, number> = {}
    
    DND5E_SKILLS.forEach(skillDef => {
      const skill = characterData.value.skills?.find(s => s.name === skillDef.name)
      const abilityScore = characterData.value[skillDef.ability] || 10
      
      bonuses[skillDef.name] = calculateSkillBonus(
        abilityScore,
        skill?.proficient || false,
        skill?.expertise || false,
        proficiencyBonus.value
      )
    })
    
    return bonuses
  })

  // Initiative (DEX modifier)
  const initiative = computed(() => abilityModifiers.value.dex)

  // Passive Perception
  const passivePerception = computed(() => {
    const perceptionBonus = skillBonuses.value['Perception'] || 0
    return 10 + perceptionBonus
  })

  // Get skill proficiency level
  function getSkillProficiency(skillName: string): 'none' | 'proficient' | 'expertise' {
    const skill = characterData.value.skills?.find(s => s.name === skillName)
    if (!skill) return 'none'
    if (skill.expertise) return 'expertise'
    if (skill.proficient) return 'proficient'
    return 'none'
  }

  // Check if saving throw is proficient
  function isSavingThrowProficient(ability: string): boolean {
    const savingThrowKey = `${ability}SavingThrow` as keyof CharacterData
    return characterData.value[savingThrowKey] as boolean || false
  }

  return {
    proficiencyBonus,
    abilityModifiers,
    savingThrowBonuses,
    skillBonuses,
    initiative,
    passivePerception,
    getSkillProficiency,
    isSavingThrowProficient,
    // Utility functions
    calculateModifier,
    calculateProficiencyBonus,
    calculateSkillBonus,
    calculateSavingThrowBonus,
    formatModifier,
  }
}

