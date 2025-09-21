// Unit tests for CharacterManagerView following SOLID principles

import { CharacterManagerView } from './CharacterManagerView.js';
import { ICharacter } from '../character/types.js';
import { CharacterCalculations } from '../character/CharacterUtils.js';

// Mock DOM environment for testing
class MockElement {
    innerHTML: string = '';
    textContent: string = '';
    private children: MockElement[] = [];
    private listeners: Map<string, Function[]> = new Map();
    dataset: { [key: string]: string } = {};

    addEventListener(event: string, listener: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }

    removeEventListener(event: string, listener: Function): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index >= 0) {
                eventListeners.splice(index, 1);
            }
        }
    }

    querySelector(selector: string): MockElement | null {
        if (selector.includes('new-character-btn')) return this;
        if (selector.includes('back-to-menu-btn')) return this;
        if (selector.includes('save-character-btn')) return this;
        if (selector.includes('back-to-list-btn')) return this;
        if (selector.includes('character-sheet-container')) return this;
        return null;
    }

    querySelectorAll(selector: string): MockElement[] {
        if (selector.includes('[data-action]')) {
            return [
                Object.assign(new MockElement(), { dataset: { action: 'edit', characterId: 'char-1' }}),
                Object.assign(new MockElement(), { dataset: { action: 'select', characterId: 'char-1' }}),
                Object.assign(new MockElement(), { dataset: { action: 'delete', characterId: 'char-1' }})
            ];
        }
        return [];
    }

    click(): void {
        const clickListeners = this.listeners.get('click') || [];
        clickListeners.forEach(listener => {
            listener({ target: this, preventDefault: () => {} });
        });
    }

    appendChild(child: MockElement): void {
        this.children.push(child);
    }

    removeChild(child: MockElement): void {
        const index = this.children.indexOf(child);
        if (index >= 0) {
            this.children.splice(index, 1);
        }
    }
}

class MockDocument {
    private styleSheets: MockElement[] = [];

    getElementById(id: string): MockElement | null {
        if (id === 'character-manager-styles') {
            return this.styleSheets.length > 0 ? this.styleSheets[0] : null;
        }
        return new MockElement();
    }

    createElement(tagName: string): MockElement {
        return new MockElement();
    }

    get head(): MockElement {
        return new MockElement();
    }
}

import { vi } from 'vitest';

// Mock the CharacterSheet import since it's complex
vi.mock('../character/CharacterSheet.js', () => ({
    CharacterSheet: vi.fn().mockImplementation(() => ({
        render: vi.fn(),
        destroy: vi.fn(),
        getCharacter: vi.fn().mockReturnValue({
            id: 'test-char',
            name: 'Test Character'
        }),
        validateCharacter: vi.fn().mockReturnValue([])
    }))
}));

// Mock the templateEngine
vi.mock('../utils/TemplateEngine.js', () => ({
    templateEngine: {
        renderTemplateFromFile: vi.fn().mockImplementation((templateName: string, data: any) => {
            switch (templateName) {
                case 'character-list':
                    return Promise.resolve('<div class="character-manager-container"><div class="character-cards"></div></div>');
                case 'character-card':
                    return Promise.resolve(`<div class="character-item" data-character-id="${data.id}"><h3>${data.name}</h3></div>`);
                case 'empty-state':
                    return Promise.resolve('<div class="empty-state">No characters created yet</div>');
                case 'character-editor':
                    return Promise.resolve(`<div class="character-editor"><h1>Editing: ${data.characterName}</h1><div id="character-sheet-container"></div></div>`);
                default:
                    return Promise.resolve('<div>Mock template</div>');
            }
        }),
        loadTemplate: vi.fn().mockResolvedValue('<div>Mock template</div>'),
        renderTemplate: vi.fn().mockReturnValue('<div>Mock template</div>')
    }
}));

