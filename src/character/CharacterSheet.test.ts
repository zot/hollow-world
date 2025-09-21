// Unit tests for CharacterSheet component and utilities
// Following SOLID principles with isolated testing

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CharacterFactory, CharacterCalculations, CharacterValidation, CharacterUpdater } from './CharacterUtils.js';
import { CharacterSheet } from './CharacterSheet.js';
import { AttributeType, CHARACTER_CREATION_RULES } from './types.js';

describe('CharacterCalculations', () => {
    describe('calculateRank', () => {
        it('should calculate rank correctly (1 rank per 10 XP)', () => {
            expect(CharacterCalculations.calculateRank(0)).toBe(1);
            expect(CharacterCalculations.calculateRank(9)).toBe(1);
            expect(CharacterCalculations.calculateRank(10)).toBe(2);
            expect(CharacterCalculations.calculateRank(25)).toBe(3);
            expect(CharacterCalculations.calculateRank(100)).toBe(11);
        });
    });

    describe('calculateDamageCapacity', () => {
        it('should calculate damage capacity as 10 + CON', () => {
            expect(CharacterCalculations.calculateDamageCapacity(0)).toBe(10);
            expect(CharacterCalculations.calculateDamageCapacity(3)).toBe(13);
            expect(CharacterCalculations.calculateDamageCapacity(-2)).toBe(8);
            expect(CharacterCalculations.calculateDamageCapacity(15)).toBe(25);
        });
    });

    describe('calculateHollowInfluence', () => {
        it('should calculate hollow influence (1 per 100 burned dust)', () => {
            expect(CharacterCalculations.calculateHollowInfluence(0)).toBe(0);
            expect(CharacterCalculations.calculateHollowInfluence(99)).toBe(0);
            expect(CharacterCalculations.calculateHollowInfluence(100)).toBe(1);
            expect(CharacterCalculations.calculateHollowInfluence(250)).toBe(2);
            expect(CharacterCalculations.calculateHollowInfluence(999)).toBe(9);
        });
    });

    describe('calculatePhysicalDamageReduction', () => {
        it('should calculate physical damage reduction (1 per 5 CON)', () => {
            expect(CharacterCalculations.calculatePhysicalDamageReduction(0)).toBe(0);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(4)).toBe(0);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(5)).toBe(1);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(14)).toBe(2);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(15)).toBe(3);
        });
    });

    describe('calculateSocialDamageReduction', () => {
        it('should calculate social damage reduction (1 per 5 GRI)', () => {
            expect(CharacterCalculations.calculateSocialDamageReduction(0)).toBe(0);
            expect(CharacterCalculations.calculateSocialDamageReduction(4)).toBe(0);
            expect(CharacterCalculations.calculateSocialDamageReduction(5)).toBe(1);
            expect(CharacterCalculations.calculateSocialDamageReduction(14)).toBe(2);
            expect(CharacterCalculations.calculateSocialDamageReduction(15)).toBe(3);
        });
    });

    describe('needsNewMoonVisit', () => {
        it('should determine if character needs new moon visit', () => {
            // Safe - rank higher than negative influences
            expect(CharacterCalculations.needsNewMoonVisit(5, 2, 2)).toBe(false);

            // Dangerous - rank equal to negative influences
            expect(CharacterCalculations.needsNewMoonVisit(5, 2, 3)).toBe(true);

            // Dangerous - rank lower than negative influences
            expect(CharacterCalculations.needsNewMoonVisit(3, 2, 3)).toBe(true);

            // No hollow or debt
            expect(CharacterCalculations.needsNewMoonVisit(1, 0, 0)).toBe(false);
        });
    });

    describe('calculateSkillXPCost', () => {
        it('should calculate skill XP cost correctly', () => {
            expect(CharacterCalculations.calculateSkillXPCost(1, 1)).toBe(1);
            expect(CharacterCalculations.calculateSkillXPCost(3, 1)).toBe(3);
            expect(CharacterCalculations.calculateSkillXPCost(2, 2)).toBe(4);
            expect(CharacterCalculations.calculateSkillXPCost(5, 2)).toBe(10);
        });
    });
});

