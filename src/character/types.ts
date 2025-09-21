// Character Sheet Data Models and Types for Hollow RPG System
// Following SOLID principles with clear interfaces

export enum AttributeCategory {
    PHYSICAL = 'Physical',
    SOCIAL = 'Social',
    MENTAL = 'Mental'
}

export enum AttributeCostMultiplier {
    X1 = 1,
    X3 = 3,
    X4 = 4
}

export enum AttributeType {
    // Physical
    DEX = 'Dex',
    STR = 'Str',
    CON = 'Con',
    // Social
    CHA = 'Cha',
    WIS = 'Wis',
    GRI = 'Gri',
    // Mental
    INT = 'Int',
    PER = 'Per'
}

export interface IAttributeDefinition {
    type: AttributeType;
    category: AttributeCategory;
    costMultiplier: AttributeCostMultiplier;
    name: string;
    description: string;
}

export interface IAttributes {
    [AttributeType.DEX]: number;
    [AttributeType.STR]: number;
    [AttributeType.CON]: number;
    [AttributeType.CHA]: number;
    [AttributeType.WIS]: number;
    [AttributeType.GRI]: number;
    [AttributeType.INT]: number;
    [AttributeType.PER]: number;
}

export interface ISkill {
    id: string;
    name: string;
    level: number;
    isListed: boolean; // 🞐 marked skills vs created skills
    costMultiplier: 1 | 2; // x1 or x2 cost
    specialization?: string; // For skills like "Weapon (Type)"
    prerequisite?: string; // Required skill/attribute
    isSpecialized: boolean; // Has checkmark (1 level above field)
    description?: string;
}

export interface IField {
    id: string;
    name: string;
    level: number;
    skills: string[]; // Array of skill IDs
    isFrozen: boolean; // True at level 2+, cannot add new skills
}

export interface IBenefit {
    id: string;
    name: string;
    level: number;
    condition: string; // When this benefit applies
    description: string;
}

export interface IDrawback {
    id: string;
    name: string;
    level: number;
    condition: string; // When this drawback applies
    description: string;
}

export interface IItem {
    id: string;
    name: string;
    type: 'fine_weapon' | 'gadget' | 'ordinary';
    level?: number; // For fine weapons (1-3)
    description: string;
    mechanicalEffect?: string;
}

export interface ICompanion {
    id: string;
    name: string;
    type: 'animal' | 'person';
    attributes: IAttributes;
    skills: ISkill[];
    xpSpent: number; // XP invested by PC
    description: string;
    training?: string[]; // For animals
}

export interface IHollowData {
    dust: number; // Current dust grains
    burned: number; // Total burned dust
    hollowInfluence: number; // 1 per 100 burned (calculated)
    glimmerDebt: number; // Current debt level
    glimmerDebtTotal: number; // Total owed for debt payoff
    newMoonMarks: number; // X marks for failed resistance (0-3)
}

export interface ICharacter {
    // Basic Info
    id: string;
    name: string;
    description: string;

    // Core Stats
    rank: number; // Primary stat - determines XP pools and advancement
    totalXP?: number; // DEPRECATED: Use CharacterCalculations.calculateTotalXPForRank(rank) instead
    currentXP?: number; // DEPRECATED: Use CharacterCalculations.calculateAvailableXP() instead

    // Attributes
    attributes: IAttributes;

    // Character Progression
    skills: ISkill[];
    fields: IField[];
    benefits: IBenefit[];
    drawbacks: IDrawback[];

    // Equipment & Companions
    items: IItem[];
    companions: ICompanion[];

    // Hollow System
    hollow: IHollowData;

    // Derived Stats (calculated)
    damageCapacity: number; // 10 + CON