// Test setup
describe('CharacterManagerView', () => {
    let characterManager: CharacterManagerView;
    let mockContainer: MockElement;
    let mockDocument: MockDocument;

    beforeEach(() => {
        mockDocument = new MockDocument();
        mockContainer = new MockElement();

        // Mock global document
        (global as any).document = mockDocument;
        (global as any).window = {
            confirm: vi.fn().mockReturnValue(true),
            alert: vi.fn()
        };

        characterManager = new CharacterManagerView();
    });

    afterEach(() => {
        if (characterManager) {
            characterManager.destroy();
        }
    });

    describe('Constructor and Initial State', () => {
        test('should initialize with default configuration', () => {
            expect(characterManager).toBeDefined();
            expect(characterManager.getCharacters()).toHaveLength(2); // Sample characters
        });

        test('should initialize with custom configuration', () => {
            const customConfig = { containerClass: 'custom-container' };
            const customManager = new CharacterManagerView(customConfig);

            expect(customManager).toBeDefined();
        });

        test('should load sample characters initially', () => {
            const characters = characterManager.getCharacters();

            expect(characters).toHaveLength(2);
            expect(characters[0].name).toBe('Jack \"Dead-Eye\" Malone');
            expect(characters[1].name).toBe('Sarah \"Doc\" Winchester');
        });
    });

    describe('Rendering', () => {
        test('should render character list view', async () => {
            characterManager.render(mockContainer);

            // Wait for async rendering to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockContainer.innerHTML).toContain('character-manager-container');
        });

        test('should throw error when container is null', () => {
            expect(() => {
                characterManager.render(null as any);
            }).toThrow('Container element is required');
        });

        test('should render empty state when no characters', async () => {
            // Create manager with no characters
            const emptyManager = new CharacterManagerView();
            emptyManager['characters'] = []; // Access private property for test

            emptyManager.render(mockContainer);

            // Wait for async rendering to complete
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockContainer.innerHTML).toContain('empty-state');
        });

        test('should compute XP values dynamically', () => {
            const characters = characterManager.getCharacters();
            const character = characters[0];

            // Test computed XP functions
            const availableXP = CharacterCalculations.calculateAvailableXP(character);
            const totalXP = CharacterCalculations.calculateTotalXPForRank(character.rank);

            expect(typeof availableXP).toBe('number');
            expect(typeof totalXP).toBe('number');
            expect(totalXP).toBe(10 + (character.rank - 1) * 10);
        });

        test('should handle template loading failures gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Mock template failure
            const { templateEngine } = await import('../utils/TemplateEngine.js');
            templateEngine.renderTemplateFromFile.mockRejectedValueOnce(new Error('Template not found'));

            characterManager.render(mockContainer);

            // Wait for async rendering and fallback
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Template rendering failed'), expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Character Management', () => {
        beforeEach(() => {
            characterManager.render(mockContainer);
        });

        test('should create new character', () => {
            const initialCount = characterManager.getCharacters().length;

            characterManager.createNewCharacter();

            const characters = characterManager.getCharacters();
            expect(characters).toHaveLength(initialCount + 1);
            expect(characters[characters.length - 1].name).toBe('New Character');
        });

        test('should edit existing character', () => {
            const characters = characterManager.getCharacters();
            const characterId = characters[0].id;

            characterManager.editCharacter(characterId);

            // Should switch to edit view
            expect(mockContainer.innerHTML).toContain('Editing:');
        });

        test('should handle edit of non-existent character', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            characterManager.editCharacter('non-existent');

            expect(consoleSpy).toHaveBeenCalledWith('Character not found:', 'non-existent');
            consoleSpy.mockRestore();
        });

        test('should delete character with confirmation', () => {
            const initialCount = characterManager.getCharacters().length;
            const characterId = characterManager.getCharacters()[0].id;

            characterManager.deleteCharacter(characterId);

            expect(characterManager.getCharacters()).toHaveLength(initialCount - 1);
        });

        test('should not delete character when confirmation is denied', () => {
            (global as any).window.confirm = vi.fn().mockReturnValue(false);

            const initialCount = characterManager.getCharacters().length;
            const characterId = characterManager.getCharacters()[0].id;

            characterManager.deleteCharacter(characterId);

            expect(characterManager.getCharacters()).toHaveLength(initialCount);
        });
    });

    describe('Event Handling', () => {
        test('should call onBackToMenu when back button is clicked', () => {
            const mockCallback = vi.fn();
            characterManager.onBackToMenu = mockCallback;

            characterManager.render(mockContainer);

            const backButton = mockContainer.querySelector('#back-to-menu-btn');
            backButton?.click();

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should call onCharacterSelected when select button is clicked', () => {
            const mockCallback = vi.fn();
            characterManager.onCharacterSelected = mockCallback;

            characterManager.render(mockContainer);

            // Simulate clicking a select button
            const selectButtons = mockContainer.querySelectorAll('[data-action]');
            const selectButton = selectButtons.find(btn => btn.dataset.action === 'select');

            if (selectButton) {
                selectButton.click();
            }

            expect(mockCallback).toHaveBeenCalled();
        });

        test('should handle character action buttons', () => {
            characterManager.render(mockContainer);

            const actionButtons = mockContainer.querySelectorAll('[data-action]');
            expect(actionButtons.length).toBeGreaterThan(0);

            // Test edit action
            const editButton = actionButtons.find(btn => btn.dataset.action === 'edit');
            if (editButton) {
                editButton.click();
                expect(mockContainer.innerHTML).toContain('Editing:');
            }
        });

        test('should create new character when new character button is clicked', () => {
            characterManager.render(mockContainer);
            const initialCount = characterManager.getCharacters().length;

            const newButton = mockContainer.querySelector('#new-character-btn');
            newButton?.click();

            expect(characterManager.getCharacters()).toHaveLength(initialCount + 1);
        });
    });

    describe('Character Editor View', () => {
        test('should render character editor when editing', () => {
            const character = characterManager.getCharacters()[0];
            characterManager.editCharacter(character.id);

            expect(mockContainer.innerHTML).toContain('Editing:');
            expect(mockContainer.innerHTML).toContain(character.name);
            expect(mockContainer.innerHTML).toContain('character-sheet-container');
        });

        test('should return to list view when back to list is clicked', () => {
            const character = characterManager.getCharacters()[0];
            characterManager.editCharacter(character.id);

            const backButton = mockContainer.querySelector('#back-to-list-btn');
            backButton?.click();

            expect(mockContainer.innerHTML).toContain('Character Manager');
            expect(mockContainer.innerHTML).toContain('character-grid');
        });
    });

    describe('Cleanup', () => {
        test('should clean up properly on destroy', () => {
            characterManager.render(mockContainer);

            characterManager.destroy();

            expect(mockContainer.innerHTML).toBe('');
        });

        test('should clean up character sheet on destroy', () => {
            const character = characterManager.getCharacters()[0];
            characterManager.editCharacter(character.id);

            const destroySpy = vi.spyOn(characterManager['characterSheet']!, 'destroy');

            characterManager.destroy();

            expect(destroySpy).toHaveBeenCalled();
        });
    });

    describe('Style Application', () => {
        test('should apply styles only once', () => {
            characterManager.render(mockContainer);
            characterManager.render(mockContainer);

            // Should not create duplicate style sheets
            expect(mockDocument.head.appendChild).not.toHaveBeenCalledTimes(2);
        });
    });
});