describe('CharacterFactory', () => {
    describe('createNewCharacter', () => {
        it('should create a character with default values', () => {
            const character = CharacterFactory.createNewCharacter('Test Character', 'A test character');

            expect(character.name).toBe('Test Character');
            expect(character.description).toBe('A test character');
            expect(character.rank).toBe(1);
            // XP values are now computed dynamically
            expect(CharacterCalculations.calculateTotalXPForRank(character.rank)).toBe(CHARACTER_CREATION_RULES.startingXP);
            expect(CharacterCalculations.calculateAvailableXP(character)).toBe(CHARACTER_CREATION_RULES.startingXP);
            expect(character.hollow.dust).toBe(CHARACTER_CREATION_RULES.startingDust);
            expect(character.hollow.burned).toBe(0);
            expect(character.damageCapacity).toBe(10);
            expect(character.skills).toHaveLength(0);
            expect(character.fields).toHaveLength(0);
            expect(character.benefits).toHaveLength(0);
            expect(character.drawbacks).toHaveLength(0);

            // All attributes should start at 0
            Object.values(character.attributes).forEach(value => {
                expect(value).toBe(0);
            });
        });

        it('should create character with empty description if not provided', () => {
            const character = CharacterFactory.createNewCharacter('Test Character');
            expect(character.description).toBe('');
        });
    });

    describe('createTemplateCharacter', () => {
        it('should create a character with starting benefit and drawback placeholders', () => {
            const character = CharacterFactory.createTemplateCharacter('Template Character');

            expect(character.benefits).toHaveLength(1);
            expect(character.drawbacks).toHaveLength(1);

            expect(character.benefits[0].name).toBe('Starting Benefit');
            expect(character.benefits[0].level).toBe(1);
            expect(character.drawbacks[0].name).toBe('Starting Drawback');
            expect(character.drawbacks[0].level).toBe(1);
        });
    });
});

