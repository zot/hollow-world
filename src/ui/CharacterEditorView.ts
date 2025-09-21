// Character Editor View - Separate component for editing individual characters
// Following SOLID principles with route-based navigation

import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterSheet } from '../character/CharacterSheet.js';
import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { CharacterCalculations } from '../character/CharacterUtils.js';
import '../styles/CharacterEditor.css';

export interface ICharacterEditor extends IUIComponent {
    setCharacter(character: ICharacter): void;
    getCharacter(): ICharacter | null;
    onBackToCharacters?: () => void;
    onCharacterSaved?: (character: ICharacter) => void;
}

export interface ICharacterEditorConfig {
    containerClass: string;
    headerClass: string;
    actionsClass: string;
    readOnly: boolean;
    showCreationMode: boolean;
}

const DEFAULT_CONFIG: ICharacterEditorConfig = {
    containerClass: 'character-editor-container',
    headerClass: 'character-editor-header',
    actionsClass: 'character-editor-actions',
    readOnly: false,
    showCreationMode: true
};

export class CharacterEditorView implements ICharacterEditor {
    private config: ICharacterEditorConfig;
    private container: HTMLElement | null = null;
    private character: ICharacter | null = null;
    private originalCharacter: ICharacter | null = null; // For change tracking
    private characterSheet: CharacterSheet | null = null;
    private hasUnsavedChanges: boolean = false;

    public onBackToCharacters?: () => void;
    public onCharacterSaved?: (character: ICharacter) => void;

    constructor(config: Partial<ICharacterEditorConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    setCharacter(character: ICharacter): void {
        this.character = { ...character };
        this.originalCharacter = { ...character }; // Store original for change tracking
        this.hasUnsavedChanges = false;
        if (this.container) {
            this.render(this.container);
        }
    }

    getCharacter(): ICharacter | null {
        return this.character ? { ...this.character } : null;
    }

    render(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.renderEditor();
    }

    private async renderEditor(): Promise<void> {
        if (!this.container || !this.character) {
            this.renderNoCharacterError();
            return;
        }

        try {
            const editorHtml = await templateEngine.renderTemplateFromFile('character-editor', {
                characterName: this.character.name
            });

            this.container.innerHTML = editorHtml;

            const sheetContainer = this.container.querySelector('#character-sheet-container') as HTMLElement;
            if (sheetContainer) {
                this.characterSheet = new CharacterSheet(this.character, {
                    readOnly: this.config.readOnly,
                    showCreationMode: this.config.showCreationMode
                });

                this.characterSheet.render(sheetContainer);
            }

            this.setupEventListeners();
            this.applyStyles();
        } catch (error) {
            console.error('Failed to render character editor:', error);
            this.renderErrorFallback();
        }
    }

    private renderNoCharacterError(): void {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="${this.config.containerClass}">
                <div class="${this.config.headerClass}">
                    <h1>No Character Selected</h1>
                    <p style="color: red;">No character available for editing.</p>
                </div>
                <div class="${this.config.actionsClass}">
                    <button id="back-to-characters-btn">Back to Characters</button>
                </div>
            </div>
        `;

        this.setupErrorEventListeners();
    }

    private async renderErrorFallback(): Promise<void> {
        if (!this.container) return;

        try {
            const fallbackHtml = await templateEngine.renderTemplateFromFile('character-editor-fallback', {
                characterName: this.character?.name || 'Unknown'
            });
            this.container.innerHTML = fallbackHtml;
            this.setupEventListeners();
        } catch (error) {
            console.error('Even fallback template failed:', error);
            this.container.innerHTML = '<div><h1>Character Editor</h1><p>Failed to load editor</p></div>';
        }
    }

    private setupEventListeners(): void {
        if (!this.container) return;

        const nopeBtn = this.container.querySelector('#nope-character-btn') as HTMLButtonElement;
        if (nopeBtn) {
            nopeBtn.addEventListener('click', () => {
                this.revertChanges();
            });
        }

        const yepBtn = this.container.querySelector('#yep-character-btn') as HTMLButtonElement;
        if (yepBtn) {
            yepBtn.addEventListener('click', () => {
                this.saveCharacter();
            });
        }

        // Set up change tracking on the character sheet
        this.setupChangeTracking();
        this.updateButtonStates();
    }

    private setupChangeTracking(): void {
        if (!this.characterSheet) return;

        // Monitor character sheet for changes
        const checkForChanges = () => {
            this.hasUnsavedChanges = this.detectChanges();
            this.updateButtonStates();
        };

        // Set up periodic change checking (simple approach)
        setInterval(checkForChanges, 500);
    }

    private detectChanges(): boolean {
        if (!this.character || !this.originalCharacter || !this.characterSheet) {
            return false;
        }

        const currentCharacter = this.characterSheet.getCharacter();

        // Compare key properties to detect changes
        return (
            currentCharacter.name !== this.originalCharacter.name ||
            currentCharacter.description !== this.originalCharacter.description ||
            currentCharacter.rank !== this.originalCharacter.rank ||
            JSON.stringify(currentCharacter.attributes) !== JSON.stringify(this.originalCharacter.attributes) ||
            currentCharacter.hollow.dust !== this.originalCharacter.hollow.dust
        );
    }

    private updateButtonStates(): void {
        if (!this.container) return;

        const nopeBtn = this.container.querySelector('#nope-character-btn') as HTMLButtonElement;
        const yepBtn = this.container.querySelector('#yep-character-btn') as HTMLButtonElement;

        if (nopeBtn) {
            // Enable "Nope" only if there are changes to revert
            nopeBtn.disabled = !this.hasUnsavedChanges;
            nopeBtn.classList.toggle('disabled', !this.hasUnsavedChanges);
        }

        if (yepBtn) {
            // Enable "Yep" only if there are changes that have not been saved
            yepBtn.disabled = !this.hasUnsavedChanges;
            yepBtn.classList.toggle('disabled', !this.hasUnsavedChanges);
        }
    }

    private revertChanges(): void {
        if (!this.originalCharacter) return;

        // Reload character from original data
        this.character = { ...this.originalCharacter };
        this.hasUnsavedChanges = false;

        // Re-render to show reverted data
        if (this.container) {
            this.render(this.container);
        }
    }

    private setupErrorEventListeners(): void {
        if (!this.container) return;

        const backBtn = this.container.querySelector('#back-to-characters-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.onBackToCharacters) {
                    this.onBackToCharacters();
                }
            });
        }
    }

    private saveCharacter(): void {
        if (!this.characterSheet || !this.character) return;

        try {
            const updatedCharacter = this.characterSheet.getCharacter();
            const errors = this.characterSheet.validateCharacter();

            if (errors.length > 0) {
                this.showErrorMessage('Character validation failed:\n\n' + errors.join('\n'));
                return;
            }

            this.character = updatedCharacter;

            // Notify parent that character was saved
            if (this.onCharacterSaved) {
                this.onCharacterSaved(updatedCharacter);
            }

            // Route-based navigation back to character list
            if (this.onBackToCharacters) {
                this.onBackToCharacters();
            }
        } catch (error) {
            console.error('Failed to save character:', error);
            this.showErrorMessage('Failed to save character changes. Please try again.');
        }
    }

    private showErrorMessage(message: string): void {
        // Create a temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    destroy(): void {
        if (this.characterSheet) {
            this.characterSheet.destroy();
            this.characterSheet = null;
        }

        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }

        this.character = null;
    }

    private applyStyles(): void {
        // Styles now loaded via CSS import - no longer embedded in TypeScript
    }
}
