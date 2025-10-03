// Character utility functions and validation logic
// Following Single Responsibility Principle

import {
    ICharacter,
    IAttributes,
    AttributeType,
    AttributeCostMultiplier,
    ATTRIBUTE_DEFINITIONS,
    CHARACTER_CREATION_RULES,
    IHollowData,
    IField,
    IFieldSkillEntry,
    ISkill,
    STANDARD_SKILLS
} from './types.js';
import { CharacterVersioning } from './CharacterVersioning.js';

export class CharacterCalculations {
    // Note: Rank is now the primary stat, not calculated from XP
    // This function is kept for backward compatibility with existing code
    static calculateRank(totalXP: number): number {
        return 1 + Math.floor(totalXP / 10);
    }

    // Calculate rank from earned XP (for advancement system)
    static calculateRankFromEarnedXP(earnedXP: number): number {
        return 1 + Math.floor(earnedXP / 10);
    }

    // Calculate damage capacity (10 + CON)
    static calculateDamageCapacity(constitution: number): number {
        return 10 + constitution;
    }

    // Calculate total XP for a given rank
    static calculateTotalXPForRank(rank: number): number {
        return 10 + (rank - 1) * 10;
    }

    // Calculate total attribute chips for a given rank
    static calculateTotalAttributeChipsForRank(rank: number): number {
        return 16 + (rank - 1);
    }

    // Get attribute cost multiplier
    static getAttributeCost(attrType: AttributeType): number {
        const definition = ATTRIBUTE_DEFINITIONS[attrType];
        return definition.costMultiplier;
    }

    // Calculate total attribute costs (including negative values)
    static calculateTotalAttributeCosts(attributes: IAttributes): number {
        let totalCost = 0;
        Object.entries(attributes).forEach(([attrType, value]) => {
            const cost = this.getAttributeCost(attrType as AttributeType);
            totalCost += value * cost;
        });
        return totalCost;
    }

    // Calculate XP spent beyond attribute chips
    static calculateAttributeXPSpent(character: ICharacter): number {
        const totalAttributeChips = this.calculateTotalAttributeChipsForRank(character.rank);
        const totalAttributeCost = this.calculateTotalAttributeCosts(character.attributes);
        return Math.max(0, totalAttributeCost - totalAttributeChips);
    }

    // Calculate total XP spent on all advancement
    static calculateSpentXP(character: ICharacter): number {
        let spentXP = 0;

        // XP spent on attributes (beyond attribute chips)
        spentXP += this.calculateAttributeXPSpent(character);

        // XP spent on fields (new specification)
        spentXP += this.calculateFieldsXPSpent(character.fields, character.skills);

        // TODO: Add XP spent on benefits, drawbacks when implemented
        // spentXP += this.calculateBenefitXPSpent(character.benefits);
        // spentXP += this.calculateDrawbackXPSpent(character.drawbacks);

        return spentXP;
    }

    // Calculate available (unspent) XP - this replaces the stored currentXP
    // Note: Can be negative if character has overspent XP beyond their rank
    static calculateAvailableXP(character: ICharacter): number {
        const totalXP = this.calculateTotalXPForRank(character.rank);
        const spentXP = this.calculateSpentXP(character);
        return totalXP - spentXP;
    }