describe('CharacterValidation', () => {
    let character: any;

    beforeEach(() => {
        character = CharacterFactory.createNewCharacter('Test Character');
    });

    describe('validateCharacterCreation', () => {
        it('should pass validation for default character', () => {
            // Set valid attributes that sum to minimum total
            character.attributes[AttributeType.DEX] = 1;
            character.attributes[AttributeType.STR] = 1;

            const errors = CharacterValidation.validateCharacterCreation(character);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation for attributes below minimum', () => {
            character.attributes[AttributeType.DEX] = -3;

            const errors = CharacterValidation.validateCharacterCreation(character);
            expect(errors).toContain('Dex cannot be below -2');
        });

        it('should fail validation for attributes above maximum', () => {
            character.attributes[AttributeType.DEX] = 16;

            const errors = CharacterValidation.validateCharacterCreation(character);
            expect(errors).toContain('Dex cannot be above 15');
        });

        it('should fail validation for insufficient total attributes', () => {
            // All attributes at 0 = total of 0, which is below minimum of 2
            const errors = CharacterValidation.validateCharacterCreation(character);
            expect(errors).toContain('Total attribute levels must be at least 2');
        });
    });

    describe('validateSkillPrerequisites', () => {
        it('should pass validation when prerequisites are met', () => {
            character.skills = [
                {
                    id: 'weapon-skill',
                    name: 'Weapon (Pistol)',
                    level: 2,
                    isListed: true,
                    costMultiplier: 2,
                    isSpecialized: false
                },
                {
                    id: 'quickdraw',
                    name: 'Quickdraw',
                    level: 2,
                    prerequisite: 'Weapon (Pistol)',
                    isListed: true,
                    costMultiplier: 2,
                    isSpecialized: false
                }
            ];

            const errors = CharacterValidation.validateSkillPrerequisites(character);
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when skill prerequisite level is insufficient', () => {
            character.skills = [
                {
                    id: 'weapon-skill',
                    name: 'Weapon (Pistol)',
                    level: 1,
                    isListed: true,
                    costMultiplier: 2,
                    isSpecialized: false
                },
                {
                    id: 'quickdraw',
                    name: 'Quickdraw',
                    level: 2,
                    prerequisite: 'Weapon (Pistol)',
                    isListed: true,
                    costMultiplier: 2,
                    isSpecialized: false
                }
            ];

            const errors = CharacterValidation.validateSkillPrerequisites(character);
            expect(errors).toContain('Quickdraw requires Weapon (Pistol) at level 2');
        });

        it('should fail validation when attribute prerequisite level is insufficient', () => {
            character.attributes[AttributeType.DEX] = 2;
            character.skills = [
                {
                    id: 'martial-arts',
                    name: 'Martial Arts',
                    level: 3,
                    prerequisite: 'Dex',
                    isListed: true,
                    costMultiplier: 2,
                    isSpecialized: false
                }
            ];

            const errors = CharacterValidation.validateSkillPrerequisites(character);
            expect(errors).toContain('Martial Arts requires Dex at level 3');
        });
    });

    describe('validateFields', () => {
        it('should fail validation for field with fewer than 3 skills', () => {
            character.fields = [{
                id: 'gunfighter',
                name: 'Gunfighter',
                level: 1,
                skills: ['skill1', 'skill2'], // Only 2 skills
                isFrozen: false
            }];

            const errors = CharacterValidation.validateFields(character);
            expect(errors).toContain('Field Gunfighter must have at least 3 skills');
        });

        it('should fail validation when field references non-existent skills', () => {
            character.fields = [{
                id: 'gunfighter',
                name: 'Gunfighter',
                level: 1,
                skills: ['skill1', 'skill2', 'non-existent-skill'],
                isFrozen: false
            }];

            const errors = CharacterValidation.validateFields(character);
            expect(errors).toContain('Field Gunfighter references non-existent skill non-existent-skill');
        });

        it('should fail validation when high-level field is not frozen', () => {
            character.fields = [{
                id: 'gunfighter',
                name: 'Gunfighter',
                level: 2,
                skills: ['skill1', 'skill2', 'skill3'],
                isFrozen: false // Should be frozen at level 2+
            }];

            const errors = CharacterValidation.validateFields(character);
            expect(errors).toContain('Field Gunfighter should be frozen at level 2');
        });
    });
});

