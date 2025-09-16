// Character utility functions and validation logic
// Following Single Responsibility Principle

import {
    ICharacter,
    IAttributes,
    AttributeType,
    AttributeCostMultiplier,
    ATTRIBUTE_DEFINITIONS,
    CHARACTER_CREATION_RULES,
    IHollowData
} from './types.js';

export class CharacterCalculations {
    // Calculate character rank based on total XP (1 rank per 10 XP)
    static calculateRank(totalXP: number): number {
        return 1 + Math.floor(totalXP / 10);
    }

    // Calculate damage capacity (10 + CON)
    static calculateDamageCapacity(constitution: number): number {
        return 10 + constitution;
    }

    // Calculate hollow influence (1 per 100 burned dust)
    static calculateHollowInfluence(burnedDust: number): number {
        return Math.floor(burnedDust / 100);
    }

    // Calculate physical damage reduction from CON (1 per 5 levels)
    static calculatePhysicalDamageReduction(constitution: number): number {
        return Math.floor(constitution / 5);
    }

    // Calculate social damage reduction from GRI (1 per 5 levels)
    static calculateSocialDamageReduction(grit: number): number {
        return Math.floor(grit / 5);
    }

    // Check if character needs New Moon visit
    static needsNewMoonVisit(rank: number, hollowInfluence: number, glimmerDebt: number): boolean {
        const totalNegativeInfluence = hollowInfluence + Math.abs(glimmerDebt);
        return rank <= totalNegativeInfluence;
    }

    // Calculate total attribute points spent
    static calculateAttributePointsUsed(attributes: IAttributes): number {
        let total = 0;
        Object.entries(attributes).forEach(([attrType, value]) => {
            const definition = ATTRIBUTE_DEFINITIONS[attrType as AttributeType];
            total += Math.max(0, value) * definition.costMultiplier;
        });
        return total;
    }

    // Calculate XP cost for a skill level
    static calculateSkillXPCost(level: number, costMultiplier: 1 | 2 = 1): number {
        return level * costMultiplier;
    }

    // Calculate XP cost for a field level (sum of all skills)
    static calculateFieldXPCost(fieldLevel: number, skillCount: number, skillCostMultipliers: number[]): number {
        const totalSkillCost = skillCostMultipliers.reduce((sum, multiplier) => sum + multiplier, 0);
        return fieldLevel * totalSkillCost;
    }
}

export class CharacterValidation {
    // Validate character creation rules
    static validateCharacterCreation(character: ICharacter): string[] {
        const errors: string[] = [];

        // Check attribute ranges
        Object.entries(character.attributes).forEach(([attrType, value]) => {
            if (value < CHARACTER_CREATION_RULES.attributeMinimum) {
                errors.push(`${attrType} cannot be below ${CHARACTER_CREATION_RULES.attributeMinimum}`);
            }
            if (value > CHARACTER_CREATION_RULES.attributeMaximum) {
                errors.push(`${attrType} cannot be above ${CHARACTER_CREATION_RULES.attributeMaximum}`);
            }
        });

        // Check minimum total attributes
        const totalAttributes = Object.values(character.attributes).reduce((sum, value) => sum + value, 0);
        if (totalAttributes < CHARACTER_CREATION_RULES.minimumAttributeTotal) {
            errors.push(`Total attribute levels must be at least ${CHARACTER_CREATION_RULES.minimumAttributeTotal}`);
        }

        // Check attribute chips spent
        const pointsUsed = CharacterCalculations.calculateAttributePointsUsed(character.attributes);
        const availablePoints = CHARACTER_CREATION_RULES.startingAttributeChips +
            character.attributeChipsSpent.positive - character.attributeChipsSpent.negative;

        if (pointsUsed !== availablePoints) {
            errors.push(`Attribute points mismatch: used ${pointsUsed}, available ${availablePoints}`);
        }

        return errors;
    }

    // Validate skill prerequisites
    static validateSkillPrerequisites(character: ICharacter): string[] {
        const errors: string[] = [];

        character.skills.forEach(skill => {
            if (skill.prerequisite) {
                // Check if prerequisite exists and has sufficient level
                const prerequisiteSkill = character.skills.find(s => s.name === skill.prerequisite);
                const prerequisiteAttribute = character.attributes[skill.prerequisite as AttributeType];

                if (prerequisiteSkill && prerequisiteSkill.level < skill.level) {
                    errors.push(`${skill.name} requires ${skill.prerequisite} at level ${skill.level}`);
                } else if (prerequisiteAttribute !== undefined && prerequisiteAttribute < skill.level) {
                    errors.push(`${skill.name} requires ${skill.prerequisite} at level ${skill.level}`);
                } else if (!prerequisiteSkill && prerequisiteAttribute === undefined) {
                    errors.push(`${skill.name} requires ${skill.prerequisite} which is not found`);
                }
            }
        });

        return errors;
    }