    // Calculate available attribute chips
    static calculateAvailableAttributeChips(character: ICharacter): number {
        const totalChips = this.calculateTotalAttributeChipsForRank(character.rank);
        const totalAttributeCosts = this.calculateTotalAttributeCosts(character.attributes);
        return Math.max(0, totalChips - totalAttributeCosts);
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

    // Calculate XP cost for a field based on new specification
    // Fields cost their level * the cost of each entry + 1 if it has a check
    static calculateFieldXPCostNew(field: IField, skills: ISkill[] = []): number {
        // Backward compatibility: handle both old (skills array) and new (skillEntries array) formats
        let totalEntryCost = 0;
        let hasAnyExperience = false;

        if (field.skillEntries) {
            // New format - calculate cost of each entry based on skill's costMultiplier
            field.skillEntries.forEach(entry => {
                const skill = skills.find(s => s.id === entry.skillId);
                const skillCost = skill?.costMultiplier || 1;
                totalEntryCost += skillCost;

                if (entry.hasExperience) {
                    hasAnyExperience = true;
                }
            });
        } else if ((field as any).skills) {
            // Old format - fallback, assume cost multiplier of 1 for each skill
            const skillIds = (field as any).skills as string[];
            skillIds.forEach(skillId => {
                const skill = skills.find(s => s.id === skillId);
                const skillCost = skill?.costMultiplier || 1;
                totalEntryCost += skillCost;
            });
            hasAnyExperience = false; // Old format doesn't have experience tracking
        }

        const baseCost = field.level * totalEntryCost;
        const experienceBonusCost = hasAnyExperience ? 1 : 0; // +1 if ANY entry has a check
        return baseCost + experienceBonusCost;
    }

    // Calculate total XP spent on all fields
    static calculateFieldsXPSpent(fields: IField[], skills: ISkill[] = []): number {
        return fields.reduce((total, field) => total + this.calculateFieldXPCostNew(field, skills), 0);
    }

    // Calculate skill level dynamically from field occurrences and experience checkboxes
    static calculateSkillLevel(skillId: string, fields: IField[]): number {
        let level = 0;
        
        fields.forEach(field => {
            field.skillEntries.forEach(entry => {
                if (entry.skillId === skillId) {
                    // Add field level (can occur multiple times if skill appears in multiple fields)
                    level += field.level;
                    // Add 1 if this entry has experience checkbox checked
                    if (entry.hasExperience) {
                        level += 1;
                    }
                }
            });
        });
        
        return level;
    }

    // Check if field should auto-increment level (all skills have experience checked)
    static shouldAutoIncrementField(field: IField): boolean {
        return field.skillEntries.length > 0 && 
               field.skillEntries.every(entry => entry.hasExperience);
    }

    // Auto-increment field level and clear experience checkboxes
    static autoIncrementField(field: IField): IField {
        if (!this.shouldAutoIncrementField(field)) {
            return field;
        }

        return {
            ...field,
            level: field.level + 1,
            skillEntries: field.skillEntries.map(entry => ({
                ...entry,
                hasExperience: false
            }))
        };
    }

    // Process all fields for auto-increment
    static processFieldAutoIncrements(fields: IField[]): IField[] {
        return fields.map(field => this.autoIncrementField(field));
    }

    // Toggle experience checkbox for a skill entry in a field
    static toggleSkillExperience(fields: IField[], fieldId: string, skillId: string): IField[] {
        return fields.map(field => {
            if (field.id !== fieldId) return field;
            
            return {
                ...field,
                skillEntries: field.skillEntries.map(entry => {
                    if (entry.skillId === skillId) {
                        return { ...entry, hasExperience: !entry.hasExperience };
                    }
                    return entry;
                })
            };
        });
    }

    // Increment field level by mouse wheel or manual adjustment
    static incrementFieldLevel(field: IField, increment: number = 1): IField {
        const newLevel = Math.max(0, field.level + increment);
        return { ...field, level: newLevel };
    }

    // Add skill entry to field (if not frozen)
    static addSkillToField(field: IField, skillId: string): IField {
        if (field.isFrozen) return field;
        
        return {
            ...field,
            skillEntries: [...field.skillEntries, { skillId, hasExperience: false }]
        };
    }

    // Remove skill entry from field
    static removeSkillFromField(field: IField, skillId: string): IField {
        return {
            ...field,
            skillEntries: field.skillEntries.filter(entry => entry.skillId !== skillId)
        };
    }

    // Get all unique skills from all fields
    static getAllSkillsFromFields(fields: IField[]): string[] {
        const skillIds = new Set<string>();
        fields.forEach(field => {
            field.skillEntries.forEach(entry => {
                skillIds.add(entry.skillId);
            });
        });
        return Array.from(skillIds);
    }

    // Get skill entries for a specific skill across all fields
    static getSkillEntriesForSkill(skillId: string, fields: IField[]): { fieldId: string, hasExperience: boolean }[] {
        const entries: { fieldId: string, hasExperience: boolean }[] = [];
        
        fields.forEach(field => {
            field.skillEntries.forEach(entry => {
                if (entry.skillId === skillId) {
                    entries.push({ fieldId: field.id, hasExperience: entry.hasExperience });
                }
            });
        });
        
        return entries;
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
                const skillLevel = CharacterCalculations.calculateSkillLevel(skill.id, character.fields);
                const prerequisiteSkill = character.skills.find(s => s.name === skill.prerequisite);
                const prerequisiteAttribute = character.attributes[skill.prerequisite as AttributeType];

                if (prerequisiteSkill) {
                    const prerequisiteLevel = CharacterCalculations.calculateSkillLevel(prerequisiteSkill.id, character.fields);
                    if (prerequisiteLevel < skillLevel) {
                        errors.push(`${skill.name} requires ${skill.prerequisite} at level ${skillLevel}`);
                    }
                } else if (prerequisiteAttribute !== undefined && prerequisiteAttribute < skillLevel) {
                    errors.push(`${skill.name} requires ${skill.prerequisite} at level ${skillLevel}`);
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
            // Backward compatibility: handle both old and new field formats
            const skillCount = field.skillEntries ? field.skillEntries.length : (field as any).skills?.length || 0;

            if (skillCount < 3) {
                errors.push(`Field ${field.name} must have at least 3 skills`);
            }

            // Check that all skills exist
            if (field.skillEntries) {
                // New format
                field.skillEntries.forEach(entry => {
                    const skill = character.skills.find(s => s.id === entry.skillId);
                    if (!skill) {
                        errors.push(`Field ${field.name} references non-existent skill ${entry.skillId}`);
                    }
                });
            } else if ((field as any).skills) {
                // Old format - backward compatibility
                (field as any).skills.forEach((skillId: string) => {
                    const skill = character.skills.find(s => s.id === skillId);
                    if (!skill) {
                        errors.push(`Field ${field.name} references non-existent skill ${skillId}`);
                    }
                });
            }

            // Check if skills can be added (only at level 1)
            if (field.level > 1 && !field.isFrozen) {
                errors.push(`Field ${field.name} should be frozen at level ${field.level}`);
            }
        });

        return errors;
    }