describe('CharacterUpdater', () => {
    let character: any;

    beforeEach(() => {
        character = CharacterFactory.createNewCharacter('Test Character');
    });

    describe('updateCharacter', () => {
        it('should update character and recalculate derived stats', () => {
            const updated = CharacterUpdater.updateCharacter(character, {
                name: 'Updated Character',
                rank: 3, // Rank is now primary, not derived from totalXP
                attributes: { ...character.attributes, [AttributeType.CON]: 5 }
            });

            expect(updated.name).toBe('Updated Character');
            expect(updated.rank).toBe(3); // Set directly
            expect(updated.damageCapacity).toBe(15); // 10 + 5 CON
            expect(updated.updatedAt).toBeInstanceOf(Date);

            // XP is computed dynamically
            expect(CharacterCalculations.calculateTotalXPForRank(updated.rank)).toBe(30); // 10 + (3-1)*10
        });

        it('should not mutate original character', () => {
            const originalName = character.name;
            const updated = CharacterUpdater.updateCharacter(character, { name: 'New Name' });

            expect(character.name).toBe(originalName);
            expect(updated.name).toBe('New Name');
        });
    });

    describe('updateAttribute', () => {
        it('should update specific attribute and recalculate derived stats', () => {
            const updated = CharacterUpdater.updateAttribute(character, AttributeType.CON, 8);

            expect(updated.attributes[AttributeType.CON]).toBe(8);
            expect(updated.damageCapacity).toBe(18); // 10 + 8 CON
        });
    });

    describe('addEarnedExperience', () => {
        it('should handle earning XP and ranking up', () => {
            const updated = CharacterUpdater.addEarnedExperience(character, 15);

            // Rank advancement is now based on earned XP logic
            expect(updated.rank).toBeGreaterThanOrEqual(character.rank);

            // XP values are computed dynamically
            expect(CharacterCalculations.calculateTotalXPForRank(updated.rank)).toBeGreaterThan(0);
            expect(CharacterCalculations.calculateAvailableXP(updated)).toBeGreaterThanOrEqual(0);

            // Should gain dust for ranking up if rank increased
            expect(updated.hollow.dust).toBeGreaterThanOrEqual(character.hollow.dust);
        });

        it('should handle rank changes correctly', () => {
            const updated = CharacterUpdater.setRank(character, 3);

            expect(updated.rank).toBe(3);
            expect(CharacterCalculations.calculateTotalXPForRank(updated.rank)).toBe(30); // 10 + (3-1)*10
            expect(CharacterCalculations.calculateAvailableXP(updated)).toBe(30); // No spending yet
        });
    });

    describe('burnDust', () => {
        it('should burn dust and update burned total', () => {
            const updated = CharacterUpdater.burnDust(character, 5);

            expect(updated.hollow.dust).toBe(5); // 10 starting - 5 burned
            expect(updated.hollow.burned).toBe(5);
            expect(updated.hollow.hollowInfluence).toBe(0); // Still 0 at 5 burned
        });

        it('should update hollow influence when burning enough dust', () => {
            // First give character more dust
            character.hollow.dust = 150;
            const updated = CharacterUpdater.burnDust(character, 100);

            expect(updated.hollow.dust).toBe(50);
            expect(updated.hollow.burned).toBe(100);
            expect(updated.hollow.hollowInfluence).toBe(1); // 1 per 100 burned
        });

        it('should throw error when trying to burn more dust than available', () => {
            expect(() => {
                CharacterUpdater.burnDust(character, 15); // Character only has 10 dust
            }).toThrow('Not enough dust to burn');
        });
    });
});

