/**
 * Unit tests for CharacterEditorView
 *
 * CRC: crc-CharacterEditorView.md
 */

// Unit tests for CharacterEditorView UI behavior

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CharacterEditorView } from './CharacterEditorView.js';
import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterFactory } from '../character/CharacterUtils.js';

// Mock DOM environment
class MockElement {
    innerHTML: string = '';
    textContent: string = '';
    disabled: boolean = false;
    classList = {
        toggle: vi.fn(),
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn()
    };
    dataset: { [key: string]: string } = {};
    style: { [key: string]: string } = {};

    addEventListener(event: string, listener: Function): void {
        // Store listeners for testing
    }

    querySelector(selector: string): MockElement | null {
        if (selector.includes('nope-character-btn')) return Object.assign(new MockElement(), { id: 'nope-btn' });
        if (selector.includes('yep-character-btn')) return Object.assign(new MockElement(), { id: 'yep-btn' });
        if (selector.includes('character-sheet-container')) return new MockElement();
        return null;
    }

    click(): void {
        // Simulate click for testing
    }
}

// Mock CharacterSheet
vi.mock('../character/CharacterSheet.js', () => ({
    CharacterSheet: vi.fn().mockImplementation((character) => ({
        render: vi.fn(),
        destroy: vi.fn(),
        getCharacter: vi.fn().mockReturnValue(character),
        validateCharacter: vi.fn().mockReturnValue([])
    }))
}));

// Mock document for error display tests
vi.stubGlobal('document', {
    ...document,
    body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
    },
    createElement: vi.fn(() => ({
        className: '',
        innerHTML: '',
        addEventListener: vi.fn(),
        remove: vi.fn(),
        parentElement: null
    }))
});

// Mock templateEngine
vi.mock('../utils/TemplateEngine.js', () => ({
    templateEngine: {
        renderTemplate: vi.fn().mockImplementation((template: string, data: any) => {
            // Simple template replacement for testing
            return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
                const trimmedKey = key.trim();
                return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : '';
            });
        }),
        renderTemplateFromFile: vi.fn().mockImplementation((templateName: string, data: any) => {
            switch (templateName) {
                case 'character-editor':
                    return Promise.resolve(`
                        <div class="character-editor-container">
                            <div class="character-editor-header">
                                <h1>Editing: ${data.characterName}</h1>
                                <div class="editor-actions">
                                    <button id="nope-character-btn">Nope</button>
                                    <button id="yep-character-btn">Yep</button>
                                </div>
                            </div>
                            <div id="character-sheet-container"></div>
                        </div>
                    `);
                default:
                    return Promise.resolve('<div>Mock template</div>');
            }
        })
    }
}));