    // Validate skill experience checkboxes against prerequisites
    static canSkillGainExperience(skillId: string, character: ICharacter): boolean {
        const skill = character.skills.find(s => s.id === skillId) || STANDARD_SKILLS[skillId];
        if (!skill || !skill.prerequisite) {
            return true; // No prerequisite, can always gain experience
        }

        // Check prerequisite requirements
        const currentSkillLevel = CharacterCalculations.calculateSkillLevel(skillId, character.fields);
        const requiredLevel = currentSkillLevel + 1; // Must have prerequisite at next level

        return this.checkSkillPrerequisite(skill, character, requiredLevel);
    }

    // Check if skill prerequisites are met at specified level
    private static checkSkillPrerequisite(skill: ISkill, character: ICharacter, requiredLevel: number): boolean {
        if (!skill.prerequisite) return true;

        switch (skill.prerequisite) {
            case 'skill':
                // For Finesse (Skill) - requires the base skill at same or higher level
                if (skill.specialization) {
                    const baseSkillId = skill.specialization.toLowerCase().replace(/[()]/g, '');
                    const baseSkillLevel = CharacterCalculations.calculateSkillLevel(baseSkillId, character.fields);
                    return baseSkillLevel >= requiredLevel;
                }
                return false;

            case 'dex-or-str-con':
                // For Martial Arts - requires Dex 3+ OR (Str 3+ AND Con 3+)
                const dex = character.attributes[AttributeType.DEX];
                const str = character.attributes[AttributeType.STR];
                const con = character.attributes[AttributeType.CON];
                return dex >= requiredLevel || (str >= requiredLevel && con >= requiredLevel);

            case 'weapon-skill':
                // For weapon-based skills - requires any weapon skill at required level
                const hasWeaponSkill = character.skills.some(s =>
                    s.id.includes('weapon') &&
                    CharacterCalculations.calculateSkillLevel(s.id, character.fields) >= requiredLevel
                );
                return hasWeaponSkill;

            case 'charm-or-mesmerism-and-wis':
                // For Rhetoric - requires (Charm OR Mesmerism) AND Wis at required level
                const charmLevel = CharacterCalculations.calculateSkillLevel('charm', character.fields);
                const mesmerismLevel = CharacterCalculations.calculateSkillLevel('mesmerism', character.fields);
                const wis = character.attributes[AttributeType.WIS];
                return (charmLevel >= requiredLevel || mesmerismLevel >= requiredLevel) && wis >= requiredLevel;

            default:
                // Simple skill prerequisite - check if character has the named skill/attribute
                const prereqLevel = CharacterCalculations.calculateSkillLevel(skill.prerequisite, character.fields);
                return prereqLevel >= requiredLevel;
        }
    }

    // Get skill type indicator emoji
    static getSkillTypeIndicator(skill: ISkill): string {
        return skill.isListed ? '🞐' : '🞸';
    }

    // Format skill display name with multipliers and prerequisites
    static formatSkillDisplayName(skill: ISkill): string {
        let displayName = skill.name;

        // Add specialization if present
        if (skill.specialization) {
            displayName += ` ${skill.specialization}`;
        }

        // Add multiplier and prerequisites in parentheses
        const details: string[] = [];
        if (skill.costMultiplier > 1) {
            details.push(`x${skill.costMultiplier}`);
        }
        if (skill.prerequisite) {
            details.push(skill.prerequisite);
        }

        if (details.length > 0) {
            displayName += ` (${details.join(', ')})`;
        }

        return displayName;
    }
}

