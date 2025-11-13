/**
 * CharacterEditorView - Individual Character Editing Interface
 *
 * CRC: specs-crc/crc-CharacterEditorView.md
 * Spec: specs/ui.characters.md, specs/ui.md
 * Sequences: specs-crc/seq-edit-character.md, specs-crc/seq-save-character-ui.md, specs-crc/seq-revert-character.md
 */

// Character Editor View - Separate component for editing individual characters
// Following SOLID principles with route-based navigation

import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterSheet } from '../character/CharacterSheet.js';
import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { CharacterCalculations } from '../character/CharacterUtils.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';

// Character editor template is now loaded from character-editor.html

/**
 * ICharacterEditor interface
 *
 * CRC: specs-crc/crc-CharacterEditorView.md
 */
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

/**
 * CharacterEditorView - Edit or create individual character
 *
 * Purpose: Provide form interface for editing character attributes, skills,
 * equipment, and all character data. Supports both creation and editing modes.
 *
 * Specifications:
 * - UI Structure: specs-ui/ui-character-editor-view.md
 * - UI Concept: specs-wysiwid/concepts-ui.md → CharacterEditorView
 * - Character Operations: specs-wysiwid/synchronizations-character.md
 * - Save Behavior: specs-ui/manifest.md → Save Behavior (never block saves)
 * - Change Detection: specs-ui/manifest.md → Hash-based with 250ms polling
 *
 * Template: public/templates/character-editor.html
 *
 * Key Features:
 * - Character sheet with all editable fields
 * - Hash-based change detection (originalCharacterHash)
 * - Save/Cancel buttons (enabled when changes detected)
 * - Validation warnings (don't block saves)
 * - Delete character (with confirmation)
 * - Freeze/unfreeze character
 */
export class CharacterEditorView implements ICharacterEditor, IEnhancedAudioControlSupport {
    private config: ICharacterEditorConfig;
    public container: HTMLElement | null = null;
    private character: ICharacter | null = null;
    private originalCharacterHash: string | null = null; // For change tracking via hash
    private characterSheet: CharacterSheet | null = null;
    private hasUnsavedChanges: boolean = false;
    public audioManager?: IAudioManager;
    public musicButtonElement: HTMLElement | null = null;

    public onBackToCharacters?: () => void;
    public onCharacterSaved?: (character: ICharacter) => void;