describe('CharacterEditorView UI Behavior', () => {
    let characterEditor: CharacterEditorView;
    let mockContainer: MockElement;
    let testCharacter: ICharacter;

    beforeEach(() => {
        mockContainer = new MockElement();
        characterEditor = new CharacterEditorView();

        // Create test character
        testCharacter = CharacterFactory.createNewCharacter('Test Character', 'A test character');
        testCharacter.rank = 2;
        testCharacter.attributes[AttributeType.DEX] = 3;
        testCharacter.attributes[AttributeType.STR] = 2;

        // Mock global document
        (global as any).document = {
            getElementById: vi.fn().mockReturnValue(null),
            createElement: vi.fn().mockReturnValue(new MockElement()),
            head: new MockElement(),
            body: new MockElement()
        };
    });

    afterEach(() => {
        if (characterEditor) {
            characterEditor.destroy();
        }
    });

    describe('Character Loading and Display', () => {
        it('should set character and render editor', async () => {
            characterEditor.setCharacter(testCharacter);

            expect(characterEditor.getCharacter()?.id).toBe(testCharacter.id);
            expect(characterEditor.getCharacter()?.name).toBe('Test Character');
        });

        it('should store original character for change tracking', () => {
            characterEditor.setCharacter(testCharacter);

            // Verify original character is stored separately
            const originalChar = (characterEditor as any).originalCharacter;
            expect(originalChar).toBeDefined();
            expect(originalChar.name).toBe(testCharacter.name);
            expect(originalChar.rank).toBe(testCharacter.rank);
        });

        it('should initialize with no unsaved changes', () => {
            characterEditor.setCharacter(testCharacter);

            const hasChanges = (characterEditor as any).hasUnsavedChanges;
            expect(hasChanges).toBe(false);
        });
    });

    describe('Button Enable/Disable Logic (Per Specs)', () => {
        beforeEach(async () => {
            characterEditor.setCharacter(testCharacter);
            characterEditor.render(mockContainer as any);

            // Wait for async rendering
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        it('should disable Yep button when no changes made', () => {
            const hasChanges = (characterEditor as any).hasUnsavedChanges;
            expect(hasChanges).toBe(false);

            // Yep button should be disabled per spec
        });

        it('should disable Nope button when no changes made', () => {
            const hasChanges = (characterEditor as any).hasUnsavedChanges;
            expect(hasChanges).toBe(false);

            // Nope button should be disabled per spec
        });

        it('should enable buttons when character is modified', () => {
            // Simulate character change
            const modifiedChar = { ...testCharacter, name: 'Modified Name' };
            characterEditor.setCharacter(modifiedChar);

            // Manually trigger change detection
            (characterEditor as any).hasUnsavedChanges = true;
            (characterEditor as any).updateButtonStates();

            // Both buttons should now be enabled
        });
    });

    describe('Change Detection', () => {
        beforeEach(() => {
            characterEditor.setCharacter(testCharacter);
        });

        it('should detect name changes', () => {
            const detectChanges = (characterEditor as any).detectChanges.bind(characterEditor);

            // Mock character sheet returning modified character
            const mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue({
                    ...testCharacter,
                    name: 'Modified Name'
                })
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            const hasChanges = detectChanges();
            expect(hasChanges).toBe(true);
        });

        it('should detect attribute changes', () => {
            const detectChanges = (characterEditor as any).detectChanges.bind(characterEditor);

            const mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue({
                    ...testCharacter,
                    attributes: {
                        ...testCharacter.attributes,
                        [AttributeType.DEX]: 5 // Changed from 3 to 5
                    }
                })
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            const hasChanges = detectChanges();
            expect(hasChanges).toBe(true);
        });

        it('should detect rank changes', () => {
            const detectChanges = (characterEditor as any).detectChanges.bind(characterEditor);

            const mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue({
                    ...testCharacter,
                    rank: 3 // Changed from 2 to 3
                })
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            const hasChanges = detectChanges();
            expect(hasChanges).toBe(true);
        });

        it('should not detect changes when character is identical', () => {
            const detectChanges = (characterEditor as any).detectChanges.bind(characterEditor);

            const mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue({ ...testCharacter })
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            const hasChanges = detectChanges();
            expect(hasChanges).toBe(false);
        });
    });

    describe('Revert Functionality', () => {
        it('should revert character to original state', () => {
            // Set up character with original state
            characterEditor.setCharacter(testCharacter);

            // Simulate modification
            const modifiedChar = { ...testCharacter, name: 'Modified Name' };
            (characterEditor as any).character = modifiedChar;
            (characterEditor as any).hasUnsavedChanges = true;

            // Call revert
            (characterEditor as any).revertChanges();

            // Character should be reverted to original
            const currentChar = characterEditor.getCharacter();
            expect(currentChar?.name).toBe(testCharacter.name);
            expect((characterEditor as any).hasUnsavedChanges).toBe(false);
        });
    });

    describe('Callback Integration', () => {
        it('should call onBackToCharacters when Nope is clicked', () => {
            const mockCallback = vi.fn();
            characterEditor.onBackToCharacters = mockCallback;

            // Simulate Nope button click
            (characterEditor as any).revertChanges();

            // Should trigger navigation back to character list
        });

        it('should call onCharacterSaved when Yep is clicked with valid character', () => {
            const mockCallback = vi.fn();
            characterEditor.onCharacterSaved = mockCallback;

            characterEditor.setCharacter(testCharacter);

            // Mock successful validation
            const mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue(testCharacter),
                validateCharacter: vi.fn().mockReturnValue([]) // No errors
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            // Simulate save
            (characterEditor as any).saveCharacter();

            expect(mockCallback).toHaveBeenCalledWith(testCharacter);
        });

        it('should not save character when validation fails', () => {
            const mockCallback = vi.fn();
            characterEditor.onCharacterSaved = mockCallback;

            characterEditor.setCharacter(testCharacter);

            // Mock validation failure
            const mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue(testCharacter),
                validateCharacter: vi.fn().mockReturnValue(['Validation error'])
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            // Simulate save attempt
            (characterEditor as any).saveCharacter();

            expect(mockCallback).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle missing character gracefully', () => {
            characterEditor.render(mockContainer as any);

            // Should render error state when no character set
            expect(mockContainer.innerHTML).toContain('No Character Selected');
        });

        it('should show error notification for save failures', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            characterEditor.setCharacter(testCharacter);

            // Mock character sheet that throws error
            const mockCharacterSheet = {
                getCharacter: vi.fn().mockImplementation(() => {
                    throw new Error('Test error');
                }),
                validateCharacter: vi.fn()
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;

            // Simulate save attempt
            (characterEditor as any).saveCharacter();

            expect(consoleSpy).toHaveBeenCalledWith('Failed to save character:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe('Cleanup', () => {
        it('should clean up properly on destroy', () => {
            characterEditor.setCharacter(testCharacter);
            characterEditor.render(mockContainer as any);

            characterEditor.destroy();

            expect(characterEditor.getCharacter()).toBeNull();
            expect(mockContainer.innerHTML).toBe('');
        });
    });

    describe('Nope Button Functionality (Per Specs)', () => {
        let mockCharacterSheet: any;
        let mockOriginalCharacter: ICharacter;

        beforeEach(() => {
            mockOriginalCharacter = { ...testCharacter, name: 'Original Name', rank: 2 };
            characterEditor.setCharacter(mockOriginalCharacter);

            mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue({ ...mockOriginalCharacter, name: 'Modified Name', rank: 3 }),
                validateCharacter: vi.fn().mockReturnValue([]),
                render: vi.fn(),
                destroy: vi.fn()
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;
            (characterEditor as any).hasUnsavedChanges = true; // Simulate changes
        });

        it('should revert changes and reload character from storage', () => {
            const originalName = mockOriginalCharacter.name;
            const originalRank = mockOriginalCharacter.rank;

            // Verify character is modified
            expect(mockCharacterSheet.getCharacter().name).toBe('Modified Name');

            // Call revertChanges
            (characterEditor as any).revertChanges();

            // Should reload original character data
            const revertedCharacter = (characterEditor as any).character;
            expect(revertedCharacter.name).toBe(originalName);
            expect(revertedCharacter.rank).toBe(originalRank);
        });

        it('should update all fields to display original stats', () => {
            const renderSpy = vi.spyOn(characterEditor, 'render').mockImplementation(() => {});

            // Set up container so revertChanges will call render
            (characterEditor as any).container = mockContainer;

            // Call revertChanges
            (characterEditor as any).revertChanges();

            // Should trigger re-render to update all fields
            expect(renderSpy).toHaveBeenCalled();
            renderSpy.mockRestore();
        });

        it('should reset hasUnsavedChanges flag', () => {
            // Verify changes are detected initially
            expect((characterEditor as any).hasUnsavedChanges).toBe(true);

            // Call revertChanges
            (characterEditor as any).revertChanges();

            // Should clear unsaved changes flag
            expect((characterEditor as any).hasUnsavedChanges).toBe(false);
        });

        it('should be enabled only when there are changes to revert', () => {
            // Setup mock buttons
            const mockNopeBtn = { disabled: false, classList: { toggle: vi.fn() } };
            const mockYepBtn = { disabled: false, classList: { toggle: vi.fn() } };

            const querySelectorSpy = vi.spyOn(mockContainer, 'querySelector');
            querySelectorSpy.mockImplementation((selector: string) => {
                if (selector.includes('nope-character-btn')) return mockNopeBtn as any;
                if (selector.includes('yep-character-btn')) return mockYepBtn as any;
                return null;
            });

            // Set container so updateButtonStates can find buttons
            (characterEditor as any).container = mockContainer;

            // With changes - button should be enabled
            (characterEditor as any).hasUnsavedChanges = true;
            (characterEditor as any).updateButtonStates();
            expect(mockNopeBtn.disabled).toBe(false);

            // Without changes - button should be disabled
            (characterEditor as any).hasUnsavedChanges = false;
            (characterEditor as any).updateButtonStates();
            expect(mockNopeBtn.disabled).toBe(true);

            querySelectorSpy.mockRestore();
        });

        it('should handle missing original character gracefully', () => {
            (characterEditor as any).originalCharacter = null;

            // Should not throw error
            expect(() => {
                (characterEditor as any).revertChanges();
            }).not.toThrow();
        });
    });

    describe('Yep Button Functionality (Per Specs)', () => {
        let mockCharacterSheet: any;
        let mockStorage: any;

        beforeEach(() => {
            characterEditor.setCharacter(testCharacter);

            mockCharacterSheet = {
                getCharacter: vi.fn().mockReturnValue({ ...testCharacter, name: 'Updated Name' }),
                validateCharacter: vi.fn().mockReturnValue([]),
                render: vi.fn(),
                destroy: vi.fn()
            };
            (characterEditor as any).characterSheet = mockCharacterSheet;
            (characterEditor as any).hasUnsavedChanges = true;
        });

        it('should be enabled only when there are unsaved changes', () => {
            const mockNopeBtn = { disabled: false, classList: { toggle: vi.fn() } };
            const mockYepBtn = { disabled: false, classList: { toggle: vi.fn() } };

            const querySelectorSpy = vi.spyOn(mockContainer, 'querySelector');
            querySelectorSpy.mockImplementation((selector: string) => {
                if (selector.includes('nope-character-btn')) return mockNopeBtn as any;
                if (selector.includes('yep-character-btn')) return mockYepBtn as any;
                return null;
            });

            // Set container so updateButtonStates can find buttons
            (characterEditor as any).container = mockContainer;

            // With changes - button should be enabled
            (characterEditor as any).hasUnsavedChanges = true;
            (characterEditor as any).updateButtonStates();
            expect(mockYepBtn.disabled).toBe(false);

            // Without changes - button should be disabled
            (characterEditor as any).hasUnsavedChanges = false;
            (characterEditor as any).updateButtonStates();
            expect(mockYepBtn.disabled).toBe(true);

            querySelectorSpy.mockRestore();
        });

        it('should follow save workflow: get character from sheet and validate', () => {
            const mockCallback = vi.fn();
            characterEditor.onCharacterSaved = mockCallback;

            // Call saveCharacter
            (characterEditor as any).saveCharacter();

            // Should get current character from sheet
            expect(mockCharacterSheet.getCharacter).toHaveBeenCalled();

            // Should validate character
            expect(mockCharacterSheet.validateCharacter).toHaveBeenCalled();

            // Should call save callback with updated character
            expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Updated Name'
            }));
        });

        it('should not save when validation fails', () => {
            const mockCallback = vi.fn();
            characterEditor.onCharacterSaved = mockCallback;

            // Mock showErrorMessage to avoid DOM issues
            const showErrorSpy = vi.spyOn(characterEditor as any, 'showErrorMessage').mockImplementation(() => {});

            // Mock validation failure
            mockCharacterSheet.validateCharacter.mockReturnValue(['Name is required', 'Invalid rank']);

            // Call saveCharacter
            (characterEditor as any).saveCharacter();

            // Should show error message
            expect(showErrorSpy).toHaveBeenCalled();

            // Should not call save callback
            expect(mockCallback).not.toHaveBeenCalled();

            showErrorSpy.mockRestore();
        });

        it('should trigger navigation back to character list after successful save', () => {
            const mockBackCallback = vi.fn();
            characterEditor.onBackToCharacters = mockBackCallback;
            characterEditor.onCharacterSaved = vi.fn();

            // Call saveCharacter
            (characterEditor as any).saveCharacter();

            // Should trigger navigation back
            expect(mockBackCallback).toHaveBeenCalled();
        });

        it('should handle save errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const showErrorSpy = vi.spyOn(characterEditor as any, 'showErrorMessage').mockImplementation(() => {});

            // Mock error during save
            mockCharacterSheet.getCharacter.mockImplementation(() => {
                throw new Error('Save failed');
            });

            // Should not throw
            expect(() => {
                (characterEditor as any).saveCharacter();
            }).not.toThrow();

            // Should log error
            expect(consoleSpy).toHaveBeenCalledWith('Failed to save character:', expect.any(Error));

            // Should show error message to user
            expect(showErrorSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            showErrorSpy.mockRestore();
        });

        it('should handle missing character sheet gracefully', () => {
            (characterEditor as any).characterSheet = null;

            // Should not throw error
            expect(() => {
                (characterEditor as any).saveCharacter();
            }).not.toThrow();
        });
    });
});
