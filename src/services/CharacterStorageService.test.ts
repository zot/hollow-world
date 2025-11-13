/**
 * Unit tests for CharacterStorageService following SOLID principles
 * "Test everything twice, trust nothing once"
 *
 * CRC: specs-crc/crc-CharacterStorageService.md
 * Spec: specs/characters.md, specs/storage.md
 * Sequences: specs-crc/seq-save-character.md, specs-crc/seq-load-character.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterStorageService, ICharacterStorageService } from './CharacterStorageService.js';
import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterFactory } from '../character/CharacterUtils.js';

describe('CharacterStorageService', () => {
    let storageService: CharacterStorageService;
    let mockLocalStorage: { [key: string]: string };
    const PROFILE_PREFIX = 'Default:'; // Default profile name from ProfileService
    const STORAGE_KEY = 'hollow-world-characters';
    const PROFILE_STORAGE_KEY = `${PROFILE_PREFIX}${STORAGE_KEY}`;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};

        // Mock sessionStorage for ProfileService
        const mockSessionStorage: { [key: string]: string } = {};
        Object.defineProperty(global, 'sessionStorage', {
            value: {
                getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
                setItem: vi.fn((key: string, value: string) => {
                    mockSessionStorage[key] = value;
                }),
                removeItem: vi.fn((key: string) => {
                    delete mockSessionStorage[key];
                }),
                clear: vi.fn(() => {
                    Object.keys(mockSessionStorage).forEach(k => delete mockSessionStorage[k]);
                }),
                get length() { return Object.keys(mockSessionStorage).length; }
            },
            writable: true
        });

        Object.defineProperty(global, 'localStorage', {
            value: {
                getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
                setItem: vi.fn((key: string, value: string) => {
                    mockLocalStorage[key] = value;
                }),
                removeItem: vi.fn((key: string) => {
                    delete mockLocalStorage[key];
                }),
                clear: vi.fn(() => {
                    Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]);
                }),
                get length() { return Object.keys(mockLocalStorage).length; }
            },
            writable: true
        });

        storageService = new CharacterStorageService();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Interface Compliance', () => {
        it('should implement ICharacterStorageService interface', () => {
            expect(storageService.getAllCharacters).toBeDefined();
            expect(storageService.getCharacter).toBeDefined();
            expect(storageService.saveCharacter).toBeDefined();
            expect(storageService.deleteCharacter).toBeDefined();
            expect(storageService.createNewCharacter).toBeDefined();
        });
    });

    describe('getAllCharacters()', () => {
        it('should return default characters when localStorage is empty', async () => {
            const characters = await storageService.getAllCharacters();

            expect(characters).toHaveLength(2);
            expect(characters[0].name).toBe('Jack "Dead-Eye" Malone');
            expect(characters[1].name).toBe('Sarah "Doc" Winchester');
        });

        it('should return stored characters when localStorage has valid data', async () => {
            const testCharacters = [
                CharacterFactory.createNewCharacter('Test Character')
            ];
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify(testCharacters);

            const characters = await storageService.getAllCharacters();

            expect(characters).toHaveLength(1);
            expect(characters[0].name).toBe('Test Character');
        });

        it('should return default characters when localStorage has invalid JSON', async () => {
            mockLocalStorage[PROFILE_STORAGE_KEY] = 'invalid json';

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const characters = await storageService.getAllCharacters();

            expect(characters).toHaveLength(2);
            expect(characters[0].name).toBe('Jack "Dead-Eye" Malone');
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load characters from storage:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        it('should return default characters when localStorage has non-array data', async () => {
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify({ notAnArray: true });

            const characters = await storageService.getAllCharacters();

            expect(characters).toHaveLength(2);
            expect(characters[0].name).toBe('Jack "Dead-Eye" Malone');
        });

        it('should validate and fix corrupted character data', async () => {
            const corruptedCharacter = {
                id: 'test-id',
                name: 'Test',
                // Missing required fields, invalid values
                rank: 'invalid',
                damageCapacity: -5,
                attributes: {
                    [AttributeType.DEX]: 100, // Should be clamped to 15
                    [AttributeType.STR]: -10  // Should be clamped to -2
                }
            };
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([corruptedCharacter]);

            const characters = await storageService.getAllCharacters();

            expect(characters[0].rank).toBe(1); // Fixed invalid rank
            expect(characters[0].damageCapacity).toBe(1); // Fixed negative damage capacity
            expect(characters[0].attributes[AttributeType.DEX]).toBe(15); // Clamped to max
            expect(characters[0].attributes[AttributeType.STR]).toBe(-2); // Clamped to min
        });
    });

    describe('getCharacter()', () => {
        it('should return character by ID when it exists', async () => {
            const testCharacter = CharacterFactory.createNewCharacter('Test Character');
            testCharacter.id = 'test-id';
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([testCharacter]);

            const character = await storageService.getCharacter('test-id');

            expect(character).not.toBeNull();
            expect(character?.name).toBe('Test Character');
            expect(character?.id).toBe('test-id');
        });

        it('should return null when character does not exist', async () => {
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([]);

            const character = await storageService.getCharacter('nonexistent-id');

            expect(character).toBeNull();
        });

        it('should handle errors gracefully and return null', async () => {
            // Mock getAllCharacters to throw error
            vi.spyOn(storageService, 'getAllCharacters').mockRejectedValue(new Error('Storage error'));
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const character = await storageService.getCharacter('test-id');

            expect(character).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith('Failed to get character:', expect.any(Error));

            consoleSpy.mockRestore();
        });
    });

    describe('saveCharacter()', () => {
        it('should save new character to localStorage', async () => {
            const newCharacter = CharacterFactory.createNewCharacter('New Character');
            newCharacter.id = 'new-id';

            await storageService.saveCharacter(newCharacter);

            const stored = JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]);
            expect(stored).toHaveLength(3); // 2 defaults + 1 new
            expect(stored[2].name).toBe('New Character');
            expect(stored[2].id).toBe('new-id');
            expect(stored[2].updatedAt).toBeDefined();
        });

        it('should update existing character in localStorage', async () => {
            const existingCharacter = CharacterFactory.createNewCharacter('Original Name');
            existingCharacter.id = 'existing-id';
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([existingCharacter]);

            const updatedCharacter = { ...existingCharacter, name: 'Updated Name' };
            await storageService.saveCharacter(updatedCharacter);

            const stored = JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]);
            expect(stored).toHaveLength(1);
            expect(stored[0].name).toBe('Updated Name');
            expect(stored[0].id).toBe('existing-id');
            expect(new Date(stored[0].updatedAt)).toBeInstanceOf(Date);
        });

        it('should handle QuotaExceededError gracefully', async () => {
            const character = CharacterFactory.createNewCharacter('Test');

            // Mock localStorage.setItem to throw QuotaExceededError
            const quotaError = new Error('Quota exceeded');
            quotaError.name = 'QuotaExceededError';
            vi.mocked(global.localStorage.setItem).mockImplementation(() => {
                throw quotaError;
            });

            await expect(storageService.saveCharacter(character))
                .rejects.toThrow('Storage quota exceeded. Please delete some characters to free up space.');
        });

        it('should handle other localStorage errors gracefully', async () => {
            const character = CharacterFactory.createNewCharacter('Test');

            // Mock localStorage.setItem to throw generic error
            vi.mocked(global.localStorage.setItem).mockImplementation(() => {
                throw new Error('Access denied');
            });

            await expect(storageService.saveCharacter(character))
                .rejects.toThrow('Failed to save character. Changes may not be preserved.');
        });

        it('should set updatedAt timestamp on save', async () => {
            const character = CharacterFactory.createNewCharacter('Test');
            const beforeSave = new Date();

            await storageService.saveCharacter(character);

            const stored = JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]);
            const savedCharacter = stored.find((c: ICharacter) => c.id === character.id);

            expect(savedCharacter.updatedAt).toBeDefined();
            expect(new Date(savedCharacter.updatedAt)).toBeInstanceOf(Date);
            expect(new Date(savedCharacter.updatedAt).getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
        });
    });

    describe('deleteCharacter()', () => {
        it('should delete existing character and return true', async () => {
            const character1 = CharacterFactory.createNewCharacter('Character 1');
            character1.id = 'id-1';
            const character2 = CharacterFactory.createNewCharacter('Character 2');
            character2.id = 'id-2';

            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([character1, character2]);

            const result = await storageService.deleteCharacter('id-1');

            expect(result).toBe(true);
            const stored = JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]);
            expect(stored).toHaveLength(1);
            expect(stored[0].id).toBe('id-2');
        });

        it('should return false when character does not exist', async () => {
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([]);

            const result = await storageService.deleteCharacter('nonexistent-id');

            expect(result).toBe(false);
        });

        it('should handle localStorage errors and throw meaningful error', async () => {
            // Set up a character to delete first
            const character = CharacterFactory.createNewCharacter('Test');
            character.id = 'test-id';
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([character]);

            // Mock localStorage.setItem to throw error when trying to save after delete
            vi.mocked(global.localStorage.setItem).mockImplementation(() => {
                throw new Error('Access denied');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            await expect(storageService.deleteCharacter('test-id'))
                .rejects.toThrow('Failed to delete character.');

            expect(consoleSpy).toHaveBeenCalledWith('Failed to delete character:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('createNewCharacter()', () => {
        it('should create new character with default name', () => {
            const character = storageService.createNewCharacter();

            expect(character.name).toBe('New Character');
            expect(character.description).toBe('A mysterious newcomer to the frontier');
            expect(character.rank).toBe(1);
            expect(character.id).toBeDefined();
        });

        it('should create new character with custom name', () => {
            const customName = 'Custom Character Name';
            const character = storageService.createNewCharacter(customName);

            expect(character.name).toBe(customName);
            expect(character.description).toBe('A mysterious newcomer to the frontier');
        });
    });

    describe('validateAndFixCharacter() - Data Integrity', () => {
        it('should fix character with missing ID', async () => {
            const characterWithoutId = { name: 'Test', rank: 1 };
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([characterWithoutId]);

            const characters = await storageService.getAllCharacters();

            expect(characters[0].id).toBeDefined();
            expect(typeof characters[0].id).toBe('string');
        });

        it('should clamp attributes to valid ranges (-2 to 15)', async () => {
            const invalidCharacter = {
                id: 'test',
                name: 'Test',
                attributes: {
                    [AttributeType.DEX]: 20,  // Too high
                    [AttributeType.STR]: -5,  // Too low
                    [AttributeType.CON]: 'invalid' // Invalid type
                }
            };
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([invalidCharacter]);

            const characters = await storageService.getAllCharacters();

            expect(characters[0].attributes[AttributeType.DEX]).toBe(15);
            expect(characters[0].attributes[AttributeType.STR]).toBe(-2);
            expect(characters[0].attributes[AttributeType.CON]).toBe(0); // Defaults to 0 when invalid
        });

        it('should fix hollow data with negative values', async () => {
            const invalidCharacter = {
                id: 'test',
                name: 'Test',
                hollow: {
                    dust: -5,
                    burned: 'invalid',
                    hollowInfluence: -10
                }
            };
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([invalidCharacter]);

            const characters = await storageService.getAllCharacters();

            expect(characters[0].hollow.dust).toBe(0);
            expect(characters[0].hollow.burned).toBe(0);
            expect(characters[0].hollow.hollowInfluence).toBe(0);
        });

        it('should ensure arrays are properly initialized', async () => {
            const invalidCharacter = {
                id: 'test',
                name: 'Test',
                skills: 'not an array',
                fields: null,
                benefits: undefined
            };
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([invalidCharacter]);

            const characters = await storageService.getAllCharacters();

            expect(Array.isArray(characters[0].skills)).toBe(true);
            expect(Array.isArray(characters[0].fields)).toBe(true);
            expect(Array.isArray(characters[0].benefits)).toBe(true);
        });

        it('should create new character when validation completely fails', async () => {
            // Corrupt data that will cause validation to throw
            const completelyCorrupt = null;
            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([completelyCorrupt]);

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const characters = await storageService.getAllCharacters();

            expect(characters[0].name).toBe('Corrupted Character');
            expect(consoleSpy).toHaveBeenCalledWith('Failed to validate character:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Default Characters', () => {
        it('should provide Jack "Dead-Eye" Malone with correct attributes', async () => {
            const characters = await storageService.getAllCharacters();
            const deadEye = characters.find(c => c.name === 'Jack "Dead-Eye" Malone');

            expect(deadEye).toBeDefined();
            expect(deadEye?.rank).toBe(3);
            expect(deadEye?.attributes[AttributeType.DEX]).toBe(4);
            expect(deadEye?.skills).toHaveLength(1);
            expect(deadEye?.skills[0].name).toBe('Firearms');
        });

        it('should provide Sarah "Doc" Winchester with correct attributes', async () => {
            const characters = await storageService.getAllCharacters();
            const doc = characters.find(c => c.name === 'Sarah "Doc" Winchester');

            expect(doc).toBeDefined();
            expect(doc?.rank).toBe(2);
            expect(doc?.attributes[AttributeType.INT]).toBe(5);
            expect(doc?.skills).toHaveLength(1);
            expect(doc?.skills[0].name).toBe('Medicine');
        });
    });

    describe('Error Recovery and Resilience', () => {
        it('should recover from localStorage access errors', async () => {
            // Mock localStorage.getItem to throw error
            vi.mocked(global.localStorage.getItem).mockImplementation(() => {
                throw new Error('Access denied');
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const characters = await storageService.getAllCharacters();

            // Should fall back to default characters
            expect(characters).toHaveLength(2);
            expect(characters[0].name).toBe('Jack "Dead-Eye" Malone');
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load characters from storage:', expect.any(Error));

            consoleSpy.mockRestore();
        });

        it('should handle corrupted JSON gracefully', async () => {
            mockLocalStorage[PROFILE_STORAGE_KEY] = '{"invalid": json}';

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const characters = await storageService.getAllCharacters();

            expect(characters).toHaveLength(2);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Singleton Pattern', () => {
        it('should export a singleton instance', async () => {
            const { characterStorageService } = await import('./CharacterStorageService.js');

            expect(characterStorageService).toBeInstanceOf(CharacterStorageService);
        });
    });

    describe('Hash-Based Save Optimization', () => {
        it('should calculate and store hash on first save', async () => {
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            // Character starts without a hash
            expect(character.characterHash).toBeUndefined();

            await storageService.saveCharacter(character);

            const stored = JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]);
            const savedCharacter = stored.find((c: ICharacter) => c.id === 'test-id');

            expect(savedCharacter.characterHash).toBeDefined();
            expect(typeof savedCharacter.characterHash).toBe('string');
            expect(savedCharacter.characterHash.length).toBe(64); // SHA-256 hex string length
        });

        it('should skip save when character hash is unchanged', async () => {
            // First save
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            await storageService.saveCharacter(character);

            // Get the saved character with its hash
            const characters = await storageService.getAllCharacters();
            const savedCharacter = characters.find(c => c.id === 'test-id');
            expect(savedCharacter).toBeDefined();
            expect(savedCharacter!.characterHash).toBeDefined();

            // Spy on localStorage.setItem to verify it's not called
            const setItemSpy = vi.spyOn(global.localStorage, 'setItem');
            setItemSpy.mockClear();

            // Try to save the same character again (no changes)
            await storageService.saveCharacter(savedCharacter!);

            // Storage should NOT be written to
            expect(setItemSpy).not.toHaveBeenCalled();
        });

        it('should save when character data changes', async () => {
            // First save
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            await storageService.saveCharacter(character);

            // Get the saved character
            const characters = await storageService.getAllCharacters();
            const savedCharacter = characters.find(c => c.id === 'test-id');
            const originalHash = savedCharacter!.characterHash;

            // Modify the character
            const modifiedCharacter = { ...savedCharacter!, name: 'Modified Name' };

            // Spy on localStorage.setItem to verify it IS called
            const setItemSpy = vi.spyOn(global.localStorage, 'setItem');
            setItemSpy.mockClear();

            // Save the modified character
            await storageService.saveCharacter(modifiedCharacter);

            // Storage SHOULD be written to
            expect(setItemSpy).toHaveBeenCalled();

            // Hash should have changed
            const updatedCharacters = await storageService.getAllCharacters();
            const updatedCharacter = updatedCharacters.find(c => c.id === 'test-id');
            expect(updatedCharacter!.characterHash).toBeDefined();
            expect(updatedCharacter!.characterHash).not.toBe(originalHash);
        });

        it('should initialize hash on load for existing characters without hash', async () => {
            // Simulate old character data without hash
            const oldCharacter = CharacterFactory.createNewCharacter('Old Character');
            oldCharacter.id = 'old-id';
            const { characterHash, ...characterWithoutHash } = oldCharacter;

            mockLocalStorage[PROFILE_STORAGE_KEY] = JSON.stringify([characterWithoutHash]);

            // Load characters
            const characters = await storageService.getAllCharacters();

            // Hash should be initialized
            expect(characters[0].characterHash).toBeDefined();
            expect(typeof characters[0].characterHash).toBe('string');
            expect(characters[0].characterHash!.length).toBe(64);
        });

        it('should preserve existing hash on load', async () => {
            // Create character with hash
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            await storageService.saveCharacter(character);

            // Get the saved character with hash
            const firstLoad = await storageService.getAllCharacters();
            const firstLoadCharacter = firstLoad.find(c => c.id === 'test-id');
            const originalHash = firstLoadCharacter!.characterHash;

            // Load again
            const secondLoad = await storageService.getAllCharacters();
            const secondLoadCharacter = secondLoad.find(c => c.id === 'test-id');

            // Hash should be preserved (not recalculated)
            expect(secondLoadCharacter!.characterHash).toBe(originalHash);
        });

        it('should update hash when character attributes change', async () => {
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            await storageService.saveCharacter(character);

            // Get saved character
            const characters = await storageService.getAllCharacters();
            const savedCharacter = characters.find(c => c.id === 'test-id');
            const originalHash = savedCharacter!.characterHash;

            // Modify an attribute
            const modifiedCharacter = {
                ...savedCharacter!,
                attributes: {
                    ...savedCharacter!.attributes,
                    [AttributeType.STR]: savedCharacter!.attributes[AttributeType.STR] + 1
                }
            };

            await storageService.saveCharacter(modifiedCharacter);

            // Verify hash changed
            const updatedCharacters = await storageService.getAllCharacters();
            const updatedCharacter = updatedCharacters.find(c => c.id === 'test-id');
            expect(updatedCharacter!.characterHash).not.toBe(originalHash);
            expect(updatedCharacter!.attributes[AttributeType.STR]).toBe(1); // Attribute was changed
        });

        it('should update hash when hollow data changes', async () => {
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            await storageService.saveCharacter(character);

            // Get saved character
            const characters = await storageService.getAllCharacters();
            const savedCharacter = characters.find(c => c.id === 'test-id');
            const originalHash = savedCharacter!.characterHash;
            const originalDust = savedCharacter!.hollow.dust;

            // Modify hollow data
            const modifiedCharacter = {
                ...savedCharacter!,
                hollow: {
                    ...savedCharacter!.hollow,
                    dust: savedCharacter!.hollow.dust + 5
                }
            };

            await storageService.saveCharacter(modifiedCharacter);

            // Verify hash changed
            const updatedCharacters = await storageService.getAllCharacters();
            const updatedCharacter = updatedCharacters.find(c => c.id === 'test-id');
            expect(updatedCharacter!.characterHash).not.toBe(originalHash);
            expect(updatedCharacter!.hollow.dust).toBe(originalDust + 5); // Hollow dust was increased by 5
        });

        it('should handle save optimization with multiple characters', async () => {
            // Create and save two characters
            const char1 = CharacterFactory.createNewCharacter('Character 1');
            char1.id = 'id-1';
            const char2 = CharacterFactory.createNewCharacter('Character 2');
            char2.id = 'id-2';

            await storageService.saveCharacter(char1);
            await storageService.saveCharacter(char2);

            // Load both
            const characters = await storageService.getAllCharacters();
            const saved1 = characters.find(c => c.id === 'id-1');
            const saved2 = characters.find(c => c.id === 'id-2');

            // Modify only char1
            const modified1 = { ...saved1!, name: 'Modified 1' };

            const setItemSpy = vi.spyOn(global.localStorage, 'setItem');
            setItemSpy.mockClear();

            // Save modified char1
            await storageService.saveCharacter(modified1);
            expect(setItemSpy).toHaveBeenCalled();
            setItemSpy.mockClear();

            // Try to save unchanged char2
            await storageService.saveCharacter(saved2!);
            expect(setItemSpy).not.toHaveBeenCalled(); // Should skip save
        });

        it('should update timestamp only when hash changes', async () => {
            const character = CharacterFactory.createNewCharacter('Test Character');
            character.id = 'test-id';
            await storageService.saveCharacter(character);

            // Get saved character with hash
            const characters = await storageService.getAllCharacters();
            const savedCharacter = characters.find(c => c.id === 'test-id');

            // Store the original data from storage
            const stored = JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]);
            const originalStored = JSON.stringify(stored);

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 10));

            // Spy on setItem
            const setItemSpy = vi.spyOn(global.localStorage, 'setItem');
            setItemSpy.mockClear();

            // Try to save unchanged character
            await storageService.saveCharacter(savedCharacter!);

            // Storage should NOT have been modified (save was skipped)
            expect(setItemSpy).not.toHaveBeenCalled();

            // Verify storage content hasn't changed
            const afterStored = JSON.stringify(JSON.parse(mockLocalStorage[PROFILE_STORAGE_KEY]));
            expect(afterStored).toBe(originalStored);
        });
    });
});