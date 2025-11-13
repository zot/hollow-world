/**
 * Unit tests for character hash utility - SHA-256 hashing for change detection
 *
 * CRC: (Utility function - no dedicated CRC card)
 * Spec: specs/storage.md (Hash-based save optimization)
 * Sequences: design/seq-save-character.md, design/seq-load-character.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCharacterHash, verifyCharacterIntegrity } from '../src/utils/characterHash.js';
import type { ICharacter } from '../src/character/types.js';

describe('calculateCharacterHash', () => {
    let testCharacter: ICharacter;

    beforeEach(() => {
        testCharacter = {
            id: 'char-123',
            version: 1,
            worldId: null,
            name: 'Doc Holiday',
            attributes: {
                strength: 5,
                agility: 7,
                vigor: 4,
                smarts: 8,
                spirit: 6
            },
            skills: {
                shooting: 10,
                gambling: 8
            },
            hindrances: ['Wanted', 'Habit: Alcohol'],
            edges: ['Quick Draw', 'Marksman'],
            gear: ['Revolver', 'Playing Cards'],
            wounds: 0
        } as ICharacter;
    });

    it('should produce consistent hash for same character', async () => {
        const hash1 = await calculateCharacterHash(testCharacter);
        const hash2 = await calculateCharacterHash(testCharacter);

        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[0-9a-f]{64}$/); // SHA-256 produces 64 hex chars
    });

    it('should produce same hash regardless of property order', async () => {
        const char1 = {
            id: 'char-123',
            name: 'Doc Holiday',
            attributes: { strength: 5, agility: 7 }
        } as ICharacter;

        const char2 = {
            name: 'Doc Holiday',
            attributes: { agility: 7, strength: 5 },
            id: 'char-123'
        } as ICharacter;

        const hash1 = await calculateCharacterHash(char1);
        const hash2 = await calculateCharacterHash(char2);

        expect(hash1).toBe(hash2);
    });

    it('should produce same hash for nested objects regardless of key order', async () => {
        const char1 = {
            id: 'char-123',
            attributes: {
                strength: 5,
                agility: 7,
                vigor: 4
            }
        } as ICharacter;

        const char2 = {
            id: 'char-123',
            attributes: {
                vigor: 4,
                agility: 7,
                strength: 5
            }
        } as ICharacter;

        const hash1 = await calculateCharacterHash(char1);
        const hash2 = await calculateCharacterHash(char2);

        expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different data', async () => {
        const hash1 = await calculateCharacterHash(testCharacter);

        const modifiedCharacter = { ...testCharacter, name: 'Wyatt Earp' };
        const hash2 = await calculateCharacterHash(modifiedCharacter);

        expect(hash1).not.toBe(hash2);
    });

    it('should detect tampering in nested properties', async () => {
        const hash1 = await calculateCharacterHash(testCharacter);

        const tamperedCharacter = {
            ...testCharacter,
            attributes: {
                ...testCharacter.attributes,
                strength: 10 // Modified from 5
            }
        };
        const hash2 = await calculateCharacterHash(tamperedCharacter);

        expect(hash1).not.toBe(hash2);
    });

    it('should handle deeply nested objects consistently', async () => {
        const deepChar = {
            id: 'char-123',
            data: {
                level1: {
                    level2: {
                        level3: {
                            value: 42,
                            name: 'deep'
                        }
                    }
                }
            }
        } as unknown as ICharacter;

        const deepCharReordered = {
            id: 'char-123',
            data: {
                level1: {
                    level2: {
                        level3: {
                            name: 'deep',
                            value: 42
                        }
                    }
                }
            }
        } as unknown as ICharacter;

        const hash1 = await calculateCharacterHash(deepChar);
        const hash2 = await calculateCharacterHash(deepCharReordered);

        expect(hash1).toBe(hash2);
    });

    it('should handle arrays consistently', async () => {
        const hash1 = await calculateCharacterHash(testCharacter);

        // Arrays maintain order, so same array = same hash
        const sameArrays = { ...testCharacter };
        const hash2 = await calculateCharacterHash(sameArrays);

        expect(hash1).toBe(hash2);

        // Different array order = different hash (arrays are ordered)
        const differentArrays = {
            ...testCharacter,
            hindrances: ['Habit: Alcohol', 'Wanted'] // Reversed order
        };
        const hash3 = await calculateCharacterHash(differentArrays);

        expect(hash1).not.toBe(hash3);
    });

    it('should handle null and undefined values', async () => {
        const charWithNull = {
            id: 'char-123',
            worldId: null,
            name: 'Test'
        } as ICharacter;

        const hash = await calculateCharacterHash(charWithNull);
        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
});

describe('verifyCharacterIntegrity', () => {
    let testCharacter: ICharacter;
    let expectedHash: string;

    beforeEach(async () => {
        testCharacter = {
            id: 'char-123',
            version: 1,
            worldId: null,
            name: 'Doc Holiday',
            attributes: {
                strength: 5,
                agility: 7,
                vigor: 4,
                smarts: 8,
                spirit: 6
            },
            skills: {
                shooting: 10,
                gambling: 8
            },
            hindrances: ['Wanted'],
            edges: ['Quick Draw'],
            gear: ['Revolver'],
            wounds: 0
        } as ICharacter;

        expectedHash = await calculateCharacterHash(testCharacter);
    });

    it('should return true for matching hash', async () => {
        const isValid = await verifyCharacterIntegrity(testCharacter, expectedHash);
        expect(isValid).toBe(true);
    });

    it('should return false for non-matching hash', async () => {
        const wrongHash = 'abc123def456'; // Fake hash
        const isValid = await verifyCharacterIntegrity(testCharacter, wrongHash);
        expect(isValid).toBe(false);
    });

    it('should detect tampering', async () => {
        const tamperedCharacter = {
            ...testCharacter,
            attributes: {
                ...testCharacter.attributes,
                strength: 10 // Tampered from 5
            }
        };

        const isValid = await verifyCharacterIntegrity(tamperedCharacter, expectedHash);
        expect(isValid).toBe(false);
    });

    it('should verify unchanged character after property reordering', async () => {
        // Reorder properties (hash should still match due to sortedReplacer)
        const reorderedCharacter = {
            worldId: testCharacter.worldId,
            name: testCharacter.name,
            id: testCharacter.id,
            version: testCharacter.version,
            wounds: testCharacter.wounds,
            gear: testCharacter.gear,
            edges: testCharacter.edges,
            hindrances: testCharacter.hindrances,
            skills: testCharacter.skills,
            attributes: testCharacter.attributes
        } as ICharacter;

        const isValid = await verifyCharacterIntegrity(reorderedCharacter, expectedHash);
        expect(isValid).toBe(true);
    });
});