    // Validate field rules
    static validateFields(character: ICharacter): string[] {
        const errors: string[] = [];

        character.fields.forEach(field => {
            if (field.skills.length < 3) {
                errors.push(`Field ${field.name} must have at least 3 skills`);
            }

            // Check that all skills exist
            field.skills.forEach(skillId => {
                const skill = character.skills.find(s => s.id === skillId);
                if (!skill) {
                    errors.push(`Field ${field.name} references non-existent skill ${skillId}`);
                }
            });

            // Check if skills can be added (only at level 1)
            if (field.level > 1 && !field.isFrozen) {
                errors.push(`Field ${field.name} should be frozen at level ${field.level}`);
            }
        });

        return errors;
    }
}

export class CharacterFactory {
    // Create a new character with default values
    static createNewCharacter(name: string, description: string = ''): ICharacter {
        return {
            id: crypto.randomUUID(),
            name,
            description,
            rank: 1,
            totalXP: CHARACTER_CREATION_RULES.startingXP,
            currentXP: CHARACTER_CREATION_RULES.startingXP,
            attributes: {
                [AttributeType.DEX]: 0,
                [AttributeType.STR]: 0,
                [AttributeType.CON]: 0,
                [AttributeType.CHA]: 0,
                [AttributeType.WIS]: 0,
                [AttributeType.GRI]: 0,
                [AttributeType.INT]: 0,
                [AttributeType.PER]: 0
            },
            skills: [],
            fields: [],
            benefits: [],
            drawbacks: [],
            items: [],
            companions: [],
            hollow: {
                dust: CHARACTER_CREATION_RULES.startingDust,
                burned: 0,
                hollowInfluence: 0,
                glimmerDebt: 0,
                glimmerDebtTotal: 0,
                newMoonMarks: 0
            },
            damageCapacity: 10, // Will be recalculated
            attributeChipsSpent: {
                positive: 0,
                negative: 0
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    // Create a template character with starting benefits/drawbacks
    static createTemplateCharacter(name: string): ICharacter {
        const character = this.createNewCharacter(name);

        // Add starting benefit and drawback placeholders
        character.benefits.push({
            id: crypto.randomUUID(),
            name: 'Starting Benefit',
            level: 1,
            condition: 'when [condition]',
            description: 'Describe your starting benefit here'
        });

        character.drawbacks.push({
            id: crypto.randomUUID(),
            name: 'Starting Drawback',
            level: 1,
            condition: 'when [condition]',
            description: 'Describe your starting drawback here'
        });

        return character;
    }
}

export class CharacterUpdater {
    // Update a character and recalculate derived stats
    static updateCharacter(character: ICharacter, updates: Partial<ICharacter>): ICharacter {
        const updated = { ...character, ...updates, updatedAt: new Date() };

        // Recalculate derived stats
        updated.rank = CharacterCalculations.calculateRank(updated.totalXP);
        updated.damageCapacity = CharacterCalculations.calculateDamageCapacity(updated.attributes.Con);
        updated.hollow.hollowInfluence = CharacterCalculations.calculateHollowInfluence(updated.hollow.burned);

        return updated;
    }

    // Update a specific attribute and recalculate
    static updateAttribute(character: ICharacter, attribute: AttributeType, value: number): ICharacter {
        const newAttributes = { ...character.attributes, [attribute]: value };
        return this.updateCharacter(character, { attributes: newAttributes });
    }

    // Add XP and handle ranking up
    static addExperience(character: ICharacter, xp: number): ICharacter {
        const newTotalXP = character.totalXP + xp;
        const newCurrentXP = character.currentXP + xp;

        let updates: Partial<ICharacter> = {
            totalXP: newTotalXP,
            currentXP: newCurrentXP
        };

        // Check for rank up (every 10 XP)
        const oldRank = character.rank;
        const newRank = CharacterCalculations.calculateRank(newTotalXP);

        if (newRank > oldRank) {
            // Handle ranking up - gain dust and attribute chips
            const rankUps = newRank - oldRank;
            updates = {
                ...updates,
                hollow: {
                    ...character.hollow,
                    dust: character.hollow.dust + (5 * rankUps)
                }
            };
        }

        return this.updateCharacter(character, updates);
    }

    // Burn dust for Glimmer effects
    static burnDust(character: ICharacter, grains: number): ICharacter {
        if (character.hollow.dust < grains) {
            throw new Error('Not enough dust to burn');
        }

        const newHollow: IHollowData = {
            ...character.hollow,
            dust: character.hollow.dust - grains,
            burned: character.hollow.burned + grains
        };

        return this.updateCharacter(character, { hollow: newHollow });
    }
}