    // Creation Data
    attributeChipsSpent: {
        positive: number;
        negative: number;
    };

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

// Validation interfaces
export interface ICharacterCreationRules {
    startingAttributeChips: number; // 16
    startingXP: number; // 10
    startingDust: number; // 10
    startingBenefits: number; // 1
    startingDrawbacks: number; // 1
    attributeMinimum: number; // -2
    attributeMaximum: number; // 15
    minimumAttributeTotal: number; // 2
}

export interface IAttributeCosts {
    [AttributeType.DEX]: AttributeCostMultiplier.X4;
    [AttributeType.STR]: AttributeCostMultiplier.X3;
    [AttributeType.CON]: AttributeCostMultiplier.X1;
    [AttributeType.CHA]: AttributeCostMultiplier.X4;
    [AttributeType.WIS]: AttributeCostMultiplier.X3;
    [AttributeType.GRI]: AttributeCostMultiplier.X1;
    [AttributeType.INT]: AttributeCostMultiplier.X4;
    [AttributeType.PER]: AttributeCostMultiplier.X4;
}

// Character Sheet Component Interfaces
export interface ICharacterSheetProps {
    character: ICharacter;
    onCharacterChange: (character: ICharacter) => void;
    readOnly?: boolean;
    showCreationMode?: boolean;
}

export interface ICharacterSheetCallbacks {
    onAttributeChange: (attribute: AttributeType, value: number) => void;
    onSkillChange: (skillId: string, level: number) => void;
    onFieldChange: (fieldId: string, level: number) => void;
    onBenefitChange: (benefitId: string, benefit: IBenefit) => void;
    onDrawbackChange: (drawbackId: string, drawback: IDrawback) => void;
    onHollowChange: (hollow: Partial<IHollowData>) => void;
    onExport: () => string;
    onImport: (data: string) => boolean;
}

// Default attribute definitions for the system
export const ATTRIBUTE_DEFINITIONS: Record<AttributeType, IAttributeDefinition> = {
    [AttributeType.DEX]: {
        type: AttributeType.DEX,
        category: AttributeCategory.PHYSICAL,
        costMultiplier: AttributeCostMultiplier.X4,
        name: 'Dexterity',
        description: 'Coordination, manual dexterity, how quick you are'
    },
    [AttributeType.STR]: {
        type: AttributeType.STR,
        category: AttributeCategory.PHYSICAL,
        costMultiplier: AttributeCostMultiplier.X3,
        name: 'Strength',
        description: 'How strong and large you are'
    },
    [AttributeType.CON]: {
        type: AttributeType.CON,
        category: AttributeCategory.PHYSICAL,
        costMultiplier: AttributeCostMultiplier.X1,
        name: 'Constitution',
        description: 'Resistance to disease, endurance, stamina, hardiness, health'
    },
    [AttributeType.CHA]: {
        type: AttributeType.CHA,
        category: AttributeCategory.SOCIAL,
        costMultiplier: AttributeCostMultiplier.X4,
        name: 'Charisma',
        description: 'How quick-witted you are and how well you turn aside social attacks'
    },
    [AttributeType.WIS]: {
        type: AttributeType.WIS,
        category: AttributeCategory.SOCIAL,
        costMultiplier: AttributeCostMultiplier.X3,
        name: 'Wisdom',
        description: 'Willpower, courage, judgment, social insight, empathy'
    },
    [AttributeType.GRI]: {
        type: AttributeType.GRI,
        category: AttributeCategory.SOCIAL,
        costMultiplier: AttributeCostMultiplier.X1,
        name: 'Grit',
        description: 'How well you recover from Afflictions and soak up psychological damage'
    },
    [AttributeType.INT]: {
        type: AttributeType.INT,
        category: AttributeCategory.MENTAL,
        costMultiplier: AttributeCostMultiplier.X4,
        name: 'Intelligence',
        description: 'Mental insight, reasoning, analysis, problem solving, design'
    },
    [AttributeType.PER]: {
        type: AttributeType.PER,
        category: AttributeCategory.MENTAL,
        costMultiplier: AttributeCostMultiplier.X4,
        name: 'Perception',
        description: 'Memory, focus, how well you pay attention to your surroundings'
    }
};

export const CHARACTER_CREATION_RULES: ICharacterCreationRules = {
    startingAttributeChips: 16,
    startingXP: 10,
    startingDust: 10,
    startingBenefits: 1,
    startingDrawbacks: 1,
    attributeMinimum: -2,
    attributeMaximum: 15,
    minimumAttributeTotal: 2
};