export class FieldManager {
    // Handle mouse wheel events on field level inputs
    static setupFieldMouseWheelSupport(container: HTMLElement, onFieldUpdate: (fieldId: string, newLevel: number) => void): void {
        container.addEventListener('wheel', (event: WheelEvent) => {
            const target = event.target as HTMLElement;
            
            // Check if target is a field level input or within a field container
            const fieldLevelInput = target.closest('[data-field-id]') as HTMLElement;
            if (!fieldLevelInput) return;
            
            const fieldId = fieldLevelInput.dataset.fieldId;
            if (!fieldId) return;
            
            event.preventDefault();
            
            // Determine increment direction (-1 for down, +1 for up)
            const increment = event.deltaY < 0 ? 1 : -1;
            
            // Get current level
            const currentLevelElement = fieldLevelInput.querySelector('.field-level') as HTMLElement;
            if (!currentLevelElement) return;
            
            const currentLevel = parseInt(currentLevelElement.textContent || '0', 10);
            const newLevel = Math.max(0, currentLevel + increment);
            
            // Update display
            currentLevelElement.textContent = newLevel.toString();
            
            // Notify callback
            onFieldUpdate(fieldId, newLevel);
        });
    }

    // Process skill experience checkbox changes with auto-increment
    static handleSkillExperienceChange(
        fields: IField[], 
        fieldId: string, 
        skillId: string, 
        onFieldsUpdate: (fields: IField[]) => void
    ): void {
        // Toggle the experience checkbox
        let updatedFields = CharacterCalculations.toggleSkillExperience(fields, fieldId, skillId);
        
        // Check for auto-increment after the change
        updatedFields = CharacterCalculations.processFieldAutoIncrements(updatedFields);
        
        // Notify callback
        onFieldsUpdate(updatedFields);
    }

    // Handle field level manual changes
    static handleFieldLevelChange(
        fields: IField[], 
        fieldId: string, 
        newLevel: number, 
        onFieldsUpdate: (fields: IField[]) => void
    ): void {
        const updatedFields = fields.map(field => 
            field.id === fieldId 
                ? CharacterCalculations.incrementFieldLevel(field, newLevel - field.level)
                : field
        );
        
        onFieldsUpdate(updatedFields);
    }
}

export class CharacterFactory {
    // Create a new character with default values
    static createNewCharacter(name: string, description: string = ''): ICharacter {
        return {
            id: crypto.randomUUID(),
            name,
            description,
            version: CharacterVersioning.getCurrentVersion(),
            rank: 1, // Primary stat - totalXP computed from this via CharacterCalculations.calculateTotalXPForRank()
            // totalXP removed - now computed via CharacterCalculations.calculateTotalXPForRank()
            // currentXP removed - now computed via CharacterCalculations.calculateAvailableXP()
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

        // Recalculate derived stats (rank is now primary, not derived)
        updated.damageCapacity = CharacterCalculations.calculateDamageCapacity(updated.attributes.Con);
        updated.hollow.hollowInfluence = CharacterCalculations.calculateHollowInfluence(updated.hollow.burned);

        return updated;
    }

    // Update a specific attribute and recalculate
    static updateAttribute(character: ICharacter, attribute: AttributeType, value: number): ICharacter {
        const newAttributes = { ...character.attributes, [attribute]: value };
        return this.updateCharacter(character, { attributes: newAttributes });
    }

    // Add earned XP and handle ranking up
    static addEarnedExperience(character: ICharacter, earnedXP: number): ICharacter {
        // Calculate what the new rank should be based on earned XP
        // For now, we'll track earned XP in a separate field when implemented
        // This function is for future use when implementing XP rewards

        const currentTotalEarned = 0; // TODO: Track earned XP separately from starting XP
        const newTotalEarned = currentTotalEarned + earnedXP;
        const newRank = CharacterCalculations.calculateRankFromEarnedXP(newTotalEarned);

        let updates: Partial<ICharacter> = {
            rank: Math.max(character.rank, newRank) // Can only increase rank
        };

        // Check for rank up - gain dust
        const oldRank = character.rank;
        if (newRank > oldRank) {
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

    // Directly set character rank (for character creation/editing)
    static setRank(character: ICharacter, rank: number): ICharacter {
        return this.updateCharacter(character, { rank: Math.max(1, Math.min(15, rank)) });
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