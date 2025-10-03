// Character Storage Service - Handles character persistence
// Following Single Responsibility Principle

import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterCalculations, CharacterFactory } from '../character/CharacterUtils.js';
import { CharacterVersioning } from '../character/CharacterVersioning.js';

export interface ICharacterStorageService {
    getAllCharacters(): Promise<ICharacter[]>;
    getCharacter(id: string): Promise<ICharacter | null>;
    saveCharacter(character: ICharacter): Promise<void>;
    deleteCharacter(id: string): Promise<boolean>;
    createNewCharacter(name?: string): ICharacter;
}

export class CharacterStorageService implements ICharacterStorageService {
    private readonly STORAGE_KEY = 'hollow-world-characters';

    async getAllCharacters(): Promise<ICharacter[]> {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    return parsed.map(char => this.validateAndFixCharacter(char));
                }
            }
            return this.getDefaultCharacters();
        } catch (error) {
            console.error('Failed to load characters from storage:', error);
            return this.getDefaultCharacters();
        }
    }

    async getCharacter(id: string): Promise<ICharacter | null> {
        try {
            const characters = await this.getAllCharacters();
            return characters.find(c => c.id === id) || null;
        } catch (error) {
            console.error('Failed to get character:', error);
            return null;
        }
    }

    async saveCharacter(character: ICharacter): Promise<void> {
        try {
            const characters = await this.getAllCharacters();
            const existingIndex = characters.findIndex(c => c.id === character.id);

            const updatedCharacter = { ...character, updatedAt: new Date() };

            if (existingIndex >= 0) {
                characters[existingIndex] = updatedCharacter;
            } else {
                characters.push(updatedCharacter);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters));
        } catch (error) {
            console.error('Failed to save character:', error);
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some characters to free up space.');
            } else {
                throw new Error('Failed to save character. Changes may not be preserved.');
            }
        }
    }

    async deleteCharacter(id: string): Promise<boolean> {
        try {
            const characters = await this.getAllCharacters();
            const filteredCharacters = characters.filter(c => c.id !== id);

            if (filteredCharacters.length === characters.length) {
                return false; // Character not found
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCharacters));
            return true;
        } catch (error) {
            console.error('Failed to delete character:', error);
            throw new Error('Failed to delete character.');
        }
    }

    createNewCharacter(name: string = 'New Character'): ICharacter {
        return CharacterFactory.createNewCharacter(name, 'A mysterious newcomer to the frontier');
    }

    private validateAndFixCharacter(character: any): ICharacter {
        try {
            // First, upgrade character to latest version if needed
            const upgradedCharacter = CharacterVersioning.upgradeCharacterToLatest(character);

            // Then validate and fix any data issues
            const validatedCharacter: ICharacter = {
                id: upgradedCharacter.id || crypto.randomUUID(),
                name: upgradedCharacter.name || 'Unknown Character',
                description: upgradedCharacter.description || '',
                version: upgradedCharacter.version || CharacterVersioning.getCurrentVersion(),
                rank: Math.max(1, Math.min(15, Number(upgradedCharacter.rank) || 1)),
                damageCapacity: Math.max(1, Number(upgradedCharacter.damageCapacity) || 10),
                attributes: {
                    [AttributeType.DEX]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.DEX]) || 0)),
                    [AttributeType.STR]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.STR]) || 0)),
                    [AttributeType.CON]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.CON]) || 0)),
                    [AttributeType.CHA]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.CHA]) || 0)),
                    [AttributeType.WIS]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.WIS]) || 0)),
                    [AttributeType.GRI]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.GRI]) || 0)),
                    [AttributeType.INT]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.INT]) || 0)),
                    [AttributeType.PER]: Math.max(-2, Math.min(15, Number(upgradedCharacter.attributes?.[AttributeType.PER]) || 0)),
                },
                skills: Array.isArray(upgradedCharacter.skills) ? upgradedCharacter.skills : [],
                fields: Array.isArray(upgradedCharacter.fields) ? upgradedCharacter.fields : [],
                benefits: Array.isArray(upgradedCharacter.benefits) ? upgradedCharacter.benefits : [],
                drawbacks: Array.isArray(upgradedCharacter.drawbacks) ? upgradedCharacter.drawbacks : [],
                hollow: {
                    dust: Math.max(0, Number(upgradedCharacter.hollow?.dust) || 0),
                    burned: Math.max(0, Number(upgradedCharacter.hollow?.burned) || 0),
                    hollowInfluence: Math.max(0, Number(upgradedCharacter.hollow?.hollowInfluence) || 0),
                    glimmerDebt: Math.max(0, Number(upgradedCharacter.hollow?.glimmerDebt) || 0),
                    glimmerDebtTotal: Math.max(0, Number(upgradedCharacter.hollow?.glimmerDebtTotal) || 0),
                    newMoonMarks: Math.max(0, Number(upgradedCharacter.hollow?.newMoonMarks) || 0)
                },
                items: Array.isArray(upgradedCharacter.items) ? upgradedCharacter.items : [],
                companions: Array.isArray(upgradedCharacter.companions) ? upgradedCharacter.companions : [],
                attributeChipsSpent: upgradedCharacter.attributeChipsSpent || { positive: 0, negative: 0 },
                createdAt: upgradedCharacter.createdAt ? new Date(upgradedCharacter.createdAt) : new Date(),
                updatedAt: new Date()
            };
            return validatedCharacter;
        } catch (error) {
            console.error('Failed to validate character:', error);
            return this.createNewCharacter('Corrupted Character');
        }
    }

    private getDefaultCharacters(): ICharacter[] {
        return [
            {
                id: 'char-1',
                name: 'Jack "Dead-Eye" Malone',
                description: 'A weathered gunslinger with a mysterious past',
                version: CharacterVersioning.getCurrentVersion(),
                rank: 3,
                damageCapacity: 12,
                attributes: {
                    [AttributeType.DEX]: 4,
                    [AttributeType.STR]: 3,
                    [AttributeType.CON]: 3,
                    [AttributeType.CHA]: 2,
                    [AttributeType.WIS]: 2,
                    [AttributeType.GRI]: 1,
                    [AttributeType.INT]: 2,
                    [AttributeType.PER]: 5
                },
                skills: [
                    {
                        id: 'firearms',
                        name: 'Firearms',
                        isListed: true,
                        costMultiplier: 1,
                        prerequisite: undefined,
                        description: 'Skill with various firearms'
                    }
                ],
                fields: [
                    {
                        id: 'gunfighter',
                        name: 'Gunfighter',
                        level: 2,
                        skillEntries: [
                            { skillId: 'firearms', hasExperience: false }
                        ],
                        isFrozen: true
                    }
                ],
                benefits: [
                    {
                        id: 'quickdraw',
                        name: 'Quick Draw',
                        level: 2,
                        condition: 'Initiative rolls with firearms',
                        description: 'Lightning-fast draw when danger strikes'
                    }
                ],
                drawbacks: [
                    {
                        id: 'haunted',
                        name: 'Haunted Past',
                        level: 1,
                        condition: 'Social situations in civilized areas',
                        description: 'Reputation precedes him in most towns'
                    }
                ],
                hollow: {
                    dust: 2,
                    burned: 0,
                    hollowInfluence: 2,
                    glimmerDebt: 0,
                    glimmerDebtTotal: 0,
                    newMoonMarks: 0
                },
                items: [
                    {
                        id: 'revolver',
                        name: 'Colt Peacemaker',
                        type: 'fine_weapon',
                        description: 'Well-maintained six-shooter with ivory grips',
                        level: 1
                    }
                ],
                companions: [],
                attributeChipsSpent: { positive: 0, negative: 0 },
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            },
            {
                id: 'char-2',
                name: 'Sarah "Doc" Winchester',
                description: 'Traveling physician with a keen interest in the supernatural',
                version: CharacterVersioning.getCurrentVersion(),
                rank: 2,
                damageCapacity: 8,
                attributes: {
                    [AttributeType.DEX]: 2,
                    [AttributeType.STR]: 1,
                    [AttributeType.CON]: 1,
                    [AttributeType.CHA]: 3,
                    [AttributeType.WIS]: 3,
                    [AttributeType.GRI]: 3,
                    [AttributeType.INT]: 5,
                    [AttributeType.PER]: 4
                },
                skills: [
                    {
                        id: 'medicine',
                        name: 'Medicine',
                        isListed: true,
                        costMultiplier: 1,
                        prerequisite: undefined,
                        description: 'Medical knowledge and treatment'
                    }
                ],
                fields: [
                    {
                        id: 'physician',
                        name: 'Physician',
                        level: 2,
                        skillEntries: [
                            { skillId: 'medicine', hasExperience: false }
                        ],
                        isFrozen: true
                    }
                ],
                benefits: [
                    {
                        id: 'healer',
                        name: 'Natural Healer',
                        level: 1,
                        condition: 'Medical treatment rolls',
                        description: 'Instinctive understanding of anatomy and healing'
                    }
                ],
                drawbacks: [],
                hollow: {
                    dust: 1,
                    burned: 0,
                    hollowInfluence: 1,
                    glimmerDebt: 0,
                    glimmerDebtTotal: 0,
                    newMoonMarks: 0
                },
                items: [
                    {
                        id: 'medical-bag',
                        name: 'Medical Bag',
                        type: 'gadget',
                        description: 'Well-stocked physician\'s kit with surgical tools',
                        level: 2
                    }
                ],
                companions: [],
                attributeChipsSpent: { positive: 0, negative: 0 },
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            }
        ];
    }
}

// Singleton instance
export const characterStorageService = new CharacterStorageService();