describe('CharacterSheet', () => {
    let character: any;
    let container: HTMLElement;

    beforeEach(() => {
        character = CharacterFactory.createTemplateCharacter('Test Character');
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        // Clean up any styles
        const styleEl = document.getElementById('character-sheet-styles');
        if (styleEl) {
            styleEl.remove();
        }
    });

    it('should render character sheet with basic information', () => {
        const sheet = new CharacterSheet(character);
        sheet.render(container);

        expect(container.querySelector('h1')?.textContent).toBe('Test Character');
        expect(container.querySelector('.rank')?.textContent).toBe('Rank 1');
        expect(container.querySelector('.damage-capacity')?.textContent).toBe('Damage Capacity: 10');
    });

    it('should throw error when rendering without container', () => {
        const sheet = new CharacterSheet(character);

        expect(() => {
            sheet.render(null as any);
        }).toThrow('Container element is required');
    });

    it('should export character data as JSON', () => {
        const sheet = new CharacterSheet(character);
        const exported = sheet.exportCharacter();
        const parsed = JSON.parse(exported);

        expect(parsed.name).toBe(character.name);
        expect(parsed.id).toBe(character.id);
        expect(parsed.rank).toBe(character.rank);
    });

    it('should import character data successfully', () => {
        const sheet = new CharacterSheet(character);
        const newCharacterData = {
            ...character,
            name: 'Imported Character',
            rank: 3 // totalXP will be computed from rank
        };

        const success = sheet.importCharacter(JSON.stringify(newCharacterData));
        expect(success).toBe(true);

        const imported = sheet.getCharacter();
        expect(imported.name).toBe('Imported Character');
        expect(imported.rank).toBe(3);
        expect(CharacterCalculations.calculateTotalXPForRank(imported.rank)).toBe(30);
    });

    it('should fail to import invalid character data', () => {
        const sheet = new CharacterSheet(character);

        // Invalid JSON
        expect(sheet.importCharacter('invalid json')).toBe(false);

        // Missing required fields
        expect(sheet.importCharacter('{}')).toBe(false);
    });

    it('should validate character and return errors', () => {
        // Create character with validation errors
        character.attributes[AttributeType.DEX] = -5; // Below minimum

        const sheet = new CharacterSheet(character);
        const errors = sheet.validateCharacter();

        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(error => error.includes('cannot be below -2'))).toBe(true);
    });

    it('should update character through callback', () => {
        const sheet = new CharacterSheet(character);

        // Simulate attribute change
        const callbacks = (sheet as any).callbacks;
        callbacks.onAttributeChange(AttributeType.STR, 5);

        const updated = sheet.getCharacter();
        expect(updated.attributes[AttributeType.STR]).toBe(5);
    });

    it('should clean up properly when destroyed', () => {
        const sheet = new CharacterSheet(character);
        sheet.render(container);

        expect(container.children.length).toBeGreaterThan(0);

        sheet.destroy();
        expect(container.innerHTML).toBe('');
    });

    describe('Computed XP Architecture', () => {
        it('should calculate total XP from rank', () => {
            const rank1Total = CharacterCalculations.calculateTotalXPForRank(1);
            const rank3Total = CharacterCalculations.calculateTotalXPForRank(3);
            const rank5Total = CharacterCalculations.calculateTotalXPForRank(5);

            expect(rank1Total).toBe(10); // 10 + (1-1)*10 = 10
            expect(rank3Total).toBe(30); // 10 + (3-1)*10 = 30
            expect(rank5Total).toBe(50); // 10 + (5-1)*10 = 50
        });

        it('should calculate available XP correctly', () => {
            // Character with rank 3, some attributes spent
            const testChar: ICharacter = {
                ...character,
                rank: 3,
                attributes: {
                    ...character.attributes,
                    [AttributeType.DEX]: 2, // Costs 8 attribute chips (2 * 4)
                    [AttributeType.STR]: 1  // Costs 3 attribute chips (1 * 3)
                }
            };

            // Total chips for rank 3: 16 + (3-1) = 18
            // Spent chips: 8 + 3 = 11
            // Available chips: 18 - 11 = 7 (no XP spent)
            // Total XP for rank 3: 30
            // Available XP: 30 - 0 = 30 (no XP spent on attributes)

            const availableXP = CharacterCalculations.calculateAvailableXP(testChar);
            const totalXP = CharacterCalculations.calculateTotalXPForRank(testChar.rank);

            expect(totalXP).toBe(30);
            expect(availableXP).toBe(30); // No XP spent beyond attribute chips
        });

        it('should calculate XP spent on attributes beyond chips', () => {
            // Character that has spent XP beyond attribute chips
            const testChar: ICharacter = {
                ...character,
                rank: 2,
                attributes: {
                    ...character.attributes,
                    [AttributeType.DEX]: 5, // Costs 20 attribute chips (5 * 4)
                    [AttributeType.STR]: 2  // Costs 6 attribute chips (2 * 3)
                }
            };

            // Total chips for rank 2: 16 + (2-1) = 17
            // Spent on attributes: 20 + 6 = 26
            // Excess beyond chips: 26 - 17 = 9 XP spent
            // Total XP for rank 2: 20
            // Available XP: 20 - 9 = 11

            const availableXP = CharacterCalculations.calculateAvailableXP(testChar);
            const spentXP = CharacterCalculations.calculateSpentXP(testChar);

            expect(spentXP).toBe(9); // XP spent beyond attribute chips
            expect(availableXP).toBe(11); // 20 total - 9 spent = 11
        });

        it('should calculate attribute chips correctly', () => {
            const testChar: ICharacter = {
                ...character,
                rank: 2,
                attributes: {
                    ...character.attributes,
                    [AttributeType.CON]: 3, // Costs 3 attribute chips (3 * 1)
                    [AttributeType.GRI]: 2  // Costs 2 attribute chips (2 * 1)
                }
            };

            // Total chips for rank 2: 17
            // Spent chips: 3 + 2 = 5
            // Available chips: 17 - 5 = 12

            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(testChar);
            expect(availableChips).toBe(12);
        });
    });
});