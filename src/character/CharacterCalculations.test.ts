/**
 * Unit tests for CharacterCalculations
 * "Calculate everything twice, trust nothing once"
 *
 * CRC: crc-CharacterCalculations.md
 * Spec: characters.md, Hollow-summary.md
 * Test Design: design/test-CharacterCalculations.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterCalculations } from './CharacterUtils.js';
import { ICharacter, IAttributes, AttributeType, IField, ISkill } from './types.js';
import { CharacterFactory } from './CharacterUtils.js';

describe('CharacterCalculations', () => {
    let testCharacter: ICharacter;

    beforeEach(() => {
        testCharacter = CharacterFactory.createNewCharacter('Test Character');
        testCharacter.rank = 3;
        testCharacter.attributes = {
            [AttributeType.DEX]: 4,
            [AttributeType.STR]: 3,
            [AttributeType.CON]: 5,
            [AttributeType.CHA]: 2,
            [AttributeType.WIS]: 4,
            [AttributeType.GRI]: 3,
            [AttributeType.INT]: 6,
            [AttributeType.PER]: 3
        };
    });

    describe('Rank Calculations', () => {
        it('should calculate rank from total XP', () => {
            expect(CharacterCalculations.calculateRank(0)).toBe(1); // Rank 1
            expect(CharacterCalculations.calculateRank(10)).toBe(2); // Rank 2
            expect(CharacterCalculations.calculateRank(20)).toBe(3); // Rank 3
            expect(CharacterCalculations.calculateRank(50)).toBe(6); // Rank 6
        });

        it('should calculate rank from earned XP', () => {
            expect(CharacterCalculations.calculateRankFromEarnedXP(0)).toBe(1);
            expect(CharacterCalculations.calculateRankFromEarnedXP(10)).toBe(2);
            expect(CharacterCalculations.calculateRankFromEarnedXP(25)).toBe(3);
        });

        it('should calculate total XP for a given rank', () => {
            expect(CharacterCalculations.calculateTotalXPForRank(1)).toBe(10);
            expect(CharacterCalculations.calculateTotalXPForRank(2)).toBe(20);
            expect(CharacterCalculations.calculateTotalXPForRank(3)).toBe(30);
            expect(CharacterCalculations.calculateTotalXPForRank(10)).toBe(100);
        });

        it('should handle edge case ranks', () => {
            expect(CharacterCalculations.calculateRank(9)).toBe(1); // Just under rank 2
            expect(CharacterCalculations.calculateRank(19)).toBe(2); // Just under rank 3
            expect(CharacterCalculations.calculateRank(29)).toBe(3); // Just under rank 4
        });
    });

    describe('Damage Capacity Calculations', () => {
        it('should calculate damage capacity (10 + CON)', () => {
            expect(CharacterCalculations.calculateDamageCapacity(0)).toBe(10);
            expect(CharacterCalculations.calculateDamageCapacity(5)).toBe(15);
            expect(CharacterCalculations.calculateDamageCapacity(10)).toBe(20);
        });

        it('should handle negative constitution', () => {
            expect(CharacterCalculations.calculateDamageCapacity(-2)).toBe(8);
        });

        it('should handle maximum constitution', () => {
            expect(CharacterCalculations.calculateDamageCapacity(15)).toBe(25);
        });

        it('should handle extreme values', () => {
            expect(CharacterCalculations.calculateDamageCapacity(100)).toBe(110);
            expect(CharacterCalculations.calculateDamageCapacity(-10)).toBe(0);
        });
    });

    describe('Attribute Chip Calculations', () => {
        it('should calculate total attribute chips for rank', () => {
            expect(CharacterCalculations.calculateTotalAttributeChipsForRank(1)).toBe(16);
            expect(CharacterCalculations.calculateTotalAttributeChipsForRank(2)).toBe(17);
            expect(CharacterCalculations.calculateTotalAttributeChipsForRank(3)).toBe(18);
            expect(CharacterCalculations.calculateTotalAttributeChipsForRank(10)).toBe(25);
        });

        it('should get attribute cost multipliers', () => {
            expect(CharacterCalculations.getAttributeCost(AttributeType.DEX)).toBe(4);
            expect(CharacterCalculations.getAttributeCost(AttributeType.STR)).toBe(3);
            expect(CharacterCalculations.getAttributeCost(AttributeType.CON)).toBe(1);
            expect(CharacterCalculations.getAttributeCost(AttributeType.CHA)).toBe(4);
            expect(CharacterCalculations.getAttributeCost(AttributeType.WIS)).toBe(3);
            expect(CharacterCalculations.getAttributeCost(AttributeType.GRI)).toBe(1);
            expect(CharacterCalculations.getAttributeCost(AttributeType.INT)).toBe(4);
            expect(CharacterCalculations.getAttributeCost(AttributeType.PER)).toBe(4);
        });

        it('should calculate total attribute costs', () => {
            const attributes: IAttributes = {
                [AttributeType.DEX]: 4, // 4x4 = 16
                [AttributeType.STR]: 3, // 3x3 = 9
                [AttributeType.CON]: 5, // 5x1 = 5
                [AttributeType.CHA]: 2, // 2x4 = 8
                [AttributeType.WIS]: 4, // 4x3 = 12
                [AttributeType.GRI]: 3, // 3x1 = 3
                [AttributeType.INT]: 6, // 6x4 = 24
                [AttributeType.PER]: 3  // 3x4 = 12
            };
            // Total: 16+9+5+8+12+3+24+12 = 89
            expect(CharacterCalculations.calculateTotalAttributeCosts(attributes)).toBe(89);
        });

        it('should handle negative attribute values in cost calculation', () => {
            const attributes: IAttributes = {
                [AttributeType.DEX]: -2, // -2x4 = -8
                [AttributeType.STR]: 3,  // 3x3 = 9
                [AttributeType.CON]: 2,  // 2x1 = 2
                [AttributeType.CHA]: 0,  // 0
                [AttributeType.WIS]: 0,  // 0
                [AttributeType.GRI]: 0,  // 0
                [AttributeType.INT]: 0,  // 0
                [AttributeType.PER]: 0   // 0
            };
            // Total: -8+9+2 = 3
            expect(CharacterCalculations.calculateTotalAttributeCosts(attributes)).toBe(3);
        });

        it('should calculate available attribute chips', () => {
            testCharacter.rank = 1;
            testCharacter.attributes = {
                [AttributeType.DEX]: 1, // 1x4 = 4
                [AttributeType.STR]: 1, // 1x3 = 3
                [AttributeType.CON]: 3, // 3x1 = 3
                [AttributeType.CHA]: 0, // 0x4 = 0
                [AttributeType.WIS]: 1, // 1x3 = 3
                [AttributeType.GRI]: 3, // 3x1 = 3
                [AttributeType.INT]: 0, // 0x4 = 0
                [AttributeType.PER]: 0  // 0x4 = 0
            };
            // Total cost: 4+3+3+0+3+3+0+0 = 16
            // Rank 1 total chips: 16
            // Available: 16 - 16 = 0
            expect(CharacterCalculations.calculateAvailableAttributeChips(testCharacter)).toBe(0);
        });

        it('should calculate attribute XP spent (overspent chips)', () => {
            testCharacter.rank = 1; // 16 chips
            testCharacter.attributes = {
                [AttributeType.DEX]: 4, // 4x4 = 16
                [AttributeType.STR]: 3, // 3x3 = 9
                [AttributeType.CON]: 5, // 5x1 = 5
                [AttributeType.CHA]: 2, // 2x4 = 8
                [AttributeType.WIS]: 4, // 4x3 = 12
                [AttributeType.GRI]: 3, // 3x1 = 3
                [AttributeType.INT]: 6, // 6x4 = 24
                [AttributeType.PER]: 3  // 3x4 = 12
            };
            // Total cost: 16+9+5+8+12+3+24+12 = 89, available chips: 16
            // Overspent: 89 - 16 = 73 XP
            expect(CharacterCalculations.calculateAttributeXPSpent(testCharacter)).toBe(73);
        });

        it('should return zero XP spent when within chip budget', () => {
            testCharacter.rank = 10; // 25 chips
            testCharacter.attributes = {
                [AttributeType.DEX]: 1,  // 1x4 = 4
                [AttributeType.STR]: 1,  // 1x3 = 3
                [AttributeType.CON]: 5,  // 5x1 = 5
                [AttributeType.CHA]: 0,  // 0x4 = 0
                [AttributeType.WIS]: 1,  // 1x3 = 3
                [AttributeType.GRI]: 10, // 10x1 = 10
                [AttributeType.INT]: 0,  // 0x4 = 0
                [AttributeType.PER]: 0   // 0x4 = 0
            };
            // Total cost: 4+3+5+0+3+10+0+0 = 25 (exactly 25 chips)
            expect(CharacterCalculations.calculateAttributeXPSpent(testCharacter)).toBe(0);
        });
    });

    describe('Hollow Calculations', () => {
        it('should calculate hollow influence (1 per 100 burned dust)', () => {
            expect(CharacterCalculations.calculateHollowInfluence(0)).toBe(0);
            expect(CharacterCalculations.calculateHollowInfluence(50)).toBe(0);
            expect(CharacterCalculations.calculateHollowInfluence(100)).toBe(1);
            expect(CharacterCalculations.calculateHollowInfluence(250)).toBe(2);
            expect(CharacterCalculations.calculateHollowInfluence(999)).toBe(9);
        });

        it('should calculate physical damage reduction (1 per 5 CON)', () => {
            expect(CharacterCalculations.calculatePhysicalDamageReduction(0)).toBe(0);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(4)).toBe(0);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(5)).toBe(1);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(10)).toBe(2);
            expect(CharacterCalculations.calculatePhysicalDamageReduction(15)).toBe(3);
        });

        it('should calculate social damage reduction (1 per 5 GRI)', () => {
            expect(CharacterCalculations.calculateSocialDamageReduction(0)).toBe(0);
            expect(CharacterCalculations.calculateSocialDamageReduction(4)).toBe(0);
            expect(CharacterCalculations.calculateSocialDamageReduction(5)).toBe(1);
            expect(CharacterCalculations.calculateSocialDamageReduction(10)).toBe(2);
            expect(CharacterCalculations.calculateSocialDamageReduction(15)).toBe(3);
        });

        it('should determine if New Moon visit is needed', () => {
            expect(CharacterCalculations.needsNewMoonVisit(1, 0, 0)).toBe(false);
            expect(CharacterCalculations.needsNewMoonVisit(1, 1, 0)).toBe(true); // Rank 1, influence 1
            expect(CharacterCalculations.needsNewMoonVisit(3, 2, -1)).toBe(true); // Rank 3, total influence 3 (2+1)
            expect(CharacterCalculations.needsNewMoonVisit(5, 2, -1)).toBe(false); // Rank 5 > total 3
        });

        it('should handle negative glimmer debt correctly', () => {
            // Glimmer debt is negative when owed
            expect(CharacterCalculations.needsNewMoonVisit(2, 0, -2)).toBe(true); // Rank 2, debt -2
            expect(CharacterCalculations.needsNewMoonVisit(3, 1, -1)).toBe(false); // Rank 3, total 2
        });
    });

    describe('XP and Spent Calculations', () => {
        it('should calculate spent XP (attributes only, no fields)', () => {
            testCharacter.rank = 1; // 16 chips, 10 XP total
            testCharacter.attributes = {
                [AttributeType.DEX]: 4, [AttributeType.STR]: 3, [AttributeType.CON]: 5,
                [AttributeType.CHA]: 2, [AttributeType.WIS]: 4, [AttributeType.GRI]: 3,
                [AttributeType.INT]: 6, [AttributeType.PER]: 3
            }; // Total cost: 16+9+5+8+12+3+24+12 = 89 chips
            testCharacter.fields = [];

            // Overspent chips: 89 - 16 = 73 XP
            expect(CharacterCalculations.calculateSpentXP(testCharacter)).toBe(73);
        });

        it('should calculate available XP', () => {
            testCharacter.rank = 3; // 30 XP total, 18 chips
            testCharacter.attributes = {
                [AttributeType.DEX]: 1,  // 1x4 = 4
                [AttributeType.STR]: 1,  // 1x3 = 3
                [AttributeType.CON]: 3,  // 3x1 = 3
                [AttributeType.CHA]: 0,  // 0x4 = 0
                [AttributeType.WIS]: 1,  // 1x3 = 3
                [AttributeType.GRI]: 5,  // 5x1 = 5
                [AttributeType.INT]: 0,  // 0x4 = 0
                [AttributeType.PER]: 0   // 0x4 = 0
            }; // Cost: 4+3+3+0+3+5+0+0 = 18 chips (exactly 18)
            testCharacter.fields = [];

            // Attribute XP spent: 18 - 18 = 0 XP
            // Total XP: 30
            // Available: 30 - 0 = 30 XP
            expect(CharacterCalculations.calculateAvailableXP(testCharacter)).toBe(30);
        });

        it('should handle negative available XP (overspent)', () => {
            testCharacter.rank = 1; // 10 XP total, 16 chips
            testCharacter.attributes = {
                [AttributeType.DEX]: 10, [AttributeType.STR]: 10, [AttributeType.CON]: 10,
                [AttributeType.CHA]: 10, [AttributeType.WIS]: 10, [AttributeType.GRI]: 10,
                [AttributeType.INT]: 10, [AttributeType.PER]: 10
            }; // Massive overspend
            testCharacter.fields = [];

            const availableXP = CharacterCalculations.calculateAvailableXP(testCharacter);
            expect(availableXP).toBeLessThan(0); // Should be negative
        });
    });

    describe('Field and Skill Calculations', () => {
        let testSkills: ISkill[];
        let testFields: IField[];

        beforeEach(() => {
            testSkills = [
                {
                    id: 'shooting',
                    name: 'Shooting',
                    costMultiplier: 1,
                    isListed: true
                },
                {
                    id: 'sneaking',
                    name: 'Sneaking',
                    costMultiplier: 1,
                    isListed: true
                },
                {
                    id: 'tracking',
                    name: 'Tracking',
                    costMultiplier: 2,
                    isListed: true
                }
            ];

            testFields = [
                {
                    id: 'field-1',
                    name: 'Field 1',
                    level: 2,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false },
                        { skillId: 'sneaking', hasExperience: true },
                        { skillId: 'tracking', hasExperience: false }
                    ]
                }
            ];
        });

        it('should calculate skill XP cost', () => {
            expect(CharacterCalculations.calculateSkillXPCost(1, 1)).toBe(1);
            expect(CharacterCalculations.calculateSkillXPCost(3, 1)).toBe(3);
            expect(CharacterCalculations.calculateSkillXPCost(2, 2)).toBe(4); // Doubled cost
        });

        it('should calculate field XP cost (new specification)', () => {
            const field = testFields[0];
            // Field level 2, skills: shooting (x1), sneaking (x1), tracking (x2)
            // Total entry cost: 1+1+2 = 4
            // Base cost: 2 * 4 = 8
            // Experience bonus: +1 (sneaking has experience)
            // Total: 8 + 1 = 9
            expect(CharacterCalculations.calculateFieldXPCostNew(field, testSkills)).toBe(9);
        });

        it('should calculate field XP cost without experience bonus', () => {
            const field: IField = {
                id: 'field-2',
                name: 'Field 2',
                level: 3,
                isFrozen: false,
                skillEntries: [
                    { skillId: 'shooting', hasExperience: false },
                    { skillId: 'sneaking', hasExperience: false },
                    { skillId: 'tracking', hasExperience: false }
                ]
            };
            // Level 3, total entry cost: 4, no experience
            // Cost: 3 * 4 = 12
            expect(CharacterCalculations.calculateFieldXPCostNew(field, testSkills)).toBe(12);
        });

        it('should calculate total fields XP spent', () => {
            const fields: IField[] = [
                {
                    id: 'field-1',
                    name: 'Field 1',
                    level: 2,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: true },
                        { skillId: 'sneaking', hasExperience: false },
                        { skillId: 'tracking', hasExperience: false }
                    ]
                }, // Cost: 2*4+1 = 9
                {
                    id: 'field-2',
                    name: 'Field 2',
                    level: 1,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false },
                        { skillId: 'sneaking', hasExperience: false }
                    ]
                } // Cost: 1*2 = 2
            ];
            // Total: 9 + 2 = 11
            expect(CharacterCalculations.calculateFieldsXPSpent(fields, testSkills)).toBe(11);
        });

        it('should calculate skill level from field occurrences', () => {
            const fields: IField[] = [
                {
                    id: 'field-1',
                    name: 'Field 1',
                    level: 2,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: true }
                    ]
                }, // shooting: 2 (field level) + 1 (experience) = 3
                {
                    id: 'field-2',
                    name: 'Field 2',
                    level: 3,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false }
                    ]
                } // shooting: 3 (field level)
            ];
            // Total shooting level: 3 + 3 = 6
            expect(CharacterCalculations.calculateSkillLevel('shooting', fields)).toBe(6);
        });

        it('should calculate skill level with no occurrences', () => {
            expect(CharacterCalculations.calculateSkillLevel('nonexistent', testFields)).toBe(0);
        });

        it('should determine if field should auto-increment', () => {
            const readyField: IField = {
                id: 'field-1',
                name: 'Field 1',
                level: 2,
                isFrozen: false,
                skillEntries: [
                    { skillId: 'shooting', hasExperience: true },
                    { skillId: 'sneaking', hasExperience: true },
                    { skillId: 'tracking', hasExperience: true }
                ]
            };
            expect(CharacterCalculations.shouldAutoIncrementField(readyField)).toBe(true);
        });

        it('should not auto-increment field with incomplete experience', () => {
            const incompleteField: IField = {
                id: 'field-1',
                name: 'Field 1',
                level: 2,
                isFrozen: false,
                skillEntries: [
                    { skillId: 'shooting', hasExperience: true },
                    { skillId: 'sneaking', hasExperience: false }, // Not complete
                    { skillId: 'tracking', hasExperience: true }
                ]
            };
            expect(CharacterCalculations.shouldAutoIncrementField(incompleteField)).toBe(false);
        });

        it('should auto-increment field level and clear checkboxes', () => {
            const readyField: IField = {
                id: 'field-1',
                name: 'Field 1',
                level: 2,
                isFrozen: false,
                skillEntries: [
                    { skillId: 'shooting', hasExperience: true },
                    { skillId: 'sneaking', hasExperience: true }
                ]
            };

            const incremented = CharacterCalculations.autoIncrementField(readyField);
            expect(incremented.level).toBe(3);
            expect(incremented.skillEntries[0].hasExperience).toBe(false);
            expect(incremented.skillEntries[1].hasExperience).toBe(false);
        });

        it('should toggle skill experience checkbox', () => {
            const fields = [testFields[0]];
            const toggled = CharacterCalculations.toggleSkillExperience(fields, 'field-1', 'shooting');

            expect(toggled[0].skillEntries[0].hasExperience).toBe(true); // Was false, now true
        });

        it('should increment field level', () => {
            const field = testFields[0]; // Level 2
            const incremented = CharacterCalculations.incrementFieldLevel(field, 2);
            expect(incremented.level).toBe(4);
        });

        it('should not allow negative field levels', () => {
            const field = testFields[0]; // Level 2
            const decremented = CharacterCalculations.incrementFieldLevel(field, -5);
            expect(decremented.level).toBe(0); // Clamped to 0
        });

        it('should add skill to non-frozen field', () => {
            const field = testFields[0];
            const updated = CharacterCalculations.addSkillToField(field, 'newskill');
            expect(updated.skillEntries).toHaveLength(4);
            expect(updated.skillEntries[3].skillId).toBe('newskill');
            expect(updated.skillEntries[3].hasExperience).toBe(false);
        });

        it('should not add skill to frozen field', () => {
            const field = { ...testFields[0], isFrozen: true };
            const updated = CharacterCalculations.addSkillToField(field, 'newskill');
            expect(updated.skillEntries).toHaveLength(3); // Unchanged
        });

        it('should remove skill from field', () => {
            const field = testFields[0];
            const updated = CharacterCalculations.removeSkillFromField(field, 'sneaking');
            expect(updated.skillEntries).toHaveLength(2);
            expect(updated.skillEntries.find(e => e.skillId === 'sneaking')).toBeUndefined();
        });

        it('should get all unique skills from fields', () => {
            const fields: IField[] = [
                {
                    id: 'field-1',
                    name: 'Field 1',
                    level: 1,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false },
                        { skillId: 'sneaking', hasExperience: false }
                    ]
                },
                {
                    id: 'field-2',
                    name: 'Field 2',
                    level: 1,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false }, // Duplicate
                        { skillId: 'tracking', hasExperience: false }
                    ]
                }
            ];

            const skillIds = CharacterCalculations.getAllSkillsFromFields(fields);
            expect(skillIds).toHaveLength(3);
            expect(skillIds).toContain('shooting');
            expect(skillIds).toContain('sneaking');
            expect(skillIds).toContain('tracking');
        });

        it('should get skill entries for a specific skill', () => {
            const fields: IField[] = [
                {
                    id: 'field-1',
                    name: 'Field 1',
                    level: 1,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: true }
                    ]
                },
                {
                    id: 'field-2',
                    name: 'Field 2',
                    level: 1,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false }
                    ]
                }
            ];

            const entries = CharacterCalculations.getSkillEntriesForSkill('shooting', fields);
            expect(entries).toHaveLength(2);
            expect(entries[0]).toEqual({ fieldId: 'field-1', hasExperience: true });
            expect(entries[1]).toEqual({ fieldId: 'field-2', hasExperience: false });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle zero rank gracefully', () => {
            // Rank should never be 0 in practice, but test boundary
            expect(CharacterCalculations.calculateTotalXPForRank(0)).toBe(0);
            expect(CharacterCalculations.calculateTotalAttributeChipsForRank(0)).toBe(15);
        });

        it('should handle extreme rank values', () => {
            expect(CharacterCalculations.calculateTotalXPForRank(100)).toBe(1000);
            expect(CharacterCalculations.calculateTotalAttributeChipsForRank(100)).toBe(115);
        });

        it('should handle empty fields array', () => {
            const testSkills: ISkill[] = [];
            expect(CharacterCalculations.calculateFieldsXPSpent([], testSkills)).toBe(0);
            expect(CharacterCalculations.getAllSkillsFromFields([])).toEqual([]);
        });

        it('should handle field with no skill entries', () => {
            const emptyField: IField = {
                id: 'empty',
                name: 'Empty Field',
                level: 5,
                isFrozen: false,
                skillEntries: []
            };
            const testSkills: ISkill[] = [];
            expect(CharacterCalculations.calculateFieldXPCostNew(emptyField, testSkills)).toBe(0);
            expect(CharacterCalculations.shouldAutoIncrementField(emptyField)).toBe(false);
        });

        it('should calculate attribute points used ignoring negative values', () => {
            const attributes: IAttributes = {
                [AttributeType.DEX]: -2, // Should be ignored in points used
                [AttributeType.STR]: 3,  // 3x3 = 9
                [AttributeType.CON]: 2,  // 2x1 = 2
                [AttributeType.CHA]: 0,
                [AttributeType.WIS]: 0,
                [AttributeType.GRI]: 0,
                [AttributeType.INT]: 0,
                [AttributeType.PER]: 0
            };
            // Only positive values count: 9 + 2 = 11
            expect(CharacterCalculations.calculateAttributePointsUsed(attributes)).toBe(11);
        });
    });

    describe('Integration: Full Character Stats', () => {
        it('should calculate all derived stats for complete character', () => {
            const character = CharacterFactory.createNewCharacter('Integration Test');
            character.rank = 3; // 30 XP total, 18 attribute chips
            character.attributes = {
                [AttributeType.DEX]: 4,
                [AttributeType.STR]: 3,
                [AttributeType.CON]: 5,
                [AttributeType.CHA]: 2,
                [AttributeType.WIS]: 4,
                [AttributeType.GRI]: 3,
                [AttributeType.INT]: 6,
                [AttributeType.PER]: 3
            };
            character.fields = [
                {
                    id: 'field-1',
                    name: 'Gunslinger',
                    level: 2,
                    isFrozen: false,
                    skillEntries: [
                        { skillId: 'shooting', hasExperience: false },
                        { skillId: 'sneaking', hasExperience: false },
                        { skillId: 'tracking', hasExperience: false }
                    ]
                }
            ];
            character.hollow.burned = 250;

            // Verify all calculations work together
            const totalXP = CharacterCalculations.calculateTotalXPForRank(character.rank);
            const spentXP = CharacterCalculations.calculateSpentXP(character);
            const availableXP = CharacterCalculations.calculateAvailableXP(character);
            const damageCapacity = CharacterCalculations.calculateDamageCapacity(character.attributes[AttributeType.CON]);
            const hollowInfluence = CharacterCalculations.calculateHollowInfluence(character.hollow.burned);
            const physicalReduction = CharacterCalculations.calculatePhysicalDamageReduction(character.attributes[AttributeType.CON]);
            const socialReduction = CharacterCalculations.calculateSocialDamageReduction(character.attributes[AttributeType.GRI]);

            expect(totalXP).toBe(30);
            expect(spentXP).toBeGreaterThan(0);
            expect(availableXP).toBe(totalXP - spentXP);
            expect(damageCapacity).toBe(15); // 10 + 5
            expect(hollowInfluence).toBe(2); // 250 / 100
            expect(physicalReduction).toBe(1); // 5 / 5
            expect(socialReduction).toBe(0); // 3 / 5
        });

        it('should handle character with no fields', () => {
            const character = CharacterFactory.createNewCharacter('No Fields');
            character.rank = 1;
            character.fields = [];

            expect(CharacterCalculations.calculateSpentXP(character)).toBeGreaterThanOrEqual(0);
            expect(CharacterCalculations.calculateAvailableXP(character)).toBeLessThanOrEqual(10);
        });
    });
});