    constructor(config: Partial<ICharacterEditorConfig> = {}, audioManager?: IAudioManager) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
    }

    /**
     * setCharacter implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
    async setCharacter(character: ICharacter): Promise<void> {
        this.character = { ...character };

        // Calculate and store the hash of the original character for change detection
        const { calculateCharacterHash } = await import('../utils/characterHash.js');
        const charWithoutTimestamps = { ...character };
        delete (charWithoutTimestamps as any).id;
        delete (charWithoutTimestamps as any).createdAt;
        delete (charWithoutTimestamps as any).updatedAt;
        this.originalCharacterHash = await calculateCharacterHash(charWithoutTimestamps as ICharacter);

        this.hasUnsavedChanges = false;
        if (this.container) {
            await this.render(this.container);
        }
    }

    /**
     * getCharacter implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
    getCharacter(): ICharacter | null {
        return this.character ? { ...this.character } : null;
    }

    /**
     * render implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     * Sequence: specs-crc/seq-edit-character.md (lines 26-45)
     */
    async render(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        await this.renderEditor();
    }

    private async renderEditor(): Promise<void> {
        if (!this.container || !this.character) {
            await this.renderNoCharacterError();
            return;
        }

        try {
            const editorHtml = await templateEngine.renderTemplateFromFile('character-editor', {
                characterName: this.character.name,
                hasAudioManager: !!this.audioManager
            });
            this.container.innerHTML = editorHtml;

            // Inject enhanced audio control after the header
            if (this.audioManager) {
                const audioControlHtml = await AudioControlUtils.renderEnhancedAudioControl(this);
                const headerElement = this.container.querySelector('.character-manager-header');
                
                if (headerElement) {
                    headerElement.insertAdjacentHTML('afterend', audioControlHtml);
                }
            }

            const sheetContainer = this.container.querySelector('#character-sheet-container') as HTMLElement;
            if (sheetContainer) {
                this.characterSheet = new CharacterSheet(this.character, {
                    readOnly: this.config.readOnly,
                    showCreationMode: this.config.showCreationMode
                });

                await this.characterSheet.render(sheetContainer);
            }

            // Set up music button reference (for legacy compatibility)
            this.musicButtonElement = this.container.querySelector('#music-toggle-btn');

            this.setupEventListeners();
            AudioControlUtils.setupEnhancedAudioControls(this);
            AudioControlUtils.updateEnhancedAudioState(this);
            this.applyStyles();
        } catch (error) {
            console.error('Failed to render character editor:', error);
            await this.renderErrorFallback();
        }
    }

    private async renderNoCharacterError(): Promise<void> {
        if (!this.container) return;

        try {
            const errorHtml = await templateEngine.renderTemplateFromFile('character-editor-no-character-error', {
                containerClass: this.config.containerClass,
                headerClass: this.config.headerClass,
                actionsClass: this.config.actionsClass
            });
            this.container.innerHTML = errorHtml;
        } catch (error) {
            console.error('Failed to render no-character error template:', error);
            // Fallback to minimal HTML
            this.container.innerHTML = await templateEngine.renderTemplateFromFile('no-character-fallback', {});
        }

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
            this.container.innerHTML = await templateEngine.renderTemplateFromFile('editor-load-error', {});
        }
    }

    /**
     * setupEventListeners implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
    private setupEventListeners(): void {
        if (!this.container) return;

        const nopeBtn = this.container.querySelector('#nope-character-btn') as HTMLButtonElement;
        if (nopeBtn) {
            nopeBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                await this.revertChanges();
            });
        }

        const yepBtn = this.container.querySelector('#yep-character-btn') as HTMLButtonElement;
        if (yepBtn) {
            yepBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                this.saveCharacter();
            });
        }

        // Set up music button event listener using shared utility
        AudioControlUtils.setupMusicButtonEventListener(this);

        // Set up change tracking on the character sheet
        this.setupChangeTracking();
        this.updateButtonStates();
    }

    /**
     * setupChangeTracking implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
    private setupChangeTracking(): void {
        if (!this.characterSheet) return;

        // Monitor character sheet for changes
        const checkForChanges = async () => {
            this.hasUnsavedChanges = await this.detectChanges();
            this.updateButtonStates();
        };

        // Set up periodic change checking at 250ms (good threshold for human UI interaction)
        setInterval(checkForChanges, 250);
    }

    /**
     * detectChanges implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
    private async detectChanges(): Promise<boolean> {
        if (!this.character || !this.originalCharacterHash || !this.characterSheet) {
            return false;
        }

        const currentCharacter = this.characterSheet.getCharacter();

        // Use character hash for comprehensive change detection
        const { calculateCharacterHash } = await import('../utils/characterHash.js');

        // Exclude timestamps and id from hash comparison
        // (id doesn't change, timestamps change on save)
        const currentWithoutTimestamps = { ...currentCharacter };
        delete (currentWithoutTimestamps as any).id;
        delete (currentWithoutTimestamps as any).createdAt;
        delete (currentWithoutTimestamps as any).updatedAt;

        const currentHash = await calculateCharacterHash(currentWithoutTimestamps as ICharacter);

        return currentHash !== this.originalCharacterHash;
    }

    /**
     * updateButtonStates implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
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

    /**
     * revertChanges implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     * Sequence: specs-crc/seq-revert-character.md (lines 14-42)
     */
    private async revertChanges(): Promise<void> {
        if (!this.character) return;

        // Reload character from storage to revert changes
        const { characterStorageService } = await import('../services/CharacterStorageService.js');
        const originalCharacter = await characterStorageService.getCharacter(this.character.id);

        if (!originalCharacter) {
            console.error('Failed to reload original character for revert');
            return;
        }

        await this.setCharacter(originalCharacter);
        this.hasUnsavedChanges = false;

        // Re-render to show reverted data
        if (this.container) {
            await this.render(this.container);
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

    /**
     * saveCharacter implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     * Sequence: specs-crc/seq-save-character-ui.md (lines 14-67)
     */
    private async saveCharacter(): Promise<void> {
        if (!this.characterSheet || !this.character) return;

        try {
            const updatedCharacter = this.characterSheet.getCharacter();
            const errors = this.characterSheet.validateCharacter();

            // Always save the character, even if invalid
            // Invalid characters will be prevented from entering worlds, but we don't want users to lose work
            this.character = updatedCharacter;

            // Notify parent that character was saved
            if (this.onCharacterSaved) {
                this.onCharacterSaved(updatedCharacter);
            }

            // NEW - Phase 3: Update world character store if character is in a world
            if (updatedCharacter.worldId) {
                await this.updateWorldCharacter(updatedCharacter);
            }

            // Show validation warning if there are errors
            if (errors.length > 0) {
                this.showValidationWarning(errors);
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

    private async updateWorldCharacter(character: ICharacter): Promise<void> {
        if (!character.worldId) {
            return;
        }

        try {
            // Import world access utilities
            const { getStorage } = await import('../textcraft/model.js');
            const { updateCharacterInWorld } = await import('../textcraft/character-sync.js');

            const storage = await getStorage();
            const world = await storage.openWorld(character.worldId);

            if (!world) {
                console.error(`World ${character.worldId} not found`);
                return;
            }

            // Update character in world's characters store
            await world.doTransaction(async () => {
                await updateCharacterInWorld(world, character);
            });

            console.log(`Updated character ${character.id} in world ${character.worldId}`);
        } catch (error) {
            console.error('Failed to update character in world:', error);
            // Don't throw - character was still saved to LocalStorage
        }
    }

    private async showValidationWarning(errors: string[]): Promise<void> {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'validation-warning-notification';

        try {
            const warningMessage =
                'Character saved with validation issues.\n\n' +
                'Invalid characters cannot enter worlds.\n\n' +
                'Issues:\n' + errors.join('\n');

            const warningHtml = await templateEngine.renderTemplateFromFile('validation-warning', {
                message: warningMessage
            });
            warningDiv.innerHTML = warningHtml;
        } catch (error) {
            console.error('Failed to render validation warning template:', error);
            // Fallback to minimal HTML
            try {
                const fallbackHtml = await templateEngine.renderTemplateFromFile('warning-content', {
                    message: 'Character saved with validation issues. Invalid characters cannot enter worlds.'
                });
                warningDiv.innerHTML = fallbackHtml;
            } catch (fallbackError) {
                console.error('Even fallback template failed:', fallbackError);
                warningDiv.innerHTML = await templateEngine.renderTemplateFromFile('warning-content', {
                    message: 'Character saved with warnings'
                });
            }
        }

        document.body.appendChild(warningDiv);

        // Auto-remove after 7 seconds (longer than errors since user should read validation issues)
        setTimeout(() => {
            if (warningDiv.parentElement) {
                warningDiv.remove();
            }
        }, 7000);
    }

    private async showErrorMessage(message: string): Promise<void> {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        
        try {
            const errorHtml = await templateEngine.renderTemplateFromFile('error-notification', {
                message: message
            });
            errorDiv.innerHTML = errorHtml;
        } catch (error) {
            console.error('Failed to render error notification template:', error);
            // Fallback to minimal HTML using template
            try {
                const fallbackHtml = await templateEngine.renderTemplateFromFile('error-content', { message });
                errorDiv.innerHTML = fallbackHtml;
            } catch (fallbackError) {
                console.error('Even fallback template failed:', fallbackError);
                errorDiv.innerHTML = await templateEngine.renderTemplateFromFile('error-content', { message: 'Error occurred' });
            }
        }

        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * destroy implementation
     *
     * CRC: specs-crc/crc-CharacterEditorView.md
     */
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
        this.musicButtonElement = null;
    }

    /**
     * getContainer implementation - IView interface
     *
     * Spec: specs/view-management.md
     */
    getContainer(): HTMLElement | null {
        return this.container;
    }

    /**
     * show implementation - IView interface
     *
     * Spec: specs/view-management.md
     */
    show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * hide implementation - IView interface
     *
     * Spec: specs/view-management.md
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    private applyStyles(): void {
        // Styles now loaded via CSS import - no longer embedded in TypeScript
    }
}
